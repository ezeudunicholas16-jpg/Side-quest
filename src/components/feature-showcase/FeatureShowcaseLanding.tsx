"use client";

/* eslint-disable @next/next/no-img-element */

import CampusMap from "@/components/feature-showcase/CampusMap";
import TrustScore from "@/components/feature-showcase/TrustScore";
import FAQ from "@/components/feature-showcase/FAQ";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowRight, MapPin, Clock, ShieldCheck, ChevronRight, Zap,
  Wallet, Activity, User, Coffee, BookOpen, Pill, Printer,
  Package, CheckCircle2, Lock, Star, Navigation, LifeBuoy,
  TrendingUp, Users, Globe
} from "lucide-react";

const collabMoving = "/feature-showcase/collab-moving.png";
const campusFood = "/feature-showcase/campus-food.png";
const medicinePickup = "/feature-showcase/medicine-pickup.png";
const liftingBoxes = "/feature-showcase/lifting-boxes.png";
const questItems = "/feature-showcase/quest-items.png";
const studentsApp = "/feature-showcase/students-app.png";

const smoothEase = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: smoothEase } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: smoothEase } }
};

const quests = [
  {
    title: "Pick up food from the cafeteria",
    reward: "0.12 SOL",
    location: "Physical â€¢ Campus",
    urgency: "High",
    icon: <Coffee className="w-6 h-6 text-orange-400" />,
    color: "from-orange-500/30 to-transparent",
    borderColor: "hover:border-orange-500/50",
    glowColor: "rgba(249,115,22,0.3)",
    trust: "Verified",
    img: campusFood
  },
  {
    title: "Get my book from Dorm 9",
    reward: "0.08 SOL",
    location: "Physical â€¢ Campus",
    urgency: "Medium",
    icon: <BookOpen className="w-6 h-6 text-cyan-400" />,
    color: "from-cyan-500/30 to-transparent",
    borderColor: "hover:border-cyan-500/50",
    glowColor: "rgba(6,182,212,0.3)",
    trust: "Verified",
    img: liftingBoxes
  },
  {
    title: "OTC medicine pickup",
    reward: "0.15 SOL",
    location: "Physical â€¢ Pharmacy",
    urgency: "High",
    icon: <Pill className="w-6 h-6 text-amber-400" />,
    color: "from-amber-500/30 to-transparent",
    borderColor: "hover:border-amber-500/50",
    glowColor: "rgba(245,158,11,0.3)",
    trust: "Verified",
    img: medicinePickup
  },
  {
    title: "Print assignment before 2PM",
    reward: "0.05 SOL",
    location: "Physical â€¢ Library",
    urgency: "Urgent",
    icon: <Printer className="w-6 h-6 text-red-400" />,
    color: "from-red-500/30 to-transparent",
    borderColor: "hover:border-red-500/50",
    glowColor: "rgba(239,68,68,0.3)",
    trust: "Verified",
    img: questItems
  },
  {
    title: "Move luggage between dorms",
    reward: "0.20 SOL",
    location: "Physical â€¢ Campus",
    urgency: "Medium",
    icon: <Package className="w-6 h-6 text-violet-400" />,
    color: "from-violet-500/30 to-transparent",
    borderColor: "hover:border-violet-500/50",
    glowColor: "rgba(139,92,246,0.3)",
    trust: "Verified",
    img: collabMoving
  },
  {
    title: "Proofread my thesis intro",
    reward: "0.30 SOL",
    location: "Digital â€¢ Online",
    urgency: "Medium",
    icon: <User className="w-6 h-6 text-emerald-400" />,
    color: "from-emerald-500/30 to-transparent",
    borderColor: "hover:border-emerald-500/50",
    glowColor: "rgba(16,185,129,0.3)",
    trust: "Verified",
    img: studentsApp
  }
];

const profiles = [
  { initials: "AK", name: "Alex K.", role: "Worker", score: "4.9", quests: 82, uni: "UNILAG", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40" },
  { initials: "SJ", name: "Sarah J.", role: "Tasker", score: "4.8", quests: 15, uni: "Covenant Univ.", color: "bg-violet-500/20 text-violet-400 border-violet-500/40" },
  { initials: "MR", name: "Marcus R.", role: "Mediator", score: "5.0", quests: 120, uni: "UI Ibadan", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
  { initials: "EL", name: "Emma L.", role: "Worker", score: "4.7", quests: 43, uni: "OAU Ile-Ife", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40" }
];

const testimonials = [
  { text: "I made enough SOL delivering food between classes to pay for my textbooks this semester.", author: "David M.", role: "Worker", uni: "UC Berkeley", rating: 5 },
  { text: "Lifesaver. I was sick in my dorm and someone picked up medicine for me in 20 minutes.", author: "Jessica T.", role: "Tasker", uni: "UNILAG", rating: 5 },
  { text: "The escrow system means I never worry about getting paid. Once the quest is done, the funds unlock instantly.", author: "Ryan C.", role: "Worker", uni: "Covenant Univ.", rating: 5 }
];

const marqueeImages = [campusFood, collabMoving, medicinePickup, liftingBoxes, questItems, studentsApp, campusFood, collabMoving, medicinePickup, liftingBoxes];

const particles = Array.from({ length: 18 }, (_, i) => ({
  size: 2 + ((i * 7) % 5) * 0.8,
  left: `${(i * 37) % 100}%`,
  top: `${(i * 53) % 100}%`,
  duration: `${6 + ((i * 11) % 8)}s`,
  delay: `${(i * 3) % 6}s`,
  background: i % 3 === 0 ? "#a855f7" : i % 3 === 1 ? "#06b6d4" : "#10b981",
}));

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-30"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: particle.background,
            left: particle.left,
            top: particle.top,
            animation: `float-particle ${particle.duration} ease-in-out infinite`,
            animationDelay: particle.delay,
          }}
        />
      ))}
    </div>
  );
}

const progressSteps = [
  { label: "Quest Posted", time: "12:30 PM", done: true },
  { label: "Worker Accepted", time: "12:45 PM", done: true },
  { label: "In Progress", time: "1:10 PM", active: true },
  { label: "Proof Submitted", time: "—", done: false },
  { label: "Completed + Paid", time: "—", done: false },
];
function AnimatedProgressTracker() {
  const [activeStep, setActiveStep] = useState(2);


  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((s) => (s + 1) % progressSteps.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative border-l-2 border-white/10 ml-3 space-y-6">
      {progressSteps.map((step, i) => {
        const isActive = i === activeStep;
        const isPast = i < activeStep;
        return (
          <motion.div
            key={i}
            animate={{ opacity: isPast ? 0.55 : isActive ? 1 : 0.3 }}
            transition={{ duration: 0.4 }}
            className="relative pl-8"
          >
            <motion.div
              animate={{
                backgroundColor: isActive ? "#a855f7" : isPast ? "#10b981" : "transparent",
                borderColor: isActive ? "#a855f7" : isPast ? "#10b981" : "rgba(255,255,255,0.3)",
                boxShadow: isActive ? "0 0 14px rgba(168,85,247,0.9)" : isPast ? "0 0 6px rgba(16,185,129,0.5)" : "none"
              }}
              className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2"
            />
            <p className={`font-bold text-sm ${isActive ? "text-primary" : isPast ? "text-emerald-400" : "text-muted-foreground"}`}>
              {step.label}
            </p>
            <p className="text-xs text-muted-foreground">{isActive ? "Now — live tracking active" : step.time}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function FeatureShowcaseLanding({
  onEnterApp,
  onPostQuest,
}: {
  onEnterApp: () => void;
  onPostQuest: () => void;
}) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">

      {/* Fixed ambient orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[130px]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], x: [0, -25, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[30%] right-[-10%] w-[35%] h-[35%] bg-secondary/15 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute bottom-[-10%] left-[25%] w-[45%] h-[40%] bg-emerald-500/8 rounded-full blur-[150px]"
        />
      </div>

      <div className="relative z-10">

        {/* Nav */}
        <nav className="border-b border-white/5 bg-background/60 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Side Quests
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <a href="#quests" className="hover:text-foreground transition-colors">Quests</a>
              <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
              <a href="#roles" className="hover:text-foreground transition-colors">Roles</a>
              <a href="#trust" className="hover:text-foreground transition-colors">Trust & Safety</a>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="hidden sm:flex text-sm" onClick={onEnterApp}>
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </Button>
              <Button onClick={onEnterApp} className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.7)] hover:scale-105">
                Enter App
              </Button>
            </div>
          </div>
        </nav>

        {/* â”€â”€ HERO â”€â”€ */}
        <section ref={heroRef} className="relative pt-28 pb-10 md:pt-36 md:pb-16 px-4 overflow-hidden min-h-[90vh] flex flex-col justify-center">
          <FloatingParticles />

          {/* Hero background image with parallax */}
          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 pointer-events-none">
            <img
              src={collabMoving}
              alt=""
              className="absolute bottom-0 right-0 w-[55%] max-w-3xl h-auto object-cover opacity-[0.12] blur-[1px] rounded-tl-3xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </motion.div>

          <div className="container mx-auto max-w-6xl relative">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left: copy */}
              <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-7">
                <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary text-sm font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  Live on Solana Devnet
                </motion.div>

                <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.05]">
                  Turn everyday tasks
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary">
                    into quests.
                  </span>
                </motion.h1>

                <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-lg font-medium leading-relaxed">
                  The trust-powered coordination platform for university students.
                  Post tasks, earn crypto, and power your campus economy.
                </motion.p>

                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Button onClick={onPostQuest} size="lg" className="h-14 px-8 text-base bg-primary hover:bg-primary/90 text-white shadow-[0_0_30px_rgba(139,92,246,0.6)] border border-primary/50 transition-all hover:scale-105 hover:shadow-[0_0_45px_rgba(139,92,246,0.7)]">
                    Post Quest <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button onClick={onEnterApp} size="lg" variant="outline" className="h-14 px-8 text-base border-secondary/50 text-secondary hover:bg-secondary/10 transition-all hover:scale-105">
                    Start Earning
                  </Button>
                </motion.div>

                <motion.div variants={fadeUp} className="flex items-center gap-6 pt-4 text-sm text-muted-foreground border-t border-white/5 pt-6">
                  <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /><span><strong className="text-foreground">2,400+</strong> quests</span></div>
                  <div className="flex items-center gap-2"><Users className="w-4 h-4 text-secondary" /><span><strong className="text-foreground">800+</strong> students</span></div>
                  <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-400" /><span><strong className="text-foreground">12</strong> campuses</span></div>
                </motion.div>
              </motion.div>

              {/* Right: floating image cards */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="relative hidden md:flex flex-col gap-4"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
                >
                  <img src={campusFood} alt="Campus food delivery" className="w-full h-56 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-xl border border-orange-500/30 backdrop-blur">
                      <Coffee className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">Food Pickup Quest</p>
                      <p className="text-xs text-white/70">0.12 SOL reward</p>
                    </div>
                    <Badge className="ml-auto bg-emerald-500 text-white text-xs">Live</Badge>
                  </div>
                </motion.div>

                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="relative rounded-2xl overflow-hidden border border-white/10 shadow-xl"
                  >
                    <img src={liftingBoxes} alt="Moving items" className="w-full h-36 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <p className="font-bold text-xs text-white">Moving Items</p>
                      <p className="text-xs text-white/60">0.20 SOL</p>
                    </div>
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="relative rounded-2xl overflow-hidden border border-white/10 shadow-xl"
                  >
                    <img src={medicinePickup} alt="Medicine pickup" className="w-full h-36 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <p className="font-bold text-xs text-white">Medicine Run</p>
                      <p className="text-xs text-white/60">0.15 SOL</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* â”€â”€ IMAGE MARQUEE STRIP â”€â”€ */}
        <div className="py-8 border-y border-white/5 overflow-hidden bg-black/30">
          <div className="flex gap-4" style={{ animation: "marquee 28s linear infinite" }}>
            {[...marqueeImages, ...marqueeImages].map((img, i) => (
              <div key={i} className="flex-none w-56 h-36 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                <img src={img} alt="" className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity duration-500 hover:scale-105 transition-transform" />
              </div>
            ))}
          </div>
        </div>

        {/* â”€â”€ APP IN ACTION (image bento) â”€â”€ */}
        <section className="py-28 px-4">
          <div className="container mx-auto max-w-6xl">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="text-center mb-16">
              <motion.div variants={fadeUp}>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 mb-4 text-sm px-4 py-1">Real Campus. Real Tasks.</Badge>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-black tracking-tighter mb-5">
                The campus economy,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">activated.</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-xl text-muted-foreground max-w-2xl mx-auto">
                From food runs to medical errands to moving boxes â€” Side Quests powers the help students already give each other, but with trust, safety, and instant crypto payouts.
              </motion.p>
            </motion.div>

            {/* Bento grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

              {/* Large: collab */}
              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}
                className="md:col-span-7 relative rounded-3xl overflow-hidden group cursor-pointer"
                style={{ minHeight: "360px" }}
              >
                <img src={collabMoving} alt="Students collaborating" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 p-8">
                  <Badge className="bg-violet-500/90 text-white mb-3">Teamwork Quests</Badge>
                  <h3 className="text-2xl font-black text-white mb-2">Students helping students</h3>
                  <p className="text-white/70 text-sm max-w-xs">Two students, one quest. Workers earn. Taskers get their stuff done. Everyone wins.</p>
                </div>
              </motion.div>

              {/* Right column: food + medicine */}
              <div className="md:col-span-5 flex flex-col gap-5">
                <motion.div
                  initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}
                  transition={{ delay: 0.1 }}
                  className="relative rounded-3xl overflow-hidden group cursor-pointer flex-1"
                  style={{ minHeight: "170px" }}
                >
                  <img src={campusFood} alt="Campus food" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 p-5">
                    <Badge className="bg-orange-500/90 text-white mb-2 text-xs">Food & Drinks</Badge>
                    <h4 className="font-black text-white">Campus food runs</h4>
                    <p className="text-white/60 text-xs">Cafeteria, vending, and campus eats.</p>
                  </div>
                </motion.div>

                <motion.div
                  initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}
                  transition={{ delay: 0.2 }}
                  className="relative rounded-3xl overflow-hidden group cursor-pointer flex-1"
                  style={{ minHeight: "170px" }}
                >
                  <img src={medicinePickup} alt="Medicine pickup" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 p-5">
                    <Badge className="bg-amber-500/90 text-white mb-2 text-xs">Medicine</Badge>
                    <h4 className="font-black text-white">OTC medicine runs</h4>
                    <p className="text-white/60 text-xs">Campus pharmacy, verified and safe.</p>
                  </div>
                </motion.div>
              </div>

              {/* Bottom row: boxes + quest items + students */}
              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}
                transition={{ delay: 0.15 }}
                className="md:col-span-4 relative rounded-3xl overflow-hidden group cursor-pointer"
                style={{ minHeight: "230px" }}
              >
                <img src={liftingBoxes} alt="Lifting boxes" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 p-5">
                  <Badge className="bg-cyan-500/90 text-white mb-2 text-xs">Moving & Delivery</Badge>
                  <h4 className="font-bold text-white">Boxes, books, luggage</h4>
                  <p className="text-white/60 text-xs">Between dorms, libraries, and labs.</p>
                </div>
              </motion.div>

              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}
                transition={{ delay: 0.25 }}
                className="md:col-span-4 relative rounded-3xl overflow-hidden group cursor-pointer"
                style={{ minHeight: "230px" }}
              >
                <img src={questItems} alt="Quest items" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 p-5">
                  <Badge className="bg-primary/90 text-white mb-2 text-xs">All Categories</Badge>
                  <h4 className="font-bold text-white">Any campus errand</h4>
                  <p className="text-white/60 text-xs">Chargers, prints, snacks, and more.</p>
                </div>
              </motion.div>

              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}
                transition={{ delay: 0.3 }}
                className="md:col-span-4 relative rounded-3xl overflow-hidden group cursor-pointer"
                style={{ minHeight: "230px" }}
              >
                <img src={studentsApp} alt="Students using app" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 p-5">
                  <Badge className="bg-emerald-500/90 text-white mb-2 text-xs">Digital + Online</Badge>
                  <h4 className="font-bold text-white">Global micro-tasks</h4>
                  <p className="text-white/60 text-xs">Essays, code, design â€” online quests worldwide.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* â”€â”€ LIVE QUESTS GRID â”€â”€ */}
        <section id="quests" className="py-24 px-4 bg-black/40 border-y border-white/5">
          <div className="container mx-auto">
            <div className="flex items-end justify-between mb-12">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <h2 className="text-3xl md:text-4xl font-black mb-2">Live Quests</h2>
                <p className="text-muted-foreground">Real tasks happening right now on campus.</p>
              </motion.div>
              <Button variant="ghost" className="hidden sm:flex text-primary hover:text-primary/80 hover:bg-primary/10">
                View All <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {quests.map((quest, i) => (
                <motion.div key={i} variants={scaleIn} whileHover={{ y: -6, transition: { duration: 0.2 } }}>
                  <Card className={`bg-card/40 backdrop-blur-md border-white/10 ${quest.borderColor} transition-all duration-300 group overflow-hidden relative h-full flex flex-col`}
                    style={{ boxShadow: `0 0 0 0 ${quest.glowColor}` }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 40px ${quest.glowColor}`; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                  >
                    {/* Image thumbnail */}
                    <div className="relative h-40 overflow-hidden">
                      <img src={quest.img} alt={quest.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80" />
                      <div className={`absolute inset-0 bg-gradient-to-b ${quest.color} mix-blend-multiply`} />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/90" />
                      <div className="absolute top-3 right-3">
                        <Badge variant="outline" className="bg-background/70 backdrop-blur text-xs font-bold border-primary/30 text-primary">
                          {quest.reward}
                        </Badge>
                      </div>
                      <div className="absolute top-3 left-3 p-2.5 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 group-hover:scale-110 transition-transform">
                        {quest.icon}
                      </div>
                    </div>

                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-base leading-snug">{quest.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-2 pb-3">
                      <div className="flex items-center text-xs text-muted-foreground"><MapPin className="w-3.5 h-3.5 mr-1.5" /> {quest.location}</div>
                      <div className="flex items-center text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5 mr-1.5" /> {quest.urgency} Urgency</div>
                      <div className="flex items-center text-xs text-emerald-400"><ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> {quest.trust}</div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button onClick={onEnterApp} className="w-full bg-white/5 hover:bg-primary hover:text-white border border-white/10 transition-all text-sm h-9">
                        Enter App
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* â”€â”€ HOW IT WORKS (with bg image) â”€â”€ */}
        <section id="how-it-works" className="py-28 px-4 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <img src={liftingBoxes} alt="" className="w-full h-full object-cover opacity-[0.06]" />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
          </div>
          <div className="container mx-auto max-w-5xl relative">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="text-center mb-16">
              <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black tracking-tighter mb-4">How It Works</motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">From needing a favor to completing a quest â€” seamless and secure in three steps.</motion.p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-12 left-[18%] right-[18%] h-0.5 bg-gradient-to-r from-primary/0 via-primary/60 to-primary/0" />
              {[
                { n: "1", color: "primary", label: "Post a Quest", desc: "Describe the task, set a location, and fund escrow with SOL. Your funds are locked safely.", border: "border-primary/30", shadow: "shadow-[0_0_20px_rgba(139,92,246,0.3)]", text: "text-primary" },
                { n: "2", color: "secondary", label: "Worker Accepts", desc: "A verified student accepts your quest. Track live progress until completion.", border: "border-secondary/30", shadow: "shadow-[0_0_20px_rgba(6,182,212,0.3)]", text: "text-secondary" },
                { n: "3", color: "emerald", label: "Quest Complete", desc: "Task done, proof verified, SOL instantly unlocked to the worker's wallet.", border: "border-emerald-500/30", shadow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]", text: "text-emerald-400" },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                  transition={{ delay: i * 0.15 }}
                  className="relative z-10 bg-card/50 backdrop-blur-sm border border-white/5 p-8 rounded-2xl text-center hover:border-white/10 transition-colors"
                >
                  <div className={`w-16 h-16 bg-background border ${step.border} rounded-2xl mx-auto flex items-center justify-center text-2xl font-black ${step.text} ${step.shadow} mb-6`}>{step.n}</div>
                  <h3 className="text-xl font-bold mb-3">{step.label}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* â”€â”€ LIVE TRACKING (with bg image) â”€â”€ */}
        <section className="py-24 px-4 relative overflow-hidden border-y border-white/5">
          <div className="absolute inset-0 pointer-events-none">
            <img src={studentsApp} alt="" className="w-full h-full object-cover opacity-[0.07]" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
          </div>

          <div className="container mx-auto max-w-6xl relative">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
                <motion.div variants={fadeUp}>
                  <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 mb-6">Live Tracking Demo</Badge>
                </motion.div>
                <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-black tracking-tighter mb-6">
                  Track every step,<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">in real-time.</span>
                </motion.h2>
                <motion.p variants={fadeUp} className="text-muted-foreground text-lg mb-8">
                  Full visibility from acceptance to delivery. Live GPS, encrypted chat, and proof upload before any funds move.
                </motion.p>
                <motion.ul variants={staggerContainer} className="space-y-3">
                  {["End-to-end encrypted chat", "GPS location sharing", "Photo proof submission", "Instant SOL payout on confirm"].map((item, i) => (
                    <motion.li key={i} variants={fadeUp} className="flex items-center font-medium">
                      <CheckCircle2 className="w-5 h-5 text-primary mr-3 flex-shrink-0" /> {item}
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-secondary/25 to-primary/25 rounded-3xl blur-2xl" />
                <Card className="relative bg-background/80 backdrop-blur border-white/10 shadow-2xl overflow-hidden">
                  <div className="p-6 border-b border-white/5 bg-white/5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="border-2 border-cyan-500/40">
                            <AvatarFallback className="bg-cyan-500/20 text-cyan-400 font-bold">AK</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">Alex K. is on the way</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400 fill-current" /> 4.9 Trust Score Â· UNILAG Verified
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500 text-white animate-pulse text-xs">â— Live</Badge>
                    </div>
                  </div>
                  <div className="p-8">
                    <AnimatedProgressTracker />
                  </div>
                  <div className="px-6 pb-6">
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Navigation className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium">Arriving at Dorm C reception</p>
                        <p className="text-xs text-muted-foreground">ETA ~4 minutes</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* â”€â”€ CAMPUS MAP â”€â”€ */}
        <CampusMap />

        {/* â”€â”€ ROLES â”€â”€ */}
        <section id="roles" className="py-32 px-4">
          <div className="container mx-auto max-w-6xl">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="text-center mb-16">
              <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black tracking-tighter mb-5">Choose Your Path</motion.h2>
              <motion.p variants={fadeUp} className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Three roles, one ecosystem. Switch fluidly based on what you need today.
              </motion.p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { color: "violet", icon: <Activity className="w-7 h-7" />, title: "Taskers", subtitle: '"I need something done"', desc: "Post quests, escrow funds securely, and get things delivered or completed when you're busy.", cta: "Post a Quest", img: studentsApp },
                { color: "cyan", icon: <Wallet className="w-7 h-7" />, title: "Workers", subtitle: '"I complete quests for rewards"', desc: "Pick up tasks on your route, earn SOL instantly, and build your immutable trust score.", cta: "Find Quests", img: collabMoving },
                { color: "emerald", icon: <ShieldCheck className="w-7 h-7" />, title: "Mediators", subtitle: '"I keep quests fair"', desc: "Resolve disputes, earn fees, and maintain the integrity of the platform for everyone.", cta: "Become a Mediator", img: liftingBoxes },
              ].map((role, i) => (
                <motion.div
                  key={i}
                  initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.25 } }}
                  className={`relative rounded-3xl overflow-hidden border border-white/5 hover:border-${role.color}-500/50 transition-all duration-300 group`}
                >
                  <div className="relative h-44 overflow-hidden">
                    <img src={role.img} alt={role.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-50" />
                    <div className={`absolute inset-0 bg-gradient-to-b from-${role.color}-500/30 to-black/80`} />
                    <div className={`absolute top-5 left-5 w-12 h-12 bg-${role.color}-500/30 border border-${role.color}-500/40 text-${role.color}-400 rounded-2xl flex items-center justify-center`}>
                      {role.icon}
                    </div>
                  </div>
                  <div className="p-7 bg-card/50 backdrop-blur">
                    <h3 className="text-2xl font-black mb-1">{role.title}</h3>
                    <p className={`text-${role.color}-300 font-semibold text-sm mb-4`}>{role.subtitle}</p>
                    <p className="text-muted-foreground mb-7 text-sm leading-relaxed">{role.desc}</p>
                    <Button onClick={role.title === "Taskers" ? onPostQuest : onEnterApp} variant="outline" className={`w-full border-${role.color}-500/30 text-${role.color}-400 hover:bg-${role.color}-500/10 transition-colors`}>
                      {role.title === "Taskers" ? "Post Quest" : "Enter App"}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* â”€â”€ PROFILES â”€â”€ */}
        <section className="py-24 px-4 bg-black/50">
          <div className="container mx-auto max-w-6xl">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="mb-12">
              <motion.h2 variants={fadeUp} className="text-3xl font-black mb-2">Top Performers</motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground">The most trusted students powering the campus economy.</motion.p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {profiles.map((profile, i) => (
                <motion.div key={i} variants={scaleIn} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                  <Card className="bg-card/20 border-white/5 hover:border-white/15 transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <Avatar className={`w-20 h-20 mx-auto mb-4 border-2 ${profile.color.split(" ")[2] || "border-white/10"}`}>
                        <AvatarFallback className={`${profile.color.split(" ").slice(0,2).join(" ")} text-xl font-black`}>{profile.initials}</AvatarFallback>
                      </Avatar>
                      <h4 className="font-black text-lg">{profile.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{profile.uni}</p>
                      <Badge variant="outline" className="mb-4 bg-white/5 text-xs">{profile.role}</Badge>
                      <div className="flex justify-between items-center text-sm pt-4 border-t border-white/5">
                        <div className="flex items-center text-amber-400 font-bold"><Star className="w-4 h-4 mr-1 fill-current" /> {profile.score}</div>
                        <div className="text-muted-foreground text-xs">{profile.quests} quests</div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* â”€â”€ TRUST SCORE â”€â”€ */}
        <TrustScore />

        {/* â”€â”€ TRUST & SAFETY â”€â”€ */}
        <section id="trust" className="py-28 px-4 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/8 rounded-full blur-[120px]" />
          </div>
          <div className="container mx-auto max-w-5xl relative">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="text-center mb-16">
              <motion.div variants={fadeUp}>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 mb-4">Safety First</Badge>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-black tracking-tighter mb-4">Trust is our currency.</motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">Every transaction, delivery, and task is backed by verification, escrow, and community oversight.</motion.p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid md:grid-cols-2 gap-5">
              {[
                { icon: <Lock className="w-6 h-6" />, color: "text-primary bg-primary/10", title: "Escrow Payments", desc: "Funds locked in smart contract. Workers know they'll get paid. Taskers know it'll get done." },
                { icon: <ShieldCheck className="w-6 h-6" />, color: "text-emerald-400 bg-emerald-500/10", title: ".edu Verification", desc: "Only verified university students can join and accept physical campus quests." },
                { icon: <Navigation className="w-6 h-6" />, color: "text-secondary bg-secondary/10", title: "Safe Handoff Zones", desc: "Well-lit, public campus locations recommended for every physical handoff." },
                { icon: <LifeBuoy className="w-6 h-6" />, color: "text-red-400 bg-red-500/10", title: "Community Mediators", desc: "High-trust student mediators resolve disputes fairly and earn platform fees for doing so." },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp} whileHover={{ x: 4, transition: { duration: 0.2 } }} className="bg-card/30 border border-white/5 hover:border-white/10 p-6 rounded-2xl flex gap-4 items-start transition-all">
                  <div className={`p-3 ${item.color} rounded-xl flex-shrink-0`}>{item.icon}</div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* â”€â”€ FAQ â”€â”€ */}
        <FAQ />

        {/* â”€â”€ TESTIMONIALS â”€â”€ */}
        <section className="py-24 px-4 bg-black/40 border-y border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <img src={collabMoving} alt="" className="w-full h-full object-cover opacity-[0.04]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/60" />
          </div>
          <div className="container mx-auto max-w-6xl relative">
            <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-3xl md:text-4xl font-black text-center mb-14">
              Word on Campus
            </motion.h2>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid md:grid-cols-3 gap-7">
              {testimonials.map((t, i) => (
                <motion.div key={i} variants={scaleIn} whileHover={{ y: -6, transition: { duration: 0.2 } }}>
                  <Card className="bg-background/40 backdrop-blur border-white/5 hover:border-white/10 transition-all h-full">
                    <CardContent className="p-7 flex flex-col h-full">
                      <div className="flex text-amber-400 mb-5">
                        {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                      </div>
                      <p className="text-base italic mb-7 flex-1 leading-relaxed text-foreground/90">&ldquo;{t.text}&rdquo;</p>
                      <div className="flex items-center gap-3 border-t border-white/5 pt-5">
                        <Avatar className="w-10 h-10 border border-primary/30">
                          <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">{t.author.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm">{t.author}</p>
                          <p className="text-xs text-muted-foreground">{t.role} Â· {t.uni}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* â”€â”€ FOOTER CTA (with background image) â”€â”€ */}
        <section className="py-36 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <img src={collabMoving} alt="" className="w-full h-full object-cover opacity-[0.09]" />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/15 rounded-full blur-[140px] pointer-events-none" />

          <div className="container mx-auto max-w-3xl relative">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-semibold mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                Accepting early access sign-ups
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-5xl md:text-7xl font-black mb-6 tracking-tighter">
                Ready to start your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary">first quest?</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-xl text-muted-foreground mb-12">
                Join thousands of students turning free time into crypto.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-center gap-4">
                <Button onClick={onPostQuest} size="lg" className="h-14 px-10 text-lg bg-primary hover:bg-primary/90 text-white shadow-[0_0_40px_rgba(139,92,246,0.6)] transition-all hover:scale-105 hover:shadow-[0_0_55px_rgba(139,92,246,0.8)]">
                  Post Quest <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button onClick={onEnterApp} size="lg" variant="outline" className="h-14 px-10 text-lg border-secondary/50 text-secondary hover:bg-secondary/10 transition-all hover:scale-105">
                  Enter App
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* â”€â”€ FOOTER â”€â”€ */}
        <footer className="border-t border-white/10 bg-black/60 backdrop-blur py-14 px-4">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-10">
              <div className="flex items-center gap-2">
                <Zap className="w-8 h-8 text-primary" />
                <span className="font-black text-2xl tracking-tight text-white">Side Quests</span>
              </div>
              <div className="flex gap-8 text-sm text-muted-foreground font-medium">
                <a href="#" className="hover:text-white transition-colors">About</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Contact</a>
              </div>
            </div>
            <div className="text-center text-muted-foreground text-sm border-t border-white/5 pt-8">
              <p className="font-medium">Turn everyday tasks into quests.</p>
              <p className="mt-2 text-xs">&copy; {new Date().getFullYear()} Side Quests. All rights reserved. Powered by Solana.</p>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}


