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

// MessageLogRepositoryの実DB実装(message_logsテーブル)はまだ存在しないため、Fakeで代替する。
// src/infra/fake/messageLogRepository.tsのTODO参照。
const broadcastDeps = {
  tagRepo: drizzleTagRepository,
  customerRepo: drizzleCustomerRepository,
  messageLogRepo: fakeMessageLogRepository,
};

export const getRemainingQuota = () =>
  getRemainingQuotaUseCase(fakeMessageLogRepository, new Date(), env.MONTHLY_MESSAGE_QUOTA);

export const previewTagBroadcast = (tagId: TagId) =>
  previewBroadcast(broadcastDeps, tagId, new Date(), env.MONTHLY_MESSAGE_QUOTA);

export const confirmTagBroadcast = (tagId: TagId, typedTagName: string) =>
  confirmBroadcast(broadcastDeps, tagId, typedTagName, new Date(), env.MONTHLY_MESSAGE_QUOTA);
