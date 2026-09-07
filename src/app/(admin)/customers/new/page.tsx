import { CustomerForm } from "../_components/CustomerForm";
import { createCustomerAction } from "../actions";
import Link from "next/link";

export default function NewCustomerPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">顧客の新規登録</h1>
        <Link href="/customers" className="font-bold text-brand-teal hover:text-brand-navy">
          一覧へ
        </Link>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <CustomerForm action={createCustomerAction} />
      </div>
    </main>
  );
}
