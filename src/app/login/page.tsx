import Image from "next/image";
import { login } from "./actions";

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

        {/* <form action={login}>が送信されると、そのフォーム内にあるname属性付きの入力欄が自動的に集められる
        それらは、FormDataというオブジェクトにまとめられ、login関数の第一引数として渡してくれる */}
        <form
          action={login}
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1 text-sm text-gray-600">
            パスワード
            <input
              type="password"
              name="password"
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-teal focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-brand-teal px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-navy"
          >
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}
