import { exportCustomersToCsv } from "@/app/lib/customer";
import { requireSession } from "@/app/lib/auth";

export async function GET() {
  const permit = await requireSession();
  const result = await exportCustomersToCsv(permit);
  if (result.kind === "err") {
    return new Response(result.error, { status: 500 });
  }

  return new Response(result.value, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="customers.csv"',
    },
  });
}
