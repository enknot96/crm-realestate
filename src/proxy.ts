import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "./domain/auth/session";
import { env } from "./config/env";

// proxy.ts
// どのページが表示される前にも、必ずこれが先に実行されるという、Next.jsの決まりごと

export async function proxy(request: NextRequest) {
  // action.tsで書いた"session"という名前で保存されている、httpOnly: trueなcookie情報を取得する
  // .get("session")が返すのは、{ name: "session", value: "eyJhbGc..." のようなobjのため、.valueでJWTを取得する
  // ?.value = Cookie自体が見つからなかった場合、undefinedとして扱う
  const token = request.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const result = await verifySessionToken(token, env.SESSION_SECRET);
  if (result.kind === "err") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 問題なければ、素通しして本来の処理を続行
  return NextResponse.next();
}

// proxy関数をどのパスに対して実行するか を指定する設定
export const config = {
  // /login・/api/*・Next.js の静的アセット・画像最適化・拡張子を持つパス（画像・ファビコンなど、
  // public/配下の静的ファイル全般）以外の、すべてのパス に対してだけ proxy（＝ログインチェック）を実行する、という指定
  // ("logo-full.png"のようなpublic/配下のファイルを追加するたびに1つずつ除外を書き足す必要が無いよう、
  //  拡張子を持つパス自体をまとめて除外している)
  matcher: ["/((?!login|api|_next/static|_next/image|.*\\..*).*)"],
};
