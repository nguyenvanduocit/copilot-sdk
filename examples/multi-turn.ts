// ============================================================================
// Multi-turn Conversation Example
// ============================================================================
//
// Run: bun examples/multi-turn.ts
//
// ============================================================================

import { createCopilotClient, type Message } from "../src/index";

async function main() {
  const client = await createCopilotClient({
    authFile: "./auth.json",
  });

  const history: Message[] = [];

  // Helper to chat and update history
  async function chat(userMessage: string): Promise<string> {
    history.push({ role: "user", content: userMessage });

    const response = await client.chat({
      model: "gpt-4o",
      systemPrompt: "You are a helpful math tutor. Be concise.",
      messages: history,
    });

    const assistantMessage = response.choices[0].message.content ?? "";
    history.push({ role: "assistant", content: assistantMessage });

    return assistantMessage;
  }

  // Multi-turn conversation
  console.log("User: What is 2 + 2?");
  console.log("Assistant:", await chat("What is 2 + 2?"));

  console.log("\nUser: Multiply that by 10");
  console.log("Assistant:", await chat("Multiply that by 10"));

  console.log("\nUser: Now divide by 5");
  console.log("Assistant:", await chat("Now divide by 5"));

  console.log("\nUser: What were all the numbers we calculated?");
  console.log("Assistant:", await chat("What were all the numbers we calculated?"));
}

main().catch(console.error);
