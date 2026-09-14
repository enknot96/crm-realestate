import { TagId } from "../shared/branded";
import { SendPermit } from "./quotaGuard";
import { err, Result } from "../shared/result";

export type SendBroadcastError = { kind: "notImplemented"; message: string };

// TODO(feature/quota-ui): 実際にLINEへ送信する MessageSender は、別のworktreeで並行実装中。
// (仕様書 セクション3「アーキテクチャ」の依存性逆転の方針どおり、
//  LineMessageSender / FakeMessageSender をここでDIする想定)
//
// 実装が揃ったら、このsendBroadcastMessages関数の中身だけを、
// MessageSender.multicast(...)を呼ぶ実装に差し替える。
// 呼び出し側（confirmBroadcast）のシグネチャ・Result型は変えなくてよい設計にしてある。
//
// 引数にSendPermitを要求しているのはINV-1のため：
// QuotaGuard.reserve()を経由していない呼び出しはコンパイルエラーになる。
export async function sendBroadcastMessages(
  permit: SendPermit,
  tagId: TagId,
  tagName: string,
): Promise<Result<{ sentCount: number }, SendBroadcastError>> {
  // 未実装であることを明示するため、あえて何も送信せずにエラーを返す。
  // （投げっぱなしのthrowにしないのはINV-6：外部送信の失敗はResult型で表現する方針に揃えるため）
  return err({
    kind: "notImplemented",
    message: `LINE送信機能は現在準備中です（送信予定: 「${tagName}」タグ ${permit.count}名 / タグID ${tagId}）。しばらくしてからもう一度お試しください。`,
  });
}
