"use client";

import { useActionState } from "react";
import { approveAndSendPatrolReportAction } from "../actions";
import { PropertyId, ReportId } from "@/domain/shared/branded";

type Props = {
  reportId: ReportId;
  propertyId: PropertyId;
};

export function ApproveAndSendForm(props: Props) {
  const [state, formAction, isPending] = useActionState(approveAndSendPatrolReportAction, {
    kind: "idle" as const,
  });

  if (state.kind === "success") {
    return (
      <p className="rounded-lg border border-brand-teal bg-white p-4 text-sm font-bold text-brand-teal">
        LINEに送信しました
      </p>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4"
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
      {state.kind === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer self-start rounded-lg bg-brand-teal px-4 py-2 font-bold text-white hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "送信しています…" : "承認してLINEに送信する"}
      </button>
    </form>
  );
}
