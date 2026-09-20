import { randomUUID } from "node:crypto";
import { PropertyId } from "../shared/branded";
import { ChecklistResult } from "./checklistItems";
import { buildPatrolReportTemplate } from "./checklistTemplate";
import { wrapReportWithGreeting } from "./reportGreeting";
import { PatrolReportRow, PatrolReportRepository } from "./repository";
import { PhotoStorage } from "./photoStorage";
import { TextPolisher } from "./textPolisher";
import { polishPatrolReportText } from "./polishPatrolReportText";
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
// 拡張子はここから導出し、ファイル名由来のユーザー入力を混ぜない
const MIME_TYPE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// チェック結果→テンプレート文章の生成、写真のEXIF除去→R2保存、DB保存までを1つのユースケースとしてまとめる
// 生成直後は必ずテンプレート文章のみの reviewing 状態になる
export async function createPatrolReport(
  deps: {
    photoStorage: PhotoStorage;
    stripExif: (input: Buffer) => Promise<Buffer>;
    patrolReportRepo: PatrolReportRepository;
    textPolisher: TextPolisher;
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
  const photoUploads: { photo: PhotoInput; extension: string }[] = [];
  for (const photo of photos) {
    const extension = MIME_TYPE_EXTENSIONS[photo.mimeType];
    if (extension === undefined) {
      return err({ kind: "unsupportedFormat", fileName: photo.fileName });
    }
    photoUploads.push({ photo, extension });
  }

  // 中途半端なdraftを残さないため、1枚でも失敗したら即座に処理を止める
  // 既にアップロード済みの写真の削除は行わないが、DBへの巡回報告レコード自体は作成しない
  const photoKeys: string[] = [];
  for (const { photo, extension } of photoUploads) {
    const stripped = await deps.stripExif(photo.buffer);
    const key = `patrol-reports/${randomUUID()}.${extension}`;
    const uploadResult = await deps.photoStorage.upload(key, stripped, photo.mimeType);
    if (uploadResult.kind === "err") {
      return err({ kind: "storage", message: uploadResult.error });
    }
    photoKeys.push(key);
  }

  const templateBody = buildPatrolReportTemplate(checklistResults);
  const polished = await polishPatrolReportText(deps.textPolisher, templateBody);
  // 挨拶・締めはAIに生成させず、ここで固定文言として結合する(表現のブレを防ぐ)
  const fullBody = wrapReportWithGreeting(polished.text);

  const createResult = await deps.patrolReportRepo.create({
    propertyId,
    photoKeys,
    checklistResults,
    status: "reviewing",
    body: fullBody,
    generatedBy: polished.generatedBy,
  });
  if (createResult.kind === "err") {
    return err({ kind: "repository", message: createResult.error });
  }

  return ok(createResult.value);
}
