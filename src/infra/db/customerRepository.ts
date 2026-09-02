import { CustomerRepository } from "@/domain/customer/repository";
import { getDb } from "./client";
import { count, eq } from "drizzle-orm";
import { customers } from "./schema";
import { err, ok } from "@/domain/shared/result";

const db = getDb();

export const drizzleCustomerRepository: CustomerRepository = {
  findById: async (id) => {
    // 引数のidと一致する、customersテーブル内のidの行をrowsに格納する
    const rows = await db.select().from(customers).where(eq(customers.id, id));
    return ok(rows[0] ?? null);
  },
  // 引数inputの型 = CustomerFormInputで定義している値が入っている
  create: async (input) => {
    // returning() = 挿入した行を返す
    const rows = await db.insert(customers).values(input).returning();
    if (rows[0] === undefined) {
      return err("行の挿入に失敗しました");
    } else {
      return ok(rows[0]);
    }
  },
  update: async (id, input) => {
    const rows = await db.update(customers).set(input).where(eq(customers.id, id)).returning();
    if (rows[0] === undefined) {
      return err("行の更新に失敗しました");
    } else {
      return ok(rows[0]);
    }
  },
  remove: async (id) => {
    await db.delete(customers).where(eq(customers.id, id));
    return ok(undefined);
  },
  // 一覧画面に表示する顧客情報の1ページ分を取得する
  // どのページの、何件分を、どんなキーワードで絞り込んで欲しいか というリクエスト
  list: async (params) => {
    const offset = (params.page - 1) * params.pageSize;
    // limit(...) = 最大...件しか返さないでください という指定（上限）
    // offset(20)→先頭から20件を読み飛ばす / limit(20)→そこから最大20件だけ取得する
    const rows = await db.select().from(customers).limit(params.pageSize).offset(offset);
    // 一覧画面には「全50件中、21〜40件目を表示中」「次へボタンを押せるか」を表示したい
    // そのため、「絞り込み条件に該当する、全体の件数」を別途知る必要があります
    const totalRows = await db.select({ values: count() }).from(customers);
    // totalCountの型はnumberのため、undefinedでエラーがでないよう、?? 0 と定義する
    return ok({ items: rows, totalCount: totalRows[0]?.values ?? 0 });
  },
};
