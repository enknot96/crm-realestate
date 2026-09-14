import "server-only";

// DAL

import { TagId } from "@/domain/shared/branded";
import { getRemainingQuota as getRemainingQuotaUseCase } from "@/domain/messaging/quotaMeter";
import { previewBroadcast } from "@/domain/messaging/broadcastPreview";
import { confirmBroadcast } from "@/domain/messaging/broadcastConfirm";
import { drizzleTagRepository } from "@/infra/db/tagRepository";
import { drizzleCustomerRepository } from "@/infra/db/customerRepository";
import { fakeMessageLogRepository } from "@/infra/fake/messageLogRepository";
import { env } from "@/config/env";
import { err, Result } from "@/domain/shared/result";

const broadcastDeps = {
  tagRepo: drizzleTagRepository,
  customerRepo: drizzleCustomerRepository,
  messageLogRepo: fakeMessageLogRepository,
};

const MESSAGE_LOG_TRACKING_READY = false;

export const getRemainingQuota = async (): Promise<Result<number, string>> => {
  if (!MESSAGE_LOG_TRACKING_READY) {
    return err("送信実績の集計機能は準備中のため、確認できません");
  }
  return getRemainingQuotaUseCase(fakeMessageLogRepository, new Date(), env.MONTHLY_MESSAGE_QUOTA);
};

export const previewTagBroadcast = (tagId: TagId) =>
  previewBroadcast(broadcastDeps, tagId, new Date(), env.MONTHLY_MESSAGE_QUOTA);

export const confirmTagBroadcast = (tagId: TagId, typedTagName: string) =>
  confirmBroadcast(broadcastDeps, tagId, typedTagName, new Date(), env.MONTHLY_MESSAGE_QUOTA);
