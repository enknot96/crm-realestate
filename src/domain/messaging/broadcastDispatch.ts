import { Broadcast, BroadcastRepository } from "./broadcastRepository";
import { MessageLogRepository } from "./messageLogRepository";
import { SegmentRepository } from "./segmentRepository";
import { resolveSegmentLineUserIds } from "./segmentService";
import { MessageSender } from "./messageSender";
import { MessageLogWriter } from "./messageLogWriter";
import { reserve } from "./quotaGuard";
import { sendBroadcastMessages } from "./broadcastSender";
import { err, ok, Result } from "../shared/result";

// dispatchOneBroadcast/dispatchDueBroadcastsの両方が必要とする依存をまとめたもの
type Deps = {
  broadcastRepo: BroadcastRepository;
  messageLogRepo: MessageLogRepository;
  segmentRepo: SegmentRepository;
  messageSender: MessageSender;
  messageLogWriter: MessageLogWriter;
};

export type DispatchSummary = {
  processedCount: number;
  succeededCount: number;
  failedCount: number;
};

// 1件処理: 宛先解決 → 予約 → 送信 → broadcastsのstatus更新
// 例外は投げず、失敗時は必ずmarkFailedを呼んでから返す(pendingのまま放置しない)
async function dispatchOneBroadcast(
  deps: Deps,
  broadcast: Broadcast,
  now: Date,
  monthlyQuota: number,
): Promise<Result<void, string>> {
  const segmentResult = await resolveSegmentLineUserIds(deps.segmentRepo, broadcast.tagId);
  if (segmentResult.kind === "err") {
    await deps.broadcastRepo.markFailed(broadcast.id);
    return err(segmentResult.error.message);
  }
  const userIds = segmentResult.value;

  const permitResult = await reserve(deps.messageLogRepo, now, userIds.length, monthlyQuota);
  if (permitResult.kind === "err") {
    await deps.broadcastRepo.markFailed(broadcast.id);
    // QuotaGuardErrorはrepository/exceededの2種類なので、kindで文言を出し分ける
    return err(
      permitResult.error.kind === "repository"
        ? permitResult.error.message
        : "通数の上限に達しているため送信できませんでした",
    );
  }

  const sendResult = await sendBroadcastMessages(
    {
      segmentRepo: deps.segmentRepo,
      messageSender: deps.messageSender,
      messageLogWriter: deps.messageLogWriter,
    },
    permitResult.value,
    broadcast.tagId,
    // broadcastsテーブルはタグ名を持たない(tagIdのみ)ため、ログ用にtagIdを文字列化して代用
    String(broadcast.tagId),
    broadcast.message,
    now,
  );
  if (sendResult.kind === "err") {
    await deps.broadcastRepo.markFailed(broadcast.id);
    // ここはcronの内部ログ用なので、kind名をそのままエラー文字列として返している
    return err(sendResult.error.kind);
  }

  await deps.broadcastRepo.markSent(broadcast.id, now, sendResult.value.sentCount);
  return ok(undefined);
}

// cronから呼ばれる公開の入り口
// 期限が来たものを全部見つけ、1件ずつdispatchOneBroadcastにかけて集計する
export async function dispatchDueBroadcasts(
  deps: Deps,
  now: Date,
  monthlyQuota: number,
): Promise<Result<DispatchSummary, string>> {
  const dueResult = await deps.broadcastRepo.findDuePending(now);
  if (dueResult.kind === "err") {
    return err(dueResult.error);
  }

  let succeededCount = 0;
  let failedCount = 0;
  for (const broadcast of dueResult.value) {
    const result = await dispatchOneBroadcast(deps, broadcast, now, monthlyQuota);
    if (result.kind === "ok") {
      succeededCount++;
    } else {
      failedCount++;
    }
  }

  return ok({ processedCount: dueResult.value.length, succeededCount, failedCount });
}
