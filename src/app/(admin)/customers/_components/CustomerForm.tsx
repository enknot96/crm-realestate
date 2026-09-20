"use client";

import { CustomerFormInput } from "@/domain/customer/schema";
import { CustomerId } from "@/domain/shared/branded";
import { CustomerFormActionState } from "../actions";
import { useActionState } from "react";
import { Button } from "../../_components/Button";

export type Props = {
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

  const inputClassName = "rounded border border-gray-300 p-2";
  const labelClassName = "flex flex-col gap-1";
  const labelTextClassName = "font-medium text-gray-700";
  const errorClassName = "text-sm text-red-600";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.kind === "repository" && <p className={errorClassName}>{state.message}</p>}
      {/* 名前 */}
      <label className={labelClassName}>
        <span className={labelTextClassName}>名前</span>
        <input
          name="name"
          type="text"
          defaultValue={props.defaultValues?.["name"]}
          className={inputClassName}
        />
        {fieldError("name") && <span className={errorClassName}>{fieldError("name")}</span>}
      </label>
      {/* 電話番号 */}
      <label className={labelClassName}>
        <span className={labelTextClassName}>電話番号</span>
        <input
          name="phone"
          type="tel"
          defaultValue={props.defaultValues?.["phone"]}
          className={inputClassName}
        />
        {fieldError("phone") && <span className={errorClassName}>{fieldError("phone")}</span>}
      </label>
      {/* メール */}
      <label className={labelClassName}>
        <span className={labelTextClassName}>メール</span>
        <input
          name="email"
          type="email"
          defaultValue={props.defaultValues?.["email"]}
          className={inputClassName}
        />
        {fieldError("email") && <span className={errorClassName}>{fieldError("email")}</span>}
      </label>
      {/* 郵便番号 */}
      <label className={labelClassName}>
        <span className={labelTextClassName}>郵便番号</span>
        <input
          name="postalCode"
          type="text"
          inputMode="numeric"
          defaultValue={props.defaultValues?.["postalCode"]}
          className={inputClassName}
        />
        {fieldError("postalCode") && (
          <span className={errorClassName}>{fieldError("postalCode")}</span>
        )}
      </label>
      {/* 住所 */}
      <label className={labelClassName}>
        <span className={labelTextClassName}>住所</span>
        <input
          name="address"
          type="text"
          defaultValue={props.defaultValues?.["address"]}
          className={inputClassName}
        />
        {fieldError("address") && <span className={errorClassName}>{fieldError("address")}</span>}
      </label>
      {/* メモ */}
      <label className={labelClassName}>
        <span className={labelTextClassName}>メモ</span>
        <textarea
          name="memo"
          rows={4}
          defaultValue={props.defaultValues?.["memo"]}
          className={inputClassName}
        />
        {fieldError("memo") && <span className={errorClassName}>{fieldError("memo")}</span>}
      </label>

      {/* id情報を送るためのinpt */}
      {props.id && <input type="hidden" name="id" value={props.id} />}

      <Button
        type="submit"
        disabled={isPending}
        className="self-start"
      >
        {props.id ? "更新する" : "新規作成する"}
      </Button>
    </form>
  );
}
