import { describe, it, expect, vi } from "vitest";
import { createPatrolReport } from "./createPatrolReport";
import { PatrolReportRow, PatrolReportRepository } from "./repository";
import { PhotoStorage } from "./photoStorage";
import { TextPolisher } from "./textPolisher";
import { ChecklistResult } from "./checklistItems";
import { wrapReportWithGreeting } from "./reportGreeting";
import { PropertyId, ReportId } from "../shared/branded";
import { err, ok } from "../shared/result";

function notImplemented(): never {
  throw new Error("この操作はテストで使用しない想定です");
}

function createFakePhotoStorage(upload: PhotoStorage["upload"] = notImplemented): PhotoStorage {
  return { upload, download: notImplemented };
}

function createFakePatrolReportRepository(
  create: PatrolReportRepository["create"] = notImplemented,
): PatrolReportRepository {
  return {
    create,
    findById: notImplemented,
    listByPropertyId: notImplemented,
    updateBody: notImplemented,
    remove: notImplemented,
    approve: notImplemented,
    markSent: notImplemented,
    markFailed: notImplemented,
  };
}

function createFakeTextPolisher(polish: TextPolisher["polish"]): TextPolisher {
  return { polish };
}

const propertyId = "property-1" as PropertyId;
const checklistResults: ChecklistResult[] = [
  { key: "exteriorWall", label: "外壁", status: "ok" },
];
const photo = { fileName: "a.jpg", mimeType: "image/jpeg", buffer: Buffer.from("fake-image") };
const stripExif = vi.fn(async (buf: Buffer) => buf);

const createdRow: PatrolReportRow = {
  id: "report-1" as ReportId,
  propertyId,
  photoKeys: ["patrol-reports/xxx-a.jpg"],
  checklistResults,
  status: "reviewing",
  body: "AIが清書した報告文です",
  generatedBy: "ai",
  approvedAt: null,
  sentAt: null,
  failedReason: null,
  createdAt: new Date(),
};

describe("createPatrolReport", () => {
  it("正常な場合、写真をアップロードし、AI清書後の本文でreviewing状態の巡回報告を作成する", async () => {
    const upload = vi.fn(async () => ok<void, string>(undefined));
    const create = vi.fn(async () => ok<PatrolReportRow, string>(createdRow));
    const textPolisher = createFakeTextPolisher(async () => ok<string, string>("AIが清書した報告文です"));
    const deps = {
      photoStorage: createFakePhotoStorage(upload),
      stripExif,
      patrolReportRepo: createFakePatrolReportRepository(create),
      textPolisher,
    };

    const result = await createPatrolReport(deps, propertyId, checklistResults, [photo]);

    expect(result).toEqual(ok(createdRow));
    expect(upload).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        propertyId,
        checklistResults,
        status: "reviewing",
        body: wrapReportWithGreeting("AIが清書した報告文です"),
        generatedBy: "ai",
      }),
    );
  });

  it("AI清書に失敗した場合、テンプレート文章のままgeneratedBy: 'template'で保存する", async () => {
    const upload = vi.fn(async () => ok<void, string>(undefined));
    const create = vi.fn(async () => ok<PatrolReportRow, string>(createdRow));
    const textPolisher = createFakeTextPolisher(async () => err<string, string>("AI呼び出しに失敗しました"));
    const deps = {
      photoStorage: createFakePhotoStorage(upload),
      stripExif,
      patrolReportRepo: createFakePatrolReportRepository(create),
      textPolisher,
    };

    await createPatrolReport(deps, propertyId, checklistResults, [photo]);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        body: wrapReportWithGreeting("外壁: 異常なし"),
        generatedBy: "template",
      }),
    );
  });

  it("チェック結果が空の場合はnoChecklistを返す", async () => {
    const deps = {
      photoStorage: createFakePhotoStorage(),
      stripExif,
      patrolReportRepo: createFakePatrolReportRepository(),
      textPolisher: createFakeTextPolisher(notImplemented),
    };

    const result = await createPatrolReport(deps, propertyId, [], [photo]);

    expect(result).toEqual(err({ kind: "noChecklist" }));
  });

  it("写真が無い場合はnoPhotosを返す", async () => {
    const deps = {
      photoStorage: createFakePhotoStorage(),
      stripExif,
      patrolReportRepo: createFakePatrolReportRepository(),
      textPolisher: createFakeTextPolisher(notImplemented),
    };

    const result = await createPatrolReport(deps, propertyId, checklistResults, []);

    expect(result).toEqual(err({ kind: "noPhotos" }));
  });

  it("許可されていない画像形式の場合はunsupportedFormatを返す", async () => {
    const deps = {
      photoStorage: createFakePhotoStorage(),
      stripExif,
      patrolReportRepo: createFakePatrolReportRepository(),
      textPolisher: createFakeTextPolisher(notImplemented),
    };
    const badPhoto = { fileName: "a.gif", mimeType: "image/gif", buffer: Buffer.from("x") };

    const result = await createPatrolReport(deps, propertyId, checklistResults, [badPhoto]);

    expect(result).toEqual(err({ kind: "unsupportedFormat", fileName: "a.gif" }));
  });

  it("写真のアップロードに失敗した場合はstorageエラーを返し、DBには保存しない", async () => {
    const upload = vi.fn(async () => err<void, string>("R2への接続に失敗しました"));
    const create = vi.fn(notImplemented);
    const deps = {
      photoStorage: createFakePhotoStorage(upload),
      stripExif,
      patrolReportRepo: createFakePatrolReportRepository(create),
      textPolisher: createFakeTextPolisher(notImplemented),
    };

    const result = await createPatrolReport(deps, propertyId, checklistResults, [photo]);

    expect(result).toEqual(err({ kind: "storage", message: "R2への接続に失敗しました" }));
    expect(create).not.toHaveBeenCalled();
  });

  it("DBへの保存に失敗した場合はrepositoryエラーを返す", async () => {
    const upload = vi.fn(async () => ok<void, string>(undefined));
    const create = vi.fn(async () => err<PatrolReportRow, string>("DB接続エラー"));
    const textPolisher = createFakeTextPolisher(async () => ok<string, string>("AIが清書した報告文です"));
    const deps = {
      photoStorage: createFakePhotoStorage(upload),
      stripExif,
      patrolReportRepo: createFakePatrolReportRepository(create),
      textPolisher,
    };

    const result = await createPatrolReport(deps, propertyId, checklistResults, [photo]);

    expect(result).toEqual(err({ kind: "repository", message: "DB接続エラー" }));
  });
});
