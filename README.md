# Copilot SDK

TypeScript SDK for directly calling GitHub Copilot API.

## Requirements

- GitHub account with **active Copilot subscription** (Individual, Business, or Enterprise)
- Node.js >= 18 or Bun

## Installation

```bash
# npm
npm install copilot-sdk

# bun
bun add copilot-sdk

# or install from GitHub
npm install github:nguyenvanduocit/copilot-sdk
```

## Setup

Before using the SDK, authenticate with GitHub:

```bash
# Clone and run auth script
git clone https://github.com/nguyenvanduocit/copilot-sdk.git
cd copilot-sdk
bun auth.ts
```

This saves credentials to `~/.copilot-sdk/auth.json`.

## Usage

```typescript
import { createCopilotClient } from "copilot-sdk";

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
import { AuthenticationError, RateLimitError, CopilotError } from "copilot-sdk";

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

## License

MIT
