"use client";

import { useActionState, useState } from "react";
import { confirmBroadcastAction, scheduleBroadcastAction } from "../actions";
import { describeConfirmError, describeScheduleError } from "../errorMessages";
import { BroadcastPreview } from "@/domain/messaging/broadcastPreview";
import { ScheduledBroadcastPreview } from "@/domain/messaging/previewScheduledBroadcast";
import { LinePreview } from "@/app/(admin)/_components/LinePreview";
import { Button } from "@/app/(admin)/_components/Button";

// 今すぐ送信と予約送信で、確認モーダルに出す項目と送信先のActionが変わる
export type ConfirmTarget =
  | { kind: "immediate"; preview: BroadcastPreview }
  | { kind: "scheduled"; preview: ScheduledBroadcastPreview; scheduledAtInput: string };

type Props = {
  target: ConfirmTarget;
  demoMode: boolean;
  onClose: () => void;
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

// 送信結果(useActionStateの状態)はこのコンポーネントが持つ。
// 呼び出し側がプレビューのたびに key を変えて作り直すため、
// 1回送信した後の「送信しました」が次の配信に残らない。
export function BroadcastConfirmDialog(props: Props) {
  const [confirmState, confirmAction, isConfirmPending] = useActionState(confirmBroadcastAction, {
    kind: "idle" as const,
  });
  const [scheduleState, scheduleAction, isSchedulePending] = useActionState(scheduleBroadcastAction, {
    kind: "idle" as const,
  });
  // タグ名を手入力で再確認させる、意図的な摩擦 削ってはいけない
  const [typedTagName, setTypedTagName] = useState("");

  const { preview } = props.target;
  const isScheduleMode = props.target.kind === "scheduled";
  const canSend = typedTagName.trim() === preview.tagName;
  const isDone = isScheduleMode ? scheduleState.kind === "success" : confirmState.kind === "success";

  return (
    <form
      action={isScheduleMode ? scheduleAction : confirmAction}
      className="flex flex-col gap-4 p-6"
    >
      <h2 className="text-lg font-bold">{isScheduleMode ? "予約内容の確認" : "送信内容の確認"}</h2>

      <dl className="flex flex-col gap-2 rounded-lg bg-gray-50 p-4 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-gray-500">送る相手</dt>
          <dd className="font-bold">{preview.tagName}のお客様</dd>
        </div>
        {props.target.kind === "scheduled" && (
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">送信予定日時</dt>
            <dd className="font-bold">{formatJst(props.target.preview.scheduledAt)}</dd>
          </div>
        )}
        <div className="flex items-center justify-between">
          <dt className="text-gray-500">送信する人数</dt>
          <dd className="font-bold">{preview.recipientCount}名</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-gray-500">今回使う件数</dt>
          <dd className="font-bold">{preview.recipientCount}件</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-gray-500">
            {isScheduleMode ? "送信後に残る件数（見積もり）" : "送信後に残る件数"}
          </dt>
          <dd className="font-bold">{preview.remainingAfterSend}件</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-gray-500">送る内容</dt>
          <dd className="whitespace-pre-wrap font-bold">{preview.message}</dd>
        </div>
      </dl>

      {isScheduleMode && (
        <p className="text-xs text-gray-500">
          予約時点の見積もりです。実際に送れるかどうかは、送信予定日時になったときにあらためて確認されます。
        </p>
      )}

      <label className="flex flex-col gap-1">
        <span className="font-medium text-gray-700">
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

      <input
        type="hidden"
        name="tagId"
        value={preview.tagId}
      />
      <input
        type="hidden"
        name="message"
        value={preview.message}
      />
      {props.target.kind === "scheduled" && (
        <input
          type="hidden"
          name="scheduledAt"
          value={props.target.scheduledAtInput}
        />
      )}

      {isScheduleMode ? (
        <>
          {scheduleState.kind === "error" && (
            <p className="text-sm text-red-600">{describeScheduleError(scheduleState.error)}</p>
          )}
          {scheduleState.kind === "success" && <p className="text-sm text-brand-teal">予約しました</p>}
        </>
      ) : (
        <>
          {confirmState.kind === "error" && (
            <p className="text-sm text-red-600">{describeConfirmError(confirmState.error)}</p>
          )}
          {confirmState.kind === "success" && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-brand-teal">{confirmState.sentCount}件、送信しました</p>
              {props.demoMode && <LinePreview text={preview.message} />}
            </div>
          )}
        </>
      )}

      {isDone ? (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={props.onClose}
          >
            閉じる
          </Button>
        </div>
      ) : (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={props.onClose}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            disabled={!canSend || (isScheduleMode ? isSchedulePending : isConfirmPending)}
          >
            {isScheduleMode ? "予約する" : "送信する"}
          </Button>
        </div>
      )}
    </form>
  );
}
