import { supabase } from "./client";

export type DbQuestType = "online" | "physical" | "vendor";
export type DbQuestStatus =
  | "open"
  | "accepted"
  | "in-progress"
  | "awaiting-confirmation"
  | "completed"
  | "disputed";
export type DbQuestCategory =
  | "design"
  | "development"
  | "writing"
  | "delivery"
  | "shopping"
  | "printing"
  | "medicine"
  | "transport"
  | "other";
export type DbDisputeStatus = "pending" | "recommended" | "finalized";

export interface AppQuestShape {
  id: string;
  title: string;
  description: string;
  category: DbQuestCategory;
  type: DbQuestType;
  reward: number;
  itemFunds: number;
  vendorName?: string;
  vendorWallet?: string;
  itemList: string[];
  location?: string;
  campus?: string;
  safeHandoffPoint?: string;
  deadline: string;
  status: DbQuestStatus;
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
  receipt?: {
    id: string;
    vendor: string;
    wallet: string;
    amount: number;
    items: string[];
    issuedAt: string;
  };
  escrowLocked: boolean;
  vendorPaidAmount: number;
  workerRewardReleased: boolean;
  reimbursementEnabled: boolean;
}

export interface AppDisputeShape {
  id: string;
  questId: string;
  questTitle: string;
  taskerName: string;
  workerName: string;
  reason: string;
  evidence: string[];
  status: DbDisputeStatus;
  recommendation?: string;
  verdict?: string;
  createdAt: string;
}

export interface AppQuestFormShape {
  type: DbQuestType;
  title: string;
  description: string;
  category: DbQuestCategory;
  reward: string;
  itemFunds: string;
  deadline: string;
  campus: string;
  safeHandoffPoint: string;
  vendorName: string;
  itemList: string;
  reimbursementEnabled: boolean;
}

type QuestRow = {
  id: string;
  title: string;
  description: string | null;
  category: DbQuestCategory;
  type: DbQuestType;
  reward_amount: number;
  item_funds_amount: number;
  campus_text: string | null;
  location_text: string | null;
  safe_handoff_point: string | null;
  deadline: string | null;
  status: DbQuestStatus;
  urgency: "low" | "medium" | "high";
  verified_required: boolean;
  proof_text: string | null;
  delivery_proof_url: string | null;
  live_tracking_status: "inactive" | "active" | "completed";
  items_picked: boolean;
  vendor_confirmed: boolean;
  escrow_locked: boolean;
  vendor_paid_amount: number;
  worker_reward_released: boolean;
  reimbursement_enabled: boolean;
  created_at: string;
  tasker: { display_name: string | null; email: string | null } | null;
  worker: { display_name: string | null; email: string | null } | null;
  vendors: { name: string; wallet_placeholder: string | null } | null;
  quest_items: { name: string }[];
  receipts: {
    id: string;
    vendor_name: string;
    vendor_wallet: string | null;
    total_amount: number;
    issued_at: string;
  }[];
};

function splitItems(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function nameFromProfile(profile: { display_name: string | null; email: string | null } | null) {
  return profile?.display_name || profile?.email || "Unknown user";
}

function mapQuest(row: QuestRow): AppQuestShape {
  const receipt = row.receipts?.[0];
  const items = row.quest_items?.map((item) => item.name) ?? [];

  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    category: row.category,
    type: row.type,
    reward: Number(row.reward_amount || 0),
    itemFunds: Number(row.item_funds_amount || 0),
    vendorName: row.vendors?.name,
    vendorWallet: row.vendors?.wallet_placeholder || undefined,
    itemList: items,
    location: row.location_text || undefined,
    campus: row.campus_text || undefined,
    safeHandoffPoint: row.safe_handoff_point || undefined,
    deadline: row.deadline || row.created_at.slice(0, 10),
    status: row.status,
    urgency: row.urgency,
    verified: row.verified_required,
    tasker: nameFromProfile(row.tasker),
    worker: row.worker ? nameFromProfile(row.worker) : undefined,
    createdAt: row.created_at.slice(0, 10),
    proofText: row.proof_text || undefined,
    deliveryProof: row.delivery_proof_url || undefined,
    liveTracking: row.live_tracking_status,
    itemsPicked: row.items_picked,
    vendorConfirmed: row.vendor_confirmed,
    receipt: receipt
      ? {
          id: receipt.id,
          vendor: receipt.vendor_name,
          wallet: receipt.vendor_wallet || "vendor_wallet.sol",
          amount: Number(receipt.total_amount || 0),
          items,
          issuedAt: new Date(receipt.issued_at).toLocaleString(),
        }
      : undefined,
    escrowLocked: row.escrow_locked,
    vendorPaidAmount: Number(row.vendor_paid_amount || 0),
    workerRewardReleased: row.worker_reward_released,
    reimbursementEnabled: row.reimbursement_enabled,
  };
}

async function ensureProfile() {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("You must be signed in.");

  const email = auth.user.email || "user@sidequests.local";
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: auth.user.id,
        email,
        display_name: email.split("@")[0],
        role: "tasker",
        verification_status: "pending",
        wallet_placeholder: `${auth.user.id.slice(0, 8)}.sol`,
      },
      { onConflict: "id" },
    )
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

async function getVendorId(name: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const profileId = await ensureProfile();
  const vendorName = name || "Campus Mart";
  const { data, error } = await supabase
    .from("vendors")
    .upsert(
      {
        name: vendorName,
        owner_profile_id: profileId,
        wallet_placeholder: `vendor_${vendorName.toLowerCase().replace(/\W+/g, "_")}.sol`,
        verification_status: "verified",
      },
      { onConflict: "name" },
    )
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function fetchQuestsFromSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("quests")
    .select(
      `
      *,
      tasker:profiles!quests_tasker_id_fkey(display_name,email),
      worker:profiles!quests_worker_id_fkey(display_name,email),
      vendors(name,wallet_placeholder),
      quest_items(name),
      receipts(id,vendor_name,vendor_wallet,total_amount,issued_at)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as QuestRow[]).map(mapQuest);
}

export async function fetchDisputesFromSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("disputes")
    .select(
      `
      *,
      quests(title),
      tasker:profiles!disputes_tasker_id_fkey(display_name,email),
      worker:profiles!disputes_worker_id_fkey(display_name,email),
      dispute_evidence(file_url,notes)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    questId: row.quest_id,
    questTitle: row.quests?.title || "Untitled quest",
    taskerName: nameFromProfile(row.tasker),
    workerName: nameFromProfile(row.worker),
    reason: row.reason,
    evidence: (row.dispute_evidence ?? []).map(
      (item: { file_url: string | null; notes: string | null }) =>
        item.file_url || item.notes || "Evidence note",
    ),
    status: row.status,
    recommendation: row.recommendation || undefined,
    verdict: row.final_verdict || undefined,
    createdAt: row.created_at.slice(0, 10),
  })) as AppDisputeShape[];
}

export async function createQuestInSupabase(form: AppQuestFormShape) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const profileId = await ensureProfile();
  const vendorId = form.type === "vendor" ? await getVendorId(form.vendorName) : null;
  const itemFunds = form.type === "vendor" ? Number(form.itemFunds) || 0 : 0;
  const reward = Number(form.reward) || 0;

  const { data: quest, error } = await supabase
    .from("quests")
    .insert({
      tasker_id: profileId,
      vendor_id: vendorId,
      title: form.title || "Untitled quest",
      description: form.description || "No description provided yet.",
      category: form.category,
      type: form.type,
      reward_amount: reward,
      item_funds_amount: itemFunds,
      campus_text: form.type === "online" ? null : form.campus,
      location_text: form.type === "online" ? null : form.campus,
      safe_handoff_point: form.type === "online" ? null : form.safeHandoffPoint,
      deadline: form.deadline || null,
      reimbursement_enabled: form.reimbursementEnabled,
      verified_required: form.type !== "online",
      status: "open",
      escrow_locked: true,
    })
    .select("id")
    .single();

  if (error) throw error;

  const items = form.type === "vendor" ? splitItems(form.itemList) : [];
  if (items.length) {
    const { error: itemError } = await supabase.from("quest_items").insert(
      items.map((name, index) => ({
        quest_id: quest.id,
        name,
        quantity: 1,
        sort_order: index,
      })),
    );
    if (itemError) throw itemError;
  }

  await supabase.from("payments").insert([
    {
      quest_id: quest.id,
      payer_profile_id: profileId,
      amount: reward + itemFunds,
      payment_type: "escrow_lock",
      status: "succeeded",
    },
  ]);

  await logQuestEvent(quest.id, "quest_created", { source: "web" });
}

export async function updateQuestStatusInSupabase(
  questId: string,
  status: DbQuestStatus,
  extra: Record<string, unknown> = {},
) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("quests").update({ status, ...extra }).eq("id", questId);
  if (error) throw error;
  await logQuestEvent(questId, status, extra);
}

export async function acceptQuestInSupabase(questId: string) {
  const profileId = await ensureProfile();
  await updateQuestStatusInSupabase(questId, "accepted", { worker_id: profileId });
}

export async function startQuestInSupabase(questId: string, tracking: boolean) {
  await updateQuestStatusInSupabase(questId, "in-progress", {
    live_tracking_status: tracking ? "active" : "inactive",
  });
}

export async function submitProofInSupabase(questId: string, proof: string, fileUrl?: string) {
  await updateQuestStatusInSupabase(questId, "awaiting-confirmation", {
    proof_text: proof || "Proof submitted.",
    delivery_proof_url: fileUrl || null,
    live_tracking_status: "completed",
  });
}

export async function markItemsPickedInSupabase(questId: string) {
  await updateQuestStatusInSupabase(questId, "in-progress", {
    items_picked: true,
    live_tracking_status: "active",
  });
}

export async function vendorConfirmInSupabase(quest: AppQuestShape) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const vendorWallet = quest.vendorWallet || "vendor_wallet.sol";
  const { error: questError } = await supabase
    .from("quests")
    .update({
      vendor_confirmed: true,
      vendor_paid_amount: quest.itemFunds,
    })
    .eq("id", quest.id);
  if (questError) throw questError;

  const { error: receiptError } = await supabase.from("receipts").insert({
    quest_id: quest.id,
    vendor_name: quest.vendorName || "Verified vendor",
    vendor_wallet: vendorWallet,
    total_amount: quest.itemFunds,
    receipt_url: null,
  });
  if (receiptError) throw receiptError;

  await supabase.from("payments").insert({
    quest_id: quest.id,
    amount: quest.itemFunds,
    payment_type: "vendor_payment",
    status: "succeeded",
    destination_wallet: vendorWallet,
  });
  await logQuestEvent(quest.id, "vendor_confirmed", { vendorWallet });
}

export async function releasePayoutInSupabase(quest: AppQuestShape) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase
    .from("quests")
    .update({
      worker_reward_released: true,
      escrow_locked: false,
    })
    .eq("id", quest.id);
  if (error) throw error;
  await supabase.from("payments").insert({
    quest_id: quest.id,
    amount: quest.reward,
    payment_type: "worker_reward",
    status: "succeeded",
  });
  await logQuestEvent(quest.id, "worker_reward_released", { amount: quest.reward });
}

export async function openDisputeInSupabase(quest: AppQuestShape, reason: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const profileId = await ensureProfile();
  await updateQuestStatusInSupabase(quest.id, "disputed");
  const { data, error } = await supabase
    .from("disputes")
    .insert({
      quest_id: quest.id,
      tasker_id: profileId,
      reason,
      status: "pending",
    })
    .select("id")
    .single();
  if (error) throw error;
  await supabase.from("dispute_evidence").insert({
    dispute_id: data.id,
    notes: quest.proofText || quest.deliveryProof || "No proof submitted yet",
  });
}

export async function recommendDisputeInSupabase(disputeId: string, recommendation: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase
    .from("disputes")
    .update({ status: "recommended", recommendation })
    .eq("id", disputeId);
  if (error) throw error;
}

export async function finalizeDisputeInSupabase(disputeId: string, verdict: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase
    .from("disputes")
    .update({ status: "finalized", final_verdict: verdict })
    .eq("id", disputeId);
  if (error) throw error;
}

async function logQuestEvent(questId: string, eventType: string, metadata: Record<string, unknown>) {
  if (!supabase) return;
  const { data: auth } = await supabase.auth.getUser();
  await supabase.from("quest_events").insert({
    quest_id: questId,
    actor_profile_id: auth.user?.id ?? null,
    event_type: eventType,
    metadata,
  });
}

