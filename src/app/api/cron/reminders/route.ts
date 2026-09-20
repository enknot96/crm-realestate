import { dispatchDailyReminders } from "@/app/lib/reminder";
import { requireCron } from "@/app/lib/auth";

export async function POST(req: Request) {
  const permit = requireCron(req);
  if (permit === null) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await dispatchDailyReminders(permit, new Date());

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
