"use server";

import { importCustomersFromCsv } from "@/app/lib/customer";
import { CsvRowError } from "@/domain/customer/csvImport";

export type ImportActionState =
  | { kind: "success"; successCount: number; errors: CsvRowError[] }
  | { kind: "error"; message: string }
  | null;

export async function importCustomersAction(
  prevState: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { kind: "error", message: "CSVファイルを選択してください" };
  }

  const content = await file.text();
  const result = await importCustomersFromCsv(content);
  if (result.kind === "err") {
    return { kind: "error", message: result.error };
  }

  return { kind: "success", ...result.value };
}
