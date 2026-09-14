import { TagId } from "../shared/branded";
import { TagRepository } from "../tag/repository";
import { CustomerRepository } from "../customer/repository";
import { MessageLogRepository } from "./messageLogRepository";
import { reserve } from "./quotaGuard";
import { resolveTag } from "./resolveTag";
import { sendBroadcastMessages, SendBroadcastError } from "./broadcastSender";
import { err, Result } from "../shared/result";

type TagNotFoundError = { kind: "tagNotFound" };
type TagNameMismatchError = { kind: "tagNameMismatch" };
type QuotaExceededError = { kind: "quotaExceeded"; remainingMessages: number };
type RepositoryError = { kind: "repository"; message: string };
export type ConfirmBroadcastError =
  | TagNotFoundError
  | TagNameMismatchError
  | QuotaExceededError
  | RepositoryError
  | SendBroadcastError;

// 確認モーダルの「送信する」ボタンが押されたときの本体（画面から渡された数値をそのまま信用しない）
// プレビュー時点から時間が経っている可能性があるため、対象人数・残り件数はここで必ず再計算
export async function confirmBroadcast(
  deps: {
    tagRepo: TagRepository;
    customerRepo: CustomerRepository;
    messageLogRepo: MessageLogRepository;
  },
  tagId: TagId,
  typedTagName: string,
  now: Date,
  monthlyQuota: number,
): Promise<Result<{ sentCount: number }, ConfirmBroadcastError>> {
  const tagResult = await resolveTag(deps.tagRepo, tagId);
  if (tagResult.kind === "err") {
    return err(tagResult.error);
  }
  const tag = tagResult.value;

  if (typedTagName.trim() !== tag.name) {
    return err({ kind: "tagNameMismatch" });
  }

  const recipientResult = await deps.customerRepo.countSendableByTagId(tagId);
  if (recipientResult.kind === "err") {
    return err({ kind: "repository", message: recipientResult.error });
  }

  const permitResult = await reserve(deps.messageLogRepo, now, recipientResult.value, monthlyQuota);
  if (permitResult.kind === "err") {
    if (permitResult.error.kind === "repository") {
      return err({ kind: "repository", message: permitResult.error.message });
    }
    return err({ kind: "quotaExceeded", remainingMessages: permitResult.error.remainingMessages });
  }

  return sendBroadcastMessages(permitResult.value, tagId, tag.name);
}
