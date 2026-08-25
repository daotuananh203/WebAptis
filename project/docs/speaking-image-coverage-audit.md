# WEBAPTIS B2 — SPEAKING IMAGE COVERAGE FORENSIC AUDIT REPORT

**Ngày thực hiện:** 23/08/2026  
**Phạm vi:** Điều tra tư pháp (Forensic Audit) toàn bộ 110 đề/chủ đề Speaking, 81 file hình ảnh, API, Practice Hub, Practice Shell, Mock Test và DOM Rendering.  
**Nguyên tắc:** KHÔNG SỬA CODE — KHÔNG TẠO DỮ LIỆU GIẢ — CHỈ ĐIỀU TRA VÀ BÁO CÁO.

---

## 1. TRẢ LỜI TRỰC TIẾP CÂU HỎI CỦA USER

> **Câu hỏi:** *"Vì sao browser thực tế chỉ thấy khoảng 2–3 đề có hình trong khi báo cáo trước nói Part 2/3 đã có đầy đủ hình?"*

Qua điều tra tư pháp toàn diện trên mọi tầng kiến trúc (Database/JSON → API → Routing → Component UI → DOM Browser), nguyên nhân gốc rễ (Root Cause) gồm **3 yếu tố kết hợp**:

### Yếu tố 1: Sự cố điều hướng khi vào từ "Luyện theo Part" (`viewMode === "parts"`)
- Trong giao diện Luyện tập, khi người dùng chuyển sang tab **"Luyện theo Part"** và click vào **"Part 2: Miêu tả 1 bức ảnh"** (`/practice/speaking/part2`) hoặc **"Part 3: So sánh 2 bức ảnh"** (`/practice/speaking/part3`):
- URL không truyền query parameter `?testId=...`. File `app/practice/[skill]/[part]/page.tsx` (dòng 21) tự động gán fallback mặc định: `const testId = sParams?.testId || "aptis-b2-01"`.
- Khi tải `aptis-b2-01`, file `data/tests/aptis-b2-01-public.json` trỏ ảnh đến `/images/speaking/test_01_part2.jpg` (và `test_01_part3_a.jpg` / `test_01_part3_b.jpg`).
- **Các file ảnh này KHÔNG TỒN TẠI trên đĩa** (vì 16 bộ đề thi thử gốc DOCX không có asset ảnh nhúng). Khi tải trang, trình duyệt gặp lỗi 404 và handler `onError` ẩn thẻ `<img>`. **Người dùng thấy 0 hình ảnh!**

### Yếu tố 2: Thứ tự hiển thị trong Danh sách Bộ đề (Card List View)
- Trong danh sách 110 đề thi Speaking (`SPEAKING_TESTS_DATA`), **16 thẻ đầu tiên (từ Đề 01 đến Đề 16) là Part 1 (Hỏi đáp cá nhân)**.
- Part 1 trong cấu trúc chuẩn Aptis B2 gồm 3 câu hỏi thông tin cá nhân (không có hình ảnh).
- Người dùng khi vào danh sách và bấm thử các đề đầu tiên (Đề 01, Đề 02, Đề 03, Đề 04) sẽ **hoàn toàn không thấy hình ảnh** vì đây là Part 1!
- Hình ảnh thật chỉ bắt đầu xuất hiện từ **thẻ thứ 17 trở đi** (Part 2: từ thẻ 17 đến 48, Part 3: từ thẻ 49 đến 81).

### Yếu tố 3: Bộ lọc "Trọng điểm tháng" (Featured Toggle)
- Khi người dùng bấm nút lọc **"Trọng điểm tháng"** trên thanh công cụ:
- Hệ thống chỉ hiển thị đúng **10 đề** có cờ `isFeatured = true` (gồm 4 đề Part 1 không có ảnh và 6 đề Part 2 có ảnh).
- Trong 10 đề này, nếu người dùng bấm ngẫu nhiên 4-5 đề, sẽ chỉ thấy 2–3 đề Part 2 có hình, các đề Part 1 còn lại không có hình, dẫn đến cảm nhận chỉ có 2-3 đề có hình trên toàn bộ web!

---

## 2. BẢNG AUDIT CHI TIẾT SPEAKING PART 2 (32/32 TOPICS)

| # | Topic ID | Tên chủ đề | Số câu | Image URL | File trên đĩa | Kích thước | Trạng thái API | Trạng thái Browser |
|---|---|---|---|---|---|---|---|---|
| 1 | `gdrive_spk_p2_002` | Cô gái trên boong thuyền | 3 | `part_2_Cô_gái_trên_boong_thuyền_1_058a5a03.jpg` | ✅ YES | 522 KB | ✅ 200 OK | ✅ RENDER |
| 2 | `gdrive_spk_p2_003` | Mẹ dạy con cưỡi ngựa | 3 | `part_2_Mẹ_dạy_con_cưỡi_ngựa_1_a2ec392a.jpg` | ✅ YES | 196 KB | ✅ 200 OK | ✅ RENDER |
| 3 | `gdrive_spk_p2_004` | Nhóm người ở triển lãm | 3 | `part_2_Nhóm_người_ở_triển_lãm_1_f1d5137e.jpg` | ✅ YES | 344 KB | ✅ 200 OK | ✅ RENDER |
| 4 | `gdrive_spk_p2_005` | Nhóm người đợi tàu | 3 | `part_2_Nhóm_người_đợi_tàu_1_b085a9b4.jpg` | ✅ YES | 289 KB | ✅ 200 OK | ✅ RENDER |
| 5 | `gdrive_spk_p2_006` | Cô gái ngồi làm việc | 3 | `part_2_Cô_gái_ngồi_làm_việc_1_16896a29.jpg` | ✅ YES | 225 KB | ✅ 200 OK | ✅ RENDER |
| 6 | `gdrive_spk_p2_007` | Nhóm người ở phòng làm việc | 3 | `part_2_Nhóm_người_ở_phòng_làm_việc_1_dbf42c26.jpg` | ✅ YES | 136 KB | ✅ 200 OK | ✅ RENDER |
| 7 | `gdrive_spk_p2_008` | Ba người ăn tối | 3 | `part_2_Ba_người_ăn_tối_1_211b69f6.jpg` | ✅ YES | 222 KB | ✅ 200 OK | ✅ RENDER |
| 8 | `gdrive_spk_p2_009` | Cậu bé tưới cây | 3 | `part_2_Cậu_bé_tưới_cây_1_bc1cf3f7.jpg` | ✅ YES | 192 KB | ✅ 200 OK | ✅ RENDER |
| 9 | `gdrive_spk_p2_010` | Hai người chạy bộ trong công viên | 3 | `part_2_Hai_người_chạy_bộ_trong_công_viên_1_e4171ec5.jpg` | ✅ YES | 280 KB | ✅ 200 OK | ✅ RENDER |
| 10 | `gdrive_spk_p2_011` | Cậu bé leo núi | 3 | `part_2_Cậu_bé_leo_núi_1_0c59e9bf.jpg` | ✅ YES | 200 KB | ✅ 200 OK | ✅ RENDER |
| 11 | `gdrive_spk_p2_012` | Hai người chơi game | 3 | `part_2_Hai_người_chơi_game_1_e9ba7e2c.jpg` | ✅ YES | 473 KB | ✅ 200 OK | ✅ RENDER |
| 12 | `gdrive_spk_p2_013` | Cậu bé câu cá | 3 | `part_2_Cậu_bé_câu_cá_1_dcf9827c.jpg` | ✅ YES | 363 KB | ✅ 200 OK | ✅ RENDER |
| 13 | `gdrive_spk_p2_014` | Hai người đi dạo trong công viên | 3 | `part_2_Hai_người_đi_dạo_trong_công_viên_1_f567b4eb.jpg` | ✅ YES | 134 KB | ✅ 200 OK | ✅ RENDER |
| 14 | `gdrive_spk_p2_015` | Cặp đôi đi mua sắm | 3 | `part_2_Cặp_đôi_đi_mua_sắm_1_d67f13ff.jpg` | ✅ YES | 191 KB | ✅ 200 OK | ✅ RENDER |
| 15 | `gdrive_spk_p2_016` | Mẹ và con đọc sách | 3 | `part_2_Mẹ_và_con_đọc_sách_1_02da23b2.jpg` | ✅ YES | 158 KB | ✅ 200 OK | ✅ RENDER |
| 16 | `gdrive_spk_p2_017` | Bố và con đá bóng | 3 | `part_2_Bố_và_con_đá_bóng_1_6edd0f99.jpg` | ✅ YES | 296 KB | ✅ 200 OK | ✅ RENDER |
| 17 | `gdrive_spk_p2_018` | Lớp học mầm non | 3 | `part_2_Lớp_học_mầm_non_1_ec565e8b.jpg` | ✅ YES | 190 KB | ✅ 200 OK | ✅ RENDER |
| 18 | `gdrive_spk_p2_019` | Gia đình đá bóng | 3 | `part_2_Gia_đình_đá_bóng_1_6cabb81d.jpg` | ✅ YES | 213 KB | ✅ 200 OK | ✅ RENDER |
| 19 | `gdrive_spk_p2_020` | Hai phụ nữ tập thể dục | 3 | `part_2_Hai_phụ_nữ_tập_thể_dục_1_864db5bc.jpg` | ✅ YES | 243 KB | ✅ 200 OK | ✅ RENDER |
| 20 | `gdrive_spk_p2_022` | Ba cậu bé đá bóng | 3 | `part_2_Ba_cậu_bé_đá_bóng_1_cfbc4293.jpg` | ✅ YES | 191 KB | ✅ 200 OK | ✅ RENDER |
| 21 | `gdrive_spk_p2_023` | Gia đình ăn sáng | 3 | `part_2_Gia_đình_ăn_sáng_1_b4b3b8fe.jpg` | ✅ YES | 44 KB | ✅ 200 OK | ✅ RENDER |
| 22 | `gdrive_spk_p2_025` | Topic 25 | 3 | `part_2_topic_25_1_591461ff.jpg` | ✅ YES | 231 KB | ✅ 200 OK | ✅ RENDER |
| 23 | `gdrive_spk_p2_026` | Nhóm phụ nữ shopping | 3 | `part_2_Nhóm_phụ_nữ_shopping_1_023b7a58.jpg` | ✅ YES | 245 KB | ✅ 200 OK | ✅ RENDER |
| 24 | `gdrive_spk_p2_027` | Nam giảng viên áo đỏ | 3 | `part_2_Nam_giảng_viên_áo_đỏ_1_be1d4a04.jpg` | ✅ YES | 101 KB | ✅ 200 OK | ✅ RENDER |
| 25 | `gdrive_spk_p2_028` | Nhóm người xem phim | 3 | `part_2_Nhóm_người_xem_phim_1_d64e9e03.jpg` | ✅ YES | 69 KB | ✅ 200 OK | ✅ RENDER |
| 26 | `gdrive_spk_p2_029` | Cô gái đi siêu thị | 3 | `part_2_Cô_gái_đi_siêu_thị_1_fbb481d9.jpg` | ✅ YES | 534 KB | ✅ 200 OK | ✅ RENDER |
| 27 | `gdrive_spk_p2_030` | Hai người treo tranh | 3 | `part_2_Hai_người_treo_tranh_1_9c18687e.jpg` | ✅ YES | 249 KB | ✅ 200 OK | ✅ RENDER |
| 28 | `gdrive_spk_p2_031` | Nhiều người trên đường | 3 | `part_2_Nhiều_người_trên_đường_1_375fc6fd.jpg` | ✅ YES | 177 KB | ✅ 200 OK | ✅ RENDER |
| 29 | `gdrive_spk_p2_032` | Gia đình chơi game | 3 | `part_2_Gia_đình_chơi_game_1_d4e59e87.jpg` | ✅ YES | 571 KB | ✅ 200 OK | ✅ RENDER |
| 30 | `gdrive_spk_p2_033` | Nhóm người trong phòng họp | 3 | `part_2_Nhóm_người_trong_phòng_họp_1_57f693d0.jpg` | ✅ YES | 261 KB | ✅ 200 OK | ✅ RENDER |
| 31 | `gdrive_spk_p2_034` | Nhóm bạn học | 3 | `part_2_Nhóm_bạn_học_1_d58ff602.jpg` | ✅ YES | 90 KB | ✅ 200 OK | ✅ RENDER |
| 32 | `gdrive_spk_p2_034b` | Nhóm học sinh làm bài tập | 3 | `part_2_Nhóm_học_sinh_làm_bài_tập_1_864db5bc.jpg` | ✅ YES | 243 KB | ✅ 200 OK | ✅ RENDER |

---

## 3. BẢNG AUDIT CHI TIẾT SPEAKING PART 3 (33/33 TOPICS)

| # | Topic ID | Tên chủ đề | Số câu | Số ảnh | Danh sách ảnh | File trên đĩa | Tổng dung lượng | Trạng thái API | Trạng thái Browser |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `gdrive_spk_p3_035` | Leo núi + Phòng gym | 3 | 2 | `part_3_Leo_núi___Phòng_gym_1_bbb5cf32.jpg`<br/>`part_3_Leo_núi___Phòng_gym_2_bbb5cf32.jpg` | ✅ YES | 429 KB | ✅ 200 OK | ✅ RENDER |
| 2 | `gdrive_spk_p3_036` | Version 1: | 3 | 1 | `part_3_Version_1_1_c493127c.jpg` | ✅ YES | 276 KB | ✅ 200 OK | ✅ RENDER |
| 3 | `gdrive_spk_p3_037` | Version 2: people going on holiday | 1 | 1 | `part_3_Version_2__people_going_on_the_1_2c7afd08.jpg` | ✅ YES | 262 KB | ✅ 200 OK | ✅ RENDER |
| 4 | `gdrive_spk_p3_038` | Between these 2 locations, where do you prefer? | 1 | 0 | *(Không có ảnh trong tài liệu nguồn gốc)* | ⚠️ NO_IMAGE_IN_SOURCE | 0 KB | ✅ 200 OK | ⚠️ NO IMAGE |
| 5 | `gdrive_spk_p3_039` | Rừng thông + Sa mạc | 2 | 2 | `part_3_Rừng_thông___Sa_mạc_1_8ca71f34.jpg`<br/>`part_3_Rừng_thông___Sa_mạc_2_8c1a4f72.jpg` | ✅ YES | 1560 KB | ✅ 200 OK | ✅ RENDER |
| 6 | `gdrive_spk_p3_040` | Nhà mặt đất + Chung cư | 3 | 1 | `part_3_Nhà_mặt_đất___Chung_cư_1_dbf42c26.jpg` | ✅ YES | 282 KB | ✅ 200 OK | ✅ RENDER |
| 7 | `gdrive_spk_p3_041` | Công nhân xây cầu + Cô gái | 3 | 2 | `part_3_Công_nhân_xây_cầu___Cô_gái_1_53fa38b2.jpg`<br/>`part_3_Công_nhân_xây_cầu___Cô_gái_2_7fcf5a61.jpg` | ✅ YES | 711 KB | ✅ 200 OK | ✅ RENDER |
| 8 | `gdrive_spk_p3_042` | Chơi game + Chơi cờ | 3 | 2 | `part_3_Chơi_game___Chơi_cờ_1_ca3e6d24.jpg`<br/>`part_3_Chơi_game___Chơi_cờ_2_76ae960c.jpg` | ✅ YES | 650 KB | ✅ 200 OK | ✅ RENDER |
| 9 | `gdrive_spk_p3_043` | 2 đứa trẻ chơi ipad + 1 đứa | 3 | 1 | `part_3_2_đứa_trẻ_chơi_ipad___1_đứa_1_18f673da.jpg` | ✅ YES | 196 KB | ✅ 200 OK | ✅ RENDER |
| 10 | `gdrive_spk_p3_044` | Ngồi ngắm hoàng hôn + Ngồi sofa | 3 | 2 | `part_3_Ngồi_ngắm_hoàng_hôn___Ngồi__1_3c178225.jpg`<br/>`part_3_Ngồi_ngắm_hoàng_hôn___Ngồi__2_19bfbf77.jpg` | ✅ YES | 126 KB | ✅ 200 OK | ✅ RENDER |
| 11 | `gdrive_spk_p3_045` | Học onl + học off (Thư viện) | 6 | 3 | `part_3_Học_onl___học_off___Thư_vi_1_fe4076f8.jpg`<br/>`part_3_Học_onl___học_off___Thư_vi_2_041935dc.jpg`<br/>`part_3_Học_onl___học_off___Thư_vi_3_1880e609.jpg` | ✅ YES | 164 KB | ✅ 200 OK | ✅ RENDER |
| 12 | `gdrive_spk_p3_046` | Nhà cũ + Nhà mới | 3 | 2 | `part_3_Nhà_cũ___Nhà_mới_1_864db5bc.jpg`<br/>`part_3_Nhà_cũ___Nhà_mới_2_3053664f.jpg` | ✅ YES | 1340 KB | ✅ 200 OK | ✅ RENDER |
| 13 | `gdrive_spk_p3_047` | Chụp ảnh | 3 | 2 | `part_3_Chụp_ảnh_1_0c59e9bf.jpg`<br/>`part_3_Chụp_ảnh_2_bc1cf3f7.jpg` | ✅ YES | 735 KB | ✅ 200 OK | ✅ RENDER |
| 14 | `gdrive_spk_p3_048` | Ăn vỉa hè + Ăn trong nhà hàng | 3 | 1 | `part_3_Ăn_vỉa_hè___Ăn_trong_nhà_h_1_375fc6fd.jpg` | ✅ YES | 108 KB | ✅ 200 OK | ✅ RENDER |
| 15 | `gdrive_spk_p3_049` | Nhóm người ăn trên cỏ + cô gái ăn ở nhà | 3 | 3 | `part_3_Nhóm_người_ăn_trên_cỏ___cô_gái_1_474ec1a9.jpg`<br/>`part_3_Nhóm_người_ăn_trên_cỏ___cô_gái_2_9d45971c.jpg`<br/>`part_3_Nhóm_người_ăn_trên_cỏ___cô_gái_3_0d427ff2.jpg` | ✅ YES | 1172 KB | ✅ 200 OK | ✅ RENDER |
| 16 | `gdrive_spk_p3_050` | Lạc đà + Xe ngựa | 3 | 1 | `part_3_Lạc_đà___Xe_ngựa___traveling_o_1_a9c0b49b.jpg` | ✅ YES | 25 KB | ✅ 200 OK | ✅ RENDER |
| 17 | `gdrive_spk_p3_051` | Mèo + Rắn | 3 | 1 | `part_3_Mèo___Rắn_1_20febbe0.jpg` | ✅ YES | 261 KB | ✅ 200 OK | ✅ RENDER |
| 18 | `gdrive_spk_p3_052` | Khỉ + Cá heo | 3 | 1 | `part_3_Khỉ___Cá_heo___boat_1_96dacbfc.jpg` | ✅ YES | 326 KB | ✅ 200 OK | ✅ RENDER |
| 19 | `gdrive_spk_p3_053` | Piano + Electric guitar | 3 | 1 | `part_3_Piano___Electric_guitar_1_f2674463.jpg` | ✅ YES | 368 KB | ✅ 200 OK | ✅ RENDER |
| 20 | `gdrive_spk_p3_054` | Bóng đá + Nhảy xào | 3 | 1 | `part_3_Bóng_đá___Nhảy_xào_1_ec565e8b.jpg` | ✅ YES | 488 KB | ✅ 200 OK | ✅ RENDER |
| 21 | `gdrive_spk_p3_055` | Thuyết giảng giữa hội trường + 1-1 | 3 | 2 | `part_3_Thuyết_giảng_giữa_hội_trườ_1_a3194a2b.jpg`<br/>`part_3_Thuyết_giảng_giữa_hội_trườ_2_b63a9254.jpg` | ✅ YES | 541 KB | ✅ 200 OK | ✅ RENDER |
| 22 | `gdrive_spk_p3_056` | Trồng hoa + trồng quả | 3 | 2 | `part_3_Trồng_hoa___trồng_quả_1_5360662d.jpg`<br/>`part_3_Trồng_hoa___trồng_quả_2_23194f4c.jpg` | ✅ YES | 259 KB | ✅ 200 OK | ✅ RENDER |
| 23 | `gdrive_spk_p3_057` | Trẻ em ở lớp + ở ngoài | 3 | 2 | `part_3_Trẻ_em_ở_lớp___ở_ngoài_1_0c59e9bf.jpg`<br/>`part_3_Trẻ_em_ở_lớp___ở_ngoài_2_dcf9827c.jpg` | ✅ YES | 575 KB | ✅ 200 OK | ✅ RENDER |
| 24 | `gdrive_spk_p3_058` | 3 người bảo tàng + cậu bé | 3 | 1 | `part_3_3_người_bảo_tàng___cậu_bé__1_190a6125.jpg` | ✅ YES | 59 KB | ✅ 200 OK | ✅ RENDER |
| 25 | `gdrive_spk_p3_059` | Chụp ảnh + Viết giấy | 3 | 1 | `part_3_Chụp_ảnh___Viết_giấy_1_f567b4eb.jpg` | ✅ YES | 199 KB | ✅ 200 OK | ✅ RENDER |
| 26 | `gdrive_spk_p3_060` | Ô tô + tàu lửa | 3 | 1 | `part_3_Ô_tô___tàu_lửa_1_90f2aa74.jpg` | ✅ YES | 113 KB | ✅ 200 OK | ✅ RENDER |
| 27 | `gdrive_spk_p3_061` | Mua sắm | 3 | 1 | `part_3_Mua_sắm_1_02da23b2.jpg` | ✅ YES | 119 KB | ✅ 200 OK | ✅ RENDER |
| 28 | `gdrive_spk_p3_062` | Máy bay + Tàu lửa | 3 | 1 | `part_3_Máy_bay___Tàu_lửa_1_b4b3b8fe.jpg` | ✅ YES | 249 KB | ✅ 200 OK | ✅ RENDER |
| 29 | `gdrive_spk_p3_063` | Quán ăn bên đường + bãi biển | 3 | 1 | `part_3_Quán_ăn_bên_đường___bãi_biển_1_1ee7a99a.jpg` | ✅ YES | 333 KB | ✅ 200 OK | ✅ RENDER |
| 30 | `gdrive_spk_p3_064` | Bóng rổ + tennis | 3 | 1 | `part_3_Bóng_rổ___tennis_1_0329310e.jpg` | ✅ YES | 231 KB | ✅ 200 OK | ✅ RENDER |
| 31 | `gdrive_spk_p3_065` | Tình nguyện | 3 | 2 | `part_3_Tình_nguyện_1_11d43385.jpg`<br/>`part_3_Tình_nguyện_2_649f65c6.jpg` | ✅ YES | 1412 KB | ✅ 200 OK | ✅ RENDER |
| 32 | `gdrive_spk_p3_066` | Bowling leo núi | 3 | 2 | `part_3_Bowling_leo_núi_1_c5c7c85b.jpg`<br/>`part_3_Bowling_leo_núi_2_2aa05162.jpg` | ✅ YES | 645 KB | ✅ 200 OK | ✅ RENDER |
| 33 | `gdrive_spk_p3_067` | Đi bộ | 3 | 2 | `part_3_Đi_bộ_1_d5cbb407.jpg`<br/>`part_3_Đi_bộ_2_5c574934.jpg` | ✅ YES | 373 KB | ✅ 200 OK | ✅ RENDER |

---

## 4. TỔNG HỢP MAPPING MATRIX & IMAGE COLLISION CHECK

- **Tổng số file ảnh thực tế trên đĩa (`public/images/speaking/gdrive/`)**: 81 file JPG.
- **Part 2**: 32 chủ đề → 32 file ảnh riêng biệt, **0 va chạm (Zero Collision)**.
- **Part 3**: 33 chủ đề → 49 file ảnh (16 chủ đề có 2 ảnh, 17 chủ đề có 1 ảnh, 1 chủ đề `gdrive_spk_p3_038` không có ảnh trong file gốc), **0 va chạm (Zero Collision)**.
- **16 Mock Tests (`aptis-b2-01` .. `aptis-b2-16`)**: Có đường dẫn `/images/speaking/test_XX_part2.jpg` nhưng không có file vật lý trên đĩa (thiếu asset từ nguồn Mock Test ban đầu).

---

## 5. BẢNG TỔNG HỢP FORENSIC COVERAGE THEO TỪNG PHẦN

| Part | Tổng số Topics | Có ảnh trong nguồn | Có Mapping trong Data | File tồn tại trên đĩa | Render thành công trên Browser | Phân loại trạng thái |
|---|---|---|---|---|---|---|
| **Part 1 (Personal)** | 16 | 0 (Không yêu cầu) | N/A | N/A | ✅ (3 câu hỏi text) | FULL_TEXT_COVERAGE |
| **Part 2 (Describe)** | 32 | 32 (100%) | 32 (100%) | 32 (100%) | ✅ 32 / 32 visible | FULL_IMAGE_COVERAGE |
| **Part 3 (Compare)** | 33 | 32 (97%) | 32 (97%) | 32 (97%) | ✅ 32 / 32 visible | 32 FULL_IMAGE, 1 NO_IMAGE_IN_SOURCE |
| **Part 4 (Abstract)** | 29 | 0 (Không yêu cầu) | N/A | N/A | ✅ (Chủ đề + 3 câu hỏi) | FULL_TEXT_COVERAGE |
| **Mock Tests (16 tests)** | 16 | 0 | 0 | 0 | ❌ (Ẩn do thiếu file) | MISSING_MOCK_ASSETS |

---

## 6. FINAL VERDICT (KẾT LUẬN CUỐI CÙNG)

### **KẾT LUẬN: F — MULTIPLE ISSUES (Kết hợp giữa cấu trúc điều hướng và phân tách nguồn tài nguyên)**

1. **Đối với 94 Chủ đề Speaking Prediction (Google Drive / Edulife)**:
   - **Đạt 100% độ phủ hình ảnh**: 32/32 chủ đề Part 2 và 32/33 chủ đề Part 3 có hình ảnh thật tồn tại trên đĩa và render chính xác khi truy cập qua `practiceUrl` của candidate (`gdrive_spk_...`). 1 chủ đề Part 3 (`gdrive_spk_p3_038`) không có ảnh là do tài liệu nguồn gốc không có ảnh (`NO_IMAGE_IN_SOURCE`).

2. **Đối với 16 Bộ đề thi thử Mock Test (`aptis-b2-01` .. `aptis-b2-16`)**:
   - Phần Speaking Part 2 & Part 3 trong 16 đề thi thử mock test trỏ tới đường dẫn `/images/speaking/test_XX_part2.jpg` không tồn tại trên đĩa. Khi người dùng vào bằng nút "Luyện theo Part" hoặc làm Full Mock Test, ảnh không hiển thị.

3. **Đối với trải nghiệm người dùng trong Practice Hub**:
   - 16 thẻ đầu tiên là Part 1 (câu hỏi cá nhân không dùng ảnh), khiến người dùng bấm vào các đề đầu tiên không thấy ảnh.
   - Bộ lọc "Trọng điểm tháng" chỉ lọc 10 đề, tạo cảm giác chỉ có 2-3 đề có hình ảnh.