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

  it("未知のstatusの場合はエラーを投げる", () => {
    const unknownRow: PatrolReportRow = { ...draftRow, status: "unknown" };

    expect(() => toPatrolReport(unknownRow)).toThrow();
  });
});
