import { describe, it, expect } from "vitest";
import { MessageLogRepository } from "./messageLogRepository";
import { getRemainingQuota, remainingFromCount } from "./quotaMeter";
import { ok, err } from "../shared/result";

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

describe("remainingFromCount", () => {
  it("上限から実測値を引いた件数を返す", () => {
    expect(remainingFromCount(150, 200)).toBe(50);
  });

  it("実測値が0件なら上限そのものを返す", () => {
    expect(remainingFromCount(0, 200)).toBe(200);
  });

  it("実測値が上限と同じならちょうど0を返す", () => {
    expect(remainingFromCount(200, 200)).toBe(0);
  });

  it("実測値が上限を超えていてもマイナスにならない（0にクランプ）", () => {
    expect(remainingFromCount(210, 200)).toBe(0);
  });
});

describe("getRemainingQuota", () => {
  const now = new Date("2026-09-14T00:00:00+09:00");
  const monthlyQuota = 200;

  it("残り件数を計算して返す", async () => {
    const result = await getRemainingQuota(createFakeRepository(150), now, monthlyQuota);

    expect(result).toEqual(ok(50));
  });

  it("リポジトリの取得に失敗した場合はエラーを返す", async () => {
    const result = await getRemainingQuota(
      createFailingFakeRepository("DB接続エラー"),
      now,
      monthlyQuota,
    );

    expect(result).toEqual(err("DB接続エラー"));
  });
});
