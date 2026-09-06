"use client";

import { CustomerFormInput } from "@/domain/customer/schema";
import { CustomerId } from "@/domain/shared/branded";
import { CustomerFormActionState } from "../actions";
import { useActionState } from "react";

type Props = {
  action: (
    prevState: CustomerFormActionState,
    formData: FormData,
  ) => Promise<CustomerFormActionState>;
  defaultValues?: CustomerFormInput;
  id?: CustomerId;
};

export function CustomerForm(props: Props) {
  const [state, formAction, isPending] = useActionState(props.action, null);

  const fieldError = (name: string) => {
    if (state && state.kind === "validation") {
      return state.fieldErrors[name]?.[0];
    }
    return undefined;
  };

  const inputClassName = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm";
  const labelClassName = "mb-1 block text-sm font-medium text-gray-700";
  const errorClassName = "mt-1 text-sm text-red-600";

  return (
    <form action={formAction} className="space-y-4">
      {/* 名前 */}
      <div>
        <label htmlFor="name" className={labelClassName}>
          名前
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={props.defaultValues?.["name"]}
          className={inputClassName}
        />
        {fieldError("name") && <p className={errorClassName}>{fieldError("name")}</p>}
      </div>
      {/* 電話番号 */}
      <div>
        <label htmlFor="phone" className={labelClassName}>
          電話番号
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={props.defaultValues?.["phone"]}
          className={inputClassName}
        />
        {fieldError("phone") && <p className={errorClassName}>{fieldError("phone")}</p>}
      </div>
      {/* メール */}
      <div>
        <label htmlFor="email" className={labelClassName}>
          メール
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={props.defaultValues?.["email"]}
          className={inputClassName}
        />
        {fieldError("email") && <p className={errorClassName}>{fieldError("email")}</p>}
      </div>
      {/* 郵便番号 */}
      <div>
        <label htmlFor="postalCode" className={labelClassName}>
          郵便番号
        </label>
        <input
          id="postalCode"
          name="postalCode"
          type="text"
          inputMode="numeric"
          defaultValue={props.defaultValues?.["postalCode"]}
          className={inputClassName}
        />
        {fieldError("postalCode") && (
          <p className={errorClassName}>{fieldError("postalCode")}</p>
        )}
      </div>
      {/* 住所 */}
      <div>
        <label htmlFor="address" className={labelClassName}>
          住所
        </label>
        <input
          id="address"
          name="address"
          type="text"
          defaultValue={props.defaultValues?.["address"]}
          className={inputClassName}
        />
        {fieldError("address") && <p className={errorClassName}>{fieldError("address")}</p>}
      </div>
      {/* メモ */}
      <div>
        <label htmlFor="memo" className={labelClassName}>
          メモ
        </label>
        <textarea
          id="memo"
          name="memo"
          rows={3}
          defaultValue={props.defaultValues?.["memo"]}
          className={inputClassName}
        />
        {fieldError("memo") && <p className={errorClassName}>{fieldError("memo")}</p>}
      </div>

      {/* id情報を送るためのinpt */}
      {props.id && <input type="hidden" name="id" value={props.id} />}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-brand-teal px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {props.id ? "更新する" : "新規作成する"}
      </button>
    </form>
  );
}
