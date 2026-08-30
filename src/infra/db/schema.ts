import { CustomerId, LineUserId } from "@/domain/shared/branded";
import { uuid } from "drizzle-orm/pg-core";
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
