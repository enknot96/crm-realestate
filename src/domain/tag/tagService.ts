import { TagId } from "../shared/branded";
import { Tag, TagRepository } from "./repository";
import { err, Result } from "../shared/result";

type ValidationError = { kind: "validation"; message: string };
type RepositoryError = { kind: "repository"; message: string };
export type TagServiceError = ValidationError | RepositoryError;

export async function listTags(repo: TagRepository) {
  return repo.list();
}

export async function createTag(
  repo: TagRepository,
  name: string,
): Promise<Result<Tag, TagServiceError>> {
  const trimmed = name.trim();
  if (trimmed === "") {
    return err({ kind: "validation", message: "タグ名を入力してください" });
  }
  const result = await repo.create(trimmed);
  if (result.kind === "err") {
    return err({ kind: "repository", message: result.error });
  }
  return result;
}

export async function removeTag(repo: TagRepository, id: TagId) {
  return repo.remove(id);
}
