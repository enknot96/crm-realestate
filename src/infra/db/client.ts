import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/config/env";

function createDb() {
  const sql = neon(env.DATABASE_URL);
  return drizzle(sql);
}

let _db: ReturnType<typeof createDb> | null = null;

// DB操作オブジェクトを受け取る
export function getDb() {
  if (!_db) _db = createDb();
  return _db;
}
