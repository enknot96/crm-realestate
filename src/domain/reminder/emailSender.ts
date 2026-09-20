import { Result } from "../shared/result";

export type EmailSenderError = { kind: "send"; message: string };

// リマインド通知のメール送信を表現するインターフェース
export interface EmailSender {
  send(to: string, subject: string, body: string): Promise<Result<void, EmailSenderError>>;
}
