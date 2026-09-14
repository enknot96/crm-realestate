import { LineUserId, TagId } from "../shared/branded";
import { SegmentRepository } from "./segmentRepository";
import { err, ok, Result } from "../shared/result";

type RepositoryError = { kind: "repository"; message: string };
export type SegmentServiceError = RepositoryError;

// タグから送信対象セグメント(LINEユーザーID一覧)を解決する
export async function resolveSegmentLineUserIds(
  repo: SegmentRepository,
  tagId: TagId,
): Promise<Result<LineUserId[], SegmentServiceError>> {
  const result = await repo.listLineUserIdsByTagId(tagId);
  if (result.kind === "err") {
    return err({ kind: "repository", message: result.error });
  }
  const uniqueUserIds = Array.from(new Set(result.value));
  return ok(uniqueUserIds);
}
