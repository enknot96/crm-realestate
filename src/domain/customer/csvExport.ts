// 顧客一覧 → CSV文字列 という変換ロジック

import { stringify } from "csv-stringify/sync";
import { CSV_FIELD_KEYS, CSV_HEADER_ROW } from "./csvFields";
import { Customer } from "./repository";

// ExcelがUTF-8として自動認識できるよう、BOMを先頭に付与する
const UTF8_BOM = "﻿";

// セルの先頭が =+-@ だと、Excel/Sheetsで開いたときに数式として実行されてしまう（CSVインジェクション）
// 自由入力の住所・メモ欄にこれらの文字から始まる値が入り得るため、先頭に ' を付けて数式として解釈されないようにする
function sanitizeCsvCell(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

export function customersToCsv(customers: Customer[]): string {
  const rows = customers.map((customer) =>
    CSV_FIELD_KEYS.map((key) => {
      const value = customer[key];
      return sanitizeCsvCell(value ?? "");
    }),
  );

  const body = stringify([CSV_HEADER_ROW, ...rows]);
  return UTF8_BOM + body;
}
