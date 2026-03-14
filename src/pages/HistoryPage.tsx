import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ToneBadge } from "@/components/ToneBadge";
import { supabase } from "@/integrations/supabase/client";

type HistoryItem = {
  id: string;
  type: string;
  target_username: string;
  their_message: string;
  reply_used: string;
  tone: string | null;
  status: string;
  created_at: string;
};

export default function HistoryPage() {
  const [tab, setTab] = useState<"expose" | "comeback">("expose");
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [tab]);

  const loadHistory = async () => {
    setLoading(true);

    // Combine from both queues based on tab
    if (tab === "expose") {
      const { data } = await supabase
        .from("expose_queue")
        .select("*")
        .in("status", ["sent", "skipped"])
        .order("created_at", { ascending: false });

      setItems(
        (data || []).map((d: any) => ({
          id: d.id,
          type: "expose",
          target_username: d.target_username,
          their_message: d.claim,
          reply_used: d.full_reply,
          tone: d.style_used,
          status: d.status,
          created_at: d.created_at,
        }))
      );
    } else {
      const { data } = await supabase
        .from("comeback_queue")
        .select("*")
        .in("status", ["sent", "skipped"])
        .order("created_at", { ascending: false });

      setItems(
        (data || []).map((d: any) => ({
          id: d.id,
          type: "comeback",
          target_username: d.target_username || "—",
          their_message: d.their_reply_text,
          reply_used: d.comeback,
          tone: d.detected_tone,
          status: d.status,
          created_at: d.created_at,
        }))
      );
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold tracking-tight mb-3">History</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("expose")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-standard ${
              tab === "expose"
                ? "gradient-primary text-primary-foreground"
                : "bg-input text-muted-foreground"
            }`}
          >
            Expose History
          </button>
          <button
            onClick={() => setTab("comeback")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-standard ${
              tab === "comeback"
                ? "bg-accent text-accent-foreground"
                : "bg-input text-muted-foreground"
            }`}
          >
            Comeback History
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[640px] px-4 pt-4 space-y-3">
        {loading ? (
          <p className="text-center text-muted-foreground font-mono text-sm py-20">
            Loading...
          </p>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground font-mono text-sm py-20">
            No history yet. Complete some investigations first.
          </p>
        ) : (
          items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-surface p-4 card-shadow space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">@{item.target_username}</span>
                  {item.tone && tab === "comeback" && (
                    <ToneBadge
                      tone={item.tone as "aggressive" | "sarcastic" | "nice" | "defensive"}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                      item.status === "sent"
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="text-[11px] text-muted-foreground/60 font-mono">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="evidence-box">
                <p className="text-[11px] text-muted-foreground mb-0.5 uppercase tracking-wider font-bold">
                  {tab === "expose" ? "Claim" : "Their reply"}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  "{item.their_message}"
                </p>
              </div>

              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5 uppercase tracking-wider font-bold">
                  Reply used
                </p>
                <p className="text-xs leading-relaxed">{item.reply_used}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
