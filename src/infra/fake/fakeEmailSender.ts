import { EmailSender } from "@/domain/reminder/emailSender";
import { ok } from "@/domain/shared/result";

export type FakeSentEmail = { to: string; subject: string; body: string };

// DEMO_MODE・テスト用。実際には送らず、呼び出し内容をメモリに記録するだけの実装
export interface FakeEmailSender extends EmailSender {
  readonly sentEmails: readonly FakeSentEmail[];
}

export function createFakeEmailSender(): FakeEmailSender {
  const sentEmails: FakeSentEmail[] = [];

  return {
    sentEmails,
    async send(to, subject, body) {
      sentEmails.push({ to, subject, body });
      return ok(undefined);
    },
  };
}
