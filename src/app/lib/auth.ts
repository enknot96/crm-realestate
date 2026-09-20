import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/config/env";
import { verifySessionToken } from "@/domain/auth/session";

// Server Actionは Next-Action ヘッダ付きのPOSTであればどのパスにも投げられるため、
// src/proxy.ts のログインチェックは迂回できる(matcherが /login・/api・ドットを含むパスを除外している)
// そこで src/app/lib の公開関数はすべてpermitを要求し、「認証を通っていない呼び出し」がコンパイルエラーになる設計へ
declare const authenticated: unique symbol;

// ログイン済み管理者であることの証明
export type SessionPermit = { readonly [authenticated]: "session" };

// CRON_SECRETで認証済み(cron経路)であることの証明
// SessionPermitとは別の型にし、cronの入口でセッションを偽装しなくて済むようにしている
export type CronPermit = { readonly [authenticated]: "cron" };

// Cookieを読む唯一の関数
// permitの生成箇所をここ1つに閉じ込めるため、外には公開しない
async function readSessionPermit(): Promise<SessionPermit | null> {
  const token = (await cookies()).get("session")?.value;
  if (!token) {
    return null;
  }
  const result = await verifySessionToken(token, env.SESSION_SECRET);
  if (result.kind === "err") {
    return null;
  }
  return {} as SessionPermit;
}

// ページ・Server Action用
// 未ログインならログイン画面に送る(redirectは例外を投げるので後続は実行されない)
export async function requireSession(): Promise<SessionPermit> {
  const permit = await readSessionPermit();
  if (permit === null) {
    redirect("/login");
  }
  return permit;
}

// 画像配信のように、リダイレクトではなく401を返したい場所用
export async function getSession(): Promise<SessionPermit | null> {
  return readSessionPermit();
}

// cronエンドポイント用
// Bearerトークンの検証に成功した場合だけpermitを発行する
export function requireCron(req: Request): CronPermit | null {
  if (req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return null;
  }
  return {} as CronPermit;
}
