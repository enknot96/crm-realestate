"use server";

import { linkLineFriend } from "@/app/lib/customer";
import { CustomerId, LineUserId } from "@/domain/shared/branded";
import { redirect } from "next/navigation";

type LinkLineFriendActionState = { message: string } | null;

export async function linkLineFriendAction(
  prevState: LinkLineFriendActionState,
  formData: FormData,
): Promise<LinkLineFriendActionState> {
  const customerId = formData.get("customerId");
  const lineUserId = formData.get("lineUserId");
  const result = await linkLineFriend(customerId as CustomerId, lineUserId as LineUserId);

  if (result.kind === "err") {
    return { message: result.error };
  }
  redirect("/customers/line-friends");
}
