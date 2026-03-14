import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, ExternalLink, CheckCircle, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToneBadge } from "@/components/ToneBadge";
import { ProgressTracker } from "@/components/ProgressTracker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ExposeItem = {
  id: string;
  target_username: string;
  claim: string;
  hook: string;
  facts: string;
  full_reply: string;
  evidence: string;
  witness_username: string | null;
  style_used: string;
  status: string;
  profession: string | null;
  niche: string | null;
  created_at: string;
};

type ComebackItem = {
  id: string;
  their_reply_text: string;
  detected_tone: "aggressive" | "sarcastic" | "nice" | "defensive";
  comeback: string;
  style_used: string;
  target_username: string;
  status: string;
  created_at: string;
};

export default function QueuePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "expose";

  const [exposeItems, setExposeItems] = useState<ExposeItem[]>([]);
  const [comebackItems, setComebackItems] = useState<ComebackItem[]>([]);
  const [currentExposeIdx, setCurrentExposeIdx] = useState(0);
  const [currentComebackIdx, setCurrentComebackIdx] = useState(0);

  useEffect(() => {
    loadQueues();
  }, []);

  const loadQueues = async () => {
    const [exposeRes, comebackRes] = await Promise.all([
      supabase.from("expose_queue").select("*").order("created_at", { ascending: true }),
      supabase.from("comeback_queue").select("*").order("created_at", { ascending: true }),
    ]);

    if (exposeRes.data) setExposeItems(exposeRes.data as ExposeItem[]);
    if (comebackRes.data) setComebackItems(comebackRes.data as ComebackItem[]);
  };

  const pendingExpose = exposeItems.filter((i) => i.status === "pending");
  const sentExpose = exposeItems.filter((i) => i.status === "sent");
  const pendingComeback = comebackItems.filter((i) => i.status === "pending");
  const sentComeback = comebackItems.filter((i) => i.status === "sent");

  const handleOpenAndCopy = async (text: string, username: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
      
      const deepLink = `https://instagram.com/${username}`;
      window.open(deepLink, "_blank");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleMarkSent = async (table: "expose_queue" | "comeback_queue", id: string) => {
    await supabase
      .from(table)
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", id);

    if (table === "expose_queue") {
      setExposeItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "sent" } : i))
      );
      setCurrentExposeIdx((prev) => Math.min(prev + 1, pendingExpose.length - 1));
    } else {
      setComebackItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "sent" } : i))
      );
      setCurrentComebackIdx((prev) => Math.min(prev + 1, pendingComeback.length - 1));
    }
    toast.success("Marked as sent ✅");
  };

  const handleSkip = async (table: "expose_queue" | "comeback_queue", id: string) => {
    await supabase.from(table).update({ status: "skipped" }).eq("id", id);
    
    if (table === "expose_queue") {
      setExposeItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "skipped" } : i))
      );
      setCurrentExposeIdx((prev) => Math.min(prev + 1, pendingExpose.length - 1));
    } else {
      setComebackItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "skipped" } : i))
      );
      setCurrentComebackIdx((prev) => Math.min(prev + 1, pendingComeback.length - 1));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top progress */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold tracking-tight mb-3">Queue</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setSearchParams({ tab: "expose" })}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-standard ${
              activeTab === "expose"
                ? "gradient-primary text-primary-foreground"
                : "bg-input text-muted-foreground"
            }`}
          >
            Expose Queue ({pendingExpose.length})
          </button>
          <button
            onClick={() => setSearchParams({ tab: "comeback" })}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-standard ${
              activeTab === "comeback"
                ? "bg-accent text-accent-foreground"
                : "bg-input text-muted-foreground"
            }`}
          >
            Comeback Queue ({pendingComeback.length})
          </button>
        </div>

        {activeTab === "expose" && (
          <ProgressTracker current={sentExpose.length} total={exposeItems.length} />
        )}
        {activeTab === "comeback" && (
          <ProgressTracker current={sentComeback.length} total={comebackItems.length} />
        )}
      </div>

      <div className="mx-auto max-w-[640px] px-4 pt-4 space-y-4">
        {/* EXPOSE QUEUE */}
        {activeTab === "expose" && (
          <AnimatePresence mode="popLayout">
            {pendingExpose.length === 0 ? (
              <EmptyState text="No targets in sight. Start an investigation." />
            ) : (
              pendingExpose.map((item, idx) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -300 }}
                  transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                  className="rounded-2xl bg-surface p-5 card-shadow space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-sm">@{item.target_username}</p>
                      {item.profession && (
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {item.profession} · {item.niche}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground/60 font-mono">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Hook */}
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-bold">
                      🔥 Layer 1: The Hook
                    </p>
                    <p className="text-sm font-medium leading-relaxed">{item.hook}</p>
                  </div>

                  {/* Facts */}
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-bold">
                      📋 Layer 2: The Facts
                    </p>
                    <p className="text-sm leading-relaxed font-mono">{item.facts}</p>
                  </div>

                  {/* Evidence */}
                  {item.evidence && (
                    <div className="evidence-box">
                      <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-bold">
                        Evidence
                      </p>
                      <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                        {item.evidence}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={() =>
                        handleOpenAndCopy(item.full_reply, item.target_username)
                      }
                      className="flex-1 gradient-primary text-primary-foreground font-bold text-xs h-10 rounded-xl transition-standard active:scale-[0.96]"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" /> Open & Copy 📋
                    </Button>
                    <Button
                      onClick={() => handleMarkSent("expose_queue", item.id)}
                      variant="outline"
                      className="rounded-xl border-success/30 text-success hover:bg-success/10 text-xs h-10 transition-standard animate-pulse-soft"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Sent
                    </Button>
                    <Button
                      onClick={() => handleSkip("expose_queue", item.id)}
                      variant="ghost"
                      size="icon"
                      className="rounded-xl h-10 w-10 text-muted-foreground"
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        )}

        {/* COMEBACK QUEUE */}
        {activeTab === "comeback" && (
          <AnimatePresence mode="popLayout">
            {pendingComeback.length === 0 ? (
              <EmptyState text="No replies to counter. Paste one to get started." />
            ) : (
              pendingComeback.map((item, idx) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -300 }}
                  transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                  className="rounded-2xl bg-surface p-5 card-shadow space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <ToneBadge tone={item.detected_tone} />
                    <span className="text-xs text-muted-foreground/60 font-mono">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Their reply */}
                  <div className="evidence-box">
                    <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-bold">
                      They said
                    </p>
                    <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                      "{item.their_reply_text}"
                    </p>
                  </div>

                  {/* Comeback */}
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-bold">
                      Your comeback
                    </p>
                    <p className="text-sm font-medium leading-relaxed">{item.comeback}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={() =>
                        handleOpenAndCopy(
                          item.comeback,
                          item.target_username || ""
                        )
                      }
                      className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xs h-10 rounded-xl transition-standard active:scale-[0.96]"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" /> Open & Copy 📋
                    </Button>
                    <Button
                      onClick={() => handleMarkSent("comeback_queue", item.id)}
                      variant="outline"
                      className="rounded-xl border-success/30 text-success hover:bg-success/10 text-xs h-10 transition-standard animate-pulse-soft"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Sent
                    </Button>
                    <Button
                      onClick={() => handleSkip("comeback_queue", item.id)}
                      variant="ghost"
                      size="icon"
                      className="rounded-xl h-10 w-10 text-muted-foreground"
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <p className="text-muted-foreground font-mono text-sm">{text}</p>
    </motion.div>
  );
}
