import { ApproveAndSendActionError } from "@/app/lib/patrolReport";
import { assertNever } from "@/domain/shared/assertNever";

// 画面には専門用語を出さない
export function describeApproveAndSendError(error: ApproveAndSendActionError): string {
  switch (error.kind) {
    case "notFound":
      return "巡回報告が見つかりませんでした。";
    case "notReviewing":
      return "この巡回報告は今、承認できる状態ではありません。";
    case "noLineUser":
      return "この物件のお客様はLINEと連携されていないため、送信できません。顧客一覧からLINEの友だちと紐づけてください。";
    case "alreadySent":
      return "この巡回報告は既に送信済みです。";
    case "quotaExceeded":
      return `今月あと${error.remainingMessages}件までしか送れません。`;
    case "repository":
      console.error("[patrol-reports] 承認・送信処理に失敗:", error.message);
      return "承認・送信の処理に失敗しました。時間をおいてもう一度お試しください。";
    case "send":
      console.error("[patrol-reports] LINE送信に失敗:", error.message);
      return "LINEへの送信に失敗しました。時間をおいてもう一度お試しください。";
    default:
      return assertNever(error);
  }
}
