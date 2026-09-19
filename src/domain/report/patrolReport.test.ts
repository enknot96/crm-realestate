import { describe, it, expect } from "vitest";
import { toPatrolReport } from "./patrolReport";
import { PatrolReportRow } from "./repository";
import { PropertyId, ReportId } from "../shared/branded";
import { ChecklistResult } from "./checklistItems";

const checklistResults: ChecklistResult[] = [
  { key: "exteriorWall", label: "外壁", status: "ok" },
];

const draftRow: PatrolReportRow = {
  id: "report-1" as ReportId,
  propertyId: "property-1" as PropertyId,
  photoKeys: ["photos/a.jpg", "photos/b.jpg"],
  checklistResults,
  status: "draft",
  body: null,
  generatedBy: null,
  approvedAt: null,
  sentAt: null,
  failedReason: null,
  createdAt: new Date("2026-09-19T00:00:00+09:00"),
};

describe("toPatrolReport", () => {
  it("statusがdraftの場合、kind: 'draft'でphotoKeysとchecklistResultsを持つ（body/generatedByは持たない）", () => {
    const result = toPatrolReport(draftRow);

    expect(result).toEqual({
      kind: "draft",
      photoKeys: draftRow.photoKeys,
      checklistResults: draftRow.checklistResults,
    });
  });

  it("statusがreviewingの場合、kind: 'reviewing'でbodyとgeneratedByも持つ", () => {
    const reviewingRow: PatrolReportRow = {
      ...draftRow,
      status: "reviewing",
      body: "報告文です",
      generatedBy: "template",
    };

    const result = toPatrolReport(reviewingRow);

    expect(result).toEqual({
      kind: "reviewing",
      photoKeys: reviewingRow.photoKeys,
      checklistResults: reviewingRow.checklistResults,
      body: "報告文です",
      generatedBy: "template",
    });
  });

  it("statusがapprovedの場合、kind: 'approved'でbodyとapprovedAtを持つ", () => {
    const approvedAt = new Date("2026-09-20T10:00:00+09:00");
    const approvedRow: PatrolReportRow = {
      ...draftRow,
      status: "approved",
      body: "報告文です",
      generatedBy: "ai",
      approvedAt,
    };

    const result = toPatrolReport(approvedRow);

    expect(result).toEqual({
      kind: "approved",
      photoKeys: approvedRow.photoKeys,
      checklistResults: approvedRow.checklistResults,
      body: "報告文です",
      approvedAt,
    });
  });

  it("statusがsentの場合、kind: 'sent'でbodyとsentAtを持つ", () => {
    const sentAt = new Date("2026-09-20T11:00:00+09:00");
    const sentRow: PatrolReportRow = {
      ...draftRow,
      status: "sent",
      body: "報告文です",
      generatedBy: "ai",
      approvedAt: new Date("2026-09-20T10:00:00+09:00"),
      sentAt,
    };

    const result = toPatrolReport(sentRow);

    expect(result).toEqual({
      kind: "sent",
      photoKeys: sentRow.photoKeys,
      checklistResults: sentRow.checklistResults,
      body: "報告文です",
      sentAt,
    });
  });

  it("statusがfailedの場合、kind: 'failed'でbodyとerrorを持つ", () => {
    const failedRow: PatrolReportRow = {
      ...draftRow,
      status: "failed",
      body: "報告文です",
      generatedBy: "ai",
      approvedAt: new Date("2026-09-20T10:00:00+09:00"),
      failedReason: "LINEユーザーIDが紐付いていません",
    };

    const result = toPatrolReport(failedRow);

    expect(result).toEqual({
      kind: "failed",
      photoKeys: failedRow.photoKeys,
      checklistResults: failedRow.checklistResults,
      body: "報告文です",
      error: "LINEユーザーIDが紐付いていません",
    });
  });

  it("未知のstatusの場合はエラーを投げる", () => {
    const unknownRow: PatrolReportRow = { ...draftRow, status: "unknown" };

    expect(() => toPatrolReport(unknownRow)).toThrow();
  });
});
