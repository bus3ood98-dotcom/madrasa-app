"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearTeacherSession } from "@/lib/session";

const links = [
  { href: "/teacher", label: "نظرة عامة", icon: "🏠" },
  { href: "/teacher/students", label: "الطلاب", icon: "🧑‍🎓" },
  { href: "/teacher/tasks", label: "المهام", icon: "📋" },
  { href: "/teacher/stats", label: "الإحصائيات", icon: "📊" },
  { href: "/leaderboard", label: "الترتيب", icon: "🏆" },
];

export function TeacherNav() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearTeacherSession();
    router.push("/login");
  }

  return (
    <nav className="sticky top-0 z-20 border-b-2 border-teal-light bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/teacher" className="font-display text-2xl text-teal">
          إنجاز | لوحة المعلم 🕌
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
                {l.icon} <span className="hidden sm:inline">{l.label}</span>
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
