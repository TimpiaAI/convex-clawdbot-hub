<div align="center">

# convex-clawdbot-hub

[![Convex Component](https://www.convex.dev/components/badge/convex-clawdbot-hub)](https://www.convex.dev/components/convex-clawdbot-hub)
![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)

<strong>Message hub backend for ClawdBot</strong>

Webhook processing • Session management • Conversation history • Multi-gateway support

[View Demo](#-live-demo) • [Documentation](#-setup) • [API Reference](#-api-reference)

</div>

---

Message hub backend for [ClawdBot](https://clawd.bot) — webhook processing, session management, conversation history, and multi-gateway support. Built as a [Convex Component](https://docs.convex.dev/components).

## Features

- **Webhook processing** — receive and store inbound messages with automatic deduplication
- **Session management** — configurable scoping (per-user, per-channel, per-peer)
- **Conversation history** — paginated retrieval with threading and reply context
- **Multi-gateway support** — route messages from WhatsApp, Telegram, Discord, Slack, and custom gateways
- **Real-time subscriptions** — reactive queries for web dashboards
- **TTL-based pruning** — cron-friendly cleanup for sessions and dedup records
- **TypeScript generics** — type-safe user/channel IDs

## Installation

```bash
npm install convex-clawdbot-hub
```

## Setup

### 1. Register the component

```ts
// convex/convex.config.ts
import { defineApp } from "convex/server";
import clawdbotHub from "convex-clawdbot-hub/convex.config";

const app = defineApp();
app.use(clawdbotHub);

export default app;
```

### 2. Create your backend functions

```ts
// convex/hub.ts
import { ClawdBotHub } from "convex-clawdbot-hub";
import { components } from "./_generated/api.js";
import { httpAction, mutation, query } from "./_generated/server.js";
import { v } from "convex/values";

const hub = new ClawdBotHub(components.clawdbotHub);

// Process inbound webhook from any ClawdBot gateway
export const webhook = httpAction(async (ctx, request) => {
  const body = await request.json();

  const result = await hub.processInbound(ctx, {
    gateway: body.gateway,
    gatewayMessageId: body.messageId,
    channelId: body.channelId,
    userId: body.userId,
    content: body.content,
    sessionScope: "peer",
  });

  if (!result) {
    return new Response("duplicate", { status: 200 });
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

// Send bot response
export const sendReply = mutation({
  args: {
    sessionId: v.string(),
    gateway: v.string(),
    channelId: v.string(),
    userId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await hub.sendOutbound(ctx, args);
  },
});

// Get conversation history
export const getHistory = query({
  args: { sessionId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await hub.getMessages(ctx, args);
  },
});

// Real-time latest messages (subscribe for live updates)
export const liveMessages = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await hub.getLatestMessages(ctx, { sessionId: args.sessionId, limit: 20 });
  },
});
```

### 3. Register your gateways

```ts
export const setupGateway = mutation({
  args: { gatewayId: v.string(), name: v.string(), type: v.string() },
  handler: async (ctx, args) => {
    return await hub.registerGateway(ctx, args);
  },
});
```

## API Reference

### Webhook Processing

| Method | Description |
|--------|-------------|
| `processInbound(ctx, args)` | Process inbound message with dedup and session resolution |
| `sendOutbound(ctx, args)` | Store an outbound bot/agent response |

### Session Management

| Method | Description |
|--------|-------------|
| `getOrCreateSession(ctx, { gateway, userId, channelId, scope? })` | Find or create session by scope |
| `getSession(ctx, { sessionId })` | Get session details |
| `listSessions(ctx, { userId?, gateway?, activeOnly?, limit? })` | List sessions with filters |
| `endSession(ctx, { sessionId })` | Mark session as inactive |

### Session Scopes

| Scope | Key | Use Case |
|-------|-----|----------|
| `"user"` | One session per user per gateway | Single user across channels |
| `"channel"` | One session per channel per gateway | Group chat / shared channel |
| `"peer"` | One session per user+channel pair | Default — most common for DMs |

### Conversation History

| Method | Description |
|--------|-------------|
| `getMessages(ctx, { sessionId, limit?, before?, after? })` | Paginated history |
| `getThread(ctx, { threadId, limit? })` | Get all messages in a thread |
| `getLatestMessages(ctx, { sessionId, limit? })` | Most recent N messages (reactive) |

### Gateway Management

| Method | Description |
|--------|-------------|
| `registerGateway(ctx, { gatewayId, name, type, config? })` | Register a gateway (idempotent) |
| `removeGateway(ctx, { gatewayId })` | Deactivate a gateway |
| `listGateways(ctx, { activeOnly? })` | List all gateways |

### Cleanup

```ts
// convex/crons.ts
import { cronJobs } from "convex/server";
const crons = cronJobs();

// Prune inactive sessions older than 7 days
crons.daily("prune sessions", { hourUTC: 3, minuteUTC: 0 },
  internal.hub.pruneSessions);

// Clean up dedup records older than 24 hours
crons.hourly("prune dedup", { minuteUTC: 30 },
  internal.hub.pruneDedup);

export default crons;
```

## TypeScript Generics

```ts
import { Id } from "./_generated/dataModel.js";

// Type-safe with your app's ID types:
const hub = new ClawdBotHub<Id<"users">, Id<"channels">>(
  components.clawdbotHub
);

// Or with string IDs:
const hub = new ClawdBotHub<string, string>(components.clawdbotHub);
```

## 🚀 Live Demo

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit-blue?style=for-the-badge)](https://clawdbot-hub-demo.vercel.app)

[**View the live demo →** Click here to see ClawdBot Hub in action](https://clawdbot-hub-demo.vercel.app)

## License

MIT

---

<div align="center">
Built with ❤️ for Convex | <a href="https://www.convex.dev/">Convex</a> • <a href="https://docs.convex.dev/components">Components</a> • <a href="https://github.com/get-convex">GitHub</a>
</div>
