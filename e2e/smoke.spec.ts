import { test, expect } from "@playwright/test";
// ログイン画面を経由せず、実際のログイン成功時と同じ関数でセッションを発行してCookieにセットする。
// 平文の管理者パスワードをテストコードに持たせずに済む
import { createSessionToken } from "../src/domain/auth/session";

const SESSION_SECRET = process.env.SESSION_SECRET;
if (SESSION_SECRET === undefined) {
  throw new Error("SESSION_SECRETが設定されていません(.env.localを確認してください)");
}

test.beforeEach(async ({ context }) => {
  const token = await createSessionToken(SESSION_SECRET);
  await context.addCookies([
    {
      name: "session",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    },
  ]);
});

// 主要導線1本: 顧客一覧 → 顧客詳細(物件・契約情報)まで、ログイン済み状態で正しく表示できるか
test("顧客一覧から顧客詳細(物件・契約情報)まで表示できる", async ({ page }) => {
  await page.goto("/customers");
  await expect(page.getByRole("heading", { name: "顧客一覧" })).toBeVisible();

  // pnpm seed / pnpm reset-demoで投入される架空データに依存する
  const customerRow = page.getByRole("row", { name: /田中 誠/ });
  await expect(customerRow).toBeVisible();
  await customerRow.getByRole("link", { name: "編集" }).click();

  await expect(page.getByRole("heading", { name: "顧客の編集" })).toBeVisible();
  await expect(page.getByText("青葉荘")).toBeVisible();
  await expect(page.getByText("次回の巡回報告期限").first()).toBeVisible();
});
