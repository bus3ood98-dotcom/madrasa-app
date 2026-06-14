"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Task, TaskType } from "@/lib/types";

interface TaskWithProgress extends Task {
  total: number;
  done: number;
}

export default function TeacherTasksPage() {
  const [tasks, setTasks] = useState<TaskWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    points: "10",
    due_date: "",
    task_type: "once" as TaskType,
    duration_days: "7",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: taskList } = await supabase.from("tasks").select("*").order("due_date");
    const { data: submissions } = await supabase.from("submissions").select("task_id, status");

    const withProgress: TaskWithProgress[] = (taskList ?? []).map((t) => {
      const subs = submissions?.filter((s) => s.task_id === t.id) ?? [];
      return {
        ...t,
        total: subs.length,
        done: subs.filter((s) => s.status === "done").length,
      };
    });

    setTasks(withProgress);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("عنوان المهمة مطلوب");
      return;
    }

    if (form.task_type === "once" && !form.due_date) {
      setError("تاريخ التسليم مطلوب لهذا النوع من المهام");
      return;
    }

    if (form.task_type === "daily") {
      const days = parseInt(form.duration_days);
      if (!days || days < 1) {
        setError("عدد الأيام يجب أن يكون رقماً صحيحاً أكبر من صفر");
        return;
      }
    }

    setSaving(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `tasks/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("uploads").upload(path, imageFile);
      if (!uploadError) {
        const { data } = supabase.storage.from("uploads").getPublicUrl(path);
        imageUrl = data.publicUrl;
      }
    }

    let dueDate = form.due_date;
    let durationDays: number | null = null;
    if (form.task_type === "daily") {
      durationDays = parseInt(form.duration_days);
      const d = new Date();
      d.setDate(d.getDate() + durationDays);
      dueDate = d.toISOString().split("T")[0];
    }

    const { error: insertError } = await supabase.from("tasks").insert({
      title: form.title,
      description: form.description,
      points: parseInt(form.points) || 0,
      due_date: dueDate,
      image_url: imageUrl,
      task_type: form.task_type,
      duration_days: durationDays,
    });

    if (insertError) {
      setError("حدث خطأ أثناء الحفظ");
    } else {
      setForm({ title: "", description: "", points: "10", due_date: "", task_type: "once", duration_days: "7" });
      setImageFile(null);
      setShowForm(false);
      await load();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("هل تريد حذف هذه المهمة؟ سيتم حذف سجلات الإنجاز المرتبطة بها.")) return;
    await supabase.from("tasks").delete().eq("id", id);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-teal">📋 إدارة المهام</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="focus-ring rounded-full bg-teal px-4 py-2 text-sm font-bold text-cream hover:bg-teal-dark"
        >
          {showForm ? "إغلاق" : "➕ مهمة جديدة"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl2 border-2 border-gold bg-gold-light p-5 shadow-sm">
          <h2 className="mb-3 font-display text-lg text-navy">➕ مهمة جديدة</h2>

          <div className="mb-3">
            <label className="mb-1 block text-sm font-bold text-navy">نوع المهمة</label>
            <div className="grid grid-cols-2 gap-2 rounded-full bg-white p-1">
              <button
                type="button"
                onClick={() => setForm({ ...form, task_type: "once" })}
                className={`focus-ring rounded-full py-2 text-sm font-bold transition ${
                  form.task_type === "once" ? "bg-teal text-cream" : "text-navy/70"
                }`}
              >
                📌 مرة واحدة (موعد تسليم)
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, task_type: "daily" })}
                className={`focus-ring rounded-full py-2 text-sm font-bold transition ${
                  form.task_type === "daily" ? "bg-teal text-cream" : "text-navy/70"
                }`}
              >
                🔁 يومية متكررة
              </button>
            </div>
            <p className="mt-1 text-xs text-navy/60">
              {form.task_type === "once"
                ? "المهمة تُنجز مرة واحدة بحلول تاريخ معيّن (مثال: حفظ أبيات، تسليم بحث)."
                : "المهمة تتكرر كل يوم لعدد أيام محدد، والطالب يضغط «تم اليوم» يومياً (مثال: الاستغفار اليومي)."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="عنوان المهمة"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="focus-ring rounded-xl border-2 border-teal-light px-3 py-2 outline-none sm:col-span-2"
            />
            <textarea
              placeholder="الوصف (اختياري)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="focus-ring rounded-xl border-2 border-teal-light px-3 py-2 outline-none sm:col-span-2"
              rows={2}
            />
            <input
              type="number"
              placeholder={form.task_type === "daily" ? "نقاط كل يوم" : "عدد النقاط"}
              value={form.points}
              onChange={(e) => setForm({ ...form, points: e.target.value })}
              className="focus-ring rounded-xl border-2 border-teal-light px-3 py-2 outline-none"
            />

            {form.task_type === "once" ? (
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="focus-ring rounded-xl border-2 border-teal-light px-3 py-2 outline-none"
              />
            ) : (
              <input
                type="number"
                placeholder="عدد الأيام (مثال: 7)"
                min={1}
                value={form.duration_days}
                onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                className="focus-ring rounded-xl border-2 border-teal-light px-3 py-2 outline-none"
              />
            )}

            {form.task_type === "daily" && (
              <p className="text-xs text-navy/60 sm:col-span-2">
                إجمالي النقاط عند إكمال كل الأيام: {(parseInt(form.points) || 0) * (parseInt(form.duration_days) || 0)} نقطة
              </p>
            )}

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-bold text-navy">
                صورة مرفقة (اختياري)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="focus-ring w-full rounded-xl border-2 border-teal-light bg-white px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>
          {error && <p className="mt-2 text-sm font-bold text-coral">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="focus-ring mt-3 rounded-full bg-teal px-5 py-2 text-sm font-bold text-cream hover:bg-teal-dark disabled:opacity-60"
          >
            {saving ? "جاري الحفظ..." : "حفظ المهمة"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-navy/60">جاري التحميل...</p>
      ) : tasks.length === 0 ? (
        <p className="rounded-xl2 border-2 border-dashed border-teal-light bg-white px-4 py-8 text-center text-navy/60">
          لا توجد مهام حتى الآن. أضف أول مهمة! 👆
        </p>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => {
            const percent = t.total > 0 ? Math.round((t.done / t.total) * 100) : 0;
            const isDaily = t.task_type === "daily";
            return (
              <div key={t.id} className="rounded-xl2 border-2 border-teal-light bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg text-navy">{t.title}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          isDaily ? "bg-coral/10 text-coral" : "bg-teal-light text-teal"
                        }`}
                      >
                        {isDaily ? "🔁 يومية" : "📌 مرة واحدة"}
                      </span>
                    </div>
                    {t.description && <p className="text-sm text-navy/70">{t.description}</p>}
                    {t.image_url && (
                      <img src={t.image_url} alt={t.title} className="mt-2 max-h-32 rounded-lg border border-teal-light object-cover" />
                    )}
                    {isDaily ? (
                      <p className="mt-2 text-sm font-bold text-navy/70">
                        ⭐ {t.points} نقطة/يوم × {t.duration_days} يوم = {t.points * (t.duration_days ?? 0)} نقطة
                      </p>
                    ) : (
                      <p className="mt-2 text-sm font-bold text-navy/70">
                        ⭐ {t.points} نقطة · 📅 {new Date(t.due_date).toLocaleDateString("ar-SA")}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-teal">
                      ✅ {t.done} / {t.total} طالب أنهى المهمة ({percent}٪)
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="focus-ring rounded-full border-2 border-coral px-3 py-1.5 text-sm font-bold text-coral hover:bg-coral/10"
                  >
                    🗑️ حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
