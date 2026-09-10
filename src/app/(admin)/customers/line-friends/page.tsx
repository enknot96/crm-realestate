import { listAllForSelect } from "@/app/lib/customer";
import { listUnlinkedLineFriends } from "@/app/lib/lineFriend";
import Link from "next/link";
import { LinkForm } from "./_components/LinkForm";

export default async function LineFriendsPage() {
  const unlinkedResult = await listUnlinkedLineFriends();
  const customersResult = await listAllForSelect();

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
        <Link
          href="/customers"
          className="font-bold text-brand-teal hover:text-brand-navy"
        >
          一覧へ
        </Link>
      </div>

      {unlinkedFriends.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          未紐付けのお友だちはいません
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {unlinkedFriends.map((friend) => (
            <div
              key={friend.lineUserId}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
            >
              <span className="font-bold">{friend.displayName}</span>
              <LinkForm
                lineUserId={friend.lineUserId}
                customers={customers}
              />{" "}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
