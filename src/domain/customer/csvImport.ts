// CSVの文字列 → 検証済みの登録データ という変換ロジック
// React/Nextにも、DBにも依存しない純粋な関数群（テストしやすくするため）

import { parse } from "csv-parse/sync";
import { z } from "zod";
import { err, ok, Result } from "../shared/result";
import { customerFormSchema, CustomerFormInput } from "./schema";
import { CSV_FIELD_KEYS, CSV_HEADERS, CSV_HEADER_ROW, CsvFieldKey } from "./csvFields";

export type CsvRowError = { line: number; message: string };

export type CsvImportPlan = {
  // 実際にDBへ登録する対象（元のCSVの行番号も一緒に持っておく。DB登録失敗時に行番号を伝えるため）
  toCreate: { line: number; input: CustomerFormInput }[];
  errors: CsvRowError[];
};

// customerFormSchemaのフィールド名 → 画面に表示する日本語ラベル
const FIELD_LABELS: Record<string, string> = CSV_HEADERS;

// CSVの空文字列は、必須項目以外は「未入力」として扱う（emailなどはz.email().optional()が""を許容しないため）
const OPTIONAL_FIELDS: CsvFieldKey[] = ["email", "postalCode", "address", "memo"];

function toFormInput(row: Record<CsvFieldKey, string>): unknown {
  const input: Record<string, string | undefined> = {};
  for (const key of CSV_FIELD_KEYS) {
    const value = row[key]?.trim() ?? "";
    input[key] = value === "" && OPTIONAL_FIELDS.includes(key) ? undefined : value;
  }
  return input;
}

function headerMatches(header: string[]): boolean {
  return (
    header.length === CSV_HEADER_ROW.length && header.every((cell, i) => cell === CSV_HEADER_ROW[i])
  );
}

// CSV全体を1行ごとの登録データ／エラーに振り分ける
// dbPhones: すでにDBに登録済みの電話番号（重複チェック用）
export function buildImportPlan(
  content: string,
  dbPhones: ReadonlySet<string>,
): Result<CsvImportPlan, string> {
  let rawRows: string[][];
  try {
    rawRows = parse(content, {
      bom: true,
      trim: true,
      skip_empty_lines: true,
    }) as string[][];
  } catch {
    return err("CSVの読み込みに失敗しました。ファイルの形式を確認してください。");
  }

  const header = rawRows[0];
  if (header === undefined) {
    return err("CSVにデータがありません。");
  }
  const dataRows = rawRows.slice(1);

  if (!headerMatches(header)) {
    return err(
      `CSVのヘッダー行（1行目）が正しくありません。「${CSV_HEADER_ROW.join(",")}」の順番で入力してください。`,
    );
  }

  const toCreate: CsvImportPlan["toCreate"] = [];
  const errors: CsvRowError[] = [];
  // CSV内で同じ電話番号が何行目に最初に登場したかを記録する（DB上の重複とCSV内の重複を区別してメッセージを出すため）
  const csvPhoneFirstLine = new Map<string, number>();

  dataRows.forEach((cols, index) => {
    // ヘッダー行が1行目なので、データ行はline 2から始まる
    const line = index + 2;
    const row = Object.fromEntries(
      CSV_FIELD_KEYS.map((key, i) => [key, cols[i] ?? ""]),
    ) as Record<CsvFieldKey, string>;

    const phone = row.phone.trim();
    if (phone !== "") {
      if (dbPhones.has(phone)) {
        errors.push({ line, message: `${line}行目の電話番号（${phone}）は既存の顧客と重複しています` });
        return;
      }
      const firstLine = csvPhoneFirstLine.get(phone);
      if (firstLine !== undefined) {
        errors.push({
          line,
          message: `${line}行目の電話番号（${phone}）はCSV内の${firstLine}行目と重複しています`,
        });
        return;
      }
    }

    const parsed = customerFormSchema.safeParse(toFormInput(row));
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error);
      const firstField = Object.keys(flat.fieldErrors)[0];
      const label = firstField ? (FIELD_LABELS[firstField] ?? firstField) : "入力内容";
      errors.push({ line, message: `${line}行目の${label}が不正です` });
      return;
    }

    if (phone !== "") {
      csvPhoneFirstLine.set(phone, line);
    }
    toCreate.push({ line, input: parsed.data });
  });

  return ok({ toCreate, errors });
}
