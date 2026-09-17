import { Broadcast, BroadcastRepository, BroadcastStatus } from "@/domain/messaging/broadcastRepository";
import { getDb } from "./client";
import { and, eq, lte } from "drizzle-orm";
import { broadcasts } from "./schema";
import { fromPromise } from "@/domain/shared/result";

const db = getDb();

function toBroadcast(row: typeof broadcasts.$inferSelect): Broadcast {
  return {
    id: row.id,
    tagId: row.tagId,
    message: row.message,
    scheduledAt: row.scheduledAt,
    status: row.status as BroadcastStatus,
    createdAt: row.createdAt,
    sentAt: row.sentAt,
    sentCount: row.sentCount,
  };
}

export const drizzleBroadcastRepository: BroadcastRepository = {
  create: (input) => {
    return fromPromise(async () => {
      const rows = await db
        .insert(broadcasts)
        .values({
          tagId: input.tagId,
          message: input.message,
          scheduledAt: input.scheduledAt,
          status: "pending" satisfies BroadcastStatus,
        })
        .returning();
      if (rows[0] === undefined) {
        throw new Error("予約配信の作成に失敗しました");
      }
      return toBroadcast(rows[0]);
    }, "予約配信の作成に失敗しました");
  },
  findDuePending: (now) => {
    return fromPromise(async () => {
      const rows = await db
        .select()
        .from(broadcasts)
        .where(and(eq(broadcasts.status, "pending" satisfies BroadcastStatus), lte(broadcasts.scheduledAt, now)));
      return rows.map(toBroadcast);
    }, "予約配信の取得に失敗しました");
  },
  markSent: (id, sentAt, sentCount) => {
    return fromPromise(async () => {
      await db
        .update(broadcasts)
        .set({ status: "sent" satisfies BroadcastStatus, sentAt, sentCount })
        .where(eq(broadcasts.id, id));
    }, "予約配信の更新に失敗しました");
  },
  markFailed: (id) => {
    return fromPromise(async () => {
      await db.update(broadcasts).set({ status: "failed" satisfies BroadcastStatus }).where(eq(broadcasts.id, id));
    }, "予約配信の更新に失敗しました");
  },
};
