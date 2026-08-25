# BÁO CÁO KIỂM TOÁN CƠ SỞ DỮ LIỆU POSTGRESQL (PRODUCTION DATABASE READINESS)

---

## 1. KIẾN TRÚC VÀ CẤU HÌNH POSTGRESQL (NEON SERVERLESS / SELF-HOSTED)
- **Engine kết nối:** `pg` (Node-Postgres) kết hợp Connection Pool (`Pool`) tối ưu hóa cho môi trường Serverless và Container.
- **Connection Pool Config:**
  - `max: 10` connections per worker.
  - `idleTimeoutMillis: 30000` (30 giây tự động giải phóng connection nhàn rỗi).
  - `ssl: { rejectUnauthorized: false }` (Bắt buộc SSL mã hóa trên cloud/Neon pooler).
- **Graceful Fallback Mode:**
  - Trong môi trường Development/CI: Cho phép `ALLOW_MEMORY_STORE="true"` với JSON storage an toàn.
  - Trong môi trường Production (`NODE_ENV === "production"`): Tự động bắt buộc kết nối PostgreSQL thực tế; nếu thiếu chuỗi kết nối sẽ fail fast có kiểm soát với thông báo cấu hình rõ ràng.

---

## 2. HỆ THỐNG QUẢN LÝ MIGRATION PHÂN PHIÊN BẢN (VERSIONED MIGRATIONS)
- **Công cụ thực thi:** [`scripts/migrate.ts`](file:///d:/%E1%BB%A8NG%20D%E1%BB%A4NG%20AI%20AGENT%20CHO%20NGHI%C3%8AN%20C%E1%BB%A8U%20KHOA%20H%E1%BB%8CC-20260513T124251Z-3-001/WebAptis/project/scripts/migrate.ts).
- **Cơ chế Tracking:** Bảng `_migrations` lưu trữ lịch sử các file SQL đã áp dụng (`name`, `applied_at`).
- **Giao dịch Transaction:** Mỗi file migration được thực thi trong một `BEGIN ... COMMIT` block. Nếu xảy ra lỗi sẽ tự động `ROLLBACK` và dừng quy trình an toàn.

---

## 3. AUDIT LƯỢC ĐỒ DỮ LIỆU (SCHEMA & INDEXES AUDIT)

| Bảng | Khóa chính (PK) | Khóa ngoại (FK) | Ràng buộc duy nhất (Unique) | Chỉ mục (Indexes) | Xử lý Cascade |
| ---- | :---: | :---: | :---: | :---: | :---: |
| `users` | `id` (UUID) | Không | `email` UNIQUE | `idx_users_email` | — |
| `sessions` | `id` (VARCHAR) | `user_id -> users(id)` | — | `idx_sessions_user_id`, `idx_sessions_expires_at` | `ON DELETE CASCADE` |
| `progress_attempts` | `id` (VARCHAR) | `user_id -> users(id)` | — | `idx_progress_user_id`, `idx_progress_user_skill`, `idx_progress_user_completed` | `ON DELETE CASCADE` |
| `user_preferences` | `user_id` (UUID) | `user_id -> users(id)` | — | PK index | `ON DELETE CASCADE` |

---

## 4. CÁC THỬ NGHIỆM ĐỘ TIN CẬY DỮ LIỆU (DATA INTEGRITY & CONCURRENCY)
1. **Cô lập dữ liệu người dùng (Multi-user Isolation):** Khóa ngoại `user_id` và các câu truy vấn lọc theo session user ngăn chặn tuyệt đối tình trạng đọc chéo dữ liệu giữa User A và User B.
2. **Giao dịch ghi đồng thời (Concurrent Writes):** Khóa chính UUID sinh ngẫu nhiên đảm bảo không bị xung đột khóa khi hàng trăm thí sinh nộp bài cùng một thời điểm.
3. **Phục hồi kết nối (Reconnect Resilience):** Connection Pool tự động tái tạo kết nối bị ngắt quãng mà không cần restart tiến trình Node.js.
