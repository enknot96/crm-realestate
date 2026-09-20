import { validateSignature, LineBotClient } from "@line/bot-sdk";
import type { webhook } from "@line/bot-sdk";
import { eq } from "drizzle-orm";
import { env } from "@/config/env";
import { getDb } from "@/infra/db/client";
import { lineWebhookEvents, lineFriends } from "@/infra/db/schema";
import { toLineFriendEvent } from "@/domain/lineFriend/toLineFriendEvent";
import { assertNever } from "@/domain/shared/assertNever";

const lineClient = LineBotClient.fromChannelAccessToken({
  channelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN,
});

// POSTリクエストをこの書き方で、ここで受け止める
export async function POST(req: Request) {
  const body = await req.text(); // JSON.parseする前に、生の文字列として取得
  const signature = req.headers.get("x-line-signature");

  if (!signature || !validateSignature(body, env.LINE_CHANNEL_SECRET, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const payload: webhook.CallbackRequest = JSON.parse(body);

  const db = getDb();

  for (const event of payload.events) {
    // followイベントのときだけ、表示名をLINEから取得する
    // 取得に失敗しても表示名なしでfriendsの記録は続ける（外部APIの失敗で処理全体を止めない）
    let displayName: string | undefined;
    if (event.type === "follow" && event.source?.type === "user" && event.source.userId) {
      try {
        const profile = await lineClient.getProfile(event.source.userId);
        displayName = profile.displayName;
      } catch {
        displayName = undefined;
      }
    }

    const friendEvent = toLineFriendEvent(event, displayName);

    switch (friendEvent.kind) {
      case "followed":
      case "unblocked": {
        // 新規友だち追加・ブロック解除 どちらもupsert(無ければinsert、あれば更新)
        await db
          // lineFriendテーブルにinsertする
          .insert(lineFriends)
          // insertする内容
          .values({
            lineUserId: friendEvent.lineUserId,
            displayName: friendEvent.displayName,
            followedAt: friendEvent.followedAt,
          })
          // onConflictDoUpdate = 新規追加なら普通にinsertする、
          // もし既にその人の行があれば（過去にブロックされていた行が残っている場合など）、代わりにその内容で上書きする
          .onConflictDoUpdate({
            target: lineFriends.lineUserId,
            set: {
              displayName: friendEvent.displayName,
              followedAt: friendEvent.followedAt,
              blockedAt: null,
            },
          });
        break;
      }
      case "blocked": {
        await db
          .update(lineFriends)
          .set({ blockedAt: friendEvent.blockedAt })
          // eq = 比較条件を作るための関数 eq(列, 値)と書くと、その列がこの値と等しい行を指す
          // where = どの行を対象にするか
          // lineFriends テーブルの lineUserId 列が、今回ブロックしてきた人の lineUserId と等しい行 を指定
          .where(eq(lineFriends.lineUserId, friendEvent.lineUserId));
        break;
      }
      case "ignored":
        break;
      default:
        return assertNever(friendEvent);
    }

    // 処理が終わった後に記録する
    // 先に記録すると、記録後に処理が失敗した場合、LINEの再送時に「処理済み」と判定されて永久にスキップされてしまうため
    await db
      .insert(lineWebhookEvents)
      .values({ eventId: event.webhookEventId })
      .onConflictDoNothing();
  }

  return new Response("OK", { status: 200 });
}
