"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  previewTagBroadcast,
  confirmTagBroadcast,
  previewScheduledTagBroadcast,
  scheduleTagBroadcast,
} from "@/app/lib/messaging";
import { BroadcastPreview, BroadcastPreviewError } from "@/domain/messaging/broadcastPreview";
import { ConfirmBroadcastError } from "@/domain/messaging/broadcastConfirm";
import {
  ScheduledBroadcastPreview,
  SchedulePreviewError,
} from "@/domain/messaging/previewScheduledBroadcast";
import { ScheduleBroadcastError } from "@/domain/messaging/scheduleBroadcast";
import { TagId } from "@/domain/shared/branded";

// 流れ：actions.ts → DAL(src/app/lib/messaging.ts) → domain(broadcastPreview / broadcastConfirm / previewScheduledBroadcast / scheduleBroadcast)
// このファイルの役割：ブラウザからのフォーム送信を受け止めて、DALの関数を呼ぶだけの薄いラッパー

const tagIdSchema = z.coerce.number().int().positive();

// フォームから来たtagIdの値を検証してからブランド型に昇格させる。
// 検証前の値（null/"abc"等）をNumber()でそのままTagIdにキャストしない
function parseTagId(raw: FormDataEntryValue | null): TagId | null {
  const parsed = tagIdSchema.safeParse(raw);
  return parsed.success ? (parsed.data as TagId) : null;
}

// datetime-local形式("YYYY-MM-DDTHH:mm")の入力値を、常にJSTのその時刻として解釈する
// (このプロジェクトは日本国内の単一事業者のみが使う前提のため、タイムゾーン選択UIは持たない)
function parseScheduledAtAsJst(raw: FormDataEntryValue | null): Date | null {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) {
    return null;
  }
  const date = new Date(`${raw}:00+09:00`);
  return Number.isNaN(date.getTime()) ? null : date;
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
  const message = String(formData.get("message") ?? "");
  const result = await previewTagBroadcast(tagId, message);
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
  const message = String(formData.get("message") ?? "");
  const result = await confirmTagBroadcast(tagId, typedTagName, message);
  if (result.kind === "err") {
    return { kind: "error", error: result.error };
  }
  // ヘッダーの通数メーターに、送信結果を反映させる
  revalidatePath("/broadcasts", "layout");
  return { kind: "success", sentCount: result.value.sentCount };
}

export type SchedulePreviewState =
  | { kind: "idle" }
  | { kind: "success"; preview: ScheduledBroadcastPreview }
  | { kind: "error"; error: SchedulePreviewError };

export async function previewScheduleBroadcastAction(
  prevState: SchedulePreviewState,
  formData: FormData,
): Promise<SchedulePreviewState> {
  const tagId = parseTagId(formData.get("tagId"));
  if (tagId === null) {
    return { kind: "error", error: { kind: "tagNotFound" } };
  }
  const message = String(formData.get("message") ?? "");
  const scheduledAt = parseScheduledAtAsJst(formData.get("scheduledAt"));
  if (scheduledAt === null) {
    return { kind: "error", error: { kind: "pastDateTime" } };
  }
  const result = await previewScheduledTagBroadcast(tagId, message, scheduledAt);
  if (result.kind === "err") {
    return { kind: "error", error: result.error };
  }
  return { kind: "success", preview: result.value };
}

export type ScheduleState =
  | { kind: "idle" }
  | { kind: "success"; scheduledAt: Date }
  | { kind: "error"; error: ScheduleBroadcastError };

export async function scheduleBroadcastAction(
  prevState: ScheduleState,
  formData: FormData,
): Promise<ScheduleState> {
  const tagId = parseTagId(formData.get("tagId"));
  if (tagId === null) {
    return { kind: "error", error: { kind: "tagNotFound" } };
  }
  const typedTagName = String(formData.get("typedTagName") ?? "");
  const message = String(formData.get("message") ?? "");
  const scheduledAt = parseScheduledAtAsJst(formData.get("scheduledAt"));
  if (scheduledAt === null) {
    return { kind: "error", error: { kind: "pastDateTime" } };
  }
  const result = await scheduleTagBroadcast(tagId, typedTagName, message, scheduledAt);
  if (result.kind === "err") {
    return { kind: "error", error: result.error };
  }
  return { kind: "success", scheduledAt: result.value.scheduledAt };
}
