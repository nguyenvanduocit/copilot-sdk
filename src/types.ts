// ============================================================================
// GitHub Copilot SDK - TypeScript Types
// ============================================================================

// ----------------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------------

export interface CopilotConfig {
  /** Path to auth.json file */
  authFile: string;
  /** Refresh token N seconds before expiry (default: 60) */
  refreshBuffer?: number;
  /** Max retry attempts for failed requests (default: 2) */
  maxRetries?: number;
  /** Request timeout in milliseconds (default: 60000) */
  timeout?: number;
}

export interface RequestOptions {
  /** AbortSignal for cancelling requests */
  signal?: AbortSignal;
  /** Override timeout for this request (ms) */
  timeout?: number;
}

export interface CopilotTokenResponse {
  token: string;
  expires_at: number;
  refresh_in: number;
}

export interface GitHubUser {
  login: string;
  id: number;
  name?: string;
  email?: string;
  plan?: {
    name: string;
  };
}

// ----------------------------------------------------------------------------
// Messages
// ----------------------------------------------------------------------------

export type Role = "system" | "user" | "assistant" | "tool" | "developer";

export interface TextContent {
  type: "text";
  text: string;
}

export interface ImageContent {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "low" | "high" | "auto";
  };
}

export type MessageContent = string | (TextContent | ImageContent)[];

export interface Message {
  role: Role;
  content: MessageContent;
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

// ----------------------------------------------------------------------------
// Tools / Function Calling
// ----------------------------------------------------------------------------

export interface FunctionDefinition {
  name: string;
  description?: string;
  parameters: Record<string, unknown>;
}

export interface Tool {
  type: "function";
  function: FunctionDefinition;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export type ToolChoice =
  | "none"
  | "auto"
  | "required"
  | { type: "function"; function: { name: string } };

// ----------------------------------------------------------------------------
// Chat Request
// ----------------------------------------------------------------------------

export interface ChatRequest {
  /** Model ID (e.g., "gpt-4o", "claude-sonnet-4") */
  model: string;
  /** Conversation messages */
  messages: Message[];
  /** System prompt (convenience - will be prepended to messages) */
  systemPrompt?: string;
  /** Enable streaming response */
  stream?: boolean;
  /** Sampling temperature (0-2) */
  temperature?: number;
  /** Nucleus sampling (0-1) */
  top_p?: number;
  /** Maximum tokens to generate */
  max_tokens?: number;
  /** Number of completions to generate */
  n?: number;
  /** Stop sequences */
  stop?: string | string[];
  /** Frequency penalty (-2 to 2) */
  frequency_penalty?: number;
  /** Presence penalty (-2 to 2) */
  presence_penalty?: number;
  /** Random seed for deterministic output */
  seed?: number;
  /** Response format */
  response_format?: { type: "json_object" | "text" };
  /** Tools for function calling */
  tools?: Tool[];
  /** Tool choice strategy */
  tool_choice?: ToolChoice;
  /** User identifier */
  user?: string;
  /** Log probabilities */
  logprobs?: boolean;
  /** Logit bias */
  logit_bias?: Record<string, number>;
}

// ----------------------------------------------------------------------------
// Chat Response
// ----------------------------------------------------------------------------

export interface ChatChoice {
  index: number;
  message: {
    role: "assistant";
    content: string | null;
    tool_calls?: ToolCall[];
  };
  finish_reason: "stop" | "length" | "tool_calls" | "content_filter";
  logprobs: unknown | null;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details?: {
    cached_tokens: number;
  };
  completion_tokens_details?: {
    accepted_prediction_tokens?: number;
    rejected_prediction_tokens?: number;
  };
}

export interface ChatResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: ChatChoice[];
  usage?: Usage;
  system_fingerprint?: string;
}

// ----------------------------------------------------------------------------
// Streaming
// ----------------------------------------------------------------------------

export interface StreamDelta {
  role?: "assistant";
  content?: string | null;
  tool_calls?: Array<{
    index: number;
    id?: string;
    type?: "function";
    function?: {
      name?: string;
      arguments?: string;
    };
  }>;
}

export interface StreamChoice {
  index: number;
  delta: StreamDelta;
  finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | null;
  logprobs: unknown | null;
}

export interface ChatChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: StreamChoice[];
  usage?: Usage;
  system_fingerprint?: string;
}

// ----------------------------------------------------------------------------
// Models
// ----------------------------------------------------------------------------

export interface ModelCapabilities {
  family: string;
  tokenizer: string;
  type: string;
  limits: {
    max_context_window_tokens?: number;
    max_output_tokens?: number;
    max_prompt_tokens?: number;
    max_inputs?: number;
  };
  supports: {
    tool_calls?: boolean;
    parallel_tool_calls?: boolean;
    dimensions?: boolean;
  };
}

export interface Model {
  id: string;
  name: string;
  vendor: string;
  version: string;
  object: string;
  preview: boolean;
  model_picker_enabled: boolean;
  capabilities: ModelCapabilities;
  policy?: {
    state: string;
    terms: string;
  };
}

export interface ModelsResponse {
  data: Model[];
  object: string;
}

// ----------------------------------------------------------------------------
// Embeddings
// ----------------------------------------------------------------------------

export interface EmbeddingRequest {
  input: string | string[];
  model: string;
  dimensions?: number;
}

export interface Embedding {
  object: string;
  embedding: number[];
  index: number;
}

export interface EmbeddingResponse {
  object: string;
  data: Embedding[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// ----------------------------------------------------------------------------
// Usage / Quota
// ----------------------------------------------------------------------------

export interface QuotaDetail {
  entitlement: number;
  overage_count: number;
  overage_permitted: boolean;
  percent_remaining: number;
  quota_id: string;
  quota_remaining: number;
  remaining: number;
  unlimited: boolean;
}

export interface QuotaSnapshots {
  chat: QuotaDetail;
  completions: QuotaDetail;
  premium_interactions: QuotaDetail;
}

export interface CopilotUsage {
  access_type_sku: string;
  analytics_tracking_id: string;
  assigned_date: string;
  can_signup_for_limited: boolean;
  chat_enabled: boolean;
  copilot_plan: string;
  organization_login_list: unknown[];
  organization_list: unknown[];
  quota_reset_date: string;
  quota_snapshots: QuotaSnapshots;
}

// ----------------------------------------------------------------------------
// Errors
// ----------------------------------------------------------------------------

export class CopilotError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "CopilotError";
  }
}

export class AuthenticationError extends CopilotError {
  constructor(message: string, status?: number, body?: unknown) {
    super(message, status, body);
    this.name = "AuthenticationError";
  }
}

export class RateLimitError extends CopilotError {
  constructor(message: string, public retryAfter?: number) {
    super(message, 429);
    this.name = "RateLimitError";
  }
}
