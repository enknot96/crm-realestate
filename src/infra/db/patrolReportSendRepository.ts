import { PatrolReportSendRepository } from "@/domain/report/patrolReportSendRepository";
import { getDb } from "./client";
import { patrolReportSends } from "./schema";
import { err, ok } from "@/domain/shared/result";

const db = getDb();

const SEND_PK_CONSTRAINT = "patrol_report_sends_pkey";

// customerRepository.ts の isPhoneUniqueViolation と同じパターン
function isDuplicateSendViolation(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  const cause = e.cause instanceof Error ? e.cause : e;
  const { code, constraint } = cause as Error & { code?: string; constraint?: string };
  return code === "23505" && constraint === SEND_PK_CONSTRAINT;
}

export const drizzlePatrolReportSendRepository: PatrolReportSendRepository = {
  reserve: async (reportId) => {
    try {
      await db.insert(patrolReportSends).values({ reportId });
      return ok(undefined);
    } catch (e) {
      if (isDuplicateSendViolation(e)) {
        return err({ kind: "alreadySent" });
      }
      return err({
        kind: "repository",
        message: e instanceof Error ? e.message : "送信予約に失敗しました",
      });
    }
  },
};
