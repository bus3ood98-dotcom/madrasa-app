"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getStudentSession } from "@/lib/session";
import type { Task, Submission, DailyCompletion } from "@/lib/types";
import { ENCOURAGEMENT_MESSAGES } from "@/lib/types";

interface TaskWithSubmission extends Task {
  submission: Submission;
  completions: DailyCompletion[];
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
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

export default function StudentTasksPage() {
  const [tasks, setTasks] = useState<TaskWithSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const studentId = getStudentSession();
    if (!studentId) return;

    const { data: submissions } = await supabase
      .from("submissions")
      .select("*, tasks(*)")
      .eq("student_id", studentId);

    const { data: completions } = await supabase
      .from("daily_completions")
      .select("*")
      .eq("student_id", studentId);

    if (submissions) {
      const mapped: TaskWithSubmission[] = submissions
        .filter((s: any) => s.tasks)
        .map((s: any) => {
          const taskCompletions = (completions ?? []).filter(
            (c: DailyCompletion) => c.submission_id === s.id
          );
          return {
            ...s.tasks,
            submission: s,
            completions: taskCompletions,
          };
        });
      setTasks(mapped);
    }
    setLoading(false);
  }

  async function awardPoints(studentId: string, points: number) {
    const { data: student } = await supabase
      .from("students")
      .select("total_points")
      .eq("id", studentId)
      .single();

    const newTotal = Math.max(0, (student?.total_points ?? 0) + points);
    await supabase.from("students").update({ total_points: newTotal }).eq("id", studentId);
    await supabase.from("points_history").insert({
      student_id: studentId,
      points,
      total_after: newTotal,
    });
  }

  function showEncouragement() {
    const msg = ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function markDoneOnce(submissionId: string, points: number) {
    const studentId = getStudentSession();
    if (!studentId) return;

    setBusyKey(submissionId);

    const { error } = await supabase
      .from("submissions")
      .update({ status: "done", completed_at: new Date().toISOString() })
      .eq("id", submissionId);

    if (!error) {
      await awardPoints(studentId, points);
      showEncouragement();
      await load();
    }
    setBusyKey(null);
    async function undoDoneOnce(t: TaskWithSubmission) {
    const studentId = getStudentSession();
    if (!studentId) return;

    setBusyKey(t.submission.id);

    const { error } = await supabase
      .from("submissions")
      .update({ status: "pending", completed_at: null })
      .eq("id", t.submission.id);

    if (!error) {
      await awardPoints(studentId, -t.points);
      await load();
    }
    setBusyKey(null);
    }
  }

  async function toggleDay(t: TaskWithSubmission, dateStr: string, isToday: boolean) {
    const studentId = getStudentSession();
    if (!studentId) return;

    const key = `${t.submission.id}-${dateStr}`;
    setBusyKey(key);

    const existing = t.completions.find((c) => c.completion_date === dateStr);

    if (existing) {
      const { error } = await supabase.from("daily_completions").delete().eq("id", existing.id);
      if (!error) {
        const points = existing.is_late ? Math.round(t.points / 2) : t.points;
        await awardPoints(studentId, -points);

        if (t.submission.status === "done") {
          await supabase
            .from("submissions")
            .update({ status: "pending", completed_at: null })
            .eq("id", t.submission.id);
        }
        await load();
      }
    } else {
      const isLate = !isToday;
      const points = isLate ? Math.round(t.points / 2) : t.points;

      const { error } = await supabase.from("daily_completions").insert({
        submission_id: t.submission.id,
        student_id: studentId,
        task_id: t.id,
        completion_date: dateStr,
        is_late: isLate,
      });

      if (!error) {
        await awardPoints(studentId, points);

        const startDate = t.start_date ?? t.due_date;
        const allDays = getTaskDays(startDate, t.due_date);
        const newCompletedCount = t.completions.length + 1;
        if (newCompletedCount >= allDays.length) {
          await supabase
            .from("submissions")
            .update({ status: "done", completed_at: new Date().toISOString() })
            .eq("id", t.submission.id);
        }

        showEncouragement();
        await load();
      }
    }
    setBusyKey(null);
  }

  async function uploadSubmissionImage(file: File, submissionId: string) {
    setBusyKey(submissionId);
    const ext = file.name.split(".").pop();
    const path = `submissions/${submissionId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("uploads").upload(path, file);
    if (uploadError) {
      setBusyKey(null);
      return;
    }
    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);

    await supabase
      .from("submissions")
      .update({ submission_image: urlData.publicUrl })
      .eq("id", submissionId);

    await load();
    setBusyKey(null);
  }

  if (loading) return <p className="text-center text-navy/60">جاري التحميل...</p>;

  const completed = tasks.filter((t) => t.submission.status === "done");
  const current = tasks.filter((t) => t.submission.status === "pending");

  return (
    <div className="space-y-8">
      {toast && (
        <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-teal px-6 py-3 font-display text-lg text-cream shadow-lg">
          {toast}
        </div>
      )}

      <h1 className="font-display text-3xl text-teal">📋 مهامي</h1>

      <TaskSection
        title="⏳ المهام الحالية"
        tasks={current}
        emptyText="لا توجد مهام حالية الآن 🎉"
        renderActions={(t) => {
          const isDaily = t.task_type === "daily";

          if (!isDaily) {
            return (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => markDoneOnce(t.submission.id, t.points)}
                  disabled={busyKey === t.submission.id}
                  className="focus-ring rounded-full bg-teal px-4 py-2 text-sm font-bold text-cream transition hover:bg-teal-dark disabled:opacity-60"
                >
                  ✅ تم الإنجاز
                </button>
                <label className="focus-ring cursor-pointer rounded-full border-2 border-teal px-4 py-2 text-sm font-bold text-teal transition hover:bg-teal-light">
                  📎 رفع صورة (اختياري)
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadSubmissionImage(file, t.submission.id);
                    }}
                  />
                </label>
                {t.submission.submission_image && (
                  <span className="text-sm text-teal">✓ تم رفع صورة</span>
                )}
              </div>
            );
          }

          const today = todayStr();
          const startDate = t.start_date ?? t.due_date;
          const allDays = getTaskDays(startDate, t.due_date);

          return (
            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
                {allDays.map((dStr, idx) => {
                  const completion = t.completions.find((c) => c.completion_date === dStr);
                  const isToday = dStr === today;
                  const isPastOrToday = dStr <= today;
                  const key = `${t.submission.id}-${dStr}`;
                  const isBusy = busyKey === key;

                  let classes = "";
                  if (completion) {
                    classes = completion.is_late
                      ? "border-gold bg-gold text-navy"
                      : "border-teal bg-teal text-cream";
                  } else if (isToday) {
                    classes = "border-teal bg-white text-teal";
                  } else if (isPastOrToday) {
                    classes = "border-gold/50 bg-white text-gold";
                  } else {
                    classes = "border-navy/10 bg-cream text-navy/30 cursor-not-allowed";
                  }

                  return (
                    <button
                      key={dStr}
                      type="button"
                      disabled={!isPastOrToday || isBusy}
                      onClick={() => toggleDay(t, dStr, isToday)}
                      className={`focus-ring flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition disabled:opacity-60 ${classes}`}
                      title={dStr}
                    >
                      {completion ? "✓" : idx + 1}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-navy/60">
                🟢 اليوم · 🟡 تعويض يوم سابق · ⚪ مستقبل (مقفل)
              </p>
            </div>
          );
        }}
      />

      <TaskSection
        title="✅ المهام المكتملة"
        tasks={completed}
        emptyText="لم تكمل أي مهمة بعد، ابدأ الآن! 💪"
        completedStyle
        renderActions={(t) =>
          t.task_type === "once" ? (
            <div className="mt-3">
              <button
                onClick={() => undoDoneOnce(t)}
                disabled={busyKey === t.submission.id}
                className="focus-ring rounded-full border-2 border-coral px-4 py-2 text-sm font-bold text-coral transition hover:bg-coral/10 disabled:opacity-60"
              >
                ↩️ تراجع عن الإنجاز
              </button>
            </div>
          ) : null
        }
      />
    </div>
  );
}

function TaskSection({
  title,
  tasks,
  emptyText,
  renderActions,
  completedStyle,
}: {
  title: string;
  tasks: TaskWithSubmission[];
  emptyText: string;
  renderActions?: (t: TaskWithSubmission) => React.ReactNode;
  completedStyle?: boolean;
}) {
  return (
    <section>
      <h2 className="mb-3 font-display text-xl text-navy">{title}</h2>
      {tasks.length === 0 ? (
        <p className="rounded-xl2 border-2 border-dashed border-teal-light bg-white px-4 py-6 text-center text-sm text-navy/60">
          {emptyText}
        </p>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => {
            const isDaily = t.task_type === "daily";
            return (
              <div
                key={t.id}
                className={`rounded-xl2 border-2 bg-white p-4 shadow-sm ${
                  completedStyle ? "border-teal-light opacity-80" : "border-teal-light"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg text-navy">
                        {completedStyle && "✅ "}
                        {t.title}
                      </h3>
                      {isDaily && (
                        <span className="rounded-full bg-coral/10 px-2 py-0.5 text-xs font-bold text-coral">
                          🔁 يومية
                        </span>
                      )}
                    </div>
                    {t.description && (
                      <p className="mt-1 text-sm text-navy/70">{t.description}</p>
                    )}
                    {t.image_url && (
                      <img
                        src={t.image_url}
                        alt={t.title}
                        className="mt-2 max-h-40 rounded-lg border border-teal-light object-cover"
                      />
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {isDaily ? (
                      <span className="rounded-full bg-gold-light px-3 py-1 text-sm font-bold text-navy">
                        ⭐ {t.points}/يوم
                      </span>
                    ) : (
                      <span className="rounded-full bg-gold-light px-3 py-1 text-sm font-bold text-navy">
                        ⭐ {t.points}
                      </span>
                    )}
                    {!isDaily && (
                      <span className="text-xs font-bold text-navy/60">
                        📅 {new Date(t.due_date).toLocaleDateString("ar-SA")}
                      </span>
                    )}
                  </div>
                </div>
                {renderActions && renderActions(t)}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
