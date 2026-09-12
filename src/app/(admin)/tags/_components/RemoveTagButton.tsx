"use client";

import { useActionState } from "react";
import { removeTagAction } from "../actions";
import { TagId } from "@/domain/shared/branded";

type Props = {
  id: TagId;
};

export function RemoveTagButton(props: Props) {
  const [state, formAction, isPending] = useActionState(removeTagAction, null);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="id" value={props.id} />
      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer text-sm font-bold text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        削除
      </button>
      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
    </form>
  );
}
