import { describe, it, expect } from "vitest";
import { Tag, TagRepository } from "../tag/repository";
import { CustomerRepository } from "../customer/repository";
import { MessageLogRepository } from "./messageLogRepository";
import { TagId } from "../shared/branded";
import { previewScheduledBroadcast } from "./previewScheduledBroadcast";
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

function createFakeCustomerRepository(
  countSendableByTagId: CustomerRepository["countSendableByTagId"],
): CustomerRepository {
  return {
    findById: notImplemented,
    create: notImplemented,
    update: notImplemented,
    remove: notImplemented,
    list: notImplemented,
    linkLineFriend: notImplemented,
    listAllForSelect: notImplemented,
    markContacted: notImplemented,
    getTagIds: notImplemented,
    setTags: notImplemented,
    listAll: notImplemented,
    listAllPhones: notImplemented,
    countSendableByTagId,
  };
}

function createFakeMessageLogRepository(currentCount: number): MessageLogRepository {
  return {
    countThisMonth: async () => ok(currentCount),
  };
}

const sellerTag: Tag = { id: 1 as TagId, name: "売主" };
const now = new Date("2026-09-14T00:00:00+09:00");
const future = new Date("2026-09-20T00:00:00+09:00");
const monthlyQuota = 200;
const message = "テストメッセージ";

describe("previewScheduledBroadcast", () => {
  it("正常な場合、見積もりを含むプレビューを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => ok(12)),
      messageLogRepo: createFakeMessageLogRepository(100),
    };

    const result = await previewScheduledBroadcast(deps, sellerTag.id, message, future, now, monthlyQuota);

    expect(result).toEqual(
      ok({
        tagId: sellerTag.id,
        tagName: "売主",
        message,
        scheduledAt: future,
        recipientCount: 12,
        monthlyQuota: 200,
        remainingBeforeSend: 100,
        remainingAfterSend: 88,
      }),
    );
  });

  it("今月の残り件数を超える見積もりでもブロックしない(マイナスの見積もりを返す)", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => ok(51)),
      messageLogRepo: createFakeMessageLogRepository(150),
    };

    const result = await previewScheduledBroadcast(deps, sellerTag.id, message, future, now, monthlyQuota);

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.value.remainingAfterSend).toBe(-1); // 50 - 51
    }
  });

  it("予約日時が現在以前の場合はpastDateTimeを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => ok(12)),
      messageLogRepo: createFakeMessageLogRepository(0),
    };

    const past = new Date("2026-09-01T00:00:00+09:00");
    const result = await previewScheduledBroadcast(deps, sellerTag.id, message, past, now, monthlyQuota);

    expect(result).toEqual(err({ kind: "pastDateTime" }));
  });

  it("タグが存在しない場合はtagNotFoundを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([]),
      customerRepo: createFakeCustomerRepository(async () => ok(12)),
      messageLogRepo: createFakeMessageLogRepository(0),
    };

    const result = await previewScheduledBroadcast(deps, sellerTag.id, message, future, now, monthlyQuota);

    expect(result).toEqual(err({ kind: "tagNotFound" }));
  });

  it("対象人数が0名の場合はnoRecipientを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => ok(0)),
      messageLogRepo: createFakeMessageLogRepository(0),
    };

    const result = await previewScheduledBroadcast(deps, sellerTag.id, message, future, now, monthlyQuota);

    expect(result).toEqual(err({ kind: "noRecipient", tagName: "売主" }));
  });

  it("本文が空の場合はemptyMessageを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => ok(12)),
      messageLogRepo: createFakeMessageLogRepository(0),
    };

    const result = await previewScheduledBroadcast(deps, sellerTag.id, "   ", future, now, monthlyQuota);

    expect(result).toEqual(err({ kind: "emptyMessage" }));
  });

  it("対象人数の取得に失敗した場合はrepositoryエラーを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => err("DB接続エラー")),
      messageLogRepo: createFakeMessageLogRepository(0),
    };

    const result = await previewScheduledBroadcast(deps, sellerTag.id, message, future, now, monthlyQuota);

    expect(result).toEqual(err({ kind: "repository", message: "DB接続エラー" }));
  });
});
