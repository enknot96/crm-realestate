import { LineUserId } from "@/domain/shared/branded";
import {
  checkPermitCoversTargets,
  MessageSender,
  MulticastSendResult,
  OutgoingMessage,
} from "@/domain/messaging/messageSender";
import { err, ok } from "@/domain/shared/result";

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
      // INV-1: Fake実装であっても、permitの予約数(permit.count)と実際の宛先数が
      // 食い違う呼び出しは本物のLineMessageSenderと同じく拒否する。
      // ここを素通りさせると、デモモードでだけ許可上限を超えた送信が「成功」してしまう。
      const permitCheck = checkPermitCoversTargets(permit, userIds.length);
      if (permitCheck.kind === "err") {
        return err(permitCheck.error);
      }

      // messageは現状プリミティブのみのオブジェクトだが、記録後に呼び出し側が
      // 書き換えても履歴に影響しないよう、宛先配列と同様に浅いコピーを保持する。
      sentMulticasts.push({ userIds: [...userIds], message: { ...message } });

      const result: MulticastSendResult = {
        succeededUserIds: [...userIds],
        failures: [],
      };
      return ok(result);
    },
  };
}
