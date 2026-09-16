import { TagId } from "../shared/branded";
import { SendPermit } from "./quotaGuard";
import { SegmentRepository } from "./segmentRepository";
import { resolveSegmentLineUserIds } from "./segmentService";
import { MessageSender, MessageSenderError, OutgoingMessage } from "./messageSender";
import { MessageLogWriter } from "./messageLogWriter";
import { err, ok, Result } from "../shared/result";

type RepositoryError = { kind: "repository"; message: string };
export type SendBroadcastError = RepositoryError | MessageSenderError;

// 確認モーダルの「送信する」ボタンが押された後、実際にLINEへ送るところまでを担当
// QuotaGuard.reserve()を経由していない呼び出しはコンパイルエラーになる
export async function sendBroadcastMessages(
  deps: {
    segmentRepo: SegmentRepository;
    messageSender: MessageSender;
    messageLogWriter: MessageLogWriter;
  },
  permit: SendPermit,
  tagId: TagId,
  tagName: string,
  message: string,
  now: Date,
): Promise<Result<{ sentCount: number }, SendBroadcastError>> {
  const segmentResult = await resolveSegmentLineUserIds(deps.segmentRepo, tagId);
  if (segmentResult.kind === "err") {
    return err({ kind: "repository", message: segmentResult.error.message });
  }
  const userIds = segmentResult.value;

  const outgoingMessage: OutgoingMessage = { kind: "text", text: message };
  const sendResult = await deps.messageSender.sendMulticast(permit, userIds, outgoingMessage);
  if (sendResult.kind === "err") {
    return err(sendResult.error);
  }
  const { succeededUserIds, failures } = sendResult.value;

  // 失敗を握りつぶさない
  // ただし実際に届いた宛先もあるため、画面には成功件数だけを返し、失敗の詳細はサーバーログにだけ残す
  if (failures.length > 0) {
    console.error(
      `[broadcastSender] 一部の送信に失敗: tagId=${tagId} tagName=${tagName} failures=${JSON.stringify(failures)}`,
    );
  }

  if (succeededUserIds.length > 0) {
    const writeResult = await deps.messageLogWriter.writeLogs(succeededUserIds.length, now);
    if (writeResult.kind === "err") {
      // 送信自体は成功しているため、ログ記録の失敗で処理全体を失敗扱いにはしない
      console.error(`[broadcastSender] 送信ログの記録に失敗: ${writeResult.error}`);
    }
  }

  return ok({ sentCount: succeededUserIds.length });
}
