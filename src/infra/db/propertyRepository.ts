import { PropertyRepository } from "@/domain/property/repository";
import { getDb } from "./client";
import { desc, eq } from "drizzle-orm";
import { properties } from "./schema";
import { fromPromise } from "@/domain/shared/result";

const db = getDb();

export const drizzlePropertyRepository: PropertyRepository = {
  listByCustomerId: (customerId) => {
    return fromPromise(async () => {
      return db
        .select()
        .from(properties)
        .where(eq(properties.customerId, customerId))
        .orderBy(desc(properties.createdAt));
    }, "物件一覧の取得に失敗しました");
  },
  create: (input) => {
    return fromPromise(async () => {
      const rows = await db
        .insert(properties)
        .values({
          customerId: input.customerId,
          name: input.name,
          address: input.address,
          structureType: input.structureType,
          floors: input.floors,
        })
        .returning();
      if (rows[0] === undefined) {
        throw new Error("物件の登録に失敗しました");
      }
      return rows[0];
    }, "物件の登録に失敗しました");
  },
};
