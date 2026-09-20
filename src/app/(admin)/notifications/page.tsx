import { listRecentNotifications } from "@/app/lib/reminder";
import { noticeLabel, ruleTypeLabel } from "@/domain/reminder/reminderNotificationRepository";
import { Card } from "@/app/(admin)/_components/Card";
import { LinkButton } from "@/app/(admin)/_components/LinkButton";

const NOTIFICATION_LIMIT = 50;

function formatJst(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatJstDate(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default async function NotificationsPage() {
  const result = await listRecentNotifications(NOTIFICATION_LIMIT);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">通知</h1>
        <LinkButton
          href="/customers"
          variant="secondary"
          size="sm"
        >
          顧客一覧へ
        </LinkButton>
      </div>

      <p className="text-sm text-gray-500">
        巡回報告の期限・契約更新の時期が来たときに、自動で送られた通知の履歴です。
      </p>

      {result.kind === "err" ? (
        <p className="text-red-600">{result.error}</p>
      ) : result.value.length === 0 ? (
        <Card className="text-center text-sm text-gray-500">通知の履歴はまだありません。</Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {result.value.map((notification) => (
            <li key={notification.id}>
              <Card className="text-sm">
                <p className="font-bold">{notification.propertyName}</p>
                <p className="text-gray-700">
                  {ruleTypeLabel(notification.ruleType)}（{formatJstDate(notification.occurrenceDate)}）
                </p>
                <p className="text-gray-500">
                  {noticeLabel(notification.noticeDaysBefore)} ・ {formatJst(notification.notifiedAt)}に送信
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
