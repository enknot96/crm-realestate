import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

// 「白背景・角丸・薄い枠線」のカードをアプリ全体で使い回すための共通コンポーネント。
// shadow-smを付けることで、平坦(のっぺり)に見えないよう奥行きを出す
export function Card(props: Props) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 ${props.className ?? ""}`}>
      {props.children}
    </div>
  );
}
