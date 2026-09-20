"use client";

import { CustomerId, LineUserId } from "@/domain/shared/branded";
import { linkLineFriendAction } from "../actions";
import { useActionState } from "react";
import { Button } from "@/app/(admin)/_components/Button";

type Props = {
  lineUserId: LineUserId;
  customers: { id: CustomerId; name: string }[];
};

export function LinkForm(props: Props) {
  const [state, formAction] = useActionState(linkLineFriendAction, null);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-2"
    >
      <input
        type="hidden"
        name="lineUserId"
        value={props.lineUserId}
      />
      <select
        name="customerId"
        required
        defaultValue=""
        className="rounded border border-gray-300 p-2"
      >
        <option
          value=""
          disabled
        >
          顧客を選ぶ
        </option>
        {props.customers.map((customer) => (
          <option
            key={customer.id}
            value={customer.id}
          >
            {customer.name}
          </option>
        ))}
      </select>
      <Button
        type="submit"
        size="sm"
      >
        紐付ける
      </Button>
      {state?.message && <p className="w-full text-sm text-red-600">{state.message}</p>}
    </form>
  );
}
