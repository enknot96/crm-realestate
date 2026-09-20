"use server";

import { redirect } from "next/navigation";
import { createPatrolReport } from "@/app/lib/patrolReport";
import { requireSession } from "@/app/lib/auth";
import { CHECKLIST_ITEMS, ChecklistResult } from "@/domain/report/checklistItems";
import { CreatePatrolReportError, PhotoInput } from "@/domain/report/createPatrolReport";
import { PropertyId } from "@/domain/shared/branded";

// Action層だけのエラー(フォーム自体の入力不備)
// ドメイン層のCreatePatrolReportErrorとは別に扱う
type InvalidChecklistError = { kind: "invalidChecklist" };
export type CreatePatrolReportActionError = CreatePatrolReportError | InvalidChecklistError;

export type CreatePatrolReportActionState =
  | { kind: "idle" }
  | { kind: "error"; error: CreatePatrolReportActionError };

// フォームから来たチェック項目を検証しながらChecklistResult[]へ組み立てる
// 1項目でも欠けていたらinvalidChecklistとして拒否
function parseChecklistResults(formData: FormData): ChecklistResult[] | null {
  const results: ChecklistResult[] = [];
  for (const item of CHECKLIST_ITEMS) {
    const status = formData.get(`check_${item.key}_status`);
    if (status !== "ok" && status !== "needsAttention") {
      return null;
    }
    const rawComment = formData.get(`check_${item.key}_comment`);
    const comment =
      typeof rawComment === "string" && rawComment.trim() !== "" ? rawComment.trim() : undefined;
    results.push({ key: item.key, label: item.label, status, comment });
  }
  return results;
}

async function parsePhotos(formData: FormData): Promise<PhotoInput[]> {
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const photos: PhotoInput[] = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    photos.push({ fileName: file.name, mimeType: file.type, buffer });
  }
  return photos;
}

export async function createPatrolReportAction(
  prevState: CreatePatrolReportActionState,
  formData: FormData,
): Promise<CreatePatrolReportActionState> {
  const permit = await requireSession();
  const propertyId = formData.get("propertyId") as PropertyId;

  const checklistResults = parseChecklistResults(formData);
  if (checklistResults === null) {
    return { kind: "error", error: { kind: "invalidChecklist" } };
  }

  const photos = await parsePhotos(formData);

  const result = await createPatrolReport(permit, propertyId, checklistResults, photos);
  if (result.kind === "err") {
    return { kind: "error", error: result.error };
  }

  redirect(`/properties/${propertyId}/patrol-reports/${result.value.id}`);
}
