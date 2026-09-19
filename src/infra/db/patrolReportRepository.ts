import { PatrolReportRepository } from "@/domain/report/repository";
import { getDb } from "./client";
import { desc, eq } from "drizzle-orm";
import { patrolReports } from "./schema";
import { fromPromise } from "@/domain/shared/result";

const db = getDb();

export const drizzlePatrolReportRepository: PatrolReportRepository = {
  create: (input) => {
    return fromPromise(async () => {
      const rows = await db
        .insert(patrolReports)
        .values({
          propertyId: input.propertyId,
          photoKeys: input.photoKeys,
          checklistResults: input.checklistResults,
          status: input.status,
          body: input.body,
          generatedBy: input.generatedBy,
        })
        .returning();
      if (rows[0] === undefined) {
        throw new Error("巡回報告の作成に失敗しました");
      }
      return rows[0];
    }, "巡回報告の作成に失敗しました");
  },
  findById: (id) => {
    return fromPromise(async () => {
      const rows = await db.select().from(patrolReports).where(eq(patrolReports.id, id));
      return rows[0] ?? null;
    }, "巡回報告の取得に失敗しました");
  },
  listByPropertyId: (propertyId) => {
    return fromPromise(async () => {
      return db
        .select()
        .from(patrolReports)
        .where(eq(patrolReports.propertyId, propertyId))
        .orderBy(desc(patrolReports.createdAt));
    }, "巡回報告一覧の取得に失敗しました");
  },
  updateBody: (id, body, generatedBy) => {
    return fromPromise(async () => {
      const rows = await db
        .update(patrolReports)
        .set({ body, generatedBy })
        .where(eq(patrolReports.id, id))
        .returning();
      if (rows[0] === undefined) {
        throw new Error("巡回報告の更新に失敗しました");
      }
      return rows[0];
    }, "巡回報告の更新に失敗しました");
  },
};
