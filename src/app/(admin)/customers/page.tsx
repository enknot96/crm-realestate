import Link from "next/link";
import { listPages } from "@/app/lib/customer";
import { requireSession } from "@/app/lib/auth";
import { markContactedAction } from "./actions";
import { isOverdue } from "@/domain/customer/contactStatus";
import { Card } from "../_components/Card";
import { Button } from "../_components/Button";
import { LinkButton } from "../_components/LinkButton";
import { buttonClassName } from "../_components/buttonStyles";

const PAGE_SIZE = 20;
const OVERDUE_THRESHOLD_DAYS = 30;

export default async function CustomersPage(props: PageProps<"/customers">) {
  const permit = await requireSession();
  const searchParams = await props.searchParams;

  // ブラウザが/customers?q=田中&page=2へGETでアクセスする
  // → Next.jsがそのURLを解析してprops.searchParamsという箱にすでに詰めて渡してくる
  // → awaitでその中身を取り出す」
  const query = typeof searchParams.q === "string" ? searchParams.q : undefined;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const sortOrder = searchParams.sort === "desc" ? "desc" : "asc";
  const nextSort = sortOrder === "asc" ? "desc" : "asc";

  const result = await listPages(permit, { query, page, pageSize: PAGE_SIZE, sortOrder });

  if (result.kind === "err") {
    return <p className="p-4 text-red-600">{result.error}</p>;
  }

  const { items, totalCount } = result.value;
  // totalCount と PAGE_SIZE から、全部で何ページあるかを計算する
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const today = new Date();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold">顧客一覧</h1>
        <div className="flex flex-wrap items-center gap-2">
          <LinkButton
            href="/tags"
            variant="secondary"
            size="sm"
          >
            タグ管理
          </LinkButton>
          <LinkButton
            href="/customers/line-friends"
            variant="secondary"
            size="sm"
          >
            LINEお友だちの紐付け
          </LinkButton>
          <LinkButton
            href="/customers/import"
            variant="secondary"
            size="sm"
          >
            CSV取り込み
          </LinkButton>
          {/* ファイルダウンロードなのでNext.jsのクライアント遷移(Link)は使わず、素のaタグにする */}
          <a
            href="/customers/export"
            className={buttonClassName("secondary", "sm")}
          >
            CSVエクスポート
          </a>
          <LinkButton href="/customers/new">新規登録</LinkButton>
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

      {/* モバイル(sm未満): カード表示 */}
      <ul className="flex flex-col gap-2 sm:hidden">
        {items.map((customer) => {
          const overdue = isOverdue(customer.lastContactedAt, today, OVERDUE_THRESHOLD_DAYS);
          return (
            <li key={customer.id}>
              <Card className={overdue ? "bg-red-50" : ""}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{customer.name}</p>
                    <p className="text-sm text-gray-600">{customer.phone}</p>
                  </div>
                  {customer.lineUserId ? (
                    <span className="rounded-full bg-brand-mint/20 px-2 py-0.5 text-xs font-bold whitespace-nowrap text-brand-navy">
                      連携済み
                    </span>
                  ) : (
                    <span className="text-xs whitespace-nowrap text-gray-400">未連携</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  最終連絡日：
                  {customer.lastContactedAt ? (
                    <span className={overdue ? "font-bold text-red-600" : ""}>
                      {customer.lastContactedAt.toLocaleDateString("ja-JP")}
                    </span>
                  ) : (
                    <span className="font-bold text-red-600">未接触</span>
                  )}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <LinkButton
                    href={`/customers/${customer.id}/edit`}
                    size="sm"
                  >
                    編集
                  </LinkButton>
                  <LinkButton
                    href={`/customers/${customer.id}/delete`}
                    variant="danger"
                    size="sm"
                  >
                    削除
                  </LinkButton>
                  <form action={markContactedAction.bind(null, customer.id)}>
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                    >
                      今日連絡した
                    </Button>
                  </form>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      {/* sm以上: 表形式 */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse rounded-lg border border-gray-200 bg-white text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="p-3">名前</th>
              <th className="p-3">電話番号</th>
              <th className="p-3">LINE</th>
              <th className="p-3">
                <Link
                  href={`/customers?q=${query ?? ""}&page=${page}&sort=${nextSort}`}
                  className="hover:text-brand-navy"
                >
                  最終連絡日 {sortOrder === "asc" ? "▲" : "▼"}
                </Link>
              </th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((customer) => {
              const overdue = isOverdue(customer.lastContactedAt, today, OVERDUE_THRESHOLD_DAYS);
              return (
                <tr
                  key={customer.id}
                  className={`border-b border-gray-100 last:border-0 ${overdue ? "bg-red-50" : ""}`}
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
                    {customer.lastContactedAt ? (
                      <span className={overdue ? "font-bold text-red-600" : ""}>
                        {customer.lastContactedAt.toLocaleDateString("ja-JP")}
                      </span>
                    ) : (
                      <span className="font-bold text-red-600">未接触</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <LinkButton
                        href={`/customers/${customer.id}/edit`}
                        size="sm"
                      >
                        編集
                      </LinkButton>
                      <LinkButton
                        href={`/customers/${customer.id}/delete`}
                        variant="danger"
                        size="sm"
                      >
                        削除
                      </LinkButton>
                      <form action={markContactedAction.bind(null, customer.id)}>
                        <Button
                          type="submit"
                          variant="secondary"
                          size="sm"
                        >
                          今日連絡した
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-3 text-sm">
        {page > 1 && (
          <LinkButton
            href={`/customers?q=${query ?? ""}&page=${page - 1}&sort=${sortOrder}`}
            variant="secondary"
            size="sm"
          >
            前へ
          </LinkButton>
        )}
        {page < totalPages && (
          <LinkButton
            href={`/customers?q=${query ?? ""}&page=${page + 1}&sort=${sortOrder}`}
            variant="secondary"
            size="sm"
          >
            次へ
          </LinkButton>
        )}
      </div>
    </main>
  );
}
