declare const _default: import("convex/server").SchemaDefinition<{
    messages: import("convex/server").TableDefinition<import("convex/values").VObject<{
        metadata?: any;
        gatewayMessageId?: string | undefined;
        contentType?: string | undefined;
        threadId?: string | undefined;
        replyToId?: string | undefined;
        sessionId: string;
        gateway: string;
        userId: any;
        channelId: any;
        direction: string;
        content: string;
        timestamp: number;
    }, {
        sessionId: import("convex/values").VString<string, "required">;
        gateway: import("convex/values").VString<string, "required">;
        gatewayMessageId: import("convex/values").VString<string | undefined, "optional">;
        channelId: import("convex/values").VAny<any, "required", string>;
        userId: import("convex/values").VAny<any, "required", string>;
        direction: import("convex/values").VString<string, "required">;
        content: import("convex/values").VString<string, "required">;
        contentType: import("convex/values").VString<string | undefined, "optional">;
        metadata: import("convex/values").VAny<any, "optional", string>;
        threadId: import("convex/values").VString<string | undefined, "optional">;
        replyToId: import("convex/values").VString<string | undefined, "optional">;
        timestamp: import("convex/values").VFloat64<number, "required">;
    }, "required", "sessionId" | "gateway" | "userId" | "channelId" | "metadata" | `userId.${string}` | `channelId.${string}` | `metadata.${string}` | "gatewayMessageId" | "direction" | "content" | "contentType" | "threadId" | "replyToId" | "timestamp">, {
        by_session_timestamp: ["sessionId", "timestamp", "_creationTime"];
        by_thread: ["threadId", "timestamp", "_creationTime"];
        by_gateway_messageId: ["gateway", "gatewayMessageId", "_creationTime"];
        by_channel: ["channelId", "timestamp", "_creationTime"];
    }, {}, {}>;
    sessions: import("convex/server").TableDefinition<import("convex/values").VObject<{
        metadata?: any;
        sessionKey: string;
        scope: string;
        gateway: string;
        userId: any;
        channelId: any;
        lastActivityAt: number;
        createdAt: number;
        active: boolean;
    }, {
        sessionKey: import("convex/values").VString<string, "required">;
        scope: import("convex/values").VString<string, "required">;
        gateway: import("convex/values").VString<string, "required">;
        userId: import("convex/values").VAny<any, "required", string>;
        channelId: import("convex/values").VAny<any, "required", string>;
        lastActivityAt: import("convex/values").VFloat64<number, "required">;
        createdAt: import("convex/values").VFloat64<number, "required">;
        metadata: import("convex/values").VAny<any, "optional", string>;
        active: import("convex/values").VBoolean<boolean, "required">;
    }, "required", "sessionKey" | "scope" | "gateway" | "userId" | "channelId" | "lastActivityAt" | "createdAt" | "metadata" | "active" | `userId.${string}` | `channelId.${string}` | `metadata.${string}`>, {
        by_session_key: ["sessionKey", "_creationTime"];
        by_user: ["userId", "_creationTime"];
        by_gateway: ["gateway", "_creationTime"];
        by_active_lastActivity: ["active", "lastActivityAt", "_creationTime"];
    }, {}, {}>;
    gateways: import("convex/server").TableDefinition<import("convex/values").VObject<{
        config?: any;
        type: string;
        createdAt: number;
        active: boolean;
        gatewayId: string;
        name: string;
    }, {
        gatewayId: import("convex/values").VString<string, "required">;
        name: import("convex/values").VString<string, "required">;
        type: import("convex/values").VString<string, "required">;
        config: import("convex/values").VAny<any, "optional", string>;
        active: import("convex/values").VBoolean<boolean, "required">;
        createdAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "type" | "createdAt" | "active" | "gatewayId" | "name" | "config" | `config.${string}`>, {
        by_gatewayId: ["gatewayId", "_creationTime"];
    }, {}, {}>;
    processedWebhooks: import("convex/server").TableDefinition<import("convex/values").VObject<{
        dedupKey: string;
        processedAt: number;
    }, {
        dedupKey: import("convex/values").VString<string, "required">;
        processedAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "dedupKey" | "processedAt">, {
        by_dedupKey: ["dedupKey", "_creationTime"];
        by_processedAt: ["processedAt", "_creationTime"];
    }, {}, {}>;
}, true>;
export default _default;
//# sourceMappingURL=schema.d.ts.map