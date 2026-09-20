// 使い方: pnpm migrate
// drizzle/配下のマイグレーションをDBへ適用する。
//
// drizzle-kit migrate ではなくこのスクリプトを使う理由：
// drizzle-kit は @neondatabase/serverless をWebSocketで繋ごうとして応答が返らない。
// アプリ本体と同じHTTPドライバ(neon-http)で流せば、その問題を避けられる。
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

// env.ts経由だと起動時に全環境変数を検証してしまうため、seedDemoData.tsと同様にここだけ直接接続する
const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
  throw new Error("DATABASE_URLが設定されていません");
}

migrate(drizzle(neon(databaseUrl)), { migrationsFolder: "./drizzle" })
  .then(() => {
    console.log("マイグレーションを適用しました");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
