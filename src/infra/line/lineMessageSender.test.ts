import { describe, it, expect, vi } from "vitest";
import { HTTPFetchError } from "@line/bot-sdk";
import { createLineMessageSender, MulticastClient } from "./lineMessageSender";
import { LineUserId } from "@/domain/shared/branded";
import { SendPermit } from "@/domain/messaging/quotaGuard";

// SendPermitは reserve() 経由でしか作れない設計(INV-1)だが、
// テストではreserve()を呼ぶために必要なリポジトリを用意する代わりに、
// ダミー値をテスト内だけでキャストして使う。
function createDummyPermit(count: number): SendPermit {
  return { count } as SendPermit;
}

function createUserIds(count: number): LineUserId[] {
  return Array.from({ length: count }, (_, i) => `U${i}` as LineUserId);
}

function createFakeClient(multicast: MulticastClient["multicast"]): MulticastClient {
  return { multicast };
}

describe("createLineMessageSender", () => {
  describe("チャンク分割(1回のmulticastにつき最大500件)", () => {
    it("宛先が0件の場合、multicastは一度も呼ばれない", async () => {
      const multicast = vi.fn().mockResolvedValue({});
      const sender = createLineMessageSender(createFakeClient(multicast));

      const result = await sender.sendMulticast(createDummyPermit(0), [], {
        kind: "text",
        text: "こんにちは",
      });

      expect(multicast).not.toHaveBeenCalled();
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.succeededUserIds).toEqual([]);
        expect(result.value.failures).toEqual([]);
      }
    });

    it("499件は1回のmulticast呼び出しで送られる(境界値)", async () => {
      const multicast = vi.fn().mockResolvedValue({});
      const sender = createLineMessageSender(createFakeClient(multicast));
      const userIds = createUserIds(499);

      const result = await sender.sendMulticast(createDummyPermit(499), userIds, {
        kind: "text",
        text: "こんにちは",
      });

      expect(multicast).toHaveBeenCalledTimes(1);
      expect(multicast).toHaveBeenCalledWith({
        to: userIds,
        messages: [{ type: "text", text: "こんにちは" }],
      });
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.succeededUserIds).toEqual(userIds);
      }
    });

    it("500件は1回のmulticast呼び出しで送られる(境界値)", async () => {
      const multicast = vi.fn().mockResolvedValue({});
      const sender = createLineMessageSender(createFakeClient(multicast));
      const userIds = createUserIds(500);

      const result = await sender.sendMulticast(createDummyPermit(500), userIds, {
        kind: "text",
        text: "こんにちは",
      });

      expect(multicast).toHaveBeenCalledTimes(1);
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.succeededUserIds).toEqual(userIds);
      }
    });

    it("501件は2回に分割され、2回目は1件だけになる(境界値)", async () => {
      const multicast = vi.fn().mockResolvedValue({});
      const sender = createLineMessageSender(createFakeClient(multicast));
      const userIds = createUserIds(501);

      const result = await sender.sendMulticast(createDummyPermit(501), userIds, {
        kind: "text",
        text: "こんにちは",
      });

      expect(multicast).toHaveBeenCalledTimes(2);
      expect(multicast).toHaveBeenNthCalledWith(1, {
        to: userIds.slice(0, 500),
        messages: [{ type: "text", text: "こんにちは" }],
      });
      expect(multicast).toHaveBeenNthCalledWith(2, {
        to: userIds.slice(500),
        messages: [{ type: "text", text: "こんにちは" }],
      });
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.succeededUserIds).toEqual(userIds);
      }
    });

    it("1000件は2回とも満杯のチャンクで送られる", async () => {
      const multicast = vi.fn().mockResolvedValue({});
      const sender = createLineMessageSender(createFakeClient(multicast));
      const userIds = createUserIds(1000);

      await sender.sendMulticast(createDummyPermit(1000), userIds, {
        kind: "text",
        text: "こんにちは",
      });

      expect(multicast).toHaveBeenCalledTimes(2);
    });

    it("1001件は3回に分割される", async () => {
      const multicast = vi.fn().mockResolvedValue({});
      const sender = createLineMessageSender(createFakeClient(multicast));
      const userIds = createUserIds(1001);

      await sender.sendMulticast(createDummyPermit(1001), userIds, {
        kind: "text",
        text: "こんにちは",
      });

      expect(multicast).toHaveBeenCalledTimes(3);
    });
  });

  describe("部分的な失敗", () => {
    it("2チャンク中1チャンクだけがthrowした場合、成功分はsucceededUserIdsに、失敗分はfailuresに全件入る", async () => {
      const userIds = createUserIds(1001);
      const firstChunk = userIds.slice(0, 500);
      const secondChunk = userIds.slice(500, 1000);
      const thirdChunk = userIds.slice(1000);

      const multicast = vi
        .fn()
        .mockResolvedValueOnce({}) // 1チャンク目: 成功
        .mockRejectedValueOnce(new Error("timeout")) // 2チャンク目: 失敗
        .mockResolvedValueOnce({}); // 3チャンク目: 成功

      const sender = createLineMessageSender(createFakeClient(multicast));
      const result = await sender.sendMulticast(createDummyPermit(1001), userIds, {
        kind: "text",
        text: "こんにちは",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.succeededUserIds).toEqual([...firstChunk, ...thirdChunk]);
        expect(result.value.failures).toHaveLength(1);
        expect(result.value.failures[0]?.targetUserIds).toEqual(secondChunk);
        expect(result.value.failures[0]?.reason).toBe("timeout");
      }
    });

    it("Error以外の値がthrowされた場合はフォールバックの理由文言になる", async () => {
      const multicast = vi.fn().mockRejectedValue("なにかの文字列");
      const sender = createLineMessageSender(createFakeClient(multicast));
      const userIds = createUserIds(1);

      const result = await sender.sendMulticast(createDummyPermit(1), userIds, {
        kind: "text",
        text: "こんにちは",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.succeededUserIds).toEqual([]);
        expect(result.value.failures).toHaveLength(1);
        expect(result.value.failures[0]?.kind).toBe("unknown");
        expect(result.value.failures[0]?.reason).toBe("LINEへの送信に失敗しました");
      }
    });

    it("HTTPFetchErrorのstatusが429の場合はrate_limitedに分類される", async () => {
      const fetchError = new HTTPFetchError("Too Many Requests", {
        status: 429,
        statusText: "Too Many Requests",
        headers: new Headers(),
        body: "",
      });
      const multicast = vi.fn().mockRejectedValue(fetchError);
      const sender = createLineMessageSender(createFakeClient(multicast));
      const userIds = createUserIds(1);

      const result = await sender.sendMulticast(createDummyPermit(1), userIds, {
        kind: "text",
        text: "こんにちは",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.failures[0]?.kind).toBe("rate_limited");
      }
    });

    it("HTTPFetchErrorのstatusが429以外の場合はnetworkに分類される", async () => {
      const fetchError = new HTTPFetchError("Internal Server Error", {
        status: 500,
        statusText: "Internal Server Error",
        headers: new Headers(),
        body: "",
      });
      const multicast = vi.fn().mockRejectedValue(fetchError);
      const sender = createLineMessageSender(createFakeClient(multicast));
      const userIds = createUserIds(1);

      const result = await sender.sendMulticast(createDummyPermit(1), userIds, {
        kind: "text",
        text: "こんにちは",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.failures[0]?.kind).toBe("network");
      }
    });
  });

  describe("INV-1: permitの予約件数と宛先数の整合性", () => {
    it("permit.countが宛先数に満たない場合、multicastを一度も呼ばずにerrを返す", async () => {
      const multicast = vi.fn().mockResolvedValue({});
      const sender = createLineMessageSender(createFakeClient(multicast));
      const userIds = createUserIds(500);

      // reserve(repo, now, 1, 200) 相当で1件しか予約していないのに500件へ送ろうとした想定
      const result = await sender.sendMulticast(createDummyPermit(1), userIds, {
        kind: "text",
        text: "こんにちは",
      });

      expect(multicast).not.toHaveBeenCalled();
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toEqual({
          kind: "permitExceeded",
          requestedCount: 500,
          permittedCount: 1,
        });
      }
    });

    it("permit.countがちょうど宛先数と一致する場合は送信される(境界値)", async () => {
      const multicast = vi.fn().mockResolvedValue({});
      const sender = createLineMessageSender(createFakeClient(multicast));
      const userIds = createUserIds(3);

      const result = await sender.sendMulticast(createDummyPermit(3), userIds, {
        kind: "text",
        text: "こんにちは",
      });

      expect(multicast).toHaveBeenCalledTimes(1);
      expect(result.kind).toBe("ok");
    });
  });
});
