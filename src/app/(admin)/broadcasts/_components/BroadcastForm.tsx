"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { confirmBroadcastAction, previewBroadcastAction } from "../actions";
import { describeConfirmError, describePreviewError } from "../errorMessages";
import { Tag } from "@/domain/tag/repository";

type Props = {
  tags: Tag[];
};

export function BroadcastForm(props: Props) {
  const [previewState, previewAction, isPreviewPending] = useActionState(previewBroadcastAction, {
    kind: "idle" as const,
  });
  const [confirmState, confirmAction, isConfirmPending] = useActionState(confirmBroadcastAction, {
    kind: "idle" as const,
  });
  const dialogRef = useRef<HTMLDialogElement>(null);
  // INV-4: タグ名を手入力で再確認させる、意図的な摩擦。削ってはいけない
  const [typedTagName, setTypedTagName] = useState("");

  const preview = previewState.kind === "success" ? previewState.preview : null;

  // プレビューの取得に成功したら、確認モーダルを開く
  useEffect(() => {
    if (previewState.kind === "success") {
      dialogRef.current?.showModal();
    }
  }, [previewState]);

  // 送信に成功したら、モーダルを閉じる（開いたまま残して二重送信できそうな見た目にしない）
  useEffect(() => {
    if (confirmState.kind === "success") {
      dialogRef.current?.close();
    }
  }, [confirmState]);

  const canSend = preview !== null && typedTagName.trim() === preview.tagName;

  return (
    <>
      <form
        action={previewAction}
        className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6"
      >
        <label className="flex flex-col gap-1">
          <span className="font-bold text-gray-700">送りたい相手のタグ</span>
          <select
            name="tagId"
            required
            defaultValue=""
            className="rounded border border-gray-300 p-2"
          >
            <option value="" disabled>
              選択してください
            </option>
            {props.tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </label>

        {previewState.kind === "error" && (
          <p className="text-sm text-red-600">{describePreviewError(previewState.error)}</p>
        )}

        <button
          type="submit"
          disabled={isPreviewPending || props.tags.length === 0}
          className="cursor-pointer self-start rounded-lg bg-brand-teal px-4 py-2 font-bold text-white hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
        >
          送信内容を確認する
        </button>
      </form>

      {/* 送信前確認モーダル。INV-4: 宛先の実数と内訳を必ず表示する */}
      <dialog
        ref={dialogRef}
        className="w-full max-w-sm rounded-lg p-0 backdrop:bg-black/40"
        onClose={() => setTypedTagName("")}
      >
        {preview && (
          <form action={confirmAction} className="flex flex-col gap-4 p-6">
            <h2 className="text-lg font-bold">送信内容の確認</h2>

            <dl className="flex flex-col gap-2 rounded-lg bg-gray-50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">送る相手</dt>
                <dd className="font-bold">{preview.tagName}のお客様</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">送信する人数</dt>
                <dd className="font-bold">{preview.recipientCount}名</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">今回使う件数</dt>
                <dd className="font-bold">{preview.recipientCount}件</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">送信後に残る件数</dt>
                <dd className="font-bold">{preview.remainingAfterSend}件</dd>
              </div>
            </dl>

            <label className="flex flex-col gap-1">
              <span className="font-bold text-gray-700">
                確認のため、タグ名「{preview.tagName}」ともう一度入力してください
              </span>
              <input
                type="text"
                name="typedTagName"
                value={typedTagName}
                onChange={(e) => setTypedTagName(e.target.value)}
                autoComplete="off"
                className="rounded border border-gray-300 p-2"
              />
            </label>

            <input type="hidden" name="tagId" value={preview.tagId} />

            {confirmState.kind === "error" && (
              <p className="text-sm text-red-600">{describeConfirmError(confirmState.error)}</p>
            )}
            {confirmState.kind === "success" && (
              <p className="text-sm text-brand-teal">{confirmState.sentCount}件、送信しました</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 font-bold text-gray-600 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={!canSend || isConfirmPending}
                className="cursor-pointer rounded-lg bg-brand-teal px-4 py-2 font-bold text-white hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
              >
                送信する
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
