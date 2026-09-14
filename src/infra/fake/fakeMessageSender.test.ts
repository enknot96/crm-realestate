import { describe, it, expect } from "vitest";
import { createFakeMessageSender } from "./fakeMessageSender";
import { LineUserId } from "@/domain/shared/branded";
import { SendPermit } from "@/domain/messaging/quotaGuard";

// SendPermitは reserve() 経由でしか作れない設計(INV-1)だが、
// Fakeなテストではreserve()を呼ぶために必要なリポジトリを用意する代わりに、
// permitの中身(件数)自体は検証対象ではないため、ダミー値をテスト内だけでキャストして使う。
function createDummyPermit(count: number): SendPermit {
  return { count } as SendPermit;
}

describe("createFakeMessageSender", () => {
  it("送信内容を実際にはLINEへ送らず、メモリに記録する", async () => {
    const sender = createFakeMessageSender();
    const userIds = ["U1", "U2", "U3"] as LineUserId[];

    const result = await sender.sendMulticast(createDummyPermit(3), userIds, {
      kind: "text",
      text: "こんにちは",
    });

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.value.succeededUserIds).toEqual(userIds);
      expect(result.value.failures).toEqual([]);
    }
  });

  it("呼び出し履歴が sentMulticasts に蓄積される", async () => {
    const sender = createFakeMessageSender();
    const firstUserIds = ["U1"] as LineUserId[];
    const secondUserIds = ["U2", "U3"] as LineUserId[];

    await sender.sendMulticast(createDummyPermit(1), firstUserIds, {
      kind: "text",
      text: "1通目",
    });
    await sender.sendMulticast(createDummyPermit(2), secondUserIds, {
      kind: "text",
      text: "2通目",
    });

    expect(sender.sentMulticasts).toHaveLength(2);
    expect(sender.sentMulticasts[0]).toEqual({
      userIds: firstUserIds,
      message: { kind: "text", text: "1通目" },
    });
    expect(sender.sentMulticasts[1]).toEqual({
      userIds: secondUserIds,
      message: { kind: "text", text: "2通目" },
    });
  });

  it("記録された宛先配列を後から書き換えても、履歴には影響しない(防御的コピー)", async () => {
    const sender = createFakeMessageSender();
    const userIds = ["U1", "U2"] as LineUserId[];

    await sender.sendMulticast(createDummyPermit(2), userIds, {
      kind: "text",
      text: "こんにちは",
    });

    userIds.push("U3" as LineUserId);

    expect(sender.sentMulticasts[0]?.userIds).toEqual(["U1", "U2"]);
  });

  it("記録されたmessageを後から書き換えても、履歴には影響しない(防御的コピー)", async () => {
    const sender = createFakeMessageSender();
    const userIds = ["U1"] as LineUserId[];
    const message = { kind: "text" as const, text: "こんにちは" };

    await sender.sendMulticast(createDummyPermit(1), userIds, message);

    // OutgoingMessageの型上はreadonlyだが、呼び出し元が持つ元の参照が実行時に
    // 書き換えられても記録が汚染されないことを確認する(構造的コピーの検証)。
    (message as { text: string }).text = "書き換え後";

    expect(sender.sentMulticasts[0]?.message).toEqual({ kind: "text", text: "こんにちは" });
  });

  it("permitの予約件数(count)が宛先数に満たない場合はerrを返し、記録もされない(INV-1)", async () => {
    const sender = createFakeMessageSender();
    const userIds = ["U1", "U2", "U3"] as LineUserId[];

    // reserve()で1件しか予約していないのに、3件へ送ろうとしている想定
    const result = await sender.sendMulticast(createDummyPermit(1), userIds, {
      kind: "text",
      text: "こんにちは",
    });

    expect(result.kind).toBe("err");
    if (result.kind === "err") {
      expect(result.error).toEqual({
        kind: "permitExceeded",
        requestedCount: 3,
        permittedCount: 1,
      });
    }
    expect(sender.sentMulticasts).toHaveLength(0);
  });

  it("permitの予約件数がちょうど宛先数と一致する場合は送信される(境界値)", async () => {
    const sender = createFakeMessageSender();
    const userIds = ["U1", "U2"] as LineUserId[];

    const result = await sender.sendMulticast(createDummyPermit(2), userIds, {
      kind: "text",
      text: "こんにちは",
    });

    expect(result.kind).toBe("ok");
    expect(sender.sentMulticasts).toHaveLength(1);
  });
});
