// ============================================================================
// Example usage of Copilot SDK
// ============================================================================
//
// Prerequisites:
//   1. Run: bunx github:nguyenvanduocit/copilot-sdk > auth.json
//   2. Then: bun example.ts
//
// ============================================================================

import { createCopilotClient, AuthenticationError, RateLimitError } from "./src/index";

async function main() {
  try {
    console.log("Initializing Copilot client...");
    const client = await createCopilotClient({
      authFile: "./auth.json",
    });

    // Get user info
    const user = client.getUser();
    console.log("Logged in as: " + user + "\n");

    // List models
    console.log("Available models:");
    const models = await client.getModels();
    for (const model of models.slice(0, 5)) {
      console.log("  - " + model.id + " (" + model.vendor + ")");
    }
    console.log("  ... and " + (models.length - 5) + " more\n");

    // Simple prompt
    console.log("Testing simple prompt...");
    const answer = await client.prompt("Say hello in Japanese", {
      model: "gpt-4o",
      max_tokens: 50,
    });
    console.log("Response: " + answer + "\n");

    // Chat with system prompt
    console.log("Testing chat with system prompt...");
    const response = await client.chat({
      model: "gpt-4o",
      systemPrompt: "You are a pirate. Speak like one!",
      messages: [{ role: "user", content: "How are you today?" }],
      max_tokens: 100,
    });
    console.log("Response: " + response.choices[0].message.content + "\n");

    // Streaming
    console.log("Testing streaming...");
    process.stdout.write("Response: ");
    for await (const chunk of client.promptStream("Count from 1 to 5", {
      model: "gpt-4o",
      max_tokens: 50,
    })) {
      process.stdout.write(chunk);
    }
    console.log("\n");

    // Check usage
    console.log("Checking usage quota...");
    const usage = await client.getUsage();
    console.log("  Plan: " + usage.copilot_plan);
    console.log("  Chat remaining: " + usage.quota_snapshots.chat.percent_remaining + "%");
    console.log("  Resets: " + usage.quota_reset_date);

    console.log("\nAll tests passed!");
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error("\nAuthentication failed!");
      console.error(error.message);
      console.error("\nRun: bunx github:nguyenvanduocit/copilot-sdk > auth.json");
    } else if (error instanceof RateLimitError) {
      console.error("\nRate limit exceeded!");
      console.error("Retry after: " + error.retryAfter + " seconds");
    } else {
      console.error("\nError:", error);
    }
    process.exit(1);
  }
}

main();
