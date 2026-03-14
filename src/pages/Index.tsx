import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScanningOverlay } from "@/components/ScanningOverlay";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const modes = ["Auto", "Savage & Witty", "Calm Destroyer", "Funny Sarcastic"] as const;

const scanMessages = [
  "Scanning profile... 🔍",
  "Finding contradictions... 📂",
  "Crafting the perfect reply... ✍️",
];

const comebackMessages = [
  "Reading their tone... 🎯",
  "Loading comeback... ⚡",
];

export default function HomePage() {
  const navigate = useNavigate();
  
  // Expose state
  const [claim, setClaim] = useState("");
  const [targetUsername, setTargetUsername] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [mode, setMode] = useState<typeof modes[number]>("Auto");
  const [exposeLoading, setExposeLoading] = useState(false);
  const [exposeScanStep, setExposeScanStep] = useState(0);

  // Comeback state
  const [theirReply, setTheirReply] = useState("");
  const [comebackUsername, setComebackUsername] = useState("");
  const [comebackLoading, setComebackLoading] = useState(false);
  const [comebackScanStep, setComebackScanStep] = useState(0);

  const handleExpose = async () => {
    if (!claim.trim()) {
      toast.error("Enter a claim to investigate");
      return;
    }

    setExposeLoading(true);
    setExposeScanStep(0);

    const interval = setInterval(() => {
      setExposeScanStep((prev) => Math.min(prev + 1, scanMessages.length - 1));
    }, 3000);

    try {
      const { data, error } = await supabase.functions.invoke("expose", {
        body: {
          claim: claim.trim(),
          targetUsername: targetUsername.replace("@", "").trim(),
          postUrl: postUrl.trim(),
          mode,
        },
      });

      if (error) throw error;

      toast.success("Claim dismantled. Evidence copied.");
      navigate("/queue?tab=expose");
    } catch (err: any) {
      toast.error(err.message || "Investigation failed");
    } finally {
      clearInterval(interval);
      setExposeLoading(false);
    }
  };

  const handleComeback = async () => {
    if (!theirReply.trim()) {
      toast.error("Paste their reply first");
      return;
    }

    setComebackLoading(true);
    setComebackScanStep(0);

    const interval = setInterval(() => {
      setComebackScanStep((prev) => Math.min(prev + 1, comebackMessages.length - 1));
    }, 2500);

    try {
      const { data, error } = await supabase.functions.invoke("comeback", {
        body: {
          theirReply: theirReply.trim(),
          targetUsername: comebackUsername.replace("@", "").trim(),
        },
      });

      if (error) throw error;

      toast.success("Comeback loaded.");
      navigate("/queue?tab=comeback");
    } catch (err: any) {
      toast.error(err.message || "Comeback generation failed");
    } finally {
      clearInterval(interval);
      setComebackLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-4 pt-8 pb-2 text-center">
        <motion.h1
          className="text-3xl font-extrabold tracking-tight"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <span className="gradient-primary bg-clip-text text-transparent">CaughtUp</span>
        </motion.h1>
        <p className="mt-1 text-sm text-muted-foreground font-mono">
          The internet never forgets.
        </p>
      </header>

      <div className="mx-auto max-w-[640px] space-y-6 px-4 pt-4">
        {/* SECTION 1 — EXPOSE MODE */}
        <motion.section
          className="rounded-2xl bg-surface p-5 card-shadow space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">Expose Mode</h2>
          </div>

          <Textarea
            placeholder='e.g., "I only eat organic"'
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            className="min-h-[80px] resize-none bg-input border-0 placeholder:text-muted-foreground/50 font-mono text-sm"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="@liverking"
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
              className="bg-input border-0 font-mono text-sm placeholder:text-muted-foreground/50"
            />
            <Input
              placeholder="Post URL (optional)"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              className="bg-input border-0 text-sm placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Mode selector */}
          <div className="flex flex-wrap gap-2">
            {modes.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-standard ${
                  mode === m
                    ? "gradient-primary text-primary-foreground"
                    : "bg-input text-muted-foreground hover:text-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {exposeLoading ? (
            <ScanningOverlay message={scanMessages[exposeScanStep]} />
          ) : (
            <Button
              onClick={handleExpose}
              className="w-full gradient-primary text-primary-foreground font-bold text-sm h-11 rounded-xl transition-standard active:scale-[0.96]"
              disabled={exposeLoading}
            >
              Expose 🔍
            </Button>
          )}
        </motion.section>

        {/* SECTION 2 — COMEBACK MODE */}
        <motion.section
          className="rounded-2xl bg-surface p-5 card-shadow space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            <h2 className="text-lg font-bold tracking-tight">Comeback Mode</h2>
          </div>

          <Textarea
            placeholder="Paste their reply to your comment..."
            value={theirReply}
            onChange={(e) => setTheirReply(e.target.value)}
            className="min-h-[80px] resize-none bg-input border-0 placeholder:text-muted-foreground/50 font-mono text-sm"
          />

          <Input
            placeholder="@their_username (optional)"
            value={comebackUsername}
            onChange={(e) => setComebackUsername(e.target.value)}
            className="bg-input border-0 font-mono text-sm placeholder:text-muted-foreground/50"
          />

          {comebackLoading ? (
            <ScanningOverlay message={comebackMessages[comebackScanStep]} />
          ) : (
            <Button
              onClick={handleComeback}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-sm h-11 rounded-xl transition-standard active:scale-[0.96]"
              disabled={comebackLoading}
            >
              Generate Comeback ⚡
            </Button>
          )}
        </motion.section>

        {/* Disclaimer */}
        <p className="text-center text-[11px] text-muted-foreground/60 pb-4">
          CaughtUp only references publicly available information. All replies are posted manually by the user.
        </p>
      </div>
    </div>
  );
}
