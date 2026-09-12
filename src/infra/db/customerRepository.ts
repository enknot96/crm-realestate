import { CustomerRepository } from "@/domain/customer/repository";
import { getDb } from "./client";
import { count, eq, sql } from "drizzle-orm";
import { customers } from "./schema";
import { fromPromise } from "@/domain/shared/result";

const db = getDb();

export const drizzleCustomerRepository: CustomerRepository = {
  findById: (id) => {
    // ヘルパー関数でラップする
    return fromPromise(async () => {
      // 引数のidと一致する、customersテーブル内のidの行をrowsに格納する
      const rows = await db.select().from(customers).where(eq(customers.id, id));
      return rows[0] ?? null;
    }, "顧客情報の取得に失敗しました");
  },
  // 引数inputの型 = CustomerFormInputで定義している値が入っている
  create: (input) => {
    return fromPromise(async () => {
      // returning() = 挿入した行を返す
      const rows = await db.insert(customers).values(input).returning();
      if (rows[0] === undefined) {
        throw new Error("行の挿入に失敗しました"); // 想定内の以上
      } else {
        return rows[0];
      }
      // 万が一、Errorですらない何かが投げられた場合
    }, "顧客情報の登録に失敗しました"); // 想定外の異常のときの保険文言
  },
  update: (id, input) => {
    return fromPromise(async () => {
      const rows = await db.update(customers).set(input).where(eq(customers.id, id)).returning();
      if (rows[0] === undefined) {
        throw new Error("行の更新に失敗しました");
      } else {
        return rows[0];
      }
    }, "顧客情報の更新に失敗しました");
  },
  remove: (id) => {
    return fromPromise(async () => {
      await db.delete(customers).where(eq(customers.id, id));
      return undefined;
    }, "顧客情報の削除に失敗しました");
  },
  // 一覧画面に表示する顧客情報の1ページ分を取得する
  // どのページの、何件分を、どんなキーワードで絞り込んで欲しいか というリクエスト
  list: (params) => {
    return fromPromise(async () => {
      const offset = (params.page - 1) * params.pageSize;
      // params.sortOrderが"desc"なら「DESC NULLS LAST」、それ以外（デフォルト）なら「ASC NULLS FIRST」
      const orderByClause =
        params.sortOrder === "desc"
          ? sql`${customers.lastContactedAt} DESC NULLS LAST`
          : sql`${customers.lastContactedAt} ASC NULLS FIRST`;
      // limit(...) = 最大...件しか返さないでください という指定（上限）
      // offset(20)→先頭から20件を読み飛ばす / limit(20)→そこから最大20件だけ取得する
      const rows = await db
        .select()
        .from(customers)
        .orderBy(orderByClause)
        .limit(params.pageSize)
        .offset(offset);
      // 一覧画面には「全50件中、21〜40件目を表示中」「次へボタンを押せるか」を表示したい
      // そのため、「絞り込み条件に該当する、全体の件数」を別途知る必要があります
      const totalRows = await db.select({ values: count() }).from(customers);
      // totalCountの型はnumberのため、undefinedでエラーがでないよう、?? 0 と定義する
      return { items: rows, totalCount: totalRows[0]?.values ?? 0 };
    }, "ページ情報の取得に失敗しました");
  },
  // 引数のid = どの顧客を更新したいか、呼び出し元から渡されてくる値
  linkLineFriend: (id, lineUserId) => {
    return fromPromise(async () => {
      const rows = await db
        .update(customers)
        .set({ lineUserId })
        .where(eq(customers.id, id))
        .returning();
      if (rows[0] === undefined) {
        throw new Error("行の更新に失敗しました");
      } else {
        return rows[0];
      }
    }, "顧客情報とLine IDの紐づけに失敗しました");
  },
  listAllForSelect: () => {
    return fromPromise(async () => {
      return db.select({ id: customers.id, name: customers.name }).from(customers);
    }, "顧客一覧の取得に失敗しました");
  },
  // 顧客idを引数にとり、顧客との接触日時を記録する
  markContacted: (id) => {
    return fromPromise(async () => {
      const rows = await db
        .update(customers)
        .set({ lastContactedAt: new Date() })
        .where(eq(customers.id, id))
        .returning();
      if (rows[0] === undefined) {
        throw new Error("行の更新に失敗しました");
      } else {
        return rows[0];
      }
    }, "接触記録の更新に失敗しました");
  },
};
