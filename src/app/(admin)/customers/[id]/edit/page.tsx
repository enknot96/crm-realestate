import { getCustomerById } from "@/app/lib/customer";
import { CustomerId } from "@/domain/shared/branded";
import { notFound } from "next/navigation";
import { CustomerForm } from "../../_components/CustomerForm";
import { updateCustomerAction } from "../../actions";
import Link from "next/link";

export default async function EditCustomerPage(props: PageProps<"/customers/[id]/edit">) {
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">顧客の編集</h1>
        <Link href="/customers" className="font-bold text-brand-teal hover:text-brand-navy">
          一覧へ
        </Link>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <CustomerForm
          action={updateCustomerAction}
          id={customer.id}
          defaultValues={{
            name: customer.name,
            phone: customer.phone,
            email: customer.email ?? undefined,
            postalCode: customer.postalCode ?? undefined,
            address: customer.address ?? undefined,
            memo: customer.memo ?? undefined,
          }}
        />
      </div>
    </main>
  );
}
