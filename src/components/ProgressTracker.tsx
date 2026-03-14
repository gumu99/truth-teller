import { cn } from "@/lib/utils";

interface ProgressTrackerProps {
  current: number;
  total: number;
  className?: string;
}

export function ProgressTracker({ current, total, className }: ProgressTrackerProps) {
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">
          {current}/{total} replied
        </span>
        <span className="font-mono text-xs text-primary tabular-nums">
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-[2px] w-full rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary progress-glow transition-standard"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
