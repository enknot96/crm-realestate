import { describe, it, expect } from "vitest";
import { buildPatrolReportTemplate } from "./checklistTemplate";
import { ChecklistResult } from "./checklistItems";

const allOk: ChecklistResult[] = [
  { key: "exteriorWall", label: "外壁", status: "ok" },
  { key: "roof", label: "屋根", status: "ok" },
  { key: "gardenWeeds", label: "庭・雑草", status: "ok" },
  { key: "mailbox", label: "郵便受け", status: "ok" },
  { key: "locks", label: "施錠確認", status: "ok" },
];

describe("buildPatrolReportTemplate", () => {
  it("全項目が「異常なし」の場合、各項目のラベルと「異常なし」を含む文章になる", () => {
    const text = buildPatrolReportTemplate(allOk);

    for (const item of allOk) {
      expect(text).toContain(item.label);
    }
    expect(text).toContain("異常なし");
    expect(text).not.toContain("要確認");
  });

  it("「要確認」の項目はラベルと「要確認」を含む", () => {
    const results: ChecklistResult[] = [
      ...allOk.slice(0, 2),
      { key: "gardenWeeds", label: "庭・雑草", status: "needsAttention", comment: "雑草が伸びています" },
      ...allOk.slice(3),
    ];

    const text = buildPatrolReportTemplate(results);

    expect(text).toContain("庭・雑草");
    expect(text).toContain("要確認");
  });

  it("「要確認」かつコメントがある場合、コメントの内容が本文に含まれる", () => {
    const results: ChecklistResult[] = [
      ...allOk.slice(0, 3),
      { key: "mailbox", label: "郵便受け", status: "needsAttention", comment: "チラシが溜まっていた" },
      ...allOk.slice(4),
    ];

    const text = buildPatrolReportTemplate(results);

    expect(text).toContain("チラシが溜まっていた");
  });

  it("「要確認」でもコメントが無い場合、'undefined'などの文字列が混ざらない", () => {
    const results: ChecklistResult[] = [
      ...allOk.slice(0, 3),
      { key: "mailbox", label: "郵便受け", status: "needsAttention" },
      ...allOk.slice(4),
    ];

    const text = buildPatrolReportTemplate(results);

    expect(text).not.toContain("undefined");
    expect(text).not.toContain("null");
  });

  it("全項目「異常なし」の場合と「要確認」を含む場合で、出力が異なる", () => {
    const withAttention: ChecklistResult[] = [
      ...allOk.slice(0, 4),
      { key: "locks", label: "施錠確認", status: "needsAttention", comment: "鍵が閉まっていなかった" },
    ];

    expect(buildPatrolReportTemplate(allOk)).not.toBe(buildPatrolReportTemplate(withAttention));
  });
});
