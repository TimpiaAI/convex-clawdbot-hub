// ─── Main Client Class ──────────────────────────────────────────
/**
 * Client for the ClawdBot Message Hub component.
 * Supports TypeScript generics for type-safe user/channel IDs.
 *
 * Usage:
 * ```ts
 * import { ClawdBotHub } from "convex-clawdbot-hub";
 * import { components } from "./_generated/api.js";
 *
 * // Type-safe:
 * const hub = new ClawdBotHub<Id<"users">, Id<"channels">>(
 *   components.clawdbotHub
 * );
 *
 * // Or with string IDs:
 * const hub = new ClawdBotHub<string, string>(components.clawdbotHub);
 *
 * // Or any (default):
 * const hub = new ClawdBotHub(components.clawdbotHub);
 * ```
 */
export class ClawdBotHub {
    component;
    constructor(component) {
        this.component = component;
    }
    // ─── Webhook Processing ──────────────────────────────────────
    /**
     * Process an inbound message from a ClawdBot gateway webhook.
     * Handles deduplication, session resolution, and message storage.
     * Returns null if the message was already processed (deduplicated).
     */
    async processInbound(ctx, args) {
        return await ctx.runMutation(this.component.public.processInbound, args);
    }
    /**
     * Store an outbound message (bot/agent response).
     */
    async sendOutbound(ctx, args) {
        return (await ctx.runMutation(this.component.public.sendOutbound, args));
    }
    // ─── Session Management ──────────────────────────────────────
    /**
     * Get or create a session based on scope (per-user, per-channel, per-peer).
     */
    async getOrCreateSession(ctx, args) {
        return await ctx.runMutation(this.component.public.getOrCreateSession, args);
    }
    /**
     * Get a session by its ID.
     */
    async getSession(ctx, args) {
        return await ctx.runQuery(this.component.public.getSession, args);
    }
    /**
     * List sessions with optional filters.
     */
    async listSessions(ctx, args) {
        return await ctx.runQuery(this.component.public.listSessions, args);
    }
    /**
     * End a session (mark as inactive).
     */
    async endSession(ctx, args) {
        return (await ctx.runMutation(this.component.public.endSession, args));
    }
    // ─── Conversation History ────────────────────────────────────
    /**
     * Get messages for a session with pagination.
     * Use `before`/`after` timestamps as cursors.
     */
    async getMessages(ctx, args) {
        return await ctx.runQuery(this.component.public.getMessages, args);
    }
    /**
     * Get all messages in a thread.
     */
    async getThread(ctx, args) {
        return await ctx.runQuery(this.component.public.getThread, args);
    }
    /**
     * Get the N most recent messages for a session.
     * Subscribe to this query for real-time dashboard updates.
     */
    async getLatestMessages(ctx, args) {
        return await ctx.runQuery(this.component.public.getLatestMessages, args);
    }
    // ─── Gateway Management ──────────────────────────────────────
    /**
     * Register a new ClawdBot gateway instance.
     * Idempotent — updates if gatewayId already exists.
     */
    async registerGateway(ctx, args) {
        return (await ctx.runMutation(this.component.public.registerGateway, args));
    }
    /**
     * Remove (deactivate) a gateway.
     */
    async removeGateway(ctx, args) {
        return (await ctx.runMutation(this.component.public.removeGateway, args));
    }
    /**
     * List all registered gateways.
     */
    async listGateways(ctx, args) {
        return await ctx.runQuery(this.component.public.listGateways, args ?? {});
    }
    // ─── Maintenance ─────────────────────────────────────────────
    /**
     * Prune inactive sessions older than the retention period.
     * Call from your app's cron job.
     */
    async pruneSessions(ctx, args) {
        return await ctx.runMutation(this.component.public.pruneSessions, args ?? {});
    }
    /**
     * Clean up old deduplication records.
     */
    async pruneDedup(ctx, args) {
        return (await ctx.runMutation(this.component.public.pruneDedup, args ?? {}));
    }
}
export default ClawdBotHub;
//# sourceMappingURL=index.js.map