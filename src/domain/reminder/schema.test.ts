import { describe, it, expect } from "vitest";
import { contractFormSchema } from "./schema";

describe("contractFormSchema", () => {
  it("YYYY-MM-DD形式なら成功し、JSTの0時として解釈する", () => {
    const result = contractFormSchema.safeParse({ contractDate: "2026-09-01" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contractDate).toEqual(new Date("2026-09-01T00:00:00+09:00"));
    }
  });

  it("空文字だと失敗する", () => {
    const result = contractFormSchema.safeParse({ contractDate: "" });

    expect(result.success).toBe(false);
  });

  it("YYYY-MM-DD以外の形式だと失敗する", () => {
    const result = contractFormSchema.safeParse({ contractDate: "2026/09/01" });

    expect(result.success).toBe(false);
  });
});
