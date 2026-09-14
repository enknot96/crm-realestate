import { BroadcastPreviewError } from "@/domain/messaging/broadcastPreview";
import { ConfirmBroadcastError } from "@/domain/messaging/broadcastConfirm";
import { assertNever } from "@/domain/shared/assertNever";

// INV-8: 画面には専門用語を出さない。ここでエラーの種類ごとに、
// 不動産業の人が読んで意味がわかる日本語に変換する。

export function describePreviewError(error: BroadcastPreviewError): string {
  switch (error.kind) {
    case "tagNotFound":
      return "指定されたタグが見つかりませんでした。もう一度選び直してください";
    case "noRecipient":
      return `「${error.tagName}」のお客様がまだ登録されていないため、送信できません`;
    case "quotaExceeded":
      return `「${error.tagName}」のお客様 ${error.recipientCount}名に送ろうとしていますが、今月あと${error.remainingBeforeSend}件しか送れません`;
    case "repository":
      return error.message;
    default:
      return assertNever(error);
  }
}

export function describeConfirmError(error: ConfirmBroadcastError): string {
  switch (error.kind) {
    case "tagNotFound":
      return "指定されたタグが見つかりませんでした。もう一度選び直してください";
    case "tagNameMismatch":
      return "入力されたタグ名が一致しません。表示されているタグ名をそのまま入力してください";
    case "quotaExceeded":
      return `今月あと${error.remainingMessages}件までしか送れません`;
    case "repository":
      return error.message;
    case "notImplemented":
      return error.message;
    default:
      return assertNever(error);
  }
}
