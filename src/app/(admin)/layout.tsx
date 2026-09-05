import Image from "next/image";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
          <nav className="text-sm">
            <Link
              href="/customers"
              className="text-gray-600 hover:text-brand-teal"
            >
              顧客一覧
            </Link>
          </nav>
        </div>
      </header>
      <div className="flex flex-1 flex-col bg-gray-50">{children}</div>
    </>
  );
}
