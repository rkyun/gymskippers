import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const add = mutation({
  args: { user: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("skips", {
      user: args.user,
      timestamp: Date.now(),
    });
  },
});

export const getRecent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("skips")
      .order("desc")
      .take(20);
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const skips = await ctx.db.query("skips").collect();
    
    const stats: Record<string, { skips: number } | any> = {
      "Yaroslav": { skips: 0 },
      "Michał": { skips: 0 },
      "Valentyn": { skips: 0 },
      totalPool: 0
    };

    skips.forEach(skip => {
      if (stats[skip.user]) {
        stats[skip.user].skips++;
      }
    });

    const COST_PER_SKIP = 50;
    stats.totalPool = (stats["Yaroslav"].skips + stats["Michał"].skips + stats["Valentyn"].skips) * COST_PER_SKIP;

    return stats;
  },
});
