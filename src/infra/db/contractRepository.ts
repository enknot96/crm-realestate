import { ContractRepository } from "@/domain/reminder/contractRepository";
import { getDb } from "./client";
import { desc, eq } from "drizzle-orm";
import { contracts } from "./schema";
import { err, fromPromise, ok } from "@/domain/shared/result";

const db = getDb();

const PROPERTY_UNIQUE_CONSTRAINT = "contracts_property_id_unique";

function isDuplicatePropertyViolation(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  const cause = e.cause instanceof Error ? e.cause : e;
  const { code, constraint } = cause as Error & { code?: string; constraint?: string };
  return code === "23505" && constraint === PROPERTY_UNIQUE_CONSTRAINT;
}

export const drizzleContractRepository: ContractRepository = {
  create: async (input) => {
    try {
      const rows = await db
        .insert(contracts)
        .values({ propertyId: input.propertyId, contractDate: input.contractDate })
        .returning();
      if (rows[0] === undefined) {
        return err({ kind: "repository", message: "契約情報の登録に失敗しました" });
      }
      return ok(rows[0]);
    } catch (e) {
      if (isDuplicatePropertyViolation(e)) {
        return err({ kind: "duplicateProperty" });
      }
      return err({
        kind: "repository",
        message: e instanceof Error ? e.message : "契約情報の登録に失敗しました",
      });
    }
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
  remove: (id) => {
    return fromPromise(async () => {
      await db.delete(contracts).where(eq(contracts.id, id));
      return undefined;
    }, "契約情報の削除に失敗しました");
  },
};
