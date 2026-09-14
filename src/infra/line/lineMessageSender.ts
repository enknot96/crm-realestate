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

// 実際に呼び出すLINE APIクライアントのうち、この実装が必要とする部分だけを取り出した型。
// multicastだけに依存を絞ることで、テスト時に実物の MessagingApiClient を作らずに
// Fakeなクライアント(multicastだけを実装したオブジェクト)を差し込める。
export type MulticastClient = Pick<messagingApi.MessagingApiClient, "multicast">;

// OutgoingMessage を @line/bot-sdk の Message に変換する。
// OutgoingMessage は現状 "text" 種別のみで網羅的だが、assertNever(throw)は使わない。
// 将来DBの予約配信レコード等から復元された未知の値がここに来ても、
// 例外を投げずにResultとして返すため(INV-6: infraの境界で例外を外に漏らさない)。
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

// 例外の内容から、失敗の大まかな種類(kind)とログ用の詳細理由(reason)を組み立てる。
// kindは画面表示文言を組み立てる側(app層)が日本語に変換するための材料であり、
// reasonはSDKの生エラー文をそのまま保持するログ用の情報(画面にそのまま出さない=INV-8)。
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

// @line/bot-sdk の multicast を使った MessageSender の実装。
// 500件を超える宛先はチャンク分割して複数回呼び出し、
// チャンク単位の失敗(ブロック済みユーザーを含むリクエスト全体の拒否等)を
// 例外を投げずに MulticastSendResult.failures として返す(INV-6)。
export function createLineMessageSender(client: MulticastClient): MessageSender {
  return {
    async sendMulticast(permit, userIds, message) {
      // INV-1: permitを引数に要求するだけでなく、予約した件数(permit.count)が
      // 実際に送ろうとしている宛先数をカバーしているかをここで検証する。
      // カバーしていない場合は、1件も multicast を呼び出さずに err を返す。
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

      // TODO(将来対応): xLineRetryKey を渡していないため、ネットワークタイムアウト等で
      // 実際には配信済みなのに例外を受け取り、呼び出し側が同じ宛先へ再送すると
      // 二重送信・通数の二重消費が起こりうる。冪等キーの発行・永続化(再試行時に同じキーを
      // 再利用する仕組み)には呼び出し側の設計変更が必要なため、今回のスコープでは見送る。
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

// 実際のLINEチャンネルに接続する MessagingApiClient を組み立てるための便利関数。
// channelAccessTokenの取得元(環境変数など)は呼び出し側(合成ルート)の責務とする。
export function createLineMessageSenderFromAccessToken(channelAccessToken: string): MessageSender {
  const client = new messagingApi.MessagingApiClient({ channelAccessToken });
  return createLineMessageSender(client);
}
