import { describe, it, expect } from "vitest";
import { MessageLogRepository } from "./messageLogRepository";
import { reserve } from "./quotaGuard";
import { ok } from "../shared/result";

// Fake実装: DBなしでQuotaGuardのロジックだけをテストする。
// countThisMonth は now を受け取るが、Fakeでは中身を見ずに固定件数を返せばよい
// (「日付境界の判定」はinfra側の実装がテストする範囲で、ここではQuotaGuardの
//  件数比較ロジックだけを検証したいため)。
function createFakeRepository(currentCount: number): MessageLogRepository {
  return {
    countThisMonth: async () => ok(currentCount),
  };
}

describe("reserve", () => {
  const monthlyQuota = 200;
  const now = new Date("2026-09-14T00:00:00+09:00");

  it("残り件数に余裕があれば SendPermit を発行する", async () => {
    // TODO: 例) 今月すでに100件送信済み、残り50件を予約 → ok になるはず
    // reserve(createFakeRepository(100), now, 50, monthlyQuota) の結果を検証する
  });

  it("ちょうど上限に達する場合（境界値）は許可する", async () => {
    // TODO: 現在件数 + requestedCount === monthlyQuota のケース
  });

  it("上限を1件でも超える場合（境界値）は拒否する", async () => {
    // TODO: 現在件数 + requestedCount === monthlyQuota + 1 のケース
  });

  it("リポジトリの取得に失敗した場合はエラーを返す", async () => {
    // TODO: countThisMonth が err(...) を返すFakeを用意して検証する
  });
});
