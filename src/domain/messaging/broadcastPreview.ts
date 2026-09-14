import { TagId } from "../shared/branded";
import { TagRepository } from "../tag/repository";
import { CustomerRepository } from "../customer/repository";
import { MessageLogRepository } from "./messageLogRepository";
import { evaluateQuota } from "./quotaGuard";
import { remainingFromCount } from "./quotaMeter";
import { resolveTag } from "./resolveTag";
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

// 送信前確認モーダルに出す内容（タグ名・実人数・消費件数・残り件数）をまとめて計算
// 配信前に宛先の実数と内訳を表示する
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

  // countThisMonthは1回だけ取得し、
  // 表示用の残数計算(remainingFromCount)と送信可否の判定(evaluateQuota)の両方に同じ値を使う
  const countResult = await deps.messageLogRepo.countThisMonth(now);
  if (countResult.kind === "err") {
    return err({ kind: "repository", message: countResult.error });
  }
  const remainingBeforeSend = remainingFromCount(countResult.value, monthlyQuota);

  // 実際に送信可能かどうかは、必ずQuotaGuardと同じ判定ロジックに通す
  // プレビューは表示専用のためSendPermitは発行しない
  const evaluation = evaluateQuota(countResult.value, recipientCount, monthlyQuota);
  if (!evaluation.ok) {
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
