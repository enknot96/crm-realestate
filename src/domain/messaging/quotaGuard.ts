import { MessageLogRepository } from "./messageLogRepository";
import { ok, err, Result } from "../shared/result";

declare const guarded: unique symbol;
export type SendPermit = { readonly [guarded]: true; count: number };

type QuotaExceededError = { kind: "exceeded"; remainingMessages: number };
type RepositoryError = { kind: "repository"; message: string };
export type QuotaGuardError = QuotaExceededError | RepositoryError;

// 副作用（DBアクセス）を持たない判定ロジックだけを切り出したもの。
// 「いま何件送信済みで、これから何件送りたいか」から、送ってよいかどうかだけを判断する。
// reserve()（実際に送る前の許可）とquotaMeter.getRemainingQuota()（表示用の残数計算）の
// 両方から呼ばれる、この2つに共通の唯一の判定ロジック。
export function evaluateQuota(
  currentCount: number,
  requestedCount: number,
  monthlyQuota: number,
): { ok: true } | { ok: false; remainingMessages: number } {
  const monthlyTotal = currentCount + requestedCount;
  // 実測値が上限を上回っていても、画面にマイナス件数は出さない
  const remainingMessages = Math.max(monthlyQuota - currentCount, 0);
  if (monthlyTotal > monthlyQuota) {
    return { ok: false, remainingMessages };
  }
  return { ok: true };
}

export async function reserve(
  repo: MessageLogRepository,
  now: Date,
  requestedCount: number, // 今月新たに送りたい件数
  monthlyQuota: number, // 月間の上限
): Promise<Result<SendPermit, QuotaGuardError>> {
  const result = await repo.countThisMonth(now);
  if (result.kind === "err") {
    return err({ kind: "repository", message: result.error });
  }
  const evaluation = evaluateQuota(result.value, requestedCount, monthlyQuota);
  if (!evaluation.ok) {
    return err({ kind: "exceeded", remainingMessages: evaluation.remainingMessages });
  }
  return ok({ count: requestedCount } as SendPermit);
}
