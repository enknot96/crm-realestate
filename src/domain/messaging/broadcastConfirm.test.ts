import { describe, it, expect } from "vitest";
import { Tag, TagRepository } from "../tag/repository";
import { CustomerRepository } from "../customer/repository";
import { MessageLogRepository } from "./messageLogRepository";
import { TagId } from "../shared/branded";
import { confirmBroadcast } from "./broadcastConfirm";
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

describe("confirmBroadcast", () => {
  it("タグが存在しない場合はtagNotFoundを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([]),
      customerRepo: createFakeCustomerRepository(async () => ok(12)),
      messageLogRepo: createFakeMessageLogRepository(0),
    };

    const result = await confirmBroadcast(deps, sellerTag.id, "売主", now, monthlyQuota);

    expect(result).toEqual(err({ kind: "tagNotFound" }));
  });

  it("入力されたタグ名が一致しない場合はtagNameMismatchを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => ok(12)),
      messageLogRepo: createFakeMessageLogRepository(0),
    };

    const result = await confirmBroadcast(deps, sellerTag.id, "買主", now, monthlyQuota);

    expect(result).toEqual(err({ kind: "tagNameMismatch" }));
  });

  it("入力されたタグ名の前後の空白は無視して一致判定する", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => ok(12)),
      messageLogRepo: createFakeMessageLogRepository(0),
    };

    const result = await confirmBroadcast(deps, sellerTag.id, "  売主  ", now, monthlyQuota);

    // タグ名は一致するので、この先(送信)まで進む＝tagNameMismatchにはならない
    expect(result.kind).toBe("err");
    if (result.kind === "err") {
      expect(result.error.kind).not.toBe("tagNameMismatch");
    }
  });

  it("上限を超える場合はquotaExceededを返す", async () => {
    // 実測150件済み、対象51名 → 201件(上限超え)
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => ok(51)),
      messageLogRepo: createFakeMessageLogRepository(150),
    };

    const result = await confirmBroadcast(deps, sellerTag.id, "売主", now, monthlyQuota);

    expect(result).toEqual(err({ kind: "quotaExceeded", remainingMessages: 50 }));
  });

  it("タグ名が一致し上限内であれば、送信処理(sendBroadcastMessages)まで進む", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => ok(12)),
      messageLogRepo: createFakeMessageLogRepository(0),
    };

    const result = await confirmBroadcast(deps, sellerTag.id, "売主", now, monthlyQuota);

    // 実際のLINE送信(MessageSender)は別worktreeで実装中のため、
    // 現時点ではnotImplementedに到達することが「正しい」結果
    expect(result).toEqual(err({ kind: "notImplemented" }));
  });

  it("対象人数の取得に失敗した場合はrepositoryエラーを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => err("DB接続エラー")),
      messageLogRepo: createFakeMessageLogRepository(0),
    };

    const result = await confirmBroadcast(deps, sellerTag.id, "売主", now, monthlyQuota);

    expect(result).toEqual(err({ kind: "repository", message: "DB接続エラー" }));
  });
});
