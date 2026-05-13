import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Coffee, Pill, BookOpen, Package, Printer, Zap, Navigation } from "lucide-react";

const CAMPUS_BOUNDARY = "M 80,60 L 520,40 L 560,120 L 540,320 L 460,380 L 220,390 L 60,340 L 40,180 Z";

const buildings = [
  { id: "library",    x: 220, y: 120, w: 90, h: 55, label: "Library",    color: "#7c3aed" },
  { id: "cafeteria",  x: 360, y: 100, w: 85, h: 50, label: "Cafeteria",  color: "#f97316" },
  { id: "pharmacy",   x: 420, y: 240, w: 75, h: 45, label: "Pharmacy",   color: "#f59e0b" },
  { id: "dormA",      x: 90,  y: 200, w: 70, h: 55, label: "Dorm A",     color: "#06b6d4" },
  { id: "dormB",      x: 90,  y: 290, w: 70, h: 55, label: "Dorm B",     color: "#8b5cf6" },
  { id: "dormC",      x: 270, y: 290, w: 70, h: 55, label: "Dorm C",     color: "#10b981" },
  { id: "sports",     x: 360, y: 300, w: 75, h: 50, label: "Sports",     color: "#64748b" },
];

const roads = [
  "M 155,227 L 220,147",
  "M 220,147 L 360,127",
  "M 360,127 L 403,262",
  "M 155,317 L 270,317",
  "M 270,317 L 397,317",
  "M 220,175 L 220,290",
  "M 340,345 L 395,325",
];

interface QuestPin {
  id: number;
  x: number;
  y: number;
  label: string;
  reward: string;
  color: string;
  glow: string;
  icon: React.ReactNode;
  status: "waiting" | "active" | "transit";
  worker?: string;
  route?: string;
}

const QUESTS: QuestPin[] = [
  {
    id: 1,
    x: 402, y: 125,
    label: "Food pickup",
    reward: "0.12 SOL",
    color: "#f97316",
    glow: "rgba(249,115,22,0.7)",
    icon: <Coffee className="w-3 h-3" />,
    status: "active",
    worker: "AK",
    route: "M 402,125 L 340,227 L 200,227",
  },
  {
    id: 2,
    x: 457, y: 262,
    label: "Medicine run",
    reward: "0.15 SOL",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.7)",
    icon: <Pill className="w-3 h-3" />,
    status: "transit",
    worker: "SJ",
    route: "M 457,262 L 380,280 L 270,270",
  },
  {
    id: 3,
    x: 125, y: 227,
    label: "Book delivery",
    reward: "0.08 SOL",
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.7)",
    icon: <BookOpen className="w-3 h-3" />,
    status: "waiting",
  },
  {
    id: 4,
    x: 125, y: 317,
    label: "Move boxes",
    reward: "0.20 SOL",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.7)",
    icon: <Package className="w-3 h-3" />,
    status: "active",
    worker: "MR",
    route: "M 125,317 L 200,317 L 270,317",
  },
  {
    id: 5,
    x: 265, y: 147,
    label: "Print job",
    reward: "0.05 SOL",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.7)",
    icon: <Printer className="w-3 h-3" />,
    status: "active",
    worker: "EL",
    route: "M 265,147 L 265,175",
  },
  {
    id: 6,
    x: 305, y: 317,
    label: "Charger drop",
    reward: "0.06 SOL",
    color: "#10b981",
    glow: "rgba(16,185,129,0.7)",
    icon: <Zap className="w-3 h-3" />,
    status: "transit",
    worker: "DK",
    route: "M 305,317 L 265,260 L 265,175",
  },
];

const STATUS_LABEL: Record<string, string> = {
  waiting: "Open",
  active: "Accepted",
  transit: "In Transit",
};
const STATUS_COLOR: Record<string, string> = {
  waiting: "bg-white/10 text-white/60",
  active: "bg-primary/20 text-primary",
  transit: "bg-emerald-500/20 text-emerald-400",
};

function AnimatedRoute({ d, color }: { d: string; color: string }) {
  return (
    <>
      <path d={d} stroke={color} strokeWidth="2" strokeDasharray="5 4" fill="none" opacity="0.35" />
      <motion.path
        d={d}
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray="10 100"
        strokeDashoffset={0}
        fill="none"
        opacity="0.9"
        animate={{ strokeDashoffset: [-0, -120] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
      />
    </>
  );
}

function QuestPinMarker({ quest, isSelected, onClick }: {
  quest: QuestPin;
  isSelected: boolean;
  onClick: () => void;
}) {
  const pinR = isSelected ? 11 : 9;
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {/* Outer pulse ring — scale from center */}
      <motion.g
        style={{ originX: `${quest.x}px`, originY: `${quest.y}px` }}
        animate={{ scale: [1, 2.2], opacity: [0.55, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: quest.id * 0.28 }}
      >
        <circle cx={quest.x} cy={quest.y} r={13} fill="none" stroke={quest.color} strokeWidth="1.5" />
      </motion.g>
      {/* Second pulse ring — offset start */}
      <motion.g
        style={{ originX: `${quest.x}px`, originY: `${quest.y}px` }}
        animate={{ scale: [1, 1.9], opacity: [0.35, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: quest.id * 0.28 + 0.55 }}
      >
        <circle cx={quest.x} cy={quest.y} r={13} fill="none" stroke={quest.color} strokeWidth="1" />
      </motion.g>
      {/* Pin circle */}
      <motion.g
        animate={{ scale: isSelected ? 1.25 : 1 }}
        transition={{ duration: 0.2 }}
        style={{ originX: `${quest.x}px`, originY: `${quest.y}px` }}
      >
        <circle
          cx={quest.x} cy={quest.y} r={pinR}
          fill={quest.color}
          opacity={0.95}
          style={{ filter: `drop-shadow(0 0 6px ${quest.glow})` }}
        />
        {quest.worker && (
          <text
            x={quest.x} y={quest.y + 3.5}
            textAnchor="middle"
            fontSize="7"
            fontWeight="bold"
            fill="white"
            style={{ userSelect: "none", pointerEvents: "none" }}
          >
            {quest.worker}
          </text>
        )}
        {!quest.worker && (
          <circle cx={quest.x} cy={quest.y} r="3" fill="white" opacity="0.9" />
        )}
      </motion.g>
    </g>
  );
}

export default function CampusMap() {
  const [selected, setSelected] = useState<number | null>(1);
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 3500);
    return () => clearInterval(t);
  }, []);

  const activeCount = QUESTS.filter((q) => q.status !== "waiting").length;
  const selectedQuest = QUESTS.find((q) => q.id === selected);

  return (
    <section className="py-28 px-4 relative overflow-hidden bg-black/40 border-y border-white/5">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 mb-4 px-4 py-1">
            <span className="relative flex h-2 w-2 mr-2 inline-block">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            Live Campus Activity
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            Your campus,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-secondary">
              geo-fenced &amp; live.
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Physical quests only work inside verified campus boundaries. Every quest pin is a real student helping another — tracked, trusted, and paid instantly.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="md:col-span-2 relative rounded-3xl overflow-hidden border border-white/10 bg-[#0a0e1a]"
            style={{ boxShadow: "0 0 60px rgba(139,92,246,0.15)" }}
          >
            {/* Map header bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-white/3">
              <div className="flex items-center gap-2.5">
                <Navigation className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm">University of Lagos Campus</span>
                <Badge className="bg-emerald-500/90 text-white text-[10px] px-2 py-0.5 animate-pulse">
                  ● Live
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                {activeCount} active quests
              </div>
            </div>

            <div className="relative select-none">
              <svg
                viewBox="0 0 600 430"
                className="w-full"
                style={{ background: "linear-gradient(135deg, #0a0e1a 0%, #0f1628 100%)" }}
              >
                {/* Grid lines */}
                {[...Array(12)].map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={i * 36} x2="600" y2={i * 36} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                ))}
                {[...Array(17)].map((_, i) => (
                  <line key={`v${i}`} x1={i * 36} y1="0" x2={i * 36} y2="430" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                ))}

                {/* Campus fill */}
                <path d={CAMPUS_BOUNDARY} fill="rgba(139,92,246,0.06)" />

                {/* Geo-fence boundary — animated dashed stroke */}
                <motion.path
                  d={CAMPUS_BOUNDARY}
                  fill="none"
                  stroke="rgba(139,92,246,0.7)"
                  strokeWidth="2"
                  strokeDasharray="10 6"
                  animate={{ strokeDashoffset: [0, -80] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                />
                {/* Outer glow border */}
                <path
                  d={CAMPUS_BOUNDARY}
                  fill="none"
                  stroke="rgba(139,92,246,0.2)"
                  strokeWidth="8"
                />

                {/* Geo-fence label */}
                <text x="290" y="24" textAnchor="middle" fontSize="9" fill="rgba(168,85,247,0.7)" fontWeight="600" letterSpacing="2">
                  ⬡ GEO-FENCED ZONE
                </text>

                {/* Roads */}
                {roads.map((d, i) => (
                  <path key={i} d={d} stroke="rgba(255,255,255,0.07)" strokeWidth="7" strokeLinecap="round" fill="none" />
                ))}
                {roads.map((d, i) => (
                  <path key={`r${i}`} d={d} stroke="rgba(255,255,255,0.12)" strokeWidth="3" strokeLinecap="round" fill="none" />
                ))}

                {/* Buildings */}
                {buildings.map((b) => (
                  <g key={b.id}>
                    <rect
                      x={b.x} y={b.y} width={b.w} height={b.h}
                      rx="6"
                      fill={`${b.color}22`}
                      stroke={`${b.color}55`}
                      strokeWidth="1.5"
                    />
                    <text
                      x={b.x + b.w / 2}
                      y={b.y + b.h / 2 + 4}
                      textAnchor="middle"
                      fontSize="8.5"
                      fontWeight="600"
                      fill="rgba(255,255,255,0.7)"
                      style={{ userSelect: "none" }}
                    >
                      {b.label}
                    </text>
                  </g>
                ))}

                {/* Animated quest routes */}
                {QUESTS.filter((q) => q.route && q.status !== "waiting").map((q) => (
                  <AnimatedRoute key={q.id} d={q.route!} color={q.color} />
                ))}

                {/* Quest pins */}
                {QUESTS.map((quest) => (
                  <QuestPinMarker
                    key={quest.id}
                    quest={quest}
                    isSelected={selected === quest.id}
                    onClick={() => setSelected(selected === quest.id ? null : quest.id)}
                  />
                ))}

                {/* Selected quest tooltip */}
                <AnimatePresence>
                  {selectedQuest && (
                    <motion.g
                      key={selectedQuest.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {(() => {
                        const tx = Math.min(Math.max(selectedQuest.x - 60, 8), 430);
                        const ty = selectedQuest.y > 260 ? selectedQuest.y - 72 : selectedQuest.y + 20;
                        return (
                          <>
                            <rect x={tx} y={ty} width="130" height="48" rx="8"
                              fill="rgba(10,14,26,0.96)" stroke={selectedQuest.color} strokeWidth="1.2" />
                            <text x={tx + 10} y={ty + 15} fontSize="9" fontWeight="700" fill="white">
                              {selectedQuest.label}
                            </text>
                            <text x={tx + 10} y={ty + 28} fontSize="8.5" fill={selectedQuest.color} fontWeight="600">
                              {selectedQuest.reward}
                            </text>
                            <text x={tx + 10} y={ty + 41} fontSize="8" fill="rgba(255,255,255,0.5)">
                              {STATUS_LABEL[selectedQuest.status]}{selectedQuest.worker ? ` · Worker: ${selectedQuest.worker}` : ""}
                            </text>
                          </>
                        );
                      })()}
                    </motion.g>
                  )}
                </AnimatePresence>
              </svg>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 flex flex-col gap-1.5">
                {[
                  { color: "#ef4444", label: "Open quest" },
                  { color: "#a855f7", label: "Worker assigned" },
                  { color: "#10b981", label: "In transit" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-2 text-[10px] text-white/60 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: l.color, boxShadow: `0 0 5px ${l.color}` }} />
                    {l.label}
                  </div>
                ))}
              </div>

              {/* Geo-fence badge */}
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur border border-primary/30 rounded-full px-3 py-1.5 text-[10px] font-semibold text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Campus boundary active
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sidebar: quest list */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="font-black text-sm uppercase tracking-widest text-muted-foreground">Active Quests</p>
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold"
              >
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                Live
              </motion.div>
            </div>

            {QUESTS.map((quest, i) => (
              <motion.button
                key={quest.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ x: 3 }}
                onClick={() => setSelected(selected === quest.id ? null : quest.id)}
                className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 ${
                  selected === quest.id
                    ? "border-white/20 bg-white/5"
                    : "border-white/5 bg-card/20 hover:border-white/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: `${quest.color}25`, color: quest.color, border: `1px solid ${quest.color}40` }}
                  >
                    {quest.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-tight truncate">{quest.label}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: quest.color }}>{quest.reward}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_COLOR[quest.status]}`}>
                        {STATUS_LABEL[quest.status]}
                      </span>
                      {quest.worker && (
                        <span className="text-[10px] text-muted-foreground">Worker: {quest.worker}</span>
                      )}
                    </div>
                  </div>
                  {selected === quest.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                      style={{ backgroundColor: quest.color, boxShadow: `0 0 8px ${quest.glow}` }}
                    />
                  )}
                </div>
              </motion.button>
            ))}

            {/* Stats footer */}
            <div className="mt-2 rounded-2xl border border-white/5 bg-card/20 p-4 grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-2xl font-black text-primary">6</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Active pins</p>
              </div>
              <div>
                <p className="text-2xl font-black text-secondary">4</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Workers live</p>
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-400">~8</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg. min ETA</p>
              </div>
              <div>
                <p className="text-2xl font-black text-amber-400">0.66</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">SOL in escrow</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom caption */}
        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-muted-foreground text-sm mt-10"
        >
          Quests outside the geo-fenced boundary are automatically blocked — keeping every physical quest safe and campus-only.
        </motion.p>
      </div>
    </section>
  );
}
