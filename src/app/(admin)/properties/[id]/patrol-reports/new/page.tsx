import { getPropertyById } from "@/app/lib/property";
import { requireSession } from "@/app/lib/auth";
import { PropertyId } from "@/domain/shared/branded";
import { notFound } from "next/navigation";
import { PatrolReportForm } from "./_components/PatrolReportForm";

export default async function NewPatrolReportPage(
  props: PageProps<"/properties/[id]/patrol-reports/new">,
) {
  const permit = await requireSession();
  const { id } = await props.params;
  const result = await getPropertyById(permit, id as PropertyId);
  if (result.kind === "err") {
    return <p className="p-4 text-red-600">{result.error}</p>;
  }
  if (result.value === null) {
    notFound();
  }
  const property = result.value;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 p-6">
      <h1 className="text-xl font-bold">巡回報告の作成</h1>
      <p className="text-sm text-gray-500">{property.name}</p>
      <PatrolReportForm propertyId={property.id} />
    </main>
  );
}
