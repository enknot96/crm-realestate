import { describe, it, expect } from "vitest";
import { propertyFormSchema } from "./schema";

describe("propertyFormSchema", () => {
  it("全項目が正しく入力されていれば成功する", () => {
    const result = propertyFormSchema.safeParse({
      name: "青葉荘",
      address: "東京都渋谷区34-21",
      structureType: "木造2階建て",
      floors: "2",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.floors).toBe(2);
    }
  });

  it("任意項目（address/structureType/floors）を省略しても成功する", () => {
    const result = propertyFormSchema.safeParse({
      name: "青葉荘",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.floors).toBeUndefined();
    }
  });

  it("nameが空文字だと失敗する", () => {
    const result = propertyFormSchema.safeParse({
      name: "",
    });

    expect(result.success).toBe(false);
  });

  it("floorsが数値以外の文字列だと失敗する", () => {
    const result = propertyFormSchema.safeParse({
      name: "青葉荘",
      floors: "二階",
    });

    expect(result.success).toBe(false);
  });

  it("floorsが空文字の場合はundefinedになる", () => {
    const result = propertyFormSchema.safeParse({
      name: "青葉荘",
      floors: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.floors).toBeUndefined();
    }
  });
});
