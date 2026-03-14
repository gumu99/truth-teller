import { motion } from "framer-motion";

interface ScanningOverlayProps {
  message: string;
}

export function ScanningOverlay({ message }: ScanningOverlayProps) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-surface p-6 card-shadow">
      {/* Scanning line */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="h-[2px] w-full gradient-primary opacity-60"
          animate={{ y: [0, 200, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="h-3 w-3 rounded-full gradient-primary animate-pulse-soft" />
        <p className="font-mono text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
