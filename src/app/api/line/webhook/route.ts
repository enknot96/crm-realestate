import { validateSignature } from "@line/bot-sdk";
import { env } from "@/config/env";

// POSTリクエストをこの書き方で、ここで受け止める
export async function POST(req: Request) {
  const body = await req.text(); // JSON.parseする前に、生の文字列として取得
  const signature = req.headers.get("x-line-signature");

  if (!signature || !validateSignature(body, env.LINE_CHANNEL_SECRET, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  // ここから先はまだ
}
