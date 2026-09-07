import { getCustomerById } from "@/app/lib/customer";
import { CustomerId } from "@/domain/shared/branded";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DeleteConfirmForm } from "./_components/DeleteConfirmForm";

export default async function DeleteCustomerPage(props: PageProps<"/customers/[id]/delete">) {
  const { id } = await props.params;
  const result = await getCustomerById(id as CustomerId);
  if (result.kind === "err") {
    return <p className="p-4 text-red-600">{result.error}</p>;
  }
  if (result.value === null) {
    notFound();
  }
  const customer = result.value;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-xl font-bold">本当に削除しますか？</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="font-bold">{customer.name}</p>
        <p className="text-gray-500">{customer.phone}</p>
      </div>

      <div className="flex items-center gap-4">
        <DeleteConfirmForm id={customer.id} />
        <Link href="/customers" className="font-bold text-brand-teal hover:text-brand-navy">
          キャンセルして一覧へ
        </Link>
      </div>
    </main>
  );
}
