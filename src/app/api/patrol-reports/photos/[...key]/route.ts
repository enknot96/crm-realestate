import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/domain/auth/session";
import { env } from "@/config/env";
import { downloadPatrolReportPhoto } from "@/app/lib/patrolReport";

// R2は非公開バケットのため、写真は直接<img src>で見せられない
// ここでログイン済みの管理者だけに、R2から取得した画像バイナリをそのまま返す(簡易プロキシ)。
// /api配下はsrc/proxy.tsのmatcherの対象外(ログインチェックが自動適用されない)なので、ここで明示的に行う
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const token = request.cookies.get("session")?.value;
  if (!token) {
    return new NextResponse(null, { status: 401 });
  }
  const sessionResult = await verifySessionToken(token, env.SESSION_SECRET);
  if (sessionResult.kind === "err") {
    return new NextResponse(null, { status: 401 });
  }

  const { key } = await params;
  const result = await downloadPatrolReportPhoto(key.join("/"));
  if (result.kind === "err") {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(result.value.body), {
    headers: {
      "Content-Type": result.value.contentType,
      "Cache-Control": "private, max-age=300",
    },
  });
}
