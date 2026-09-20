"use client";

import { useActionState } from "react";
import { setTagsAction } from "../actions";
import { CustomerId, TagId } from "@/domain/shared/branded";
import { Tag } from "@/domain/tag/repository";
import { Button } from "@/app/(admin)/_components/Button";

type Props = {
  customerId: CustomerId;
  allTags: Tag[];
  selectedTagIds: TagId[];
};

export function CustomerTagsForm(props: Props) {
  const [state, formAction, isPending] = useActionState(setTagsAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="customerId" value={props.customerId} />
      <div className="flex flex-col gap-2">
        {props.allTags.map((tag) => (
          <label key={tag.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              name="tagIds"
              value={tag.id}
              defaultChecked={props.selectedTagIds.includes(tag.id)}
            />
            <span>{tag.name}</span>
          </label>
        ))}
      </div>
      {state?.kind === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      {state?.kind === "success" && <p className="text-sm text-brand-teal">保存しました</p>}
      <Button
        type="submit"
        disabled={isPending}
        className="self-start"
      >
        タグを保存
      </Button>
    </form>
  );
}
