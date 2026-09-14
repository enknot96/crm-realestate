import { CustomerRepository } from "@/domain/customer/repository";
import { getDb } from "./client";
import { and, count, eq, isNull, sql } from "drizzle-orm";
import { customers, customerTags, lineFriends } from "./schema";
import { fromPromise } from "@/domain/shared/result";

const db = getDb();

// customers.phoneのUNIQUE制約（drizzleが自動生成した名前）に違反したかどうかを判定する
// drizzleが投げるエラーは、code(SQLSTATE)・constraint(制約名)を持つ元のNeonDbErrorを
// .causeとしてラップしているため、causeの方を見る必要がある
const PHONE_UNIQUE_CONSTRAINT = "customers_phone_unique";

function isPhoneUniqueViolation(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  const cause = e.cause instanceof Error ? e.cause : e;
  const { code, constraint } = cause as Error & { code?: string; constraint?: string };
  return code === "23505" && constraint === PHONE_UNIQUE_CONSTRAINT;
}

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
      try {
        // returning() = 挿入した行を返す
        const rows = await db.insert(customers).values(input).returning();
        if (rows[0] === undefined) {
          throw new Error("行の挿入に失敗しました"); // 想定内の以上
        }
        return rows[0];
      } catch (e) {
        if (isPhoneUniqueViolation(e)) {
          throw new Error("この電話番号はすでに登録されています");
        }
        throw e;
      }
      // 万が一、Errorですらない何かが投げられた場合
    }, "顧客情報の登録に失敗しました"); // 想定外の異常のときの保険文言
  },
  update: (id, input) => {
    return fromPromise(async () => {
      try {
        const rows = await db.update(customers).set(input).where(eq(customers.id, id)).returning();
        if (rows[0] === undefined) {
          throw new Error("行の更新に失敗しました");
        }
        return rows[0];
      } catch (e) {
        if (isPhoneUniqueViolation(e)) {
          throw new Error("この電話番号はすでに登録されています");
        }
        throw e;
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
  getTagIds: (id) => {
    return fromPromise(async () => {
      const rows = await db
        .select({ tagId: customerTags.tagId })
        .from(customerTags)
        .where(eq(customerTags.customerId, id));
      return rows.map((row) => row.tagId);
    }, "顧客のタグ取得に失敗しました");
  },
  // neon-httpドライバはトランザクションを未サポートのため、削除→挿入は別々のクエリになる
  setTags: (id, tagIds) => {
    return fromPromise(async () => {
      await db.delete(customerTags).where(eq(customerTags.customerId, id));
      if (tagIds.length > 0) {
        await db.insert(customerTags).values(tagIds.map((tagId) => ({ customerId: id, tagId })));
      }
      return undefined;
    }, "顧客のタグ更新に失敗しました");
  },
  listAll: () => {
    return fromPromise(async () => {
      return db.select().from(customers);
    }, "顧客一覧の取得に失敗しました");
  },
  listAllPhones: () => {
    return fromPromise(async () => {
      const rows = await db.select({ phone: customers.phone }).from(customers);
      return rows.map((row) => row.phone);
    }, "電話番号一覧の取得に失敗しました");
  },
  countSendableByTagId: (tagId) => {
    return fromPromise(async () => {
      // lineFriendsとのinner joinにより、lineUserIdが無い顧客は自動的に除外される。
      // さらにblockedAtがある(ブロック済み)友だちも除外する。ブロック済みにはLINEが
      // 実際には届かないため、INV-4が求める「宛先の実数」に含めない
      // (src/infra/db/lineFriendRepository.tsの未紐付け一覧と同じ方針)
      const rows = await db
        .select({ value: count() })
        .from(customers)
        .innerJoin(customerTags, eq(customers.id, customerTags.customerId))
        .innerJoin(lineFriends, eq(customers.lineUserId, lineFriends.lineUserId))
        .where(and(eq(customerTags.tagId, tagId), isNull(lineFriends.blockedAt)));
      return rows[0]?.value ?? 0;
    }, "タグ配信対象人数の取得に失敗しました");
  },
};
