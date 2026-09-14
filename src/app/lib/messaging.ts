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

// MessageLogRepositoryの実DB実装(message_logsテーブル)はまだ存在しないため、Fakeで代替する。
// src/infra/fake/messageLogRepository.tsのTODO参照。
const broadcastDeps = {
  tagRepo: drizzleTagRepository,
  customerRepo: drizzleCustomerRepository,
  messageLogRepo: fakeMessageLogRepository,
};

// fakeMessageLogRepositoryは常に「今月の送信実績は0件」を返す。この値をそのまま
// 「今月あと200件送れます」のように断定表示すると、実際には確認できていない数字を
// 事実として見せることになり、INV-4/INV-8（誤送信を防ぐための正確な情報提示）の趣旨に反する。
// 実DB実装（message_logsテーブル、別worktreeで並行実装中）に差し替えたら、この定数をtrueにする。
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
