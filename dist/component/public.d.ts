/**
 * Process an inbound message from a ClawdBot gateway webhook.
 * Handles deduplication, session resolution, and message storage.
 * Returns the stored message ID and session ID, or null if deduplicated.
 */
export declare const processInbound: any;
/**
 * Store an outbound message (sent by the bot/agent to the user).
 */
export declare const sendOutbound: any;
/**
 * Get or create a session based on the scope (per-user, per-channel, per-peer).
 */
export declare const getOrCreateSession: any;
/**
 * Get a session by its document ID.
 */
export declare const getSession: any;
/**
 * List sessions with optional filters.
 */
export declare const listSessions: any;
/**
 * End a session (mark as inactive).
 */
export declare const endSession: any;
/**
 * Get messages for a session with cursor-based pagination.
 * Pass `before` timestamp to paginate backwards.
 */
export declare const getMessages: any;
/**
 * Get all messages in a thread.
 */
export declare const getThread: any;
/**
 * Get the N most recent messages for a session.
 * Useful for real-time dashboard subscriptions.
 */
export declare const getLatestMessages: any;
/**
 * Register a new ClawdBot gateway instance.
 */
export declare const registerGateway: any;
/**
 * Remove (deactivate) a gateway.
 */
export declare const removeGateway: any;
/**
 * List all registered gateways.
 */
export declare const listGateways: any;
/**
 * Prune inactive sessions older than the specified retention period.
 * Call from your app's cron job.
 */
export declare const pruneSessions: any;
/**
 * Clean up old deduplication records.
 * Safe to run frequently — dedup records only need to survive the webhook retry window.
 */
export declare const pruneDedup: any;
//# sourceMappingURL=public.d.ts.map