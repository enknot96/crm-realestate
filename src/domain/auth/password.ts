import { scryptSync, timingSafeEqual } from "node:crypto";

// .env.localのADMIN_PASSWORD_HASHが、管理画面にログインするための本物のパスワード
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const derivedHash = scryptSync(password, salt, 64);
  const storedHashBuffer = Buffer.from(hash, "hex");
  return timingSafeEqual(derivedHash, storedHashBuffer);
}
