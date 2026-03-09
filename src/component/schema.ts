import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── Messages ──────────────────────────────────────────────────
  messages: defineTable({
    sessionId: v.string(),
    gateway: v.string(),
    gatewayMessageId: v.optional(v.string()),
    channelId: v.any(),
    userId: v.any(),
    direction: v.string(), // "inbound" | "outbound"
    content: v.string(),
    contentType: v.optional(v.string()), // "text" | "image" | "audio" | "video" | "file"
    metadata: v.optional(v.any()),
    threadId: v.optional(v.string()),
    replyToId: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_session_timestamp", ["sessionId", "timestamp"])
    .index("by_thread", ["threadId", "timestamp"])
    .index("by_gateway_messageId", ["gateway", "gatewayMessageId"])
    .index("by_channel", ["channelId", "timestamp"]),

  // ─── Sessions ──────────────────────────────────────────────────
  sessions: defineTable({
    sessionKey: v.string(),
    scope: v.string(), // "user" | "channel" | "peer"
    gateway: v.string(),
    userId: v.any(),
    channelId: v.any(),
    lastActivityAt: v.number(),
    createdAt: v.number(),
    metadata: v.optional(v.any()),
    active: v.boolean(),
  })
    .index("by_session_key", ["sessionKey"])
    .index("by_user", ["userId"])
    .index("by_gateway", ["gateway"])
    .index("by_active_lastActivity", ["active", "lastActivityAt"]),

  // ─── Gateways ──────────────────────────────────────────────────
  gateways: defineTable({
    gatewayId: v.string(),
    name: v.string(),
    type: v.string(), // "whatsapp" | "telegram" | "discord" | "slack" | "web" | custom
    config: v.optional(v.any()),
    active: v.boolean(),
    createdAt: v.number(),
  }).index("by_gatewayId", ["gatewayId"]),

  // ─── Deduplication ─────────────────────────────────────────────
  processedWebhooks: defineTable({
    dedupKey: v.string(),
    processedAt: v.number(),
  })
    .index("by_dedupKey", ["dedupKey"])
    .index("by_processedAt", ["processedAt"]),
});
