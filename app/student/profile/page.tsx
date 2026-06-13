"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getStudentSession } from "@/lib/session";
import { AVATAR_OPTIONS, getLevel } from "@/lib/types";
import type { Student, PointsHistory, BonusPoint } from "@/lib/types";
import { LevelBadge } from "@/components/LevelBadge";

export default function StudentProfilePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [history, setHistory] = useState<PointsHistory[]>([]);
  const [bonuses, setBonuses] = useState<BonusPoint[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const studentId = getStudentSession();
    if (!studentId) return;

    const { data: s } = await supabase.from("students").select("*").eq("id", studentId).single();
    const { data: h } = await supabase
      .from("points_history")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: true });
    const { data: b } = await supabase
      .from("bonus_points")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    setStudent(s);
    setHistory(h ?? []);
    setBonuses(b ?? []);
  }

  async function chooseAvatar(avatar: string) {
    if (!student) return;
    setSaving(true);
    await supabase.from("students").update({ avatar }).eq("id", student.id);
    setStudent({ ...student, avatar });
    setSaving(false);
  }

  if (!student) return <p className="text-center text-navy/60">جاري التحميل...</p>;

  const maxTotal = Math.max(...history.map((h) => h.points), student.total_points, 1);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-teal">👤 ملفي الشخصي</h1>

      {/* اختيار الأفاتار */}
      <div className="rounded-xl2 border-2 border-teal-light bg-white p-6 shadow-sm">
        <h2 className="mb-3 font-display text-xl text-navy">اختر صورتك الرمزية</h2>
        <div className="grid grid-cols-6 gap-3 sm:grid-cols-12">
          {AVATAR_OPTIONS.map((a) => (
            <button
              key={a}
              onClick={() => chooseAvatar(a)}
              disabled={saving}
              className={`focus-ring flex aspect-square items-center justify-center rounded-xl border-2 text-2xl transition ${
                student.avatar === a
                  ? "border-gold bg-gold-light scale-110"
                  : "border-teal-light hover:bg-teal-light"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* المستوى */}
      <LevelBadge points={student.total_points} />

      {/* الستريك */}
      <div className="rounded-xl2 border-2 border-gold bg-gold-light p-6 text-center shadow-sm">
        <p className="text-4xl">🔥</p>
        <p className="font-display text-2xl text-navy">{student.streak} يوم متتالي</p>
        <p className="text-sm text-navy/70">حافظ على نشاطك اليومي لزيادة عدد أيامك المتتالية!</p>
      </div>

      {/* الرسالة التشجيعية من المعلم */}
      {bonuses.length > 0 && (
        <div className="rounded-xl2 border-2 border-teal-light bg-white p-6 shadow-sm">
          <h2 className="mb-3 font-display text-xl text-navy">📢 رسائل من معلمك</h2>
          <div className="space-y-2">
            {bonuses.map((b) => (
              <div key={b.id} className="rounded-lg bg-teal-light px-4 py-3">
                <p className="font-bold text-navy">
                  +{b.points} نقطة {b.note && `— ${b.note}`}
                </p>
                <p className="text-xs text-navy/60">
                  {new Date(b.created_at).toLocaleDateString("ar-SA")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* تطور النقاط */}
      <div className="rounded-xl2 border-2 border-teal-light bg-white p-6 shadow-sm">
        <h2 className="mb-3 font-display text-xl text-navy">📈 تطور نقاطي عبر الوقت</h2>
        {history.length === 0 ? (
          <p className="text-sm text-navy/60">لا توجد بيانات كافية بعد، أكمل مهامك لتظهر هنا!</p>
        ) : (
          <div className="flex h-40 items-end gap-1">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex-1 rounded-t bg-gradient-to-t from-teal to-gold transition-all"
                style={{ height: `${(h.points / maxTotal) * 100}%` }}
                title={`${h.points} نقطة`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
