import Link from "next/link";
import { ImportForm } from "./_components/ImportForm";

export default function ImportCustomersPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">顧客名簿の取り込み（CSV）</h1>
        <Link href="/customers" className="font-bold text-brand-teal hover:text-brand-navy">
          一覧へ
        </Link>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="mb-4 text-sm text-gray-600">
          1行目は見出し（名前,電話番号,メール,郵便番号,住所,メモ）にしてください。名前と電話番号は必須、それ以外は空欄でも構いません。すでに登録されている電話番号の行は取り込まれません。
        </p>
        <ImportForm />
      </div>
    </main>
  );
}
