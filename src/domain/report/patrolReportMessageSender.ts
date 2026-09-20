import { LineUserId } from "../shared/branded";
import { SendPermit } from "../messaging/quotaGuard";
import { Result } from "../shared/result";

// messaging/messageSender.tsのMessageSender(複数人への一斉配信)とは違い、こちらは「1人に、テキスト1件+写真N件」を送る
// QuotaGuardのSendPermitは共通で再利用
export interface PatrolReportMessageSender {
  sendReport(
    permit: SendPermit,
    userId: LineUserId,
    body: string,
    photoUrls: string[],
  ): Promise<Result<void, string>>;
}
