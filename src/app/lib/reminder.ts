import "server-only";

import { ContractId, PropertyId } from "@/domain/shared/branded";
import * as contractService from "@/domain/reminder/contractService";
import { dispatchDueReminders } from "@/domain/reminder/dispatchDueReminders";
import { EmailSender } from "@/domain/reminder/emailSender";
import { drizzleContractRepository } from "@/infra/db/contractRepository";
import { drizzleReminderNotificationRepository } from "@/infra/db/reminderNotificationRepository";
import { drizzlePropertyRepository } from "@/infra/db/propertyRepository";
import { createResendEmailSender } from "@/infra/email/resendEmailSender";
import { createFakeEmailSender } from "@/infra/fake/fakeEmailSender";
import { dispatchTodaysBroadcasts } from "./messaging";
import { env } from "@/config/env";
import type { CronPermit, SessionPermit } from "./auth";

// DEMO_MODEに応じて実装を切り替える src/domain側には if (DEMO_MODE) を書かない
const emailSender: EmailSender = env.DEMO_MODE
  ? createFakeEmailSender()
  : createResendEmailSender(env.RESEND_API_KEY);

export const listContractsByPropertyId = (_permit: SessionPermit, propertyId: PropertyId) =>
  contractService.listContractsByPropertyId(drizzleContractRepository, propertyId, new Date());

export const createContract = (
  _permit: SessionPermit,
  propertyId: PropertyId,
  input: unknown,
) => contractService.createContract(drizzleContractRepository, propertyId, input);

export const removeContract = (_permit: SessionPermit, id: ContractId) =>
  contractService.removeContract(drizzleContractRepository, id);

export const listRecentNotifications = (_permit: SessionPermit, limit: number) =>
  drizzleReminderNotificationRepository.listRecent(limit);

// cronエンドポイントから呼ばれる公開の入り口
// リマインド通知と、Phase3で実装済みの予約配信を同じタイミングでまとめて発火する
export const dispatchDailyReminders = async (permit: CronPermit, now: Date) => {
  const reminders = await dispatchDueReminders(
    {
      contractRepo: drizzleContractRepository,
      notificationRepo: drizzleReminderNotificationRepository,
      propertyRepo: drizzlePropertyRepository,
      emailSender,
    },
    now,
    env.NOTIFY_EMAIL_TO,
    env.APP_BASE_URL,
  );
  const broadcasts = await dispatchTodaysBroadcasts(permit, now);
  return { reminders, broadcasts };
};
