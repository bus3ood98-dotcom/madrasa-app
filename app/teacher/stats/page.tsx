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
  submission: Submission;
  status: "done" | "pending";
  completions: DailyCompletion[];
}

function getTaskDays(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const cur = new Date(startDate);
  const end = new Date(endDate);
  while (cur <= end) {
    days.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function storagePathFromUrl(url: string): string | null {
  const marker = "/uploads/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

export default function TeacherStatsPage() {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus[]>>({});
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  async function loadStudentDetails(studentId: string) {
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
      .map((s: any) => ({
        task: s.tasks,
        submission: s,
        status: s.status,
        completions: (completions ?? []).filter((c: DailyCompletion) => c.submission_id === s.id),
      }))
      .sort(
        (a, b) => new Date(a.task.due_date).getTime() - new Date(b.task.due_date).getTime()
      );

    setTaskStatuses((prev) => ({ ...prev, [studentId]: statuses }));
    setLoadingDetails(null);
  }

  async function toggleExpand(studentId: string) {
    if (expanded === studentId) {
      setExpanded(null);
      return;
    }
    setExpanded(studentId);
    if (!taskStatuses[studentId]) {
      await loadStudentDetails(studentId);
    }
  }

  async function toggleDayColor(studentId: string, ts: TaskStatus, c: DailyCompletion) {
    setBusy(true);
    const newIsLate = !c.is_late;

    await supabase.from("daily_completions").update({ is_late: newIsLate }).eq("id", c.id);

    const full = ts.task.points;
    const half = Math.round(ts.task.points / 2);
    const diff = newIsLate ? half - full : full - half;

    const { data: student } = await supabase
      .from("students")
      .select("total_points")
      .eq("id", studentId)
      .single();
    const newTotal = Math.max(0, (student?.total_points ?? 0) + diff);
    await supabase.from("students").update({ total_points: newTotal }).eq("id", studentId);
    await supabase.from("points_history").insert({
      student_id: studentId,
      points: diff,
      total_after: newTotal,
    });

    await loadStudentDetails(studentId);
    await load();
    setBusy(false);
  }

  async function deleteAttachment(
    studentId: string,
    submissionId: string,
    kind: "image" | "audio",
    url: string
  ) {
    if (!confirm("سيتم حذف الملف نهائياً لتفريغ المساحة (تبقى نقاط الطالب). متابعة؟")) return;
    setBusy(true);

    const path = storagePathFromUrl(url);
    if (path) {
      await supabase.storage.from("uploads").remove([path]);
    }

    const field = kind === "image" ? "submission_image" : "submission_audio";
    await supabase
      .from("submissions")
      .update({ [field]: null })
      .eq("id", submissionId);

    await loadStudentDetails(studentId);
    setBusy(false);
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
                  <div className="mt-4 space-y-3 border-t border-teal-light pt-3">
                    {loadingDetails === s.id ? (
                      <p className="text-sm text-navy/60">جاري التحميل...</p>
                    ) : (taskStatuses[s.id] ?? []).length === 0 ? (
                      <p className="text-sm text-navy/60">لا توجد مهام بعد</p>
                    ) : (
                      taskStatuses[s.id].map((ts) => {
                        const isDaily = ts.task.task_type === "daily";
                        const startDate = ts.task.start_date ?? ts.task.due_date;
                        const allDays = isDaily ? getTaskDays(startDate, ts.task.due_date) : [];
                        return (
                          <div key={ts.task.id} className="rounded-lg bg-cream px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {ts.status === "done" ? "✅" : "⏳"}
                                </span>
                                <p className="text-sm font-bold text-navy">{ts.task.title}</p>
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

                            {isDaily && (
                              <div className="mt-2">
                                <div className="flex flex-wrap gap-1.5">
                                  {allDays.map((dStr, i) => {
                                    const c = ts.completions.find(
                                      (x) => x.completion_date === dStr
                                    );
                                    if (!c) {
                                      return (
                                        <div
                                          key={dStr}
                                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-navy/10 bg-white text-xs text-navy/30"
                                          title={dStr}
                                        >
                                          {i + 1}
                                        </div>
                                      );
                                    }
                                    return (
                                      <button
                                        key={dStr}
                                        type="button"
                                        disabled={busy}
                                        onClick={() => toggleDayColor(s.id, ts, c)}
                                        title={`${dStr} - اضغط لتبديل اللون`}
                                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition disabled:opacity-60 ${
                                          c.is_late
                                            ? "border-gold bg-gold text-navy"
                                            : "border-teal bg-teal text-cream"
                                        }`}
                                      >
                                        ✓
                                      </button>
                                    );
                                  })}
                                </div>
                                <p className="mt-1 text-[11px] text-navy/50">
                                  اضغط على الدائرة لتبديل اللون (🟡 نصف نقطة ↔ 🟢 كامل النقاط)
                                </p>
                              </div>
                            )}

                            {(ts.submission.submission_image || ts.submission.submission_audio) && (
                              <div className="mt-2 space-y-2 border-t border-navy/10 pt-2">
                                {ts.submission.submission_image && (
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={ts.submission.submission_image}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm font-bold text-teal underline"
                                    >
                                      🖼️ عرض الصورة
                                    </a>
                                    <button
                                      onClick={() =>
                                        deleteAttachment(
                                          s.id,
                                          ts.submission.id,
                                          "image",
                                          ts.submission.submission_image!
                                        )
                                      }
                                      disabled={busy}
                                      className="rounded-full border border-coral px-2 py-0.5 text-xs font-bold text-coral hover:bg-coral/10 disabled:opacity-60"
                                    >
                                      🗑️ حذف
                                    </button>
                                  </div>
                                )}
                                {ts.submission.submission_audio && (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <audio
                                      controls
                                      src={ts.submission.submission_audio}
                                      className="h-8 max-w-[200px]"
                                    />
                                    <button
                                      onClick={() =>
                                        deleteAttachment(
                                          s.id,
                                          ts.submission.id,
                                          "audio",
                                          ts.submission.submission_audio!
                                        )
                                      }
                                      disabled={busy}
                                      className="rounded-full border border-coral px-2 py-0.5 text-xs font-bold text-coral hover:bg-coral/10 disabled:opacity-60"
                                    >
                                      🗑️ حذف
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
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
