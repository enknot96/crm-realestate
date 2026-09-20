"use server";

import { env } from "@/config/env";
import { verifyPassword } from "@/domain/auth/password";
import { createSessionToken } from "@/domain/auth/session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type LoginActionState = { message: string } | null;

export async function login(
  prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const password = formData.get("password");

  if (typeof password !== "string" || !verifyPassword(password, env.ADMIN_PASSWORD_HASH)) {
    return { message: "パスワードが正しくありません。もう一度お試しください。" };
  }

  const token = await createSessionToken(env.SESSION_SECRET);
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7日
  });

  redirect("/customers");
}
