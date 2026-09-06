// ブラウザから直接呼べるようにする為だけに"use server"が必要
"use server";

import { createCustomer, removeCustomer, updateCustomer } from "@/app/lib/customer";
import { CustomerServiceError } from "@/domain/customer/customerService";
import { CustomerId } from "@/domain/shared/branded";
import { redirect } from "next/navigation";

// 流れ：actions.ts → DAL → customerService.ts → customerRepository.ts

export type CustomerFormActionState = CustomerServiceError | null;
type RemoveActionState = { message: string } | null;

export async function createCustomerAction(
  prevState: CustomerFormActionState,
  formData: FormData,
): Promise<CustomerFormActionState> {
  const input = Object.fromEntries(formData);
  const result = await createCustomer(input);
  if (result.kind === "err") {
    return result.error;
  }
  redirect("/customers");
}

export async function updateCustomerAction(
  prevState: CustomerFormActionState,
  formData: FormData,
): Promise<CustomerFormActionState> {
  const input = Object.fromEntries(formData);
  const targetId = formData.get("id");
  const result = await updateCustomer(targetId as CustomerId, input);
  if (result.kind === "err") {
    return result.error;
  }
  redirect("/customers");
}

export async function removeCustomerAction(
  prevState: RemoveActionState,
  formData: FormData,
): Promise<RemoveActionState> {
  const target = formData.get("id");
  const result = await removeCustomer(target as CustomerId);
  if (result.kind === "err") {
    return { message: result.error };
  }
  redirect("/customers");
}
