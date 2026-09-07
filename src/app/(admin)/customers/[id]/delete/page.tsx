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
    <div>
      <h1>本当に削除しますか？</h1>
      <p>
        {customer.name} / {customer.phone}
      </p>

      <DeleteConfirmForm id={customer.id} />

      <Link href="/customers">キャンセルして一覧へ</Link>
    </div>
  );
}
