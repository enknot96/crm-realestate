import { env } from "@/config/env";
import { dispatchDailyReminders } from "@/app/lib/reminder";

export async function POST(req: Request) {
  const authorization = req.headers.get("authorization");
  if (authorization !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await dispatchDailyReminders(new Date());

  if (result.reminders.kind === "err") {
    return Response.json({ error: result.reminders.error }, { status: 500 });
  }
  if (result.broadcasts.kind === "err") {
    return Response.json({ error: result.broadcasts.error }, { status: 500 });
  }

  return Response.json({
    reminders: result.reminders.value,
    broadcasts: result.broadcasts.value,
  });
}
