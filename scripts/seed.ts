// デモ用の架空データを投入するスクリプト。何度実行しても同じ状態になるよう、
// 投入前にデモ対象のテーブルを全部空にしてから作り直す(reset-demo.tsからも再利用する想定)
// 使い方: pnpm seed
import { getDb } from "@/infra/db/client";
import {
  broadcasts,
  contracts,
  customerTags,
  customers,
  lineFriends,
  messageLogs,
  patrolReports,
  patrolReportSends,
  properties,
  reminderNotifications,
  tags,
} from "@/infra/db/schema";
import { wrapReportWithGreeting } from "@/domain/report/reportGreeting";
import { CHECKLIST_ITEMS, ChecklistResult } from "@/domain/report/checklistItems";
import { fromJstYmd, getJstYmd } from "@/domain/reminder/reminderDate";
import { LineUserId } from "@/domain/shared/branded";

const db = getDb();

const DAY_MS = 24 * 60 * 60 * 1000;
const { year, month, day } = getJstYmd(new Date());
const todayMidnight = fromJstYmd(year, month, day);
const daysAgo = (n: number) => new Date(todayMidnight.getTime() - n * DAY_MS);

function buildChecklistResults(needsAttentionKey?: string): ChecklistResult[] {
  return CHECKLIST_ITEMS.map((item) => ({
    key: item.key,
    label: item.label,
    status: item.key === needsAttentionKey ? "needsAttention" : "ok",
    ...(item.key === needsAttentionKey
      ? { comment: "庭の雑草が伸びていたため、簡易的に除草しました。" }
      : {}),
  }));
}

async function main() {
  console.log("既存のデモデータを削除しています...");
  // 子テーブルから順に削除する(外部キー制約があるため)
  await db.delete(reminderNotifications);
  await db.delete(contracts);
  await db.delete(patrolReportSends);
  await db.delete(patrolReports);
  await db.delete(broadcasts);
  await db.delete(messageLogs);
  await db.delete(customerTags);
  await db.delete(properties);
  await db.delete(customers);
  await db.delete(tags);
  await db.delete(lineFriends);

  console.log("タグを作成しています...");
  const [sellerTag, buyerTag, ownerTag] = await db
    .insert(tags)
    .values([{ name: "売主" }, { name: "買主" }, { name: "管理オーナー" }])
    .returning();
  if (sellerTag === undefined || buyerTag === undefined || ownerTag === undefined) {
    throw new Error("タグの作成に失敗しました");
  }

  console.log("LINE友だちを作成しています...");
  const lineFriendSeeds = [
    { lineUserId: "line-user-01" as LineUserId, displayName: "たなか" },
    { lineUserId: "line-user-02" as LineUserId, displayName: "さとうくみこ" },
    { lineUserId: "line-user-03" as LineUserId, displayName: "けんた" },
    { lineUserId: "line-user-04" as LineUserId, displayName: "watanabe_naoko" },
    { lineUserId: "line-user-05" as LineUserId, displayName: "こばやし" },
    { lineUserId: "line-user-06" as LineUserId, displayName: "yumi.k" },
  ];
  await db.insert(lineFriends).values(
    lineFriendSeeds.map((f) => ({
      lineUserId: f.lineUserId,
      displayName: f.displayName,
      followedAt: daysAgo(120),
    })),
  );

  console.log("顧客を作成しています...");
  const ownerCustomerSeeds = [
    { name: "田中 誠", phone: "090-1111-0001", lineUserId: lineFriendSeeds[0]?.lineUserId },
    { name: "佐藤 久美子", phone: "090-1111-0002", lineUserId: lineFriendSeeds[1]?.lineUserId },
    { name: "鈴木 一郎", phone: "090-1111-0003", lineUserId: undefined },
    { name: "高橋 美咲", phone: "090-1111-0004", lineUserId: undefined },
  ] as const;
  const sellerCustomerSeeds = [
    { name: "伊藤 健太", phone: "090-2222-0001", lineUserId: lineFriendSeeds[2]?.lineUserId },
    { name: "渡辺 直子", phone: "090-2222-0002", lineUserId: lineFriendSeeds[3]?.lineUserId },
    { name: "山本 隆", phone: "090-2222-0003", lineUserId: undefined },
    { name: "中村 恵子", phone: "090-2222-0004", lineUserId: undefined },
  ] as const;
  const buyerCustomerSeeds = [
    { name: "小林 修", phone: "090-3333-0001", lineUserId: lineFriendSeeds[4]?.lineUserId },
    { name: "加藤 由美", phone: "090-3333-0002", lineUserId: lineFriendSeeds[5]?.lineUserId },
    { name: "吉田 大輔", phone: "090-3333-0003", lineUserId: undefined },
    { name: "山口 さくら", phone: "090-3333-0004", lineUserId: undefined },
  ] as const;

  const ownerCustomers = await db
    .insert(customers)
    .values(
      ownerCustomerSeeds.map((c) => ({
        name: c.name,
        phone: c.phone,
        lineUserId: c.lineUserId,
        lastContactedAt: daysAgo(10),
      })),
    )
    .returning();
  const sellerCustomers = await db
    .insert(customers)
    .values(
      sellerCustomerSeeds.map((c) => ({
        name: c.name,
        phone: c.phone,
        lineUserId: c.lineUserId,
        lastContactedAt: daysAgo(40),
      })),
    )
    .returning();
  const buyerCustomers = await db
    .insert(customers)
    .values(
      buyerCustomerSeeds.map((c) => ({
        name: c.name,
        phone: c.phone,
        lineUserId: c.lineUserId,
        lastContactedAt: daysAgo(5),
      })),
    )
    .returning();

  console.log("タグ付けをしています...");
  await db.insert(customerTags).values([
    ...ownerCustomers.map((c) => ({ customerId: c.id, tagId: ownerTag.id })),
    ...sellerCustomers.map((c) => ({ customerId: c.id, tagId: sellerTag.id })),
    ...buyerCustomers.map((c) => ({ customerId: c.id, tagId: buyerTag.id })),
  ]);

  console.log("物件を作成しています...");
  const owner = (i: number) => {
    const c = ownerCustomers[i];
    if (c === undefined) throw new Error("管理オーナーの作成に失敗しました");
    return c;
  };
  const propertySeeds = [
    { customer: owner(0), name: "青葉荘", structureType: "木造2階建て", floors: 2 },
    { customer: owner(0), name: "さくらマンション202号室", structureType: "RC造", floors: 5 },
    { customer: owner(1), name: "ひまわりコーポ", structureType: "軽量鉄骨2階建て", floors: 2 },
    { customer: owner(2), name: "松風ハイツ305号室", structureType: "RC造", floors: 8 },
    { customer: owner(3), name: "けやき荘", structureType: "木造2階建て", floors: 2 },
  ];
  const insertedProperties = await db
    .insert(properties)
    .values(
      propertySeeds.map((p) => ({
        customerId: p.customer.id,
        name: p.name,
        structureType: p.structureType,
        floors: p.floors,
      })),
    )
    .returning();

  console.log("契約情報を作成しています...");
  // 5物件それぞれ契約日をずらし、次回発火日の様子に幅を持たせる
  const contractDaysAgo = [95, 60, 35, 20, 9];
  await db.insert(contracts).values(
    insertedProperties.map((property, i) => ({
      propertyId: property.id,
      contractDate: daysAgo(contractDaysAgo[i] ?? 30),
    })),
  );

  console.log("巡回報告の履歴を作成しています...");
  const aoba = insertedProperties[0];
  const sakura = insertedProperties[1];
  if (aoba === undefined || sakura === undefined) {
    throw new Error("巡回報告用の物件が見つかりません");
  }
  await db.insert(patrolReports).values([
    {
      propertyId: aoba.id,
      photoKeys: [],
      checklistResults: buildChecklistResults(),
      status: "sent",
      body: wrapReportWithGreeting(
        "本日巡回いたしましたが、外壁・屋根・郵便受け・施錠とも問題ございませんでした。",
      ),
      generatedBy: "ai",
      approvedAt: daysAgo(14),
      sentAt: daysAgo(14),
      createdAt: daysAgo(14),
    },
    {
      propertyId: aoba.id,
      photoKeys: [],
      checklistResults: buildChecklistResults("gardenWeeds"),
      status: "sent",
      body: wrapReportWithGreeting(
        "本日巡回いたしました。庭の雑草が伸びておりましたので、簡易的に除草いたしました。その他の項目に問題はございませんでした。",
      ),
      generatedBy: "ai",
      approvedAt: daysAgo(28),
      sentAt: daysAgo(28),
      createdAt: daysAgo(28),
    },
    {
      propertyId: sakura.id,
      photoKeys: [],
      checklistResults: buildChecklistResults(),
      status: "sent",
      body: wrapReportWithGreeting(
        "本日巡回いたしましたが、各項目とも問題ございませんでした。",
      ),
      generatedBy: "human",
      approvedAt: daysAgo(7),
      sentAt: daysAgo(7),
      createdAt: daysAgo(7),
    },
  ]);

  console.log("配信履歴を作成しています...");
  await db.insert(broadcasts).values([
    {
      tagId: sellerTag.id,
      message: "いつもお世話になっております。今月の物件状況についてご報告のご連絡です。",
      scheduledAt: daysAgo(20),
      status: "sent",
      sentAt: daysAgo(20),
      sentCount: sellerCustomers.length,
    },
  ]);

  console.log("送信ログを作成しています...");
  await db.insert(messageLogs).values(
    Array.from({ length: 15 }, (_, i) => ({ sentAt: daysAgo(i % 5) })),
  );

  console.log("完了しました。");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
