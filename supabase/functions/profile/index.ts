import { withSupabase } from "@supabase/server";

/**
 * GET  /functions/v1/profile  — fetch the authenticated user's profile
 * DELETE /functions/v1/profile — reset profile to defaults (dev helper)
 */
export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    const userId = (await ctx.supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (req.method === "GET") {
      const { data, error } = await ctx.supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) return Response.json({ error: error.message }, { status: 400 });
      return Response.json(data);
    }

    return new Response("Method Not Allowed", { status: 405 });
  }),
};
