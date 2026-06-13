"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTeacherSession } from "@/lib/session";
import { TeacherNav } from "@/components/TeacherNav";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getTeacherSession()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-display text-2xl text-teal">جاري التحميل... 🕌</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TeacherNav />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
