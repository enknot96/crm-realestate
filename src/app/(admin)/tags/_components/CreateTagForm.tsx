"use client";

import { useActionState } from "react";
import { createTagAction } from "../actions";
import { Button } from "@/app/(admin)/_components/Button";

export function CreateTagForm() {
  const [state, formAction, isPending] = useActionState(createTagAction, null);

  return (
    <form action={formAction} className="flex items-start gap-2">
      <div className="flex flex-col gap-1">
        <input
          name="name"
          type="text"
          placeholder="新しいタグ名（例: 売主）"
          className="rounded border border-gray-300 p-2"
        />
        {state?.kind === "validation" && (
          <p className="text-sm text-red-600">{state.message}</p>
        )}
        {state?.kind === "repository" && (
          <p className="text-sm text-red-600">{state.message}</p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isPending}
      >
        追加する
      </Button>
    </form>
  );
}
