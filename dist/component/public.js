import { mutation, query } from "./_generated/server.js";
import { v } from "convex/values";
// ─── Helpers ─────────────────────────────────────────────────────
function computeSessionKey(gateway, userId, channelId, scope) {
    switch (scope) {
        case "user":
            return `${gateway}:user:${JSON.stringify(userId)}`;
        case "channel":
            return `${gateway}:channel:${JSON.stringify(channelId)}`;
        case "peer":
        default:
            return `${gateway}:peer:${JSON.stringify(userId)}:${JSON.stringify(channelId)}`;
    }
}
function makeDedupKey(gateway, gatewayMessageId) {
    return `${gateway}:${gatewayMessageId}`;
}
// ─── Webhook Processing ──────────────────────────────────────────
/**
 * Process an inbound message from a ClawdBot gateway webhook.
 * Handles deduplication, session resolution, and message storage.
 * Returns the stored message ID and session ID, or null if deduplicated.
 */
export const processInbound = mutation({
    args: {
        gateway: v.string(),
        gatewayMessageId: v.optional(v.string()),
        channelId: v.any(),
        userId: v.any(),
        content: v.string(),
        contentType: v.optional(v.string()),
        metadata: v.optional(v.any()),
        threadId: v.optional(v.string()),
        replyToId: v.optional(v.string()),
        timestamp: v.optional(v.number()),
        sessionScope: v.optional(v.string()),
    },
    returns: v.union(v.object({
        messageId: v.string(),
        sessionId: v.string(),
        deduplicated: v.boolean(),
    }), v.null()),
    handler: async (ctx, args) => {
        const ts = args.timestamp ?? Date.now();
        // ── Deduplication ──
        if (args.gatewayMessageId) {
            const dedupKey = makeDedupKey(args.gateway, args.gatewayMessageId);
            const existing = await ctx.db
                .query("processedWebhooks")
                .withIndex("by_dedupKey", (q) => q.eq("dedupKey", dedupKey))
                .first();
            if (existing) {
                return null; // Already processed
            }
            await ctx.db.insert("processedWebhooks", {
                dedupKey,
                processedAt: Date.now(),
            });
        }
        // ── Session resolution ──
        const scope = args.sessionScope ?? "peer";
        const sessionKey = computeSessionKey(args.gateway, args.userId, args.channelId, scope);
        let session = await ctx.db
            .query("sessions")
            .withIndex("by_session_key", (q) => q.eq("sessionKey", sessionKey))
            .first();
        if (session) {
            await ctx.db.patch(session._id, {
                lastActivityAt: ts,
                active: true,
            });
        }
        else {
            const sessionDoc = await ctx.db.insert("sessions", {
                sessionKey,
                scope,
                gateway: args.gateway,
                userId: args.userId,
                channelId: args.channelId,
                lastActivityAt: ts,
                createdAt: ts,
                active: true,
            });
            session = await ctx.db.get(sessionDoc);
        }
        const sessionId = session._id;
        // ── Store message ──
        const messageId = await ctx.db.insert("messages", {
            sessionId,
            gateway: args.gateway,
            gatewayMessageId: args.gatewayMessageId,
            channelId: args.channelId,
            userId: args.userId,
            direction: "inbound",
            content: args.content,
            contentType: args.contentType ?? "text",
            metadata: args.metadata,
            threadId: args.threadId,
            replyToId: args.replyToId,
            timestamp: ts,
        });
        return {
            messageId: messageId,
            sessionId,
            deduplicated: false,
        };
    },
});
/**
 * Store an outbound message (sent by the bot/agent to the user).
 */
export const sendOutbound = mutation({
    args: {
        sessionId: v.string(),
        gateway: v.string(),
        gatewayMessageId: v.optional(v.string()),
        channelId: v.any(),
        userId: v.any(),
        content: v.string(),
        contentType: v.optional(v.string()),
        metadata: v.optional(v.any()),
        threadId: v.optional(v.string()),
        replyToId: v.optional(v.string()),
        timestamp: v.optional(v.number()),
    },
    returns: v.string(),
    handler: async (ctx, args) => {
        const ts = args.timestamp ?? Date.now();
        // Update session activity
        const session = await ctx.db
            .query("sessions")
            .withIndex("by_session_key", (q) => q.eq("sessionKey", args.sessionId))
            .first();
        // Try direct ID lookup if session key doesn't match
        if (!session) {
            try {
                const directSession = await ctx.db.get(args.sessionId);
                if (directSession) {
                    await ctx.db.patch(directSession._id, { lastActivityAt: ts });
                }
            }
            catch {
                // sessionId not a valid doc ID, that's fine
            }
        }
        else {
            await ctx.db.patch(session._id, { lastActivityAt: ts });
        }
        const messageId = await ctx.db.insert("messages", {
            sessionId: args.sessionId,
            gateway: args.gateway,
            gatewayMessageId: args.gatewayMessageId,
            channelId: args.channelId,
            userId: args.userId,
            direction: "outbound",
            content: args.content,
            contentType: args.contentType ?? "text",
            metadata: args.metadata,
            threadId: args.threadId,
            replyToId: args.replyToId,
            timestamp: ts,
        });
        return messageId;
    },
});
// ─── Session Management ──────────────────────────────────────────
/**
 * Get or create a session based on the scope (per-user, per-channel, per-peer).
 */
export const getOrCreateSession = mutation({
    args: {
        gateway: v.string(),
        userId: v.any(),
        channelId: v.any(),
        scope: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    returns: v.object({
        sessionId: v.string(),
        created: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const scope = args.scope ?? "peer";
        const sessionKey = computeSessionKey(args.gateway, args.userId, args.channelId, scope);
        const existing = await ctx.db
            .query("sessions")
            .withIndex("by_session_key", (q) => q.eq("sessionKey", sessionKey))
            .first();
        if (existing) {
            if (!existing.active) {
                await ctx.db.patch(existing._id, { active: true });
            }
            return { sessionId: existing._id, created: false };
        }
        const now = Date.now();
        const id = await ctx.db.insert("sessions", {
            sessionKey,
            scope,
            gateway: args.gateway,
            userId: args.userId,
            channelId: args.channelId,
            lastActivityAt: now,
            createdAt: now,
            metadata: args.metadata,
            active: true,
        });
        return { sessionId: id, created: true };
    },
});
/**
 * Get a session by its document ID.
 */
export const getSession = query({
    args: {
        sessionId: v.string(),
    },
    returns: v.union(v.object({
        sessionId: v.string(),
        sessionKey: v.string(),
        scope: v.string(),
        gateway: v.string(),
        userId: v.any(),
        channelId: v.any(),
        lastActivityAt: v.number(),
        createdAt: v.number(),
        metadata: v.optional(v.any()),
        active: v.boolean(),
    }), v.null()),
    handler: async (ctx, args) => {
        try {
            const session = await ctx.db.get(args.sessionId);
            if (!session)
                return null;
            return {
                sessionId: session._id,
                sessionKey: session.sessionKey,
                scope: session.scope,
                gateway: session.gateway,
                userId: session.userId,
                channelId: session.channelId,
                lastActivityAt: session.lastActivityAt,
                createdAt: session.createdAt,
                metadata: session.metadata,
                active: session.active,
            };
        }
        catch {
            return null;
        }
    },
});
/**
 * List sessions with optional filters.
 */
export const listSessions = query({
    args: {
        userId: v.optional(v.any()),
        gateway: v.optional(v.string()),
        activeOnly: v.optional(v.boolean()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.object({
        sessionId: v.string(),
        sessionKey: v.string(),
        scope: v.string(),
        gateway: v.string(),
        userId: v.any(),
        channelId: v.any(),
        lastActivityAt: v.number(),
        createdAt: v.number(),
        metadata: v.optional(v.any()),
        active: v.boolean(),
    })),
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;
        let sessions;
        if (args.userId !== undefined) {
            sessions = await ctx.db
                .query("sessions")
                .withIndex("by_user", (q) => q.eq("userId", args.userId))
                .collect();
        }
        else if (args.gateway !== undefined) {
            sessions = await ctx.db
                .query("sessions")
                .withIndex("by_gateway", (q) => q.eq("gateway", args.gateway))
                .collect();
        }
        else {
            sessions = await ctx.db.query("sessions").collect();
        }
        // Apply filters
        if (args.activeOnly) {
            sessions = sessions.filter((s) => s.active);
        }
        // Sort by lastActivityAt descending
        sessions.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
        return sessions.slice(0, limit).map((s) => ({
            sessionId: s._id,
            sessionKey: s.sessionKey,
            scope: s.scope,
            gateway: s.gateway,
            userId: s.userId,
            channelId: s.channelId,
            lastActivityAt: s.lastActivityAt,
            createdAt: s.createdAt,
            metadata: s.metadata,
            active: s.active,
        }));
    },
});
/**
 * End a session (mark as inactive).
 */
export const endSession = mutation({
    args: {
        sessionId: v.string(),
    },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        try {
            const session = await ctx.db.get(args.sessionId);
            if (!session)
                return false;
            await ctx.db.patch(session._id, { active: false });
            return true;
        }
        catch {
            return false;
        }
    },
});
// ─── Conversation History ────────────────────────────────────────
/**
 * Get messages for a session with cursor-based pagination.
 * Pass `before` timestamp to paginate backwards.
 */
export const getMessages = query({
    args: {
        sessionId: v.string(),
        limit: v.optional(v.number()),
        before: v.optional(v.number()),
        after: v.optional(v.number()),
    },
    returns: v.object({
        messages: v.array(v.object({
            messageId: v.string(),
            sessionId: v.string(),
            gateway: v.string(),
            gatewayMessageId: v.optional(v.string()),
            channelId: v.any(),
            userId: v.any(),
            direction: v.string(),
            content: v.string(),
            contentType: v.optional(v.string()),
            metadata: v.optional(v.any()),
            threadId: v.optional(v.string()),
            replyToId: v.optional(v.string()),
            timestamp: v.number(),
        })),
        hasMore: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;
        let messagesQuery = ctx.db
            .query("messages")
            .withIndex("by_session_timestamp", (q) => {
            let built = q.eq("sessionId", args.sessionId);
            if (args.after !== undefined) {
                built = built.gt("timestamp", args.after);
            }
            if (args.before !== undefined) {
                built = built.lt("timestamp", args.before);
            }
            return built;
        });
        const allMessages = await messagesQuery.collect();
        // Sort ascending by timestamp
        allMessages.sort((a, b) => a.timestamp - b.timestamp);
        // If paginating backwards, take the last N
        let page;
        let hasMore;
        if (args.before !== undefined) {
            hasMore = allMessages.length > limit;
            page = allMessages.slice(-limit);
        }
        else {
            hasMore = allMessages.length > limit;
            page = allMessages.slice(0, limit);
        }
        return {
            messages: page.map((m) => ({
                messageId: m._id,
                sessionId: m.sessionId,
                gateway: m.gateway,
                gatewayMessageId: m.gatewayMessageId,
                channelId: m.channelId,
                userId: m.userId,
                direction: m.direction,
                content: m.content,
                contentType: m.contentType,
                metadata: m.metadata,
                threadId: m.threadId,
                replyToId: m.replyToId,
                timestamp: m.timestamp,
            })),
            hasMore,
        };
    },
});
/**
 * Get all messages in a thread.
 */
export const getThread = query({
    args: {
        threadId: v.string(),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.object({
        messageId: v.string(),
        sessionId: v.string(),
        gateway: v.string(),
        channelId: v.any(),
        userId: v.any(),
        direction: v.string(),
        content: v.string(),
        contentType: v.optional(v.string()),
        metadata: v.optional(v.any()),
        replyToId: v.optional(v.string()),
        timestamp: v.number(),
    })),
    handler: async (ctx, args) => {
        const limit = args.limit ?? 100;
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
            .collect();
        messages.sort((a, b) => a.timestamp - b.timestamp);
        return messages.slice(0, limit).map((m) => ({
            messageId: m._id,
            sessionId: m.sessionId,
            gateway: m.gateway,
            channelId: m.channelId,
            userId: m.userId,
            direction: m.direction,
            content: m.content,
            contentType: m.contentType,
            metadata: m.metadata,
            replyToId: m.replyToId,
            timestamp: m.timestamp,
        }));
    },
});
/**
 * Get the N most recent messages for a session.
 * Useful for real-time dashboard subscriptions.
 */
export const getLatestMessages = query({
    args: {
        sessionId: v.string(),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.object({
        messageId: v.string(),
        gateway: v.string(),
        channelId: v.any(),
        userId: v.any(),
        direction: v.string(),
        content: v.string(),
        contentType: v.optional(v.string()),
        metadata: v.optional(v.any()),
        threadId: v.optional(v.string()),
        replyToId: v.optional(v.string()),
        timestamp: v.number(),
    })),
    handler: async (ctx, args) => {
        const limit = args.limit ?? 20;
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_session_timestamp", (q) => q.eq("sessionId", args.sessionId))
            .order("desc")
            .take(limit);
        // Return in ascending order
        messages.reverse();
        return messages.map((m) => ({
            messageId: m._id,
            gateway: m.gateway,
            channelId: m.channelId,
            userId: m.userId,
            direction: m.direction,
            content: m.content,
            contentType: m.contentType,
            metadata: m.metadata,
            threadId: m.threadId,
            replyToId: m.replyToId,
            timestamp: m.timestamp,
        }));
    },
});
// ─── Gateway Management ──────────────────────────────────────────
/**
 * Register a new ClawdBot gateway instance.
 */
export const registerGateway = mutation({
    args: {
        gatewayId: v.string(),
        name: v.string(),
        type: v.string(),
        config: v.optional(v.any()),
    },
    returns: v.string(),
    handler: async (ctx, args) => {
        // Check for existing gateway with same ID
        const existing = await ctx.db
            .query("gateways")
            .withIndex("by_gatewayId", (q) => q.eq("gatewayId", args.gatewayId))
            .first();
        if (existing) {
            // Update existing gateway
            await ctx.db.patch(existing._id, {
                name: args.name,
                type: args.type,
                config: args.config,
                active: true,
            });
            return existing._id;
        }
        const id = await ctx.db.insert("gateways", {
            gatewayId: args.gatewayId,
            name: args.name,
            type: args.type,
            config: args.config,
            active: true,
            createdAt: Date.now(),
        });
        return id;
    },
});
/**
 * Remove (deactivate) a gateway.
 */
export const removeGateway = mutation({
    args: {
        gatewayId: v.string(),
    },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        const gateway = await ctx.db
            .query("gateways")
            .withIndex("by_gatewayId", (q) => q.eq("gatewayId", args.gatewayId))
            .first();
        if (!gateway)
            return false;
        await ctx.db.patch(gateway._id, { active: false });
        return true;
    },
});
/**
 * List all registered gateways.
 */
export const listGateways = query({
    args: {
        activeOnly: v.optional(v.boolean()),
    },
    returns: v.array(v.object({
        gatewayId: v.string(),
        name: v.string(),
        type: v.string(),
        config: v.optional(v.any()),
        active: v.boolean(),
        createdAt: v.number(),
    })),
    handler: async (ctx, args) => {
        let gateways = await ctx.db.query("gateways").collect();
        if (args.activeOnly) {
            gateways = gateways.filter((g) => g.active);
        }
        return gateways.map((g) => ({
            gatewayId: g.gatewayId,
            name: g.name,
            type: g.type,
            config: g.config,
            active: g.active,
            createdAt: g.createdAt,
        }));
    },
});
// ─── Maintenance ─────────────────────────────────────────────────
/**
 * Prune inactive sessions older than the specified retention period.
 * Call from your app's cron job.
 */
export const pruneSessions = mutation({
    args: {
        olderThanMs: v.optional(v.number()),
        deleteMessages: v.optional(v.boolean()),
    },
    returns: v.object({
        sessionsPruned: v.number(),
        messagesDeleted: v.number(),
    }),
    handler: async (ctx, args) => {
        const threshold = args.olderThanMs ?? 7 * 24 * 60 * 60 * 1000; // 7 days default
        const cutoff = Date.now() - threshold;
        const shouldDeleteMessages = args.deleteMessages ?? false;
        let sessionsPruned = 0;
        let messagesDeleted = 0;
        // Find expired inactive sessions
        const sessions = await ctx.db
            .query("sessions")
            .withIndex("by_active_lastActivity", (q) => q.eq("active", false).lt("lastActivityAt", cutoff))
            .collect();
        for (const session of sessions) {
            if (shouldDeleteMessages) {
                // Delete associated messages
                const messages = await ctx.db
                    .query("messages")
                    .withIndex("by_session_timestamp", (q) => q.eq("sessionId", session._id))
                    .collect();
                for (const msg of messages) {
                    await ctx.db.delete(msg._id);
                    messagesDeleted++;
                }
            }
            await ctx.db.delete(session._id);
            sessionsPruned++;
        }
        return { sessionsPruned, messagesDeleted };
    },
});
/**
 * Clean up old deduplication records.
 * Safe to run frequently — dedup records only need to survive the webhook retry window.
 */
export const pruneDedup = mutation({
    args: {
        olderThanMs: v.optional(v.number()),
    },
    returns: v.number(),
    handler: async (ctx, args) => {
        const threshold = args.olderThanMs ?? 24 * 60 * 60 * 1000; // 24 hours default
        const cutoff = Date.now() - threshold;
        const records = await ctx.db
            .query("processedWebhooks")
            .withIndex("by_processedAt", (q) => q.lt("processedAt", cutoff))
            .collect();
        for (const record of records) {
            await ctx.db.delete(record._id);
        }
        return records.length;
    },
});
//# sourceMappingURL=public.js.map