"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getStudentSession, getTeacherSession } from "@/lib/session";
import { getLevel } from "@/lib/types";
import type { Student } from "@/lib/types";

export default function LeaderboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [backHref, setBackHref] = useState("/login");
  const router = useRouter();

  useEffect(() => {
    if (getStudentSession()) setBackHref("/student");
    else if (getTeacherSession()) setBackHref("/teacher");
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from("students")
      .select("*")
      .order("total_points", { ascending: false });
    setStudents(data ?? []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-display text-2xl text-teal">جاري التحميل... 🏆</p>
      </div>
    );
  }

  const [first, second, third, ...rest] = students;

  return (
    <div className="min-h-screen px-4 py-8 star-motif">
      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href={backHref} className="focus-ring rounded-full border-2 border-teal px-4 py-2 text-sm font-bold text-teal hover:bg-teal-light">
            ⬅ رجوع
          </Link>
          <h1 className="font-display text-3xl text-teal sm:text-4xl">🏆 لوحة الأبطال</h1>
          <span className="w-16" />
        </div>

        {students.length === 0 ? (
          <p className="text-center text-navy/60">لا يوجد طلاب حتى الآن</p>
        ) : (
          <>
            {/* المنصة - Podium */}
            <div className="mb-10 flex items-end justify-center gap-2 sm:gap-4">
              {second && <PodiumCard student={second} place={2} height="h-32" />}
              {first && <PodiumCard student={first} place={1} height="h-44" />}
              {third && <PodiumCard student={third} place={3} height="h-24" />}
            </div>

            {/* بقية الطلاب */}
            {rest.length > 0 && (
              <div className="space-y-2">
                {rest.map((s, i) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-xl2 border-2 border-teal-light bg-white px-4 py-3 shadow-sm"
                  >
                    <span className="font-display text-xl text-navy/50 w-8 text-center">
                      {i + 4}
                    </span>
                    <span className="text-2xl">{s.avatar}</span>
                    <div className="flex-1">
                      <p className="font-bold text-navy">{s.name}</p>
                      <p className="text-xs text-navy/60">
                        {getLevel(s.total_points).emoji} {getLevel(s.total_points).name}
                      </p>
                    </div>
                    <span className="font-display text-lg text-teal">⭐ {s.total_points}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PodiumCard({
  student,
  place,
  height,
}: {
  student: Student;
  place: 1 | 2 | 3;
  height: string;
}) {
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
  const colors = {
    1: "border-gold bg-gold-light",
    2: "border-navy/30 bg-white",
    3: "border-coral/40 bg-white",
  };

  return (
    <div className="flex w-1/3 flex-col items-center">
      <p className="text-4xl">{student.avatar}</p>
      <p className="mt-1 max-w-full truncate font-display text-lg text-navy">{student.name}</p>
      <p className="text-xs font-bold text-navy/60">
        {getLevel(student.total_points).emoji} {getLevel(student.total_points).name}
      </p>
      <p className="font-display text-xl text-teal">⭐ {student.total_points}</p>
      <div
        className={`mt-2 flex w-full ${height} flex-col items-center justify-start rounded-t-xl2 border-2 ${colors[place]} pt-3 shadow-md`}
      >
        <span className="text-4xl sm:text-5xl">{medals[place]}</span>
        <span className="mt-1 font-display text-2xl text-navy/70">{place}</span>
      </div>
    </div>
  );
}
