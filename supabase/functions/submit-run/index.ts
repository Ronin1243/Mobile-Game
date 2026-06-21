import { withSupabase } from "npm:@supabase/server@^1.1.0";

/**
 * POST /functions/v1/submit-run
 *
 * Body: RunResult from the client (survivedMs, kills, level, score,
 * coinsEarned, characterId, playerName).
 *
 * Inserts a run row and returns the run's leaderboard rank.
 * Auth mode "user" — a valid JWT is required.
 */
export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    let body: {
      survivedMs?: number;
      kills?: number;
      level?: number;
      score?: number;
      coinsEarned?: number;
      characterId?: string;
      playerName?: string;
    };

    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const userId = (await ctx.supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: run, error } = await ctx.supabase
      .from("runs")
      .insert({
        user_id:      userId,
        player_name:  body.playerName  ?? "Anonymous",
        score:        body.score        ?? 0,
        survived_ms:  body.survivedMs   ?? 0,
        kills:        body.kills        ?? 0,
        level:        body.level        ?? 1,
        coins_earned: body.coinsEarned  ?? 0,
        character_id: body.characterId  ?? "ranger"
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    // Return the run's rank in the all-time leaderboard.
    const { count } = await ctx.supabase
      .from("runs")
      .select("*", { count: "exact", head: true })
      .gt("score", run.score);

    return Response.json({ run, rank: (count ?? 0) + 1 });
  }),
};
