// ============================================================================
// GitHub Copilot SDK - TypeScript Types
// ============================================================================
// ----------------------------------------------------------------------------
// Errors
// ----------------------------------------------------------------------------
export class CopilotError extends Error {
    status;
    body;
    constructor(message, status, body) {
        super(message);
        this.status = status;
        this.body = body;
        this.name = "CopilotError";
    }
}
export class AuthenticationError extends CopilotError {
    constructor(message, status, body) {
        super(message, status, body);
        this.name = "AuthenticationError";
    }
}
export class RateLimitError extends CopilotError {
    retryAfter;
    constructor(message, retryAfter) {
        super(message, 429);
        this.retryAfter = retryAfter;
        this.name = "RateLimitError";
    }
}
