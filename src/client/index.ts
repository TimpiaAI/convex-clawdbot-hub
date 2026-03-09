import type { api } from "../component/_generated/api.js";

type ComponentApi = typeof api;

interface RunMutationCtx {
  runMutation: <Args extends Record<string, any>, Returns>(
    ref: any,
    args: Args
  ) => Promise<Returns>;
}

interface RunQueryCtx {
  runQuery: <Args extends Record<string, any>, Returns>(
    ref: any,
    args: Args
  ) => Promise<Returns>;
}

// ─── Result Types ────────────────────────────────────────────────

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
export class ClawdBotHub<UserId = any, ChannelId = any> {
  public component: ComponentApi;

  constructor(component: ComponentApi) {
    this.component = component;
  }

  // ─── Webhook Processing ──────────────────────────────────────

  /**
   * Process an inbound message from a ClawdBot gateway webhook.
   * Handles deduplication, session resolution, and message storage.
   * Returns null if the message was already processed (deduplicated).
   */
  async processInbound(
    ctx: RunMutationCtx,
    args: {
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
    }
  ): Promise<InboundResult | null> {
    return await ctx.runMutation(this.component.public.processInbound, args);
  }

  /**
   * Store an outbound message (bot/agent response).
   */
  async sendOutbound(
    ctx: RunMutationCtx,
    args: {
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
    }
  ): Promise<string> {
    return (await ctx.runMutation(
      this.component.public.sendOutbound,
      args
    )) as string;
  }

  // ─── Session Management ──────────────────────────────────────

  /**
   * Get or create a session based on scope (per-user, per-channel, per-peer).
   */
  async getOrCreateSession(
    ctx: RunMutationCtx,
    args: {
      gateway: string;
      userId: UserId;
      channelId: ChannelId;
      scope?: "user" | "channel" | "peer";
      metadata?: any;
    }
  ): Promise<{ sessionId: string; created: boolean }> {
    return await ctx.runMutation(
      this.component.public.getOrCreateSession,
      args
    );
  }

  /**
   * Get a session by its ID.
   */
  async getSession(
    ctx: RunQueryCtx,
    args: { sessionId: string }
  ): Promise<SessionResult<UserId, ChannelId> | null> {
    return await ctx.runQuery(this.component.public.getSession, args);
  }

  /**
   * List sessions with optional filters.
   */
  async listSessions(
    ctx: RunQueryCtx,
    args: {
      userId?: UserId;
      gateway?: string;
      activeOnly?: boolean;
      limit?: number;
    }
  ): Promise<SessionResult<UserId, ChannelId>[]> {
    return await ctx.runQuery(this.component.public.listSessions, args);
  }

  /**
   * End a session (mark as inactive).
   */
  async endSession(
    ctx: RunMutationCtx,
    args: { sessionId: string }
  ): Promise<boolean> {
    return (await ctx.runMutation(
      this.component.public.endSession,
      args
    )) as boolean;
  }

  // ─── Conversation History ────────────────────────────────────

  /**
   * Get messages for a session with pagination.
   * Use `before`/`after` timestamps as cursors.
   */
  async getMessages(
    ctx: RunQueryCtx,
    args: {
      sessionId: string;
      limit?: number;
      before?: number;
      after?: number;
    }
  ): Promise<{
    messages: MessageResult<UserId, ChannelId>[];
    hasMore: boolean;
  }> {
    return await ctx.runQuery(this.component.public.getMessages, args);
  }

  /**
   * Get all messages in a thread.
   */
  async getThread(
    ctx: RunQueryCtx,
    args: { threadId: string; limit?: number }
  ): Promise<MessageResult<UserId, ChannelId>[]> {
    return await ctx.runQuery(this.component.public.getThread, args);
  }

  /**
   * Get the N most recent messages for a session.
   * Subscribe to this query for real-time dashboard updates.
   */
  async getLatestMessages(
    ctx: RunQueryCtx,
    args: { sessionId: string; limit?: number }
  ): Promise<MessageResult<UserId, ChannelId>[]> {
    return await ctx.runQuery(this.component.public.getLatestMessages, args);
  }

  // ─── Gateway Management ──────────────────────────────────────

  /**
   * Register a new ClawdBot gateway instance.
   * Idempotent — updates if gatewayId already exists.
   */
  async registerGateway(
    ctx: RunMutationCtx,
    args: {
      gatewayId: string;
      name: string;
      type: string;
      config?: any;
    }
  ): Promise<string> {
    return (await ctx.runMutation(
      this.component.public.registerGateway,
      args
    )) as string;
  }

  /**
   * Remove (deactivate) a gateway.
   */
  async removeGateway(
    ctx: RunMutationCtx,
    args: { gatewayId: string }
  ): Promise<boolean> {
    return (await ctx.runMutation(
      this.component.public.removeGateway,
      args
    )) as boolean;
  }

  /**
   * List all registered gateways.
   */
  async listGateways(
    ctx: RunQueryCtx,
    args?: { activeOnly?: boolean }
  ): Promise<GatewayResult[]> {
    return await ctx.runQuery(
      this.component.public.listGateways,
      args ?? {}
    );
  }

  // ─── Maintenance ─────────────────────────────────────────────

  /**
   * Prune inactive sessions older than the retention period.
   * Call from your app's cron job.
   */
  async pruneSessions(
    ctx: RunMutationCtx,
    args?: { olderThanMs?: number; deleteMessages?: boolean }
  ): Promise<PruneSessionsResult> {
    return await ctx.runMutation(
      this.component.public.pruneSessions,
      args ?? {}
    );
  }

  /**
   * Clean up old deduplication records.
   */
  async pruneDedup(
    ctx: RunMutationCtx,
    args?: { olderThanMs?: number }
  ): Promise<number> {
    return (await ctx.runMutation(
      this.component.public.pruneDedup,
      args ?? {}
    )) as number;
  }
}

export default ClawdBotHub;
