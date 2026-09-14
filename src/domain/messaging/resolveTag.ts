import { Tag, TagRepository } from "../tag/repository";
import { TagId } from "../shared/branded";
import { err, ok, Result } from "../shared/result";

export type ResolveTagError = { kind: "tagNotFound" } | { kind: "repository"; message: string };

// previewBroadcast / confirmBroadcast の両方で必要な「tagIdから実際のタグを1件引く」処理の共通化。
export async function resolveTag(
  tagRepo: TagRepository,
  tagId: TagId,
): Promise<Result<Tag, ResolveTagError>> {
  const result = await tagRepo.findById(tagId);
  if (result.kind === "err") {
    return err({ kind: "repository", message: result.error });
  }
  if (!result.value) {
    return err({ kind: "tagNotFound" });
  }
  return ok(result.value);
}
