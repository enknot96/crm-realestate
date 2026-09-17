import { PropertyId, ReportId } from "../shared/branded";
import { ChecklistResult } from "./checklistItems";
import { Result } from "../shared/result";

// DBの生の行データ
// 判別可能ユニオンとしての PatrolReport への変換は patrolReport.ts で行う
export type PatrolReportRow = {
  id: ReportId;
  propertyId: PropertyId;
  photoKeys: string[];
  checklistResults: ChecklistResult[];
  status: string;
  body: string | null;
  generatedBy: string | null;
  createdAt: Date;
};

export type CreatePatrolReportInput = {
  propertyId: PropertyId;
  photoKeys: string[];
  checklistResults: ChecklistResult[];
  status: string;
  body: string | null;
  generatedBy: string | null;
};

// 約束（この型の関数名で、この型の引数名をもらう）だけを決めている
export interface PatrolReportRepository {
  create(input: CreatePatrolReportInput): Promise<Result<PatrolReportRow, string>>;
  updateBody(
    id: ReportId,
    body: string,
    generatedBy: string,
  ): Promise<Result<PatrolReportRow, string>>;
}
