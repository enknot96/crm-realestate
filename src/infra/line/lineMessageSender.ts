import { messagingApi, HTTPFetchError } from "@line/bot-sdk";
import { LineUserId } from "@/domain/shared/branded";
import { chunk } from "@/domain/shared/chunk";
import {
  checkPermitCoversTargets,
  MessageSender,
  MulticastFailure,
  MulticastFailureKind,
  MulticastSendResult,
  OutgoingMessage,
} from "@/domain/messaging/messageSender";
import { err, ok, Result } from "@/domain/shared/result";

// LINEのmulticast APIは1回につき最大500ID
const MULTICAST_CHUNK_SIZE = 500;

// 実際に呼び出すLINE APIクライアントのうち、この実装が必要とする部分だけを取り出した型
export type MulticastClient = Pick<messagingApi.MessagingApiClient, "multicast">;

// OutgoingMessage を @line/bot-sdk の Message に変換
// OutgoingMessage は現状 "text" 種別のみで網羅的だが、assertNever(throw)は使わない
function toLineMessage(message: OutgoingMessage): Result<messagingApi.Message, string> {
  switch (message.kind) {
    case "text":
      return ok({ type: "text", text: message.text });
    default: {
      const unknownMessage: unknown = message;
      return err(`未対応のメッセージ種別です: ${JSON.stringify(unknownMessage)}`);
    }
  }
}

// 例外の内容から、失敗の大まかな種類(kind)とログ用の詳細理由(reason)を組み立てる
function classifyFailure(e: unknown): { kind: MulticastFailureKind; reason: string } {
  if (e instanceof HTTPFetchError) {
    if (e.status === 429) {
      return { kind: "rate_limited", reason: e.message };
    }
    return { kind: "network", reason: e.message };
  }
  if (e instanceof Error) {
    return { kind: "unknown", reason: e.message };
  }
  return { kind: "unknown", reason: "LINEへの送信に失敗しました" };
}

// @line/bot-sdk の multicast を使った MessageSender の実装
// 500件を超える宛先はチャンク分割して複数回呼び出し、
// チャンク単位の失敗(ブロック済みユーザーを含むリクエスト全体の拒否等)を例外を投げずに MulticastSendResult.failures として返す
export function createLineMessageSender(client: MulticastClient): MessageSender {
  return {
    async sendMulticast(permit, userIds, message) {
      // 予約した件数(permit.count)が実際に送ろうとしている宛先数をカバーしているかをここで検証
      // カバーしていない場合は、1件も multicast を呼び出さずに err を返す
      const permitCheck = checkPermitCoversTargets(permit, userIds.length);
      if (permitCheck.kind === "err") {
        return err(permitCheck.error);
      }

      const lineMessageResult = toLineMessage(message);
      if (lineMessageResult.kind === "err") {
        return err({ kind: "unsupportedMessage", detail: lineMessageResult.error });
      }
      const lineMessage = lineMessageResult.value;

      const succeededUserIds: LineUserId[] = [];
      const failures: MulticastFailure[] = [];

      for (const targetUserIds of chunk(userIds, MULTICAST_CHUNK_SIZE)) {
        try {
          await client.multicast({ to: targetUserIds, messages: [lineMessage] });
          succeededUserIds.push(...targetUserIds);
        } catch (e) {
          failures.push({ targetUserIds, ...classifyFailure(e) });
        }
      }

      const result: MulticastSendResult = { succeededUserIds, failures };
      return ok(result);
    },
  };
}

// 実際のLINEチャンネルに接続する MessagingApiClient を組み立てる
// channelAccessTokenの取得元(環境変数など)は呼び出し側(合成ルート)の責務とする
export function createLineMessageSenderFromAccessToken(channelAccessToken: string): MessageSender {
  const client = new messagingApi.MessagingApiClient({ channelAccessToken });
  return createLineMessageSender(client);
}
