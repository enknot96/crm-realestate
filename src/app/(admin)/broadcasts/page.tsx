import Link from "next/link";
import { listTags } from "@/app/lib/tag";
import { BroadcastForm } from "./_components/BroadcastForm";
import { env } from "@/config/env";

export default async function BroadcastsPage() {
  const result = await listTags();

  if (result.kind === "err") {
    return <p className="p-4 text-red-600">{result.error}</p>;
  }

  const tags = result.value;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">タグ配信</h1>
        <Link href="/customers" className="font-bold text-brand-teal hover:text-brand-navy">
          顧客一覧へ
        </Link>
      </div>

      <p className="text-sm text-gray-500">
        タグを選ぶと、そのタグが付いているお客様にLINEでまとめてメッセージを送れます。
      </p>

      {tags.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          タグがまだ登録されていません。先に「タグ管理」から作成してください
        </p>
      ) : (
        <BroadcastForm
          tags={tags}
          demoMode={env.DEMO_MODE}
        />
      )}
    </main>
  );
}
