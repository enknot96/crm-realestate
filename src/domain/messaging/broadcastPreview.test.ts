import { describe, it, expect } from "vitest";
import { Tag, TagRepository } from "../tag/repository";
import { CustomerRepository } from "../customer/repository";
import { MessageLogRepository } from "./messageLogRepository";
import { TagId } from "../shared/branded";
import { previewBroadcast } from "./broadcastPreview";
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
const monthlyQuota = 200;

describe("previewBroadcast", () => {
  it("正常な場合、タグ名・人数・残り件数を含むプレビューを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => ok(12)),
      messageLogRepo: createFakeMessageLogRepository(100),
    };

    const result = await previewBroadcast(deps, sellerTag.id, now, monthlyQuota);

    expect(result).toEqual(
      ok({
        tagId: sellerTag.id,
        tagName: "売主",
        recipientCount: 12,
        monthlyQuota: 200,
        remainingBeforeSend: 100, // 200 - 100
        remainingAfterSend: 88, // 100 - 12
      }),
    );
  });

  it("タグが存在しない場合はtagNotFoundを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([]),
      customerRepo: createFakeCustomerRepository(async () => ok(12)),
      messageLogRepo: createFakeMessageLogRepository(0),
    };

    const result = await previewBroadcast(deps, sellerTag.id, now, monthlyQuota);

    expect(result).toEqual(err({ kind: "tagNotFound" }));
  });

  it("対象人数が0名の場合はnoRecipientを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => ok(0)),
      messageLogRepo: createFakeMessageLogRepository(0),
    };

    const result = await previewBroadcast(deps, sellerTag.id, now, monthlyQuota);

    expect(result).toEqual(err({ kind: "noRecipient", tagName: "売主" }));
  });

  it("残り件数にちょうど収まる場合（境界値）は成功する", async () => {
    // 実測150件済み、対象50名 → 150 + 50 = 200 (monthlyQuotaと同値なので許可)
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => ok(50)),
      messageLogRepo: createFakeMessageLogRepository(150),
    };

    const result = await previewBroadcast(deps, sellerTag.id, now, monthlyQuota);

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.value.remainingAfterSend).toBe(0);
    }
  });

  it("上限を1件でも超える場合（境界値）はquotaExceededを返す", async () => {
    // 実測150件済み、対象51名 → 150 + 51 = 201 (上限超え)
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => ok(51)),
      messageLogRepo: createFakeMessageLogRepository(150),
    };

    const result = await previewBroadcast(deps, sellerTag.id, now, monthlyQuota);

    expect(result).toEqual(
      err({
        kind: "quotaExceeded",
        tagName: "売主",
        recipientCount: 51,
        remainingBeforeSend: 50,
      }),
    );
  });

  it("実測値(countThisMonth)が上限を超えていてもremainingBeforeSendは0未満にならない", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => ok(5)),
      messageLogRepo: createFakeMessageLogRepository(210),
    };

    const result = await previewBroadcast(deps, sellerTag.id, now, monthlyQuota);

    expect(result).toEqual(
      err({
        kind: "quotaExceeded",
        tagName: "売主",
        recipientCount: 5,
        remainingBeforeSend: 0,
      }),
    );
  });

  it("対象人数の取得に失敗した場合はrepositoryエラーを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => err("DB接続エラー")),
      messageLogRepo: createFakeMessageLogRepository(0),
    };

    const result = await previewBroadcast(deps, sellerTag.id, now, monthlyQuota);

    expect(result).toEqual(err({ kind: "repository", message: "DB接続エラー" }));
  });

  it("送信実績の取得に失敗した場合はrepositoryエラーを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => ok(12)),
      messageLogRepo: { countThisMonth: async () => err<number, string>("DB接続エラー") },
    };

    const result = await previewBroadcast(deps, sellerTag.id, now, monthlyQuota);

    expect(result).toEqual(err({ kind: "repository", message: "DB接続エラー" }));
  });
});
