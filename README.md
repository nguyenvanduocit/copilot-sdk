# Copilot SDK

TypeScript SDK for directly calling GitHub Copilot API.

## Requirements

- GitHub account with **active Copilot subscription** (Individual, Business, or Enterprise)
- Bun runtime

## Setup

```bash
# 1. Authenticate via device flow (one-time)
bun auth.ts

# 2. Test the SDK
bun example.ts
```

## Usage

```typescript
import { createCopilotClient } from "./index";

const client = await createCopilotClient();

// Simple prompt
const answer = await client.prompt("What is TypeScript?");
console.log(answer);

// Streaming
for await (const text of client.promptStream("Tell me a joke")) {
  process.stdout.write(text);
}
```

## API

### Chat

```typescript
const response = await client.chat({
  model: "gpt-4o",
  systemPrompt: "You are a helpful assistant.",
  messages: [{ role: "user", content: "Hello!" }],
  max_tokens: 100,
});

console.log(response.choices[0].message.content);
```

### Streaming

```typescript
for await (const chunk of client.chatStream({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Write a poem" }],
})) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) process.stdout.write(content);
}
```

### Models

```typescript
const models = await client.getModels();
for (const model of models) {
  console.log(`${model.id} (${model.vendor})`);
}
```

### Usage/Quota

```typescript
const usage = await client.getUsage();
console.log("Plan:", usage.copilot_plan);
console.log("Remaining:", usage.quota_snapshots.chat.percent_remaining + "%");
```

## Configuration

```typescript
const client = await createCopilotClient({
  authFile: "~/.copilot-sdk/auth.json", // default
  refreshBuffer: 60,                     // refresh 60s before expiry
});
```

## Error Handling

```typescript
import { AuthenticationError, RateLimitError, CopilotError } from "./index";

try {
  await client.prompt("Hello");
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Run 'bun auth.ts' first");
  } else if (error instanceof RateLimitError) {
    console.error("Retry after:", error.retryAfter, "seconds");
  }
}
```
