import { TagId } from "../shared/branded";
import { TagRepository } from "../tag/repository";
import { CustomerRepository } from "../customer/repository";
import { MessageLogRepository } from "./messageLogRepository";
import { reserve } from "./quotaGuard";
import { getRemainingQuota } from "./quotaMeter";
import { err, ok, Result } from "../shared/result";

export type BroadcastPreview = {
  tagId: TagId;
  tagName: string;
  recipientCount: number; // 実際にLINEが届く人数
  monthlyQuota: number;
  remainingBeforeSend: number; // 今、送信前の時点で残っている件数
  remainingAfterSend: number; // このまま送信した場合に残る件数
};

type TagNotFoundError = { kind: "tagNotFound" };
type NoRecipientError = { kind: "noRecipient"; tagName: string };
type QuotaExceededError = {
  kind: "quotaExceeded";
  tagName: string;
  recipientCount: number;
  remainingBeforeSend: number;
};
type RepositoryError = { kind: "repository"; message: string };
export type BroadcastPreviewError =
  | TagNotFoundError
  | NoRecipientError
  | QuotaExceededError
  | RepositoryError;

// 送信前確認モーダルに出す内容（タグ名・実人数・消費件数・残り件数）をまとめて計算する。
// INV-4: 配信前に宛先の実数と内訳を表示する
export async function previewBroadcast(
  deps: {
    tagRepo: TagRepository;
    customerRepo: CustomerRepository;
    messageLogRepo: MessageLogRepository;
  },
  tagId: TagId,
  now: Date,
  monthlyQuota: number,
): Promise<Result<BroadcastPreview, BroadcastPreviewError>> {
  const tagsResult = await deps.tagRepo.list();
  if (tagsResult.kind === "err") {
    return err({ kind: "repository", message: tagsResult.error });
  }
  const tag = tagsResult.value.find((t) => t.id === tagId);
  if (!tag) {
    return err({ kind: "tagNotFound" });
  }

  const recipientResult = await deps.customerRepo.countSendableByTagId(tagId);
  if (recipientResult.kind === "err") {
    return err({ kind: "repository", message: recipientResult.error });
  }
  const recipientCount = recipientResult.value;

  if (recipientCount === 0) {
    return err({ kind: "noRecipient", tagName: tag.name });
  }

  const remainingResult = await getRemainingQuota(deps.messageLogRepo, now, monthlyQuota);
  if (remainingResult.kind === "err") {
    return err({ kind: "repository", message: remainingResult.error });
  }
  const remainingBeforeSend = remainingResult.value;

  // 実際に送信可能かどうかは、必ずQuotaGuardの判定に通す（画面側で独自に計算し直さない）
  const permitResult = await reserve(deps.messageLogRepo, now, recipientCount, monthlyQuota);
  if (permitResult.kind === "err") {
    if (permitResult.error.kind === "repository") {
      return err({ kind: "repository", message: permitResult.error.message });
    }
    return err({
      kind: "quotaExceeded",
      tagName: tag.name,
      recipientCount,
      remainingBeforeSend,
    });
  }

  return ok({
    tagId,
    tagName: tag.name,
    recipientCount,
    monthlyQuota,
    remainingBeforeSend,
    remainingAfterSend: remainingBeforeSend - recipientCount,
  });
}
