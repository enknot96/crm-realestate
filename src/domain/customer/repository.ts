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
    sortOrder?: "asc" | "desc";
  }): Promise<Result<{ items: Customer[]; totalCount: number }, string>>;
  // 未紐付けの友だちを実際に紐付ける
  linkLineFriend(id: CustomerId, lineUserId: LineUserId): Promise<Result<Customer, string>>;
  // 「未紐付けLINE友だち一覧」画面の中で使う<select>（プルダウン）用のデータを取得する関数
  listAllForSelect(): Promise<Result<{ id: CustomerId; name: string }[], string>>;
  markContacted(id: CustomerId): Promise<Result<Customer, string>>;
}
