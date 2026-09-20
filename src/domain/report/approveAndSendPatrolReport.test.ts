import { describe, it, expect, vi } from "vitest";
import { approveAndSendPatrolReport } from "./approveAndSendPatrolReport";
import { PatrolReportRepository, PatrolReportRow } from "./repository";
import { PatrolReportSendRepository } from "./patrolReportSendRepository";
import { PatrolReportMessageSender } from "./patrolReportMessageSender";
import { MessageLogRepository } from "../messaging/messageLogRepository";
import { ChecklistResult } from "./checklistItems";
import { LineUserId, PropertyId, ReportId } from "../shared/branded";
import { err, ok } from "../shared/result";

function notImplemented(): never {
  throw new Error("この操作はテストで使用しない想定です");
}

function createFakePatrolReportRepo(
  overrides: Partial<PatrolReportRepository> = {},
): PatrolReportRepository {
  return {
    create: notImplemented,
    findById: notImplemented,
    listByPropertyId: notImplemented,
    updateBody: notImplemented,
    remove: notImplemented,
    approve: notImplemented,
    markSent: notImplemented,
    markFailed: notImplemented,
    ...overrides,
  };
}

function createFakeSendRepo(
  reserve: PatrolReportSendRepository["reserve"],
): PatrolReportSendRepository {
  return { reserve };
}

function createFakeMessageLogRepo(currentCount: number): MessageLogRepository {
  return { countThisMonth: async () => ok(currentCount) };
}

function createFakeMessageSender(
  sendReport: PatrolReportMessageSender["sendReport"],
): PatrolReportMessageSender {
  return { sendReport };
}

const checklistResults: ChecklistResult[] = [
  { key: "exteriorWall", label: "外壁", status: "ok" },
];

const reviewingReport: PatrolReportRow = {
  id: "report-1" as ReportId,
  propertyId: "property-1" as PropertyId,
  photoKeys: ["patrol-reports/a.jpg", "patrol-reports/b.jpg"],
  checklistResults,
  status: "reviewing",
  body: "報告文です",
  generatedBy: "ai",
  approvedAt: null,
  sentAt: null,
  failedReason: null,
  createdAt: new Date("2026-09-19T00:00:00+09:00"),
};

const lineUserId = "line-user-1" as LineUserId;
const now = new Date("2026-09-20T10:00:00+09:00");
const monthlyQuota = 200;
const buildPhotoUrl = async (key: string) => `https://images.example.workers.dev/${key}?sig=xxx`;

describe("approveAndSendPatrolReport", () => {
  it("正常な場合、承認・送信・sentへの更新まで行う", async () => {
    const approve = vi.fn(async () =>
      ok<PatrolReportRow, string>({ ...reviewingReport, status: "approved", approvedAt: now }),
    );
    const markSent = vi.fn(async () =>
      ok<PatrolReportRow, string>({ ...reviewingReport, status: "sent", sentAt: now }),
    );
    const sendReport = vi.fn(async () => ok<void, string>(undefined));
    const reserve = vi.fn(async () => ok<void, { kind: "alreadySent" } | { kind: "repository"; message: string }>(undefined));

    const result = await approveAndSendPatrolReport(
      {
        patrolReportRepo: createFakePatrolReportRepo({ approve, markSent }),
        patrolReportSendRepo: createFakeSendRepo(reserve),
        messageLogRepo: createFakeMessageLogRepo(0),
        messageSender: createFakeMessageSender(sendReport),
        buildPhotoUrl,
      },
      reviewingReport,
      lineUserId,
      now,
      monthlyQuota,
    );

    expect(result).toEqual(ok(undefined));
    expect(reserve).toHaveBeenCalledWith(reviewingReport.id);
    expect(approve).toHaveBeenCalledWith(reviewingReport.id, now);
    expect(sendReport).toHaveBeenCalledWith(
      expect.anything(),
      lineUserId,
      reviewingReport.body,
      [
        "https://images.example.workers.dev/patrol-reports/a.jpg?sig=xxx",
        "https://images.example.workers.dev/patrol-reports/b.jpg?sig=xxx",
      ],
    );
    expect(markSent).toHaveBeenCalledWith(reviewingReport.id, now);
  });

  it("二重送信防止：既に送信予約済みの場合、LINE送信はせずalreadySentを返す", async () => {
    const sendReport = vi.fn(notImplemented);
    const approve = vi.fn(notImplemented);
    const reserve = vi.fn(async () => err<void, { kind: "alreadySent" }>({ kind: "alreadySent" }));

    const result = await approveAndSendPatrolReport(
      {
        patrolReportRepo: createFakePatrolReportRepo({ approve }),
        patrolReportSendRepo: createFakeSendRepo(reserve),
        messageLogRepo: createFakeMessageLogRepo(0),
        messageSender: createFakeMessageSender(sendReport),
        buildPhotoUrl,
      },
      reviewingReport,
      lineUserId,
      now,
      monthlyQuota,
    );

    expect(result).toEqual(err({ kind: "alreadySent" }));
    expect(approve).not.toHaveBeenCalled();
    expect(sendReport).not.toHaveBeenCalled();
  });

  it("reviewing以外の状態からは承認できない", async () => {
    const sentReport: PatrolReportRow = { ...reviewingReport, status: "sent", sentAt: now };

    const result = await approveAndSendPatrolReport(
      {
        patrolReportRepo: createFakePatrolReportRepo(),
        patrolReportSendRepo: createFakeSendRepo(notImplemented),
        messageLogRepo: createFakeMessageLogRepo(0),
        messageSender: createFakeMessageSender(notImplemented),
        buildPhotoUrl,
      },
      sentReport,
      lineUserId,
      now,
      monthlyQuota,
    );

    expect(result).toEqual(err({ kind: "notReviewing" }));
  });

  it("LINEユーザーIDが紐付いていない場合はnoLineUserを返す", async () => {
    const result = await approveAndSendPatrolReport(
      {
        patrolReportRepo: createFakePatrolReportRepo(),
        patrolReportSendRepo: createFakeSendRepo(notImplemented),
        messageLogRepo: createFakeMessageLogRepo(0),
        messageSender: createFakeMessageSender(notImplemented),
        buildPhotoUrl,
      },
      reviewingReport,
      null,
      now,
      monthlyQuota,
    );

    expect(result).toEqual(err({ kind: "noLineUser" }));
  });

  it("通数を超える場合、failedに記録してquotaExceededを返す", async () => {
    const approve = vi.fn(async () =>
      ok<PatrolReportRow, string>({ ...reviewingReport, status: "approved", approvedAt: now }),
    );
    const markFailed = vi.fn(async () => ok<PatrolReportRow, string>(reviewingReport));
    const reserve = vi.fn(async () => ok<void, { kind: "alreadySent" }>(undefined));
    // 実測199件、対象3件(テキスト1+写真2) → 202件で上限(200)超え
    const messageLogRepo = createFakeMessageLogRepo(199);

    const result = await approveAndSendPatrolReport(
      {
        patrolReportRepo: createFakePatrolReportRepo({ approve, markFailed }),
        patrolReportSendRepo: createFakeSendRepo(reserve),
        messageLogRepo,
        messageSender: createFakeMessageSender(notImplemented),
        buildPhotoUrl,
      },
      reviewingReport,
      lineUserId,
      now,
      monthlyQuota,
    );

    expect(result.kind).toBe("err");
    if (result.kind === "err") {
      expect(result.error.kind).toBe("quotaExceeded");
    }
    expect(markFailed).toHaveBeenCalledWith(reviewingReport.id, expect.any(String));
  });

  it("LINE送信に失敗した場合、failedに記録してsendエラーを返す", async () => {
    const approve = vi.fn(async () =>
      ok<PatrolReportRow, string>({ ...reviewingReport, status: "approved", approvedAt: now }),
    );
    const markFailed = vi.fn(async () => ok<PatrolReportRow, string>(reviewingReport));
    const reserve = vi.fn(async () => ok<void, { kind: "alreadySent" }>(undefined));
    const sendReport = vi.fn(async () => err<void, string>("LINEへの接続に失敗しました"));

    const result = await approveAndSendPatrolReport(
      {
        patrolReportRepo: createFakePatrolReportRepo({ approve, markFailed }),
        patrolReportSendRepo: createFakeSendRepo(reserve),
        messageLogRepo: createFakeMessageLogRepo(0),
        messageSender: createFakeMessageSender(sendReport),
        buildPhotoUrl,
      },
      reviewingReport,
      lineUserId,
      now,
      monthlyQuota,
    );

    expect(result).toEqual(err({ kind: "send", message: "LINEへの接続に失敗しました" }));
    expect(markFailed).toHaveBeenCalledWith(reviewingReport.id, "LINEへの接続に失敗しました");
  });
});
