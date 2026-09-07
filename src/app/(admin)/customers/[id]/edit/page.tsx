import { getCustomerById } from "@/app/lib/customer";
import { CustomerId } from "@/domain/shared/branded";
import { notFound } from "next/navigation";
import { CustomerForm } from "../../_components/CustomerForm";
import { updateCustomerAction } from "../../actions";

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
  );
}
