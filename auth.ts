#!/usr/bin/env bun
// ============================================================================
// Copilot SDK - Authentication Script
// ============================================================================
//
// Authenticates with GitHub Copilot via device flow and outputs JSON to stdout.
//
// Usage:
//   bunx github:nguyenvanduocit/copilot-sdk > auth.json
//
// ============================================================================

// VSCode's OAuth Client ID - required for Copilot API access
const GITHUB_CLIENT_ID = "Iv1.b507a08c87ecfe98";

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

const log = (msg: string) => console.error(msg);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getDeviceCode(): Promise<DeviceCodeResponse> {
  log("Requesting device code...");

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
      process.stderr.write(".");
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
  log("Getting Copilot token...");

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
  log("Copilot SDK - Authentication\n");

  try {
    const deviceCode = await getDeviceCode();

    log("\nOpen: " + deviceCode.verification_uri);
    log("Code: " + deviceCode.user_code + "\n");
    log("Waiting for authorization");

    const githubToken = await pollAccessToken(
      deviceCode.device_code,
      deviceCode.interval
    );
    log("\n\nAuthorization successful!");

    const user = await getUser(githubToken);
    log("Logged in as: " + user);

    const copilotData = await getCopilotToken(githubToken);
    log("Copilot token obtained!\n");

    const authData: AuthData = {
      githubToken,
      copilotToken: copilotData.token,
      copilotTokenExpiry: copilotData.expires_at,
      refreshIn: copilotData.refresh_in,
      createdAt: new Date().toISOString(),
      user,
    };

    // Output JSON to stdout
    console.log(JSON.stringify(authData, null, 2));

  } catch (error) {
    log("\nAuthentication failed!");
    log(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
