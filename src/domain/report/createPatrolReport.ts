import { randomUUID } from "node:crypto";
import { PropertyId } from "../shared/branded";
import { ChecklistResult } from "./checklistItems";
import { buildPatrolReportTemplate } from "./checklistTemplate";
import { PatrolReportRow, PatrolReportRepository } from "./repository";
import { PhotoStorage } from "./photoStorage";
import { err, ok, Result } from "../shared/result";

type NoChecklistError = { kind: "noChecklist" };
type NoPhotosError = { kind: "noPhotos" };
type UnsupportedFormatError = { kind: "unsupportedFormat"; fileName: string };
type StorageError = { kind: "storage"; message: string };
type RepositoryError = { kind: "repository"; message: string };
export type CreatePatrolReportError =
  | NoChecklistError
  | NoPhotosError
  | UnsupportedFormatError
  | StorageError
  | RepositoryError;

export type PhotoInput = {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
};

// 許可する画像形式はJPEG/PNG/WebPのみ
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// チェック結果→テンプレート文章の生成、写真のEXIF除去→R2保存、DB保存までを1つのユースケースとしてまとめる
// 生成直後は必ずテンプレート文章のみの reviewing 状態になる
export async function createPatrolReport(
  deps: {
    photoStorage: PhotoStorage;
    stripExif: (input: Buffer) => Promise<Buffer>;
    patrolReportRepo: PatrolReportRepository;
  },
  propertyId: PropertyId,
  checklistResults: ChecklistResult[],
  photos: PhotoInput[],
): Promise<Result<PatrolReportRow, CreatePatrolReportError>> {
  if (checklistResults.length === 0) {
    return err({ kind: "noChecklist" });
  }
  if (photos.length === 0) {
    return err({ kind: "noPhotos" });
  }
  for (const photo of photos) {
    if (!ALLOWED_MIME_TYPES.has(photo.mimeType)) {
      return err({ kind: "unsupportedFormat", fileName: photo.fileName });
    }
  }

  // 中途半端なdraftを残さないため、1枚でも失敗したら即座に処理を止める
  // 既にアップロード済みの写真の削除は行わないが、DBへの巡回報告レコード自体は作成しない
  const photoKeys: string[] = [];
  for (const photo of photos) {
    const stripped = await deps.stripExif(photo.buffer);
    const key = `patrol-reports/${randomUUID()}-${photo.fileName}`;
    const uploadResult = await deps.photoStorage.upload(key, stripped, photo.mimeType);
    if (uploadResult.kind === "err") {
      return err({ kind: "storage", message: uploadResult.error });
    }
    photoKeys.push(key);
  }

  const body = buildPatrolReportTemplate(checklistResults);

  const createResult = await deps.patrolReportRepo.create({
    propertyId,
    photoKeys,
    checklistResults,
    status: "reviewing",
    body,
    generatedBy: "template",
  });
  if (createResult.kind === "err") {
    return err({ kind: "repository", message: createResult.error });
  }

  return ok(createResult.value);
}
