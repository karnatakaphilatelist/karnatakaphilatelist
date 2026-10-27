/**
 * Free Supabase projects pause after about a week without activity. A paused
 * project cannot sign anyone in or save a visit, so a scheduled job (see
 * vercel.json) calls the keep-alive route once a day, which makes one tiny query.
 */

interface PingClient {
  from: (table: string) => {
    select: (
      columns: string,
      options: { count: "exact"; head: true },
    ) => PromiseLike<{ count: number | null; error: { message: string } | null }>;
  };
}

export type PingResult =
  | { ok: true; postOffices: number | null }
  | { ok: false; error: string };

export async function pingDatabase(client: PingClient): Promise<PingResult> {
  try {
    const { count, error } = await client
      .from("post_offices")
      .select("id", { count: "exact", head: true });
    if (error) return { ok: false, error: error.message };
    return { ok: true, postOffices: count };
  } catch (caught) {
    return { ok: false, error: caught instanceof Error ? caught.message : "Unknown error" };
  }
}

/**
 * When CRON_SECRET is set, Vercel sends it as a bearer token on cron requests,
 * so only the scheduler (not a random visitor) can trigger the query. When it
 * is not set the route stays open: it is read-only and cheap.
 */
export function isAuthorised(authorizationHeader: string | null, secret: string | undefined): boolean {
  if (!secret) return true;
  return authorizationHeader === `Bearer ${secret}`;
}
