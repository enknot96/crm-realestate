import { MessageLogRepository } from "./messageLogRepository";
import { err, ok, Result } from "../shared/result";

// 実測件数から「いま何件残っているか」を計算するだけの、副作用の無い部分。
// quotaGuard.evaluateQuota()と同じクランプ（マイナスにしない）をここでも行う。
export function remainingFromCount(currentCount: number, monthlyQuota: number): number {
  return Math.max(monthlyQuota - currentCount, 0);
}

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
  return ok(remainingFromCount(result.value, monthlyQuota));
}
