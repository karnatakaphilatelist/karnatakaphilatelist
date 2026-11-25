"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ContributionType } from "@/lib/contributions";

export type ContributionStatus = "pending" | "approved" | "rejected";

export interface ContributionRow {
  id: number;
  created_at: string;
  office_id: number | null;
  type: ContributionType;
  note: string | null;
  photo_url: string | null;
  status: ContributionStatus;
  office: { name: string; district: string | null } | null;
}

/** Whether the signed-in user is allowed to review contributions. */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return false;
  return data.is_admin === true;
}

/** All contributions, newest first, with the post office they refer to. */
export async function listContributions(): Promise<ContributionRow[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("contributions")
    .select(
      "id, created_at, office_id, type, note, photo_url, status, office:post_offices(name, district)"
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  // Supabase types the embed as an array even for a to-one relation.
  return (data ?? []).map((row) => ({
    ...row,
    office: Array.isArray(row.office) ? (row.office[0] ?? null) : row.office,
  })) as ContributionRow[];
}

/** Marks a contribution reviewed, recording who reviewed it and when. */
export async function reviewContribution(
  id: number,
  status: "approved" | "rejected",
  reviewerId: string
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("contributions")
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: reviewerId })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
