// actions.tsから「バリデーション前の生のフォームデータ」を受け取り、
// schema.tsのcustomerFormSchemaで検証してからrepositoryを呼ぶ、という役割
import { z } from "zod";
import { CustomerId, LineUserId } from "../shared/branded";
import { Customer, CustomerRepository } from "./repository";
import { customerFormSchema } from "./schema";
import { err, Result } from "../shared/result";

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
