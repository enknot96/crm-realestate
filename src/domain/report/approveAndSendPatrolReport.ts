import { LineUserId, ReportId } from "../shared/branded";
import { PatrolReportRepository, PatrolReportRow } from "./repository";
import { PatrolReportSendRepository } from "./patrolReportSendRepository";
import { PatrolReportMessageSender } from "./patrolReportMessageSender";
import { MessageLogRepository } from "../messaging/messageLogRepository";
import { reserve } from "../messaging/quotaGuard";
import { err, ok, Result } from "../shared/result";

type NotReviewingError = { kind: "notReviewing" };
type NoLineUserError = { kind: "noLineUser" };
type AlreadySentError = { kind: "alreadySent" };
type QuotaExceededError = { kind: "quotaExceeded"; remainingMessages: number };
type RepositoryError = { kind: "repository"; message: string };
type SendError = { kind: "send"; message: string };
export type ApproveAndSendError =
  | NotReviewingError
  | NoLineUserError
  | AlreadySentError
  | QuotaExceededError
  | RepositoryError
  | SendError;

// 承認とLINE送信を1つの操作としてまとめたユースケース
// 二重送信防止のreserve()を先に行ってから実際にLINEへ送るため、送信自体が失敗しても再送信はブロックされる
export async function approveAndSendPatrolReport(
  deps: {
    patrolReportRepo: PatrolReportRepository;
    patrolReportSendRepo: PatrolReportSendRepository;
    messageLogRepo: MessageLogRepository;
    messageSender: PatrolReportMessageSender;
    buildPhotoUrl: (photoKey: string) => Promise<string>;
  },
  report: PatrolReportRow,
  lineUserId: LineUserId | null,
  now: Date,
  monthlyQuota: number,
): Promise<Result<void, ApproveAndSendError>> {
  if (report.status !== "reviewing" || report.body === null) {
    return err({ kind: "notReviewing" });
  }
  if (lineUserId === null) {
    return err({ kind: "noLineUser" });
  }

  const reserveSendResult = await reserveSend(deps.patrolReportSendRepo, report.id);
  if (reserveSendResult.kind === "err") {
    return err(reserveSendResult.error);
  }

  const approveResult = await deps.patrolReportRepo.approve(report.id, now);
  if (approveResult.kind === "err") {
    return err({ kind: "repository", message: approveResult.error });
  }

  // 通数の消費は「テキスト1件 + 写真枚数」
  const requestedCount = 1 + report.photoKeys.length;
  const permitResult = await reserve(deps.messageLogRepo, now, requestedCount, monthlyQuota);
  if (permitResult.kind === "err") {
    if (permitResult.error.kind === "exceeded") {
      await deps.patrolReportRepo.markFailed(report.id, "今月の送信可能件数を超えています");
      return err({
        kind: "quotaExceeded",
        remainingMessages: permitResult.error.remainingMessages,
      });
    }
    await deps.patrolReportRepo.markFailed(report.id, permitResult.error.message);
    return err({ kind: "repository", message: permitResult.error.message });
  }

  const photoUrls = await Promise.all(report.photoKeys.map((key) => deps.buildPhotoUrl(key)));

  const sendResult = await deps.messageSender.sendReport(
    permitResult.value,
    lineUserId,
    report.body,
    photoUrls,
  );
  if (sendResult.kind === "err") {
    await deps.patrolReportRepo.markFailed(report.id, sendResult.error);
    return err({ kind: "send", message: sendResult.error });
  }

  const markSentResult = await deps.patrolReportRepo.markSent(report.id, now);
  if (markSentResult.kind === "err") {
    return err({ kind: "repository", message: markSentResult.error });
  }

  return ok(undefined);
}

async function reserveSend(
  repo: PatrolReportSendRepository,
  reportId: ReportId,
): Promise<Result<void, ApproveAndSendError>> {
  const result = await repo.reserve(reportId);
  if (result.kind === "err") {
    if (result.error.kind === "alreadySent") {
      return err({ kind: "alreadySent" });
    }
    return err({ kind: "repository", message: result.error.message });
  }
  return ok(undefined);
}
