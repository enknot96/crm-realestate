import { ChecklistResult } from "./checklistItems";
import { PatrolReportRow } from "./repository";

export type PatrolReport =
  | {
      kind: "draft";
      photoKeys: string[];
      checklistResults: ChecklistResult[];
    }
  | {
      kind: "reviewing";
      photoKeys: string[];
      checklistResults: ChecklistResult[];
      body: string;
      generatedBy: string;
    }
  | {
      kind: "approved";
      photoKeys: string[];
      checklistResults: ChecklistResult[];
      body: string;
      approvedAt: Date;
    }
  | {
      kind: "sent";
      photoKeys: string[];
      checklistResults: ChecklistResult[];
      body: string;
      sentAt: Date;
    }
  | {
      kind: "failed";
      photoKeys: string[];
      checklistResults: ChecklistResult[];
      body: string;
      error: string;
    };

export function toPatrolReport(row: PatrolReportRow): PatrolReport {
  if (row.status === "draft") {
    return {
      kind: "draft",
      photoKeys: row.photoKeys,
      checklistResults: row.checklistResults,
    };
  }
  if (row.body === null || row.generatedBy === null) {
    throw new Error(`reviewing状態なのにbody/generatedByがnullです: id=${row.id}`);
  }
  if (row.status === "reviewing") {
    return {
      kind: "reviewing",
      photoKeys: row.photoKeys,
      checklistResults: row.checklistResults,
      body: row.body,
      generatedBy: row.generatedBy,
    };
  }
  if (row.approvedAt === null) {
    throw new Error(`approvedAtがnullです: id=${row.id}`);
  }
  if (row.status === "approved") {
    return {
      kind: "approved",
      photoKeys: row.photoKeys,
      checklistResults: row.checklistResults,
      body: row.body,
      approvedAt: row.approvedAt,
    };
  }

  if (row.status === "sent") {
    if (row.sentAt === null) {
      throw new Error(`sentAtがnullです: id=${row.id}`);
    }
    return {
      kind: "sent",
      photoKeys: row.photoKeys,
      checklistResults: row.checklistResults,
      body: row.body,
      sentAt: row.sentAt,
    };
  }

  if (row.status === "failed") {
    if (row.failedReason === null) {
      throw new Error(`failedReasonがnullです: id=${row.id}`);
    }
    return {
      kind: "failed",
      photoKeys: row.photoKeys,
      checklistResults: row.checklistResults,
      body: row.body,
      error: row.failedReason,
    };
  }

  throw new Error(`予期しないstatusです: ${row.status}`);
}
