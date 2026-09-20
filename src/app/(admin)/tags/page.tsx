import { listTags } from "@/app/lib/tag";
import { requireSession } from "@/app/lib/auth";
import { CreateTagForm } from "./_components/CreateTagForm";
import { RemoveTagButton } from "./_components/RemoveTagButton";
import { Card } from "@/app/(admin)/_components/Card";
import { LinkButton } from "@/app/(admin)/_components/LinkButton";

export default async function TagsPage() {
  const permit = await requireSession();
  const result = await listTags(permit);

  if (result.kind === "err") {
    return <p className="p-4 text-red-600">{result.error}</p>;
  }

  const tags = result.value;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">タグ管理</h1>
        <LinkButton
          href="/customers"
          variant="secondary"
          size="sm"
        >
          顧客一覧へ
        </LinkButton>
      </div>

      <Card>
        <CreateTagForm />
      </Card>

      {tags.length === 0 ? (
        <Card className="text-center text-sm text-gray-500">タグはまだありません</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {tags.map((tag) => (
            <Card
              key={tag.id}
              className="flex items-center justify-between"
            >
              <span className="font-bold">{tag.name}</span>
              <RemoveTagButton id={tag.id} />
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
