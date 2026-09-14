import { messagingApi } from "@line/bot-sdk";
import { LineUserId } from "@/domain/shared/branded";
import { assertNever } from "@/domain/shared/assertNever";
import {
  MessageSender,
  MulticastFailure,
  MulticastSendResult,
  OutgoingMessage,
} from "@/domain/messaging/messageSender";
import { ok } from "@/domain/shared/result";

// LINEのmulticast APIは1回につき最大500ID
const MULTICAST_CHUNK_SIZE = 500;

// 実際に呼び出すLINE APIクライアントのうち、この実装が必要とする部分だけを取り出した型。
// multicastだけに依存を絞ることで、テスト時に実物の MessagingApiClient を作らずに
// Fakeなクライアント(multicastだけを実装したオブジェクト)を差し込める。
export type MulticastClient = Pick<messagingApi.MessagingApiClient, "multicast">;

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function toLineMessage(message: OutgoingMessage): messagingApi.Message {
  switch (message.kind) {
    case "text":
      return { type: "text", text: message.text };
    default:
      return assertNever(message.kind);
  }
}

function toFailureMessage(e: unknown): string {
  if (e instanceof Error) {
    // HTTPFetchError は status/body を持つが、Errorのmessageに要点が入っているためそれを使う
    return e.message;
  }
  return "LINEへの送信に失敗しました";
}

// @line/bot-sdk の multicast を使った MessageSender の実装。
// 500件を超える宛先はチャンク分割して複数回呼び出し、
// チャンク単位の失敗(ブロック済みユーザーを含むリクエスト全体の拒否等)を
// 例外を投げずに MulticastSendResult.failures として返す(INV-6)。
export function createLineMessageSender(client: MulticastClient): MessageSender {
  return {
    async sendMulticast(permit, userIds, message) {
      // SendPermitの型を要求すること自体がINV-1の強制であり、
      // 送信件数の許可判断は QuotaGuard.reserve 側で完結しているため、ここでは値を使わない。
      void permit;

      const lineMessage = toLineMessage(message);
      const succeededUserIds: LineUserId[] = [];
      const failures: MulticastFailure[] = [];

      for (const targetUserIds of chunk(userIds, MULTICAST_CHUNK_SIZE)) {
        if (targetUserIds.length === 0) continue;
        try {
          await client.multicast({ to: targetUserIds, messages: [lineMessage] });
          succeededUserIds.push(...targetUserIds);
        } catch (e) {
          failures.push({ targetUserIds, message: toFailureMessage(e) });
        }
      }

      const result: MulticastSendResult = { succeededUserIds, failures };
      return ok(result);
    },
  };
}

// 実際のLINEチャンネルに接続する MessagingApiClient を組み立てるための便利関数。
// channelAccessTokenの取得元(環境変数など)は呼び出し側(合成ルート)の責務とする。
export function createLineMessageSenderFromAccessToken(channelAccessToken: string): MessageSender {
  const client = new messagingApi.MessagingApiClient({ channelAccessToken });
  return createLineMessageSender(client);
}
