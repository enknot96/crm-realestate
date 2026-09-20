// LINEはimage messageのURLに自分でアクセスしてくる
// R2は非公開バケットのため、一時的な署名(HMAC)付きのURLを発行し、Cloudflare Worker(workers/image-delivery/)側で検証
// Node.js/Workers どちらの環境でも動くWeb Crypto API(crypto.subtle)で統一
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

export async function createSignedImageUrl(
  baseUrl: string,
  secret: string,
  key: string,
  expiresInSeconds: number,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const sig = await computeHmacHex(secret, `${key}:${exp}`);
  return `${baseUrl}/${key}?exp=${exp}&sig=${sig}`;
}
