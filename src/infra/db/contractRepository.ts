import { ContractRepository } from "@/domain/reminder/contractRepository";
import { getDb } from "./client";
import { desc, eq } from "drizzle-orm";
import { contracts } from "./schema";
import { fromPromise } from "@/domain/shared/result";

const db = getDb();

export const drizzleContractRepository: ContractRepository = {
  create: (input) => {
    return fromPromise(async () => {
      const rows = await db
        .insert(contracts)
        .values({ propertyId: input.propertyId, contractDate: input.contractDate })
        .returning();
      if (rows[0] === undefined) {
        throw new Error("契約情報の登録に失敗しました");
      }
      return rows[0];
    }, "契約情報の登録に失敗しました");
  },
  listByPropertyId: (propertyId) => {
    return fromPromise(async () => {
      return db
        .select()
        .from(contracts)
        .where(eq(contracts.propertyId, propertyId))
        .orderBy(desc(contracts.contractDate));
    }, "契約情報の取得に失敗しました");
  },
  listAll: () => {
    return fromPromise(async () => {
      return db.select().from(contracts);
    }, "契約情報の取得に失敗しました");
  },
};
