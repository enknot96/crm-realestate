import { describe, it, expect } from "vitest";
import type { webhook } from "@line/bot-sdk";
import { toLineFriendEvent } from "./toLineFriendEvent";

const baseFields = {
  timestamp: 1700000000000,
  mode: "active" as const,
  webhookEventId: "test-event-id",
  deliveryContext: { isRedelivery: false },
};

describe("toLineFriendEvent", () => {
  it("新規フォロー（isUnblocked: false）は followed になる", () => {
    const event: webhook.Event = {
      ...baseFields,
      type: "follow",
      replyToken: "test-reply-token",
      source: { type: "user", userId: "U_TEST_1" },
      follow: { isUnblocked: false },
    };

    const result = toLineFriendEvent(event, "テスト太郎");

    expect(result).toEqual({
      kind: "followed",
      lineUserId: "U_TEST_1",
      displayName: "テスト太郎",
      followedAt: new Date(1700000000000),
    });
  });

  it("ブロック解除（isUnblocked: true）は unblocked になる", () => {
    const event: webhook.Event = {
      ...baseFields,
      type: "follow",
      replyToken: "test-reply-token",
      source: { type: "user", userId: "U_TEST_2" },
      follow: { isUnblocked: true },
    };

    const result = toLineFriendEvent(event, "テスト花子");

    expect(result).toEqual({
      kind: "unblocked",
      lineUserId: "U_TEST_2",
      displayName: "テスト花子",
      followedAt: new Date(1700000000000),
    });
  });

  it("unfollow は blocked になる", () => {
    const event: webhook.Event = {
      ...baseFields,
      type: "unfollow",
      source: { type: "user", userId: "U_TEST_3" },
    };

    const result = toLineFriendEvent(event);

    expect(result).toEqual({
      kind: "blocked",
      lineUserId: "U_TEST_3",
      blockedAt: new Date(1700000000000),
    });
  });

  it("それ以外のイベント種別は ignored になる", () => {
    const event: webhook.Event = {
      ...baseFields,
      replyToken: "test-reply-token",
      type: "join",
      source: { type: "group", groupId: "G_TEST" },
    };

    const result = toLineFriendEvent(event);

    expect(result).toEqual({ kind: "ignored" });
  });
});
