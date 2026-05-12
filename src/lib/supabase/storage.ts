import { supabase } from "./client";

const BUCKET_BY_KIND = {
  proof: "quest-proofs",
  receipt: "quest-receipts",
  submission: "quest-submissions",
} as const;

export type UploadKind = keyof typeof BUCKET_BY_KIND;

export async function uploadQuestFile({
  file,
  kind,
  questId,
}: {
  file: File;
  kind: UploadKind;
  questId: string;
}) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const bucket = BUCKET_BY_KIND[kind];
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${questId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return {
    bucket,
    path,
    publicUrl: data.publicUrl,
  };
}

