"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getStudentSession } from "@/lib/session";
import type { Task, Submission, Student } from "@/lib/types";
import { ENCOURAGEMENT_MESSAGES, getLevel } from "@/lib/types";

interface TaskWithSubmission extends Task {
  submission: Submission;
}

export default function StudentTasksPage() {
  const [tasks, setTasks] = useState<TaskWithSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
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

    if (submissions) {
      const mapped: TaskWithSubmission[] = submissions
        .filter((s: any) => s.tasks)
        .map((s: any) => ({ ...s.tasks, submission: s }));
      setTasks(mapped);
    }
    setLoading(false);
  }

  async function markDone(taskId: string, submissionId: string, points: number) {
    const studentId = getStudentSession();
    if (!studentId) return;

    setUploadingId(submissionId);

    const { error } = await supabase
      .from("submissions")
      .update({ status: "done", completed_at: new Date().toISOString() })
      .eq("id", submissionId);

    if (!error) {
      // تحديث النقاط الإجمالية
      const { data: student } = await supabase
        .from("students")
        .select("total_points")
        .eq("id", studentId)
        .single();

      const newTotal = (student?.total_points ?? 0) + points;

      await supabase.from("students").update({ total_points: newTotal }).eq("id", studentId);

      // سجل تاريخي
      await supabase.from("points_history").insert({
        student_id: studentId,
        points,
        total_after: newTotal,
      });

      const msg = ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
      setToast(msg);
      setTimeout(() => setToast(""), 2500);

      await load();
    }
    setUploadingId(null);
  }

  async function uploadSubmissionImage(file: File, submissionId: string) {
    setUploadingId(submissionId);
    const ext = file.name.split(".").pop();
    const path = `submissions/${submissionId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("uploads").upload(path, file);
    if (uploadError) {
      setUploadingId(null);
      return;
    }
    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);

    await supabase
      .from("submissions")
      .update({ submission_image: urlData.publicUrl })
      .eq("id", submissionId);

    await load();
    setUploadingId(null);
  }

  if (loading) return <p className="text-center text-navy/60">جاري التحميل...</p>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completed = tasks.filter((t) => t.submission.status === "done");
  const current = tasks.filter(
    (t) => t.submission.status === "pending" && new Date(t.due_date) >= today
  );
  const upcoming = current.filter((t) => {
    const due = new Date(t.due_date);
    const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 7;
  });
  const currentNonUpcoming = current.filter((t) => !upcoming.includes(t));
  const overdue = tasks.filter(
    (t) => t.submission.status === "pending" && new Date(t.due_date) < today
  );

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
        tasks={[...overdue, ...currentNonUpcoming]}
        emptyText="لا توجد مهام حالية الآن 🎉"
        renderActions={(t) => (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => markDone(t.id, t.submission.id, t.points)}
              disabled={uploadingId === t.submission.id}
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
        )}
      />

      <TaskSection
        title="📅 المهام القادمة"
        tasks={upcoming}
        emptyText="لا توجد مهام قادمة بعيدة حالياً"
      />

      <TaskSection
        title="✅ المهام المكتملة"
        tasks={completed}
        emptyText="لم تكمل أي مهمة بعد، ابدأ الآن! 💪"
        completedStyle
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
            const isOverdue = new Date(t.due_date) < new Date() && t.submission.status === "pending";
            return (
              <div
                key={t.id}
                className={`rounded-xl2 border-2 bg-white p-4 shadow-sm ${
                  completedStyle
                    ? "border-teal-light opacity-80"
                    : isOverdue
                    ? "border-coral"
                    : "border-teal-light"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg text-navy">
                      {completedStyle && "✅ "}
                      {t.title}
                    </h3>
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
                    <span className="rounded-full bg-gold-light px-3 py-1 text-sm font-bold text-navy">
                      ⭐ {t.points}
                    </span>
                    <span
                      className={`text-xs font-bold ${isOverdue ? "text-coral" : "text-navy/60"}`}
                    >
                      📅 {new Date(t.due_date).toLocaleDateString("ar-SA")}
                      {isOverdue && " (متأخرة)"}
                    </span>
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
