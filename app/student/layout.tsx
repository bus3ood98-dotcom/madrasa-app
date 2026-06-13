"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStudentSession } from "@/lib/session";
import { StudentNav } from "@/components/StudentNav";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = getStudentSession();
    if (!id) {
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
      <StudentNav />
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
