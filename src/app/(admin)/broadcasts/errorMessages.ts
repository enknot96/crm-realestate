import { BroadcastPreviewError } from "@/domain/messaging/broadcastPreview";
import { ConfirmBroadcastError } from "@/domain/messaging/broadcastConfirm";
import { assertNever } from "@/domain/shared/assertNever";

// INV-8: 画面には専門用語を出さない。ここでエラーの種類ごとに、
// 不動産業の人が読んで意味がわかる日本語に変換する。

export function describePreviewError(error: BroadcastPreviewError): string {
  switch (error.kind) {
    case "tagNotFound":
      return "指定されたタグが見つかりませんでした。もう一度選び直してください";
    case "emptyMessage":
      return "送信する内容を入力してください";
    case "noRecipient":
      return `「${error.tagName}」のお客様でLINEとつながっている方がいないため、送信できません。顧客一覧からLINEの友だちとひもづけてください`;
    case "quotaExceeded":
      return `「${error.tagName}」のお客様 ${error.recipientCount}名に送ろうとしていますが、今月あと${error.remainingBeforeSend}件しか送れません`;
    case "repository":
      // DBドライバの生の例外文などが入りうるため、画面には出さずログにだけ残す(INV-8)
      console.error("[broadcasts] previewの確認情報の取得に失敗:", error.message);
      return "確認情報の取得に失敗しました。時間をおいてもう一度お試しください";
    default:
      return assertNever(error);
  }
}

export function describeConfirmError(error: ConfirmBroadcastError): string {
  switch (error.kind) {
    case "tagNotFound":
      return "指定されたタグが見つかりませんでした。もう一度選び直してください";
    case "emptyMessage":
      return "送信する内容を入力してください";
    case "tagNameMismatch":
      return "入力されたタグ名が一致しません。表示されているタグ名をそのまま入力してください";
    case "quotaExceeded":
      return `今月あと${error.remainingMessages}件までしか送れません`;
    case "repository":
      // DBドライバの生の例外文などが入りうるため、画面には出さずログにだけ残す(INV-8)
      console.error("[broadcasts] 送信確認情報の取得に失敗:", error.message);
      return "送信情報の確認に失敗しました。時間をおいてもう一度お試しください";
    case "permitExceeded":
      // 予約件数と実際の宛先数が食い違った場合(通常は発生しないはずの内部的な不整合)
      console.error("[broadcasts] permitと宛先数の不一致:", error);
      return "送信の準備中に問題が発生しました。もう一度最初からやり直してください";
    case "unsupportedMessage":
      console.error("[broadcasts] 未対応のメッセージ形式:", error.detail);
      return "この内容は送信できませんでした。文章を短くするなどして、もう一度お試しください";
    default:
      return assertNever(error);
  }
}
