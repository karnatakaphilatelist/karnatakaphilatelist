import { isAuthorised, pingDatabase } from "@/lib/keep-alive";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export async function GET(request: Request) {
  if (!isAuthorised(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ ok: false, error: "Unauthorised" }, { status: 401 });
  }

  const result = await pingDatabase(createSupabasePublicClient());
  if (!result.ok) console.error("[keep-alive] Database check failed:", result.error);
  return Response.json(result, {
    status: result.ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
