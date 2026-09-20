"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  approveAndSendPatrolReport,
  removePatrolReport,
  updatePatrolReportBody,
} from "@/app/lib/patrolReport";
import { describeApproveAndSendError } from "./errorMessages";
import { CustomerId, ReportId } from "@/domain/shared/branded";

export type UpdatePatrolReportBodyState =
  | { kind: "idle" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export async function updatePatrolReportBodyAction(
  prevState: UpdatePatrolReportBodyState,
  formData: FormData,
): Promise<UpdatePatrolReportBodyState> {
  const id = formData.get("reportId") as ReportId;
  const propertyId = formData.get("propertyId");
  const body = String(formData.get("body") ?? "");

  const result = await updatePatrolReportBody(id, body);
  if (result.kind === "err") {
    return { kind: "error", message: result.error };
  }
  revalidatePath(`/properties/${propertyId}/patrol-reports/${id}`);
  return { kind: "success" };
}

export type ApproveAndSendState =
  | { kind: "idle" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export async function approveAndSendPatrolReportAction(
  prevState: ApproveAndSendState,
  formData: FormData,
): Promise<ApproveAndSendState> {
  const id = formData.get("reportId") as ReportId;
  const propertyId = formData.get("propertyId");

  const result = await approveAndSendPatrolReport(id);
  if (result.kind === "err") {
    return { kind: "error", message: describeApproveAndSendError(result.error) };
  }
  revalidatePath(`/properties/${propertyId}/patrol-reports/${id}`);
  return { kind: "success" };
}

type RemovePatrolReportState = { message: string } | null;

export async function removePatrolReportAction(
  prevState: RemovePatrolReportState,
  formData: FormData,
): Promise<RemovePatrolReportState> {
  const id = formData.get("reportId") as ReportId;
  const customerId = formData.get("customerId") as CustomerId;

  const result = await removePatrolReport(id);
  if (result.kind === "err") {
    return { message: result.error };
  }
  redirect(`/customers/${customerId}/edit`);
}
