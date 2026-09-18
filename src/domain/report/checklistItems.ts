// 巡回報告の定型チェック項目
export const CHECKLIST_ITEMS = [
  { key: "exteriorWall", label: "外壁" },
  { key: "roof", label: "屋根" },
  { key: "gardenWeeds", label: "庭・雑草" },
  { key: "mailbox", label: "郵便受け" },
  { key: "locks", label: "施錠確認" },
] as const; // as const = "exteriorWall"というリテラル型そのものにする（値イコール型）
// as constを付けることで、「ちょうど5要素、それぞれ決まった型を持つタプル」として扱われる
// 配列自体もreadonlyのタプルになる
// タプル = 「要素数と、各要素の型があらかじめ決まっている配列」

// 最終的に下記のような5つの文字列リテラル（その1つの値だけを許す型）のユニオン型になる
// "exteriorWall" | "roof" | "gardenWeeds" | "mailbox" | "locks"
export type ChecklistItemKey = (typeof CHECKLIST_ITEMS)[number]["key"];

export type ChecklistResult = {
  key: ChecklistItemKey;
  label: string;
  status: "ok" | "needsAttention";
  comment?: string;
};
