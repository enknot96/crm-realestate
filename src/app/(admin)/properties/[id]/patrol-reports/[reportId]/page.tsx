import { getPatrolReportById } from "@/app/lib/patrolReport";
import { ReportId } from "@/domain/shared/branded";
import { toPatrolReport } from "@/domain/report/patrolReport";
import { notFound } from "next/navigation";
import { PatrolReportEditForm } from "./_components/PatrolReportEditForm";

export default async function PatrolReportPage(
  props: PageProps<"/properties/[id]/patrol-reports/[reportId]">,
) {
  const { reportId } = await props.params;
  const result = await getPatrolReportById(reportId as ReportId);
  if (result.kind === "err") {
    return <p className="p-4 text-red-600">{result.error}</p>;
  }
  if (result.value === null) {
    notFound();
  }
  const row = result.value;
  const report = toPatrolReport(row);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 p-6">
      <h1 className="text-xl font-bold">巡回報告</h1>
      {report.kind === "draft" ? (
        <p className="text-sm text-gray-500">
          報告文を準備中です。しばらくしてからもう一度開いてください。
        </p>
      ) : (
        <PatrolReportEditForm
          reportId={row.id}
          propertyId={row.propertyId}
          body={report.body}
        />
      )}
    </main>
  );
}
