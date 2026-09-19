import { TextPolisher } from "./textPolisher";

export type PolishedReport = {
  text: string;
  generatedBy: "ai" | "template";
};

// テンプレート文章をAIで清書
export async function polishPatrolReportText(
  textPolisher: TextPolisher,
  templateText: string,
): Promise<PolishedReport> {
  const result = await textPolisher.polish(templateText);

  if (result.kind === "ok") {
    return {
      text: result.value,
      generatedBy: "ai",
    };
  }
  return {
    text: templateText,
    generatedBy: "template",
  };
}
