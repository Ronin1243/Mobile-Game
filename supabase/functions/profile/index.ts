import { withSupabase } from "@supabase/server";

/**
 * GET /functions/v1/profile
 *
 * Returns the calling user's profile row from a (future) `profiles` table.
 * Auth mode "user" means Supabase validates the Bearer JWT before this code
 * runs; ctx.supabase is an RLS-scoped client so users only see their own rows.
 */
export default {
  fetch: withSupabase({ auth: "user" }, async (_req, ctx) => {
    const { data, error } = await ctx.supabase
      .from("profiles")
      .select("*")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json(data);
  }),
};
