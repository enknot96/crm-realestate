import { MessageLogRepository } from "@/domain/messaging/messageLogRepository";
import { ok } from "@/domain/shared/result";

// TODO: message_logsテーブル（実DB）はまだ存在しない。
// LINE送信機能（MessageSender、別worktreeで実装中）が完成し、実際に送信結果を
// message_logsへ記録できるようになったら、src/infra/db/messageLogRepository.ts
// （Drizzle実装）を新規作成してこちらと差し替えること。
// 差し替え対象はDAL（src/app/lib/messaging.ts）でのDI箇所のみで済むはず。
//
// このFakeは常に「今月の送信実績は0件」を返す。
// 実送信がまだ実装されていないため、これで実態と矛盾しない。
export const fakeMessageLogRepository: MessageLogRepository = {
  countThisMonth: async () => ok(0),
};
