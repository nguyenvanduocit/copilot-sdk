// ============================================================================
// GitHub Copilot SDK
// ============================================================================
//
// A TypeScript SDK for directly calling the GitHub Copilot API.
//
// Usage:
//   import { createCopilotClient } from "./copilot-sdk";
//
//   const client = await createCopilotClient({
//     githubToken: "ghp_xxx",
//   });
//
//   const response = await client.chat({
//     model: "gpt-4o",
//     systemPrompt: "You are a helpful assistant.",
//     messages: [{ role: "user", content: "Hello!" }],
//   });
//
// ============================================================================

// Client
export { CopilotClient, createCopilotClient } from "./client.js";

// Types - Configuration
export type { CopilotConfig } from "./types.js";

// Types - Messages
export type {
  Role,
  Message,
  MessageContent,
  TextContent,
  ImageContent,
} from "./types.js";

// Types - Tools
export type {
  Tool,
  ToolCall,
  ToolChoice,
  FunctionDefinition,
} from "./types.js";

// Types - Chat
export type {
  ChatRequest,
  ChatResponse,
  ChatChoice,
  ChatChunk,
  StreamChoice,
  StreamDelta,
  Usage,
} from "./types.js";

// Types - Models
export type {
  Model,
  ModelsResponse,
  ModelCapabilities,
} from "./types.js";

// Types - Embeddings
export type {
  EmbeddingRequest,
  EmbeddingResponse,
  Embedding,
} from "./types.js";

// Types - Usage
export type {
  CopilotUsage,
  QuotaSnapshots,
  QuotaDetail,
} from "./types.js";

// Types - Auth
export type {
  GitHubUser,
  CopilotTokenResponse,
} from "./types.js";

// Errors
export {
  CopilotError,
  AuthenticationError,
  RateLimitError,
} from "./types.js";
