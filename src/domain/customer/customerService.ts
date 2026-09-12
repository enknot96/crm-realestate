// actions.tsから「バリデーション前の生のフォームデータ」を受け取り、
// schema.tsのcustomerFormSchemaで検証してからrepositoryを呼ぶ、という役割
import { z } from "zod";
import { CustomerId, LineUserId, TagId } from "../shared/branded";
import { Customer, CustomerRepository } from "./repository";
import { customerFormSchema } from "./schema";
import { err, ok, Result } from "../shared/result";
import { buildImportPlan, CsvRowError } from "./csvImport";
import { customersToCsv } from "./csvExport";

// ユーザーの入力が間違っている
type ValidationError = { kind: "validation"; fieldErrors: Record<string, string[]> };
// ユーザーの入力は正しいが、DB操作・保存の段階で失敗した
type RepositoryError = { kind: "repository"; message: string };
export type CustomerServiceError = ValidationError | RepositoryError;

export async function getCustomerById(repo: CustomerRepository, id: CustomerId) {
  return repo.findById(id);
}

// 外部から来たデータは信用できない → input: unknown → zodで検証
export async function createCustomer(
  repo: CustomerRepository,
  input: unknown,
  // if文の中から返ってくるエラーとrepo.create()から返ってくるエラー
  // この2つが本当に同じ形（CustomerServiceError）であることを保証する必要がある
): Promise<Result<Customer, CustomerServiceError>> {
  const parsed = customerFormSchema.safeParse(input);
  // safeParse()が返すオブジェクト = { success: true, data: 検証済みのデータ }
  if (!parsed.success) {
    // バリデーション失敗
    // z.flattenError(...) → formErrorsとfieldErrorsという定型の2つのキーを返す
    // fieldErrors：個別のフィールド（name, phoneなど）に対するエラー
    // formErrors：特定のフィールドに紐付かない、フォーム全体に対するエラー
    const flat = z.flattenError(parsed.error);
    return err({ kind: "validation", fieldErrors: flat.fieldErrors });
  } else {
    // DB操作の失敗
    const result = await repo.create(parsed.data);
    if (result.kind === "err") {
      return err({ kind: "repository", message: result.error });
    }
    return result;
  }
}

export async function updateCustomer(
  repo: CustomerRepository,
  id: CustomerId,
  input: unknown,
): Promise<Result<Customer, CustomerServiceError>> {
  const parsed = customerFormSchema.safeParse(input);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return err({ kind: "validation", fieldErrors: flat.fieldErrors });
  } else {
    const result = await repo.update(id, parsed.data);
    if (result.kind === "err") {
      return err({ kind: "repository", message: result.error });
    }
    return result;
  }
}

export async function removeCustomer(repo: CustomerRepository, id: CustomerId) {
  return repo.remove(id);
}

export async function listPages(
  repo: CustomerRepository,
  params: {
    query?: string;
    page: number;
    pageSize: number;
    sortOrder?: "asc" | "desc";
  },
) {
  return repo.list(params);
}

export async function linkLineFriend(
  repo: CustomerRepository,
  id: CustomerId,
  lineUserId: LineUserId,
) {
  return repo.linkLineFriend(id, lineUserId);
}

export async function listAllForSelect(repo: CustomerRepository) {
  return repo.listAllForSelect();
}

export async function markContacted(repo: CustomerRepository, id: CustomerId) {
  return repo.markContacted(id);
}

export async function getTagIds(repo: CustomerRepository, id: CustomerId) {
  return repo.getTagIds(id);
}

export async function setTags(repo: CustomerRepository, id: CustomerId, tagIds: TagId[]) {
  return repo.setTags(id, tagIds);
}

export type CsvImportSummary = { successCount: number; errors: CsvRowError[] };

export async function importCustomersFromCsv(
  repo: CustomerRepository,
  content: string,
): Promise<Result<CsvImportSummary, string>> {
  const phonesResult = await repo.listAllPhones();
  if (phonesResult.kind === "err") {
    return err(phonesResult.error);
  }

  const planResult = buildImportPlan(content, new Set(phonesResult.value));
  if (planResult.kind === "err") {
    return err(planResult.error);
  }

  const { toCreate, errors } = planResult.value;
  let successCount = 0;

  for (const { line, input } of toCreate) {
    const result = await repo.create(input);
    if (result.kind === "err") {
      errors.push({ line, message: `${line}行目「${input.name}」の登録に失敗しました` });
    } else {
      successCount++;
    }
  }

  errors.sort((a, b) => a.line - b.line);

  return ok({ successCount, errors });
}

export async function exportCustomersToCsv(
  repo: CustomerRepository,
): Promise<Result<string, string>> {
  const result = await repo.listAll();
  if (result.kind === "err") {
    return err(result.error);
  }
  return ok(customersToCsv(result.value));
}
