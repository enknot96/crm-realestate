import { TagId } from "../shared/branded";
import { TagRepository } from "../tag/repository";
import { CustomerRepository } from "../customer/repository";
import { MessageLogRepository } from "./messageLogRepository";
import { remainingFromCount } from "./quotaMeter";
import { resolveTag } from "./resolveTag";
import { err, ok, Result } from "../shared/result";

export type ScheduledBroadcastPreview = {
  tagId: TagId;
  tagName: string;
  message: string;
  scheduledAt: Date;
  recipientCount: number;
  monthlyQuota: number;
  remainingBeforeSend: number; // 現時点で残っている件数(参考値)
  // 予約通り実行された場合の見積もり。実際に送れるかどうかはPhase5のcron実行時にQuotaGuardが判定するため、
  // ここではマイナスになることも許容し、送信不可としてブロックはしない
  remainingAfterSend: number;
};

type TagNotFoundError = { kind: "tagNotFound" };
type EmptyMessageError = { kind: "emptyMessage" };
type NoRecipientError = { kind: "noRecipient"; tagName: string };
type PastDateTimeError = { kind: "pastDateTime" };
type RepositoryError = { kind: "repository"; message: string };
export type SchedulePreviewError =
  | TagNotFoundError
  | EmptyMessageError
  | NoRecipientError
  | PastDateTimeError
  | RepositoryError;

// 予約配信の確認モーダルに出す内容を計算する
// previewBroadcastと似ているが、今月の通数を使い切っていても予約自体はブロックしない
// (実際に送るのは未来の時点なので、その時点で通数が空いている可能性があるため)
export async function previewScheduledBroadcast(
  deps: {
    tagRepo: TagRepository;
    customerRepo: CustomerRepository;
    messageLogRepo: MessageLogRepository;
  },
  tagId: TagId,
  message: string,
  scheduledAt: Date,
  now: Date,
  monthlyQuota: number,
): Promise<Result<ScheduledBroadcastPreview, SchedulePreviewError>> {
  if (message.trim() === "") {
    return err({ kind: "emptyMessage" });
  }

  if (scheduledAt.getTime() <= now.getTime()) {
    return err({ kind: "pastDateTime" });
  }

  const tagResult = await resolveTag(deps.tagRepo, tagId);
  if (tagResult.kind === "err") {
    return err(tagResult.error);
  }
  const tag = tagResult.value;

  const recipientResult = await deps.customerRepo.countSendableByTagId(tagId);
  if (recipientResult.kind === "err") {
    return err({ kind: "repository", message: recipientResult.error });
  }
  const recipientCount = recipientResult.value;

  if (recipientCount === 0) {
    return err({ kind: "noRecipient", tagName: tag.name });
  }

  const countResult = await deps.messageLogRepo.countThisMonth(now);
  if (countResult.kind === "err") {
    return err({ kind: "repository", message: countResult.error });
  }
  const remainingBeforeSend = remainingFromCount(countResult.value, monthlyQuota);

  return ok({
    tagId,
    tagName: tag.name,
    message,
    scheduledAt,
    recipientCount,
    monthlyQuota,
    remainingBeforeSend,
    remainingAfterSend: remainingBeforeSend - recipientCount,
  });
}
