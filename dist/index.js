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
// Errors
export { CopilotError, AuthenticationError, RateLimitError, } from "./types.js";
