"use client";

import { CustomerId } from "@/domain/shared/branded";
import { removeCustomerAction } from "../../../actions";
import { useActionState } from "react";

type Props = {
  id: CustomerId;
};

export function DeleteConfirmForm(props: Props) {
  const [state, formAction] = useActionState(removeCustomerAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={props.id} />
      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
      <button
        type="submit"
        className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700"
      >
        削除する
      </button>
    </form>
  );
}
