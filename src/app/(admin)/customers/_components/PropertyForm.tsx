"use client";

import { useActionState } from "react";
import { createPropertyAction } from "../actions";
import { CustomerId } from "@/domain/shared/branded";
import { Property } from "@/domain/property/repository";

type Props = {
  customerId: CustomerId;
  properties: Property[];
};

export function PropertyForm(props: Props) {
  const [state, formAction, isPending] = useActionState(createPropertyAction, null);

  const fieldError = (name: string) => {
    if (state?.kind === "error" && state.error.kind === "validation") {
      return state.error.fieldErrors[name]?.[0];
    }
    return undefined;
  };

  const inputClassName = "rounded border border-gray-300 p-2";
  const labelClassName = "flex flex-col gap-1";
  const labelTextClassName = "font-bold text-gray-700";
  const errorClassName = "text-sm text-red-600";

  return (
    <div className="flex flex-col gap-3">
      {props.properties.length === 0 ? (
        <p className="text-sm text-gray-500">物件がまだ登録されていません。</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {props.properties.map((property) => (
            <li
              key={property.id}
              className="rounded border border-gray-200 p-3 text-sm"
            >
              <p className="font-bold">{property.name}</p>
              {property.address && <p className="text-gray-500">{property.address}</p>}
              {(property.structureType || property.floors !== null) && (
                <p className="text-gray-500">
                  {property.structureType}
                  {property.structureType && property.floors !== null && "・"}
                  {property.floors !== null && `${property.floors}階建て`}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        action={formAction}
        className="flex flex-col gap-3 rounded border border-gray-200 p-3"
      >
        <input
          type="hidden"
          name="customerId"
          value={props.customerId}
        />
        {state?.kind === "error" && state.error.kind === "repository" && (
          <p className={errorClassName}>{state.error.message}</p>
        )}
        {state?.kind === "success" && <p className="text-sm text-brand-teal">物件を登録しました</p>}

        <label className={labelClassName}>
          <span className={labelTextClassName}>物件名</span>
          <input
            name="name"
            type="text"
            placeholder="例: 青葉荘、〇〇マンション101号室"
            className={inputClassName}
          />
          {fieldError("name") && <span className={errorClassName}>{fieldError("name")}</span>}
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>住所</span>
          <input
            name="address"
            type="text"
            className={inputClassName}
          />
          {fieldError("address") && <span className={errorClassName}>{fieldError("address")}</span>}
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>構造（例: 木造）</span>
          <input
            name="structureType"
            type="text"
            className={inputClassName}
          />
          {fieldError("structureType") && (
            <span className={errorClassName}>{fieldError("structureType")}</span>
          )}
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>階数</span>
          <input
            name="floors"
            type="number"
            inputMode="numeric"
            className={inputClassName}
          />
          {fieldError("floors") && <span className={errorClassName}>{fieldError("floors")}</span>}
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="cursor-pointer self-start rounded-lg bg-brand-teal px-4 py-2 font-bold text-white hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
        >
          物件を登録する
        </button>
      </form>
    </div>
  );
}
