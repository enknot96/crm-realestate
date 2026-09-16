import { SegmentRepository } from "@/domain/messaging/segmentRepository";
import { getDb } from "./client";
import { and, eq, isNull } from "drizzle-orm";
import { customers, customerTags, lineFriends } from "./schema";
import { fromPromise } from "@/domain/shared/result";

const db = getDb();

export const drizzleSegmentRepository: SegmentRepository = {
  listLineUserIdsByTagId: (tagId) => {
    return fromPromise(async () => {
      // 顧客一覧の中から、指定されたタグが付いていて、かつLINEと連携済みで、かつブロックされていない人たちの、LINEユーザーIDを取得する
      const rows = await db
        .select({ lineUserId: lineFriends.lineUserId })
        .from(customers)
        // innerJoin = 一時的にcustomersテーブルと結合させる
        .innerJoin(customerTags, eq(customers.id, customerTags.customerId))
        .innerJoin(lineFriends, eq(customers.lineUserId, lineFriends.lineUserId))
        // where = 絞り込み
        .where(and(eq(customerTags.tagId, tagId), isNull(lineFriends.blockedAt)));
      return rows.map((row) => row.lineUserId);
    }, "配信対象の取得に失敗しました");
  },
};
