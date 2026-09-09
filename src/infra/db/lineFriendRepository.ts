import { LineFriendRepository } from "@/domain/lineFriend/repository";
import { getDb } from "./client";
import { fromPromise } from "@/domain/shared/result";
import { customers, lineFriends } from "./schema";
import { and, eq, isNull } from "drizzle-orm";

const db = getDb();

export const drizzleLineFriendRepository: LineFriendRepository = {
  findUnlinked: () => {
    return fromPromise(async () => {
      const rows = await db
        .select({
          lineUserId: lineFriends.lineUserId,
          displayName: lineFriends.displayName,
          followedAt: lineFriends.followedAt,
          blockedAt: lineFriends.blockedAt,
        })
        // 未紐付けのLINE友だち一覧を表示したい
        .from(lineFriends)
        // customers側のlineUserId列の値と、lineFriends側のlineUserId列の値が等しい行同士をつなげる
        .leftJoin(customers, eq(customers.lineUserId, lineFriends.lineUserId))
        // 連結した行のcustomers.idがnullかどうか → nullであればtrue = idが紐づけされていない
        // 連結した行のlineFriends.blockedAtがnullかどうか → nullであればtrue → ブロックされていないから一覧に表示したい
        .where(and(isNull(customers.id), isNull(lineFriends.blockedAt)));
      return rows;
    }, "未紐づけの友だち一覧の取得に失敗しました");
  },
};
