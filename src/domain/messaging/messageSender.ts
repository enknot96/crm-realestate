import { LineUserId } from "../shared/branded";
import { SendPermit } from "./quotaGuard";
import { err, ok, Result } from "../shared/result";

// ドメイン層で扱うメッセージ内容。LINEのFlex Message等を追加する場合はここにケースを増やす。
// (@line/bot-sdk の型をそのままドメインに漏らさないための、独自の最小限の表現)
// readonly: 記録・比較のために値を保持する側(FakeMessageSender等)が、
// 呼び出し元の書き換えに巻き込まれないことを型でも示す。
export type OutgoingMessage = { readonly kind: "text"; readonly text: string };

// 1回の送信呼び出し(チャンク)が失敗した際の情報。
// LINEのmulticast APIは、宛先の一部がブロック済みでも200を返すことがあり、
// それとは別に「チャンク単位の呼び出し自体が失敗した」ケースを区別して表現する。
//
// kind: 失敗の大まかな種類。画面に日本語で表示する文言は、この kind を見て
// app層(またはinfraの外側)で組み立てる。reason はログ用の詳細情報であり、
// LINE SDKが返す英語のエラー文がそのまま入ることがあるため、画面にそのまま出さない(INV-8)。
export type MulticastFailureKind = "rate_limited" | "network" | "unknown";

export type MulticastFailure = {
  // このエラーが発生したチャンクに含まれていた宛先(誰が届かなかったかを個別特定はできない)
  targetUserIds: LineUserId[];
  kind: MulticastFailureKind;
  // ログ・デバッグ用の詳細理由。人が読める日本語であることは保証しない。
  reason: string;
};

export type MulticastSendResult = {
  succeededUserIds: LineUserId[];
  failures: MulticastFailure[];
};

// permit(QuotaGuard.reserve()が発行した予約数)が、実際に送ろうとしている宛先数を
// カバーしていない場合のエラー。INV-1(QuotaGuardを経由しない送信を防ぐ)は、
// 「permitを持っているか」だけでなく「permitの予約数と送信数が一致しているか」まで
// 検証して初めて成立する。
export type PermitExceededError = {
  kind: "permitExceeded";
  requestedCount: number;
  permittedCount: number;
};

// メッセージの形式が送信先で扱えない場合のエラー。
// 現状 OutgoingMessage は "text" のみなのでコンパイル時に排除されるが、
// 将来DBの予約配信レコード等から復元された値がここに来ても、
// 例外を投げずにResultとして返せるようにしておく(INV-6)。
export type UnsupportedMessageError = {
  kind: "unsupportedMessage";
  detail: string;
};

export type MessageSenderError = PermitExceededError | UnsupportedMessageError;

// LINEの複数ユーザーへの一斉送信(multicast相当)を表現するインターフェース。
// permit(QuotaGuard.reserve が発行したSendPermit)を要求することで、
// QuotaGuardを経由しない送信呼び出しがコンパイルエラーになるようにする(INV-1)。
//
// ただし「permitを引数に要求する」だけではINV-1は守られない
// (permit.countとuserIds.lengthが無関係に呼べてしまう)ため、
// 実装は必ず checkPermitCoversTargets を通してから送信すること。
export interface MessageSender {
  sendMulticast(
    permit: SendPermit,
    userIds: LineUserId[],
    message: OutgoingMessage,
  ): Promise<Result<MulticastSendResult, MessageSenderError>>;
}

// permitが予約した件数(permit.count)が、実際に送ろうとしている宛先数以上であることを検証する。
// MessageSenderの各実装(Line/Fake)は、送信処理の本体に入る前に必ずこれを通す。
// QuotaGuard.reserve()自体は編集していないため、ここでの検証はあくまで
// 「渡されたpermitの中身と、渡された宛先数が矛盾していないか」というアプリ側の防御であり、
// QuotaGuardが行う月間上限チェックそのものを代替するものではない。
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
