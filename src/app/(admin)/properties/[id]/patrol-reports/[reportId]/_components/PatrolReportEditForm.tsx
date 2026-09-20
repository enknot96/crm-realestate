"use client";

import { useActionState } from "react";
import { updatePatrolReportBodyAction } from "../actions";
import { PropertyId, ReportId } from "@/domain/shared/branded";
import { Card } from "@/app/(admin)/_components/Card";
import { Button } from "@/app/(admin)/_components/Button";

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
    <Card>
      <form
        action={formAction}
        className="flex flex-col gap-4"
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
          <span className="font-medium text-gray-700">報告文</span>
          <textarea
            name="body"
            rows={10}
            defaultValue={props.body}
            className="rounded border border-gray-300 p-2"
          />
        </label>

        {state.kind === "error" && <p className="text-sm text-red-600">{state.message}</p>}
        {state.kind === "success" && <p className="text-sm text-brand-teal">保存しました</p>}

        <Button
          type="submit"
          disabled={isPending}
          className="self-start"
        >
          保存する
        </Button>
      </form>
    </Card>
  );
}
