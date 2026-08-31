import { jwtVerify, SignJWT } from "jose";
import { ok, err, Result } from "@/domain/shared/result";

/**
 * JWT（3つの部分を.で繋いだもの）：トークン認証方式
 * eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYWRtaW4ifQ.SflKxwRJSMeKKF2QT4fw...
 *    ↑ヘッダー              ↑中身（role: admin等）     ↑署名
 * 中身自体は隠されていない（誰でも読める）が、署名のおかげで、勝手に書き換えても通用しない
 *
 * JWTを使う標準パターン
 * .env（または同等の設定）に、ランダムな秘密の文字列を1つ保存
 * ↓
 * それをバイト列に変換
 * ↓
 * HMAC計算に使う（全ユーザー共通）
 */

// ログイン画面でパスワードが入力され、verifyPassword関数で「本人確認」が成功する
// → その直後に呼ばれる JWTを作成する関数
export async function createSessionToken(secret: string): Promise<string> {
  const key = new TextEncoder().encode(secret); // 秘密鍵は文字列でなくバイト列（数字）で渡す必要がある
  const token = await new SignJWT({ role: "admin" }) // JWTに含めたいデータ
    .setProtectedHeader({ alg: "HS256" }) // 使う署名アルゴリズム
    .setIssuedAt() // 発行日時を自動で記録
    .setExpirationTime("7d") // 7日後に期限切れ
    .sign(key); // 実際に署名して文字列にする
  // 1. ヘッダー（{alg: "HS256"}）と中身（{role: "admin", iat, exp}）を決める
  // 2. その2つを繋げた文字列に対して、固定のsecret（を変換したkey）を使ってHMAC-SHA256計算をする
  // 3. 計算結果が「署名」になる
  // 4. 「ヘッダー.中身.署名」の3つを繋げて、JWTが完成する
  return token;
}

// JWTが本物で、まだ有効期限内科をチェックする関数
export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<Result<true, string>> {
  const key = new TextEncoder().encode(secret);
  try {
    // このtokenは、このkeyで作られた、改ざんされていない、期限内のものか？を確認
    await jwtVerify(token, key);
    return ok(true);
  } catch {
    return err("セッションが無効です");
  }
}
