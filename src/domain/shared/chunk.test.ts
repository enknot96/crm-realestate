import { describe, it, expect } from "vitest";
import { chunk } from "./chunk";

describe("chunk", () => {
  it("空配列は空配列を返す(チャンクが1つも生成されない)", () => {
    expect(chunk([], 500)).toEqual([]);
  });

  it("サイズちょうどの場合は1チャンクにまとまる(境界値)", () => {
    const items = Array.from({ length: 500 }, (_, i) => i);
    const result = chunk(items, 500);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(500);
  });

  it("サイズを1件超える場合は2チャンクに分かれ、2チャンク目は1件だけになる(境界値)", () => {
    const items = Array.from({ length: 501 }, (_, i) => i);
    const result = chunk(items, 500);

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveLength(500);
    expect(result[1]).toHaveLength(1);
  });

  it("サイズの2倍ちょうどの場合は2チャンクとも満杯になる", () => {
    const items = Array.from({ length: 1000 }, (_, i) => i);
    const result = chunk(items, 500);

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveLength(500);
    expect(result[1]).toHaveLength(500);
  });

  it("サイズの2倍を1件超える場合は3チャンクに分かれる", () => {
    const items = Array.from({ length: 1001 }, (_, i) => i);
    const result = chunk(items, 500);

    expect(result).toHaveLength(3);
    expect(result[0]).toHaveLength(500);
    expect(result[1]).toHaveLength(500);
    expect(result[2]).toHaveLength(1);
  });

  it("要素の順序と中身を保ったまま分割する", () => {
    const result = chunk([1, 2, 3, 4, 5], 2);
    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });
});
