"use client";

import { useActionState } from "react";
import { login } from "../actions";
import { Button } from "@/app/(admin)/_components/Button";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4"
    >
      <label className="flex flex-col gap-1 text-sm text-gray-600">
        パスワード
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-teal focus:outline-none"
        />
      </label>

      {state !== null && <p className="text-sm text-red-600">{state.message}</p>}

      <Button
        type="submit"
        disabled={isPending}
      >
        {isPending ? "確認しています…" : "ログイン"}
      </Button>
    </form>
  );
}
