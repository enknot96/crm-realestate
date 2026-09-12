import Link from "next/link";
import { listTags } from "@/app/lib/tag";
import { CreateTagForm } from "./_components/CreateTagForm";
import { RemoveTagButton } from "./_components/RemoveTagButton";

export default async function TagsPage() {
  const result = await listTags();

  if (result.kind === "err") {
    return <p className="p-4 text-red-600">{result.error}</p>;
  }

  const tags = result.value;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">タグ管理</h1>
        <Link href="/customers" className="font-bold text-brand-teal hover:text-brand-navy">
          顧客一覧へ
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <CreateTagForm />
      </div>

      {tags.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          タグはまだありません
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
            >
              <span className="font-bold">{tag.name}</span>
              <RemoveTagButton id={tag.id} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
