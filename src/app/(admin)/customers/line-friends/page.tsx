import { listAllForSelect } from "@/app/lib/customer";
import { listUnlinkedLineFriends } from "@/app/lib/lineFriend";
import { requireSession } from "@/app/lib/auth";
import { LinkForm } from "./_components/LinkForm";
import { Card } from "@/app/(admin)/_components/Card";
import { LinkButton } from "@/app/(admin)/_components/LinkButton";

export default async function LineFriendsPage() {
  const permit = await requireSession();
  const unlinkedResult = await listUnlinkedLineFriends(permit);
  const customersResult = await listAllForSelect(permit);

  if (unlinkedResult.kind === "err") {
    return <p className="p-4 text-red-600">{unlinkedResult.error}</p>;
  }
  if (customersResult.kind === "err") {
    return <p className="p-4 text-red-600">{customersResult.error}</p>;
  }

  const unlinkedFriends = unlinkedResult.value;
  const customers = customersResult.value;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">LINEお友だちの紐付け</h1>
        <LinkButton
          href="/customers"
          variant="secondary"
          size="sm"
        >
          一覧へ
        </LinkButton>
      </div>

      {unlinkedFriends.length === 0 ? (
        <Card className="text-center text-sm text-gray-500">未紐付けのお友だちはいません</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {unlinkedFriends.map((friend) => (
            <Card
              key={friend.lineUserId}
              className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"
            >
              <span className="font-bold">{friend.displayName}</span>
              <LinkForm
                lineUserId={friend.lineUserId}
                customers={customers}
              />
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
