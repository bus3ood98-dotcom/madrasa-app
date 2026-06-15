"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Task, TaskType } from "@/lib/types";

interface TaskWithProgress extends Task {
  total: number;
  done: number;
}

const emptyForm = {
  title: "",
  description: "",
  points: "10",
  due_date: "",
  start_date: "",
  task_type: "once" as TaskType,
};

function daysBetween(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export default function TeacherTasksPage() {
  const [tasks, setTasks] = useState<TaskWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
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

  function openAddForm() {
    setEditingId(null);
    const today = new Date().toISOString().split("T")[0];
    setForm({ ...emptyForm, start_date: today, due_date: today });
    setImageFile(null);
    setError("");
    setShowForm(true);
  }

  function openEditForm(t: Task) {
    setEditingId(t.id);
    setForm({
      title: t.title,
      description: t.description,
      points: String(t.points),
      due_date: t.due_date,
      start_date: t.start_date ?? t.due_date,
      task_type: t.task_type,
    });
    setImageFile(null);
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setError("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("عنوان المهمة مطلوب");
      return;
    }

    if (!form.due_date) {
      setError("تاريخ الانتهاء مطلوب");
      return;
    }

    if (form.task_type === "daily") {
      if (!form.start_date) {
        setError("تاريخ البداية مطلوب للمهام اليومية");
        return;
      }
      if (form.start_date > form.due_date) {
        setError("تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ الانتهاء");
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

    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description,
      points: parseInt(form.points) || 0,
      due_date: form.due_date,
      task_type: form.task_type,
      start_date: form.task_type === "daily" ? form.start_date : null,
      duration_days: form.task_type === "daily" ? daysBetween(form.start_date, form.due_date) : null,
    };
    if (imageUrl) payload.image_url = imageUrl;

    let opError;
    if (editingId) {
      const { error } = await supabase.from("tasks").update(payload).eq("id", editingId);
      opError = error;
    } else {
      const { error } = await supabase.from("tasks").insert(payload);
      opError = error;
    }

    if (opError) {
      setError("حدث خطأ أثناء الحفظ");
    } else {
      closeForm();
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
          onClick={() => (showForm ? closeForm() : openAddForm())}
          className="focus-ring rounded-full bg-teal px-4 py-2 text-sm font-bold text-cream hover:bg-teal-dark"
        >
          {showForm ? "إغلاق" : "➕ مهمة جديدة"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl2 border-2 border-gold bg-gold-light p-5 shadow-sm">
          <h2 className="mb-3 font-display text-lg text-navy">
            {editingId ? "✏️ تعديل المهمة" : "➕ مهمة جديدة"}
          </h2>

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
                : "حدّد تاريخ البداية وتاريخ النهاية، وستظهر للطالب دائرة لكل يوم بينهما يضغط عليها لتعليم إنجازه."}
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

            {form.task_type === "daily" && (
              <div>
                <label className="mb-1 block text-xs font-bold text-navy">تاريخ البداية</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="focus-ring w-full rounded-xl border-2 border-teal-light px-3 py-2 outline-none"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-bold text-navy">
                {form.task_type === "daily" ? "تاريخ النهاية" : "تاريخ التسليم"}
              </label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="focus-ring w-full rounded-xl border-2 border-teal-light px-3 py-2 outline-none"
              />
            </div>

            {form.task_type === "daily" && form.start_date && form.due_date && form.start_date <= form.due_date && (
              <p className="text-xs text-navy/60 sm:col-span-2">
                عدد الأيام: {daysBetween(form.start_date, form.due_date)} يوم · إجمالي النقاط عند الإكمال الكامل:{" "}
                {(parseInt(form.points) || 0) * daysBetween(form.start_date, form.due_date)} نقطة
              </p>
            )}

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-bold text-navy">
                صورة مرفقة (اختياري{editingId ? " - اتركه فاضياً للاحتفاظ بالصورة الحالية" : ""})
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
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="focus-ring rounded-full bg-teal px-5 py-2 text-sm font-bold text-cream hover:bg-teal-dark disabled:opacity-60"
            >
              {saving ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "حفظ المهمة"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="focus-ring rounded-full border-2 border-navy/20 px-5 py-2 text-sm font-bold text-navy/70 hover:bg-white"
            >
              إلغاء
            </button>
          </div>
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
                        ⭐ {t.points} نقطة/يوم · 📅 من {new Date(t.start_date ?? t.due_date).toLocaleDateString("ar-SA")} إلى{" "}
                        {new Date(t.due_date).toLocaleDateString("ar-SA")} ({t.duration_days} يوم) · إجمالي{" "}
                        {t.points * (t.duration_days ?? 0)} نقطة
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
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => openEditForm(t)}
                      className="focus-ring rounded-full border-2 border-teal px-3 py-1.5 text-sm font-bold text-teal hover:bg-teal-light"
                    >
                      ✏️ تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="focus-ring rounded-full border-2 border-coral px-3 py-1.5 text-sm font-bold text-coral hover:bg-coral/10"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
