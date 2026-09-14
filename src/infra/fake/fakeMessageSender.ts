import { LineUserId } from "@/domain/shared/branded";
import {
  MessageSender,
  MulticastSendResult,
  OutgoingMessage,
} from "@/domain/messaging/messageSender";
import { ok } from "@/domain/shared/result";

// FakeMessageSenderが実際に「送信した」1回分の呼び出し内容
export type FakeSentMulticast = {
  userIds: LineUserId[];
  message: OutgoingMessage;
};

// DEMO_MODE用。LINEには実際に送らず、呼び出し内容をメモリに記録するだけの実装。
// sentMulticasts を通じて、テストや画面(LINEプレビューペイン)から送信履歴を確認できる。
export interface FakeMessageSender extends MessageSender {
  readonly sentMulticasts: readonly FakeSentMulticast[];
}

export function createFakeMessageSender(): FakeMessageSender {
  const sentMulticasts: FakeSentMulticast[] = [];

  return {
    sentMulticasts,
    async sendMulticast(permit, userIds, message) {
      // SendPermitの型を要求すること自体がINV-1の強制であり、
      // Fake実装では中身(件数)を検証する必要はないため使用しない。
      void permit;

      sentMulticasts.push({ userIds: [...userIds], message });

      const result: MulticastSendResult = {
        succeededUserIds: [...userIds],
        failures: [],
      };
      return ok(result);
    },
  };
}
