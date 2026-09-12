# データの流れ（DAL / Repositoryパターン）メモ

DBを触る処理は、どれも同じ5層の流れになっている。1回分かれば、他の処理（`create`, `update`, `remove`, `findUnlinked`, ...）も全部同じパターン。

## 5つの層と、それぞれの役割

```
① domain/customer/repository.ts        「約束（型）」だけを決める。実装は知らない
        ↓ CustomerRepositoryという型を使う
② domain/customer/customerService.ts   「ユースケース」を書く。repoの中身は知らないまま呼ぶ
        ↓ CustomerRepository型のrepoを引数として受け取るだけ（importしない）
③ infra/db/customerRepository.ts       「実際の実装」を書く。Drizzleで本物のSQLを書く
        （②とは繋がっていない。単独で「①の約束を守るオブジェクト」を作るだけ）
④ app/lib/customer.ts (DAL)            ②と③を「繋ぎ合わせる」。ここで初めて両方import
        ↓ customerService.xxx(drizzleCustomerRepository, ...) という形で呼ぶ
⑤ actions.ts / page.tsx                ④だけを呼ぶ。DBがDrizzleだということも知らない
```

**矢印の向きに注意**：①→②は「型」を使うだけの関係。②と③はお互いを知らない（依存していない）。④が両方を知っていて、繋ぎ合わせる役目を持つ。⑤は④しか知らない。

## 具体例：`linkLineFriend`（顧客とLINE友だちを紐付ける）で追う

### ① `domain/customer/repository.ts` — 約束を決める

```ts
export interface CustomerRepository {
  // ...
  linkLineFriend(id: CustomerId, lineUserId: LineUserId): Promise<Result<Customer, string>>;
}
```

「`linkLineFriend`という名前で、`CustomerId`と`LineUserId`を受け取り、`Promise<Result<Customer, string>>`を返す関数を持っていること」——これだけを決めている。中身はまだ無い。

### ② `domain/customer/customerService.ts` — ユースケースを書く（repoの中身は知らない）

```ts
export async function linkLineFriend(
  repo: CustomerRepository, // ← 型としてrepoを受け取るだけ。drizzleCustomerRepositoryをimportしていない
  id: CustomerId,
  lineUserId: LineUserId,
) {
  return repo.linkLineFriend(id, lineUserId); // repoの中身が何であっても、同じように呼べる
}
```

`repo`が本物のDBなのか、テスト用の偽物なのか、この関数は気にしていない。**この「気にしなくていい」状態こそが疎結合**。

### ③ `infra/db/customerRepository.ts` — 実際の実装（②とは無関係に存在する）

```ts
export const drizzleCustomerRepository: CustomerRepository = {
  // ...
  linkLineFriend: (id, lineUserId) => {
    return fromPromise(async () => {
      const rows = await db
        .update(customers)
        .set({ lineUserId })
        .where(eq(customers.id, id))
        .returning();
      // ...
    }, "顧客とLINE友だちの紐付けに失敗しました");
  },
};
```

ここで初めて「Drizzleを使う」「`UPDATE customers SET ...`をする」という**具体的な手段**が出てくる。①の約束（`CustomerRepository`型）を守っている、という点だけが②との繋がり。

### ④ `app/lib/customer.ts`（DAL） — ②と③を繋ぎ合わせる

```ts
import * as customerService from "@/domain/customer/customerService"; // ②
import { drizzleCustomerRepository } from "@/infra/db/customerRepository"; // ③

export const linkLineFriend = (id: CustomerId, lineUserId: LineUserId) =>
  customerService.linkLineFriend(drizzleCustomerRepository, id, lineUserId);
  //               ↑②の関数        ↑③の実装をここで渡す（依存性注入）
```

**この1行が全体のキモ**。「②のユースケース関数に、③の本物の実装を渡して実行する」という組み立てが、ここで初めて行われる。①〜③のどのファイルにも、この組み立てを行うコードは無い。

### ⑤ `actions.ts` / `page.tsx` — ④だけを呼ぶ

```ts
import { linkLineFriend } from "@/app/lib/customer"; // ④しか知らない

await linkLineFriend(customerId, lineUserId);
```

Server ActionやPage側は、Drizzleの存在も、`CustomerRepository`という型があることも、一切知らなくていい。「顧客とLINE友だちを紐付ける関数を呼んだら、なんかいい感じにやってくれる」というだけ。

## なぜこんなに分けるのか

- **②（ユースケース）は、DBが無くてもテストできる。** テスト時は③の代わりに「偽物のrepo」を②に渡せばいい
- **③（実装）を差し替えられる。** Drizzleを別のORMに変えても、②・⑤は無傷
- **①（型）が、②と③の「食い違い」を型エラーとして検出してくれる。** ③が①の約束を破ったら、その場でコンパイルエラーになる

## 他の処理も同じパターンで探せばいい

`findUnlinked`（LINE友だちの一覧取得）も、テーブルが違う（`line_friends`）だけで、5層の構造は全く同じ。

```
① domain/lineFriend/repository.ts       LineFriendRepository（型）
② （customerServiceに相当する層は今回は作っていない。DALから直接呼んでいる）
③ infra/db/lineFriendRepository.ts      drizzleLineFriendRepository（実装）
④ app/lib/lineFriend.ts                 ③をDALとして呼び出す（これから作る）
⑤ page.tsx                              ④を呼ぶ
```

迷ったときは「今どの層にいるか」「この層は何を知っていて、何を知らなくていいはずか」を、この表に当てはめて確認する。
