/* eslint-disable */
/**
 * Generated API types for the component.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { AnyApi } from "convex/server";

/**
 * A type describing the component's public API.
 */
export const api: {
  public: {
    // Webhook processing
    processInbound: any;
    sendOutbound: any;

    // Session management
    getOrCreateSession: any;
    getSession: any;
    listSessions: any;
    endSession: any;

    // Conversation history
    getMessages: any;
    getThread: any;
    getLatestMessages: any;

    // Gateway management
    registerGateway: any;
    removeGateway: any;
    listGateways: any;

    // Maintenance
    pruneSessions: any;
    pruneDedup: any;
  };
} = null as any;

export const internal: any = null as any;
