"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Award,
  Bell,
  Briefcase,
  Building2,
  CheckCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  Info,
  MapPin,
  Menu,
  Package,
  ReceiptText,
  Scale,
  Search,
  Send,
  Settings,
  Shield,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  UserCircle,
  Users,
  Wallet,
  X,
  XCircle,
  Zap,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type UserRole = "tasker" | "worker" | "vendor" | "mediator" | "admin";
type QuestType = "online" | "physical" | "vendor";
type QuestCategory =
  | "design"
  | "development"
  | "writing"
  | "delivery"
  | "shopping"
  | "printing"
  | "medicine"
  | "transport"
  | "other";
type QuestStatus =
  | "open"
  | "accepted"
  | "in-progress"
  | "awaiting-confirmation"
  | "completed"
  | "disputed";
type DashboardTab = "online" | "physical" | "vendor" | "my-quests" | "disputes";
type DisputeStatus = "pending" | "recommended" | "finalized";

interface Receipt {
  id: string;
  vendor: string;
  wallet: string;
  amount: number;
  items: string[];
  issuedAt: string;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  type: QuestType;
  reward: number;
  itemFunds: number;
  vendorName?: string;
  vendorWallet?: string;
  itemList: string[];
  location?: string;
  campus?: string;
  safeHandoffPoint?: string;
  deadline: string;
  status: QuestStatus;
  urgency: "low" | "medium" | "high";
  verified: boolean;
  tasker: string;
  worker?: string;
  createdAt: string;
  proofText?: string;
  deliveryProof?: string;
  liveTracking: "inactive" | "active" | "completed";
  itemsPicked: boolean;
  vendorConfirmed: boolean;
  receipt?: Receipt;
  escrowLocked: boolean;
  vendorPaidAmount: number;
  workerRewardReleased: boolean;
  reimbursementEnabled: boolean;
}

interface Dispute {
  id: string;
  questId: string;
  questTitle: string;
  taskerName: string;
  workerName: string;
  reason: string;
  evidence: string[];
  status: DisputeStatus;
  recommendation?: string;
  verdict?: string;
  createdAt: string;
}

interface WalletState {
  taskerBalance: number;
  workerBalance: number;
  vendorBalance: number;
  mediatorBalance: number;
}

interface QuestFormState {
  type: QuestType;
  title: string;
  description: string;
  category: QuestCategory;
  reward: string;
  itemFunds: string;
  deadline: string;
  campus: string;
  safeHandoffPoint: string;
  vendorName: string;
  itemList: string;
  reimbursementEnabled: boolean;
}

const QUESTS_STORAGE_KEY = "side-quests.phase2.quests";
const DISPUTES_STORAGE_KEY = "side-quests.phase2.disputes";
const WALLET_STORAGE_KEY = "side-quests.phase2.wallet";

const roleLabels: Record<UserRole, string> = {
  tasker: "Tasker",
  worker: "Worker",
  vendor: "Vendor",
  mediator: "Mediator",
  admin: "Admin",
};

const statusLabels: Record<QuestStatus, string> = {
  open: "Open",
  accepted: "Accepted",
  "in-progress": "In Progress",
  "awaiting-confirmation": "Awaiting Confirmation",
  completed: "Completed",
  disputed: "Disputed",
};

const defaultWallet: WalletState = {
  taskerBalance: 620,
  workerBalance: 85,
  vendorBalance: 240,
  mediatorBalance: 40,
};

const defaultQuestForm: QuestFormState = {
  type: "online",
  title: "",
  description: "",
  category: "design",
  reward: "25",
  itemFunds: "0",
  deadline: "2026-05-15",
  campus: "UNILAG Main Campus",
  safeHandoffPoint: "Main Library reception",
  vendorName: "Campus Mart",
  itemList: "",
  reimbursementEnabled: false,
};

const demoQuests: Quest[] = [
  {
    id: "quest-online-pitch",
    title: "Help me design a pitch deck",
    description:
      "Need a polished 12-slide investor deck with a clean Solana/startup feel and editable source files.",
    category: "design",
    type: "online",
    reward: 50,
    itemFunds: 0,
    itemList: [],
    deadline: "2026-05-15",
    status: "open",
    urgency: "high",
    verified: true,
    tasker: "You",
    createdAt: "2026-05-10",
    liveTracking: "inactive",
    itemsPicked: false,
    vendorConfirmed: false,
    escrowLocked: true,
    vendorPaidAmount: 0,
    workerRewardReleased: false,
    reimbursementEnabled: false,
  },
  {
    id: "quest-campus-book",
    title: "Bring my book from Dorm 9 to the library",
    description:
      "Left my textbook in Dorm 9, Room 305. Deliver to the main library reception desk.",
    category: "delivery",
    type: "physical",
    reward: 5,
    itemFunds: 0,
    itemList: [],
    location: "University of Lagos",
    campus: "UNILAG Main Campus",
    safeHandoffPoint: "Main Library reception",
    deadline: "2026-05-12",
    status: "open",
    urgency: "medium",
    verified: true,
    tasker: "Mike Johnson",
    createdAt: "2026-05-10",
    liveTracking: "inactive",
    itemsPicked: false,
    vendorConfirmed: false,
    escrowLocked: true,
    vendorPaidAmount: 0,
    workerRewardReleased: false,
    reimbursementEnabled: false,
  },
  {
    id: "quest-vendor-groceries",
    title: "Campus Mart groceries with substitutions",
    description:
      "Pick items from Campus Mart. Side Quests pays vendor wallet directly after checkout verification.",
    category: "shopping",
    type: "vendor",
    reward: 12,
    itemFunds: 38,
    vendorName: "Campus Mart",
    vendorWallet: "vendor_campus_mart.sol",
    itemList: ["Bread", "Milk", "Apples", "Groundnut"],
    location: "LASU",
    campus: "LASU Main Campus",
    safeHandoffPoint: "Student center security desk",
    deadline: "2026-05-13",
    status: "open",
    urgency: "medium",
    verified: true,
    tasker: "You",
    createdAt: "2026-05-10",
    liveTracking: "inactive",
    itemsPicked: false,
    vendorConfirmed: false,
    escrowLocked: true,
    vendorPaidAmount: 0,
    workerRewardReleased: false,
    reimbursementEnabled: false,
  },
  {
    id: "quest-otc-medicine",
    title: "Get OTC medicine from campus pharmacy",
    description:
      "Pick up approved OTC pain relief from the verified campus pharmacy. No prescription medication.",
    category: "medicine",
    type: "physical",
    reward: 9,
    itemFunds: 8,
    vendorName: "Campus Pharmacy",
    vendorWallet: "vendor_pharmacy.sol",
    itemList: ["OTC pain relief", "Vitamin C sachet"],
    location: "Covenant University",
    campus: "Covenant Main Campus",
    safeHandoffPoint: "Health center entrance",
    deadline: "2026-05-14",
    status: "open",
    urgency: "high",
    verified: true,
    tasker: "Aisha Bello",
    createdAt: "2026-05-10",
    liveTracking: "inactive",
    itemsPicked: false,
    vendorConfirmed: false,
    escrowLocked: true,
    vendorPaidAmount: 0,
    workerRewardReleased: false,
    reimbursementEnabled: false,
  },
  {
    id: "quest-campus-transport",
    title: "Campus transport from Engineering to hostel gate",
    description:
      "Need verified campus-only transport from Engineering block to the hostel gate safe zone.",
    category: "transport",
    type: "physical",
    reward: 15,
    itemFunds: 0,
    itemList: [],
    location: "University of Ibadan",
    campus: "UI Main Campus",
    safeHandoffPoint: "Hostel gate security post",
    deadline: "2026-05-14",
    status: "open",
    urgency: "medium",
    verified: true,
    tasker: "Tomi Adeyemi",
    createdAt: "2026-05-10",
    liveTracking: "inactive",
    itemsPicked: false,
    vendorConfirmed: false,
    escrowLocked: true,
    vendorPaidAmount: 0,
    workerRewardReleased: false,
    reimbursementEnabled: false,
  },
];

const demoDisputes: Dispute[] = [];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemFadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function currency(value: number) {
  return `$${value.toFixed(2)}`;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function splitItems(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getCategoryIcon(category: QuestCategory) {
  switch (category) {
    case "design":
      return <Sparkles className="h-4 w-4" />;
    case "development":
      return <Zap className="h-4 w-4" />;
    case "writing":
      return <FileText className="h-4 w-4" />;
    case "delivery":
      return <Package className="h-4 w-4" />;
    case "shopping":
      return <ShoppingBag className="h-4 w-4" />;
    case "printing":
      return <FileText className="h-4 w-4" />;
    case "medicine":
      return <ShieldAlert className="h-4 w-4" />;
    case "transport":
      return <MapPin className="h-4 w-4" />;
    default:
      return <Target className="h-4 w-4" />;
  }
}

function statusClass(status: QuestStatus) {
  switch (status) {
    case "open":
      return "border-cyan-500/25 bg-cyan-500/12 text-cyan-200";
    case "accepted":
      return "border-violet-500/25 bg-violet-500/12 text-violet-200";
    case "in-progress":
      return "border-amber-500/25 bg-amber-500/12 text-amber-200";
    case "awaiting-confirmation":
      return "border-blue-500/25 bg-blue-500/12 text-blue-200";
    case "completed":
      return "border-emerald-500/25 bg-emerald-500/12 text-emerald-200";
    case "disputed":
      return "border-rose-500/25 bg-rose-500/12 text-rose-200";
  }
}

function urgencyClass(urgency: Quest["urgency"]) {
  switch (urgency) {
    case "high":
      return "border-rose-500/20 bg-rose-500/12 text-rose-300";
    case "medium":
      return "border-amber-500/20 bg-amber-500/12 text-amber-300";
    default:
      return "border-emerald-500/20 bg-emerald-500/12 text-emerald-300";
  }
}

export default function Page() {
  return <SideQuestsApp />;
}

function SideQuestsApp() {
  const [currentView, setCurrentView] = useState<"landing" | "app">("landing");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("tasker");
  const [selectedTab, setSelectedTab] = useState<DashboardTab>("online");
  const [showBalance, setShowBalance] = useState(true);
  const [isPostQuestOpen, setIsPostQuestOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [quests, setQuests] = useState<Quest[]>(() =>
    readStorage(QUESTS_STORAGE_KEY, demoQuests),
  );
  const [disputes, setDisputes] = useState<Dispute[]>(() =>
    readStorage(DISPUTES_STORAGE_KEY, demoDisputes),
  );
  const [wallet, setWallet] = useState<WalletState>(() =>
    readStorage(WALLET_STORAGE_KEY, defaultWallet),
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(QUESTS_STORAGE_KEY, JSON.stringify(quests));
  }, [quests]);

  useEffect(() => {
    window.localStorage.setItem(DISPUTES_STORAGE_KEY, JSON.stringify(disputes));
  }, [disputes]);

  useEffect(() => {
    window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
  }, [wallet]);

  const escrowLocked = useMemo(
    () =>
      quests
        .filter((quest) => quest.escrowLocked && quest.status !== "completed")
        .reduce((sum, quest) => sum + quest.reward + quest.itemFunds, 0),
    [quests],
  );

  const vendorPaid = useMemo(
    () => quests.reduce((sum, quest) => sum + quest.vendorPaidAmount, 0),
    [quests],
  );

  const workerReleased = useMemo(
    () =>
      quests
        .filter((quest) => quest.workerRewardReleased)
        .reduce((sum, quest) => sum + quest.reward, 0),
    [quests],
  );

  function updateQuest(id: string, updater: (quest: Quest) => Quest) {
    setQuests((current) =>
      current.map((quest) => (quest.id === id ? updater(quest) : quest)),
    );
  }

  function createQuest(form: QuestFormState) {
    const reward = Number(form.reward) || 0;
    const itemFunds = form.type === "vendor" ? Number(form.itemFunds) || 0 : 0;
    const quest: Quest = {
      id: makeId("quest"),
      title: form.title.trim() || "Untitled quest",
      description: form.description.trim() || "No description provided yet.",
      category: form.category,
      type: form.type,
      reward,
      itemFunds,
      vendorName: form.type === "vendor" ? form.vendorName || "Campus Mart" : undefined,
      vendorWallet:
        form.type === "vendor"
          ? `vendor_${(form.vendorName || "campus_mart")
              .toLowerCase()
              .replace(/\W+/g, "_")}.sol`
          : undefined,
      itemList: form.type === "vendor" ? splitItems(form.itemList) : [],
      location: form.type === "online" ? undefined : form.campus,
      campus: form.type === "online" ? undefined : form.campus,
      safeHandoffPoint:
        form.type === "online" ? undefined : form.safeHandoffPoint || "Campus safe handoff point",
      deadline: form.deadline || "2026-05-20",
      status: "open",
      urgency: "medium",
      verified: form.type !== "online",
      tasker: "You",
      createdAt: new Date().toISOString().slice(0, 10),
      liveTracking: "inactive",
      itemsPicked: false,
      vendorConfirmed: false,
      escrowLocked: true,
      vendorPaidAmount: 0,
      workerRewardReleased: false,
      reimbursementEnabled: form.reimbursementEnabled,
    };

    setQuests((current) => [quest, ...current]);
    setWallet((current) => ({
      ...current,
      taskerBalance: Math.max(0, current.taskerBalance - reward - itemFunds),
    }));
    setSelectedTab(form.type === "online" ? "online" : form.type === "physical" ? "physical" : "vendor");
    setCurrentView("app");
  }

  function acceptQuest(id: string) {
    updateQuest(id, (quest) => ({
      ...quest,
      status: "accepted",
      worker: "You",
    }));
  }

  function startQuest(id: string) {
    updateQuest(id, (quest) => ({
      ...quest,
      status: "in-progress",
      liveTracking: quest.type === "physical" || quest.type === "vendor" ? "active" : quest.liveTracking,
    }));
  }

  function submitProof(id: string, proof: string) {
    updateQuest(id, (quest) => ({
      ...quest,
      proofText: proof || "Mock proof submitted.",
      deliveryProof: quest.type === "online" ? quest.deliveryProof : proof || "Delivery photo uploaded.",
      status: "awaiting-confirmation",
      liveTracking: quest.liveTracking === "active" ? "completed" : quest.liveTracking,
    }));
  }

  function markItemsPicked(id: string) {
    updateQuest(id, (quest) => ({
      ...quest,
      itemsPicked: true,
      status: "in-progress",
      liveTracking: quest.type === "vendor" ? "active" : quest.liveTracking,
    }));
  }

  function vendorConfirm(id: string) {
    const itemFunds = quests.find((quest) => quest.id === id)?.itemFunds ?? 0;
    updateQuest(id, (quest) => {
      const receipt: Receipt = {
        id: makeId("receipt"),
        vendor: quest.vendorName || "Verified vendor",
        wallet: quest.vendorWallet || "vendor_wallet.sol",
        amount: quest.itemFunds,
        items: quest.itemList,
        issuedAt: new Date().toLocaleString(),
      };
      return {
        ...quest,
        vendorConfirmed: true,
        vendorPaidAmount: quest.itemFunds,
        receipt,
      };
    });
    setWallet((current) => ({
      ...current,
      vendorBalance: current.vendorBalance + itemFunds,
    }));
  }

  function confirmCompletion(id: string) {
    updateQuest(id, (quest) => ({
      ...quest,
      status: "completed",
      liveTracking: quest.liveTracking === "active" ? "completed" : quest.liveTracking,
    }));
  }

  function releasePayout(id: string) {
    const quest = quests.find((item) => item.id === id);
    if (!quest || quest.workerRewardReleased) return;
    updateQuest(id, (item) => ({
      ...item,
      workerRewardReleased: true,
      escrowLocked: false,
    }));
    setWallet((current) => ({
      ...current,
      workerBalance: current.workerBalance + quest.reward,
    }));
  }

  function openDispute(id: string, reason = "Manual dispute opened from demo UI.") {
    const quest = quests.find((item) => item.id === id);
    if (!quest) return;
    if (!disputes.some((dispute) => dispute.questId === id && dispute.status !== "finalized")) {
      const dispute: Dispute = {
        id: makeId("dispute"),
        questId: quest.id,
        questTitle: quest.title,
        taskerName: quest.tasker,
        workerName: quest.worker || "Unassigned worker",
        reason,
        evidence: [
          quest.proofText || "No proof submitted yet",
          quest.receipt ? `Receipt ${quest.receipt.id}` : "No receipt",
          quest.deliveryProof || "No delivery proof",
        ],
        status: "pending",
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setDisputes((current) => [dispute, ...current]);
    }
    updateQuest(id, (questItem) => ({ ...questItem, status: "disputed" }));
    setSelectedTab("disputes");
  }

  function recommendDispute(id: string) {
    setDisputes((current) =>
      current.map((dispute) =>
        dispute.id === id
          ? {
              ...dispute,
              status: "recommended",
              recommendation:
                "Mediator recommends partial release based on proof, receipt, and chat evidence.",
            }
          : dispute,
      ),
    );
    setWallet((current) => ({
      ...current,
      mediatorBalance: current.mediatorBalance + 2,
    }));
  }

  function finalizeDispute(id: string, verdict: string) {
    const dispute = disputes.find((item) => item.id === id);
    if (!dispute) return;
    setDisputes((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "finalized",
              verdict,
            }
          : item,
      ),
    );
    updateQuest(dispute.questId, (quest) => ({
      ...quest,
      status: "completed",
      workerRewardReleased: verdict.includes("worker"),
      escrowLocked: false,
    }));
  }

  const actions = {
    acceptQuest,
    startQuest,
    submitProof,
    markItemsPicked,
    vendorConfirm,
    confirmCompletion,
    releasePayout,
    openDispute,
    recommendDispute,
    finalizeDispute,
  };

  return currentView === "landing" ? (
    <LandingPage
      isMenuOpen={isMenuOpen}
      scrolled={scrolled}
      setCurrentView={setCurrentView}
      setIsMenuOpen={setIsMenuOpen}
      setIsPostQuestOpen={setIsPostQuestOpen}
      stats={{ active: quests.length, completed: quests.filter((quest) => quest.status === "completed").length }}
    />
  ) : (
    <AppDashboard
      actions={actions}
      disputes={disputes}
      escrowLocked={escrowLocked}
      isPostQuestOpen={isPostQuestOpen}
      quests={quests}
      selectedTab={selectedTab}
      setCurrentView={setCurrentView}
      setIsPostQuestOpen={setIsPostQuestOpen}
      setSelectedTab={setSelectedTab}
      setShowBalance={setShowBalance}
      setUserRole={setUserRole}
      showBalance={showBalance}
      userRole={userRole}
      vendorPaid={vendorPaid}
      wallet={wallet}
      workerReleased={workerReleased}
      onCreateQuest={createQuest}
    />
  );
}

function LandingPage({
  isMenuOpen,
  scrolled,
  setCurrentView,
  setIsMenuOpen,
  setIsPostQuestOpen,
  stats,
}: {
  isMenuOpen: boolean;
  scrolled: boolean;
  setCurrentView: (view: "landing" | "app") => void;
  setIsMenuOpen: (open: boolean) => void;
  setIsPostQuestOpen: (open: boolean) => void;
  stats: { active: number; completed: number };
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,rgba(124,58,237,0.22),transparent_28%),radial-gradient(circle_at_80%_5%,rgba(34,211,238,0.16),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background)))]">
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/65 ${
          scrolled ? "shadow-md shadow-black/20" : ""
        }`}
      >
        <div className="container flex h-16 max-w-7xl items-center justify-between">
          <Brand />
          <nav className="hidden gap-6 md:flex">
            <a href="#features" className="text-sm font-medium transition-colors hover:text-primary">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium transition-colors hover:text-primary">
              How It Works
            </a>
            <a href="#safety" className="text-sm font-medium transition-colors hover:text-primary">
              Safety
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="hidden rounded-full md:inline-flex"
              onClick={() => setCurrentView("app")}
            >
              Enter App
            </Button>
            <Button
              size="sm"
              className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 text-white"
              onClick={() => {
                setCurrentView("app");
                setIsPostQuestOpen(true);
              }}
            >
              Post a Quest
            </Button>
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background md:hidden"
          >
            <div className="container space-y-6 pt-24">
              {["features", "how-it-works", "safety"].map((item) => (
                <a
                  key={item}
                  href={`#${item}`}
                  className="block text-lg font-medium capitalize"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.replaceAll("-", " ")}
                </a>
              ))}
              <Button
                className="w-full"
                onClick={() => {
                  setCurrentView("app");
                  setIsMenuOpen(false);
                }}
              >
                Enter App
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1">
        <section className="w-full overflow-hidden py-14 md:py-24 lg:py-32">
          <div className="container max-w-7xl px-4 md:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="flex flex-col items-center space-y-8 text-center"
            >
              <Badge className="rounded-full border-0 bg-gradient-to-r from-violet-500/15 to-cyan-500/15 px-4 py-1.5 text-cyan-100">
                <Sparkles className="mr-2 h-3 w-3" />
                Phase 2 local-state hackathon demo
              </Badge>

              <h1 className="max-w-5xl bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-4xl font-bold tracking-tighter text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
                Turn everyday tasks into quests
              </h1>

              <p className="max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
                A premium marketplace for online work and verified campus quests,
                now with local quest creation, lifecycle actions, disputes, mock
                escrow, vendor receipts, and role-based controls.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 text-white"
                  onClick={() => setCurrentView("app")}
                >
                  Enter App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setCurrentView("app");
                    setIsPostQuestOpen(true);
                  }}
                >
                  Post a Quest
                </Button>
              </div>

              <div className="grid w-full max-w-4xl grid-cols-2 gap-6 pt-10 md:grid-cols-4">
                {[
                  { icon: Target, label: "Demo Quests", value: `${stats.active}` },
                  { icon: CheckCircle, label: "Completed", value: `${stats.completed}` },
                  { icon: Shield, label: "Verified Campuses", value: "5" },
                  { icon: Award, label: "Local Persistence", value: "On" },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    variants={itemFadeIn}
                    className="flex flex-col items-center gap-2 rounded-xl border bg-card/50 p-5 backdrop-blur"
                  >
                    <stat.icon className="h-8 w-8 text-primary" />
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <InfoSections />
      </main>

      <Footer />
    </div>
  );
}

function AppDashboard({
  actions,
  disputes,
  escrowLocked,
  isPostQuestOpen,
  onCreateQuest,
  quests,
  selectedTab,
  setCurrentView,
  setIsPostQuestOpen,
  setSelectedTab,
  setShowBalance,
  setUserRole,
  showBalance,
  userRole,
  vendorPaid,
  wallet,
  workerReleased,
}: {
  actions: {
    acceptQuest: (id: string) => void;
    startQuest: (id: string) => void;
    submitProof: (id: string, proof: string) => void;
    markItemsPicked: (id: string) => void;
    vendorConfirm: (id: string) => void;
    confirmCompletion: (id: string) => void;
    releasePayout: (id: string) => void;
    openDispute: (id: string, reason?: string) => void;
    recommendDispute: (id: string) => void;
    finalizeDispute: (id: string, verdict: string) => void;
  };
  disputes: Dispute[];
  escrowLocked: number;
  isPostQuestOpen: boolean;
  onCreateQuest: (form: QuestFormState) => void;
  quests: Quest[];
  selectedTab: DashboardTab;
  setCurrentView: (view: "landing" | "app") => void;
  setIsPostQuestOpen: (open: boolean) => void;
  setSelectedTab: (tab: DashboardTab) => void;
  setShowBalance: (show: boolean) => void;
  setUserRole: (role: UserRole) => void;
  showBalance: boolean;
  userRole: UserRole;
  vendorPaid: number;
  wallet: WalletState;
  workerReleased: number;
}) {
  const visibleQuests = useMemo(() => {
    if (selectedTab === "online") return quests.filter((quest) => quest.type === "online");
    if (selectedTab === "physical") return quests.filter((quest) => quest.type === "physical");
    if (selectedTab === "vendor") return quests.filter((quest) => quest.type === "vendor");
    if (selectedTab === "my-quests") {
      if (userRole === "worker") return quests.filter((quest) => quest.worker === "You");
      return quests.filter((quest) => quest.tasker === "You");
    }
    return quests;
  }, [quests, selectedTab, userRole]);

  const balanceForRole =
    userRole === "worker"
      ? wallet.workerBalance
      : userRole === "vendor"
        ? wallet.vendorBalance
        : userRole === "mediator"
          ? wallet.mediatorBalance
          : wallet.taskerBalance;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
        <div className="container flex h-16 max-w-7xl items-center justify-between">
          <button className="flex items-center gap-4" onClick={() => setCurrentView("landing")}>
            <Brand />
          </button>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="outline" size="sm" className="gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Mock Wallet</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsPostQuestOpen(true)}
              className="gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Post Quest</span>
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Avatar>
              <AvatarFallback>SQ</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="container max-w-7xl space-y-6 py-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage quests, vendor flows, safety, and disputes as {roleLabels[userRole]}.
            </p>
          </div>
          <Select value={userRole} onValueChange={(value) => setUserRole(value as UserRole)}>
            <SelectTrigger className="w-full md:w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tasker">
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  Tasker
                </div>
              </SelectItem>
              <SelectItem value="worker">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Worker
                </div>
              </SelectItem>
              <SelectItem value="vendor">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Vendor
                </div>
              </SelectItem>
              <SelectItem value="mediator">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Mediator
                </div>
              </SelectItem>
              <SelectItem value="admin">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Admin
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <WalletCards
          balance={balanceForRole}
          escrowLocked={escrowLocked}
          setShowBalance={setShowBalance}
          showBalance={showBalance}
          vendorPaid={vendorPaid}
          workerReleased={workerReleased}
        />

        <Tabs
          value={selectedTab}
          onValueChange={(value) => setSelectedTab(value as DashboardTab)}
          className="space-y-4"
        >
          <TabsList className="grid h-auto w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="online">
              <Globe className="mr-2 h-4 w-4" />
              Online
            </TabsTrigger>
            <TabsTrigger value="physical">
              <MapPin className="mr-2 h-4 w-4" />
              Physical
            </TabsTrigger>
            <TabsTrigger value="vendor">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Vendor
            </TabsTrigger>
            <TabsTrigger value="my-quests">
              <Briefcase className="mr-2 h-4 w-4" />
              My Quests
            </TabsTrigger>
            <TabsTrigger value="disputes">
              <Scale className="mr-2 h-4 w-4" />
              Disputes
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search quests..." className="pl-10" />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          <TabsContent value="online">
            <QuestGrid actions={actions} quests={visibleQuests} userRole={userRole} />
          </TabsContent>
          <TabsContent value="physical">
            <QuestGrid actions={actions} quests={visibleQuests} userRole={userRole} />
          </TabsContent>
          <TabsContent value="vendor">
            <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
              <QuestGrid actions={actions} quests={visibleQuests} userRole={userRole} />
              <VendorRulesCard />
            </div>
          </TabsContent>
          <TabsContent value="my-quests">
            <QuestGrid actions={actions} quests={visibleQuests} userRole={userRole} />
          </TabsContent>
          <TabsContent value="disputes">
            <DisputesPanel actions={actions} disputes={disputes} userRole={userRole} />
          </TabsContent>
        </Tabs>
      </div>

      <PostQuestDialog
        isOpen={isPostQuestOpen}
        onCreateQuest={onCreateQuest}
        onOpenChange={setIsPostQuestOpen}
      />
    </div>
  );
}

function WalletCards({
  balance,
  escrowLocked,
  setShowBalance,
  showBalance,
  vendorPaid,
  workerReleased,
}: {
  balance: number;
  escrowLocked: number;
  setShowBalance: (show: boolean) => void;
  showBalance: boolean;
  vendorPaid: number;
  workerReleased: number;
}) {
  const cards = [
    ["Escrow Locked", currency(escrowLocked), "Tasker funds held safely", Target],
    ["Vendor Paid", currency(vendorPaid), "Item funds paid to vendor wallets", ShoppingBag],
    ["Worker Released", currency(workerReleased), "Rewards released to workers", CheckCircle],
  ] as const;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Role Balance</CardTitle>
          <button onClick={() => setShowBalance(!showBalance)}>
            {showBalance ? (
              <Eye className="h-4 w-4 text-muted-foreground" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{showBalance ? currency(balance) : "******"}</div>
          <p className="text-xs text-muted-foreground">
            <TrendingUp className="mr-1 inline h-3 w-3" />
            Fake local wallet only
          </p>
        </CardContent>
      </Card>
      {cards.map(([title, value, note, Icon]) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{note}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function QuestGrid({
  actions,
  quests,
  userRole,
}: {
  actions: QuestActions;
  quests: Quest[];
  userRole: UserRole;
}) {
  if (quests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No quests here yet</CardTitle>
          <CardDescription>Create a quest or switch roles to continue the demo.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      {quests.map((quest) => (
        <QuestCard actions={actions} key={quest.id} quest={quest} userRole={userRole} />
      ))}
    </motion.div>
  );
}

type QuestActions = {
  acceptQuest: (id: string) => void;
  startQuest: (id: string) => void;
  submitProof: (id: string, proof: string) => void;
  markItemsPicked: (id: string) => void;
  vendorConfirm: (id: string) => void;
  confirmCompletion: (id: string) => void;
  releasePayout: (id: string) => void;
  openDispute: (id: string, reason?: string) => void;
  recommendDispute: (id: string) => void;
  finalizeDispute: (id: string, verdict: string) => void;
};

function QuestCard({
  actions,
  quest,
  userRole,
}: {
  actions: QuestActions;
  quest: Quest;
  userRole: UserRole;
}) {
  const [proof, setProof] = useState("");
  const isTaskerOwner = quest.tasker === "You";
  const canWorkerAct = userRole === "worker" && quest.status !== "completed" && quest.status !== "disputed";
  const canTaskerAct = userRole === "tasker" && isTaskerOwner;
  const canVendorAct = userRole === "vendor" && quest.type === "vendor";

  return (
    <motion.div variants={itemFadeIn}>
      <Card className="group h-full border-border/60 bg-card/65 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-[0_22px_70px_rgba(99,102,241,0.18)]">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                {getCategoryIcon(quest.category)}
              </div>
              <div>
                <CardTitle className="text-base transition-colors group-hover:text-primary">
                  {quest.title}
                </CardTitle>
                <CardDescription className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary" className="text-xs">
                    {quest.type === "online" ? (
                      <Globe className="mr-1 h-3 w-3" />
                    ) : (
                      <MapPin className="mr-1 h-3 w-3" />
                    )}
                    {quest.type === "online" ? "Online" : quest.campus}
                  </Badge>
                  <Badge className={statusClass(quest.status)} variant="outline">
                    {statusLabels[quest.status]}
                  </Badge>
                  {quest.verified && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-lg font-bold text-primary">
                <DollarSign className="h-4 w-4" />
                {quest.reward}
              </div>
              <p className="text-[11px] text-muted-foreground">worker reward</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {quest.description}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge className={urgencyClass(quest.urgency)} variant="outline">
              <Clock className="mr-1 h-3 w-3" />
              {quest.urgency}
            </Badge>
            <Badge variant="outline">Due {new Date(quest.deadline).toLocaleDateString()}</Badge>
            <Badge variant="outline">Tasker: {quest.tasker}</Badge>
            {quest.worker && <Badge variant="outline">Worker: {quest.worker}</Badge>}
          </div>

          {quest.type === "physical" && <PhysicalSafety quest={quest} />}
          {quest.type === "vendor" && <VendorState quest={quest} />}
          {quest.type === "online" && <OnlineState quest={quest} />}

          {(canWorkerAct || canTaskerAct || canVendorAct) && (
            <div className="space-y-3 rounded-lg border bg-background/35 p-3">
              {canWorkerAct && (
                <WorkerActions actions={actions} proof={proof} quest={quest} setProof={setProof} />
              )}
              {canTaskerAct && <TaskerActions actions={actions} quest={quest} />}
              {canVendorAct && <VendorActions actions={actions} quest={quest} />}
            </div>
          )}

          {(userRole === "admin" || userRole === "mediator") && quest.status === "disputed" && (
            <Badge className="w-full justify-center py-2" variant="destructive">
              Visible in dispute queue
            </Badge>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function WorkerActions({
  actions,
  proof,
  quest,
  setProof,
}: {
  actions: QuestActions;
  proof: string;
  quest: Quest;
  setProof: (proof: string) => void;
}) {
  return (
    <div className="space-y-2">
      {quest.status === "open" && (
        <Button className="w-full" onClick={() => actions.acceptQuest(quest.id)}>
          Accept Quest
        </Button>
      )}
      {quest.status === "accepted" && quest.worker === "You" && (
        <Button className="w-full" onClick={() => actions.startQuest(quest.id)}>
          Start Quest
        </Button>
      )}
      {quest.type === "vendor" && quest.status === "in-progress" && !quest.itemsPicked && (
        <Button className="w-full" onClick={() => actions.markItemsPicked(quest.id)}>
          Mark Items Picked
        </Button>
      )}
      {quest.status === "in-progress" && (quest.type !== "vendor" || quest.vendorConfirmed) && (
        <>
          <Textarea
            placeholder={
              quest.type === "online"
                ? "Paste file link or proof notes"
                : "Describe uploaded delivery proof"
            }
            value={proof}
            onChange={(event) => setProof(event.target.value)}
          />
          <Button className="w-full" onClick={() => actions.submitProof(quest.id, proof)}>
            {quest.type === "online" ? "Submit Proof" : "Mark Delivered / Submitted"}
          </Button>
        </>
      )}
      {quest.status === "accepted" || quest.status === "in-progress" ? (
        <Button
          className="w-full"
          variant="outline"
          onClick={() => actions.openDispute(quest.id, "Worker opened a dispute.")}
        >
          Open Dispute
        </Button>
      ) : null}
    </div>
  );
}

function TaskerActions({ actions, quest }: { actions: QuestActions; quest: Quest }) {
  return (
    <div className="space-y-2">
      {quest.status === "awaiting-confirmation" && (
        <Button className="w-full" onClick={() => actions.confirmCompletion(quest.id)}>
          Confirm Completion
        </Button>
      )}
      {quest.status === "completed" && !quest.workerRewardReleased && (
        <Button className="w-full" onClick={() => actions.releasePayout(quest.id)}>
          Release Payout
        </Button>
      )}
      {quest.status !== "completed" && quest.status !== "disputed" && (
        <Button
          className="w-full"
          variant="outline"
          onClick={() => actions.openDispute(quest.id, "Tasker opened a dispute.")}
        >
          Open Dispute
        </Button>
      )}
      {quest.receipt && (
        <ReceiptBlock receipt={quest.receipt} />
      )}
    </div>
  );
}

function VendorActions({ actions, quest }: { actions: QuestActions; quest: Quest }) {
  if (!quest.itemsPicked) {
    return <p className="text-sm text-muted-foreground">Waiting for worker to pick items.</p>;
  }
  if (quest.vendorConfirmed) {
    return <ReceiptBlock receipt={quest.receipt} />;
  }
  return (
    <Button className="w-full" onClick={() => actions.vendorConfirm(quest.id)}>
      Confirm Item List & Generate Receipt
    </Button>
  );
}

function PhysicalSafety({ quest }: { quest: Quest }) {
  return (
    <div className="grid gap-2 rounded-lg border bg-background/35 p-3 text-xs text-muted-foreground">
      <div className="flex flex-wrap gap-2">
        <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-200" variant="outline">
          <GraduationCap className="mr-1 h-3 w-3" />
          Verified campus
        </Badge>
        <Badge variant="outline">Tracking: {quest.liveTracking}</Badge>
      </div>
      <p>Safe handoff: {quest.safeHandoffPoint || "Campus safe zone"}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline">
          <Upload className="mr-1 h-3 w-3" />
          Proof Upload
        </Button>
        <Button size="sm" variant="destructive">
          SOS
        </Button>
        <Button size="sm" variant="outline">
          Report
        </Button>
      </div>
    </div>
  );
}

function VendorState({ quest }: { quest: Quest }) {
  return (
    <div className="space-y-2 rounded-lg border bg-background/35 p-3 text-xs text-muted-foreground">
      <div className="flex items-center justify-between gap-3">
        <span>Vendor</span>
        <span className="font-medium text-foreground">{quest.vendorName}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span>Item funds</span>
        <span className="font-medium text-cyan-200">
          {currency(quest.itemFunds)} paid directly to vendor wallet
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span>Worker reward</span>
        <span className="font-medium text-emerald-200">{currency(quest.reward)}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {quest.itemList.map((item) => (
          <Badge key={item} variant="secondary">
            {item}
          </Badge>
        ))}
      </div>
      {quest.receipt && <ReceiptBlock receipt={quest.receipt} />}
    </div>
  );
}

function OnlineState({ quest }: { quest: Quest }) {
  return (
    <div className="rounded-lg border bg-background/35 p-3 text-xs text-muted-foreground">
      <p>Proof: {quest.proofText || "No file/proof submitted yet."}</p>
      <p className="mt-1">
        Payout: {quest.workerRewardReleased ? "Released" : "Locked in escrow"}
      </p>
    </div>
  );
}

function ReceiptBlock({ receipt }: { receipt?: Receipt }) {
  if (!receipt) return null;
  return (
    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs text-cyan-100">
      <div className="mb-2 flex items-center gap-2 font-medium">
        <ReceiptText className="h-4 w-4" />
        Digital receipt {receipt.id}
      </div>
      <p>{receipt.vendor}</p>
      <p>{receipt.wallet}</p>
      <p>{currency(receipt.amount)} item funds paid directly to vendor wallet.</p>
      <p>{receipt.issuedAt}</p>
    </div>
  );
}

function VendorRulesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Quest Rule</CardTitle>
        <CardDescription>
          Workers never receive item funds. Only the worker reward can be released to the worker.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        {[
          "Tasker locks item funds + worker reward.",
          "Worker picks items and marks them picked.",
          "Vendor confirms basket and receives item funds.",
          "Receipt is generated for the tasker.",
          "Worker delivers and tasker releases reward.",
        ].map((step, index) => (
          <div key={step} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {index + 1}
            </span>
            <span>{step}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DisputesPanel({
  actions,
  disputes,
  userRole,
}: {
  actions: QuestActions;
  disputes: Dispute[];
  userRole: UserRole;
}) {
  if (disputes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No active disputes</CardTitle>
          <CardDescription>Open a dispute from a quest card to test mediation.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {disputes.map((dispute) => (
        <Card key={dispute.id}>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-base">{dispute.questTitle}</CardTitle>
              <Badge className={dispute.status === "finalized" ? statusClass("completed") : statusClass("disputed")} variant="outline">
                {dispute.status}
              </Badge>
            </div>
            <CardDescription>
              {dispute.taskerName} vs {dispute.workerName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="mb-2 font-medium">Reason</h4>
              <p className="text-sm text-muted-foreground">{dispute.reason}</p>
            </div>
            <div>
              <h4 className="mb-2 font-medium">Evidence</h4>
              <div className="flex flex-wrap gap-2">
                {dispute.evidence.map((file) => (
                  <Badge key={file} variant="secondary">
                    {file}
                  </Badge>
                ))}
              </div>
            </div>
            {dispute.recommendation && (
              <div className="rounded-lg border bg-background/40 p-3 text-sm text-muted-foreground">
                {dispute.recommendation}
              </div>
            )}
            {dispute.verdict && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                Final verdict: {dispute.verdict}
              </div>
            )}
            {userRole === "mediator" && dispute.status === "pending" && (
              <Button className="w-full" onClick={() => actions.recommendDispute(dispute.id)}>
                Submit Mediator Recommendation
              </Button>
            )}
            {userRole === "admin" && dispute.status !== "finalized" && (
              <div className="grid gap-2 sm:grid-cols-2">
                <Button onClick={() => actions.finalizeDispute(dispute.id, "finalized for tasker")}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Finalize for Tasker
                </Button>
                <Button
                  variant="outline"
                  onClick={() => actions.finalizeDispute(dispute.id, "finalized for worker")}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Finalize for Worker
                </Button>
              </div>
            )}
            {userRole !== "mediator" && userRole !== "admin" && (
              <p className="text-sm text-muted-foreground">
                Switch to Mediator or Admin to review and finalize this case.
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PostQuestDialog({
  isOpen,
  onCreateQuest,
  onOpenChange,
}: {
  isOpen: boolean;
  onCreateQuest: (form: QuestFormState) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState<QuestFormState>(defaultQuestForm);

  function update<K extends keyof QuestFormState>(key: K, value: QuestFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    onCreateQuest(form);
    setForm(defaultQuestForm);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Post a New Quest</DialogTitle>
          <DialogDescription>
            Create a quest and lock fake escrow in localStorage.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Quest Type</Label>
            <Select value={form.type} onValueChange={(value) => update("type", value as QuestType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online Quest</SelectItem>
                <SelectItem value="physical">Physical Campus Quest</SelectItem>
                <SelectItem value="vendor">Vendor Purchase Quest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Quest Title</Label>
            <Input
              id="title"
              placeholder="e.g., Design a logo for my startup"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed requirements, proof rules, safe handoff notes, or vendor substitutions."
              rows={4}
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) => update("category", value as QuestCategory)}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="writing">Writing</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                  <SelectItem value="printing">Printing</SelectItem>
                  <SelectItem value="medicine">OTC Medicine</SelectItem>
                  <SelectItem value="transport">Campus Transport</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward">Worker Reward ($)</Label>
              <Input
                id="reward"
                type="number"
                value={form.reward}
                onChange={(event) => update("reward", event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={form.deadline}
                onChange={(event) => update("deadline", event.target.value)}
              />
            </div>
            {form.type !== "online" && (
              <div className="space-y-2">
                <Label htmlFor="campus">Campus</Label>
                <Input
                  id="campus"
                  value={form.campus}
                  onChange={(event) => update("campus", event.target.value)}
                />
              </div>
            )}
          </div>

          {form.type !== "online" && (
            <div className="space-y-2">
              <Label htmlFor="handoff">Safe Handoff Point</Label>
              <Input
                id="handoff"
                value={form.safeHandoffPoint}
                onChange={(event) => update("safeHandoffPoint", event.target.value)}
              />
            </div>
          )}

          {form.type === "vendor" && (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input
                    id="vendor"
                    value={form.vendorName}
                    onChange={(event) => update("vendorName", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="itemFunds">Item Funds ($)</Label>
                  <Input
                    id="itemFunds"
                    type="number"
                    value={form.itemFunds}
                    onChange={(event) => update("itemFunds", event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="items">Item List</Label>
                <Textarea
                  id="items"
                  placeholder="Bread, milk, apples"
                  value={form.itemList}
                  onChange={(event) => update("itemList", event.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="reimbursement">Allow quick reimbursement</Label>
              <p className="text-sm text-muted-foreground">
                For small purchases under $10 with receipt proof.
              </p>
            </div>
            <Switch
              checked={form.reimbursementEnabled}
              id="reimbursement"
              onCheckedChange={(checked) => update("reimbursementEnabled", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="rounded-lg border-2 border-dashed p-8 text-center">
              <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Mock upload area for screenshots, PDFs, receipts, or reference files
              </p>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                Stored as text-only demo state for now
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">
            <Info className="mr-2 inline h-4 w-4" />
            Creating this quest locks fake escrow locally. No backend or real wallet is used.
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Create Quest</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500">
        <Target className="h-6 w-6 text-white" />
      </div>
      <span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-xl font-bold text-transparent">
        Side Quests
      </span>
    </div>
  );
}

function InfoSections() {
  return (
    <>
      <section id="features" className="w-full bg-muted/25 py-12 md:py-24">
        <div className="container max-w-7xl px-4 md:px-6">
          <div className="space-y-12">
            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Functional Local Demo
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Create quests, accept work, submit proof, generate receipts, open disputes,
                and refresh without losing local demo state.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              {[
                {
                  icon: Globe,
                  title: "Online Quests",
                  description: "Workers accept, submit proof text, taskers confirm, and payouts release.",
                },
                {
                  icon: GraduationCap,
                  title: "Campus Quests",
                  description: "Physical quests show campus verification, tracking, proof, SOS, and handoff points.",
                },
              ].map((feature) => (
                <Card className="h-full border-2 bg-card/60 backdrop-blur" key={feature.title}>
                  <CardHeader>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="w-full py-12 md:py-24">
        <div className="container max-w-7xl px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              [FileText, "Post", "Tasker creates quest and fake escrow is locked."],
              [Users, "Complete", "Worker progresses through accept, start, proof, and delivery."],
              [Scale, "Resolve", "Disputes move through mediator recommendation and admin verdict."],
            ].map(([Icon, title, copy]) => (
              <Card className="h-full text-center" key={title as string}>
                <CardHeader>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle>{title as string}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{copy as string}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="safety" className="w-full bg-muted/25 py-12 md:py-24">
        <div className="container max-w-7xl px-4 md:px-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              [Shield, "University Verification", "Campus badges and physical quest restrictions."],
              [MapPin, "Live Tracking Mock", "Status switches from inactive to active to completed."],
              [AlertCircle, "SOS and Reports", "Physical quest cards show safety actions."],
            ].map(([Icon, title, copy]) => (
              <Card className="h-full" key={title as string}>
                <CardHeader>
                  <Icon className="mb-2 h-8 w-8 text-primary" />
                  <CardTitle className="text-lg">{title as string}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{copy as string}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Footer() {
  return (
    <footer className="w-full border-t py-12">
      <div className="container max-w-7xl px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Brand />
            <p className="text-sm text-muted-foreground">
              Turn everyday tasks into quests. Local-state Phase 2 demo.
            </p>
          </div>
          {[
            { title: "Product", links: ["Features", "How It Works", "Safety"] },
            { title: "Demo", links: ["LocalStorage", "Mock Wallet", "Disputes"] },
            { title: "Next", links: ["Backend", "Solana Wallet", "Campus Verification"] },
          ].map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="font-semibold">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Separator className="my-8" />
        <p className="text-sm text-muted-foreground">
          (c) {new Date().getFullYear()} Side Quests. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
