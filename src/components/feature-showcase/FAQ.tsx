import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, ChevronDown } from "lucide-react";

const CATEGORIES = ["All", "Getting started", "Payments", "Safety", "Disputes"] as const;
type Category = (typeof CATEGORIES)[number];

interface FAQItem {
  q: string;
  a: string;
  cat: Exclude<Category, "All">;
}

const FAQS: FAQItem[] = [
  {
    q: "Do I need a crypto wallet to use Side Quests?",
    a: "Yes — but it takes about 90 seconds to set one up. We recommend Phantom Wallet (free, mobile + browser). When you tap 'Connect Wallet', we walk you through the whole thing. You don't need to buy crypto upfront; you can fund your wallet with as little as ₦500 worth of SOL to post your first quest.",
    cat: "Getting started",
  },
  {
    q: "Is Side Quests available at my university?",
    a: "We're starting with Nigerian universities — UNILAG, UI, OAU, UNIBEN, and ABU are our first five campuses. Each campus goes through a geo-fencing setup and community onboarding before launch. Join the waitlist and we'll notify you the moment your campus is live.",
    cat: "Getting started",
  },
  {
    q: "How does the escrow work?",
    a: "When you post a quest, your payment is locked in a Solana smart contract — not held by Side Quests. The funds only release to the Worker once you confirm the quest is complete, or automatically after 24 hours of inactivity. We never touch your money.",
    cat: "Payments",
  },
  {
    q: "What are the fees?",
    a: "Side Quests charges a 3% platform fee on completed quests. Solana transaction fees are typically less than $0.01. There are no listing fees, no subscription costs, and no hidden charges. Gold and Diamond trust-tier users get a reduced 1.5% fee.",
    cat: "Payments",
  },
  {
    q: "What happens if a Worker disappears mid-quest?",
    a: "If a Worker accepts a quest but doesn't deliver, you can open a dispute after the deadline passes. A community Mediator reviews the evidence — usually within 2 hours. If the Worker is at fault, funds are returned to you instantly from escrow. The Worker's Trust Score takes a hit and they may be suspended.",
    cat: "Disputes",
  },
  {
    q: "What if I'm unhappy with the completed quest?",
    a: "You have a 1-hour review window after marking a quest complete. If you raise an issue, a Mediator steps in to review photo proof, chat logs, and timestamps — all stored on-chain. Mediators are high-trust students with a 900+ score, so they understand the campus context.",
    cat: "Disputes",
  },
  {
    q: "How do Workers get paid?",
    a: "Instantly, in SOL, directly to your connected wallet — no bank account needed, no waiting 3–5 business days. The moment the Tasker confirms completion (or after the auto-release window), the smart contract sends funds to your wallet address. You can convert SOL to Naira through any local exchange.",
    cat: "Payments",
  },
  {
    q: "Is it safe to do physical quests?",
    a: "Your safety is non-negotiable. All users verify their university ID before accepting physical quests. Campus geo-fencing means quests only operate inside verified university boundaries. You can share your live location with a trusted contact during any quest, and our panic button connects directly to campus security.",
    cat: "Safety",
  },
  {
    q: "Can I do quests anonymously?",
    a: "No — and that's intentional. Every user's identity is verified against a university ID. Your public profile shows your first name, university, and trust score. This accountability is what makes Side Quests safe and trustworthy for everyone. Your personal ID details are never visible to other users.",
    cat: "Safety",
  },
  {
    q: "How do I become a Mediator?",
    a: "You need a Trust Score of 900+ (Diamond tier), at least 50 completed quests, and a dispute rate below 1%. Mediators earn 1% of every dispute they resolve fairly. Apply from your profile once you hit the requirements — Mediator slots are limited per campus to keep quality high.",
    cat: "Getting started",
  },
];

function FAQRow({ item, isOpen, onToggle }: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      layout
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        isOpen ? "border-white/15 bg-white/4" : "border-white/5 bg-card/10 hover:border-white/10"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-4 p-5 text-left"
      >
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
          isOpen ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"
        }`}>
          <HelpCircle className="w-3.5 h-3.5" />
        </div>
        <p className={`flex-1 font-bold text-sm leading-snug transition-colors ${isOpen ? "text-foreground" : "text-foreground/80"}`}>
          {item.q}
        </p>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 mt-0.5"
        >
          <ChevronDown className={`w-4 h-4 transition-colors ${isOpen ? "text-primary" : "text-muted-foreground"}`} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pl-[3.75rem]">
              <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const filtered = activeCategory === "All"
    ? FAQS
    : FAQS.filter((f) => f.cat === activeCategory);

  return (
    <section className="py-28 px-4 relative overflow-hidden bg-black/30 border-y border-white/5">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/6 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto max-w-3xl relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 mb-4 px-4 py-1">
            <HelpCircle className="w-3.5 h-3.5 mr-2 inline-block" />
            Common Questions
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            Got questions?{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              We&apos;ve got answers.
            </span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to know before posting your first quest or picking one up.
          </p>
        </motion.div>

        {/* Category filter pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setOpen(null); }}
              className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* FAQ list */}
        <motion.div
          layout
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => (
              <motion.div
                key={item.q}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
              >
                <FAQRow
                  item={item}
                  isOpen={open === i}
                  onToggle={() => setOpen(open === i ? null : i)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Footer nudge */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 text-sm text-muted-foreground"
        >
          Still have questions?{" "}
          <a href="#" className="text-primary font-semibold hover:underline">
            Chat with the community →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
