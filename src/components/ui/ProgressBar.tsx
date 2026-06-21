interface ProgressBarProps {
  // 0–100, or null/undefined for an indeterminate animated bar.
  value?: number | null
  className?: string
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const indeterminate = value == null
  const pct = indeterminate ? 100 : Math.max(0, Math.min(100, value))

  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-slate-200 ${className ?? ''}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(pct)}
    >
      <div
        className={
          indeterminate
            ? 'h-full w-1/3 animate-[progress-slide_1.2s_ease-in-out_infinite] rounded-full bg-indigo-600'
            : 'h-full rounded-full bg-indigo-600 transition-[width] duration-300 ease-out'
        }
        style={indeterminate ? undefined : { width: `${pct}%` }}
      />
    </div>
  )
}
