import { describe, it, expect } from "vitest";
import { Tag, TagRepository } from "../tag/repository";
import { CustomerRepository } from "../customer/repository";
import { MessageLogRepository } from "./messageLogRepository";
import { LineUserId, TagId } from "../shared/branded";
import { confirmBroadcast } from "./broadcastConfirm";
import { MessageSenderError, MulticastSendResult } from "./messageSender";
import { ok, err, Result } from "../shared/result";

function notImplemented(): never {
  throw new Error("この操作はテストで使用しない想定です");
}

// テストで実際には呼ばれない想定のdeps(sendBroadcastMessagesまで到達しないケース用)
const unusedSendDeps = {
  segmentRepo: { listLineUserIdsByTagId: notImplemented },
  messageSender: { sendMulticast: notImplemented },
  messageLogWriter: { writeLogs: notImplemented },
};

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
const message = "テストメッセージ";

describe("confirmBroadcast", () => {
  it("本文が空の場合はemptyMessageを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => ok(12)),
      messageLogRepo: createFakeMessageLogRepository(0),
      ...unusedSendDeps,
    };

    const result = await confirmBroadcast(deps, sellerTag.id, "売主", "   ", now, monthlyQuota);

    expect(result).toEqual(err({ kind: "emptyMessage" }));
  });

  it("タグが存在しない場合はtagNotFoundを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([]),
      customerRepo: createFakeCustomerRepository(async () => ok(12)),
      messageLogRepo: createFakeMessageLogRepository(0),
      ...unusedSendDeps,
    };

    const result = await confirmBroadcast(deps, sellerTag.id, "売主", message, now, monthlyQuota);

    expect(result).toEqual(err({ kind: "tagNotFound" }));
  });

  it("入力されたタグ名が一致しない場合はtagNameMismatchを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => ok(12)),
      messageLogRepo: createFakeMessageLogRepository(0),
      ...unusedSendDeps,
    };

    const result = await confirmBroadcast(deps, sellerTag.id, "買主", message, now, monthlyQuota);

    expect(result).toEqual(err({ kind: "tagNameMismatch" }));
  });

  it("入力されたタグ名の前後の空白は無視して一致判定する", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => ok(12)),
      messageLogRepo: createFakeMessageLogRepository(0),
      segmentRepo: { listLineUserIdsByTagId: async () => ok<LineUserId[], string>([]) },
      // 対象0名でもsendMulticast自体は呼ばれる(空配列を渡すだけ)ため、
      // notImplementedのままにすると本テストが落ちる
      messageSender: {
        sendMulticast: async () =>
          ok<MulticastSendResult, MessageSenderError>({ succeededUserIds: [], failures: [] }),
      },
      // 成功件数が0件のときはwriteLogsは呼ばれない設計(broadcastSender.ts参照)
      messageLogWriter: { writeLogs: notImplemented },
    };

    const result = await confirmBroadcast(deps, sellerTag.id, "  売主  ", message, now, monthlyQuota);

    // タグ名は一致していること自体が本題なので、tagNameMismatchにさえなっていなければよい
    // (対象0名のため実際にはokになるが、それはこのテストの関心事ではない)
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
      ...unusedSendDeps,
    };

    const result = await confirmBroadcast(deps, sellerTag.id, "売主", message, now, monthlyQuota);

    expect(result).toEqual(err({ kind: "quotaExceeded", remainingMessages: 50 }));
  });

  it("タグ名が一致し上限内であれば、実際に送信してsentCountを返す", async () => {
    const targetUserIds: LineUserId[] = ["U1" as LineUserId, "U2" as LineUserId];
    const writeLogsCalls: Array<{ count: number; sentAt: Date }> = [];

    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => ok(12)),
      messageLogRepo: createFakeMessageLogRepository(0),
      segmentRepo: { listLineUserIdsByTagId: async () => ok<LineUserId[], string>(targetUserIds) },
      messageSender: {
        sendMulticast: async () =>
          ok<MulticastSendResult, MessageSenderError>({
            succeededUserIds: targetUserIds,
            failures: [],
          }),
      },
      messageLogWriter: {
        writeLogs: async (count: number, sentAt: Date): Promise<Result<void, string>> => {
          writeLogsCalls.push({ count, sentAt });
          return ok(undefined);
        },
      },
    };

    const result = await confirmBroadcast(deps, sellerTag.id, "売主", message, now, monthlyQuota);

    expect(result).toEqual(ok({ sentCount: 2 }));
    // 成功件数分がそのままログに記録されていること
    expect(writeLogsCalls).toEqual([{ count: 2, sentAt: now }]);
  });

  it("対象人数の取得に失敗した場合はrepositoryエラーを返す", async () => {
    const deps = {
      tagRepo: createFakeTagRepository([sellerTag]),
      customerRepo: createFakeCustomerRepository(async () => err("DB接続エラー")),
      messageLogRepo: createFakeMessageLogRepository(0),
      ...unusedSendDeps,
    };

    const result = await confirmBroadcast(deps, sellerTag.id, "売主", message, now, monthlyQuota);

    expect(result).toEqual(err({ kind: "repository", message: "DB接続エラー" }));
  });
});
