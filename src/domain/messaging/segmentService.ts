import { LineUserId, TagId } from "../shared/branded";
import { SegmentRepository } from "./segmentRepository";
import { err, ok, Result } from "../shared/result";

type RepositoryError = { kind: "repository"; message: string };
export type SegmentServiceError = RepositoryError;

// タグから送信対象セグメント(LINEユーザーID一覧)を解決する。
// 現状は単一タグのみに対応。複数タグの組み合わせ(AND/OR)によるセグメント配信は、
// 呼び出し側(Server Action等)の要件が固まっていないため、今回のスコープでは対象外とする。
// なお、重複除去は単一タグの現在の実装では原理的に不要な防御(リポジトリの実装が
// 正しければ重複は発生しない)だが、将来複数タグOR条件を扱うようになった場合は
// 「タグをまたいで同じLINEユーザーIDが複数回ヒットする」ことが仕様上当然起こるため、
// そのときに向けた土台としてここに残している。
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
