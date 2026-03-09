import type { api } from "../component/_generated/api.js";
type ComponentApi = typeof api;
interface RunMutationCtx {
    runMutation: <Args extends Record<string, any>, Returns>(ref: any, args: Args) => Promise<Returns>;
}
interface RunQueryCtx {
    runQuery: <Args extends Record<string, any>, Returns>(ref: any, args: Args) => Promise<Returns>;
}
export interface InboundResult {
    messageId: string;
    sessionId: string;
    deduplicated: boolean;
}
export interface SessionResult<UserId = any, ChannelId = any> {
    sessionId: string;
    sessionKey: string;
    scope: string;
    gateway: string;
    userId: UserId;
    channelId: ChannelId;
    lastActivityAt: number;
    createdAt: number;
    metadata?: any;
    active: boolean;
}
export interface MessageResult<UserId = any, ChannelId = any> {
    messageId: string;
    sessionId?: string;
    gateway: string;
    gatewayMessageId?: string;
    channelId: ChannelId;
    userId: UserId;
    direction: string;
    content: string;
    contentType?: string;
    metadata?: any;
    threadId?: string;
    replyToId?: string;
    timestamp: number;
}
export interface GatewayResult {
    gatewayId: string;
    name: string;
    type: string;
    config?: any;
    active: boolean;
    createdAt: number;
}
export interface PruneSessionsResult {
    sessionsPruned: number;
    messagesDeleted: number;
}
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
export declare class ClawdBotHub<UserId = any, ChannelId = any> {
    component: ComponentApi;
    constructor(component: ComponentApi);
    /**
     * Process an inbound message from a ClawdBot gateway webhook.
     * Handles deduplication, session resolution, and message storage.
     * Returns null if the message was already processed (deduplicated).
     */
    processInbound(ctx: RunMutationCtx, args: {
        gateway: string;
        gatewayMessageId?: string;
        channelId: ChannelId;
        userId: UserId;
        content: string;
        contentType?: string;
        metadata?: any;
        threadId?: string;
        replyToId?: string;
        timestamp?: number;
        sessionScope?: "user" | "channel" | "peer";
    }): Promise<InboundResult | null>;
    /**
     * Store an outbound message (bot/agent response).
     */
    sendOutbound(ctx: RunMutationCtx, args: {
        sessionId: string;
        gateway: string;
        gatewayMessageId?: string;
        channelId: ChannelId;
        userId: UserId;
        content: string;
        contentType?: string;
        metadata?: any;
        threadId?: string;
        replyToId?: string;
        timestamp?: number;
    }): Promise<string>;
    /**
     * Get or create a session based on scope (per-user, per-channel, per-peer).
     */
    getOrCreateSession(ctx: RunMutationCtx, args: {
        gateway: string;
        userId: UserId;
        channelId: ChannelId;
        scope?: "user" | "channel" | "peer";
        metadata?: any;
    }): Promise<{
        sessionId: string;
        created: boolean;
    }>;
    /**
     * Get a session by its ID.
     */
    getSession(ctx: RunQueryCtx, args: {
        sessionId: string;
    }): Promise<SessionResult<UserId, ChannelId> | null>;
    /**
     * List sessions with optional filters.
     */
    listSessions(ctx: RunQueryCtx, args: {
        userId?: UserId;
        gateway?: string;
        activeOnly?: boolean;
        limit?: number;
    }): Promise<SessionResult<UserId, ChannelId>[]>;
    /**
     * End a session (mark as inactive).
     */
    endSession(ctx: RunMutationCtx, args: {
        sessionId: string;
    }): Promise<boolean>;
    /**
     * Get messages for a session with pagination.
     * Use `before`/`after` timestamps as cursors.
     */
    getMessages(ctx: RunQueryCtx, args: {
        sessionId: string;
        limit?: number;
        before?: number;
        after?: number;
    }): Promise<{
        messages: MessageResult<UserId, ChannelId>[];
        hasMore: boolean;
    }>;
    /**
     * Get all messages in a thread.
     */
    getThread(ctx: RunQueryCtx, args: {
        threadId: string;
        limit?: number;
    }): Promise<MessageResult<UserId, ChannelId>[]>;
    /**
     * Get the N most recent messages for a session.
     * Subscribe to this query for real-time dashboard updates.
     */
    getLatestMessages(ctx: RunQueryCtx, args: {
        sessionId: string;
        limit?: number;
    }): Promise<MessageResult<UserId, ChannelId>[]>;
    /**
     * Register a new ClawdBot gateway instance.
     * Idempotent — updates if gatewayId already exists.
     */
    registerGateway(ctx: RunMutationCtx, args: {
        gatewayId: string;
        name: string;
        type: string;
        config?: any;
    }): Promise<string>;
    /**
     * Remove (deactivate) a gateway.
     */
    removeGateway(ctx: RunMutationCtx, args: {
        gatewayId: string;
    }): Promise<boolean>;
    /**
     * List all registered gateways.
     */
    listGateways(ctx: RunQueryCtx, args?: {
        activeOnly?: boolean;
    }): Promise<GatewayResult[]>;
    /**
     * Prune inactive sessions older than the retention period.
     * Call from your app's cron job.
     */
    pruneSessions(ctx: RunMutationCtx, args?: {
        olderThanMs?: number;
        deleteMessages?: boolean;
    }): Promise<PruneSessionsResult>;
    /**
     * Clean up old deduplication records.
     */
    pruneDedup(ctx: RunMutationCtx, args?: {
        olderThanMs?: number;
    }): Promise<number>;
}
export default ClawdBotHub;
//# sourceMappingURL=index.d.ts.map