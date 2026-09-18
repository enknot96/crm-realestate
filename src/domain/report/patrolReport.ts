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
  throw new Error(`予期しないstatusです: ${row.status}`);
}
