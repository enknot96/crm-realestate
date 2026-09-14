import { describe, it, expect } from "vitest";
import { MessageLogRepository } from "./messageLogRepository";
import { reserve } from "./quotaGuard";
import { ok, err } from "../shared/result";

// Fake実装: DBなしでQuotaGuardのロジックだけをテストする。
// countThisMonth は now を受け取るが、Fakeでは中身を見ずに固定件数を返せばよい
// (「日付境界の判定」はinfra側の実装がテストする範囲で、ここではQuotaGuardの
//  件数比較ロジックだけを検証したいため)。
function createFakeRepository(currentCount: number): MessageLogRepository {
  return {
    countThisMonth: async () => ok(currentCount),
  };
}

function createFailingFakeRepository(message: string): MessageLogRepository {
  return {
    countThisMonth: async () => err(message),
  };
}

describe("reserve", () => {
  const monthlyQuota = 200;
  const now = new Date("2026-09-14T00:00:00+09:00");

  it("残り件数に余裕があれば SendPermit を発行する", async () => {
    // 今月すでに100件送信済み、残り50件を予約 → 100 + 50 = 150 <= 200
    const result = await reserve(createFakeRepository(100), now, 50, monthlyQuota);

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.value.count).toBe(50);
    }
  });

  it("ちょうど上限に達する場合（境界値）は許可する", async () => {
    // 150 + 50 = 200（monthlyQuotaと同値。超えてはいないので許可）
    const result = await reserve(createFakeRepository(150), now, 50, monthlyQuota);

    expect(result.kind).toBe("ok");
  });

  it("上限を1件でも超える場合（境界値）は拒否する", async () => {
    // 150 + 51 = 201（monthlyQuotaを1件超える）
    const result = await reserve(createFakeRepository(150), now, 51, monthlyQuota);

    expect(result.kind).toBe("err");
    if (result.kind === "err") {
      expect(result.error.kind).toBe("exceeded");
      if (result.error.kind === "exceeded") {
        expect(result.error.remainingMessages).toBe(50); // 200 - 150
      }
    }
  });

  it("リポジトリの取得に失敗した場合はエラーを返す", async () => {
    const result = await reserve(
      createFailingFakeRepository("DB接続エラー"),
      now,
      10,
      monthlyQuota,
    );

    expect(result.kind).toBe("err");
    if (result.kind === "err") {
      expect(result.error.kind).toBe("repository");
      if (result.error.kind === "repository") {
        expect(result.error.message).toBe("DB接続エラー");
      }
    }
  });
});
