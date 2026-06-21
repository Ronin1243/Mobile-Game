import { withSupabase } from "@supabase/server";

/**
 * GET /functions/v1/leaderboard
 *
 * Public endpoint — no JWT required. Uses the publishable key so it can query
 * rows that are readable without authentication (e.g. a public leaderboard
 * view with RLS policy `FOR SELECT USING (true)`).
 *
 * In supabase/config.toml set:
 *   [functions.leaderboard]
 *   verify_jwt = false
 */
export default {
  fetch: withSupabase({ auth: "publishable" }, async (req, ctx) => {
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);

    const { data, error } = await ctx.supabase
      .from("leaderboard")
      .select("player_name, score, survived_sec, kills, level")
      .order("score", { ascending: false })
      .limit(limit);

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json(data);
  }),
};
