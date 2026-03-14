import { cn } from "@/lib/utils";

interface ToneBadgeProps {
  tone: "aggressive" | "sarcastic" | "nice" | "defensive";
  className?: string;
}

const toneConfig = {
  aggressive: {
    label: "🔴 Aggressive",
    classes: "bg-destructive/10 text-destructive border-destructive/20",
  },
  sarcastic: {
    label: "🟡 Sarcastic",
    classes: "bg-tone-sarcastic/10 text-tone-sarcastic border-tone-sarcastic/20",
  },
  nice: {
    label: "🟢 Nice",
    classes: "bg-success/10 text-success border-success/20",
  },
  defensive: {
    label: "🔵 Defensive",
    classes: "bg-primary/10 text-primary border-primary/20",
  },
};

export function ToneBadge({ tone, className }: ToneBadgeProps) {
  const config = toneConfig[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border font-mono",
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  );
}
