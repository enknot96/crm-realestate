import { describe, it, expect } from "vitest";
import { POST } from "./route";

describe("POST /api/line/webhook", () => {
  it("署名ヘッダーが無い場合は401を返す", async () => {
    const req = new Request("http://localhost/api/line/webhook", {
      method: "POST",
      body: JSON.stringify({ destination: "Udummy", events: [] }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("署名が不正な場合は401を返す", async () => {
    const req = new Request("http://localhost/api/line/webhook", {
      method: "POST",
      headers: { "x-line-signature": "invalid-signature" },
      body: JSON.stringify({ destination: "Udummy", events: [] }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });
});
