import { TagId } from "../shared/branded";
import { SendPermit } from "./quotaGuard";
import { err, Result } from "../shared/result";

export type SendBroadcastError = { kind: "notImplemented" };

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
  // ここでの詳細はサーバーログにだけ残す（画面には出さない）。実装が入ったら
  // MessageSender.multicast(...)の引数としてtagId/tagName/permit.countをそのまま使う想定。
  console.info(
    `[broadcastSender] notImplemented: tagId=${tagId} tagName=${tagName} count=${permit.count}`,
  );
  return err({ kind: "notImplemented" });
}
