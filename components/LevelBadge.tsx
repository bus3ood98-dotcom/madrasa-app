import { getLevel, getNextLevel } from "@/lib/types";

export function LevelBadge({ points }: { points: number }) {
  const level = getLevel(points);
  const next = getNextLevel(points);
  const pointsToNext = next ? next.minPoints - points : 0;

  return (
    <div className="flex items-center gap-3 rounded-xl2 border-2 border-gold bg-gold-light px-4 py-3">
      <span className="text-3xl">{level.emoji}</span>
      <div>
        <p className="font-display text-lg leading-tight text-navy">{level.name}</p>
        {next ? (
          <p className="text-xs text-navy/70">
            {pointsToNext} نقطة للمستوى التالي: {next.name} {next.emoji}
          </p>
        ) : (
          <p className="text-xs text-navy/70">وصلت لأعلى مستوى! 👑</p>
        )}
      </div>
    </div>
  );
}
