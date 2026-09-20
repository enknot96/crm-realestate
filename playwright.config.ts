import { defineConfig, devices } from "@playwright/test";

// E2E_BASE_URLが指定されていればデプロイ済みのURLに直接アクセスする(ローカルサーバーは起動しない)。
// 指定が無ければ従来どおりlocalhostのdevサーバーを使う
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // 既にdotenv経由でdevサーバーが起動していれば再利用し、無ければこのコマンドで立ち上げる
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "dotenv -e .env.local -- pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 60 * 1000,
      },
});
