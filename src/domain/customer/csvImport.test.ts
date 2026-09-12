import { describe, it, expect } from "vitest";
import { buildImportPlan } from "./csvImport";

const HEADER = "名前,電話番号,メール,郵便番号,住所,メモ";

describe("buildImportPlan", () => {
  it("正常な行はすべてtoCreateに入る", () => {
    const csv = [
      HEADER,
      "田中太郎,090-0000-1111,tanaka@example.com,664-8989,東京都渋谷区1-1,感じの良い方",
      "鈴木花子,080-2222-3333,,,,",
    ].join("\n");

    const result = buildImportPlan(csv, new Set());

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.value.errors).toEqual([]);
    expect(result.value.toCreate).toHaveLength(2);
    expect(result.value.toCreate[0]?.input).toMatchObject({
      name: "田中太郎",
      phone: "090-0000-1111",
      email: "tanaka@example.com",
    });
    expect(result.value.toCreate[1]?.input).toMatchObject({
      name: "鈴木花子",
      phone: "080-2222-3333",
    });
  });

  it("ヘッダー行が想定と異なる場合はエラーを返す", () => {
    const csv = ["name,phone,email,postalCode,address,memo", "田中太郎,090-0000-1111,,,,"].join("\n");

    const result = buildImportPlan(csv, new Set());

    expect(result.kind).toBe("err");
    if (result.kind !== "err") return;
    expect(result.error).toContain("ヘッダー行");
  });

  it("名前が空の行は行番号付きのエラーになる", () => {
    const csv = [HEADER, ",090-0000-1111,,,,"].join("\n");

    const result = buildImportPlan(csv, new Set());

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.value.toCreate).toHaveLength(0);
    expect(result.value.errors).toEqual([{ line: 2, message: "2行目の名前が不正です" }]);
  });

  it("電話番号の形式が不正な行はエラーになる", () => {
    const csv = [HEADER, "田中太郎,090(0000)1111,,,,"].join("\n");

    const result = buildImportPlan(csv, new Set());

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.value.errors).toEqual([{ line: 2, message: "2行目の電話番号が不正です" }]);
  });

  it("既存顧客と電話番号が重複する行はエラーになる", () => {
    const csv = [HEADER, "田中太郎,090-0000-1111,,,,"].join("\n");

    const result = buildImportPlan(csv, new Set(["090-0000-1111"]));

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.value.toCreate).toHaveLength(0);
    expect(result.value.errors).toEqual([
      { line: 2, message: "2行目の電話番号（090-0000-1111）は既存の顧客と重複しています" },
    ]);
  });

  it("CSV内で電話番号が重複する場合、2件目以降がエラーになる", () => {
    const csv = [HEADER, "田中太郎,090-0000-1111,,,,", "田中次郎,090-0000-1111,,,,"].join("\n");

    const result = buildImportPlan(csv, new Set());

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.value.toCreate).toHaveLength(1);
    expect(result.value.toCreate[0]?.input.name).toBe("田中太郎");
    expect(result.value.errors).toEqual([
      { line: 3, message: "3行目の電話番号（090-0000-1111）はCSV内の2行目と重複しています" },
    ]);
  });

  it("メモにカンマや改行を含む行も引用符で正しく読み取れる", () => {
    const csv = [HEADER, '田中太郎,090-0000-1111,,,,"改行\nとカンマ,が入るメモ"'].join("\n");

    const result = buildImportPlan(csv, new Set());

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.value.errors).toEqual([]);
    expect(result.value.toCreate[0]?.input.memo).toBe("改行\nとカンマ,が入るメモ");
  });
});
