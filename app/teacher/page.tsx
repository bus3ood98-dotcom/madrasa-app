"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function TeacherHome() {
  const [stats, setStats] = useState({
    studentsCount: 0,
    tasksCount: 0,
    completionRate: 0,
    activeTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { count: studentsCount } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true });

    const { count: tasksCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true });

    const { data: submissions } = await supabase.from("submissions").select("status");

    const done = submissions?.filter((s) => s.status === "done").length ?? 0;
    const total = submissions?.length ?? 0;

    const today = new Date().toISOString().split("T")[0];
    const { count: activeTasks } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .gte("due_date", today);

    setStats({
      studentsCount: studentsCount ?? 0,
      tasksCount: tasksCount ?? 0,
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
      activeTasks: activeTasks ?? 0,
    });
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-teal">🏠 نظرة عامة</h1>

      {loading ? (
        <p className="text-navy/60">جاري التحميل...</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card icon="🧑‍🎓" label="عدد الطلاب" value={stats.studentsCount} />
          <Card icon="📋" label="إجمالي المهام" value={stats.tasksCount} />
          <Card icon="⏳" label="مهام نشطة" value={stats.activeTasks} />
          <Card icon="✅" label="نسبة الإنجاز العامة" value={`${stats.completionRate}٪`} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickLink href="/teacher/students" icon="🧑‍🎓" title="إدارة الطلاب" desc="إضافة وتعديل وحذف الطلاب" />
        <QuickLink href="/teacher/tasks" icon="📋" title="إدارة المهام" desc="إنشاء مهام جديدة ومتابعتها" />
        <QuickLink href="/teacher/stats" icon="📊" title="الإحصائيات" desc="متابعة تقدم كل طالب" />
      </div>
    </div>
  );
}

function Card({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="rounded-xl2 border-2 border-teal-light bg-white p-4 text-center shadow-sm">
      <p className="text-3xl">{icon}</p>
      <p className="mt-1 font-display text-2xl text-teal">{value}</p>
      <p className="text-xs font-bold text-navy/60">{label}</p>
    </div>
  );
}

function QuickLink({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="focus-ring rounded-xl2 border-2 border-teal-light bg-white p-5 shadow-sm transition hover:border-teal hover:shadow-md"
    >
      <p className="text-3xl">{icon}</p>
      <h3 className="mt-2 font-display text-lg text-navy">{title}</h3>
      <p className="text-sm text-navy/60">{desc}</p>
    </Link>
  );
}
