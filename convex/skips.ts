import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get cost per skip from config, default to 50 if not set
async function getCostPerSkipValue(ctx: any) {
  const config = await ctx.db
    .query("config")
    .withIndex("by_key", (q: any) => q.eq("key", "costPerSkip"))
    .first();
  
  if (!config) {
    // Initialize with default value if not exists
    await ctx.db.insert("config", {
      key: "costPerSkip",
      value: 50,
    });
    return 50;
  }
  
  return (config.value as number) || 50;
}

export const add = mutation({
  args: { 
    user: v.string(),
  },
  handler: async (ctx, args) => {
    const costPerSkip = await getCostPerSkipValue(ctx);
    
    await ctx.db.insert("skips", {
      user: args.user,
      timestamp: Date.now(),
      cost: costPerSkip,
    });
  },
});

export const getCostPerSkip = query({
  args: {},
  handler: async (ctx) => {
    return await getCostPerSkipValue(ctx);
  },
});

export const setCostPerSkip = mutation({
  args: {
    cost: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("config")
      .withIndex("by_key", (q: any) => q.eq("key", "costPerSkip"))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, { value: args.cost });
    } else {
      await ctx.db.insert("config", {
        key: "costPerSkip",
        value: args.cost,
      });
    }
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
    const defaultCost = await getCostPerSkipValue(ctx);
    
    // Initialize counters and total costs with ASCII-safe keys
    let yaroslavSkips = 0;
    let michalSkips = 0;
    let valentynSkips = 0;
    let yaroslavTotalCost = 0;
    let michalTotalCost = 0;
    let valentynTotalCost = 0;

    // Map display names from database to ASCII keys and sum costs
    // Handle both "Michal" and "Michał" from database
    // Use default cost if skip doesn't have cost field (for old records)
    skips.forEach(skip => {
      const cost = (skip.cost !== undefined && skip.cost !== null) ? Number(skip.cost) : defaultCost;
      if (skip.user === "Yaroslav") {
        yaroslavSkips++;
        yaroslavTotalCost += cost;
      } else if (skip.user === "Michal" || skip.user === "Michał") {
        michalSkips++;
        michalTotalCost += cost;
      } else if (skip.user === "Valentyn") {
        valentynSkips++;
        valentynTotalCost += cost;
      }
    });

    const totalPool = yaroslavTotalCost + michalTotalCost + valentynTotalCost;

    // Build result object with only ASCII-safe keys
    // Ensure all values are numbers
    return {
      Yaroslav: { 
        skips: yaroslavSkips, 
        totalCost: Math.round(yaroslavTotalCost * 100) / 100 
      },
      Michal: { 
        skips: michalSkips, 
        totalCost: Math.round(michalTotalCost * 100) / 100 
      },
      Valentyn: { 
        skips: valentynSkips, 
        totalCost: Math.round(valentynTotalCost * 100) / 100 
      },
      totalPool: Math.round(totalPool * 100) / 100
    };
  },
});
