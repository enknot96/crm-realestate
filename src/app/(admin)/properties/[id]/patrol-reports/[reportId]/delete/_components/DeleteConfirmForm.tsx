"use client";

import { useActionState } from "react";
import { removePatrolReportAction } from "../../actions";
import { CustomerId, ReportId } from "@/domain/shared/branded";

type Props = {
  reportId: ReportId;
  customerId: CustomerId;
};

export function DeleteConfirmForm(props: Props) {
  const [state, formAction] = useActionState(removePatrolReportAction, null);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2"
    >
      <input
        type="hidden"
        name="reportId"
        value={props.reportId}
      />
      <input
        type="hidden"
        name="customerId"
        value={props.customerId}
      />
      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
      <button
        type="submit"
        className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700"
      >
        削除する
      </button>
    </form>
  );
}
