export function ProgressBar({
  percent,
  label,
}: {
  percent: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex items-center justify-between text-sm font-bold text-navy">
          <span>{label}</span>
          <span>{Math.round(clamped)}٪</span>
        </div>
      )}
      <div className="h-4 w-full overflow-hidden rounded-full bg-teal-light">
        <div
          className="h-full rounded-full bg-gradient-to-l from-teal to-gold transition-all duration-700 ease-out"
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={Math.round(clamped)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
