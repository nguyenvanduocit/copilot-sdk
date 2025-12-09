// ============================================================================
// GitHub Copilot SDK - Client
// ============================================================================

import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

import type {
  CopilotConfig,
  ChatRequest,
  ChatResponse,
  ChatChunk,
  Message,
  ModelsResponse,
  Model,
  EmbeddingRequest,
  EmbeddingResponse,
  CopilotUsage,
} from "./types.js";

import { CopilotError, AuthenticationError, RateLimitError } from "./types.js";

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const COPILOT_VERSION = "0.26.7";
const VSCODE_VERSION = "1.104.3";
const API_VERSION = "2025-04-01";
const BASE_URL = "https://api.githubcopilot.com";

// ----------------------------------------------------------------------------
// Auth Data (stored in auth.json)
// ----------------------------------------------------------------------------

interface AuthData {
  githubToken: string;
  copilotToken: string;
  copilotTokenExpiry: number;
  refreshIn: number;
  createdAt: string;
  user?: string;
}

// ----------------------------------------------------------------------------
// Copilot Client
// ----------------------------------------------------------------------------

export class CopilotClient {
  private config: { authFile: string; refreshBuffer: number };
  private authData?: AuthData;
  private modelsCache?: ModelsResponse;

  constructor(config: CopilotConfig) {
    if (!config.authFile) {
      throw new AuthenticationError(
        "authFile is required. Example:\n" +
        "  createCopilotClient({ authFile: './auth.json' })"
      );
    }
    this.config = {
      authFile: config.authFile,
      refreshBuffer: config.refreshBuffer ?? 60,
    };
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /**
   * Initialize the client - loads auth from file
   */
  async init(): Promise<void> {
    await this.loadAuth();
  }

  /**
   * Get current authenticated user
   */
  getUser(): string | undefined {
    return this.authData?.user;
  }

  /**
   * Send a chat completion request (non-streaming)
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    await this.ensureToken();

    const payload = this.buildChatPayload(request);
    payload.stream = false;

    const res = await fetch(BASE_URL + "/chat/completions", {
      method: "POST",
      headers: this.copilotHeaders(this.hasVision(request.messages)),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return res.json();
  }

  /**
   * Send a chat completion request (streaming)
   * Returns an async generator that yields chunks
   */
  async *chatStream(request: ChatRequest): AsyncGenerator<ChatChunk> {
    await this.ensureToken();

    const payload = this.buildChatPayload(request);
    payload.stream = true;

    const res = await fetch(BASE_URL + "/chat/completions", {
      method: "POST",
      headers: this.copilotHeaders(this.hasVision(request.messages)),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    if (!res.body) {
      throw new CopilotError("No response body for streaming");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") return;
        if (!data) continue;

        try {
          yield JSON.parse(data) as ChatChunk;
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }

  /**
   * Convenience method: chat with just a string prompt
   */
  async prompt(
    prompt: string,
    options?: Partial<Omit<ChatRequest, "messages">>
  ): Promise<string> {
    const response = await this.chat({
      model: options?.model ?? "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      ...options,
    });

    return response.choices[0]?.message.content ?? "";
  }

  /**
   * Convenience method: stream chat with just a string prompt
   */
  async *promptStream(
    prompt: string,
    options?: Partial<Omit<ChatRequest, "messages">>
  ): AsyncGenerator<string> {
    const stream = this.chatStream({
      model: options?.model ?? "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      stream: true,
      ...options,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
  }

  /**
   * Get available models
   */
  async getModels(forceRefresh = false): Promise<Model[]> {
    if (this.modelsCache && !forceRefresh) {
      return this.modelsCache.data;
    }

    await this.ensureToken();

    const res = await fetch(BASE_URL + "/models", {
      headers: this.copilotHeaders(),
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    this.modelsCache = await res.json();
    return this.modelsCache!.data;
  }

  /**
   * Get a specific model by ID
   */
  async getModel(modelId: string): Promise<Model | undefined> {
    const models = await this.getModels();
    return models.find((m) => m.id === modelId);
  }

  /**
   * Create embeddings
   */
  async createEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    await this.ensureToken();

    const res = await fetch(BASE_URL + "/embeddings", {
      method: "POST",
      headers: this.copilotHeaders(),
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return res.json();
  }

  /**
   * Get current usage and quota information
   */
  async getUsage(): Promise<CopilotUsage> {
    if (!this.authData) {
      throw new AuthenticationError("Not authenticated");
    }

    const res = await fetch("https://api.github.com/copilot_internal/user", {
      headers: this.githubHeaders(),
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return res.json();
  }

  /**
   * Check if current token is valid
   */
  isTokenValid(): boolean {
    if (!this.authData?.copilotToken || !this.authData?.copilotTokenExpiry) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    return this.authData.copilotTokenExpiry > now + this.config.refreshBuffer;
  }

  /**
   * Force refresh the Copilot token
   */
  async refreshCopilotToken(): Promise<void> {
    if (!this.authData?.githubToken) {
      throw new AuthenticationError(
        "No GitHub token found. Run 'bun auth.ts' first."
      );
    }

    const res = await fetch(
      "https://api.github.com/copilot_internal/v2/token",
      {
        headers: this.githubHeaders(),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 404) {
        throw new AuthenticationError(
          "Copilot subscription not found. Make sure your GitHub account has an active Copilot subscription.",
          res.status,
          body
        );
      }
      throw new AuthenticationError(
        "Failed to refresh Copilot token",
        res.status,
        body
      );
    }

    const data = await res.json();

    this.authData.copilotToken = data.token;
    this.authData.copilotTokenExpiry = data.expires_at;
    this.authData.refreshIn = data.refresh_in;

    await this.saveAuth();
  }

  /**
   * Get the current Copilot token (for advanced use cases)
   */
  getCopilotToken(): string | undefined {
    return this.authData?.copilotToken;
  }

  /**
   * Get token expiry time
   */
  getTokenExpiry(): Date | undefined {
    if (!this.authData?.copilotTokenExpiry) return undefined;
    return new Date(this.authData.copilotTokenExpiry * 1000);
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------


  private async loadAuth(): Promise<void> {
    try {
      const data = await fs.readFile(this.config.authFile, "utf-8");
      this.authData = JSON.parse(data);
    } catch (error) {
      throw new AuthenticationError(
        "Auth file not found. Run 'bun auth.ts' to authenticate first.\n" +
          "Expected file: " + this.config.authFile
      );
    }
  }

  private async saveAuth(): Promise<void> {
    if (!this.authData) return;

    const dir = path.dirname(this.config.authFile);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.config.authFile, JSON.stringify(this.authData, null, 2));
  }

  private async ensureToken(): Promise<void> {
    if (!this.isTokenValid()) {
      await this.refreshCopilotToken();
    }
  }

  private githubHeaders(): Record<string, string> {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "token " + this.authData!.githubToken,
      "Editor-Version": "vscode/" + VSCODE_VERSION,
      "Editor-Plugin-Version": "copilot-chat/" + COPILOT_VERSION,
      "User-Agent": "GitHubCopilotChat/" + COPILOT_VERSION,
      "X-Github-Api-Version": API_VERSION,
    };
  }

  private copilotHeaders(vision = false): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Bearer " + this.authData!.copilotToken,
      "Copilot-Integration-Id": "vscode-chat",
      "Editor-Version": "vscode/" + VSCODE_VERSION,
      "Editor-Plugin-Version": "copilot-chat/" + COPILOT_VERSION,
      "User-Agent": "GitHubCopilotChat/" + COPILOT_VERSION,
      "Openai-Intent": "conversation-panel",
      "X-Github-Api-Version": API_VERSION,
      "X-Request-Id": randomUUID(),
      "X-Vscode-User-Agent-Library-Version": "electron-fetch",
      "X-Initiator": "user",
    };

    if (vision) {
      headers["Copilot-Vision-Request"] = "true";
    }

    return headers;
  }

  private buildChatPayload(request: ChatRequest): Record<string, unknown> {
    const messages = [...request.messages];

    // Prepend system prompt if provided
    if (request.systemPrompt) {
      messages.unshift({ role: "system", content: request.systemPrompt });
    }

    return {
      model: request.model,
      messages,
      stream: request.stream ?? false,
      temperature: request.temperature,
      top_p: request.top_p,
      max_tokens: request.max_tokens,
      n: request.n,
      stop: request.stop,
      frequency_penalty: request.frequency_penalty,
      presence_penalty: request.presence_penalty,
      seed: request.seed,
      response_format: request.response_format,
      tools: request.tools,
      tool_choice: request.tool_choice,
      user: request.user,
      logprobs: request.logprobs,
      logit_bias: request.logit_bias,
    };
  }

  private hasVision(messages: Message[]): boolean {
    return messages.some(
      (m) =>
        Array.isArray(m.content) &&
        m.content.some((c) => "type" in c && c.type === "image_url")
    );
  }

  private async handleError(res: Response): Promise<never> {
    const body = await res.text();

    if (res.status === 401 || res.status === 403) {
      throw new AuthenticationError("Authentication failed", res.status, body);
    }

    if (res.status === 429) {
      const retryAfter = res.headers.get("retry-after");
      throw new RateLimitError(
        "Rate limit exceeded",
        retryAfter ? parseInt(retryAfter, 10) : undefined
      );
    }

    throw new CopilotError("API error: " + res.status, res.status, body);
  }
}

// ----------------------------------------------------------------------------
// Factory function
// ----------------------------------------------------------------------------

/**
 * Create and initialize a Copilot client
 */
export async function createCopilotClient(
  config: CopilotConfig
): Promise<CopilotClient> {
  const client = new CopilotClient(config);
  await client.init();
  return client;
}
