import { TagId } from "../shared/branded";
import { TagRepository } from "../tag/repository";
import { Broadcast, BroadcastRepository } from "./broadcastRepository";
import { resolveTag } from "./resolveTag";
import { err, ok, Result } from "../shared/result";

type TagNotFoundError = { kind: "tagNotFound" };
type EmptyMessageError = { kind: "emptyMessage" };
type TagNameMismatchError = { kind: "tagNameMismatch" };
type PastDateTimeError = { kind: "pastDateTime" };
type RepositoryError = { kind: "repository"; message: string };
export type ScheduleBroadcastError =
  | TagNotFoundError
  | EmptyMessageError
  | TagNameMismatchError
  | PastDateTimeError
  | RepositoryError;

// 予約確認モーダルの「予約する」ボタンが押されたときの本体
// QuotaGuardは通さない(通数チェックは、実際に送信するPhase5のcron実行時に行う)
export async function scheduleBroadcast(
  deps: {
    tagRepo: TagRepository;
    broadcastRepo: BroadcastRepository;
  },
  tagId: TagId,
  typedTagName: string,
  message: string,
  scheduledAt: Date,
  now: Date,
): Promise<Result<Broadcast, ScheduleBroadcastError>> {
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

  if (typedTagName.trim() !== tag.name) {
    return err({ kind: "tagNameMismatch" });
  }

  const createResult = await deps.broadcastRepo.create({ tagId, message, scheduledAt });
  if (createResult.kind === "err") {
    return err({ kind: "repository", message: createResult.error });
  }

  return ok(createResult.value);
}
