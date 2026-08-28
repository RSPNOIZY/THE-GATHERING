const { v4: uuidv4 } = require("uuid");
const ProviderFactory = require("../providers");

function handleWebSocket(ws, clientId, stateManager, heaven = null) {
  // Register connection
  stateManager.addConnection(clientId, {
    ws,
    subscriptions: new Set(),
  });

  // Handle incoming messages
  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case "ping":
          ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
          stateManager.updateConnectionActivity(clientId);
          break;

        case "subscribe":
          handleSubscribe(ws, clientId, message, stateManager);
          break;

        case "unsubscribe":
          handleUnsubscribe(ws, clientId, message, stateManager);
          break;

        case "chat:stream":
          await handleStreamingChat(ws, clientId, message, stateManager, heaven);
          break;

        case "stats:request":
          handleStatsRequest(ws, stateManager);
          break;

        default:
          ws.send(
            JSON.stringify({
              type: "error",
              error: "Unknown message type",
            }),
          );
      }
    } catch (error) {
      console.error("WebSocket error:", error);
      // Sanitize: never leak raw provider errors (may contain key details or internal info)
      const safeMsg =
        error.message
          ?.replace(/sk-[\w-]+/g, "[REDACTED]")
          .replace(/key[=: ]+[\w-]{8,}/gi, "[REDACTED]") || "Internal error";
      ws.send(
        JSON.stringify({
          type: "error",
          error: safeMsg,
        }),
      );
    }
  });

  // Clean up on disconnect
  ws.on("close", () => {
    stateManager.removeConnection(clientId);
  });

  // Send initial connection confirmation
  ws.send(
    JSON.stringify({
      type: "connected",
      clientId,
      timestamp: Date.now(),
    }),
  );
}

function handleSubscribe(ws, clientId, message, stateManager) {
  const { channel } = message;
  const connection = stateManager.activeConnections.get(clientId);

  if (connection) {
    connection.subscriptions.add(channel);

    // Subscribe to state manager events
    const listener = (data) => {
      ws.send(
        JSON.stringify({
          type: "event",
          channel,
          data,
        }),
      );
    };

    stateManager.on(channel, listener);

    // Store listener reference for cleanup
    if (!connection.listeners) connection.listeners = new Map();
    connection.listeners.set(channel, listener);

    ws.send(
      JSON.stringify({
        type: "subscribed",
        channel,
      }),
    );
  }
}

function handleUnsubscribe(ws, clientId, message, stateManager) {
  const { channel } = message;
  const connection = stateManager.activeConnections.get(clientId);

  if (connection) {
    connection.subscriptions.delete(channel);

    // Remove event listener
    if (connection.listeners && connection.listeners.has(channel)) {
      stateManager.off(channel, connection.listeners.get(channel));
      connection.listeners.delete(channel);
    }

    ws.send(
      JSON.stringify({
        type: "unsubscribed",
        channel,
      }),
    );
  }
}

async function handleStreamingChat(
  ws,
  clientId,
  message,
  stateManager,
  heaven = null,
) {
  const { conversationId, content, model, apiKeys, options = {}, images } = message;
  // Pass images and thinking into options for provider
  if (images) options.images = images;

  let conversation;
  if (conversationId) {
    conversation = stateManager.getConversation(conversationId);
  } else {
    conversation = stateManager.createConversation("user");
  }

  stateManager.addMessage(conversation.id, { role: "user", content, model });

  ws.send(
    JSON.stringify({ type: "chat:typing", conversationId: conversation.id }),
  );

  const provider = ProviderFactory.getProviderForModel(model, apiKeys);
  const contextMessages = conversation.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  if (typeof provider.streamChat === "function") {
    // Real streaming path
    let fullContent = "";
    let fullThinking = "";
    let finalMetadata = null;

    try {
      for await (const chunk of provider.streamChat(contextMessages, {
        model,
        ...options,
      })) {
        if (!chunk.done) {
          // Thinking block lifecycle events
          if (chunk.thinkingStart) {
            ws.send(
              JSON.stringify({ type: "chat:thinking:start", conversationId: conversation.id }),
            );
          } else if (chunk.thinkingEnd) {
            ws.send(JSON.stringify({ type: "chat:thinking:end", conversationId: conversation.id }));
          } else if (chunk.thinking !== undefined && chunk.thinking !== "") {
            // Stream thinking tokens to client
            fullThinking += chunk.thinking;
            ws.send(
              JSON.stringify({
                type: "chat:thinking",
                conversationId: conversation.id,
                text: chunk.thinking,
              }),
            );
          } else if (chunk.text) {
            fullContent += chunk.text;
            ws.send(
              JSON.stringify({
                type: "chat:chunk",
                conversationId: conversation.id,
                text: chunk.text,
              }),
            );
          }
        } else {
          finalMetadata = {
            tokens: chunk.tokens,
            cost: chunk.cost,
            provider: provider.name.toLowerCase(),
            modelVersion: chunk.model,
            thinking: chunk.thinking || null,
            cached: chunk.cached || false,
          };
        }
      }

      const assistantMessage = stateManager.addMessage(conversation.id, {
        role: "assistant",
        content: fullContent,
        model,
        metadata: finalMetadata,
      });

      if (heaven && finalMetadata) {
        heaven
          .reportUsage({
            model,
            provider: finalMetadata.provider,
            tokens: finalMetadata.tokens?.total || 0,
            cost: finalMetadata.cost?.total || 0,
            conversationId: conversation.id,
          })
          .catch(() => {});
      }

      ws.send(
        JSON.stringify({
          type: "chat:complete",
          conversationId: conversation.id,
          message: assistantMessage,
          thinking: fullThinking || null,
          cached: finalMetadata?.cached || false,
          savings: finalMetadata?.cost?.savings || 0,
        }),
      );
    } catch (error) {
      const safeMsg =
        error.message
          ?.replace(/sk-[\w-]+/g, "[REDACTED]")
          .replace(/key[=: ]+[\w-]{8,}/gi, "[REDACTED]") || "Stream error";
      ws.send(
        JSON.stringify({
          type: "chat:error",
          conversationId: conversation.id,
          error: safeMsg,
        }),
      );
    }
  } else {
    // Fallback: non-streaming for providers without streamChat()
    try {
      const response = await provider.chat(contextMessages, {
        model,
        ...options,
      });
      const assistantMessage = stateManager.addMessage(conversation.id, {
        role: "assistant",
        content: response.content,
        model,
        metadata: response.metadata,
      });
      ws.send(
        JSON.stringify({
          type: "chat:complete",
          conversationId: conversation.id,
          message: assistantMessage,
        }),
      );
    } catch (error) {
      const safeMsg =
        error.message
          ?.replace(/sk-[\w-]+/g, "[REDACTED]")
          .replace(/key[=: ]+[\w-]{8,}/gi, "[REDACTED]") || "Chat error";
      ws.send(
        JSON.stringify({
          type: "chat:error",
          conversationId: conversation.id,
          error: safeMsg,
        }),
      );
    }
  }
}

function handleStatsRequest(ws, stateManager) {
  const stats = stateManager.getStats();
  ws.send(
    JSON.stringify({
      type: "stats:response",
      stats,
    }),
  );
}

module.exports = { handleWebSocket };
