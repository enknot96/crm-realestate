import { MessageLogWriter } from "@/domain/messaging/messageLogWriter";
import { ok } from "@/domain/shared/result";

// DEMO_MODE用。実際にはDBへ書き込まず、常に成功したことにするだけの実装。
export const fakeMessageLogWriter: MessageLogWriter = {
  writeLogs: async () => ok(undefined),
};
