#!/usr/bin/env bun
// ============================================================================
// Copilot SDK - Authentication Script
// ============================================================================
//
// Run this script to authenticate with GitHub Copilot via device flow.
// The token will be saved to ~/.copilot-sdk/auth.json
//
// Usage:
//   bun auth.ts
//   # or
//   ./auth.ts
//
// ============================================================================

import fs from "fs/promises";
import path from "path";
import os from "os";

// VSCode's OAuth Client ID - required for Copilot API access
const GITHUB_CLIENT_ID = "Iv1.b507a08c87ecfe98";
const AUTH_DIR = path.join(os.homedir(), ".copilot-sdk");
const AUTH_FILE = path.join(AUTH_DIR, "auth.json");

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

interface AccessTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface CopilotTokenResponse {
  token: string;
  expires_at: number;
  refresh_in: number;
}

interface AuthData {
  githubToken: string;
  copilotToken: string;
  copilotTokenExpiry: number;
  refreshIn: number;
  createdAt: string;
  user?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getDeviceCode(): Promise<DeviceCodeResponse> {
  console.log("📱 Requesting device code...");

  const res = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      scope: "read:user",
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to get device code: " + res.status);
  }

  return res.json();
}

async function pollAccessToken(
  deviceCode: string,
  interval: number
): Promise<string> {
  const sleepDuration = (interval + 1) * 1000;

  while (true) {
    await sleep(sleepDuration);

    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        device_code: deviceCode,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });

    const data: AccessTokenResponse = await res.json();

    if (data.access_token) {
      return data.access_token;
    }

    if (data.error === "authorization_pending") {
      process.stdout.write(".");
      continue;
    }

    if (data.error === "slow_down") {
      await sleep(5000);
      continue;
    }

    if (data.error === "expired_token") {
      throw new Error("Device code expired. Please run auth again.");
    }

    if (data.error) {
      throw new Error(data.error_description || data.error);
    }
  }
}

async function getCopilotToken(githubToken: string): Promise<CopilotTokenResponse> {
  console.log("🔑 Getting Copilot token...");

  const res = await fetch("https://api.github.com/copilot_internal/v2/token", {
    headers: {
      Authorization: "token " + githubToken,
      Accept: "application/json",
      "User-Agent": "GitHubCopilotChat/0.26.7",
      "Editor-Version": "vscode/1.104.3",
      "Editor-Plugin-Version": "copilot-chat/0.26.7",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 404) {
      throw new Error(
        "Copilot subscription not found!\n" +
          "Make sure your GitHub account has an active Copilot subscription.\n" +
          "Subscribe at: https://github.com/features/copilot"
      );
    }
    throw new Error("Failed to get Copilot token: " + res.status + " " + body);
  }

  return res.json();
}

async function getUser(githubToken: string): Promise<string> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: "token " + githubToken,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to get user info");
  }

  const user = await res.json();
  return user.login;
}

async function main() {
  console.log("╔════════════════════════════════════════╗");
  console.log("║     Copilot SDK - Authentication       ║");
  console.log("╚════════════════════════════════════════╝\n");

  try {
    // Step 1: Get device code
    const deviceCode = await getDeviceCode();

    // Step 2: Prompt user
    console.log("\n┌────────────────────────────────────────┐");
    console.log("│  Open this URL in your browser:        │");
    console.log("│                                        │");
    console.log("│  👉 " + deviceCode.verification_uri.padEnd(32) + " │");
    console.log("│                                        │");
    console.log("│  Enter this code:                      │");
    console.log("│                                        │");
    console.log("│  🔢 " + deviceCode.user_code.padEnd(32) + " │");
    console.log("│                                        │");
    console.log("└────────────────────────────────────────┘\n");

    console.log("⏳ Waiting for authorization");
    process.stdout.write("   ");

    // Step 3: Poll for access token
    const githubToken = await pollAccessToken(
      deviceCode.device_code,
      deviceCode.interval
    );
    console.log("\n\n✅ GitHub authorization successful!");

    // Step 4: Get user info
    const user = await getUser(githubToken);
    console.log("👤 Logged in as: " + user);

    // Step 5: Get Copilot token
    const copilotData = await getCopilotToken(githubToken);
    console.log("✅ Copilot token obtained!");

    // Step 6: Save to file
    await fs.mkdir(AUTH_DIR, { recursive: true });

    const authData: AuthData = {
      githubToken,
      copilotToken: copilotData.token,
      copilotTokenExpiry: copilotData.expires_at,
      refreshIn: copilotData.refresh_in,
      createdAt: new Date().toISOString(),
      user,
    };

    await fs.writeFile(AUTH_FILE, JSON.stringify(authData, null, 2));

    console.log("\n✅ Authentication saved to:");
    console.log("   " + AUTH_FILE);

    console.log("\n📊 Token info:");
    console.log("   Expires: " + new Date(copilotData.expires_at * 1000).toLocaleString());
    console.log("   Refresh in: " + copilotData.refresh_in + " seconds");

    console.log("\n🎉 You can now use the Copilot SDK!");
    console.log("   Example: bun example.ts\n");
  } catch (error) {
    console.error("\n❌ Authentication failed!");
    console.error("   " + (error instanceof Error ? error.message : error));
    process.exit(1);
  }
}

main();
