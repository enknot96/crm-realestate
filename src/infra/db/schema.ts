import {
  BroadcastId,
  CustomerId,
  LineUserId,
  PropertyId,
  ReportId,
  TagId,
} from "@/domain/shared/branded";
import { ChecklistResult } from "@/domain/report/checklistItems";
import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// 定数 lineFriends = TS側でこのテーブルを参照するときに使う名前
// 第一引数 lineFriends = テーブル名
export const lineFriends = pgTable("line_friends", {
  // lineFriends.lineUserId のように書き、TS側でアクセスする
  lineUserId: text("line_user_id").primaryKey().$type<LineUserId>(),
  displayName: text("display_name").notNull(),
  followedAt: timestamp("followed_at", { withTimezone: true }).notNull(),
  blockedAt: timestamp("blocked_at", { withTimezone: true }),
});

export const lineWebhookEvents = pgTable("line_webhook_events", {
  eventId: text("event_id").primaryKey(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom().$type<CustomerId>(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email"),
  memo: text("memo"),
  postalCode: text("postal_code"),
  address: text("address"),
  lineUserId: text("line_user_id")
    .unique() // この列の値は重複してはいけない
    // 存在しない相手(line_friends.lineUserId)を参照しようとしたら、そもそも保存できない
    .references(() => lineFriends.lineUserId) // references書いた側が子
    .$type<LineUserId>(),
  lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey().$type<TagId>(),
  name: text("name").notNull().unique(),
});

// どの顧客にどのタグがついているか を管理する
// 顧客(customers)とタグ(tags)は「多対多」の関係
export const customerTags = pgTable(
  "customer_tags",
  {
    // 単独では重複してOK
    // 例) 田中さんのcustomerIdと売主のtagId、田中さんのidと管理オーナーのtagId
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id)
      .$type<CustomerId>(),
    // 単独では重複してOK
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id)
      .$type<TagId>(),
  },
  // 複合主キー = 例) 田中さんに『売主』タグを、うっかり2回付けてしまうという重複をDBが防ぐ
  // 田中さんのuuid + 売主のtag_id という組み合わせが1行しか存在できないことを定義
  (t) => [primaryKey({ columns: [t.customerId, t.tagId] })],
);

export const properties = pgTable("properties", {
  id: uuid("id").primaryKey().defaultRandom().$type<PropertyId>(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id)
    .$type<CustomerId>(),
  name: text("name").notNull(),
  address: text("address"),
  structureType: text("structure_type"),
  floors: integer("floors"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ステートは "draft" | "reviewing" | "approved" | "sent" | "failed"
// body/generatedByは reviewing になって初めて値が入る
// approvedAt/sentAt/failedReasonは、それぞれの状態になって初めて値が入る
export const patrolReports = pgTable("patrol_reports", {
  id: uuid("id").primaryKey().defaultRandom().$type<ReportId>(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id)
    .$type<PropertyId>(),
  photoKeys: text("photo_keys").array().notNull(),
  checklistResults: jsonb("checklist_results").notNull().$type<ChecklistResult[]>(),
  status: text("status").notNull(),
  body: text("body"),
  generatedBy: text("generated_by"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  failedReason: text("failed_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 二重送信防止のDB制約
// report_idをPKにすることで、同じ報告書に対する2回目のINSERTが主キー制約違反になる
export const patrolReportSends = pgTable("patrol_report_sends", {
  reportId: uuid("report_id")
    .primaryKey()
    .references(() => patrolReports.id)
    .$type<ReportId>(),
});

// QuotaGuardの通数カウントの根拠となるテーブル(最小限のカラムのみ)
export const messageLogs = pgTable("message_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

export const broadcasts = pgTable("broadcasts", {
  id: uuid("id").primaryKey().defaultRandom().$type<BroadcastId>(),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tags.id)
    .$type<TagId>(),
  message: text("message").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  sentCount: integer("sent_count"),
});
