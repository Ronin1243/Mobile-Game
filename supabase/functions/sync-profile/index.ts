import { withSupabase } from "@supabase/server";

/**
 * POST /functions/v1/sync-profile
 *
 * Body: the client's local SaveData (coins, gems, equippedCharacter,
 * ownedCharacters, upgrades). Upserts the authenticated user's profile row.
 *
 * The client always holds the authoritative local copy; this function
 * merges it server-side, taking the MAX of coins/gems so a client that
 * hasn't synced in a while never overwrites a higher cloud value.
 */
export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    let body: {
      coins?: number;
      gems?: number;
      equippedCharacter?: string;
      ownedCharacters?: string[];
      upgrades?: Record<string, number>;
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

    // Fetch the current cloud profile so we can take the max of currencies.
    const { data: existing } = await ctx.supabase
      .from("profiles")
      .select("coins, gems")
      .eq("id", userId)
      .single();

    const coins = Math.max(body.coins ?? 0, existing?.coins ?? 0);
    const gems  = Math.max(body.gems  ?? 0, existing?.gems  ?? 0);

    const { data, error } = await ctx.supabase
      .from("profiles")
      .upsert({
        id: userId,
        coins,
        gems,
        equipped_character: body.equippedCharacter ?? "ranger",
        owned_characters:   body.ownedCharacters   ?? ["ranger"],
        upgrades:           body.upgrades           ?? {}
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json(data);
  }),
};
