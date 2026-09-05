import Link from "next/link";
import { listPages } from "@/app/lib/customer";

const PAGE_SIZE = 20;

export default async function CustomersPage(props: PageProps<"/customers">) {
  const searchParams = await props.searchParams;

  // 「ブラウザが/customers?q=田中&page=2へGETでアクセスする
  // → Next.jsがそのURLを解析してprops.searchParamsという箱にすでに詰めて渡してくる
  // → awaitでその中身を取り出す」
  const query = searchParams.q;
  const page = searchParams.page ? Number(searchParams.page) : 1;

  const result = await listPages({ query, page, pageSize: PAGE_SIZE });

  if (result.kind === "err") {
    return <p className="p-4 text-red-600">{result.error}</p>;
  }

  const { items, totalCount } = result.value;
  // totalCount と PAGE_SIZE から、全部で何ページあるかを計算する
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">顧客一覧</h1>
        <Link
          href="/customers/new"
          className="rounded-lg bg-brand-teal px-4 py-2 text-sm text-white"
        >
          新規登録
        </Link>
      </div>

      <form className="mb-4">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="名前で検索"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </form>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2">名前</th>
            <th className="py-2">電話番号</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {/* items を map して、各顧客の行(name, phone, 編集/削除へのリンク)を表示する */}
        </tbody>
      </table>

      <div className="mt-4 flex items-center justify-center gap-4 text-sm">
        {/* page > 1 なら「前へ」リンク、page < totalPages なら「次へ」リンクを表示する
            リンク先は /customers?q=${query}&page=${page - 1} のような形 */}
      </div>
    </div>
  );
}
