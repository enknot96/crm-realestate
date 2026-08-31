import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error("使い方: npx tsx scripts/hash-password.ts test0123");
  process.exit(1);
}

// ソルト = パスワードに混ぜる「ランダムな追加データ」
const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");

console.log(`${salt}:${hash}`);

/**
 * 田中さんのソルト = "xyz111"
 * 田中さんのハッシュ = hash("password123" + "xyz111") = "def456..."
 * 鈴木さんのソルト = "qrs222"
 * 鈴木さんのハッシュ = hash("password123" + "qrs222") = "ghi789..."  ← 全然違う値に！
 */
