// ブラウザから直接呼べるようにする為だけに"use server"が必要
"use server";

import {
  createCustomer,
  markContacted,
  removeCustomer,
  setTags,
  updateCustomer,
} from "@/app/lib/customer";
import { createProperty } from "@/app/lib/property";
import { CustomerServiceError } from "@/domain/customer/customerService";
import { PropertyServiceError } from "@/domain/property/propertyService";
import { CustomerId, TagId } from "@/domain/shared/branded";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// 流れ：actions.ts → DAL → customerService.ts → customerRepository.ts
// このファイルの役割：ブラウザからのフォーム送信を受け止めて、DALの関数を呼ぶだけの薄いラッパー

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

export async function markContactedAction(id: CustomerId, formData: FormData) {
  await markContacted(id);
  revalidatePath("/customers");
}

type SetTagsActionState = { kind: "success" } | { kind: "error"; message: string } | null;

export async function setTagsAction(
  prevState: SetTagsActionState,
  formData: FormData,
): Promise<SetTagsActionState> {
  const customerId = formData.get("customerId");
  // チェックボックスは同じname="tagIds"で複数チェックされうるので、getAll()で全部まとめて取り出す
  const tagIds = formData.getAll("tagIds").map((value) => Number(value) as TagId);
  const result = await setTags(customerId as CustomerId, tagIds);
  if (result.kind === "err") {
    return { kind: "error", message: result.error };
  }
  revalidatePath(`/customers/${customerId}/edit`);
  return { kind: "success" };
}

export type CreatePropertyActionState =
  | { kind: "success" }
  | { kind: "error"; error: PropertyServiceError }
  | null;

export async function createPropertyAction(
  prevState: CreatePropertyActionState,
  formData: FormData,
): Promise<CreatePropertyActionState> {
  const customerId = formData.get("customerId");
  const input = Object.fromEntries(formData);
  const result = await createProperty(customerId as CustomerId, input);
  if (result.kind === "err") {
    return { kind: "error", error: result.error };
  }
  revalidatePath(`/customers/${customerId}/edit`);
  return { kind: "success" };
}
