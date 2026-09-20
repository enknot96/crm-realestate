import { ReminderNotificationRepository } from "@/domain/reminder/reminderNotificationRepository";
import { getDb } from "./client";
import { desc, eq } from "drizzle-orm";
import { contracts, properties, reminderNotifications } from "./schema";
import { err, fromPromise, ok } from "@/domain/shared/result";

const db = getDb();

const NOTIFICATION_UNIQUE_CONSTRAINT =
  "reminder_notifications_contract_id_rule_type_occurrence_date_unique";

// customerRepository.ts の isPhoneUniqueViolation と同じパターン
function isDuplicateNotificationViolation(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  const cause = e.cause instanceof Error ? e.cause : e;
  const { code, constraint } = cause as Error & { code?: string; constraint?: string };
  return code === "23505" && constraint === NOTIFICATION_UNIQUE_CONSTRAINT;
}

export const drizzleReminderNotificationRepository: ReminderNotificationRepository = {
  record: async (input) => {
    try {
      const rows = await db
        .insert(reminderNotifications)
        .values({
          contractId: input.contractId,
          ruleType: input.ruleType,
          occurrenceDate: input.occurrenceDate,
        })
        .returning();
      if (rows[0] === undefined) {
        return err({ kind: "repository", message: "通知記録の作成に失敗しました" });
      }
      return ok(rows[0]);
    } catch (e) {
      if (isDuplicateNotificationViolation(e)) {
        return err({ kind: "alreadyNotified" });
      }
      return err({
        kind: "repository",
        message: e instanceof Error ? e.message : "通知記録の作成に失敗しました",
      });
    }
  },
  listRecent: (limit) => {
    return fromPromise(async () => {
      return db
        .select({
          id: reminderNotifications.id,
          contractId: reminderNotifications.contractId,
          ruleType: reminderNotifications.ruleType,
          occurrenceDate: reminderNotifications.occurrenceDate,
          notifiedAt: reminderNotifications.notifiedAt,
          propertyName: properties.name,
        })
        .from(reminderNotifications)
        .innerJoin(contracts, eq(reminderNotifications.contractId, contracts.id))
        .innerJoin(properties, eq(contracts.propertyId, properties.id))
        .orderBy(desc(reminderNotifications.notifiedAt))
        .limit(limit);
    }, "通知履歴の取得に失敗しました");
  },
};
