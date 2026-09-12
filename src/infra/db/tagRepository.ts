import { TagRepository } from "@/domain/tag/repository";
import { getDb } from "./client";
import { count, eq } from "drizzle-orm";
import { customerTags, tags } from "./schema";
import { fromPromise } from "@/domain/shared/result";

const db = getDb();

export const drizzleTagRepository: TagRepository = {
  list: () => {
    return fromPromise(async () => {
      return db.select().from(tags);
    }, "タグ一覧の取得に失敗しました");
  },
  create: (name) => {
    return fromPromise(async () => {
      const rows = await db.insert(tags).values({ name }).returning();
      if (rows[0] === undefined) {
        throw new Error("タグの作成に失敗しました");
      }
      return rows[0];
    }, "タグの作成に失敗しました");
  },
  remove: (id) => {
    return fromPromise(async () => {
      // 削除前に、このタグを使っている顧客がいないか確認する
      const usage = await db
        .select({ value: count() })
        .from(customerTags)
        .where(eq(customerTags.tagId, id));
      if ((usage[0]?.value ?? 0) > 0) {
        throw new Error("このタグは顧客に使われているため削除できません");
      }
      await db.delete(tags).where(eq(tags.id, id));
      return undefined;
    }, "タグの削除に失敗しました");
  },
};
