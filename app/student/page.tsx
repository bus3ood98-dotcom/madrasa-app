"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getStudentSession } from "@/lib/session";
import { ProgressBar } from "@/components/ProgressBar";
import { LevelBadge } from "@/components/LevelBadge";
import type { Student, Submission, Task } from "@/lib/types";

interface Stats {
  student: Student;
  rank: number;
  totalStudents: number;
  completed: number;
  remaining: number;
  percent: number;
}

export default function StudentHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const studentId = getStudentSession();
    if (!studentId) return;

    const { data: student } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .single();

    const { data: allStudents } = await supabase
      .from("students")
      .select("id, total_points")
      .order("total_points", { ascending: false });

    const { data: submissions } = await supabase
      .from("submissions")
      .select("status")
      .eq("student_id", studentId);

    if (student && allStudents && submissions) {
      const rank = allStudents.findIndex((s) => s.id === studentId) + 1;
      const completed = submissions.filter((s: Pick<Submission, "status">) => s.status === "done").length;
      const remaining = submissions.length - completed;
      const percent = submissions.length > 0 ? (completed / submissions.length) * 100 : 0;

      setStats({
        student,
        rank,
        totalStudents: allStudents.length,
        completed,
        remaining,
        percent,
      });
    }
    setLoading(false);
  }

  if (loading) return <p className="text-center text-navy/60">جاري التحميل...</p>;
  if (!stats) return <p className="text-center text-coral">حدث خطأ في تحميل البيانات</p>;

  const { student, rank, totalStudents, completed, remaining, percent } = stats;

  return (
    <div className="space-y-6">
      {/* ترحيب */}
      <div className="rounded-xl2 border-2 border-teal-light bg-white p-6 text-center shadow-sm">
        <p className="text-5xl">{student.avatar}</p>
        <h1 className="mt-2 font-display text-3xl text-teal">
          أهلاً بك، {student.name}! 👋
        </h1>
        {student.streak > 0 && (
          <p className="mt-1 text-sm font-bold text-gold">
            🔥 {student.streak} يوم متتالي من الإنجاز!
          </p>
        )}
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon="⭐" label="نقاطي" value={student.total_points} />
        <StatCard icon="🏆" label="ترتيبي" value={`${rank} / ${totalStudents}`} />
        <StatCard icon="✅" label="مهام مكتملة" value={completed} />
        <StatCard icon="⏳" label="مهام متبقية" value={remaining} />
      </div>

      {/* المستوى */}
      <LevelBadge points={student.total_points} />

      {/* شريط التقدم */}
      <div className="rounded-xl2 border-2 border-teal-light bg-white p-6 shadow-sm">
        <h2 className="mb-3 font-display text-xl text-navy">نسبة الإنجاز الكلية</h2>
        <ProgressBar percent={percent} />
        <p className="mt-3 text-sm text-navy/70">
          أكملت {completed} من أصل {completed + remaining} مهمة. استمر! 💪
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="rounded-xl2 border-2 border-teal-light bg-white p-4 text-center shadow-sm">
      <p className="text-3xl">{icon}</p>
      <p className="mt-1 font-display text-2xl text-teal">{value}</p>
      <p className="text-xs font-bold text-navy/60">{label}</p>
    </div>
  );
}
