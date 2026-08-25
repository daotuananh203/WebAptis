# KẾ HOẠCH SAO LƯU & PHỤC HỒI THẢM HỌA (PRODUCTION BACKUP & RECOVERY PLAN)

---

## 1. PHẠM VI DỮ LIỆU CẦN SAO LƯU (BACKUP SCOPE)
1. **Cơ sở dữ liệu PostgreSQL (Neon / Managed DB):**
   - Bảng `users`: Tài khoản, thông tin phân quyền và mật khẩu mã hóa Argon2/SHA256.
   - Bảng `progress_attempts`: Lịch sử làm bài thi thử, điểm số, CEFR estimate band và thời gian nộp bài.
   - Bảng `user_preferences`: Tùy biến âm thanh, tốc độ phát audio và giao diện người dùng.
2. **Knowledge Vault & Staging Data:**
   - `data/knowledge/vault-compiled.json`: Kho tri thức 80+ bài giảng, chiến thuật, từ vựng và ngữ pháp Aptis B2.
   - `data/tests/`: 16 bộ đề thi thử công khai và đáp án chuẩn.
   - `public/audio/listening/`: 15 master MP3s, 190 Part 1 question audio slices, 45 Part 2-4 audio files.

---

## 2. QUY TRÌNH SAO LƯU TỰ ĐỘNG (BACKUP PROCEDURES)

### A. Sao lưu qua Script tích hợp
```bash
npx tsx scripts/backup-restore.ts backup [thư_mục_đích]
```
Script sẽ tự động:
- Dump bảng `users` và `progress_attempts` sang JSON format.
- Snapshot kho tri thức `vault-compiled.json` và bộ nhớ người dùng.
- Lưu trữ theo định dạng timestamp: `backups/backup-YYYY-MM-DDTHH-MM-SS/`.

### B. Sao lưu PostgreSQL mức hạ tầng (PostgreSQL pg_dump / Neon Branching)
- **Neon Serverless:** Tạo snapshot nhánh tự động (*Point-in-time recovery - PITR*) theo chu kỳ mỗi ngày.
- **pg_dump command:**
```bash
pg_dump $DATABASE_URL -F c -b -v -f webaptis_db_backup.dump
```

---

## 3. QUY TRÌNH PHỤC HỒI DỮ LIỆU (DISASTER RECOVERY PROCEDURES)

### A. Phục hồi qua Script tích hợp
```bash
npx tsx scripts/backup-restore.ts restore backups/backup-YYYY-MM-DDTHH-MM-SS
```

### B. Phục hồi PostgreSQL Database
```bash
pg_restore -d $DATABASE_URL -v webaptis_db_backup.dump
```

### C. Khởi tạo & Chạy Migration trên Database mới
```bash
npx tsx scripts/migrate.ts
```

---

## 4. KẾ HOẠCH ROLLBACK TRIỂN KHAI (DEPLOYMENT ROLLBACK PLAN)
1. **Rollback Vercel Deployment:** Nhấn *Instant Rollback* về deployment hash ổn định trước đó (thời gian khôi phục < 5 giây).
2. **Rollback Docker Container:** `docker compose up -d webaptis:previous_tag`.
3. **Rollback Database Migration:** Áp dụng script `down` hoặc restore snapshot point-in-time trước thời điểm deploy.
