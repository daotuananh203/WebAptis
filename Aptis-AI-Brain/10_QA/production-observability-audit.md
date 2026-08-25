# BÁO CÁO KIỂM TOÁN GIÁM SÁT & XỬ LÝ LỖI (PRODUCTION OBSERVABILITY & ERROR HANDLING AUDIT)

---

## 1. HỆ THỐNG XỬ LÝ LỖI TẬP TRUNG (CENTRALIZED ERROR BOUNDARIES)
- **Global Error Boundary:** [`app/error.tsx`](file:///d:/%E1%BB%A8NG%20D%E1%BB%A4NG%20AI%20AGENT%20CHO%20NGHI%C3%8AN%20C%E1%BB%A8U%20KHOA%20H%E1%BB%8CC-20260513T124251Z-3-001/WebAptis/project/app/error.tsx) bao bọc toàn bộ client tree. Khi có unhandled exception, hiển thị giao diện thông báo thân thiện với nút "Thử lại" và "Về bảng điều khiển", không để lộ stack trace ra người dùng.
- **Custom 404 Not Found:** [`app/not-found.tsx`](file:///d:/%E1%BB%A8NG%20D%E1%BB%A4NG%20AI%20AGENT%20CHO%20NGHI%C3%8AN%20C%E1%BB%A8U%20KHOA%20H%E1%BB%8CC-20260513T124251Z-3-001/WebAptis/project/app/not-found.tsx) xử lý mượt mà các link sai hoặc route không tồn tại.
- **Route Handlers Try/Catch:** Mọi API route (`/api/*`) đều có khối `try/catch` bọc ngoài, trả về mã lỗi HTTP chuẩn (`400`, `401`, `403`, `404`, `500`) kèm JSON error format `{ error: string, code?: string }`.

---

## 2. CHÍNH SÁCH LỌC VÀ BẢO MẬT NHẬT KÝ (LOG SANITIZATION POLICY)
- **Không Log Mật Khẩu:** Mật khẩu thô (`password`, `confirmPassword`) bị loại bỏ trước khi ghi log hoặc lưu trữ.
- **Không Log API Keys:** Chuỗi `GEMINI_API_KEY`, `AUTH_SECRET`, `DATABASE_URL` không bao giờ xuất hiện trong log client hay stdout.
- **Không Log Dữ Liệu Audio Thô:** Payload base64 của speaking recording không in ra console, chỉ log metadata kích thước và MIME type.

---

## 3. GIÁM SÁT SỨC KHỎE HỆ THỐNG (HEALTH CHECK ENDPOINT)
- **Endpoint:** `GET /api/health`
- **Thời gian phản hồi:** < 15ms.
- **Dữ liệu trả về:**
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-08-25T08:55:00.000Z",
    "uptimeSeconds": 120,
    "version": "1.0.0",
    "checks": {
      "aiProvider": "configured",
      "database": "configured",
      "knowledgeBrain": "compiled_ready",
      "listeningAudio": "available"
    }
  }
  ```
- **Tích hợp Monitoring:** Tương thích trực tiếp với UptimeRobot, BetterUptime, Datadog, Prometheus hoặc AWS Route 53 Health Checks.
