"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Student, Task, Submission, DailyCompletion } from "@/lib/types";
import { getLevel } from "@/lib/types";
import { ProgressBar } from "@/components/ProgressBar";

interface StudentProgress extends Student {
  total: number;
  done: number;
}

interface TaskStatus {
  task: Task;
  status: "done" | "pending";
  doneDays: number;
}

export default function TeacherStatsPage() {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus[]>>({});
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);

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

  async function toggleExpand(studentId: string) {
    if (expanded === studentId) {
      setExpanded(null);
      return;
    }
    setExpanded(studentId);

    if (!taskStatuses[studentId]) {
      setLoadingDetails(studentId);

      const { data: submissions } = await supabase
        .from("submissions")
        .select("*, tasks(*)")
        .eq("student_id", studentId);

      const { data: completions } = await supabase
        .from("daily_completions")
        .select("*")
        .eq("student_id", studentId);

      const statuses: TaskStatus[] = (submissions ?? [])
        .filter((s: any) => s.tasks)
        .map((s: any) => {
          const doneDays = (completions ?? []).filter(
            (c: DailyCompletion) => c.submission_id === s.id
          ).length;
          return {
            task: s.tasks,
            status: s.status,
            doneDays,
          };
        })
        .sort((a, b) => new Date(a.task.due_date).getTime() - new Date(b.task.due_date).getTime());

      setTaskStatuses((prev) => ({ ...prev, [studentId]: statuses }));
      setLoadingDetails(null);
    }
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
            const isExpanded = expanded === s.id;
            return (
              <div key={s.id} className="rounded-xl2 border-2 border-teal-light bg-white p-4 shadow-sm">
                <button
                  onClick={() => toggleExpand(s.id)}
                  className="focus-ring flex w-full items-center gap-3 text-right"
                >
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
                  <span className="text-navy/40">{isExpanded ? "▲" : "▼"}</span>
                </button>
                <div className="mt-2">
                  <ProgressBar percent={percent} />
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-2 border-t border-teal-light pt-3">
                    {loadingDetails === s.id ? (
                      <p className="text-sm text-navy/60">جاري التحميل...</p>
                    ) : (taskStatuses[s.id] ?? []).length === 0 ? (
                      <p className="text-sm text-navy/60">لا توجد مهام بعد</p>
                    ) : (
                      taskStatuses[s.id].map((ts) => {
                        const isDaily = ts.task.task_type === "daily";
                        return (
                          <div
                            key={ts.task.id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-cream px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{ts.status === "done" ? "✅" : "⏳"}</span>
                              <div>
                                <p className="text-sm font-bold text-navy">{ts.task.title}</p>
                                {isDaily && (
                                  <p className="text-xs text-navy/60">
                                    {ts.doneDays} من {ts.task.duration_days} يوم
                                  </p>
                                )}
                              </div>
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                ts.status === "done"
                                  ? "bg-teal-light text-teal"
                                  : "bg-coral/10 text-coral"
                              }`}
                            >
                              {ts.status === "done" ? "أنهى" : "لم ينهِ"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
