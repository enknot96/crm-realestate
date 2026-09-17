import { describe, it, expect, vi } from "vitest";
import { Tag, TagRepository } from "../tag/repository";
import { Broadcast, BroadcastRepository } from "./broadcastRepository";
import { BroadcastId, TagId } from "../shared/branded";
import { scheduleBroadcast } from "./scheduleBroadcast";
import { ok, err } from "../shared/result";

function notImplemented(): never {
  throw new Error("この操作はテストで使用しない想定です");
}

function createFakeTagRepository(tags: Tag[]): TagRepository {
  return {
    list: async () => ok(tags),
    findById: async (id) => ok(tags.find((t) => t.id === id) ?? null),
    create: notImplemented,
    remove: notImplemented,
  };
}

function createFakeBroadcastRepository(
  create: BroadcastRepository["create"] = notImplemented,
): BroadcastRepository {
  return {
    create,
    findDuePending: notImplemented,
    markSent: notImplemented,
    markFailed: notImplemented,
  };
}

const sellerTag: Tag = { id: 1 as TagId, name: "売主" };
const now = new Date("2026-09-14T00:00:00+09:00");
const future = new Date("2026-09-20T00:00:00+09:00");
const message = "テストメッセージ";

describe("scheduleBroadcast", () => {
  it("正常な場合、予約(pending)が作成される", async () => {
    const createdBroadcast: Broadcast = {
      id: "broadcast-1" as BroadcastId,
      tagId: sellerTag.id,
      message,
      scheduledAt: future,
      status: "pending",
      createdAt: now,
      sentAt: null,
      sentCount: null,
    };
    const create = vi.fn(async () => ok<Broadcast, string>(createdBroadcast));
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      broadcastRepo: createFakeBroadcastRepository(create),
    };

    const result = await scheduleBroadcast(deps, sellerTag.id, "売主", message, future, now);

    expect(result).toEqual(ok(createdBroadcast));
    expect(create).toHaveBeenCalledWith({ tagId: sellerTag.id, message, scheduledAt: future });
  });

  it("入力されたタグ名が一致しない場合はtagNameMismatchを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      broadcastRepo: createFakeBroadcastRepository(),
    };

    const result = await scheduleBroadcast(deps, sellerTag.id, "買主", message, future, now);

    expect(result).toEqual(err({ kind: "tagNameMismatch" }));
  });

  it("予約日時が現在以前の場合はpastDateTimeを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      broadcastRepo: createFakeBroadcastRepository(),
    };
    const past = new Date("2026-09-01T00:00:00+09:00");

    const result = await scheduleBroadcast(deps, sellerTag.id, "売主", message, past, now);

    expect(result).toEqual(err({ kind: "pastDateTime" }));
  });

  it("タグが存在しない場合はtagNotFoundを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([]),
      broadcastRepo: createFakeBroadcastRepository(),
    };

    const result = await scheduleBroadcast(deps, sellerTag.id, "売主", message, future, now);

    expect(result).toEqual(err({ kind: "tagNotFound" }));
  });

  it("本文が空の場合はemptyMessageを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      broadcastRepo: createFakeBroadcastRepository(),
    };

    const result = await scheduleBroadcast(deps, sellerTag.id, "売主", "   ", future, now);

    expect(result).toEqual(err({ kind: "emptyMessage" }));
  });

  it("予約の保存に失敗した場合はrepositoryエラーを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      broadcastRepo: createFakeBroadcastRepository(async () => err("DB接続エラー")),
    };

    const result = await scheduleBroadcast(deps, sellerTag.id, "売主", message, future, now);

    expect(result).toEqual(err({ kind: "repository", message: "DB接続エラー" }));
  });
});
