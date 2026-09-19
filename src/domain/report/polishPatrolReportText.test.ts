import { describe, it, expect } from "vitest";
import { polishPatrolReportText } from "./polishPatrolReportText";
import { TextPolisher } from "./textPolisher";
import { ok, err } from "../shared/result";

function createFakeTextPolisher(polish: TextPolisher["polish"]): TextPolisher {
  return { polish };
}

describe("polishPatrolReportText", () => {
  it("清書に成功した場合、清書後のテキストと generatedBy: 'ai' を返す", async () => {
    const textPolisher = createFakeTextPolisher(async () => ok("清書済みの文章です"));

    const result = await polishPatrolReportText(textPolisher, "テンプレート文章");

    expect(result).toEqual({ text: "清書済みの文章です", generatedBy: "ai" });
  });

  it("清書に失敗した場合、渡したテンプレート文章のまま generatedBy: 'template' を返す(例外は投げない)", async () => {
    const textPolisher = createFakeTextPolisher(async () => err<string, string>("AI呼び出しに失敗しました"));

    const result = await polishPatrolReportText(textPolisher, "テンプレート文章");

    expect(result).toEqual({ text: "テンプレート文章", generatedBy: "template" });
  });
});
