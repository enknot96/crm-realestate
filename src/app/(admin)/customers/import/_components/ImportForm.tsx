"use client";

import { useActionState } from "react";
import { importCustomersAction } from "../actions";
import { Button } from "@/app/(admin)/_components/Button";

export function ImportForm() {
  const [state, formAction, isPending] = useActionState(importCustomersAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="font-medium text-gray-700">CSVファイル</span>
        <input
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          className="rounded border border-gray-300 p-2"
        />
      </label>

      <Button
        type="submit"
        disabled={isPending}
        className="self-start"
      >
        {isPending ? "取り込み中..." : "取り込む"}
      </Button>

      {state?.kind === "error" && <p className="text-sm font-bold text-red-600">{state.message}</p>}

      {state?.kind === "success" && (
        <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="font-bold text-brand-navy">{state.successCount}件の顧客を登録しました</p>
          {state.errors.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="font-bold text-red-600">取り込めなかった行（{state.errors.length}件）</p>
              <ul className="list-disc pl-5 text-sm text-red-600">
                {state.errors.map((error) => (
                  <li key={error.line}>{error.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
