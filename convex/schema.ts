import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  skips: defineTable({
    user: v.string(),
    timestamp: v.number(),
  }),
});
