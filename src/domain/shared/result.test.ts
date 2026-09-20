import { describe, it, expect, vi } from "vitest";
import { ok, fromPromise } from "./result";

describe("Result", () => {
  it('{ kind: "ok", value }が返る', () => {
    expect(ok(2)).toEqual({ kind: "ok", value: 2 });
  });
});

describe("fromPromise", () => {
  it("成功時はokを返す", async () => {
    const result = await fromPromise(async () => 42, "失敗しました");
    expect(result).toEqual(ok(42));
  });

  it("例外発生時は、生の例外メッセージではなく呼び出し元が渡した日本語メッセージを返す", async () => {
    const result = await fromPromise(async () => {
      throw new Error('Failed query: select "id" from "customers" limit $1');
    }, "顧客情報の取得に失敗しました");

    expect(result).toEqual({ kind: "err", error: "顧客情報の取得に失敗しました" });
  });

  it("例外発生時は、サーバー側のログに実際の例外を出力する", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const originalError = new Error("Failed query: select ...");

    await fromPromise(async () => {
      throw originalError;
    }, "顧客情報の取得に失敗しました");

    expect(consoleError).toHaveBeenCalledWith("顧客情報の取得に失敗しました", originalError);
    consoleError.mockRestore();
  });

  it("Errorインスタンスでない値がthrowされても、呼び出し元が渡したメッセージを返す", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await fromPromise(async () => {
      throw "文字列がthrowされるケース";
    }, "失敗しました");

    expect(result).toEqual({ kind: "err", error: "失敗しました" });
    consoleError.mockRestore();
  });
});
