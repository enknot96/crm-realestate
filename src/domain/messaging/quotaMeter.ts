import { MessageLogRepository } from "./messageLogRepository";
import { err, ok, Result } from "../shared/result";

// 画面上部に常設する通数メーター（INV-8: 「今月あと◯件送れます」）のための、
// 現時点で残っている送信可能件数を計算するだけの、小さな関数。
// QuotaGuard.reserve()は「これから送りたいn件が送れるか」を判定するのに対し、
// こちらは「いま何件残っているか」を表示するためだけに使う。
export async function getRemainingQuota(
  repo: MessageLogRepository,
  now: Date,
  monthlyQuota: number,
): Promise<Result<number, string>> {
  const result = await repo.countThisMonth(now);
  if (result.kind === "err") {
    return err(result.error);
  }
  // 実測値が上限を上回っていても、画面にマイナス件数は出さない
  return ok(Math.max(monthlyQuota - result.value, 0));
}
