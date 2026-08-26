import { describe, it, expect } from "vitest";
import { ok } from "./result";

describe("Result", () => {
  it('{ kind: "ok", value }が返る', () => {
    expect(ok(2)).toEqual({ kind: "ok", value: 2 });
  });
});
