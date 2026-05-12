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
  Check,
  CheckCircle,
  CheckCircle2,
  Circle,
  Clock,
  ClipboardCheck,
  DollarSign,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  Info,
  ListChecks,
  MapPinned,
  MapPin,
  Menu,
  MessageSquare,
  Navigation,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  Radio,
  ReceiptText,
  Scale,
  Search,
  Send,
  Settings,
  Shield,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Siren,
  Target,
  TrendingUp,
  Upload,
  UserCircle,
  Users,
  Video,
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
import {
  type AuthSession,
  isSupabaseConfigured,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  supabase,
} from "@/lib/supabase/client";
import {
  createQuestInSupabase,
  fetchDisputesFromSupabase,
  fetchQuestsFromSupabase,
  finalizeDisputeInSupabase,
  markItemsPickedInSupabase,
  openDisputeInSupabase,
  recommendDisputeInSupabase,
  releasePayoutInSupabase,
  startQuestInSupabase,
  submitProofInSupabase,
  updateQuestStatusInSupabase,
  vendorConfirmInSupabase,
} from "@/lib/supabase/side-quests-repository";
import { uploadQuestFile } from "@/lib/supabase/storage";

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
  | "draft"
  | "scheduled"
  | "open-for-applications"
  | "reviewing-applicants"
  | "worker-approved"
  | "in-progress"
  | "awaiting-confirmation"
  | "completed"
  | "disputed"
  | "expired";
type DashboardTab = "online" | "physical" | "vendor" | "my-quests" | "disputes";
type AppSection =
  | "overview"
  | "quest-feed"
  | "accepted-quests"
  | "active-quest"
  | "chat"
  | "objectives"
  | "check-ins"
  | "receipts"
  | "disputes"
  | "safety";
type DisputeStatus = "pending" | "recommended" | "finalized";
type ObjectiveKey =
  | "accepted"
  | "started"
  | "arrived"
  | "reviewed"
  | "picked"
  | "vendor-confirmed"
  | "vendor-paid"
  | "receipt"
  | "proof"
  | "delivered"
  | "review"
  | "final"
  | "confirmed"
  | "payout";
type ChatMessageType = "text" | "image" | "video" | "location" | "system" | "check-in";
type LocationStatus = "At pickup" | "En route" | "At handoff point";

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
  publishAt?: string;
  applicationWindowMinutes?: number;
  applicationCloseAt?: string;
  completionDeadline?: string;
  status: QuestStatus;
  urgency: "low" | "medium" | "high" | "urgent";
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
  applications?: WorkerApplication[];
  late?: boolean;
}

interface WorkerApplication {
  id: string;
  workerName: string;
  note: string;
  eta: string;
  distance?: string;
  rating: number;
  completedQuests: number;
  completionRate: number;
  disputeRate: number;
  profileBadge: string;
  lastActive: string;
  status: "pending" | "approved" | "declined";
  appliedAt: string;
  recommended?: boolean;
}

interface Dispute {
  id: string;
  questId: string;
  questTitle: string;
  taskerName: string;
  workerName: string;
  openedBy: "tasker" | "worker";
  reason: string;
  explanation?: string;
  evidence: string[];
  attachmentName?: string;
  status: DisputeStatus;
  recommendation?: string;
  verdict?: string;
  createdAt: string;
}

interface DisputePayload {
  openedBy: "tasker" | "worker";
  reason: string;
  explanation: string;
  evidenceText: string;
  attachmentName?: string;
}

interface WalletState {
  taskerBalance: number;
  workerBalance: number;
  vendorBalance: number;
  mediatorBalance: number;
}

interface MissionObjective {
  id: ObjectiveKey;
  label: string;
  completedAt?: string;
}

interface MissionCheckIn {
  id: ObjectiveKey;
  label: string;
  completedAt?: string;
}

interface ChatMessage {
  id: string;
  sender: "tasker" | "worker" | "vendor" | "system";
  type: ChatMessageType;
  body: string;
  createdAt: string;
  unread: boolean;
}

interface ActivityEvent {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
}

interface MissionState {
  questId: string;
  objectives: MissionObjective[];
  checkIns: MissionCheckIn[];
  chat: ChatMessage[];
  activity: ActivityEvent[];
  locationStatus: LocationStatus;
  liveLocationShared: boolean;
  unreadCount: number;
}

interface QuestFormState {
  type: QuestType;
  title: string;
  description: string;
  category: QuestCategory;
  reward: string;
  itemFunds: string;
  deadline: string;
  publishImmediately: boolean;
  scheduledPublishAt: string;
  applicationWindow: "5" | "10" | "30" | "60" | "custom";
  customApplicationWindow: string;
  completionDeadlinePreset: "5" | "30" | "60" | "today" | "custom";
  customCompletionDeadline: string;
  urgency: Quest["urgency"];
  campus: string;
  safeHandoffPoint: string;
  vendorName: string;
  itemList: string;
  reimbursementEnabled: boolean;
}

const QUESTS_STORAGE_KEY = "side-quests.phase2.quests";
const DISPUTES_STORAGE_KEY = "side-quests.phase2.disputes";
const WALLET_STORAGE_KEY = "side-quests.phase2.wallet";
const MISSIONS_STORAGE_KEY = "side-quests.phase4.missions";

const roleLabels: Record<UserRole, string> = {
  tasker: "Tasker",
  worker: "Worker",
  vendor: "Vendor",
  mediator: "Mediator",
  admin: "Admin",
};

const statusLabels: Record<QuestStatus, string> = {
  open: "Open for Applications",
  accepted: "Worker Approved",
  draft: "Draft",
  scheduled: "Scheduled",
  "open-for-applications": "Open for Applications",
  "reviewing-applicants": "Reviewing Applicants",
  "worker-approved": "Worker Approved",
  "in-progress": "In Progress",
  "awaiting-confirmation": "Awaiting Confirmation",
  completed: "Completed",
  disputed: "Disputed",
  expired: "Expired",
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
  publishImmediately: true,
  scheduledPublishAt: "2026-05-10T09:00",
  applicationWindow: "30",
  customApplicationWindow: "45",
  completionDeadlinePreset: "60",
  customCompletionDeadline: "2026-05-15T17:00",
  urgency: "medium",
  campus: "UNILAG Main Campus",
  safeHandoffPoint: "Main Library reception",
  vendorName: "Campus Mart",
  itemList: "",
  reimbursementEnabled: false,
};

const workerDisputeReasons = [
  "Tasker refusing to confirm completion",
  "Tasker changed requirements after acceptance",
  "Unsafe task conditions",
  "Wrong payment/reward issue",
  "Vendor/tasker issue",
  "Other",
] as const;

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
    status: "worker-approved",
    urgency: "high",
    verified: true,
    tasker: "You",
    worker: "You",
    applications: [
      {
        id: "app-pitch-you",
        workerName: "You",
        note: "I can turn this around with a clean investor narrative and editable Figma source.",
        eta: "45 minutes",
        rating: 4.9,
        completedQuests: 48,
        completionRate: 98,
        disputeRate: 1,
        profileBadge: "Deck specialist",
        lastActive: "Online now",
        status: "approved",
        appliedAt: "May 10, 09:15",
        recommended: true,
      },
    ],
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
    status: "in-progress",
    urgency: "medium",
    verified: true,
    tasker: "Mike Johnson",
    worker: "You",
    applications: [
      {
        id: "app-book-you",
        workerName: "You",
        note: "Already near Dorm 9 and can hand off at the library reception.",
        eta: "10 minutes",
        distance: "2 min away",
        rating: 4.8,
        completedQuests: 31,
        completionRate: 96,
        disputeRate: 0,
        profileBadge: "Campus runner",
        lastActive: "Online now",
        status: "approved",
        appliedAt: "May 10, 09:20",
        recommended: true,
      },
    ],
    createdAt: "2026-05-10",
    liveTracking: "active",
    itemsPicked: false,
    vendorConfirmed: false,
    escrowLocked: true,
    vendorPaidAmount: 0,
    workerRewardReleased: false,
    reimbursementEnabled: false,
  },
  {
    id: "quest-vendor-groceries",
    title: "Buy groceries from Campus Mart",
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
    status: "in-progress",
    urgency: "medium",
    verified: true,
    tasker: "You",
    worker: "You",
    applications: [
      {
        id: "app-grocery-you",
        workerName: "You",
        note: "I know Campus Mart substitutions and can verify checkout quickly.",
        eta: "25 minutes",
        distance: "5 min away",
        rating: 4.95,
        completedQuests: 62,
        completionRate: 99,
        disputeRate: 1,
        profileBadge: "Vendor verified",
        lastActive: "Online now",
        status: "approved",
        appliedAt: "May 10, 09:22",
        recommended: true,
      },
    ],
    createdAt: "2026-05-10",
    liveTracking: "active",
    itemsPicked: true,
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
    status: "open-for-applications",
    urgency: "high",
    verified: true,
    tasker: "Aisha Bello",
    applications: [],
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
    status: "in-progress",
    urgency: "medium",
    verified: true,
    tasker: "Tomi Adeyemi",
    worker: "You",
    applications: [
      {
        id: "app-transport-you",
        workerName: "You",
        note: "Available near Engineering and can complete within the safe campus route.",
        eta: "15 minutes",
        distance: "5 min away",
        rating: 4.7,
        completedQuests: 27,
        completionRate: 94,
        disputeRate: 2,
        profileBadge: "Transit helper",
        lastActive: "Online now",
        status: "approved",
        appliedAt: "May 10, 09:25",
        recommended: true,
      },
    ],
    createdAt: "2026-05-10",
    liveTracking: "active",
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

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function appWindowMinutes(form: QuestFormState) {
  return form.applicationWindow === "custom"
    ? Number(form.customApplicationWindow) || 30
    : Number(form.applicationWindow);
}

function completionDeadlineFromForm(form: QuestFormState, publishAt: Date) {
  if (form.completionDeadlinePreset === "custom") {
    return form.customCompletionDeadline
      ? new Date(form.customCompletionDeadline)
      : addMinutes(publishAt, 60);
  }
  if (form.completionDeadlinePreset === "today") {
    const end = new Date(publishAt);
    end.setHours(23, 59, 0, 0);
    return end;
  }
  return addMinutes(publishAt, Number(form.completionDeadlinePreset));
}

function questPublishState(quest: Quest) {
  const now = Date.now();
  const publishAt = quest.publishAt ? new Date(quest.publishAt).getTime() : now;
  const closeAt = quest.applicationCloseAt
    ? new Date(quest.applicationCloseAt).getTime()
    : publishAt + (quest.applicationWindowMinutes ?? 30) * 60_000;
  const deadline = quest.completionDeadline ? new Date(quest.completionDeadline).getTime() : new Date(quest.deadline).getTime();
  return {
    isVisible: now >= publishAt || quest.status !== "scheduled",
    publishLabel: now < publishAt ? `Publishes in ${formatDuration(publishAt - now)}` : "Published",
    applicationCountdown: now < closeAt ? formatDuration(closeAt - now) : "Closed",
    deadlineCountdown: now < deadline ? formatDuration(deadline - now) : "Late",
    isApplicationClosed: now >= closeAt,
    isLate: now > deadline && !["completed", "disputed", "expired"].includes(quest.status),
  };
}

function formatDuration(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${rest}s`;
  return `${rest}s`;
}

function createMockApplication(quest: Quest, note: string, eta: string): WorkerApplication {
  const physical = quest.type === "physical" || quest.type === "vendor";
  const distances = ["2 min away", "5 min away", "10 min away"];
  const completed = 18 + Math.floor(Math.random() * 60);
  const rating = Number((4.55 + Math.random() * 0.44).toFixed(2));
  const completionRate = 92 + Math.floor(Math.random() * 8);
  const disputeRate = Math.floor(Math.random() * 3);
  return {
    id: makeId("application"),
    workerName: "You",
    note: note || "I can complete this quest reliably and keep the tasker updated.",
    eta: eta || (physical ? "10 minutes" : "45 minutes"),
    distance: physical ? distances[Math.floor(Math.random() * distances.length)] : undefined,
    rating,
    completedQuests: completed,
    completionRate,
    disputeRate,
    profileBadge: physical ? "Campus verified" : "Digital pro",
    lastActive: "Online now",
    status: "pending",
    appliedAt: nowLabel(),
    recommended: rating >= 4.8 && completionRate >= 96,
  };
}

function nowLabel() {
  return new Date().toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}

function objectiveBlueprint(quest: Quest): MissionObjective[] {
  if (quest.type === "online") {
    return [
      { id: "accepted", label: "Accept quest" },
      { id: "reviewed", label: "Review brief" },
      { id: "proof", label: "Submit draft/proof" },
      { id: "review", label: "Tasker reviews" },
      { id: "final", label: "Final submission" },
      { id: "payout", label: "Payout released" },
    ];
  }

  if (quest.type === "vendor") {
    return [
      { id: "accepted", label: "Accept quest" },
      { id: "arrived", label: "Arrive at vendor" },
      { id: "picked", label: "Pick listed items" },
      { id: "vendor-confirmed", label: "Vendor confirms items" },
      { id: "vendor-paid", label: "Vendor wallet paid" },
      { id: "receipt", label: "Receipt generated" },
      { id: "delivered", label: "Deliver items" },
      { id: "confirmed", label: "Tasker confirms" },
    ];
  }

  return [
    { id: "accepted", label: "Accept quest" },
    { id: "arrived", label: "Arrive at pickup location" },
    { id: "picked", label: "Pick up item" },
    { id: "proof", label: "Upload proof" },
    { id: "delivered", label: "Deliver item" },
    { id: "confirmed", label: "Tasker confirms delivery" },
  ];
}

function createMissionState(quest: Quest): MissionState {
  const objectives = objectiveBlueprint(quest).map((objective) => ({
    ...objective,
    completedAt:
      (objective.id === "accepted" && quest.worker) ||
      (objective.id === "picked" && quest.itemsPicked) ||
      (objective.id === "vendor-confirmed" && quest.vendorConfirmed) ||
      (objective.id === "vendor-paid" && quest.vendorPaidAmount > 0) ||
      (objective.id === "receipt" && quest.receipt) ||
      (objective.id === "proof" && quest.proofText) ||
      (objective.id === "delivered" && quest.status === "awaiting-confirmation") ||
      (objective.id === "confirmed" && quest.status === "completed") ||
      (objective.id === "payout" && quest.workerRewardReleased)
        ? nowLabel()
        : undefined,
  }));
  const intro =
    quest.type === "online"
      ? "Mission workspace opened. Review the brief, share progress, and submit proof."
      : `Mission workspace opened. Safe handoff: ${quest.safeHandoffPoint || "Campus safe zone"}.`;

  return {
    questId: quest.id,
    objectives,
    checkIns: objectives.map((objective) => ({ ...objective })),
    chat: [
      {
        id: makeId("chat"),
        sender: "system",
        type: "system",
        body: intro,
        createdAt: nowLabel(),
        unread: true,
      },
    ],
    activity: [
      {
        id: makeId("activity"),
        title: "Mission workspace created",
        detail: `${quest.title} is ready for live coordination.`,
        createdAt: nowLabel(),
      },
    ],
    locationStatus: "At pickup",
    liveLocationShared: quest.liveTracking === "active",
    unreadCount: 1,
  };
}

function ensureMissionState(
  missions: Record<string, MissionState>,
  quest: Quest,
): MissionState {
  return missions[quest.id] ?? createMissionState(quest);
}

function personaForRole(role: UserRole): ChatMessage["sender"] {
  if (role === "vendor") return "vendor";
  if (role === "worker") return "worker";
  if (role === "tasker") return "tasker";
  return "system";
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
      return "border-emerald-500/25 bg-emerald-500/12 text-emerald-200";
    case "draft":
      return "border-slate-500/25 bg-slate-500/12 text-slate-200";
    case "scheduled":
      return "border-indigo-500/25 bg-indigo-500/12 text-indigo-200";
    case "open-for-applications":
      return "border-cyan-500/25 bg-cyan-500/12 text-cyan-200";
    case "reviewing-applicants":
      return "border-violet-500/25 bg-violet-500/12 text-violet-200";
    case "worker-approved":
      return "border-emerald-500/25 bg-emerald-500/12 text-emerald-200";
    case "in-progress":
      return "border-amber-500/25 bg-amber-500/12 text-amber-200";
    case "awaiting-confirmation":
      return "border-blue-500/25 bg-blue-500/12 text-blue-200";
    case "completed":
      return "border-emerald-500/25 bg-emerald-500/12 text-emerald-200";
    case "disputed":
      return "border-rose-500/25 bg-rose-500/12 text-rose-200";
    case "expired":
      return "border-zinc-500/25 bg-zinc-500/12 text-zinc-200";
  }
}

function urgencyClass(urgency: Quest["urgency"]) {
  switch (urgency) {
    case "high":
      return "border-rose-500/20 bg-rose-500/12 text-rose-300";
    case "urgent":
      return "border-red-500/30 bg-red-500/18 text-red-200";
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
  const [appSection, setAppSection] = useState<AppSection>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [quests, setQuests] = useState<Quest[]>(() =>
    readStorage(QUESTS_STORAGE_KEY, demoQuests),
  );
  const [selectedQuestId, setSelectedQuestId] = useState(() => demoQuests[0]?.id ?? "");
  const [missionStates, setMissionStates] = useState<Record<string, MissionState>>(() =>
    readStorage(MISSIONS_STORAGE_KEY, {}),
  );
  const [disputes, setDisputes] = useState<Dispute[]>(() =>
    readStorage(DISPUTES_STORAGE_KEY, demoDisputes),
  );
  const [wallet, setWallet] = useState<WalletState>(() =>
    readStorage(WALLET_STORAGE_KEY, defaultWallet),
  );
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [authMessage, setAuthMessage] = useState("");
  const [backendError, setBackendError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const useSupabaseBackend = isSupabaseConfigured && Boolean(session);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!useSupabaseBackend) return;
    refreshFromSupabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useSupabaseBackend]);

  useEffect(() => {
    if (!useSupabaseBackend) {
      window.localStorage.setItem(QUESTS_STORAGE_KEY, JSON.stringify(quests));
    }
  }, [quests, useSupabaseBackend]);

  useEffect(() => {
    if (!useSupabaseBackend) {
      window.localStorage.setItem(DISPUTES_STORAGE_KEY, JSON.stringify(disputes));
    }
  }, [disputes, useSupabaseBackend]);

  useEffect(() => {
    if (!useSupabaseBackend) {
      window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
    }
  }, [wallet, useSupabaseBackend]);

  useEffect(() => {
    window.localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(missionStates));
  }, [missionStates]);

  useEffect(() => {
    const tick = () => {
      setQuests((current) =>
        current.map((quest) => {
          const timing = questPublishState(quest);
          if (quest.status === "scheduled" && timing.isVisible) {
            return { ...quest, status: "open-for-applications" };
          }
          if (quest.status === "open-for-applications" && timing.isApplicationClosed) {
            return {
              ...quest,
              status: (quest.applications ?? []).length > 0 ? "reviewing-applicants" : "expired",
            };
          }
          if (timing.isLate && !quest.late) return { ...quest, late: true };
          return quest;
        }),
      );
    };
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

  async function refreshFromSupabase() {
    if (!useSupabaseBackend) return;
    setIsSyncing(true);
    setBackendError("");
    try {
      const [nextQuests, nextDisputes] = await Promise.all([
        fetchQuestsFromSupabase(),
        fetchDisputesFromSupabase(),
      ]);
      setQuests(nextQuests as unknown as Quest[]);
      setDisputes(
        nextDisputes.map((dispute) => ({
          ...dispute,
          openedBy: "tasker",
        })) as Dispute[],
      );
    } catch (error) {
      setBackendError(error instanceof Error ? error.message : "Supabase sync failed.");
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleAuthSubmit() {
    if (!isSupabaseConfigured) {
      setAuthMessage("Supabase env keys are missing. Demo mode is active.");
      return;
    }
    setAuthMessage("");
    setBackendError("");
    try {
      const result =
        authMode === "sign-in"
          ? await signInWithEmail(authEmail, authPassword)
          : await signUpWithEmail(authEmail, authPassword);
      if (result.error) throw result.error;
      setAuthMessage(
        authMode === "sign-up"
          ? "Account created. Check email confirmation if your Supabase project requires it."
          : "Signed in.",
      );
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Authentication failed.");
    }
  }

  async function handleSignOut() {
    await signOut();
    setSession(null);
    setAuthMessage("Signed out. Demo fallback is active.");
  }

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

  function mutateMission(id: string, updater: (mission: MissionState, quest: Quest) => MissionState) {
    const quest = quests.find((item) => item.id === id);
    if (!quest) return;
    setMissionStates((current) => {
      const mission = ensureMissionState(current, quest);
      return {
        ...current,
        [id]: updater(mission, quest),
      };
    });
  }

  function openMissionWorkspace(id: string, section: AppSection = "active-quest") {
    const quest = quests.find((item) => item.id === id);
    if (!quest) return;
    setMissionStates((current) => ({
      ...current,
      [id]: ensureMissionState(current, quest),
    }));
    setSelectedQuestId(id);
    setAppSection(section);
  }

  function completeMissionObjective(id: string, objectiveId: ObjectiveKey, detail?: string) {
    mutateMission(id, (mission) => {
      const completedAt = nowLabel();
      const objective = mission.objectives.find((item) => item.id === objectiveId);
      const label = detail || objective?.label || "Mission update";
      const nextObjectives = mission.objectives.map((item) =>
        item.id === objectiveId ? { ...item, completedAt: item.completedAt || completedAt } : item,
      );
      const nextCheckIns = mission.checkIns.map((item) =>
        item.id === objectiveId ? { ...item, completedAt: item.completedAt || completedAt } : item,
      );
      return {
        ...mission,
        objectives: nextObjectives,
        checkIns: nextCheckIns,
        unreadCount: mission.unreadCount + 1,
        chat: [
          ...mission.chat,
          {
            id: makeId("chat"),
            sender: "system",
            type: "check-in",
            body: `Check-in complete: ${label}`,
            createdAt: completedAt,
            unread: true,
          },
        ],
        activity: [
          {
            id: makeId("activity"),
            title: label,
            detail: "Objective completed and synced to mission check-ins.",
            createdAt: completedAt,
          },
          ...mission.activity,
        ],
      };
    });
  }

  function addMissionActivity(id: string, title: string, detail: string) {
    mutateMission(id, (mission) => {
      const createdAt = nowLabel();
      return {
        ...mission,
        unreadCount: mission.unreadCount + 1,
        chat: [
          ...mission.chat,
          {
            id: makeId("chat"),
            sender: "system",
            type: "system",
            body: `${title}: ${detail}`,
            createdAt,
            unread: true,
          },
        ],
        activity: [
          {
            id: makeId("activity"),
            title,
            detail,
            createdAt,
          },
          ...mission.activity,
        ],
      };
    });
  }

  function sendMissionMessage(id: string, body: string, sender: ChatMessage["sender"], type: ChatMessageType = "text") {
    if (!body.trim()) return;
    mutateMission(id, (mission) => ({
      ...mission,
      unreadCount: sender === "system" ? mission.unreadCount + 1 : mission.unreadCount,
      chat: [
        ...mission.chat,
        {
          id: makeId("chat"),
          sender,
          type,
          body,
          createdAt: nowLabel(),
          unread: sender === "system",
        },
      ],
    }));
  }

  function shareLiveLocation(id: string) {
    mutateMission(id, (mission) => {
      const nextStatus =
        mission.locationStatus === "At pickup"
          ? "En route"
          : mission.locationStatus === "En route"
            ? "At handoff point"
            : "At pickup";
      const createdAt = nowLabel();
      return {
        ...mission,
        liveLocationShared: true,
        locationStatus: nextStatus,
        unreadCount: mission.unreadCount + 1,
        chat: [
          ...mission.chat,
          {
            id: makeId("chat"),
            sender: "worker",
            type: "location",
            body: `Live location shared: ${nextStatus}`,
            createdAt,
            unread: true,
          },
        ],
        activity: [
          {
            id: makeId("activity"),
            title: "Live location shared",
            detail: `Worker status is now ${nextStatus}.`,
            createdAt,
          },
          ...mission.activity,
        ],
      };
    });
  }

  function clearMissionUnread(id: string) {
    mutateMission(id, (mission) => ({
      ...mission,
      unreadCount: 0,
      chat: mission.chat.map((message) => ({ ...message, unread: false })),
    }));
  }

  async function createQuest(form: QuestFormState) {
    if (useSupabaseBackend) {
      setIsSyncing(true);
      setBackendError("");
      try {
        await createQuestInSupabase(form);
        await refreshFromSupabase();
        setSelectedTab(form.type === "online" ? "online" : form.type === "physical" ? "physical" : "vendor");
        setCurrentView("app");
      } catch (error) {
        setBackendError(error instanceof Error ? error.message : "Could not create quest.");
      } finally {
        setIsSyncing(false);
      }
      return;
    }

    const reward = Number(form.reward) || 0;
    const itemFunds = form.type === "vendor" ? Number(form.itemFunds) || 0 : 0;
    const publishAt = form.publishImmediately
      ? new Date()
      : form.scheduledPublishAt
        ? new Date(form.scheduledPublishAt)
        : new Date();
    const applicationWindowMinutes = appWindowMinutes(form);
    const applicationCloseAt = addMinutes(publishAt, applicationWindowMinutes);
    const completionDeadline = completionDeadlineFromForm(form, publishAt);
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
      deadline: completionDeadline.toISOString(),
      publishAt: publishAt.toISOString(),
      applicationWindowMinutes,
      applicationCloseAt: applicationCloseAt.toISOString(),
      completionDeadline: completionDeadline.toISOString(),
      status: form.publishImmediately ? "open-for-applications" : "scheduled",
      urgency: form.urgency,
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
      applications: [],
    };

    setQuests((current) => [quest, ...current]);
    setWallet((current) => ({
      ...current,
      taskerBalance: Math.max(0, current.taskerBalance - reward - itemFunds),
    }));
    setSelectedTab(form.type === "online" ? "online" : form.type === "physical" ? "physical" : "vendor");
    setCurrentView("app");
  }

  function applyForQuest(id: string, note: string, eta: string) {
    const quest = quests.find((item) => item.id === id);
    if (!quest) return;
    const application = createMockApplication(quest, note, eta);
    updateQuest(id, (questItem) => {
      const existing = questItem.applications ?? [];
      if (existing.some((item) => item.workerName === "You" && item.status !== "declined")) {
        return questItem;
      }
      return {
        ...questItem,
        applications: [application, ...existing],
      };
    });
    addMissionActivity(id, "Worker applied", `${application.workerName} applied with ETA ${application.eta}.`);
  }

  function approveWorker(id: string, applicationId: string) {
    const quest = quests.find((item) => item.id === id);
    const application = quest?.applications?.find((item) => item.id === applicationId);
    if (!quest || !application) return;
    updateQuest(id, (questItem) => ({
      ...questItem,
      status: "worker-approved",
      worker: application.workerName,
      applications: (questItem.applications ?? []).map((item) => ({
        ...item,
        status: item.id === applicationId ? "approved" : item.status === "pending" ? "declined" : item.status,
      })),
    }));
    completeMissionObjective(id, "accepted", "Worker approved");
    addMissionActivity(id, "Worker approved", `${application.workerName} was approved for the quest.`);
    openMissionWorkspace(id);
  }

  function declineApplicant(id: string, applicationId: string) {
    updateQuest(id, (questItem) => ({
      ...questItem,
      applications: (questItem.applications ?? []).map((item) =>
        item.id === applicationId ? { ...item, status: "declined" } : item,
      ),
    }));
    addMissionActivity(id, "Applicant declined", "Tasker declined one worker application.");
  }

  function closeApplications(id: string) {
    updateQuest(id, (quest) => ({
      ...quest,
      status: (quest.applications ?? []).some((item) => item.status === "pending")
        ? "reviewing-applicants"
        : "expired",
    }));
  }

  function extendApplicationWindow(id: string) {
    updateQuest(id, (quest) => {
      const closeFrom = quest.applicationCloseAt ? new Date(quest.applicationCloseAt) : new Date();
      const nextClose = addMinutes(closeFrom.getTime() > Date.now() ? closeFrom : new Date(), 10);
      return {
        ...quest,
        status: "open-for-applications",
        applicationCloseAt: nextClose.toISOString(),
        applicationWindowMinutes: (quest.applicationWindowMinutes ?? 30) + 10,
      };
    });
    addMissionActivity(id, "Application window extended", "Tasker added 10 more minutes for applicants.");
  }

  async function startQuest(id: string) {
    if (useSupabaseBackend) {
      const quest = quests.find((item) => item.id === id);
      try {
        await startQuestInSupabase(id, quest?.type === "physical" || quest?.type === "vendor");
        await refreshFromSupabase();
        completeMissionObjective(id, "started", "Quest started");
        addMissionActivity(id, "Quest started", "Worker opened the mission route.");
      } catch (error) {
        setBackendError(error instanceof Error ? error.message : "Could not start quest.");
      }
      return;
    }
    updateQuest(id, (quest) => ({
      ...quest,
      status: "in-progress",
      liveTracking: quest.type === "physical" || quest.type === "vendor" ? "active" : quest.liveTracking,
    }));
    completeMissionObjective(id, "started", "Quest started");
    addMissionActivity(id, "Quest started", "Worker opened the mission route.");
  }

  async function submitProof(id: string, proof: string, file?: File | null) {
    if (useSupabaseBackend) {
      const quest = quests.find((item) => item.id === id);
      try {
        const upload =
          file && quest
            ? await uploadQuestFile({
                file,
                kind: quest.type === "online" ? "submission" : "proof",
                questId: id,
              })
            : undefined;
        await submitProofInSupabase(id, proof, upload?.publicUrl);
        await refreshFromSupabase();
        completeMissionObjective(id, quest?.type === "online" ? "proof" : "delivered", "Proof submitted");
      } catch (error) {
        setBackendError(error instanceof Error ? error.message : "Could not submit proof.");
      }
      return;
    }
    updateQuest(id, (quest) => ({
      ...quest,
      proofText: proof || file?.name || "Mock proof submitted.",
      deliveryProof: quest.type === "online" ? quest.deliveryProof : proof || file?.name || "Delivery photo uploaded.",
      status: "awaiting-confirmation",
      liveTracking: quest.liveTracking === "active" ? "completed" : quest.liveTracking,
    }));
    completeMissionObjective(id, quests.find((item) => item.id === id)?.type === "online" ? "proof" : "delivered", "Proof submitted");
  }

  async function markItemsPicked(id: string) {
    if (useSupabaseBackend) {
      try {
        await markItemsPickedInSupabase(id);
        await refreshFromSupabase();
        completeMissionObjective(id, "picked", "Items picked");
      } catch (error) {
        setBackendError(error instanceof Error ? error.message : "Could not mark items picked.");
      }
      return;
    }
    updateQuest(id, (quest) => ({
      ...quest,
      itemsPicked: true,
      status: "in-progress",
      liveTracking: quest.type === "vendor" ? "active" : quest.liveTracking,
    }));
    completeMissionObjective(id, "picked", "Items picked");
  }

  async function vendorConfirm(id: string) {
    if (useSupabaseBackend) {
      const quest = quests.find((item) => item.id === id);
      if (!quest) return;
      try {
        await vendorConfirmInSupabase(quest as Parameters<typeof vendorConfirmInSupabase>[0]);
        await refreshFromSupabase();
        completeMissionObjective(id, "vendor-confirmed", "Vendor confirmed items");
        completeMissionObjective(id, "vendor-paid", "Vendor wallet paid");
        completeMissionObjective(id, "receipt", "Receipt generated");
      } catch (error) {
        setBackendError(error instanceof Error ? error.message : "Could not confirm vendor items.");
      }
      return;
    }
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
    completeMissionObjective(id, "vendor-confirmed", "Vendor confirmed items");
    completeMissionObjective(id, "vendor-paid", "Vendor wallet paid");
    completeMissionObjective(id, "receipt", "Receipt generated");
  }

  async function confirmCompletion(id: string) {
    if (useSupabaseBackend) {
      try {
        await updateQuestStatusInSupabase(id, "completed", { live_tracking_status: "completed" });
        await refreshFromSupabase();
        completeMissionObjective(id, "confirmed", "Tasker confirmed completion");
        completeMissionObjective(id, "review", "Tasker reviewed work");
      } catch (error) {
        setBackendError(error instanceof Error ? error.message : "Could not confirm completion.");
      }
      return;
    }
    updateQuest(id, (quest) => ({
      ...quest,
      status: "completed",
      liveTracking: quest.liveTracking === "active" ? "completed" : quest.liveTracking,
    }));
    completeMissionObjective(id, "confirmed", "Tasker confirmed completion");
    completeMissionObjective(id, "review", "Tasker reviewed work");
  }

  async function releasePayout(id: string) {
    const quest = quests.find((item) => item.id === id);
    if (!quest || quest.workerRewardReleased) return;
    if (useSupabaseBackend) {
      try {
        await releasePayoutInSupabase(quest as Parameters<typeof releasePayoutInSupabase>[0]);
        await refreshFromSupabase();
        completeMissionObjective(id, "payout", "Payout released");
      } catch (error) {
        setBackendError(error instanceof Error ? error.message : "Could not release payout.");
      }
      return;
    }
    updateQuest(id, (item) => ({
      ...item,
      workerRewardReleased: true,
      escrowLocked: false,
    }));
    setWallet((current) => ({
      ...current,
      workerBalance: current.workerBalance + quest.reward,
    }));
    completeMissionObjective(id, "payout", "Payout released");
  }

  async function openDispute(
    id: string,
    input: string | DisputePayload = "Manual dispute opened from demo UI.",
  ) {
    const quest = quests.find((item) => item.id === id);
    if (!quest) return;
    const payload: DisputePayload =
      typeof input === "string"
        ? {
            openedBy: "tasker",
            reason: input,
            explanation: input,
            evidenceText: quest.proofText || quest.deliveryProof || "No extra evidence provided.",
          }
        : input;
    if (useSupabaseBackend) {
      try {
        await openDisputeInSupabase(
          quest as Parameters<typeof openDisputeInSupabase>[0],
          `${payload.reason}: ${payload.explanation}`,
        );
        await refreshFromSupabase();
        setSelectedTab("disputes");
        setAppSection("disputes");
        addMissionActivity(id, "Dispute opened", payload.reason);
      } catch (error) {
        setBackendError(error instanceof Error ? error.message : "Could not open dispute.");
      }
      return;
    }
    if (!disputes.some((dispute) => dispute.questId === id && dispute.status !== "finalized")) {
      const dispute: Dispute = {
        id: makeId("dispute"),
        questId: quest.id,
        questTitle: quest.title,
        taskerName: quest.tasker,
        workerName: quest.worker || "Unassigned worker",
        openedBy: payload.openedBy,
        reason: payload.reason,
        explanation: payload.explanation,
        evidence: [
          payload.evidenceText || quest.proofText || "No proof submitted yet",
          quest.receipt ? `Receipt ${quest.receipt.id}` : "No receipt",
          quest.deliveryProof || "No delivery proof",
          payload.attachmentName ? `Attachment ${payload.attachmentName}` : "No attachment",
        ],
        attachmentName: payload.attachmentName,
        status: "pending",
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setDisputes((current) => [dispute, ...current]);
    }
    updateQuest(id, (questItem) => ({ ...questItem, status: "disputed" }));
    setSelectedTab("disputes");
    setAppSection("disputes");
    addMissionActivity(id, "Dispute opened", payload.reason);
    mutateMission(id, (mission) => ({
      ...mission,
      unreadCount: mission.unreadCount + 1,
      chat: [
        ...mission.chat,
        {
          id: makeId("chat"),
          sender: "system",
          type: "system",
          body: `${payload.openedBy === "worker" ? "Worker" : "Tasker"} opened a dispute`,
          createdAt: nowLabel(),
          unread: true,
        },
      ],
    }));
  }

  async function recommendDispute(id: string) {
    if (useSupabaseBackend) {
      try {
        await recommendDisputeInSupabase(
          id,
          "Mediator recommends partial release based on proof, receipt, and chat evidence.",
        );
        await refreshFromSupabase();
      } catch (error) {
        setBackendError(error instanceof Error ? error.message : "Could not submit recommendation.");
      }
      return;
    }
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

  async function finalizeDispute(id: string, verdict: string) {
    const dispute = disputes.find((item) => item.id === id);
    if (!dispute) return;
    if (useSupabaseBackend) {
      try {
        await finalizeDisputeInSupabase(id, verdict);
        await refreshFromSupabase();
      } catch (error) {
        setBackendError(error instanceof Error ? error.message : "Could not finalize dispute.");
      }
      return;
    }
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
    applyForQuest,
    approveWorker,
    declineApplicant,
    closeApplications,
    extendApplicationWindow,
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

  const missionControls = {
    openMissionWorkspace,
    completeMissionObjective,
    sendMissionMessage,
    shareLiveLocation,
    clearMissionUnread,
    addMissionActivity,
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
      appSection={appSection}
      authEmail={authEmail}
      authMessage={authMessage}
      authMode={authMode}
      authPassword={authPassword}
      backendError={backendError}
      disputes={disputes}
      escrowLocked={escrowLocked}
      handleAuthSubmit={handleAuthSubmit}
      handleSignOut={handleSignOut}
      isPostQuestOpen={isPostQuestOpen}
      isSyncing={isSyncing}
      missionControls={missionControls}
      missionStates={missionStates}
      quests={quests}
      selectedTab={selectedTab}
      selectedQuestId={selectedQuestId}
      session={session}
      setAppSection={setAppSection}
      setAuthEmail={setAuthEmail}
      setAuthMode={setAuthMode}
      setAuthPassword={setAuthPassword}
      setCurrentView={setCurrentView}
      setIsPostQuestOpen={setIsPostQuestOpen}
      setSelectedTab={setSelectedTab}
      setSelectedQuestId={setSelectedQuestId}
      setShowBalance={setShowBalance}
      setSidebarCollapsed={setSidebarCollapsed}
      setUserRole={setUserRole}
      showBalance={showBalance}
      sidebarCollapsed={sidebarCollapsed}
      userRole={userRole}
      vendorPaid={vendorPaid}
      wallet={wallet}
      workerReleased={workerReleased}
      useSupabaseBackend={useSupabaseBackend}
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

type MissionControls = {
  openMissionWorkspace: (id: string, section?: AppSection) => void;
  completeMissionObjective: (id: string, objectiveId: ObjectiveKey, detail?: string) => void;
  sendMissionMessage: (
    id: string,
    body: string,
    sender: ChatMessage["sender"],
    type?: ChatMessageType,
  ) => void;
  shareLiveLocation: (id: string) => void;
  clearMissionUnread: (id: string) => void;
  addMissionActivity: (id: string, title: string, detail: string) => void;
};

function AppDashboard({
  actions,
  appSection,
  authEmail,
  authMessage,
  authMode,
  authPassword,
  backendError,
  disputes,
  escrowLocked,
  handleAuthSubmit,
  handleSignOut,
  isPostQuestOpen,
  isSyncing,
  missionControls,
  missionStates,
  onCreateQuest,
  quests,
  selectedTab,
  selectedQuestId,
  session,
  setAppSection,
  setAuthEmail,
  setAuthMode,
  setAuthPassword,
  setCurrentView,
  setIsPostQuestOpen,
  setSelectedTab,
  setSelectedQuestId,
  setShowBalance,
  setSidebarCollapsed,
  setUserRole,
  showBalance,
  sidebarCollapsed,
  userRole,
  vendorPaid,
  wallet,
  workerReleased,
  useSupabaseBackend,
}: {
  actions: {
    applyForQuest: (id: string, note: string, eta: string) => void;
    approveWorker: (id: string, applicationId: string) => void;
    declineApplicant: (id: string, applicationId: string) => void;
    closeApplications: (id: string) => void;
    extendApplicationWindow: (id: string) => void;
    startQuest: (id: string) => void;
    submitProof: (id: string, proof: string, file?: File | null) => void;
    markItemsPicked: (id: string) => void;
    vendorConfirm: (id: string) => void;
    confirmCompletion: (id: string) => void;
    releasePayout: (id: string) => void;
    openDispute: (id: string, input?: string | DisputePayload) => void;
    recommendDispute: (id: string) => void;
    finalizeDispute: (id: string, verdict: string) => void;
  };
  appSection: AppSection;
  authEmail: string;
  authMessage: string;
  authMode: "sign-in" | "sign-up";
  authPassword: string;
  backendError: string;
  disputes: Dispute[];
  escrowLocked: number;
  handleAuthSubmit: () => void;
  handleSignOut: () => void;
  isPostQuestOpen: boolean;
  isSyncing: boolean;
  missionControls: MissionControls;
  missionStates: Record<string, MissionState>;
  onCreateQuest: (form: QuestFormState) => void | Promise<void>;
  quests: Quest[];
  selectedTab: DashboardTab;
  selectedQuestId: string;
  session: AuthSession | null;
  setAppSection: (section: AppSection) => void;
  setAuthEmail: (email: string) => void;
  setAuthMode: (mode: "sign-in" | "sign-up") => void;
  setAuthPassword: (password: string) => void;
  setCurrentView: (view: "landing" | "app") => void;
  setIsPostQuestOpen: (open: boolean) => void;
  setSelectedTab: (tab: DashboardTab) => void;
  setSelectedQuestId: (id: string) => void;
  setShowBalance: (show: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setUserRole: (role: UserRole) => void;
  showBalance: boolean;
  sidebarCollapsed: boolean;
  userRole: UserRole;
  vendorPaid: number;
  wallet: WalletState;
  workerReleased: number;
  useSupabaseBackend: boolean;
}) {
  const visibleQuests = useMemo(() => {
    const publishVisible = quests.filter(
      (quest) => quest.tasker === "You" || questPublishState(quest).isVisible,
    );
    if (selectedTab === "online") return publishVisible.filter((quest) => quest.type === "online");
    if (selectedTab === "physical") return publishVisible.filter((quest) => quest.type === "physical");
    if (selectedTab === "vendor") return publishVisible.filter((quest) => quest.type === "vendor");
    if (selectedTab === "my-quests") {
      if (userRole === "worker") return publishVisible.filter((quest) => quest.worker === "You");
      return quests.filter((quest) => quest.tasker === "You");
    }
    return publishVisible;
  }, [quests, selectedTab, userRole]);

  const balanceForRole =
    userRole === "worker"
      ? wallet.workerBalance
      : userRole === "vendor"
        ? wallet.vendorBalance
        : userRole === "mediator"
          ? wallet.mediatorBalance
          : wallet.taskerBalance;

  const acceptedQuests = useMemo(
    () =>
      quests.filter(
        (quest) =>
          quest.worker === "You" &&
          ["accepted", "worker-approved", "in-progress", "awaiting-confirmation", "completed"].includes(quest.status),
      ),
    [quests],
  );
  const activeQuests = useMemo(
    () =>
      acceptedQuests.filter((quest) =>
        ["accepted", "worker-approved", "in-progress", "awaiting-confirmation"].includes(quest.status),
      ),
    [acceptedQuests],
  );
  const selectedQuest = quests.find((quest) => quest.id === selectedQuestId) ?? activeQuests[0] ?? quests[0];
  const selectedMission = selectedQuest
    ? ensureMissionState(missionStates, selectedQuest)
    : undefined;
  const unreadMessages = Object.values(missionStates).reduce(
    (sum, mission) => sum + mission.unreadCount,
    0,
  );
  const pendingCheckIns = Object.values(missionStates).reduce(
    (sum, mission) => sum + mission.checkIns.filter((checkIn) => !checkIn.completedAt).length,
    0,
  );
  const openDisputes = disputes.filter((dispute) => dispute.status !== "finalized").length;
  const receiptCount = quests.filter((quest) => quest.receipt).length;
  const sidebarCounts = {
    accepted: acceptedQuests.length,
    active: activeQuests.length,
    unread: unreadMessages,
    checkIns: pendingCheckIns,
    disputes: openDisputes,
    receipts: receiptCount,
  };

  const feed = (
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
        <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]">
          <div className="min-w-0">
            <QuestGrid actions={actions} quests={visibleQuests} userRole={userRole} />
          </div>
          <div className="min-w-0">
            <VendorRulesCard />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="my-quests">
        <QuestGrid actions={actions} quests={visibleQuests} userRole={userRole} />
      </TabsContent>
      <TabsContent value="disputes">
        <DisputesPanel actions={actions} disputes={disputes} userRole={userRole} />
      </TabsContent>
    </Tabs>
  );

  function renderSection() {
    if (appSection === "quest-feed") return feed;
    if (appSection === "accepted-quests") {
      return (
        <AcceptedQuestsPanel
          actions={actions}
          onOpenMission={missionControls.openMissionWorkspace}
          quests={acceptedQuests}
          userRole={userRole}
        />
      );
    }
    if (appSection === "disputes") {
      return <DisputesPanel actions={actions} disputes={disputes} userRole={userRole} />;
    }
    if (appSection === "receipts") {
      return <VendorReceiptsPanel quests={quests} />;
    }
    if (appSection === "overview") {
      return (
        <div className="space-y-6">
          <BackendStatusCard
            authEmail={authEmail}
            authMessage={authMessage}
            authMode={authMode}
            authPassword={authPassword}
            backendError={backendError}
            handleAuthSubmit={handleAuthSubmit}
            handleSignOut={handleSignOut}
            isSyncing={isSyncing}
            session={session}
            setAuthEmail={setAuthEmail}
            setAuthMode={setAuthMode}
            setAuthPassword={setAuthPassword}
            useSupabaseBackend={useSupabaseBackend}
          />
          <WalletCards
            balance={balanceForRole}
            escrowLocked={escrowLocked}
            setShowBalance={setShowBalance}
            showBalance={showBalance}
            vendorPaid={vendorPaid}
            workerReleased={workerReleased}
          />
          <MissionOverview
            activeQuests={activeQuests}
            missionStates={missionStates}
            onOpenMission={missionControls.openMissionWorkspace}
            quests={quests}
          />
        </div>
      );
    }
    return (
      <MissionWorkspace
        actions={actions}
        focus={appSection}
        mission={selectedMission}
        missionControls={missionControls}
        quest={selectedQuest}
        userRole={userRole}
      />
    );
  }

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

      <div className="container max-w-7xl py-6 pb-28 lg:pb-8">
        <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
          <AppSidebar
            activeSection={appSection}
            counts={sidebarCounts}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            setActiveSection={setAppSection}
          />
          <main className="min-w-0 space-y-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge className="border-violet-500/20 bg-violet-500/10 text-violet-100" variant="outline">
                    Mission Control
                  </Badge>
                  {selectedQuest && (
                    <Badge variant="outline">
                      Active: {selectedQuest.title}
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {appSection === "overview" ? "Dashboard" : sectionTitle(appSection)}
                </h1>
                <p className="text-muted-foreground">
                  Manage quests, check-ins, chat, safety, and mission progress as {roleLabels[userRole]}.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  value={selectedQuest?.id ?? ""}
                  onValueChange={(value) => {
                    setSelectedQuestId(value);
                    missionControls.openMissionWorkspace(value, appSection === "overview" ? "active-quest" : appSection);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[260px]">
                    <SelectValue placeholder="Select active quest" />
                  </SelectTrigger>
                  <SelectContent>
                    {quests.map((quest) => (
                      <SelectItem key={quest.id} value={quest.id}>
                        {quest.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={userRole} onValueChange={(value) => setUserRole(value as UserRole)}>
                  <SelectTrigger className="w-full sm:w-[190px]">
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
            </div>
            {renderSection()}
          </main>
        </div>
      </div>

      <MobileMissionNav
        activeSection={appSection}
        counts={sidebarCounts}
        setActiveSection={setAppSection}
      />

      <PostQuestDialog
        isOpen={isPostQuestOpen}
        onCreateQuest={onCreateQuest}
        onOpenChange={setIsPostQuestOpen}
      />
    </div>
  );
}

const sidebarItems: Array<{
  id: AppSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  countKey?: keyof SidebarCounts;
}> = [
  { id: "overview", label: "Overview", icon: Target },
  { id: "quest-feed", label: "Quest Feed", icon: Search },
  { id: "accepted-quests", label: "Accepted Quests", icon: ClipboardCheck, countKey: "accepted" },
  { id: "active-quest", label: "Active Quest", icon: Radio, countKey: "active" },
  { id: "chat", label: "Chat", icon: MessageSquare, countKey: "unread" },
  { id: "objectives", label: "Mission Objectives", icon: ListChecks },
  { id: "check-ins", label: "Check-ins", icon: CheckCircle2, countKey: "checkIns" },
  { id: "receipts", label: "Vendor Receipts", icon: ReceiptText, countKey: "receipts" },
  { id: "disputes", label: "Disputes", icon: Scale, countKey: "disputes" },
  { id: "safety", label: "Safety Center", icon: ShieldAlert },
];

type SidebarCounts = {
  accepted: number;
  active: number;
  unread: number;
  checkIns: number;
  disputes: number;
  receipts: number;
};

function sectionTitle(section: AppSection) {
  return sidebarItems.find((item) => item.id === section)?.label ?? "Mission Control";
}

function AppSidebar({
  activeSection,
  counts,
  isCollapsed,
  onToggleCollapse,
  setActiveSection,
}: {
  activeSection: AppSection;
  counts: SidebarCounts;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  setActiveSection: (section: AppSection) => void;
}) {
  return (
    <aside
      className={`sticky top-20 hidden h-[calc(100vh-6rem)] shrink-0 rounded-xl border bg-card/55 p-3 backdrop-blur-xl lg:block ${
        isCollapsed ? "w-[76px]" : "w-[260px]"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <p className="text-sm font-semibold">Mission Nav</p>
            <p className="text-xs text-muted-foreground">Live quest workspace</p>
          </div>
        )}
        <Button size="icon" variant="ghost" onClick={onToggleCollapse}>
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="space-y-1">
        {sidebarItems.map((item) => {
          const count = item.countKey ? counts[item.countKey] : 0;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                active
                  ? "bg-gradient-to-r from-violet-500/20 to-cyan-500/15 text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
              onClick={() => setActiveSection(item.id)}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
              {!isCollapsed && count > 0 && (
                <Badge className="px-1.5 py-0 text-[10px]" variant="secondary">
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function MobileMissionNav({
  activeSection,
  counts,
  setActiveSection,
}: {
  activeSection: AppSection;
  counts: SidebarCounts;
  setActiveSection: (section: AppSection) => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/90 p-2 backdrop-blur-xl lg:hidden">
      <div className="flex gap-2 overflow-x-auto">
        {sidebarItems.map((item) => {
          const count = item.countKey ? counts[item.countKey] : 0;
          return (
            <button
              key={item.id}
              className={`relative flex min-w-[74px] flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] ${
                activeSection === item.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground"
              }`}
              onClick={() => setActiveSection(item.id)}
            >
              <item.icon className="h-4 w-4" />
              <span className="truncate">{item.label.split(" ")[0]}</span>
              {count > 0 && (
                <span className="absolute right-1 top-1 rounded-full bg-cyan-400 px-1 text-[9px] font-bold text-black">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MissionOverview({
  activeQuests,
  missionStates,
  onOpenMission,
  quests,
}: {
  activeQuests: Quest[];
  missionStates: Record<string, MissionState>;
  onOpenMission: (id: string) => void;
  quests: Quest[];
}) {
  const cards = [
    ["Total Quests", quests.length, "Posted, accepted, or available", Target],
    ["Active Missions", activeQuests.length, "Accepted work in motion", Radio],
    [
      "Mission Messages",
      Object.values(missionStates).reduce((sum, mission) => sum + mission.chat.length, 0),
      "Chat and system updates",
      MessageSquare,
    ],
  ] as const;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(([title, value, note, Icon]) => (
          <Card key={title}>
            <CardHeader>
              <Icon className="h-5 w-5 text-primary" />
              <CardTitle className="text-2xl">{value}</CardTitle>
              <CardDescription>{title}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{note}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Resume Mission</CardTitle>
          <CardDescription>Jump back into your most active quest workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(activeQuests.length ? activeQuests : quests.slice(0, 3)).map((quest) => (
            <button
              key={quest.id}
              className="w-full rounded-lg border bg-background/35 p-3 text-left transition hover:border-primary/50"
              onClick={() => onOpenMission(quest.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{quest.title}</span>
                <Badge className={statusClass(quest.status)} variant="outline">
                  {statusLabels[quest.status]}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {quest.type} mission · {currency(quest.reward)} reward
              </p>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function AcceptedQuestsPanel({
  actions,
  onOpenMission,
  quests,
  userRole,
}: {
  actions: QuestActions;
  onOpenMission: (id: string) => void;
  quests: Quest[];
  userRole: UserRole;
}) {
  if (quests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No accepted quests yet</CardTitle>
          <CardDescription>Switch to Worker, accept a quest, then open its mission workspace.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {quests.map((quest) => (
        <Card key={quest.id} className="min-w-0 bg-card/65 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{quest.title}</CardTitle>
                <CardDescription>
                  {quest.type} quest · Due {new Date(quest.deadline).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge className={statusClass(quest.status)} variant="outline">
                {statusLabels[quest.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border bg-background/35 p-3">
                <p className="text-xs text-muted-foreground">Reward</p>
                <p className="font-semibold">{currency(quest.reward)}</p>
              </div>
              <div className="rounded-lg border bg-background/35 p-3">
                <p className="text-xs text-muted-foreground">People</p>
                <p className="font-semibold">{quest.tasker} / {quest.worker}</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button className="w-full" onClick={() => onOpenMission(quest.id)}>
                Open Mission Workspace
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            {userRole === "worker" && (canWorkerOpenDispute(quest) || hasDisputeOpened(quest)) && (
              <PayoutDisputeBlock
                actions={actions}
                quest={quest}
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function canWorkerOpenDispute(quest: Quest) {
  return (
    quest.worker === "You" &&
    ["accepted", "worker-approved", "in-progress", "awaiting-confirmation"].includes(quest.status)
  );
}

function hasDisputeOpened(quest: Quest) {
  return quest.status === "disputed";
}

function DisputeDialogButton({
  disabled = false,
  label = "Open Dispute",
  openedBy,
  onSubmit,
  triggerClassName,
}: {
  disabled?: boolean;
  label?: string;
  openedBy: "tasker" | "worker";
  onSubmit: (payload: DisputePayload) => void;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(workerDisputeReasons[0]);
  const [explanation, setExplanation] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  function submit() {
    onSubmit({
      openedBy,
      reason,
      explanation: explanation || reason,
      evidenceText: evidenceText || "No extra evidence text provided.",
      attachmentName: attachmentName || undefined,
    });
    setOpen(false);
    setExplanation("");
    setEvidenceText("");
    setAttachmentName("");
  }

  return (
    <>
      <Button
        className={triggerClassName}
        disabled={disabled}
        variant={disabled ? "secondary" : "outline"}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{openedBy === "worker" ? "Worker Dispute" : "Tasker Dispute"}</DialogTitle>
            <DialogDescription>
              Add the issue, explanation, and proof so mediators can review the quest context.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workerDisputeReasons.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Explanation</Label>
              <Textarea
                placeholder="Explain what happened..."
                value={explanation}
                onChange={(event) => setExplanation(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Evidence / Proof Text</Label>
              <Textarea
                placeholder="Paste proof notes, links, chat summary, or receipt context..."
                value={evidenceText}
                onChange={(event) => setEvidenceText(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Mock Attachment</Label>
              <Input
                type="file"
                onChange={(event) => setAttachmentName(event.target.files?.[0]?.name ?? "")}
              />
              {attachmentName && <p className="text-xs text-muted-foreground">{attachmentName}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Submit Dispute</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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

function BackendStatusCard({
  authEmail,
  authMessage,
  authMode,
  authPassword,
  backendError,
  handleAuthSubmit,
  handleSignOut,
  isSyncing,
  session,
  setAuthEmail,
  setAuthMode,
  setAuthPassword,
  useSupabaseBackend,
}: {
  authEmail: string;
  authMessage: string;
  authMode: "sign-in" | "sign-up";
  authPassword: string;
  backendError: string;
  handleAuthSubmit: () => void;
  handleSignOut: () => void;
  isSyncing: boolean;
  session: AuthSession | null;
  setAuthEmail: (email: string) => void;
  setAuthMode: (mode: "sign-in" | "sign-up") => void;
  setAuthPassword: (password: string) => void;
  useSupabaseBackend: boolean;
}) {
  if (!isSupabaseConfigured) {
    return (
      <Card className="border-amber-500/20 bg-amber-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-amber-100">
            <Info className="h-4 w-4" />
            Demo mode active
          </CardTitle>
          <CardDescription className="text-amber-100/75">
            Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to enable Supabase Auth,
            database persistence, and Storage uploads. Until then, Side Quests uses the local fallback.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={useSupabaseBackend ? "border-emerald-500/20 bg-emerald-500/10" : ""}>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              {useSupabaseBackend ? "Supabase backend connected" : "Sign in to enable Supabase"}
            </CardTitle>
            <CardDescription>
              {session
                ? `${session.user.email} is syncing quests, disputes, receipts, payments, and uploads.`
                : "Email/password auth is required before writing to Supabase."}
            </CardDescription>
          </div>
          {session ? (
            <Button variant="outline" onClick={handleSignOut}>
              Sign out
            </Button>
          ) : (
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
              <Input
                placeholder="email"
                type="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
              />
              <Input
                placeholder="password"
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
              />
              <Select value={authMode} onValueChange={(value) => setAuthMode(value as "sign-in" | "sign-up")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sign-in">Sign in</SelectItem>
                  <SelectItem value="sign-up">Sign up</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAuthSubmit}>Continue</Button>
            </div>
          )}
        </div>
        {(authMessage || backendError || isSyncing) && (
          <p className="text-sm text-muted-foreground">
            {isSyncing ? "Syncing with Supabase..." : backendError || authMessage}
          </p>
        )}
      </CardHeader>
    </Card>
  );
}

function MissionWorkspace({
  actions,
  focus,
  mission,
  missionControls,
  quest,
  userRole,
}: {
  actions: QuestActions;
  focus: AppSection;
  mission?: MissionState;
  missionControls: MissionControls;
  quest?: Quest;
  userRole: UserRole;
}) {
  if (!quest || !mission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No active mission selected</CardTitle>
          <CardDescription>Accept a quest or select a mission from the dashboard.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const completed = mission.objectives.filter((objective) => objective.completedAt).length;
  const total = mission.objectives.length || 1;
  const progress = Math.round((completed / total) * 100);
  const showAll = focus === "active-quest";

  return (
    <div className="space-y-6">
      {showAll && (
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <QuestSummaryCard quest={quest} />
          <ProgressCard completed={completed} progress={progress} total={total} />
        </div>
      )}

      {showAll ? (
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <MissionObjectivesPanel
              actions={actions}
              mission={mission}
              missionControls={missionControls}
              quest={quest}
              userRole={userRole}
            />
            <CheckInsPanel mission={mission} />
            <ActivityTimeline mission={mission} />
          </div>
          <div className="space-y-4">
            <LocationMockCard mission={mission} missionControls={missionControls} quest={quest} />
            <MissionChatPanel
              mission={mission}
              missionControls={missionControls}
              quest={quest}
              userRole={userRole}
            />
            {(quest.type === "physical" || quest.type === "vendor") && (
              <SafetyCenterPanel quest={quest} />
            )}
          </div>
        </div>
      ) : null}

      {focus === "objectives" && (
        <MissionObjectivesPanel
          actions={actions}
          mission={mission}
          missionControls={missionControls}
          quest={quest}
          userRole={userRole}
        />
      )}
      {focus === "check-ins" && <CheckInsPanel mission={mission} />}
      {focus === "chat" && (
        <MissionChatPanel
          mission={mission}
          missionControls={missionControls}
          quest={quest}
          userRole={userRole}
        />
      )}
      {focus === "receipts" && <VendorReceiptsPanel quests={[quest]} />}
      {focus === "safety" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <SafetyCenterPanel quest={quest} />
          <LocationMockCard mission={mission} missionControls={missionControls} quest={quest} />
        </div>
      )}
    </div>
  );
}

function QuestSummaryCard({ quest }: { quest: Quest }) {
  return (
    <Card className="overflow-hidden bg-card/70 backdrop-blur-xl">
      <CardHeader>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <CardTitle className="text-2xl">{quest.title}</CardTitle>
            <CardDescription className="mt-2 max-w-2xl">{quest.description}</CardDescription>
          </div>
          <Badge className={statusClass(quest.status)} variant="outline">
            {statusLabels[quest.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Type", quest.type === "online" ? "Online" : quest.type === "vendor" ? "Vendor" : "Physical"],
          ["Reward", currency(quest.reward)],
          ["Tasker", quest.tasker],
          ["Worker", quest.worker || "Unassigned"],
          ["Deadline", new Date(quest.deadline).toLocaleDateString()],
          ["Campus", quest.campus || "Global"],
          ["Location", quest.location || "Online"],
          ["Vendor", quest.vendorName || "None"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-background/35 p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 truncate font-semibold">{value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ProgressCard({ completed, progress, total }: { completed: number; progress: number; total: number }) {
  return (
    <Card className="bg-gradient-to-br from-violet-500/15 to-cyan-500/10">
      <CardHeader>
        <CardTitle>Mission Progress</CardTitle>
        <CardDescription>
          {completed}/{total} objectives completed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-5xl font-bold">{progress}%</div>
        <div className="h-3 overflow-hidden rounded-full bg-background/60">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45 }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Check-ins update automatically when objectives are completed.
        </p>
      </CardContent>
    </Card>
  );
}

function MissionObjectivesPanel({
  actions,
  mission,
  missionControls,
  quest,
  userRole,
}: {
  actions: QuestActions;
  mission: MissionState;
  missionControls: MissionControls;
  quest: Quest;
  userRole: UserRole;
}) {
  function markArrived() {
    if (quest.status === "worker-approved" || quest.status === "accepted") actions.startQuest(quest.id);
    missionControls.completeMissionObjective(quest.id, "arrived", "Arrived at mission point");
  }

  function markPicked() {
    if (quest.type === "vendor") actions.markItemsPicked(quest.id);
    else missionControls.completeMissionObjective(quest.id, "picked", "Item picked up");
  }

  function submitWork() {
    actions.submitProof(
      quest.id,
      quest.type === "online"
        ? "Draft/proof submitted from mission workspace."
        : "Delivery proof uploaded from mission workspace.",
    );
    missionControls.completeMissionObjective(quest.id, quest.type === "online" ? "final" : "proof", "Proof uploaded");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mission Objectives</CardTitle>
        <CardDescription>Complete objectives to update check-ins and activity automatically.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {mission.objectives.map((objective, index) => (
            <div
              key={objective.id}
              className="flex items-center gap-3 rounded-lg border bg-background/35 p-3"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  objective.completedAt ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {objective.completedAt ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{objective.label}</p>
                <p className="text-xs text-muted-foreground">
                  {objective.completedAt ? `Completed ${objective.completedAt}` : "Pending check-in"}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {userRole === "worker" && (
            <>
              {(quest.status === "worker-approved" || quest.status === "accepted") && <Button onClick={() => actions.startQuest(quest.id)}>Start Quest</Button>}
              {(quest.type === "physical" || quest.type === "vendor") && (
                <Button variant="outline" onClick={markArrived}>
                  Mark Arrived
                </Button>
              )}
              {(quest.type === "physical" || quest.type === "vendor") && (
                <Button variant="outline" onClick={markPicked}>
                  Mark Picked Up
                </Button>
              )}
              <Button variant="outline" onClick={submitWork}>
                {quest.type === "online" ? "Submit Work" : "Upload Proof"}
              </Button>
              {quest.type !== "online" && (
                <Button onClick={() => actions.submitProof(quest.id, "Marked delivered at handoff point.")}>
                  Mark Delivered
                </Button>
              )}
              {canWorkerOpenDispute(quest) && (
                <DisputeDialogButton
                  openedBy="worker"
                  onSubmit={(payload) => actions.openDispute(quest.id, payload)}
                />
              )}
            </>
          )}
          {userRole === "tasker" && (
            <>
              <Button onClick={() => actions.confirmCompletion(quest.id)}>Confirm Delivery</Button>
              <Button
                variant="outline"
                onClick={() =>
                  missionControls.addMissionActivity(
                    quest.id,
                    "Revision requested",
                    "Tasker asked worker to adjust or clarify the submitted proof.",
                  )
                }
              >
                Request Revision
              </Button>
              <DisputeDialogButton
                openedBy="tasker"
                onSubmit={(payload) => actions.openDispute(quest.id, payload)}
              />
            </>
          )}
          {userRole === "vendor" && quest.type === "vendor" && (
            <>
              <Button onClick={() => actions.vendorConfirm(quest.id)}>Confirm Items</Button>
              <Button variant="outline" onClick={() => actions.vendorConfirm(quest.id)}>
                Issue Receipt
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CheckInsPanel({ mission }: { mission: MissionState }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Check-ins</CardTitle>
        <CardDescription>Every objective has a matching mission check-in.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {mission.checkIns.map((checkIn) => (
          <div key={checkIn.id} className="flex items-center gap-3 rounded-lg border bg-background/35 p-3">
            {checkIn.completedAt ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">{checkIn.label}</p>
              <p className="text-xs text-muted-foreground">
                {checkIn.completedAt ? checkIn.completedAt : "Waiting for objective completion"}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MissionChatPanel({
  mission,
  missionControls,
  quest,
  userRole,
}: {
  mission: MissionState;
  missionControls: MissionControls;
  quest: Quest;
  userRole: UserRole;
}) {
  const [draft, setDraft] = useState("");
  const sender = personaForRole(userRole);

  function send(type: ChatMessageType = "text", body = draft) {
    missionControls.sendMissionMessage(quest.id, body, sender, type);
    setDraft("");
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Mission Chat</CardTitle>
            <CardDescription>Tasker, worker, vendor, and system mission updates.</CardDescription>
          </div>
          {mission.unreadCount > 0 && (
            <Badge variant="secondary">{mission.unreadCount} unread</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {mission.chat.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg border p-3 ${
                message.sender === "system"
                  ? "bg-cyan-500/10 text-cyan-50"
                  : message.sender === sender
                    ? "ml-8 bg-violet-500/15"
                    : "mr-8 bg-background/45"
              }`}
            >
              <div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span className="capitalize">{message.sender}</span>
                <span>{message.createdAt}</span>
              </div>
              {message.type === "location" ? (
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3">
                  <MapPinned className="mb-2 h-5 w-5 text-cyan-200" />
                  <p className="font-medium">{message.body}</p>
                  <p className="text-xs text-cyan-100/75">Mock map card · no real maps connected</p>
                </div>
              ) : (
                <p className="text-sm">{message.body}</p>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => send("image", "Mock image proof shared.")}>
            <Paperclip className="h-4 w-4" />
            Image
          </Button>
          <Button variant="outline" onClick={() => send("video", "Mock video proof shared.")}>
            <Video className="h-4 w-4" />
            Video
          </Button>
          <Button variant="outline" onClick={() => missionControls.shareLiveLocation(quest.id)}>
            <Navigation className="h-4 w-4" />
            Share Live Location
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Send a mission update..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") send();
            }}
          />
          <Button onClick={() => send()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LocationMockCard({
  mission,
  missionControls,
  quest,
}: {
  mission: MissionState;
  missionControls: MissionControls;
  quest: Quest;
}) {
  return (
    <Card className="border-cyan-500/20 bg-cyan-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPinned className="h-5 w-5" />
          Live Location Mock
        </CardTitle>
        <CardDescription>
          {quest.type === "online" ? "Online quests do not require live tracking." : "Campus route status for the mission."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative h-36 overflow-hidden rounded-lg border border-cyan-500/20 bg-[radial-gradient(circle_at_25%_35%,rgba(34,211,238,0.35),transparent_18%),linear-gradient(135deg,rgba(15,23,42,0.9),rgba(49,46,129,0.45))]">
          <div className="absolute left-5 top-5 h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.8)]" />
          <div className="absolute right-8 top-1/2 h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.8)]" />
          <div className="absolute bottom-7 left-1/2 h-3 w-3 rounded-full bg-violet-300 shadow-[0_0_30px_rgba(167,139,250,0.8)]" />
          <div className="absolute inset-x-8 top-1/2 h-px rotate-[-12deg] bg-cyan-200/50" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">{mission.locationStatus}</p>
            <p className="text-xs text-muted-foreground">
              {mission.liveLocationShared ? "Live tracking active" : "Location sharing idle"}
            </p>
          </div>
          <Button variant="outline" onClick={() => missionControls.shareLiveLocation(quest.id)}>
            Share Live Location
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SafetyCenterPanel({ quest }: { quest: Quest }) {
  if (quest.type === "online") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Safety Center</CardTitle>
          <CardDescription>Online quests use proof, chat history, escrow, and disputes.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-500/20 bg-emerald-500/10">
      <CardHeader>
        <CardTitle>Safety Center</CardTitle>
        <CardDescription>Campus-only controls for physical and vendor missions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-100" variant="outline">
            <GraduationCap className="h-3 w-3" />
            Campus verified
          </Badge>
          <Badge className="border-cyan-500/20 bg-cyan-500/10 text-cyan-100" variant="outline">
            <Radio className="h-3 w-3" />
            Live tracking active
          </Badge>
        </div>
        <div className="rounded-lg border bg-background/35 p-3">
          <p className="text-xs text-muted-foreground">Safe handoff point</p>
          <p className="font-semibold">{quest.safeHandoffPoint || "Campus safe zone"}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Button variant="destructive">
            <Siren className="h-4 w-4" />
            SOS
          </Button>
          <Button variant="outline">
            <ShieldAlert className="h-4 w-4" />
            Report
          </Button>
          <Button variant="outline">
            <Users className="h-4 w-4" />
            Trusted Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityTimeline({ mission }: { mission: MissionState }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>Mission events, check-ins, receipts, and disputes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {mission.activity.map((event) => (
          <div key={event.id} className="flex gap-3">
            <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-300" />
            <div className="rounded-lg border bg-background/35 p-3">
              <p className="font-medium">{event.title}</p>
              <p className="text-sm text-muted-foreground">{event.detail}</p>
              <p className="mt-1 text-xs text-muted-foreground">{event.createdAt}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function VendorReceiptsPanel({ quests }: { quests: Quest[] }) {
  const receipts = quests.filter((quest) => quest.receipt);
  if (receipts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendor Receipts</CardTitle>
          <CardDescription>No digital receipt has been generated for this mission yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {receipts.map((quest) => (
        <Card key={quest.id}>
          <CardHeader>
            <CardTitle>{quest.title}</CardTitle>
            <CardDescription>
              Item funds went directly to {quest.vendorWallet}. Worker reward remains separate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReceiptBlock receipt={quest.receipt} />
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
      className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      {quests.map((quest) => (
        <QuestCard actions={actions} key={quest.id} quest={quest} userRole={userRole} />
      ))}
    </motion.div>
  );
}

type QuestActions = {
  applyForQuest: (id: string, note: string, eta: string) => void;
  approveWorker: (id: string, applicationId: string) => void;
  declineApplicant: (id: string, applicationId: string) => void;
  closeApplications: (id: string) => void;
  extendApplicationWindow: (id: string) => void;
  startQuest: (id: string) => void;
  submitProof: (id: string, proof: string, file?: File | null) => void;
  markItemsPicked: (id: string) => void;
  vendorConfirm: (id: string) => void;
  confirmCompletion: (id: string) => void;
  releasePayout: (id: string) => void;
  openDispute: (id: string, input?: string | DisputePayload) => void;
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
  const [proofFile, setProofFile] = useState<File | null>(null);
  const timing = questPublishState(quest);
  const isTaskerOwner = quest.tasker === "You";
  const canWorkerAct = userRole === "worker" && quest.status !== "completed" && quest.status !== "disputed" && timing.isVisible;
  const canTaskerAct = userRole === "tasker" && isTaskerOwner;
  const canVendorAct = userRole === "vendor" && quest.type === "vendor";

  return (
    <motion.div className="min-w-0" variants={itemFadeIn}>
      <Card className="group h-full min-w-0 border-border/60 bg-card/65 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-[0_22px_70px_rgba(99,102,241,0.18)]">
        <CardHeader className="pb-3">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                {getCategoryIcon(quest.category)}
              </div>
              <div className="min-w-0">
                <CardTitle className="break-words text-base leading-6 transition-colors group-hover:text-primary">
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
                  {quest.late || timing.isLate ? (
                    <Badge className="border-red-500/30 bg-red-500/15 text-red-200" variant="outline">
                      Late
                    </Badge>
                  ) : null}
                  {quest.verified && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="shrink-0 text-left sm:text-right">
              <div className="flex items-center gap-1 text-lg font-bold text-primary sm:justify-end">
                <DollarSign className="h-4 w-4" />
                {quest.reward}
              </div>
              <p className="text-[11px] text-muted-foreground">worker reward</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="line-clamp-3 break-words text-sm leading-6 text-muted-foreground">
            {quest.description}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge className={urgencyClass(quest.urgency)} variant="outline">
              <Clock className="mr-1 h-3 w-3" />
              {quest.urgency}
            </Badge>
            <Badge variant="outline">Due {new Date(quest.deadline).toLocaleDateString()}</Badge>
            <Badge variant="outline">{timing.publishLabel}</Badge>
            <Badge variant="outline">
              Applications: {(quest.applications ?? []).length}
            </Badge>
            {(quest.status === "open-for-applications" || quest.status === "reviewing-applicants") && (
              <Badge variant="outline">Window: {timing.applicationCountdown}</Badge>
            )}
            {quest.worker && <Badge variant="outline">Mission deadline: {timing.deadlineCountdown}</Badge>}
            <Badge variant="outline">Tasker: {quest.tasker}</Badge>
            {quest.worker && <Badge variant="outline">Worker: {quest.worker}</Badge>}
          </div>

          {canTaskerAct && (quest.applications ?? []).length > 0 && (
            <ApplicantSummary actions={actions} quest={quest} />
          )}

          {quest.type === "physical" && <PhysicalSafety quest={quest} />}
          {quest.type === "vendor" && <VendorState quest={quest} />}
          {quest.type === "online" && (
            <OnlineState actions={actions} quest={quest} userRole={userRole} />
          )}

          {(canWorkerAct || canTaskerAct || canVendorAct) && (
            <div className="space-y-3 rounded-lg border bg-background/35 p-3">
              {canWorkerAct && (
                <WorkerActions
                  actions={actions}
                  proof={proof}
                  proofFile={proofFile}
                  quest={quest}
                  setProof={setProof}
                  setProofFile={setProofFile}
                />
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
  proofFile,
  quest,
  setProof,
  setProofFile,
}: {
  actions: QuestActions;
  proof: string;
  proofFile: File | null;
  quest: Quest;
  setProof: (proof: string) => void;
  setProofFile: (file: File | null) => void;
}) {
  const [note, setNote] = useState("");
  const [eta, setEta] = useState("");
  const alreadyApplied = (quest.applications ?? []).some(
    (application) => application.workerName === "You" && application.status !== "declined",
  );
  return (
    <div className="space-y-2">
      {(quest.status === "open-for-applications" || quest.status === "open") && (
        <div className="space-y-2">
          <Textarea
            placeholder="Short application note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <Input
            placeholder={quest.type === "online" ? "Estimated completion time" : "Estimated arrival time"}
            value={eta}
            onChange={(event) => setEta(event.target.value)}
          />
          <Button
            className="w-full"
            disabled={alreadyApplied}
            onClick={() => actions.applyForQuest(quest.id, note, eta)}
          >
            {alreadyApplied ? "Application Sent" : "Apply for Quest"}
          </Button>
        </div>
      )}
      {(quest.status === "worker-approved" || quest.status === "accepted") && quest.worker === "You" && (
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
          <Input
            type="file"
            onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
          />
          <Button className="w-full" onClick={() => actions.submitProof(quest.id, proof, proofFile)}>
            {quest.type === "online" ? "Submit Proof" : "Mark Delivered / Submitted"}
          </Button>
        </>
      )}
    </div>
  );
}

function TaskerActions({ actions, quest }: { actions: QuestActions; quest: Quest }) {
  return (
    <div className="space-y-2">
      {quest.status === "open-for-applications" && (
        <Button className="w-full" variant="outline" onClick={() => actions.closeApplications(quest.id)}>
          Close Applications Early
        </Button>
      )}
      {(quest.status === "expired" || quest.status === "reviewing-applicants") && (
        <Button className="w-full" variant="outline" onClick={() => actions.extendApplicationWindow(quest.id)}>
          Extend Application Window
        </Button>
      )}
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
        <DisputeDialogButton
          openedBy="tasker"
          onSubmit={(payload) => actions.openDispute(quest.id, payload)}
          triggerClassName="w-full"
        />
      )}
      {quest.receipt && (
        <ReceiptBlock receipt={quest.receipt} />
      )}
    </div>
  );
}

function ApplicantSummary({ actions, quest }: { actions: QuestActions; quest: Quest }) {
  const applicants = quest.applications ?? [];
  const recommended = applicants.find((application) => application.recommended && application.status === "pending");
  return (
    <div className="space-y-3 rounded-lg border bg-background/35 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Applicants</p>
          <p className="text-xs text-muted-foreground">
            Compare workers before approving one mission owner.
          </p>
        </div>
        {recommended && (
          <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-200" variant="outline">
            Recommended: {recommended.workerName}
          </Badge>
        )}
      </div>
      <div className="grid gap-3">
        {applicants.map((application) => (
          <div key={application.id} className="rounded-lg border bg-card/60 p-3">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{application.workerName}</p>
                  <Badge variant="secondary">{application.profileBadge}</Badge>
                  <Badge className={application.status === "approved" ? statusClass("worker-approved") : application.status === "declined" ? statusClass("expired") : statusClass("reviewing-applicants")} variant="outline">
                    {application.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{application.note}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">ETA {application.eta}</Badge>
                  {application.distance && <Badge variant="outline">{application.distance}</Badge>}
                  <Badge variant="outline">{application.rating} rating</Badge>
                  <Badge variant="outline">{application.completedQuests} completed</Badge>
                  <Badge variant="outline">{application.completionRate}% completion</Badge>
                  <Badge variant="outline">{application.disputeRate}% disputes</Badge>
                  <Badge variant="outline">{application.lastActive}</Badge>
                </div>
              </div>
              {application.status === "pending" && (
                <div className="flex gap-2 sm:flex-col">
                  <Button size="sm" onClick={() => actions.approveWorker(quest.id, application.id)}>
                    Approve Worker
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => actions.declineApplicant(quest.id, application.id)}>
                    Decline
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
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
    <div className="min-w-0 space-y-2 rounded-lg border bg-background/35 p-3 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="shrink-0">Vendor</span>
        <span className="min-w-0 break-words font-medium text-foreground">{quest.vendorName}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="shrink-0">Item funds</span>
        <span className="min-w-0 break-words font-medium text-cyan-200">
          {currency(quest.itemFunds)} paid directly to vendor wallet
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="shrink-0">Worker reward</span>
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

function PayoutDisputeBlock({ actions, quest }: { actions: QuestActions; quest: Quest }) {
  const opened = hasDisputeOpened(quest);
  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          Payout: {quest.workerRewardReleased ? "Released" : "Locked in escrow"}
        </p>
        {opened && (
          <Badge className="border-rose-500/25 bg-rose-500/12 text-rose-200" variant="outline">
            Dispute exists
          </Badge>
        )}
      </div>
      <DisputeDialogButton
        disabled={opened}
        label={opened ? "Dispute Opened" : "Open Dispute"}
        openedBy="worker"
        onSubmit={(payload) => actions.openDispute(quest.id, payload)}
        triggerClassName={`w-full border-rose-500/30 ${
          opened
            ? ""
            : "bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 hover:text-rose-50"
        }`}
      />
    </div>
  );
}

function OnlineState({
  actions,
  quest,
  userRole,
}: {
  actions: QuestActions;
  quest: Quest;
  userRole: UserRole;
}) {
  return (
    <div className="rounded-lg border bg-background/35 p-3 text-xs text-muted-foreground">
      <p>Proof: {quest.proofText || "No file/proof submitted yet."}</p>
      {userRole === "worker" && (canWorkerOpenDispute(quest) || hasDisputeOpened(quest)) ? (
        <PayoutDisputeBlock actions={actions} quest={quest} />
      ) : (
        <p className="mt-1">
          Payout: {quest.workerRewardReleased ? "Released" : "Locked in escrow"}
        </p>
      )}
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
    <Card className="min-w-0">
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
          <div key={step} className="flex min-w-0 gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {index + 1}
            </span>
            <span className="min-w-0 break-words">{step}</span>
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
              <p className="mt-1 text-xs text-muted-foreground">
                Opened by {dispute.openedBy || "tasker"}
              </p>
              {dispute.explanation && (
                <p className="mt-2 text-sm text-muted-foreground">{dispute.explanation}</p>
              )}
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
  onCreateQuest: (form: QuestFormState) => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState<QuestFormState>(defaultQuestForm);

  function update<K extends keyof QuestFormState>(key: K, value: QuestFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    await onCreateQuest(form);
    setForm(defaultQuestForm);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Post a New Quest</DialogTitle>
          <DialogDescription>
            Create a quest and lock escrow in Supabase when connected, or in demo fallback mode.
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
              <Label htmlFor="urgency">Urgency</Label>
              <Select value={form.urgency} onValueChange={(value) => update("urgency", value as Quest["urgency"])}>
                <SelectTrigger id="urgency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Legacy Date Label</Label>
              <Input
                id="deadline"
                type="date"
                value={form.deadline}
                onChange={(event) => update("deadline", event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="publishNow">Publish immediately</Label>
                <p className="text-sm text-muted-foreground">Turn this off to schedule when workers can see it.</p>
              </div>
              <Switch
                checked={form.publishImmediately}
                id="publishNow"
                onCheckedChange={(checked) => update("publishImmediately", checked)}
              />
            </div>
            {!form.publishImmediately && (
              <div className="space-y-2">
                <Label htmlFor="publishAt">Scheduled Publish Date/Time</Label>
                <Input
                  id="publishAt"
                  type="datetime-local"
                  value={form.scheduledPublishAt}
                  onChange={(event) => update("scheduledPublishAt", event.target.value)}
                />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Application Window</Label>
                <Select
                  value={form.applicationWindow}
                  onValueChange={(value) => update("applicationWindow", value as QuestFormState["applicationWindow"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {form.applicationWindow === "custom" && (
                  <Input
                    type="number"
                    value={form.customApplicationWindow}
                    onChange={(event) => update("customApplicationWindow", event.target.value)}
                    placeholder="Minutes"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Completion Deadline</Label>
                <Select
                  value={form.completionDeadlinePreset}
                  onValueChange={(value) => update("completionDeadlinePreset", value as QuestFormState["completionDeadlinePreset"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="custom">Custom date/time</SelectItem>
                  </SelectContent>
                </Select>
                {form.completionDeadlinePreset === "custom" && (
                  <Input
                    type="datetime-local"
                    value={form.customCompletionDeadline}
                    onChange={(event) => update("customCompletionDeadline", event.target.value)}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
      <motion.section
        id="features"
        className="w-full bg-muted/25 py-12 md:py-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.22 }}
        variants={fadeIn}
      >
        <div className="container max-w-7xl px-4 md:px-6">
          <motion.div className="space-y-12" variants={staggerContainer}>
            <motion.div className="space-y-4 text-center" variants={itemFadeIn}>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Functional Local Demo
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Create quests, accept work, submit proof, generate receipts, open disputes,
                and refresh without losing local demo state.
              </p>
            </motion.div>
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
                <motion.div key={feature.title} variants={itemFadeIn}>
                  <Card className="h-full border-2 bg-card/60 backdrop-blur">
                    <CardHeader>
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        id="how-it-works"
        className="w-full py-12 md:py-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.24 }}
        variants={fadeIn}
      >
        <div className="container max-w-7xl px-4 md:px-6">
          <motion.div className="grid gap-8 md:grid-cols-3" variants={staggerContainer}>
            {[
              [FileText, "Post", "Tasker creates quest and fake escrow is locked."],
              [Users, "Complete", "Worker progresses through accept, start, proof, and delivery."],
              [Scale, "Resolve", "Disputes move through mediator recommendation and admin verdict."],
            ].map(([Icon, title, copy]) => (
              <motion.div key={title as string} variants={itemFadeIn}>
                <Card className="h-full text-center">
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
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        id="safety"
        className="w-full bg-muted/25 py-12 md:py-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.24 }}
        variants={fadeIn}
      >
        <div className="container max-w-7xl px-4 md:px-6">
          <motion.div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" variants={staggerContainer}>
            {[
              [Shield, "University Verification", "Campus badges and physical quest restrictions."],
              [MapPin, "Live Tracking Mock", "Status switches from inactive to active to completed."],
              [AlertCircle, "SOS and Reports", "Physical quest cards show safety actions."],
            ].map(([Icon, title, copy]) => (
              <motion.div key={title as string} variants={itemFadeIn}>
                <Card className="h-full">
                  <CardHeader>
                    <Icon className="mb-2 h-8 w-8 text-primary" />
                    <CardTitle className="text-lg">{title as string}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{copy as string}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>
    </>
  );
}

function Footer() {
  return (
    <motion.footer
      className="w-full border-t py-12"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.2 }}
      variants={fadeIn}
    >
      <div className="container max-w-7xl px-4 md:px-6">
        <motion.div className="grid gap-8 md:grid-cols-4" variants={staggerContainer}>
          <motion.div className="space-y-4" variants={itemFadeIn}>
            <Brand />
            <p className="text-sm text-muted-foreground">
              Turn everyday tasks into quests. Local-state Phase 2 demo.
            </p>
          </motion.div>
          {[
            { title: "Product", links: ["Features", "How It Works", "Safety"] },
            { title: "Demo", links: ["LocalStorage", "Mock Wallet", "Disputes"] },
            { title: "Next", links: ["Backend", "Solana Wallet", "Campus Verification"] },
          ].map((section) => (
            <motion.div key={section.title} className="space-y-4" variants={itemFadeIn}>
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
            </motion.div>
          ))}
        </motion.div>
        <Separator className="my-8" />
        <motion.p className="text-sm text-muted-foreground" variants={itemFadeIn}>
          (c) {new Date().getFullYear()} Side Quests. All rights reserved.
        </motion.p>
      </div>
    </motion.footer>
  );
}
