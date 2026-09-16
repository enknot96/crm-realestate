import { Result } from "../shared/result";

// 送信が成功した件数を message_logs に記録するための、唯一の情報源
// インターフェースだけを定義する

export interface MessageLogWriter {
  writeLogs(count: number, sentAt: Date): Promise<Result<void, string>>;
}
