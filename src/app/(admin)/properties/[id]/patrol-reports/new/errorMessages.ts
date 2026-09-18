import { CreatePatrolReportActionError } from "./actions";
import { assertNever } from "@/domain/shared/assertNever";

// 画面には専門用語を出さない
export function describeCreatePatrolReportError(error: CreatePatrolReportActionError): string {
  switch (error.kind) {
    case "invalidChecklist":
      return "すべてのチェック項目に回答してください。";
    case "noChecklist":
      return "チェック項目が入力されていません。";
    case "noPhotos":
      return "写真を1枚以上選んでください。";
    case "unsupportedFormat":
      return `「${error.fileName}」はこの形式の画像に対応していません。JPEG・PNG・WebPの写真をお使いください。`;
    case "storage":
      console.error("[patrol-reports] 写真の保存に失敗:", error.message);
      return "写真の保存に失敗しました。時間をおいてもう一度お試しください。";
    case "repository":
      console.error("[patrol-reports] 巡回報告の保存に失敗:", error.message);
      return "巡回報告の保存に失敗しました。時間をおいてもう一度お試しください。";
    default:
      return assertNever(error);
  }
}
