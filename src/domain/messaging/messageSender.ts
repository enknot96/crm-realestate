import { LineUserId } from "../shared/branded";
import { SendPermit } from "./quotaGuard";
import { Result } from "../shared/result";

// ドメイン層で扱うメッセージ内容。LINEのFlex Message等を追加する場合はここにケースを増やす。
// (@line/bot-sdk の型をそのままドメインに漏らさないための、独自の最小限の表現)
export type OutgoingMessage = { kind: "text"; text: string };

// 1回の送信呼び出し(チャンク)が失敗した際の情報。
// LINEのmulticast APIは、宛先の一部がブロック済みでも200を返すことがあり、
// それとは別に「チャンク単位の呼び出し自体が失敗した」ケースを区別して表現する。
export type MulticastFailure = {
  // このエラーが発生したチャンクに含まれていた宛先(誰が届かなかったかを個別特定はできない)
  targetUserIds: LineUserId[];
  // 人が読める失敗理由
  message: string;
};

export type MulticastSendResult = {
  succeededUserIds: LineUserId[];
  failures: MulticastFailure[];
};

// LINEの複数ユーザーへの一斉送信(multicast相当)を表現するインターフェース。
// permit(QuotaGuard.reserve が発行したSendPermit)を要求することで、
// QuotaGuardを経由しない送信呼び出しがコンパイルエラーになるようにする(INV-1)。
export interface MessageSender {
  sendMulticast(
    permit: SendPermit,
    userIds: LineUserId[],
    message: OutgoingMessage,
  ): Promise<Result<MulticastSendResult, string>>;
}
