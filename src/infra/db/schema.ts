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
