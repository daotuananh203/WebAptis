/** Maximum time a single Gemini examiner request may occupy a route. */
export const AI_GRADING_TIMEOUT_MS = 45_000;

export class AiGradingTimeoutError extends Error {
  readonly code = "AI_TIMEOUT" as const;

  constructor(timeoutMs: number) {
    super(`AI grading timed out after ${timeoutMs}ms`);
    this.name = "AiGradingTimeoutError";
  }
}

/**
 * Bound an SDK request even when the provider does not expose an AbortSignal
 * in the current runtime. The race also attaches a rejection handler to the
 * underlying promise, so a late provider response cannot become unhandled.
 */
export function withAiGradingTimeout<T>(
  operation: Promise<T> | ((signal: AbortSignal) => Promise<T>),
  timeoutMs = AI_GRADING_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  let operationPromise: Promise<T>;
  try {
    operationPromise = typeof operation === "function"
      ? operation(controller.signal)
      : operation;
  } catch (error) {
    operationPromise = Promise.reject(error);
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      // The current GenAI SDK accepts an AbortSignal. Aborting here prevents a
      // timed-out request from continuing to consume serverless resources.
      controller.abort();
      reject(new AiGradingTimeoutError(timeoutMs));
    }, timeoutMs);
  });

  return Promise.race([operationPromise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}
