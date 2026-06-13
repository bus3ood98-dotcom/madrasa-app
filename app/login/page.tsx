"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { setStudentSession, setTeacherSession } from "@/lib/session";

const TEACHER_PASSWORD = process.env.NEXT_PUBLIC_TEACHER_PASSWORD || "teacher123";

type Mode = "student" | "teacher";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "teacher") {
        if (password === TEACHER_PASSWORD) {
          setTeacherSession();
          router.push("/teacher");
        } else {
          setError("كلمة المرور غير صحيحة");
        }
      } else {
        const { data, error: dbError } = await supabase
          .from("students")
          .select("id, password")
          .eq("username", username.trim())
          .maybeSingle();

        if (dbError) throw dbError;

        if (!data || data.password !== password) {
          setError("اسم المستخدم أو كلمة المرور غير صحيحة");
        } else {
          setStudentSession(data.id);
          router.push("/student");
        }
      }
    } catch {
      setError("حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 star-motif">
      <div className="relative z-10 w-full max-w-md rounded-xl2 border-2 border-teal-light bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <p className="text-5xl">🕌</p>
          <h1 className="mt-2 font-display text-4xl text-teal">إنجاز</h1>
          <p className="mt-1 text-sm text-navy/70">منصة متابعة الواجبات والإنجازات</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-full bg-teal-light p-1">
          <button
            type="button"
            onClick={() => setMode("student")}
            className={`focus-ring rounded-full py-2 text-sm font-bold transition ${
              mode === "student" ? "bg-teal text-cream shadow" : "text-navy/70"
            }`}
          >
            🧑‍🎓 طالب
          </button>
          <button
            type="button"
            onClick={() => setMode("teacher")}
            className={`focus-ring rounded-full py-2 text-sm font-bold transition ${
              mode === "teacher" ? "bg-teal text-cream shadow" : "text-navy/70"
            }`}
          >
            🧑‍🏫 معلم
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "student" && (
            <div>
              <label htmlFor="username" className="mb-1 block text-sm font-bold text-navy">
                اسم المستخدم
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="focus-ring w-full rounded-xl border-2 border-teal-light px-4 py-2.5 outline-none"
                placeholder="مثال: ahmad"
              />
            </div>
          )}

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-bold text-navy">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="focus-ring w-full rounded-xl border-2 border-teal-light px-4 py-2.5 outline-none"
              placeholder="••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-coral/10 px-3 py-2 text-sm font-bold text-coral">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="focus-ring w-full rounded-xl bg-teal py-3 font-display text-lg text-cream shadow transition hover:bg-teal-dark disabled:opacity-60"
          >
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
        </form>
      </div>
    </div>
  );
}
