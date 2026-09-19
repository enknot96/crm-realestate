import { ReportId } from "../shared/branded";
import { Result } from "../shared/result";

export type ReserveSendError = { kind: "alreadySent" } | { kind: "repository"; message: string };

// 二重送信防止のDB制約
// patrol_report_sendsテーブルはreportIdをPKにしているため、
// 同じreportIdで2回目のreserveを呼ぶと主キー制約違反になり、alreadySentとして検知できる
export interface PatrolReportSendRepository {
  reserve(reportId: ReportId): Promise<Result<void, ReserveSendError>>;
}
