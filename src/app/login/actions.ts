"use server";

import { env } from "@/config/env";
import { verifyPassword } from "@/domain/auth/password";
import { createSessionToken } from "@/domain/auth/session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const password = formData.get("password");

  if (typeof password !== "string" || !verifyPassword(password, env.ADMIN_PASSWORD_HASH)) {
    return;
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
