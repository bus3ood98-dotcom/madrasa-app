"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Student } from "@/lib/types";
import { getLevel } from "@/lib/types";
import { ProgressBar } from "@/components/ProgressBar";

interface StudentProgress extends Student {
  total: number;
  done: number;
}

export default function TeacherStatsPage() {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: studentList } = await supabase
      .from("students")
      .select("*")
      .order("total_points", { ascending: false });

    const { data: submissions } = await supabase.from("submissions").select("student_id, status");

    const withProgress: StudentProgress[] = (studentList ?? []).map((s) => {
      const subs = submissions?.filter((sub) => sub.student_id === s.id) ?? [];
      return {
        ...s,
        total: subs.length,
        done: subs.filter((sub) => sub.status === "done").length,
      };
    });

    setStudents(withProgress);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-teal">📊 إحصائيات الطلاب</h1>

      {loading ? (
        <p className="text-navy/60">جاري التحميل...</p>
      ) : students.length === 0 ? (
        <p className="rounded-xl2 border-2 border-dashed border-teal-light bg-white px-4 py-8 text-center text-navy/60">
          لا يوجد طلاب حتى الآن
        </p>
      ) : (
        <div className="space-y-4">
          {students.map((s, idx) => {
            const percent = s.total > 0 ? (s.done / s.total) * 100 : 0;
            const level = getLevel(s.total_points);
            return (
              <div key={s.id} className="rounded-xl2 border-2 border-teal-light bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-3">
                  <span className="font-display text-xl text-navy/40">#{idx + 1}</span>
                  <span className="text-2xl">{s.avatar}</span>
                  <div className="flex-1">
                    <p className="font-bold text-navy">{s.name}</p>
                    <p className="text-xs text-navy/60">
                      {level.emoji} {level.name} · ⭐ {s.total_points} نقطة · 🔥 {s.streak} يوم متتالي
                    </p>
                  </div>
                  <span className="text-sm font-bold text-teal">
                    {s.done} / {s.total} مهمة
                  </span>
                </div>
                <ProgressBar percent={percent} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
