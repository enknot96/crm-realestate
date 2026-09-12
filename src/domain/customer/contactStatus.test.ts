import { describe, it, expect } from "vitest";
import { isOverdue } from "./contactStatus";

describe("isOverdue", () => {
  const today = new Date("2026-03-01T00:00:00Z");

  it("lastContactedAtがnull（一度も接触していない）ならtrue", () => {
    expect(isOverdue(null, today, 30)).toBe(true);
  });

  it("ちょうどしきい値日数のとき（境界値）はtrue", () => {
    const lastContactedAt = new Date("2026-01-30T00:00:00Z"); // todayから30日前
    expect(isOverdue(lastContactedAt, today, 30)).toBe(true);
  });

  it("しきい値より1日短い（29日）ときはfalse", () => {
    const lastContactedAt = new Date("2026-01-31T00:00:00Z"); // todayから29日前
    expect(isOverdue(lastContactedAt, today, 30)).toBe(false);
  });

  it("しきい値より1日長い（31日）ときはtrue", () => {
    const lastContactedAt = new Date("2026-01-29T00:00:00Z"); // todayから31日前
    expect(isOverdue(lastContactedAt, today, 30)).toBe(true);
  });

  it("今日接触していれば（0日）false", () => {
    expect(isOverdue(today, today, 30)).toBe(false);
  });
});
