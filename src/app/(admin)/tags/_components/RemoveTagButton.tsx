"use client";

import { useActionState } from "react";
import { removeTagAction } from "../actions";
import { TagId } from "@/domain/shared/branded";
import { Button } from "@/app/(admin)/_components/Button";

type Props = {
  id: TagId;
};

export function RemoveTagButton(props: Props) {
  const [state, formAction, isPending] = useActionState(removeTagAction, null);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="id" value={props.id} />
      <Button
        type="submit"
        variant="danger"
        size="sm"
        disabled={isPending}
      >
        削除
      </Button>
      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
    </form>
  );
}
