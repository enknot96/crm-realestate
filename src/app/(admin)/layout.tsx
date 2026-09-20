import Image from "next/image";
import Link from "next/link";
import { getRemainingQuota } from "@/app/lib/messaging";
import { MobileNav } from "./_components/MobileNav";

const NAV_LINKS = [
  { href: "/customers", label: "顧客一覧" },
  { href: "/broadcasts", label: "タグ配信" },
  { href: "/notifications", label: "通知" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const remainingResult = await getRemainingQuota();

  return (
    <>
      <header className="relative border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2">
          <Link
            href="/customers"
            className="flex items-center"
          >
            <Image
              src="/logo-full.png"
              alt="みらい不動産"
              width={1024}
              height={350}
              className="h-8 w-auto sm:h-10"
              priority
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* INV-8: 「通数」「クォータ」等の専門用語は使わず、常に日本語で件数だけを見せる */}
            <span className="rounded-full bg-brand-mint/20 px-3 py-1 text-xs font-bold whitespace-nowrap text-brand-navy">
              {remainingResult.kind === "ok"
                ? `今月あと${remainingResult.value}件送れます`
                : "送信できる件数を確認できませんでした"}
            </span>
            <nav className="hidden items-center gap-4 text-sm sm:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-600 hover:text-brand-teal"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <MobileNav links={NAV_LINKS} />
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col bg-gray-50">{children}</div>
    </>
  );
}
