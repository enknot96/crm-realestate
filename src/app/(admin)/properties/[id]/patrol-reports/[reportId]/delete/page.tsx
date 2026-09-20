import { getPatrolReportById } from "@/app/lib/patrolReport";
import { getPropertyById } from "@/app/lib/property";
import { PropertyId, ReportId } from "@/domain/shared/branded";
import { notFound } from "next/navigation";
import { DeleteConfirmForm } from "./_components/DeleteConfirmForm";
import { Card } from "@/app/(admin)/_components/Card";
import { LinkButton } from "@/app/(admin)/_components/LinkButton";

export default async function DeletePatrolReportPage(
  props: PageProps<"/properties/[id]/patrol-reports/[reportId]/delete">,
) {
  const { id, reportId } = await props.params;

  const [reportResult, propertyResult] = await Promise.all([
    getPatrolReportById(reportId as ReportId),
    getPropertyById(id as PropertyId),
  ]);

  if (reportResult.kind === "err") {
    return <p className="p-4 text-red-600">{reportResult.error}</p>;
  }
  if (reportResult.value === null) {
    notFound();
  }
  if (propertyResult.kind === "err") {
    return <p className="p-4 text-red-600">{propertyResult.error}</p>;
  }
  if (propertyResult.value === null) {
    notFound();
  }

  const report = reportResult.value;
  const property = propertyResult.value;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 p-6">
      <h1 className="text-xl font-bold">本当に削除しますか？</h1>
      <Card className="text-sm">
        <p className="font-bold">{property.name}</p>
        <p className="text-gray-500">
          写真{report.photoKeys.length}枚を含む巡回報告です。削除すると元に戻せません。
        </p>
      </Card>

      <div className="flex items-center gap-4">
        <DeleteConfirmForm
          reportId={report.id}
          customerId={property.customerId}
        />
        <LinkButton
          href={`/properties/${property.id}/patrol-reports/${report.id}`}
          variant="secondary"
        >
          キャンセルして戻る
        </LinkButton>
      </div>
    </main>
  );
}
