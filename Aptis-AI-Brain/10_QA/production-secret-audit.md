# BÁO CÁO KIỂM TOÁN BẢO MẬT & SECRET TOÀN DIỆN (PRODUCTION SECRET AUDIT)

---

## 1. PHÂN LOẠI BIẾN MÔI TRƯỜNG (ENVIRONMENT VARIABLE CLASSIFICATION)

### A. Server-Side Secrets (Tuyệt đối không đưa ra Client / Bundle)
- `GEMINI_API_KEY`: API key xác thực với Google GenAI (dùng trong Route Handlers `/api/grade/*` và `/api/coach/chat`).
- `DATABASE_URL` / `POSTGRES_URL`: Chuỗi kết nối PostgreSQL có chứa thông tin user/password (dùng trong Neon/Postgres pooler server-side).
- `AUTH_SECRET` / `SESSION_SECRET`: Secret key dùng để ký HMAC-SHA256 cho session cookie `aptis_session`.
- `ALLOW_MEMORY_STORE`: Cờ kiểm soát bộ nhớ fallback (bị vô hiệu hóa tự động ở production).

### B. Client-Safe Public Variables
- Không có bất kỳ biến `NEXT_PUBLIC_*` nào chứa secret hoặc API keys trong toàn bộ dự án.

---

## 2. KẾT QUẢ QUÉT SECRET TRÊN SOURCE CODE & GIT INDEX
- **Số tệp tin quét:** Tất cả mã nguồn `app/`, `lib/`, `components/`, `data/`, `scripts/`.
- **Phát hiện lộ secret trên Git/Client:** **0 FINDINGS (100% CLEAN)**.
- **Tệp `.env.local`:** Được loại trừ trong `.gitignore`.
- **Tệp `.env.example`:** Chỉ chứa giá trị mẫu/placeholder an toàn, không chứa thông tin nhạy cảm.

---

## 3. CHÍNH SÁCH BẢO VỆ SECRET TRONG MÔI TRƯỜNG DEPLOYMENT
1. **Vercel Deployment:** Cấu hình trực tiếp trong phần *Project Settings -> Environment Variables* (được mã hóa ở tầng hạ tầng của Vercel).
2. **Docker / Self-Hosted:** Tiêm biến môi trường qua Docker Secrets hoặc runtime environment flags (`-e GEMINI_API_KEY=...`), không build-hardcode vào Dockerfile layer.
3. **Log Sanitization:** Toàn bộ Route Handlers và logger hệ thống đều lọc bỏ `password`, `apiKey`, `token` trước khi in ra stdout.
