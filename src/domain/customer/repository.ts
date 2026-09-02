import { CustomerId, LineUserId } from "../shared/branded";
import { Result } from "../shared/result";
import { CustomerFormInput } from "./schema";

// 実際に存在する1人分の顧客情報が、どんなプロパティを持っているか
export type Customer = {
  id: CustomerId;
  name: string;
  phone: string;
  email: string | null;
  memo: string | null;
  postalCode: string | null;
  address: string | null;
  lineUserId: LineUserId | null;
  lastContactedAt: Date | null;
  createdAt: Date;
};

// 顧客データに対して何ができるか という関数の集まり
// 関数の「型（名前・引数・戻り値）」だけを決めている
export interface CustomerRepository {
  findById(id: CustomerId): Promise<Result<Customer | null, string>>;
  create(input: CustomerFormInput): Promise<Result<Customer, string>>;
  update(id: CustomerId, input: CustomerFormInput): Promise<Result<Customer, string>>;
  remove(id: CustomerId): Promise<Result<void, string>>;
  // 一覧画面に表示する顧客情報の1ページ分を取得する
  // どのページの、何件分を、どんなキーワードで絞り込んで欲しいか というリクエスト
  list(params: {
    query?: string;
    page: number;
    pageSize: number; // 1ページに何件表示するか
  }): Promise<Result<{ items: Customer[]; totalCount: number }, string>>;
}
