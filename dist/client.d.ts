import type { CopilotConfig, ChatRequest, ChatResponse, ChatChunk, Model, EmbeddingRequest, EmbeddingResponse, CopilotUsage } from "./types.js";
export declare class CopilotClient {
    private config;
    private authData?;
    private modelsCache?;
    constructor(config?: CopilotConfig);
    /**
     * Initialize the client - loads auth from file
     */
    init(): Promise<void>;
    /**
     * Get current authenticated user
     */
    getUser(): string | undefined;
    /**
     * Send a chat completion request (non-streaming)
     */
    chat(request: ChatRequest): Promise<ChatResponse>;
    /**
     * Send a chat completion request (streaming)
     * Returns an async generator that yields chunks
     */
    chatStream(request: ChatRequest): AsyncGenerator<ChatChunk>;
    /**
     * Convenience method: chat with just a string prompt
     */
    prompt(prompt: string, options?: Partial<Omit<ChatRequest, "messages">>): Promise<string>;
    /**
     * Convenience method: stream chat with just a string prompt
     */
    promptStream(prompt: string, options?: Partial<Omit<ChatRequest, "messages">>): AsyncGenerator<string>;
    /**
     * Get available models
     */
    getModels(forceRefresh?: boolean): Promise<Model[]>;
    /**
     * Get a specific model by ID
     */
    getModel(modelId: string): Promise<Model | undefined>;
    /**
     * Create embeddings
     */
    createEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse>;
    /**
     * Get current usage and quota information
     */
    getUsage(): Promise<CopilotUsage>;
    /**
     * Check if current token is valid
     */
    isTokenValid(): boolean;
    /**
     * Force refresh the Copilot token
     */
    refreshCopilotToken(): Promise<void>;
    /**
     * Get the current Copilot token (for advanced use cases)
     */
    getCopilotToken(): string | undefined;
    /**
     * Get token expiry time
     */
    getTokenExpiry(): Date | undefined;
    private loadAuth;
    private saveAuth;
    private ensureToken;
    private githubHeaders;
    private copilotHeaders;
    private buildChatPayload;
    private hasVision;
    private handleError;
}
/**
 * Create and initialize a Copilot client
 */
export declare function createCopilotClient(config?: CopilotConfig): Promise<CopilotClient>;
//# sourceMappingURL=client.d.ts.map