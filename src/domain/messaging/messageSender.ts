import { LineUserId } from "../shared/branded";
import { SendPermit } from "./quotaGuard";
import { err, ok, Result } from "../shared/result";

// ドメイン層で扱うメッセージ内容
export type OutgoingMessage = { readonly kind: "text"; readonly text: string };

// 1回の送信呼び出し(チャンク)が失敗した際の情報
// LINEのmulticast APIは、宛先の一部がブロック済みでも200を返すことがあり、
// それとは別に「チャンク単位の呼び出し自体が失敗した」ケースを区別して表現

// kind: 失敗の大まかな種類
// 画面に日本語で表示する文言は、このkindを見てapp層(またはinfraの外側)で組み立てる
export type MulticastFailureKind = "rate_limited" | "network" | "unknown";

export type MulticastFailure = {
  // このエラーが発生したチャンクに含まれていた宛先(誰が届かなかったかを個別特定はできない)
  targetUserIds: LineUserId[];
  kind: MulticastFailureKind;
  // ログ・デバッグ用
  reason: string;
};

export type MulticastSendResult = {
  succeededUserIds: LineUserId[];
  failures: MulticastFailure[];
};

// permit(QuotaGuard.reserve()が発行した予約数)が、実際に送ろうとしている宛先数をカバーしていない場合のエラー
// 「permitを持っているか」だけでなく「permitの予約数と送信数が一致しているか」まで検証して初めて成立する
export type PermitExceededError = {
  kind: "permitExceeded";
  requestedCount: number;
  permittedCount: number;
};

// メッセージの形式が送信先で扱えない場合のエラー
export type UnsupportedMessageError = {
  kind: "unsupportedMessage";
  detail: string;
};

export type MessageSenderError = PermitExceededError | UnsupportedMessageError;

// LINEの複数ユーザーへの一斉送信(multicast相当)を表現するインターフェース
// QuotaGuardを経由しない送信呼び出しがコンパイルエラーになるようにする
// 実装は必ず checkPermitCoversTargets を通してから送信する
export interface MessageSender {
  sendMulticast(
    permit: SendPermit,
    userIds: LineUserId[],
    message: OutgoingMessage,
  ): Promise<Result<MulticastSendResult, MessageSenderError>>;
}

// permitが予約した件数(permit.count)が、実際に送ろうとしている宛先数以上であることを検証
// MessageSenderの各実装(Line/Fake)は、送信処理の本体に入る前に必ずこれを通す
export function checkPermitCoversTargets(
  permit: SendPermit,
  requestedCount: number,
): Result<null, PermitExceededError> {
  if (requestedCount > permit.count) {
    return err({
      kind: "permitExceeded",
      requestedCount,
      permittedCount: permit.count,
    });
  }
  return ok(null);
}
