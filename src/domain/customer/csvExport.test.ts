import { describe, it, expect } from "vitest";
import { parse } from "csv-parse/sync";
import { customersToCsv } from "./csvExport";
import { Customer } from "./repository";
import { CustomerId } from "../shared/branded";

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "customer-1" as CustomerId,
    name: "田中太郎",
    phone: "090-0000-1111",
    email: null,
    memo: null,
    postalCode: null,
    address: null,
    lineUserId: null,
    lastContactedAt: null,
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("customersToCsv", () => {
  it("先頭にUTF-8のBOMが付与される", () => {
    const csv = customersToCsv([makeCustomer()]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("ヘッダー行と顧客データが正しく出力される", () => {
    const csv = customersToCsv([
      makeCustomer({ name: "田中太郎", phone: "090-0000-1111", email: "tanaka@example.com" }),
      makeCustomer({ name: "鈴木花子", phone: "080-2222-3333" }),
    ]);

    const records = parse(csv.replace(/^﻿/, ""), { skip_empty_lines: true }) as string[][];

    expect(records[0]).toEqual(["名前", "電話番号", "メール", "郵便番号", "住所", "メモ"]);
    expect(records[1]).toEqual(["田中太郎", "090-0000-1111", "tanaka@example.com", "", "", ""]);
    expect(records[2]).toEqual(["鈴木花子", "080-2222-3333", "", "", "", ""]);
  });

  it("=+-@で始まる値はExcelで数式扱いされないよう先頭に'を付与する", () => {
    const csv = customersToCsv([
      makeCustomer({ memo: "=WEBSERVICE(\"http://evil\")", address: "+81-90-0000-1111" }),
    ]);

    const records = parse(csv.replace(/^﻿/, ""), { skip_empty_lines: true }) as string[][];

    expect(records[1]?.[4]).toBe("'+81-90-0000-1111");
    expect(records[1]?.[5]).toBe('\'=WEBSERVICE("http://evil")');
  });
});
