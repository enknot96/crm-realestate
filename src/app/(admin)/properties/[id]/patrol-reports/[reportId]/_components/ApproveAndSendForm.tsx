"use client";

import { useActionState } from "react";
import { approveAndSendPatrolReportAction } from "../actions";
import { PropertyId, ReportId } from "@/domain/shared/branded";
import { LinePreview } from "@/app/(admin)/_components/LinePreview";
import { Card } from "@/app/(admin)/_components/Card";
import { Button } from "@/app/(admin)/_components/Button";

type Props = {
  reportId: ReportId;
  propertyId: PropertyId;
  demoMode: boolean;
  body: string;
  photoUrls: string[];
};

export function ApproveAndSendForm(props: Props) {
  const [state, formAction, isPending] = useActionState(approveAndSendPatrolReportAction, {
    kind: "idle" as const,
  });

  if (state.kind === "success") {
    return (
      <div className="flex flex-col gap-2">
        <p className="rounded-lg border border-brand-teal bg-white p-4 text-sm font-bold text-brand-teal">
          LINEに送信しました
        </p>
        {props.demoMode && (
          <LinePreview
            text={props.body}
            photoUrls={props.photoUrls}
          />
        )}
      </div>
    );
  }

  return (
    <Card>
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
        name="propertyId"
        value={props.propertyId}
      />
      {state.kind === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      <Button
        type="submit"
        disabled={isPending}
        className="self-start"
      >
        {isPending ? "送信しています…" : "承認してLINEに送信する"}
      </Button>
    </form>
    </Card>
  );
}
