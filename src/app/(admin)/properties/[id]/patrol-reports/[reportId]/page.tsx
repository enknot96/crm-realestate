import { getPatrolReportById } from "@/app/lib/patrolReport";
import { ReportId } from "@/domain/shared/branded";
import { toPatrolReport } from "@/domain/report/patrolReport";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PatrolReportEditForm } from "./_components/PatrolReportEditForm";
import { ApproveAndSendForm } from "./_components/ApproveAndSendForm";

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">巡回報告</h1>
        <Link
          href={`/properties/${row.propertyId}/patrol-reports/${row.id}/delete`}
          className="text-sm font-bold text-red-600 hover:underline"
        >
          この巡回報告を削除
        </Link>
      </div>
      {report.kind === "draft" ? (
        <p className="text-sm text-gray-500">
          報告文を準備中です。しばらくしてからもう一度開いてください。
        </p>
      ) : (
        <>
          {report.photoKeys.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-2 font-bold text-gray-700">アップロードした写真</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {report.photoKeys.map((key) => (
                  // eslint-disable-next-line @next/next/no-img-element -- ログイン必須のプロキシ経由なのでnext/image最適化の対象外
                  <img
                    key={key}
                    src={`/api/patrol-reports/photos/${key}`}
                    alt="巡回時の写真"
                    className="aspect-square w-full rounded border border-gray-200 object-cover"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-2 font-bold text-gray-700">チェック結果</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {report.checklistResults.map((item) => (
                <li key={item.key}>
                  <span className="font-bold">{item.label}</span>：
                  {item.status === "ok" ? "異常なし" : "要確認"}
                  {item.comment && <span className="text-gray-500">（{item.comment}）</span>}
                </li>
              ))}
            </ul>
          </div>

          {report.kind === "reviewing" && (
            <>
              <PatrolReportEditForm
                reportId={row.id}
                propertyId={row.propertyId}
                body={report.body}
              />
              <ApproveAndSendForm
                reportId={row.id}
                propertyId={row.propertyId}
              />
            </>
          )}

          {report.kind === "approved" && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
              <p className="whitespace-pre-wrap">{report.body}</p>
              <p className="mt-2 font-bold text-gray-500">
                承認済みですが、送信が完了していません。時間をおいて画面を開き直してください。
              </p>
            </div>
          )}

          {report.kind === "sent" && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
              <p className="whitespace-pre-wrap">{report.body}</p>
              <p className="mt-2 font-bold text-brand-teal">LINEに送信済みです</p>
            </div>
          )}

          {report.kind === "failed" && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
              <p className="whitespace-pre-wrap">{report.body}</p>
              <p className="mt-2 font-bold text-red-600">送信に失敗しました：{report.error}</p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
