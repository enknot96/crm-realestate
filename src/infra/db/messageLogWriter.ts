import { MessageLogWriter } from "@/domain/messaging/messageLogWriter";
import { getDb } from "./client";
import { fromPromise } from "@/domain/shared/result";
import { messageLogs } from "./schema";

const db = getDb();

export const drizzleMessageLogWriter: MessageLogWriter = {
  writeLogs: (count, sentAt) => {
    return fromPromise(async () => {
      await db.insert(messageLogs).values(Array.from({ length: count }, () => ({ sentAt })));
    }, "ログの記録に失敗しました");
  },
};
