import { jwtVerify, SignJWT } from "jose";
import { ok, err, Result } from "@/domain/shared/result";

// ログイン画面でパスワードが入力され、verifyPassword関数で「本人確認」が成功する
// → その直後に呼ばれる
export async function createSessionToken(secret: string): Promise<string> {
  const key = new TextEncoder().encode(secret); // 秘密鍵は文字列でなくバイト列で渡す必要がある
  const token = await new SignJWT({ role: "admin" }) // JWTに含めたいデータ
    .setProtectedHeader({ alg: "HS256" }) // 使う署名アルゴリズム
    .setIssuedAt() // 発行日時を自動で記録
    .setExpirationTime("7d") // 7日後に期限切れ
    .sign(key); // 実際に署名して文字列にする
  return token;
}

export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<Result<true, string>> {
  const key = new TextEncoder().encode(secret);
  try {
    await jwtVerify(token, key);
    return ok(true);
  } catch {
    return err("セッションが無効です");
  }
}
