"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  confirmBroadcastAction,
  previewBroadcastAction,
  previewScheduleBroadcastAction,
  scheduleBroadcastAction,
} from "../actions";
import {
  describeConfirmError,
  describePreviewError,
  describeScheduleError,
  describeSchedulePreviewError,
} from "../errorMessages";
import { Tag } from "@/domain/tag/repository";

type Props = {
  tags: Tag[];
};

// 予約日時をJSTで人間向けに表示する
function formatJst(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function BroadcastForm(props: Props) {
  const [previewState, previewAction, isPreviewPending] = useActionState(previewBroadcastAction, {
    kind: "idle" as const,
  });
  const [confirmState, confirmAction, isConfirmPending] = useActionState(confirmBroadcastAction, {
    kind: "idle" as const,
  });
  const [schedulePreviewState, schedulePreviewAction, isSchedulePreviewPending] = useActionState(
    previewScheduleBroadcastAction,
    { kind: "idle" as const },
  );
  const [scheduleState, scheduleAction, isSchedulePending] = useActionState(scheduleBroadcastAction, {
    kind: "idle" as const,
  });
  const dialogRef = useRef<HTMLDialogElement>(null);
  // タグ名を手入力で再確認させる、意図的な摩擦 削ってはいけない
  const [typedTagName, setTypedTagName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  // どちらのボタンが押されたかで、確認モーダルの表示内容と送信先アクションを切り替える
  const [mode, setMode] = useState<"immediate" | "scheduled">("immediate");

  const preview = mode === "immediate" && previewState.kind === "success" ? previewState.preview : null;
  const schedulePreview =
    mode === "scheduled" && schedulePreviewState.kind === "success" ? schedulePreviewState.preview : null;
  const activePreview = preview ?? schedulePreview;
  const isScheduleMode = schedulePreview !== null;

  // プレビューの取得に成功したら、確認モーダルを開く
  useEffect(() => {
    if (preview !== null || schedulePreview !== null) {
      dialogRef.current?.showModal();
    }
  }, [preview, schedulePreview]);

  const canSend = activePreview !== null && typedTagName.trim() === activePreview.tagName;

  return (
    <>
      {/* 送りたいメッセージと、送りたいタグを指定
          そのタグに合致するLINEユーザーが何人いるかをDBから数える → 「この人数に送るよ」というプレビューが出てくる */}
      {/* action = Enterキーで送信された場合のフォールバック(＝今すぐ送信のプレビュー) */}
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
            <option
              value=""
              disabled
            >
              選択してください
            </option>
            {props.tags.map((tag) => (
              <option
                key={tag.id}
                value={tag.id}
              >
                {tag.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-bold text-gray-700">送りたい内容</span>
          <textarea
            name="message"
            required
            rows={4}
            defaultValue={activePreview?.message ?? ""}
            className="rounded border border-gray-300 p-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-bold text-gray-700">送信日時を指定する（あとで送りたい場合のみ）</span>
          <input
            type="datetime-local"
            name="scheduledAt"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="rounded border border-gray-300 p-2"
          />
          <span className="text-xs text-gray-500">
            空欄のままなら「今すぐ送信」、日時を指定すると「予約送信」の確認に進みます。
          </span>
        </label>

        {mode === "immediate" && previewState.kind === "error" && (
          <p className="text-sm text-red-600">{describePreviewError(previewState.error)}</p>
        )}
        {mode === "scheduled" && schedulePreviewState.kind === "error" && (
          <p className="text-sm text-red-600">{describeSchedulePreviewError(schedulePreviewState.error)}</p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            formAction={previewAction}
            onClick={() => setMode("immediate")}
            disabled={isPreviewPending || props.tags.length === 0}
            className="cursor-pointer self-start rounded-lg bg-brand-teal px-4 py-2 font-bold text-white hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
          >
            今すぐ送信内容を確認する
          </button>
          <button
            type="submit"
            formAction={schedulePreviewAction}
            onClick={() => setMode("scheduled")}
            disabled={isSchedulePreviewPending || props.tags.length === 0 || scheduledAt === ""}
            className="cursor-pointer self-start rounded-lg border border-brand-teal px-4 py-2 font-bold text-brand-teal hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            指定した日時で予約の確認をする
          </button>
        </div>
      </form>

      {/* 送信前確認モーダル 宛先の実数と内訳を必ず表示する */}
      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-sm rounded-lg p-0 backdrop:bg-black/40"
        onClose={() => setTypedTagName("")}
      >
        {activePreview && (
          <form
            action={isScheduleMode ? scheduleAction : confirmAction}
            className="flex flex-col gap-4 p-6"
          >
            <h2 className="text-lg font-bold">{isScheduleMode ? "予約内容の確認" : "送信内容の確認"}</h2>

            <dl className="flex flex-col gap-2 rounded-lg bg-gray-50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">送る相手</dt>
                <dd className="font-bold">{activePreview.tagName}のお客様</dd>
              </div>
              {isScheduleMode && schedulePreview && (
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">送信予定日時</dt>
                  <dd className="font-bold">{formatJst(schedulePreview.scheduledAt)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">送信する人数</dt>
                <dd className="font-bold">{activePreview.recipientCount}名</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">今回使う件数</dt>
                <dd className="font-bold">{activePreview.recipientCount}件</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">
                  {isScheduleMode ? "送信後に残る件数（見積もり）" : "送信後に残る件数"}
                </dt>
                <dd className="font-bold">{activePreview.remainingAfterSend}件</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-gray-500">送る内容</dt>
                <dd className="whitespace-pre-wrap font-bold">{activePreview.message}</dd>
              </div>
            </dl>

            {isScheduleMode && (
              <p className="text-xs text-gray-500">
                予約時点の見積もりです。実際に送れるかどうかは、送信予定日時になったときの通数であらためて確認されます。
              </p>
            )}

            <label className="flex flex-col gap-1">
              <span className="font-bold text-gray-700">
                確認のため、タグ名「{activePreview.tagName}」ともう一度入力してください
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

            <input
              type="hidden"
              name="tagId"
              value={activePreview.tagId}
            />
            <input
              type="hidden"
              name="message"
              value={activePreview.message}
            />
            {isScheduleMode && (
              <input
                type="hidden"
                name="scheduledAt"
                value={scheduledAt}
              />
            )}

            {isScheduleMode ? (
              <>
                {scheduleState.kind === "error" && (
                  <p className="text-sm text-red-600">{describeScheduleError(scheduleState.error)}</p>
                )}
                {scheduleState.kind === "success" && (
                  <p className="text-sm text-brand-teal">予約しました</p>
                )}
              </>
            ) : (
              <>
                {confirmState.kind === "error" && (
                  <p className="text-sm text-red-600">{describeConfirmError(confirmState.error)}</p>
                )}
                {confirmState.kind === "success" && (
                  <p className="text-sm text-brand-teal">{confirmState.sentCount}件、送信しました</p>
                )}
              </>
            )}

            {(isScheduleMode ? scheduleState.kind : confirmState.kind) === "success" ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className="cursor-pointer rounded-lg bg-brand-teal px-4 py-2 font-bold text-white hover:bg-brand-navy"
                >
                  閉じる
                </button>
              </div>
            ) : (
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
                  disabled={!canSend || (isScheduleMode ? isSchedulePending : isConfirmPending)}
                  className="cursor-pointer rounded-lg bg-brand-teal px-4 py-2 font-bold text-white hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isScheduleMode ? "予約する" : "送信する"}
                </button>
              </div>
            )}
          </form>
        )}
      </dialog>
    </>
  );
}
