# Copilot SDK

TypeScript SDK for directly calling GitHub Copilot API.

## Requirements

- GitHub account with **active Copilot subscription**
- Node.js >= 18 or Bun

## Installation

```bash
bun add github:nguyenvanduocit/copilot-sdk
```

## Setup

Authenticate with GitHub (outputs JSON to stdout):

```bash
bunx github:nguyenvanduocit/copilot-sdk > auth.json
```

## Usage

```typescript
import { createCopilotClient } from "copilot-sdk";

const client = await createCopilotClient({
  authFile: "./auth.json",
});

const answer = await client.prompt("Hello!");
console.log(answer);
```

## API

### Chat

```typescript
const response = await client.chat({
  model: "gpt-4o",
  systemPrompt: "You are a helpful assistant.",
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(response.choices[0].message.content);
```

### Streaming

```typescript
for await (const text of client.promptStream("Tell me a joke")) {
  process.stdout.write(text);
}
```

### Models

```typescript
const models = await client.getModels();
for (const model of models) {
  console.log(`${model.id} (${model.vendor})`);
}
```

## Error Handling

```typescript
import { AuthenticationError, RateLimitError } from "copilot-sdk";

try {
  await client.prompt("Hello");
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Auth failed:", error.message);
  } else if (error instanceof RateLimitError) {
    console.error("Rate limited, retry after:", error.retryAfter);
  }
}
```

## License

MIT
