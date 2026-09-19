// 挨拶・締めをAIに生成させると毎回表現がブレるため、固定文言としてここで一括管理する。
// AIには checklistResults の清書だけをさせ、挨拶・締めはコードで結合する
const GREETING = [
  "いつも大変お世話になっております。",
  "みらい不動産 代表取締役の未来拓也です。",
  "巡回結果をご報告いたします。",
].join("\n");

const CLOSING = [
  "以上、巡回結果のご報告です。今後ともよろしくお願いいたします。",
  "",
  "みらい不動産",
  "代表取締役 未来 拓也",
].join("\n");

// 巡回報告を新規作成する時にだけ1回呼ぶ
// 以降(結果ページでの編集・保存)はすでに挨拶・締め込みの本文を編集するだけなので、この関数を通さない
export function wrapReportWithGreeting(body: string): string {
  return `${GREETING}\n\n${body}\n\n${CLOSING}`;
}
