import { CustomerId, LineUserId, PropertyId } from "@/domain/shared/branded";
import { integer, primaryKey, serial, uuid } from "drizzle-orm/pg-core";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

// 定数 lineFriends = TS側でこのテーブルを参照するときに使う名前
// 第一引数 lineFriends = テーブル名
export const lineFriends = pgTable("line_friends", {
  // lineFriends.lineUserId のように書き、TS側でアクセスする
  lineUserId: text("line_user_id").primaryKey(),
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
  phone: text("phone").notNull(),
  email: text("email"),
  memo: text("memo"),
  postalCode: text("postal_code"),
  address: text("address"),
  lineUserId: text("line_user_id")
    // 存在しない相手(line_friends.lineUserId)を参照しようとしたら、そもそも保存できない
    .references(() => lineFriends.lineUserId) // references書いた側が子
    .$type<LineUserId>(),
  lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// どの顧客にどのタグがついているか を管理する
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
      .references(() => tags.id),
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
