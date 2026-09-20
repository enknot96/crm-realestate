import "server-only";

// DAL 合成ルート
// 本物のDB実装(drizzleXxx)を使うか、Fake実装(fakeXxx)を使うかを 決める場所を1箇所に集める

import { TagId } from "@/domain/shared/branded";
import { getRemainingQuota as getRemainingQuotaUseCase } from "@/domain/messaging/quotaMeter";
import { previewBroadcast } from "@/domain/messaging/broadcastPreview";
import { confirmBroadcast } from "@/domain/messaging/broadcastConfirm";
import { previewScheduledBroadcast } from "@/domain/messaging/previewScheduledBroadcast";
import { scheduleBroadcast } from "@/domain/messaging/scheduleBroadcast";
import { dispatchDueBroadcasts } from "@/domain/messaging/broadcastDispatch";
import { MessageSender } from "@/domain/messaging/messageSender";
import { MessageLogWriter } from "@/domain/messaging/messageLogWriter";
import { drizzleTagRepository } from "@/infra/db/tagRepository";
import { drizzleCustomerRepository } from "@/infra/db/customerRepository";
import { drizzleMessageLogRepository } from "@/infra/db/messageLogRepository";
import { drizzleSegmentRepository } from "@/infra/db/segmentRepository";
import { drizzleMessageLogWriter } from "@/infra/db/messageLogWriter";
import { drizzleBroadcastRepository } from "@/infra/db/broadcastRepository";
import { createFakeMessageSender } from "@/infra/fake/fakeMessageSender";
import { fakeMessageLogWriter } from "@/infra/fake/messageLogWriter";
import { createLineMessageSenderFromAccessToken } from "@/infra/line/lineMessageSender";
import { env } from "@/config/env";
import { Result } from "@/domain/shared/result";
import type { CronPermit, SessionPermit } from "./auth";

// DEMO_MODEに応じて実装を切り替える src/domain側には if (DEMO_MODE) を書かない
const messageSender: MessageSender = env.DEMO_MODE
  ? createFakeMessageSender()
  : createLineMessageSenderFromAccessToken(env.LINE_CHANNEL_ACCESS_TOKEN);

const messageLogWriter: MessageLogWriter = env.DEMO_MODE
  ? fakeMessageLogWriter
  : drizzleMessageLogWriter;

const broadcastDeps = {
  tagRepo: drizzleTagRepository,
  customerRepo: drizzleCustomerRepository,
  messageLogRepo: drizzleMessageLogRepository,
  segmentRepo: drizzleSegmentRepository,
  messageSender,
  messageLogWriter,
};

export const getRemainingQuota = async (
  _permit: SessionPermit,
): Promise<Result<number, string>> => {
  return getRemainingQuotaUseCase(
    drizzleMessageLogRepository,
    new Date(),
    env.MONTHLY_MESSAGE_QUOTA,
  );
};

export const previewTagBroadcast = (_permit: SessionPermit, tagId: TagId, message: string) =>
  previewBroadcast(broadcastDeps, tagId, message, new Date(), env.MONTHLY_MESSAGE_QUOTA);

export const confirmTagBroadcast = (
  _permit: SessionPermit,
  tagId: TagId,
  typedTagName: string,
  message: string,
) =>
  confirmBroadcast(
    broadcastDeps,
    tagId,
    typedTagName,
    message,
    new Date(),
    env.MONTHLY_MESSAGE_QUOTA,
  );

export const previewScheduledTagBroadcast = (
  _permit: SessionPermit,
  tagId: TagId,
  message: string,
  scheduledAt: Date,
) =>
  previewScheduledBroadcast(
    broadcastDeps,
    tagId,
    message,
    scheduledAt,
    new Date(),
    env.MONTHLY_MESSAGE_QUOTA,
  );

export const scheduleTagBroadcast = (
  _permit: SessionPermit,
  tagId: TagId,
  typedTagName: string,
  message: string,
  scheduledAt: Date,
) =>
  scheduleBroadcast(
    { tagRepo: broadcastDeps.tagRepo, broadcastRepo: drizzleBroadcastRepository },
    tagId,
    typedTagName,
    message,
    scheduledAt,
    new Date(),
  );

// cron(/api/cron/reminders)から呼ばれる
// 予約時刻が来た配信を発火する
export const dispatchTodaysBroadcasts = (_permit: CronPermit, now: Date) =>
  dispatchDueBroadcasts(
    {
      broadcastRepo: drizzleBroadcastRepository,
      messageLogRepo: drizzleMessageLogRepository,
      segmentRepo: drizzleSegmentRepository,
      messageSender,
      messageLogWriter,
    },
    now,
    env.MONTHLY_MESSAGE_QUOTA,
  );
