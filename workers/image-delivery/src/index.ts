export interface Env {
  PATROL_REPORTS_BUCKET: R2Bucket;
  IMAGE_SIGNING_SECRET: string;
}

// Next.js側(src/infra/storage/signedImageUrl.ts)と同じHMAC-SHA256計算をWeb Crypto APIで行う
async function computeHmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// 署名なし・期限切れのURLでのアクセスは403にする
// LINE側は取得後に自前でキャッシュするため、有効期限は数分程度で足りる(署名の発行はsrc/infra/storage/signedImageUrl.ts側)
const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const key = decodeURIComponent(url.pathname.slice(1));
    const exp = url.searchParams.get("exp");
    const sig = url.searchParams.get("sig");

    if (!key || !exp || !sig) {
      return new Response("Forbidden", { status: 403 });
    }

    const expNum = Number(exp);
    if (!Number.isFinite(expNum) || expNum < Math.floor(Date.now() / 1000)) {
      return new Response("Forbidden", { status: 403 });
    }

    const expectedSig = await computeHmacHex(env.IMAGE_SIGNING_SECRET, `${key}:${exp}`);
    if (expectedSig !== sig) {
      return new Response("Forbidden", { status: 403 });
    }

    const object = await env.PATROL_REPORTS_BUCKET.get(key);
    if (!object) {
      return new Response("Not Found", { status: 404 });
    }

    return new Response(object.body, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
        "Cache-Control": "private, max-age=300",
      },
    });
  },
};

export default worker;
