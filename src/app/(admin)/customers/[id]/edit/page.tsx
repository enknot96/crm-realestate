import { getCustomerById, getTagIds } from "@/app/lib/customer";
import { listTags } from "@/app/lib/tag";
import { listPropertiesByCustomerId } from "@/app/lib/property";
import { listPatrolReportsByPropertyId } from "@/app/lib/patrolReport";
import { listContractsByPropertyId } from "@/app/lib/reminder";
import { CustomerId } from "@/domain/shared/branded";
import { notFound } from "next/navigation";
import { CustomerForm } from "../../_components/CustomerForm";
import { CustomerTagsForm } from "../../_components/CustomerTagsForm";
import { PropertyForm } from "../../_components/PropertyForm";
import { updateCustomerAction } from "../../actions";
import { Card } from "@/app/(admin)/_components/Card";
import { LinkButton } from "@/app/(admin)/_components/LinkButton";

export default async function EditCustomerPage(props: PageProps<"/customers/[id]/edit">) {
  const { id } = await props.params;
  const result = await getCustomerById(id as CustomerId);
  if (result.kind === "err") {
    return <p className="p-4 text-red-600">{result.error}</p>;
  }
  if (result.value === null) {
    notFound();
  }
  const customer = result.value;

  // DB操作を一つずつ await ~ ですると、3つのクエリが直列に実行され、待ち時間が多くなるため、
  // Promise.all で3つを同時に投げ、全部完了するのを待つ
  const [allTagsResult, selectedTagIdsResult, propertiesResult] = await Promise.all([
    listTags(),
    getTagIds(customer.id),
    listPropertiesByCustomerId(customer.id),
  ]);
  if (allTagsResult.kind === "err") {
    return <p className="p-4 text-red-600">{allTagsResult.error}</p>;
  }
  if (selectedTagIdsResult.kind === "err") {
    return <p className="p-4 text-red-600">{selectedTagIdsResult.error}</p>;
  }
  if (propertiesResult.kind === "err") {
    return <p className="p-4 text-red-600">{propertiesResult.error}</p>;
  }

  // 物件ごとの巡回報告一覧・契約情報を並行取得する
  // 失敗した物件は「一覧なし」として扱う(致命的なエラーにはしない)
  const propertiesWithReports = await Promise.all(
    propertiesResult.value.map(async (property) => {
      const [reportsResult, contractsResult] = await Promise.all([
        listPatrolReportsByPropertyId(property.id),
        listContractsByPropertyId(property.id),
      ]);
      return {
        property,
        reports: reportsResult.kind === "ok" ? reportsResult.value : [],
        contracts: contractsResult.kind === "ok" ? contractsResult.value : [],
      };
    }),
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">顧客の編集</h1>
        <LinkButton
          href="/customers"
          variant="secondary"
          size="sm"
        >
          一覧へ
        </LinkButton>
      </div>
      <Card>
        <CustomerForm
          action={updateCustomerAction}
          id={customer.id}
          defaultValues={{
            name: customer.name,
            phone: customer.phone,
            email: customer.email ?? undefined,
            postalCode: customer.postalCode ?? undefined,
            address: customer.address ?? undefined,
            memo: customer.memo ?? undefined,
          }}
        />
      </Card>

      <Card>
        <h2 className="mb-3 font-bold">タグ</h2>
        <CustomerTagsForm
          customerId={customer.id}
          allTags={allTagsResult.value}
          selectedTagIds={selectedTagIdsResult.value}
        />
      </Card>

      <Card>
        <h2 className="mb-3 font-bold">物件</h2>
        <PropertyForm
          customerId={customer.id}
          properties={propertiesWithReports}
        />
      </Card>
    </main>
  );
}
