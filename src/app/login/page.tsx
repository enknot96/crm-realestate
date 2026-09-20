import Image from "next/image";
import { LoginForm } from "./_components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo-full.png"
            alt="みらい不動産"
            width={1024}
            height={350}
            className="h-12 w-auto"
            priority
          />
        </div>

        {/* 入力欄はname属性付きでFormDataに集められ、login関数へ渡される
        エラー表示と送信中の状態を出すため、フォーム本体はClient Componentに切り出している */}
        <LoginForm />
      </div>
    </div>
  );
}
