"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createPropertyAction, createContractAction, removeContractAction } from "../actions";
import { CustomerId } from "@/domain/shared/branded";
import { Property } from "@/domain/property/repository";
import { PatrolReportRow } from "@/domain/report/repository";
import { ContractWithNextDates } from "@/domain/reminder/contractService";

type Props = {
  customerId: CustomerId;
  properties: {
    property: Property;
    reports: PatrolReportRow[];
    contracts: ContractWithNextDates[];
  }[];
};

function formatJst(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatJstDate(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function ContractSection(props: { customerId: CustomerId; property: Property; contracts: ContractWithNextDates[] }) {
  const [state, formAction, isPending] = useActionState(createContractAction, null);

  return (
    <div className="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-2">
      <p className="font-bold text-gray-700">契約情報</p>
      {props.contracts.length === 0 ? (
        <p className="text-gray-500">契約情報がまだ登録されていません。</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {props.contracts.map((contract) => (
            <li
              key={contract.id}
              className="rounded border border-gray-100 p-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p>契約日: {formatJstDate(contract.contractDate)}</p>
                  <p className="text-gray-500">
                    次回の巡回報告期限: {formatJstDate(contract.nextBiweeklyReportDate)}
                  </p>
                  <p className="text-gray-500">
                    次回の更新時期: {formatJstDate(contract.nextQuarterlyRenewalDate)}
                  </p>
                </div>
                <form action={removeContractAction.bind(null, contract.id, props.customerId)}>
                  <button
                    type="submit"
                    className="cursor-pointer text-xs text-red-600 hover:underline"
                  >
                    削除
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        action={formAction}
        className="flex items-end gap-2"
      >
        <input
          type="hidden"
          name="customerId"
          value={props.customerId}
        />
        <input
          type="hidden"
          name="propertyId"
          value={props.property.id}
        />
        <label className="flex flex-col gap-1">
          <span className="text-gray-700">契約日を追加</span>
          <input
            name="contractDate"
            type="date"
            className="rounded border border-gray-300 p-2"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="cursor-pointer rounded-lg bg-brand-teal px-3 py-2 font-bold text-white hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
        >
          登録
        </button>
      </form>
      {state?.kind === "error" && state.error.kind === "validation" && (
        <p className="text-sm text-red-600">{state.error.fieldErrors.contractDate?.[0]}</p>
      )}
      {state?.kind === "error" && state.error.kind === "repository" && (
        <p className="text-sm text-red-600">{state.error.message}</p>
      )}
      {state?.kind === "error" && state.error.kind === "duplicateProperty" && (
        <p className="text-sm text-red-600">
          この物件にはすでに契約情報が登録されています。先に削除してから登録してください。
        </p>
      )}
    </div>
  );
}

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
          {props.properties.map(({ property, reports, contracts }) => (
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
              <Link
                href={`/properties/${property.id}/patrol-reports/new`}
                className="mt-1 inline-block font-bold text-brand-teal hover:text-brand-navy"
              >
                巡回報告を作成
              </Link>

              {reports.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1 border-t border-gray-100 pt-2">
                  {reports.map((report) => (
                    <li key={report.id}>
                      <Link
                        href={`/properties/${property.id}/patrol-reports/${report.id}`}
                        className="text-brand-teal hover:text-brand-navy"
                      >
                        {formatJst(report.createdAt)}の巡回報告
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <ContractSection
                customerId={props.customerId}
                property={property}
                contracts={contracts}
              />
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
