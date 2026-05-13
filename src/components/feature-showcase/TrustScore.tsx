import { motion, useMotionValue, useSpring, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Flame, Star, Zap, Lock, CheckCircle2, TrendingUp, Award } from "lucide-react";

const TIERS = [
  {
    id: "bronze",
    label: "Bronze",
    range: "0 – 199",
    color: "#cd7f32",
    glow: "rgba(205,127,50,0.35)",
    bg: "rgba(205,127,50,0.08)",
    border: "rgba(205,127,50,0.3)",
    emoji: "🥉",
    perks: ["Post & accept quests", "Escrow protection", "Basic dispute access"],
    locked: [],
  },
  {
    id: "silver",
    label: "Silver",
    range: "200 – 499",
    color: "#94a3b8",
    glow: "rgba(148,163,184,0.35)",
    bg: "rgba(148,163,184,0.08)",
    border: "rgba(148,163,184,0.3)",
    emoji: "🥈",
    perks: ["Priority quest matching", "Reduced escrow fees", "Trust badge on profile"],
    locked: [],
  },
  {
    id: "gold",
    label: "Gold",
    range: "500 – 899",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.5)",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.4)",
    emoji: "🥇",
    perks: ["Apply as Mediator", "Higher quest limits", "Verified gold badge", "Early feature access"],
    locked: [],
    highlight: true,
  },
  {
    id: "diamond",
    label: "Diamond",
    range: "900+",
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.5)",
    bg: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.4)",
    emoji: "💎",
    perks: ["DAO governance votes", "Revenue share pool", "Priority dispute queue", "Campus Ambassador status"],
    locked: [],
  },
];

const CHAIN_STATS = [
  { label: "Quests completed", value: 47, suffix: "", icon: <CheckCircle2 className="w-4 h-4" />, color: "#a855f7" },
  { label: "Completion rate", value: 98, suffix: "%", icon: <TrendingUp className="w-4 h-4" />, color: "#10b981" },
  { label: "Dispute rate", value: 0, suffix: "%", icon: <ShieldCheck className="w-4 h-4" />, color: "#06b6d4" },
  { label: "Active streak", value: 14, suffix: "d", icon: <Flame className="w-4 h-4" />, color: "#f97316" },
];

function CountUp({ to, suffix = "", duration = 1.8 }: { to: number; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / (duration * 1000), 1);
      setDisplay(Math.round(progress * to));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, to, duration]);

  return <span ref={ref}>{display}{suffix}</span>;
}

function ScoreMeter({ score = 620, max = 1000 }: { score?: number; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const raw = useMotionValue(0);
  const smooth = useSpring(raw, { stiffness: 60, damping: 18 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) raw.set(score);
  }, [inView, score, raw]);

  useEffect(() => {
    return smooth.on("change", (v) => setDisplay(Math.round(v)));
  }, [smooth]);

  const pct = (display / max) * 100;

  const tierColors = [
    { stop: 0,   color: "#cd7f32" },
    { stop: 20,  color: "#cd7f32" },
    { stop: 50,  color: "#94a3b8" },
    { stop: 90,  color: "#f59e0b" },
    { stop: 100, color: "#06b6d4" },
  ];

  const gradientStops = tierColors.map(t => `${t.color} ${t.stop}%`).join(", ");

  return (
    <div ref={ref} className="w-full">
      {/* Score display */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-5xl font-black tracking-tighter text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(90deg, #f59e0b, #06b6d4)" }}>
            {display}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Trust Score · On-chain</p>
        </div>
        <div className="text-right">
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold text-sm px-3">
            🥇 Gold Tier
          </Badge>
          <p className="text-xs text-muted-foreground mt-1.5">62 pts to Diamond</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-white/5 rounded-full overflow-hidden mb-2">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct}%`, backgroundImage: `linear-gradient(90deg, ${gradientStops})` }}
          initial={{ width: "0%" }}
        />
        {/* Tier boundary markers */}
        {[20, 50, 90].map((p) => (
          <div key={p} className="absolute top-0 bottom-0 w-px bg-black/40" style={{ left: `${p}%` }} />
        ))}
      </div>

      {/* Tier labels */}
      <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
        <span style={{ color: "#cd7f32" }}>Bronze</span>
        <span style={{ color: "#94a3b8" }}>Silver</span>
        <span style={{ color: "#f59e0b" }}>Gold</span>
        <span style={{ color: "#06b6d4" }}>Diamond</span>
      </div>
    </div>
  );
}

export default function TrustScore() {
  const [activeTier, setActiveTier] = useState("gold");

  return (
    <section className="py-28 px-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 mb-4 px-4 py-1">
            <Award className="w-3.5 h-3.5 mr-2 inline-block" />
            On-Chain Reputation
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            Earn trust.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-cyan-400">
              Unlock more.
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Every quest you complete is recorded on-chain. Your Trust Score is permanent, portable, and earns you real platform privileges — not just a number.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Left — live score card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-5"
          >
            {/* Score meter card */}
            <div className="rounded-3xl border border-white/10 bg-card/30 backdrop-blur p-7"
              style={{ boxShadow: "0 0 50px rgba(245,158,11,0.08)" }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-400 fill-current" />
                </div>
                <div>
                  <p className="font-bold text-sm">Amaka K.</p>
                  <p className="text-[11px] text-muted-foreground">UNILAG · Worker · Verified</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                  <Flame className="w-3 h-3" />
                  14-day streak
                </div>
              </div>
              <ScoreMeter score={682} />
            </div>

            {/* On-chain stats */}
            <div className="grid grid-cols-2 gap-3">
              {CHAIN_STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border border-white/5 bg-card/20 p-4"
                >
                  <div className="flex items-center gap-2 mb-2" style={{ color: stat.color }}>
                    {stat.icon}
                    <p className="text-[11px] text-muted-foreground font-medium">{stat.label}</p>
                  </div>
                  <p className="text-2xl font-black" style={{ color: stat.color }}>
                    <CountUp to={stat.value} suffix={stat.suffix} duration={1.6} />
                  </p>
                </motion.div>
              ))}
            </div>

            {/* On-chain badge */}
            <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm">Immutable on Solana</p>
                <p className="text-xs text-muted-foreground mt-0.5">Your trust record lives on-chain. No platform can erase or fake it.</p>
              </div>
            </div>
          </motion.div>

          {/* Right — tier cards */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-3"
          >
            {TIERS.map((tier, i) => {
              const isActive = activeTier === tier.id;
              return (
                <motion.button
                  key={tier.id}
                  onClick={() => setActiveTier(tier.id)}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ x: 4 }}
                  className="w-full text-left rounded-2xl border transition-all duration-300 overflow-hidden"
                  style={{
                    borderColor: isActive ? tier.border : "rgba(255,255,255,0.06)",
                    background: isActive ? tier.bg : "rgba(255,255,255,0.02)",
                    boxShadow: isActive ? `0 0 24px ${tier.glow}` : "none",
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-0">
                      <span className="text-2xl">{tier.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-base" style={{ color: isActive ? tier.color : undefined }}>
                            {tier.label}
                          </p>
                          {tier.highlight && (
                            <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/20 text-amber-400 border-amber-500/30">
                              Most popular
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Score {tier.range}</p>
                      </div>
                      <motion.div
                        animate={{ rotate: isActive ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-muted-foreground text-lg leading-none"
                      >›</motion.div>
                    </div>

                    {/* Expanded perks */}
                    <motion.div
                      initial={false}
                      animate={{ height: isActive ? "auto" : 0, opacity: isActive ? 1 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 mt-3 border-t grid grid-cols-2 gap-1.5"
                        style={{ borderColor: `${tier.color}25` }}>
                        {tier.perks.map((perk) => (
                          <div key={perk} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: tier.color }} />
                            {perk}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </motion.button>
              );
            })}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl border border-white/5 bg-card/20 p-5 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Your score starts at zero.</p>
                <p className="text-xs text-muted-foreground mt-0.5">Complete your first quest to begin building your permanent on-chain reputation.</p>
              </div>
              <button className="text-xs font-bold text-primary border border-primary/30 rounded-xl px-3 py-2 hover:bg-primary/10 transition-colors whitespace-nowrap flex-shrink-0">
                Get started →
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
