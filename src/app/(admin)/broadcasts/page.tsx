import { listTags } from "@/app/lib/tag";
import { requireSession } from "@/app/lib/auth";
import { BroadcastForm } from "./_components/BroadcastForm";
import { env } from "@/config/env";
import { LinkButton } from "@/app/(admin)/_components/LinkButton";
import { Card } from "@/app/(admin)/_components/Card";

export default async function BroadcastsPage() {
  const permit = await requireSession();
  const result = await listTags(permit);

  if (result.kind === "err") {
    return <p className="p-4 text-red-600">{result.error}</p>;
  }

  const tags = result.value;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">タグ配信</h1>
        <LinkButton
          href="/customers"
          variant="secondary"
          size="sm"
        >
          顧客一覧へ
        </LinkButton>
      </div>

      <p className="text-sm text-gray-500">
        タグを選ぶと、そのタグが付いているお客様にLINEでまとめてメッセージを送れます。
      </p>

      {tags.length === 0 ? (
        <Card className="text-center text-sm text-gray-500">
          タグがまだ登録されていません。先に「タグ管理」から作成してください
        </Card>
      ) : (
        <BroadcastForm
          tags={tags}
          demoMode={env.DEMO_MODE}
        />
      )}
    </main>
  );
}
