import Image from "next/image";
import Link from "next/link";
import { getRemainingQuota } from "@/app/lib/messaging";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const remainingResult = await getRemainingQuota();

  return (
    <>
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
          <Link
            href="/customers"
            className="flex items-center"
          >
            <Image
              src="/logo-full.png"
              alt="みらい不動産"
              width={1024}
              height={350}
              className="h-10 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-4">
            {/* INV-8: 「通数」「クォータ」等の専門用語は使わず、常に日本語で件数だけを見せる */}
            <span className="rounded-full bg-brand-mint/20 px-3 py-1 text-xs font-bold whitespace-nowrap text-brand-navy">
              {remainingResult.kind === "ok"
                ? `今月あと${remainingResult.value}件送れます`
                : "送信できる件数を確認できませんでした"}
            </span>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/customers"
                className="text-gray-600 hover:text-brand-teal"
              >
                顧客一覧
              </Link>
              <Link
                href="/broadcasts"
                className="text-gray-600 hover:text-brand-teal"
              >
                タグ配信
              </Link>
              <Link
                href="/notifications"
                className="text-gray-600 hover:text-brand-teal"
              >
                通知
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col bg-gray-50">{children}</div>
    </>
  );
}
