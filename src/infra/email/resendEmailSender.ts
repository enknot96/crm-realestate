import { Resend } from "resend";
import { EmailSender } from "@/domain/reminder/emailSender";
import { err, ok } from "@/domain/shared/result";

// Resendのテスト用送信元アドレス
const FROM_ADDRESS = "onboarding@resend.dev";

export function createResendEmailSender(apiKey: string): EmailSender {
  const client = new Resend(apiKey);

  return {
    async send(to, subject, body) {
      const { error } = await client.emails.send({ from: FROM_ADDRESS, to, subject, text: body });
      if (error !== null) {
        return err({ kind: "send", message: error.message });
      }
      return ok(undefined);
    },
  };
}
