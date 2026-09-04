export const COACH_SESSION_EXPIRED_MESSAGE =
  "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.";

/** Map stable API error codes to messages safe to render in the Coach UI. */
export function coachUserErrorMessage(code: unknown): string {
  if (code === "AUTHENTICATION_REQUIRED") {
    return COACH_SESSION_EXPIRED_MESSAGE;
  }
  if (code === "INVALID_REQUEST") {
    return "Yêu cầu chưa hợp lệ. Vui lòng kiểm tra lại nội dung và thử lại.";
  }
  if (code === "AI_PROVIDER_TIMEOUT") {
    return "Cố vấn AI phản hồi quá lâu. Vui lòng thử lại sau.";
  }
  if (code === "AI_PROVIDER_ERROR") {
    return "Cố vấn AI đang gặp sự cố tạm thời. Vui lòng thử lại sau.";
  }
  return "Xin lỗi, đã xảy ra lỗi khi kết nối tới Cố vấn AI. Vui lòng thử lại sau.";
}
