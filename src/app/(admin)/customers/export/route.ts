import { exportCustomersToCsv } from "@/app/lib/customer";

export async function GET() {
  const result = await exportCustomersToCsv();
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
