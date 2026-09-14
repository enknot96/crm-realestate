import { MessageLogRepository } from "@/domain/messaging/messageLogRepository";
import { getDb } from "./client";
import { count, gte, lt } from "drizzle-orm";
import { messageLogs } from "./schema";
import { fromPromise } from "@/domain/shared/result";

const db = getDb();

export const drizzleMessageLogRepository: MessageLogRepository = {
  countThisMonth: (now) => {
    return fromPromise(async () => {}, "送信ログの取得に失敗しました");
  },
};
