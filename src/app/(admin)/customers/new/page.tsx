import { CustomerForm } from "../_components/CustomerForm";
import { createCustomerAction } from "../actions";
import { Card } from "@/app/(admin)/_components/Card";
import { LinkButton } from "@/app/(admin)/_components/LinkButton";

export default function NewCustomerPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">顧客の新規登録</h1>
        <LinkButton
          href="/customers"
          variant="secondary"
          size="sm"
        >
          一覧へ
        </LinkButton>
      </div>
      <Card>
        <CustomerForm action={createCustomerAction} />
      </Card>
    </main>
  );
}
