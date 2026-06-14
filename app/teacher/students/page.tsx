"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Student } from "@/lib/types";
import { getLevel } from "@/lib/types";

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // نموذج إضافة/تعديل
  const [editing, setEditing] = useState<Student | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", password: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // نموذج النقاط الإضافية
  const [bonusFor, setBonusFor] = useState<Student | null>(null);
  const [bonusPoints, setBonusPoints] = useState("");
  const [bonusNote, setBonusNote] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from("students").select("*").order("created_at");
    setStudents(data ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: "", username: "", password: "" });
    setFormError("");
    setShowForm(true);
  }

  function openEdit(s: Student) {
    setEditing(s);
    setForm({ name: s.name, username: s.username, password: s.password });
    setFormError("");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
      setFormError("جميع الحقول مطلوبة");
      return;
    }
    setSaving(true);

    if (editing) {
      const { error } = await supabase
        .from("students")
        .update({ name: form.name, username: form.username, password: form.password })
        .eq("id", editing.id);
      if (error) setFormError("اسم المستخدم مستخدم مسبقاً");
    } else {
      const { error } = await supabase.from("students").insert({
        name: form.name,
        username: form.username,
        password: form.password,
      });
      if (error) setFormError("اسم المستخدم مستخدم مسبقاً");
    }

    setSaving(false);
    if (!formError) {
      setEditing(null);
      setForm({ name: "", username: "", password: "" });
      await load();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا الطالب؟ سيتم حذف جميع بياناته.")) return;
    await supabase.from("students").delete().eq("id", id);
    await load();
  }

  async function submitBonus() {
    if (!bonusFor) return;
    const points = parseInt(bonusPoints);
    if (isNaN(points) || points === 0) return;

    await supabase.from("bonus_points").insert({
      student_id: bonusFor.id,
      points,
      note: bonusNote.trim() || null,
    });

    const newTotal = bonusFor.total_points + points;
    await supabase.from("students").update({ total_points: newTotal }).eq("id", bonusFor.id);
    await supabase.from("points_history").insert({
      student_id: bonusFor.id,
      points,
      total_after: newTotal,
    });

    setBonusFor(null);
    setBonusPoints("");
    setBonusNote("");
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-teal">🧑‍🎓 إدارة الطلاب</h1>
        <button
          onClick={openAdd}
          className="focus-ring rounded-full bg-teal px-4 py-2 text-sm font-bold text-cream hover:bg-teal-dark"
        >
          ➕ إضافة طالب
        </button>
      </div>

      {/* نموذج الإضافة/التعديل */}
      {showForm && (
        <form
          onSubmit={handleSave}
          className="rounded-xl2 border-2 border-gold bg-gold-light p-5 shadow-sm"
        >
          <h2 className="mb-3 font-display text-lg text-navy">
            {editing ? "✏️ تعديل بيانات الطالب" : "➕ طالب جديد"}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="text"
              placeholder="الاسم"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="focus-ring rounded-xl border-2 border-teal-light px-3 py-2 outline-none"
            />
            <input
              type="text"
              placeholder="اسم المستخدم"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="focus-ring rounded-xl border-2 border-teal-light px-3 py-2 outline-none"
            />
            <input
              type="text"
              placeholder="كلمة المرور"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="focus-ring rounded-xl border-2 border-teal-light px-3 py-2 outline-none"
            />
          </div>
          {formError && <p className="mt-2 text-sm font-bold text-coral">{formError}</p>}
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="focus-ring rounded-full bg-teal px-5 py-2 text-sm font-bold text-cream hover:bg-teal-dark disabled:opacity-60"
            >
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm({ name: "", username: "", password: "" });
                setShowForm(false);
              }}
              className="focus-ring rounded-full border-2 border-navy/20 px-5 py-2 text-sm font-bold text-navy/70 hover:bg-white"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* نموذج النقاط الإضافية */}
      {bonusFor && (
        <div className="rounded-xl2 border-2 border-teal bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-display text-lg text-navy">
            ⭐ منح نقاط إضافية لـ {bonusFor.name}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="number"
              placeholder="عدد النقاط (يمكن سالب)"
              value={bonusPoints}
              onChange={(e) => setBonusPoints(e.target.value)}
              className="focus-ring rounded-xl border-2 border-teal-light px-3 py-2 outline-none"
            />
            <input
              type="text"
              placeholder="ملاحظة تشجيعية (اختياري): بارك الله فيك..."
              value={bonusNote}
              onChange={(e) => setBonusNote(e.target.value)}
              className="focus-ring rounded-xl border-2 border-teal-light px-3 py-2 outline-none sm:col-span-2"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={submitBonus}
              className="focus-ring rounded-full bg-gold px-5 py-2 text-sm font-bold text-navy hover:bg-gold/80"
            >
              منح النقاط
            </button>
            <button
              onClick={() => setBonusFor(null)}
              className="focus-ring rounded-full border-2 border-navy/20 px-5 py-2 text-sm font-bold text-navy/70 hover:bg-cream"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* قائمة الطلاب */}
      {loading ? (
        <p className="text-navy/60">جاري التحميل...</p>
      ) : students.length === 0 ? (
        <p className="rounded-xl2 border-2 border-dashed border-teal-light bg-white px-4 py-8 text-center text-navy/60">
          لا يوجد طلاب حتى الآن. أضف أول طالب! 👆
        </p>
      ) : (
        <div className="space-y-3">
          {students.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center gap-3 rounded-xl2 border-2 border-teal-light bg-white p-4 shadow-sm"
            >
              <span className="text-3xl">{s.avatar}</span>
              <div className="flex-1">
                <p className="font-bold text-navy">{s.name}</p>
                <p className="text-xs text-navy/60">
                  @{s.username} · {getLevel(s.total_points).emoji} {getLevel(s.total_points).name} ·{" "}
                  ⭐ {s.total_points} نقطة
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setBonusFor(s)}
                  className="focus-ring rounded-full bg-gold-light px-3 py-1.5 text-sm font-bold text-navy hover:bg-gold"
                >
                  ⭐ نقاط
                </button>
                <button
                  onClick={() => openEdit(s)}
                  className="focus-ring rounded-full border-2 border-teal px-3 py-1.5 text-sm font-bold text-teal hover:bg-teal-light"
                >
                  ✏️ تعديل
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="focus-ring rounded-full border-2 border-coral px-3 py-1.5 text-sm font-bold text-coral hover:bg-coral/10"
                >
                  🗑️ حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
