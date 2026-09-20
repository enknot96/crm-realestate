"use client";

import { useActionState } from "react";
import { removePatrolReportAction } from "../../actions";
import { CustomerId, ReportId } from "@/domain/shared/branded";
import { Button } from "@/app/(admin)/_components/Button";

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
      {/* 確認ページの唯一の主操作なので、一覧の「削除」リンクより強い(塗りの赤)見た目にする */}
      <Button
        type="submit"
        variant="danger"
        className="!border-red-600 !bg-red-600 !text-white shadow-sm hover:!bg-red-700"
      >
        削除する
      </Button>
    </form>
  );
}
