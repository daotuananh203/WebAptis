/**
 * Deterministic Grading Engine Error Models
 * Defines typed errors for grading validation and execution failures.
 */

export type GradingErrorCode =
  | "INVALID_SUBMISSION"
  | "INVALID_AUDIO"
  | "NO_SPEECH"
  | "GRADING_TIMEOUT"
  | "AI_PROVIDER_ERROR"
  | "INVALID_AI_RESPONSE"
  | "INVALID_TASK_CONTEXT"
  | "INVALID_ANSWER_KEY"
  | "UNKNOWN_QUESTION"
  | "DUPLICATE_QUESTION_ID"
  | "MISSING_ANSWER_KEY"
  | "INVALID_ANSWER_FORMAT";

export class GradingError extends Error {
  public readonly code: GradingErrorCode;
  public readonly details?: unknown;

  constructor(code: GradingErrorCode, message: string, details?: unknown) {
    super(`[GRADING_ERROR:${code}] ${message}`);
    this.name = "GradingError";
    this.code = code;
    this.details = details;

    // Maintain prototype chain
    Object.setPrototypeOf(this, GradingError.prototype);
  }
}

export function createGradingError(
  code: GradingErrorCode,
  message: string,
  details?: unknown
): GradingError {
  return new GradingError(code, message, details);
}
