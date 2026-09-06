import { CustomerForm } from "../_components/CustomerForm";
import { createCustomerAction } from "../actions";
import Link from "next/link";

export default function NewCustomerPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">顧客の新規登録</h1>
        <Link href="/customers" className="text-sm text-gray-500 hover:underline">
          一覧へ
        </Link>
      </div>
      <CustomerForm action={createCustomerAction} />
    </div>
  );
}
