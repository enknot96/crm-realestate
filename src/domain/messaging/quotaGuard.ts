import { MessageLogRepository } from "./messageLogRepository";
import { ok, err, Result } from "../shared/result";

declare const guarded: unique symbol;
export type SendPermit = { readonly [guarded]: true; count: number };

type QuotaExceededError = { kind: "exceeded"; remainingMessages: number };
type RepositoryError = { kind: "repository"; message: string };
export type QuotaGuardError = QuotaExceededError | RepositoryError;

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
  const monthlyTotal = result.value + requestedCount;
  const remainingMessages = monthlyQuota - result.value;
  if (monthlyTotal > monthlyQuota) {
    return err({ kind: "exceeded", remainingMessages });
  } else {
    return ok({ count: requestedCount } as SendPermit);
  }
}
