import { MessageLogRepository } from "@/domain/messaging/messageLogRepository";
import { getDb } from "./client";
import { and, count, gte, lt } from "drizzle-orm";
import { messageLogs } from "./schema";
import { fromPromise } from "@/domain/shared/result";

const db = getDb();

// UTCとJSTの9時間の差を（32,400秒 = 32,400,000ミリ秒）ミリ秒へ変換
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// now(実際のUTC上の瞬間)から、JSTでの「その月の開始」と「翌月の開始」を求める
// 1. +9時間して、UTCのgetterで読んだときにJSTの年月日が出るようにずらす
// 2. その年月から「月初」をUTC上で組み立てる
// 3. -9時間して、本当のUTC上の瞬間に戻す
function getJstMonthRange(now: Date): { start: Date; end: Date } {
  // 「now から9時間進んだ、ある1つの瞬間」を表すDateオブジェクト
  const shifted = new Date(now.getTime() + JST_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();

  const start = new Date(Date.UTC(year, month, 1) - JST_OFFSET_MS);
  const end = new Date(Date.UTC(year, month + 1, 1) - JST_OFFSET_MS);
  // start = 「now が属する月の、JSTでの1日 0:00」を表す、正しいUTC上の瞬間
  // end = 「その次の月の、JSTでの1日 0:00」を表す、正しいUTC上の瞬間
  return { start, end };
}

export const drizzleMessageLogRepository: MessageLogRepository = {
  countThisMonth: (now) => {
    return fromPromise(async () => {
      const { start, end } = getJstMonthRange(now);
      const rows = await db
        .select({ value: count() })
        .from(messageLogs)
        .where(and(gte(messageLogs.sentAt, start), lt(messageLogs.sentAt, end)));
      return rows[0]?.value ?? 0;
    }, "送信ログの取得に失敗しました");
  },
};
