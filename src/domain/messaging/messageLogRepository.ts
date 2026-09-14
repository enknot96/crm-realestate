import { Result } from "../shared/result";

// QuotaGuard が「今月あと何通送れるか」を判断するために必要な、唯一の情報源
// 実装(DBアクセス)は src/infra側
// ここではインターフェースだけを定義し、QuotaGuard 自身は DB の存在を知らない状態にする
export interface MessageLogRepository {
  countThisMonth(now: Date): Promise<Result<number, string>>;
}
