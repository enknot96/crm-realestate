import { describe, it, expect } from "vitest";
import { customerFormSchema } from "./schema";

describe("customerFormSchema", () => {
  it("全項目が正しく入力されていれば成功する", () => {
    const result = customerFormSchema.safeParse({
      name: "田中太郎",
      phone: "090-0000-2323",
      email: "test@gmail.com",
      postalCode: "664-8989",
      address: "東京都渋谷区34-21",
      memo: "感じの良いご主人",
    });

    expect(result.success).toBe(true);
  });

  it("任意項目（email/postalCode/address/memo）を省略しても成功する", () => {
    const result = customerFormSchema.safeParse({
      name: "田中美鈴",
      phone: "080-3434-2222",
    });

    expect(result.success).toBe(true);
  });

  it("nameが空文字だと失敗する", () => {
    const result = customerFormSchema.safeParse({
      name: "",
      phone: "09087877777",
    });

    expect(result.success).toBe(false);
  });

  it("phoneに数字・ハイフン以外の文字が含まれていると失敗する", () => {
    const result = customerFormSchema.safeParse({
      name: "鈴木正一",
      phone: "090~2345=6565",
    });

    expect(result.success).toBe(false);
  });

  it("emailの形式が不正だと失敗する", () => {
    const result = customerFormSchema.safeParse({
      name: "テスト太郎",
      phone: "090-4545-4545",
      email: "testpo09ddx",
    });

    expect(result.success).toBe(false);
  });
});
