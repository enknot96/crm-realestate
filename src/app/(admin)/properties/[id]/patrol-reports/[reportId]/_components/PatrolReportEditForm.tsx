"use client";

import { useActionState } from "react";
import { updatePatrolReportBodyAction } from "../actions";
import { PropertyId, ReportId } from "@/domain/shared/branded";

type Props = {
  reportId: ReportId;
  propertyId: PropertyId;
  body: string;
};

export function PatrolReportEditForm(props: Props) {
  const [state, formAction, isPending] = useActionState(updatePatrolReportBodyAction, {
    kind: "idle" as const,
  });

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6"
    >
      <input
        type="hidden"
        name="reportId"
        value={props.reportId}
      />
      <input
        type="hidden"
        name="propertyId"
        value={props.propertyId}
      />
      <label className="flex flex-col gap-1">
        <span className="font-bold text-gray-700">報告文</span>
        <textarea
          name="body"
          rows={10}
          defaultValue={props.body}
          className="rounded border border-gray-300 p-2"
        />
      </label>

      {state.kind === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      {state.kind === "success" && <p className="text-sm text-brand-teal">保存しました</p>}

      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer self-start rounded-lg bg-brand-teal px-4 py-2 font-bold text-white hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
      >
        保存する
      </button>
    </form>
  );
}
