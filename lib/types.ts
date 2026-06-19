export type LevelKey = "beginner" | "mujtahid" | "barakallah" | "muhsin" | "mutqin";

export interface LevelInfo {
  key: LevelKey;
  name: string;
  emoji: string;
  minPoints: number;
}

export const LEVELS: LevelInfo[] = [
  { key: "beginner", name: "مبتدئ", emoji: "🌱", minPoints: 0 },
  { key: "mujtahid", name: "مجتهد", emoji: "📖", minPoints: 50 },
  { key: "barakallah", name: "بارك الله فيه", emoji: "🌟", minPoints: 150 },
  { key: "muhsin", name: "محسن", emoji: "🏅", minPoints: 300 },
  { key: "mutqin", name: "متقن", emoji: "👑", minPoints: 500 },
];

export function getLevel(points: number): LevelInfo {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (points >= lvl.minPoints) current = lvl;
  }
  return current;
}

export function getNextLevel(points: number): LevelInfo | null {
  const current = getLevel(points);
  const idx = LEVELS.findIndex((l) => l.key === current.key);
  return LEVELS[idx + 1] ?? null;
}

export interface Student {
  id: string;
  username: string;
  password: string;
  name: string;
  avatar: string;
  total_points: number;
  streak: number;
  last_active_date: string | null;
  created_at: string;
}

export type TaskType = "once" | "daily";

export interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  due_date: string;
  start_date: string | null;
  image_url: string | null;
  created_at: string;
  task_type: TaskType;
  duration_days: number | null;
}

export type SubmissionStatus = "pending" | "done";

export interface Submission {
  id: string;
  student_id: string;
  task_id: string;
  status: SubmissionStatus;
  submission_image: string | null;
  submission_audio: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface BonusPoint {
  id: string;
  student_id: string;
  points: number;
  note: string | null;
  created_at: string;
}

export interface DailyCompletion {
  id: string;
  submission_id: string;
  student_id: string;
  task_id: string;
  completion_date: string;
  is_late: boolean;
  created_at: string;
}

export interface PointsHistory {
  id: string;
  student_id: string;
  points: number;
  date: string;
}

export const AVATAR_OPTIONS = [
  "🕌", "📿", "🌙", "⭐", "🪔", "📖", "🤲", "🕊️", "🌿", "👦", "🧕", "🌸",
];

export const ENCOURAGEMENT_MESSAGES = [
  "ما شاء الله! 🎉",
  "بارك الله فيك! 🌟",
  "أحسنت صنعاً! 👏",
  "استمر، أنت رائع! 💪",
  "جزاك الله خيراً! 📖",
  "تقدم ممتاز! 🚀",
];
