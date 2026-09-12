"use server";

import { createTag, removeTag } from "@/app/lib/tag";
import { TagServiceError } from "@/domain/tag/tagService";
import { TagId } from "@/domain/shared/branded";

export type CreateTagActionState = TagServiceError | null;
type RemoveTagActionState = { message: string } | null;

export async function createTagAction(
  prevState: CreateTagActionState,
  formData: FormData,
): Promise<CreateTagActionState> {
  const name = formData.get("name");
  const result = await createTag(typeof name === "string" ? name : "");
  if (result.kind === "err") {
    return result.error;
  }
  return null;
}

export async function removeTagAction(
  prevState: RemoveTagActionState,
  formData: FormData,
): Promise<RemoveTagActionState> {
  const target = formData.get("id");
  const result = await removeTag(Number(target) as TagId);
  if (result.kind === "err") {
    return { message: result.error };
  }
  return null;
}
