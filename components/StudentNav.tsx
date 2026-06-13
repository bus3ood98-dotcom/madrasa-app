"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearStudentSession } from "@/lib/session";

const links = [
  { href: "/student", label: "الرئيسية", icon: "🏠" },
  { href: "/student/tasks", label: "المهام", icon: "📋" },
  { href: "/leaderboard", label: "الترتيب", icon: "🏆" },
  { href: "/student/profile", label: "ملفي", icon: "👤" },
];

export function StudentNav() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearStudentSession();
    router.push("/login");
  }

  return (
    <nav className="sticky top-0 z-20 border-b-2 border-teal-light bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/student" className="font-display text-2xl text-teal">
          إنجاز 🕌
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`focus-ring rounded-full px-2 py-1.5 text-sm font-bold transition sm:px-3 ${
                  active
                    ? "bg-teal text-cream"
                    : "text-navy/70 hover:bg-teal-light"
                }`}
              >
                <span className="sm:hidden">{l.icon}</span>
                <span className="hidden sm:inline">
                  {l.icon} {l.label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="focus-ring rounded-full px-2 py-1.5 text-sm font-bold text-coral hover:bg-coral/10 sm:px-3"
          >
            خروج
          </button>
        </div>
      </div>
    </nav>
  );
}
