// CSVインポート/エクスポートで共通して使う列定義
// 列の並び順はヘッダー行の並び順と完全に一致していること

export const CSV_FIELD_KEYS = ["name", "phone", "email", "postalCode", "address", "memo"] as const;

export type CsvFieldKey = (typeof CSV_FIELD_KEYS)[number];

export const CSV_HEADERS: Record<CsvFieldKey, string> = {
  name: "名前",
  phone: "電話番号",
  email: "メール",
  postalCode: "郵便番号",
  address: "住所",
  memo: "メモ",
};

export const CSV_HEADER_ROW: string[] = CSV_FIELD_KEYS.map((key) => CSV_HEADERS[key]);
