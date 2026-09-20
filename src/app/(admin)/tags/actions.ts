"use server";

import { createTag, removeTag } from "@/app/lib/tag";
import { requireSession } from "@/app/lib/auth";
import { TagServiceError } from "@/domain/tag/tagService";
import { TagId } from "@/domain/shared/branded";
import { revalidatePath } from "next/cache";

export type CreateTagActionState = TagServiceError | null;
type RemoveTagActionState = { message: string } | null;

export async function createTagAction(
  prevState: CreateTagActionState,
  formData: FormData,
): Promise<CreateTagActionState> {
  const permit = await requireSession();
  const name = formData.get("name");
  const result = await createTag(permit, typeof name === "string" ? name : "");
  if (result.kind === "err") {
    return result.error;
  }
  revalidatePath("/tags");
  return null;
}

export async function removeTagAction(
  prevState: RemoveTagActionState,
  formData: FormData,
): Promise<RemoveTagActionState> {
  const permit = await requireSession();
  const target = formData.get("id");
  const result = await removeTag(permit, Number(target) as TagId);
  if (result.kind === "err") {
    return { message: result.error };
  }
  revalidatePath("/tags");
  return null;
}
