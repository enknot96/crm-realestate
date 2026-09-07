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
    <form action={formAction}>
      <input
        type="hidden"
        name="id"
        value={props.id}
      />
      {state?.message && <p className="mt-1 text-sm text-red-600">{state.message}</p>}
      <button
        type="submit"
        className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
      >
        削除する
      </button>
    </form>
  );
}
