import { withSupabase } from "@supabase/server";

/**
 * GET /functions/v1/leaderboard?limit=50&character=ranger
 *
 * Public endpoint — no JWT required.
 * Returns top runs from the leaderboard view, optional filter by character.
 *
 * supabase/config.toml: verify_jwt = false
 */
export default {
  fetch: withSupabase({ auth: "publishable" }, async (req, ctx) => {
    const url = new URL(req.url);
    const limit     = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);
    const character = url.searchParams.get("character");

    let query = ctx.supabase
      .from("leaderboard")
      .select("id,player_name,score,survived_ms,kills,level,character_id,created_at")
      .order("score", { ascending: false })
      .limit(limit);

    if (character) query = query.eq("character_id", character);

    const { data, error } = await query;

    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json(data);
  }),
};
