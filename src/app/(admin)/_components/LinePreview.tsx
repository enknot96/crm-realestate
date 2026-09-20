// DEMO_MODE用。実際にはLINEへ送っていないメッセージの見た目を、送信結果の直後に表示する。
// 本物のLINE配信に見えるトーク画面風の見た目にすることで、
// 「これがお客様に届く」という実感をデモで確認できるようにする
type Props = {
  text: string;
  photoUrls?: string[];
};

export function LinePreview(props: Props) {
  return (
    <div className="rounded-lg bg-[#8cabd8] p-4">
      <p className="mb-2 text-xs font-bold text-white">
        LINEプレビュー（デモのため実際には送信していません）
      </p>
      <div className="flex flex-col gap-2">
        <p className="max-w-[85%] rounded-2xl bg-white p-3 text-sm whitespace-pre-wrap text-gray-800 shadow">
          {props.text}
        </p>
        {(props.photoUrls ?? []).map((url) => (
          // eslint-disable-next-line @next/next/no-img-element -- プレビュー用の簡易表示のためnext/image対象外
          <img
            key={url}
            src={url}
            alt="送信される予定の写真"
            className="max-w-[85%] rounded-2xl object-cover shadow"
          />
        ))}
      </div>
    </div>
  );
}
