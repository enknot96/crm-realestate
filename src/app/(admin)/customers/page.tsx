import Link from "next/link";
import { listPages } from "@/app/lib/customer";

const PAGE_SIZE = 20;

export default async function CustomersPage(props: PageProps<"/customers">) {
  const searchParams = await props.searchParams;

  // ブラウザが/customers?q=田中&page=2へGETでアクセスする
  // → Next.jsがそのURLを解析してprops.searchParamsという箱にすでに詰めて渡してくる
  // → awaitでその中身を取り出す」
  const query = typeof searchParams.q === "string" ? searchParams.q : undefined;
  const page = searchParams.page ? Number(searchParams.page) : 1;

  const result = await listPages({ query, page, pageSize: PAGE_SIZE });

  if (result.kind === "err") {
    return <p className="p-4 text-red-600">{result.error}</p>;
  }

  const { items, totalCount } = result.value;
  // totalCount と PAGE_SIZE から、全部で何ページあるかを計算する
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">顧客一覧</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/customers/line-friends"
            className="font-bold text-brand-teal hover:text-brand-navy"
          >
            LINEお友だちの紐付け
          </Link>
          <Link
            href="/customers/new"
            className="cursor-pointer rounded-lg bg-brand-teal px-4 py-2 font-bold text-white hover:bg-brand-navy"
          >
            新規登録
          </Link>
        </div>
      </div>

      <form className="rounded-lg border border-gray-200 bg-white p-3">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="名前で検索"
          className="w-full rounded border border-gray-300 p-2"
        />
      </form>

      <table className="w-full border-collapse rounded-lg border border-gray-200 bg-white text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="p-3">名前</th>
            <th className="p-3">電話番号</th>
            <th className="p-3">LINE</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((customer) => (
            <tr
              key={customer.id}
              className="border-b border-gray-100 last:border-0"
            >
              <td className="p-3">{customer.name}</td>
              <td className="p-3">{customer.phone}</td>
              <td className="p-3">
                {customer.lineUserId ? (
                  <span className="rounded-full bg-brand-mint/20 px-2 py-0.5 text-xs font-bold text-brand-navy">
                    連携済み
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">未連携</span>
                )}
              </td>
              <td className="p-3">
                <div className="flex items-center gap-4 font-bold">
                  <Link
                    href={`/customers/${customer.id}/edit`}
                    className="text-brand-teal hover:text-brand-navy"
                  >
                    編集
                  </Link>
                  <Link
                    href={`/customers/${customer.id}/delete`}
                    className="text-red-600 hover:text-red-800"
                  >
                    削除
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-center gap-6 text-sm">
        {page > 1 && (
          <Link
            href={`/customers?q=${query ?? ""}&page=${page - 1}`}
            className="font-bold text-brand-teal hover:text-brand-navy"
          >
            前へ
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={`/customers?q=${query ?? ""}&page=${page + 1}`}
            className="font-bold text-brand-teal hover:text-brand-navy"
          >
            次へ
          </Link>
        )}
      </div>
    </main>
  );
}
