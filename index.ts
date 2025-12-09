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
export { CopilotClient, createCopilotClient } from "./client";

// Types - Configuration
export type { CopilotConfig } from "./types";

// Types - Messages
export type {
  Role,
  Message,
  MessageContent,
  TextContent,
  ImageContent,
} from "./types";

// Types - Tools
export type {
  Tool,
  ToolCall,
  ToolChoice,
  FunctionDefinition,
} from "./types";

// Types - Chat
export type {
  ChatRequest,
  ChatResponse,
  ChatChoice,
  ChatChunk,
  StreamChoice,
  StreamDelta,
  Usage,
} from "./types";

// Types - Models
export type {
  Model,
  ModelsResponse,
  ModelCapabilities,
} from "./types";

// Types - Embeddings
export type {
  EmbeddingRequest,
  EmbeddingResponse,
  Embedding,
} from "./types";

// Types - Usage
export type {
  CopilotUsage,
  QuotaSnapshots,
  QuotaDetail,
} from "./types";

// Types - Auth
export type {
  GitHubUser,
  CopilotTokenResponse,
} from "./types";

// Errors
export {
  CopilotError,
  AuthenticationError,
  RateLimitError,
} from "./types";
