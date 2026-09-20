"use client";

import { useState } from "react";
import Link from "next/link";

type NavLink = { href: string; label: string };

// sm未満の狭い画面用。ヘッダーのナビをハンバーガーメニューに折り畳む
export function MobileNav(props: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={open}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-xl text-gray-600 hover:bg-gray-50"
      >
        {open ? "✕" : "☰"}
      </button>
      {open && (
        <nav className="absolute inset-x-0 top-full z-10 flex flex-col gap-1 border-b border-gray-200 bg-white p-3 shadow-md">
          {props.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 font-bold text-gray-700 hover:bg-gray-50"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
