"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createPatrolReportAction } from "../actions";
import { describeCreatePatrolReportError } from "../errorMessages";
import { CHECKLIST_ITEMS } from "@/domain/report/checklistItems";
import { PropertyId } from "@/domain/shared/branded";

type Props = {
  propertyId: PropertyId;
};

const MAX_PHOTOS = 10;

export function PatrolReportForm(props: Props) {
  const [state, formAction, isPending] = useActionState(createPatrolReportAction, {
    kind: "idle" as const,
  });

  // <input type="file">は、ファイル選択ダイアログを開くたびに選択結果を「上書き」してしまう
  // 選んだファイルをここで管理し、選択されるたびに追加していく
  const [photos, setPhotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // input.files はJSから直接配列で上書きできないため、DataTransferを介して同期
  // これによりフォーム送信時、photos stateの内容がそのままFormDataに乗る
  useEffect(() => {
    const dataTransfer = new DataTransfer();
    for (const photo of photos) {
      dataTransfer.items.add(photo);
    }
    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
    }
  }, [photos]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const added = Array.from(e.target.files ?? []);
    setPhotos((prev) => [...prev, ...added].slice(0, MAX_PHOTOS));
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6"
    >
      <input
        type="hidden"
        name="propertyId"
        value={props.propertyId}
      />

      {/* 定型チェック項目 異常なし/要確認の二択+任意コメント */}
      <div className="flex flex-col gap-4">
        {CHECKLIST_ITEMS.map((item) => (
          <fieldset
            key={item.key}
            className="flex flex-col gap-2 rounded border border-gray-200 p-3"
          >
            <legend className="font-bold text-gray-700">{item.label}</legend>
            <div className="flex gap-4">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name={`check_${item.key}_status`}
                  value="ok"
                  defaultChecked
                />
                異常なし
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name={`check_${item.key}_status`}
                  value="needsAttention"
                />
                要確認
              </label>
            </div>
            <input
              type="text"
              name={`check_${item.key}_comment`}
              placeholder="気になった点があれば入力してください（任意）"
              className="rounded border border-gray-300 p-2"
            />
          </fieldset>
        ))}
      </div>

      {/* 写真アップロード capture="environment"でスマホの背面カメラを直接起動する */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-gray-700">
          現場の写真（最大{MAX_PHOTOS}枚、あと{MAX_PHOTOS - photos.length}枚選べます）
        </span>

        {photos.length > 0 && (
          <ul className="flex flex-col gap-1 rounded border border-gray-200 p-2 text-sm">
            {photos.map((photo, index) => (
              <li
                key={`${photo.name}-${index}`}
                className="flex items-center justify-between gap-2"
              >
                <span className="truncate">{photo.name}</span>
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="cursor-pointer text-red-600 hover:underline"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}

        <input
          ref={fileInputRef}
          type="file"
          name="photos"
          multiple
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          disabled={photos.length >= MAX_PHOTOS}
          className="cursor-pointer rounded border border-gray-300 p-2 text-sm text-gray-600 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-teal file:px-4 file:py-2 file:font-bold file:text-white file:hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {state.kind === "error" && (
        <p className="text-sm text-red-600">{describeCreatePatrolReportError(state.error)}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer self-start rounded-lg bg-brand-teal px-4 py-2 font-bold text-white hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "作成しています…" : "巡回報告を作成する"}
      </button>
    </form>
  );
}
