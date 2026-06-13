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
  avatar: string; // emoji or icon key
  total_points: number;
  streak: number;
  last_active_date: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  due_date: string;
  image_url: string | null;
  created_at: string;
}

export type SubmissionStatus = "pending" | "done";

export interface Submission {
  id: string;
  student_id: string;
  task_id: string;
  status: SubmissionStatus;
  submission_image: string | null;
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

export interface PointsHistory {
  id: string;
  student_id: string;
  points: number;
  date: string;
}

// أيقونات/أفاتارات إسلامية جاهزة يختار الطالب من بينها
export const AVATAR_OPTIONS = [
  "🕌", "📿", "🌙", "⭐", "🪔", "📖", "🤲", "🕊️", "🌿", "🧕", "👳", "🌸",
];

// رسائل تشجيعية عشوائية
export const ENCOURAGEMENT_MESSAGES = [
  "ما شاء الله! 🎉",
  "بارك الله فيك! 🌟",
  "أحسنت صنعاً! 👏",
  "استمر، أنت رائع! 💪",
  "جزاك الله خيراً! 📖",
  "تقدم ممتاز! 🚀",
];
