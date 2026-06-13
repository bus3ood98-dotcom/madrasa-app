"use client";

const STUDENT_KEY = "madrasa_student_id";
const TEACHER_KEY = "madrasa_teacher_auth";

export function setStudentSession(studentId: string) {
  localStorage.setItem(STUDENT_KEY, studentId);
}

export function getStudentSession(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STUDENT_KEY);
}

export function clearStudentSession() {
  localStorage.removeItem(STUDENT_KEY);
}

export function setTeacherSession() {
  sessionStorage.setItem(TEACHER_KEY, "true");
}

export function getTeacherSession(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(TEACHER_KEY) === "true";
}

export function clearTeacherSession() {
  sessionStorage.removeItem(TEACHER_KEY);
}
