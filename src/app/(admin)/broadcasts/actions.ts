"use server";

import { previewTagBroadcast, confirmTagBroadcast } from "@/app/lib/messaging";
import { BroadcastPreview, BroadcastPreviewError } from "@/domain/messaging/broadcastPreview";
import { ConfirmBroadcastError } from "@/domain/messaging/broadcastConfirm";
import { TagId } from "@/domain/shared/branded";

// 流れ：actions.ts → DAL(src/app/lib/messaging.ts) → domain(broadcastPreview / broadcastConfirm)
// このファイルの役割：ブラウザからのフォーム送信を受け止めて、DALの関数を呼ぶだけの薄いラッパー

export type PreviewState =
  | { kind: "idle" }
  | { kind: "success"; preview: BroadcastPreview }
  | { kind: "error"; error: BroadcastPreviewError };

export async function previewBroadcastAction(
  prevState: PreviewState,
  formData: FormData,
): Promise<PreviewState> {
  const rawTagId = formData.get("tagId");
  const tagId = Number(rawTagId) as TagId;
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
  const tagId = Number(formData.get("tagId")) as TagId;
  const typedTagName = String(formData.get("typedTagName") ?? "");
  const result = await confirmTagBroadcast(tagId, typedTagName);
  if (result.kind === "err") {
    return { kind: "error", error: result.error };
  }
  return { kind: "success", sentCount: result.value.sentCount };
}
