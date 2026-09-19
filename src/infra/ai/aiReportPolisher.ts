import { generateText, Output } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { TextPolisher } from "@/domain/report/textPolisher";
import { fromPromise } from "@/domain/shared/result";

const polishedReportSchema = z.object({
  polishedText: z.string(),
});

// ここに渡すのはテンプレート文章のテキストのみ、画像やPII(氏名・住所等)は一切渡さない
export function createAiReportPolisher(apiKey: string): TextPolisher {
  const google = createGoogleGenerativeAI({ apiKey });
  const model = google("gemini-3.6-flash");

  return {
    polish: (text) => {
      return fromPromise(async () => {
        const { output } = await generateText({
          model,
          output: Output.object({ schema: polishedReportSchema }),
          prompt: [
            "以下は不動産の空き家巡回報告の下書きです。",
            "内容や事実関係は変えず、不動産管理会社から顧客に送る丁寧な日本語の報告文として自然に整えてください。",
            "各項目（外壁、屋根、庭・雑草、郵便受け、施錠確認など）は改行で分け、1項目1行で書いてください。1つの文章にまとめて続けて書かないでください。",
            "",
            text,
          ].join("\n"),
        });
        return output.polishedText;
      }, "報告文の清書に失敗しました");
    },
  };
}
