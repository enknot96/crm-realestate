"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { previewBroadcastAction, previewScheduleBroadcastAction } from "../actions";
import { describePreviewError, describeSchedulePreviewError } from "../errorMessages";
import { BroadcastConfirmDialog, ConfirmTarget } from "./BroadcastConfirmDialog";
import { Tag } from "@/domain/tag/repository";
import { Card } from "@/app/(admin)/_components/Card";
import { Button } from "@/app/(admin)/_components/Button";

type Props = {
  tags: Tag[];
  demoMode: boolean;
};

export function BroadcastForm(props: Props) {
  const [previewState, previewAction, isPreviewPending] = useActionState(previewBroadcastAction, {
    kind: "idle" as const,
  });
  const [schedulePreviewState, schedulePreviewAction, isSchedulePreviewPending] = useActionState(
    previewScheduleBroadcastAction,
    { kind: "idle" as const },
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  // どちらのボタンが押されたかで、確認モーダルの表示内容と送信先アクションを切り替える
  const [mode, setMode] = useState<"immediate" | "scheduled">("immediate");
  const preview =
    mode === "immediate" && previewState.kind === "success" ? previewState.preview : null;
  const schedulePreview =
    mode === "scheduled" && schedulePreviewState.kind === "success"
      ? schedulePreviewState.preview
      : null;
  const activePreview = preview ?? schedulePreview;

  const confirmTarget: ConfirmTarget | null =
    preview !== null
      ? { kind: "immediate", preview }
      : schedulePreview !== null
        ? { kind: "scheduled", preview: schedulePreview, scheduledAtInput: scheduledAt }
        : null;

  // プレビューを取り直すたびに増やし、確認モーダルの中身をkeyで作り直させる
  // これが無いと、一度送信した後の「送信しました」の状態が残り、2通目が送れなくなる
  // Actionは成功のたびに新しいオブジェクトを返すので、同じ内容で取り直しても作り直しになる
  const [shownPreview, setShownPreview] = useState<object | null>(null);
  const [confirmSession, setConfirmSession] = useState(0);
  if (activePreview !== null && activePreview !== shownPreview) {
    setShownPreview(activePreview);
    setConfirmSession((session) => session + 1);
  }

  // プレビューの取得に成功したら、確認モーダルを開く
  useEffect(() => {
    if (activePreview !== null) {
      dialogRef.current?.showModal();
    }
  }, [activePreview]);

  return (
    <>
      {/* 送りたいメッセージと、送りたいタグを指定
          そのタグに合致するLINEユーザーが何人いるかをDBから数える → 「この人数に送るよ」というプレビューが出てくる */}
      {/* action = Enterキーで送信された場合のフォールバック(＝今すぐ送信のプレビュー) */}
      <Card>
        <form
          action={previewAction}
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1">
            <span className="font-medium text-gray-700">送りたい相手のタグ</span>
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
            <span className="font-medium text-gray-700">送りたい内容</span>
            <textarea
              name="message"
              required
              rows={4}
              defaultValue={activePreview?.message ?? ""}
              className="rounded border border-gray-300 p-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-medium text-gray-700">
              送信日時を指定する（あとで送りたい場合のみ）
            </span>
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
            <p className="text-sm text-red-600">
              {describeSchedulePreviewError(schedulePreviewState.error)}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="submit"
              formAction={previewAction}
              onClick={() => setMode("immediate")}
              disabled={isPreviewPending || props.tags.length === 0}
              className="self-start"
            >
              今すぐ送信内容を確認する
            </Button>
            <Button
              type="submit"
              formAction={schedulePreviewAction}
              onClick={() => setMode("scheduled")}
              disabled={isSchedulePreviewPending || props.tags.length === 0 || scheduledAt === ""}
              variant="secondary"
              className="self-start"
            >
              指定した日時で予約の確認をする
            </Button>
          </div>
        </form>
      </Card>

      {/* 送信前確認モーダル 宛先の実数と内訳を必ず表示する */}
      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-sm rounded-lg p-0 backdrop:bg-black/40"
      >
        {confirmTarget && (
          <BroadcastConfirmDialog
            key={confirmSession}
            target={confirmTarget}
            demoMode={props.demoMode}
            onClose={() => dialogRef.current?.close()}
          />
        )}
      </dialog>
    </>
  );
}
