import { GradingErrorCode } from "../grading/errors";

export type CoachPublicErrorCode =
  | "INVALID_REQUEST"
  | "AI_PROVIDER_ERROR"
  | "AI_PROVIDER_TIMEOUT"
  | "AI_COACH_ERROR";

/** Map internal coach/grading failures to stable, client-safe HTTP semantics. */
export function coachErrorStatus(code: GradingErrorCode | string): number {
  if (code === "GRADING_TIMEOUT") return 504;
  if (code === "AI_PROVIDER_ERROR" || code === "INVALID_AI_RESPONSE") return 502;
  return 400;
}

export function coachPublicErrorCode(code: GradingErrorCode | string): CoachPublicErrorCode {
  if (code === "GRADING_TIMEOUT") return "AI_PROVIDER_TIMEOUT";
  if (code === "AI_PROVIDER_ERROR" || code === "INVALID_AI_RESPONSE") return "AI_PROVIDER_ERROR";
  return "INVALID_REQUEST";
}

export function coachPublicErrorMessage(code: GradingErrorCode | string): string {
  if (code === "GRADING_TIMEOUT") {
    return "AI Coach phản hồi quá lâu. Vui lòng thử lại sau.";
  }
  if (code === "AI_PROVIDER_ERROR" || code === "INVALID_AI_RESPONSE") {
    return "AI Coach đang gặp sự cố tạm thời. Vui lòng thử lại sau.";
  }
  return "Yêu cầu AI Coach không hợp lệ. Vui lòng kiểm tra lại nội dung và thử lại.";
}
