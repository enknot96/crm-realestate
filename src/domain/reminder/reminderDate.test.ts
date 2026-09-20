import { describe, it, expect } from "vitest";
import { calculateNextBiweeklyReportDate, calculateNextQuarterlyRenewalDate } from "./reminderDate";

describe("calculateNextBiweeklyReportDate", () => {
  it("次の14日後の発火日がまだ来ていない場合、その日を返す", () => {
    const contractDate = new Date("2026-09-01T00:00:00+09:00");
    const now = new Date("2026-09-05T00:00:00+09:00");
    expect(calculateNextBiweeklyReportDate(contractDate, now)).toEqual(
      new Date("2026-09-15T00:00:00+09:00"),
    );
  });

  it("契約日当日は、契約日そのものを返す", () => {
    const contractDate = new Date("2026-09-01T00:00:00+09:00");
    const now = new Date("2026-09-01T00:00:00+09:00");
    expect(calculateNextBiweeklyReportDate(contractDate, now)).toEqual(
      new Date("2026-09-01T00:00:00+09:00"),
    );
  });

  it("ちょうど周期日(14日後)と一致する場合、その日を返す", () => {
    const contractDate = new Date("2026-09-01T00:00:00+09:00");
    const now = new Date("2026-09-15T00:00:00+09:00");
    expect(calculateNextBiweeklyReportDate(contractDate, now)).toEqual(
      new Date("2026-09-15T00:00:00+09:00"),
    );
  });

  it("複数周期が経過している場合、直近の未来(今日を含む)の発火日を返す", () => {
    // 9/1, 9/15, 9/29, 10/13, 10/27 ... の系列
    const contractDate = new Date("2026-09-01T00:00:00+09:00");
    const now = new Date("2026-10-10T00:00:00+09:00");
    expect(calculateNextBiweeklyReportDate(contractDate, now)).toEqual(
      new Date("2026-10-13T00:00:00+09:00"),
    );
  });
});

describe("calculateNextQuarterlyRenewalDate", () => {
  it("通常の月の場合、3ヶ月後の同じ日を返す", () => {
    const contractDate = new Date("2026-01-15T00:00:00+09:00");
    const now = new Date("2026-02-01T00:00:00+09:00");
    expect(calculateNextQuarterlyRenewalDate(contractDate, now)).toEqual(
      new Date("2026-04-15T00:00:00+09:00"),
    );
  });

  it("月末バグ：契約日が1/31の場合、3ヶ月後の4月は31日が無いため4/30に丸められる", () => {
    const contractDate = new Date("2026-01-31T00:00:00+09:00");
    const now = new Date("2026-02-01T00:00:00+09:00");
    expect(calculateNextQuarterlyRenewalDate(contractDate, now)).toEqual(
      new Date("2026-04-30T00:00:00+09:00"),
    );
  });

  it("うるう年：2024/11/29(うるう年)から3ヶ月後の2025年2月は28日までしかない", () => {
    const contractDate = new Date("2024-11-29T00:00:00+09:00");
    const now = new Date("2025-02-01T00:00:00+09:00");
    expect(calculateNextQuarterlyRenewalDate(contractDate, now)).toEqual(
      new Date("2025-02-28T00:00:00+09:00"),
    );
  });

  it("複数周期が経過している場合、直近の未来(今日を含む)の発火日を返す", () => {
    // 1/15, 4/15, 7/15, 10/15 ... の系列
    const contractDate = new Date("2026-01-15T00:00:00+09:00");
    const now = new Date("2026-08-01T00:00:00+09:00");
    expect(calculateNextQuarterlyRenewalDate(contractDate, now)).toEqual(
      new Date("2026-10-15T00:00:00+09:00"),
    );
  });
});
