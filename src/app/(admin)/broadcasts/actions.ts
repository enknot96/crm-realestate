"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { previewTagBroadcast, confirmTagBroadcast } from "@/app/lib/messaging";
import { BroadcastPreview, BroadcastPreviewError } from "@/domain/messaging/broadcastPreview";
import { ConfirmBroadcastError } from "@/domain/messaging/broadcastConfirm";
import { TagId } from "@/domain/shared/branded";

// 流れ：actions.ts → DAL(src/app/lib/messaging.ts) → domain(broadcastPreview / broadcastConfirm)
// このファイルの役割：ブラウザからのフォーム送信を受け止めて、DALの関数を呼ぶだけの薄いラッパー

const tagIdSchema = z.coerce.number().int().positive();

// フォームから来たtagIdの値を検証してからブランド型に昇格させる。
// 検証前の値（null/"abc"等）をNumber()でそのままTagIdにキャストしない
function parseTagId(raw: FormDataEntryValue | null): TagId | null {
  const parsed = tagIdSchema.safeParse(raw);
  return parsed.success ? (parsed.data as TagId) : null;
}

export type PreviewState =
  | { kind: "idle" }
  | { kind: "success"; preview: BroadcastPreview }
  | { kind: "error"; error: BroadcastPreviewError };

export async function previewBroadcastAction(
  prevState: PreviewState,
  formData: FormData,
): Promise<PreviewState> {
  const tagId = parseTagId(formData.get("tagId"));
  if (tagId === null) {
    return { kind: "error", error: { kind: "tagNotFound" } };
  }
  const result = await previewTagBroadcast(tagId);
  if (result.kind === "err") {
    return { kind: "error", error: result.error };
  }
  return { kind: "success", preview: result.value };
}

export type ConfirmState =
  | { kind: "idle" }
  | { kind: "success"; sentCount: number }
  | { kind: "error"; error: ConfirmBroadcastError };

export async function confirmBroadcastAction(
  prevState: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  const tagId = parseTagId(formData.get("tagId"));
  if (tagId === null) {
    return { kind: "error", error: { kind: "tagNotFound" } };
  }
  const typedTagName = String(formData.get("typedTagName") ?? "");
  const result = await confirmTagBroadcast(tagId, typedTagName);
  if (result.kind === "err") {
    return { kind: "error", error: result.error };
  }
  // ヘッダーの通数メーターに、送信結果を反映させる
  revalidatePath("/broadcasts", "layout");
  return { kind: "success", sentCount: result.value.sentCount };
}
