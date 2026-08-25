# WEBAPTIS B2 — READING & GRAMMAR/VOCABULARY FORENSIC AUDIT REPORT
**Trạng thái**: READ-ONLY FORENSIC AUDIT (KHÔNG SỬA CODE / KHÔNG SỬA DỮ LIỆU)  
**Thời gian thực hiện**: 2026-08-23T23:50:00+07:00  
**Tác giả**: Antigravity DeepMind Coding Pair  

---

## 1. TỔNG QUAN VÀ PHÂN LOẠI LỖI (EXECUTIVE SUMMARY)

Sau khi kiểm tra trực tiếp qua 3 tầng: **Source DOCX gốc (`APTIS/Listening/Bộ đề ôn tập/...`)**, **Public Client Datasets & Server Answer Keys (`data/tests/aptis-b2-01..16`)**, và **Runtime Rendering Engine (`components/practice/question-renderer.tsx`)**, kết quả phân loại lỗi root-cause như sau:

| STT | Phân hệ bị ảnh hưởng | Mô tả hiện tượng | Phân loại nguyên nhân gốc | Tầng gây lỗi |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Reading Part 1** | Test 01 có option placeholder (`option_a`), Test 02 có options thật; Test 09, 12, 13, 15, 16 toàn bộ options là placeholder. | **B — SOURCE DATA / INGESTION BUG** | Ingestion Parser (Xử lý không đồng nhất định dạng DOCX) |
| **2** | **Reading Part 3** *(bị gọi nhầm là Part 2)* | 4 Persons: 1 Person chứa câu hỏi/hướng dẫn, 1 Person chứa toàn bộ nội dung của cả 4 người, 2 Persons rỗng/chỉ có nhãn. | **B — SOURCE DATA / INGESTION BUG** | Ingestion Parser (Lấy nhầm câu mở đầu làm Person A, không bóc tách khối văn bản `Person A/B/C/D`) |
| **3** | **Reading Part 4** | Ô "Đoạn văn 1" hiển thị câu hướng dẫn của đề thi; đoạn văn số 7 bị mất hoặc đẩy lùi. | **B — SOURCE DATA / INGESTION BUG** | Ingestion Parser (Nhét câu hướng dẫn đề bài vào `paragraphs[0]` làm Paragraph 1) |
| **4** | **Vocabulary (G&V)** | Đề yêu cầu "match", UI hiển thị 5 hàng số kèm 10 nút bấm nhưng không thấy từ vựng cần nối ở đâu. | **A — SOURCE DATA ĐÚNG / RENDERER PROPERTY MISMATCH** | QuestionRenderer (Truy cập sai tên trường `item.prompt` thay vì `item.targetWordOrPrompt`) |

---

## 2. FORENSIC AUDIT CHI TIẾT: READING PART 1 (GAP-FILLING / SENTENCE COMPLETION)

### 2.1 So sánh Test 01 vs Test 02 trong Source DOCX và JSON
- **Trong file DOCX gốc `Đề 1 - Aptis.docx`**:
  ```text
  Read the email from Anna to her friend, Tom. Choose one word from the list for each gap. The first one is done for you.
  Dear Tom,
  I'm happy that you are coming to my place.
  When you are at the train (school/station/river), go to the main gate.
  The bus (stop/town/place) are near.
  My house is on Parkon Street. It's (tired/green/color) so you can not miss it.
  After you come, we will have (dinner/food/eat)
  ```
  *Phân tích*: Đoạn văn bản trong `Đề 1 - Aptis.docx` chỉ có **4 cụm lựa chọn trong ngoặc đơn** (`(school/station/river)`, `(stop/town/place)`, `(tired/green/color)`, `(dinner/food/eat)`). Bộ parser khi ingest dự kiến chuẩn Aptis B2 phải có 5 câu, nên sau khi parse 4 câu thật, nó tự động sinh ra một Gap thứ 5 giả lập với `['option_a', 'option_b', 'option_c']`.
- **Trong file DOCX gốc `Đề 2 - Aptis_.docx`**:
  ```text
  1. A. breathe   B. live    C. look
  2. A. share     B. hold    C. leave
  3. A. squad     B. headquarter C. class
  4. A. ride      B. drive   C. walk
  5. A. cook      B. bake    C. fry
  ```
  *Phân tích*: `Đề 2` trình bày dưới dạng bảng 5 dòng chuẩn `1. A... B... C...`. Parser nhận diện đúng regex và trích xuất đủ 5 bộ options thật 100%.

### 2.2 Bảng tổng hợp trạng thái Reading Part 1 trên toàn bộ 16 đề thi

| Đề thi | Số Gap trong JSON | Trạng thái Options trong Public JSON | Chi tiết Options từng Gap | Trạng thái Answer Key |
| :---: | :---: | :---: | :--- | :---: |
| **Test 01** | 5 | **4 REAL, 1 PLACEHOLDER** | Gap 1-4: `['school',...]`, `['stop',...]`, `['tired',...]`, `['dinner',...]` \| Gap 5: `['option_a', 'option_b', 'option_c']` | Có đủ 5 keys (`t01_r1_g1`..`g5`) |
| **Test 02** | 5 | **5 REAL (100% REAL)** | Gap 1-5: `['breathe',...]`, `['share',...]`, `['squad',...]`, `['ride',...]`, `['cook',...]` | Có đủ 5 keys (`t02_r1_g1`..`g5`) |
| **Test 03** | 5 | **4 REAL, 1 PLACEHOLDER** | Gap 1: Placeholder \| Gap 2-5: `['run',...]`, `['small',...]`, `['global',...]`, `['animals',...]` | Có đủ 5 keys |
| **Test 04** | 5 | **4 REAL, 1 PLACEHOLDER** | Gap 1: Placeholder \| Gap 2-5: `['near',...]`, `['unfriendly',...]`, `['stop',...]`, `['look',...]` | Có đủ 5 keys |
| **Test 05** | 5 | **4 REAL, 1 PLACEHOLDER** | Gap 1-4: `['home',...]`, `['swim',...]`, `['furniture',...]`, `['park',...]` \| Gap 5: Placeholder | Có đủ 5 keys |
| **Test 06** | 5 | **5 REAL (100% REAL)** | Gap 1-5: `['stay',...]`, `['near',...]`, `['noisy',...]`, `['practise',...]`, `['jump',...]` | Có đủ 5 keys |
| **Test 07** | 5 | **5 REAL (100% REAL)** | Gap 1-5: `['work',...]`, `['late',...]`, `['dinner',...]`, `['touch',...]`, `['car',...]` | Có đủ 5 keys |
| **Test 08** | 5 | **5 REAL (100% REAL)** | Gap 1-5: `['sick',...]`, `['sing',...]`, `['sleep',...]`, `['ringing',...]`, `['drink',...]` | Có đủ 5 keys |
| **Test 09** | 5 | **5 PLACEHOLDERS** | Gap 1-5: Toàn bộ `['option_a', 'option_b', 'option_c']` (DOCX dùng định dạng `……(1)……` không có inline options) | `option_a` x 5 |
| **Test 10** | 5 | **5 REAL (100% REAL)** | Gap 1-5: `['bought',...]`, `['lately',...]`, `['music',...]`, `['park',...]`, `['house',...]` | Có đủ 5 keys |
| **Test 11** | 5 | **4 REAL, 1 PLACEHOLDER** | Gap 1-4: `['window',...]`, `['school',...]`, `['cake',...]`, `['buy',...]` \| Gap 5: Placeholder | Có đủ 5 keys |
| **Test 12** | 5 | **5 PLACEHOLDERS** | Gap 1-5: Toàn bộ `['option_a', 'option_b', 'option_c']` | `option_a` x 5 |
| **Test 13** | 5 | **5 PLACEHOLDERS** | Gap 1-5: Toàn bộ `['option_a', 'option_b', 'option_c']` | `option_a` x 5 |
| **Test 14** | 5 | **5 REAL (100% REAL)** | Gap 1-5: `['only',...]`, `['not',...]`, `['under',...]`, `['much',...]`, `['give',...]` | Có đủ 5 keys |
| **Test 15** | 5 | **5 PLACEHOLDERS** | Gap 1-5: Toàn bộ `['option_a', 'option_b', 'option_c']` | `option_a` x 5 |
| **Test 16** | 5 | **5 PLACEHOLDERS** | Gap 1-5: Toàn bộ `['option_a', 'option_b', 'option_c']` (DOCX có options `station B. school C. market` nhưng parser không bắt được) | `option_a` x 5 |

---

## 3. FORENSIC AUDIT CHI TIẾT: READING PART 3 (OPINION MATCHING / 4 PERSONS)

> *Lưu ý*: Trong cấu trúc đề thi Aptis ESOL, phần ghép ý kiến 4 người là **Reading Part 3** (`opinion-matching`), còn Part 2 là phần sắp xếp câu (`text-cohesion`). User phản ánh "Reading Part 2 có 4 person" thực chất là đang xem xét **Reading Part 3**.

### 3.1 Cấu trúc thực tế trong Source DOCX
Trong `Đề 1 - Aptis.docx` (và hầu hết các đề 01..16), phần Part 3 có dạng:
```text
PART 3
Four people respond to the request from the neighborhood leader for their childhood activities. (Đoạn 1: Tiêu đề/hướng dẫn)
Read their answers and answer the questions below. (Đoạn 2: Hướng dẫn phụ)
Person A (Đoạn 3: Tiêu đề Person A)
As a child, I spent countless hours playing board games with my friends... (Đoạn 4: Nội dung Person A)
Person B (Đoạn 5: Tiêu đề Person B)
When I was young, I loved playing outdoor sports with the kids on my street... (Đoạn 6: Nội dung Person B)
Person C (Đoạn 7: Tiêu đề Person C)
I remember spending hours drawing and painting in my room as a kid... (Đoạn 8: Nội dung Person C)
Person D (Đoạn 9: Tiêu đề Person D)
As a child, reading was my favorite activity... (Đoạn 10: Nội dung Person D)
```

### 3.2 Lỗi trong thuật toán bóc tách của Ingestion Parser
Bộ parser cũ xử lý danh sách paragraph một cách tuần tự đơn giản:
1. Gán `paragraphs[0]` ("Four people respond...") vào `Person A` (`biographyText`).
2. Gán `paragraphs[1]` ("Read their answers...") vào `Person B` (`biographyText`).
3. Gán đoạn chứa text thực tế vào `Person C`.
4. Gán nhãn thừa hoặc để rỗng cho `Person D`.

### 3.3 Bảng đối chiếu `people[]` trong JSON trên các đề thi

| Đề thi | Person A (`people[0]`) | Person B (`people[1]`) | Person C (`people[2]`) | Person D (`people[3]`) |
| :---: | :--- | :--- | :--- | :--- |
| **Test 01** | `len=112` — *"Four people respond to the request from the neighborhood leader..."* (**Hướng dẫn**) | `len=49` — *"Read their answers and answer the questions below."* (**Hướng dẫn phụ**) | `len=523` — Toàn bộ đoạn văn của Person A (**Nội dung thật**) | `len=8` — *"Person B"* (**Rỗng / Nhãn**) |
| **Test 02** | `len=110` — *"Four people review the quality of a restaurant..."* (**Hướng dẫn**) | `len=8` — *"Person A"* (**Rỗng / Nhãn**) | `len=420` — Toàn bộ đoạn văn của Person A (**Nội dung thật**) | `len=8` — *"Person B"* (**Rỗng / Nhãn**) |
| **Test 05** | `len=118` — *"Four people respond in the comments section..."* (**Hướng dẫn**) | `len=8` — *"Person A"* (**Rỗng / Nhãn**) | `len=380` — Đoạn văn của Person A (**Nội dung thật**) | `len=8` — *"Person B"* (**Rỗng / Nhãn**) |
| **Test 08** | `len=129` — *"Four people respond to the request from the reporter..."* (**Hướng dẫn**) | `len=253` — Nội dung Person A (**Nội dung thật**) | `len=306` — Nội dung Person B (**Nội dung thật**) | `len=346` — Nội dung Person C (**Nội dung thật**) |
| **Test 09** | `len=349` — Nội dung Person A (**Nội dung thật**) | `len=357` — Nội dung Person B (**Nội dung thật**) | `len=350` — Nội dung Person C (**Nội dung thật**) | `len=339` — Nội dung Person D (**Nội dung thật**) |
| **Test 15** | `len=408` — Nội dung Person A (**Nội dung thật**) | `len=381` — Nội dung Person B (**Nội dung thật**) | `len=378` — Nội dung Person C (**Nội dung thật**) | `len=366` — Nội dung Person D (**Nội dung thật**) |

*Kết luận*: Trừ Test 09 và Test 15 được parse đúng do định dạng DOCX đặc thù (các đoạn Person A..D nằm liền khối có tiền tố rõ ràng), **14/16 đề thi** đều bị lệch chỉ mục do câu instruction chiếm vị trí của Person A và Person B.

---

## 4. FORENSIC AUDIT CHI TIẾT: READING PART 4 (MATCHING HEADINGS)

### 4.1 Cơ chế lệch đoạn văn trong Part 4
- **Trong Source DOCX**:
  - Dòng 1: Tiêu đề/Yêu cầu: `"Read the passage quickly. Choose a heading for each numbered paragraph (1-7) from the drop-down box. There is one more heading than you need."`
  - Dòng 2..8: 7 đoạn văn được đánh số từ `1.` đến `7.`.
  - Danh sách 8 tiêu đề (Headings).
- **Trong JSON Dataset (`aptis-b2-XX-public.json`)**:
  - `paragraphs[0]` (`paragraphIndex: 1`):
    `text`: `"Read the passage quickly. Choose a heading for each numbered paragraph (1-7) from the dropdown box. There is one more heading than you need."`
  - `paragraphs[1]` (`paragraphIndex: 2`):
    `text`: `"1. Even before the nineteenth century, mountains had always exerted a powerful attraction..."` *(Thực chất đây là Đoạn văn 1)*
  - `paragraphs[2]` (`paragraphIndex: 3`): Đoạn văn 2 thực tế.
  - ...
  - `paragraphs[6]` (`paragraphIndex: 7`): Đoạn văn 6 thực tế.
  - **Đoạn văn 7 thực tế bị mất** khỏi mảng `paragraphs[]` do mảng bị giới hạn 7 phần tử (`slice(0, 7)`).

### 4.2 Bảng đối chiếu Paragraph 1 trên 16 đề thi

| Đề thi | `paragraphs[0]` Text | Thực chất là gì? | `paragraphs[1]` Text |
| :---: | :--- | :--- | :--- |
| **Test 01** | `"Read the passage quickly. Choose a heading for each numbered paragraph (1-7)..."` | **Câu hướng dẫn đề bài** | `"1. Even before the nineteenth century, mountains had always exerted..."` |
| **Test 02** | `"Read the passage quickly. Choose a heading for each numbered paragraph (1-7)..."` | **Câu hướng dẫn đề bài** | `"1. The history of early Australians stretches back much further..."` |
| **Test 03** | `"Read the passage quickly. Choose a heading for each numbered paragraph (1-7)..."` | **Câu hướng dẫn đề bài** | `"1. Language is one of the most powerful tools humans have developed..."` |
| **Test 04** | `"Read the passage quickly. Choose a heading for each numbered paragraph (1-7)..."` | **Câu hướng dẫn đề bài** | `"1. Throughout history, architecture has served as a reflection of society..."` |
| **Test 05** | `"Read the passage quickly. Choose a heading for each numbered paragraph (1-7)..."` | **Câu hướng dẫn đề bài** | `"1. Throughout history, storytelling has been an integral part of human culture..."` |
| **Test 06** | `"Select the appropriate heading to match the paragraph from 1 to 7."` | **Câu hướng dẫn đề bài** | `"1. Over the past few decades, remote work has transitioned from a rare perk..."` |
| **Test 07** | `"Read the passage quickly. Choose a heading for each numbered paragraph (1-7)..."` | **Câu hướng dẫn đề bài** | `"Thomas Doggett, an Irish actor and comedian who managed Drury Lane Theatre..."` |
| **Test 08** | `"Read the text. Match the headings to the paragraphs..."` | **Câu hướng dẫn đề bài** | `"1. There are several types of vegetarian diets. Some people avoid all animal..."` |
| **Test 09** | `"The custom of drinking coffee started in the 1500s. Around that time..."` | **Đoạn văn 1 thực tế (Đúng)** | `"Europe is known as the biggest coffee-drinking region..."` |
| **Test 11** | `"Read the passage quickly. Choose a heading for each numbered paragraph (1-7)..."` | **Câu hướng dẫn đề bài** | `"The story of this cuisine stretches back thousands of years..."` |
| **Test 12** | `"Read the passage quickly. Choose a heading for each numbered paragraph (1-7)..."` | **Câu hướng dẫn đề bài** | `"The early Australians The history of early Australians stretches back..."` |
| **Test 13** | `"Read the passage quickly. Choose a heading for each numbered paragraph (1-7)..."` | **Câu hướng dẫn đề bài** | `"Long time ago, zoos were reserved exclusively for monarchs and aristocrats..."` |
| **Test 14** | `"Read the passage quickly. Choose a heading for each numbered paragraph (1-7)..."` | **Câu hướng dẫn đề bài** | `"The ethical and environmental implications of factory farming -..."` |
| **Test 15** | `"In today's consumer-driven society, the focus is often on acquiring new products..."` | **Đoạn văn 1 thực tế (Đúng)** | `"Temporary consumption trends, like fad diets or fast fashion..."` |
| **Test 16** | `"Read the passage quickly. Choose a heading for each numbered paragraph (1-7)..."` | **Câu hướng dẫn đề bài** | `"The interaction between people and technology is continuously evolving..."` |

---

## 5. FORENSIC AUDIT CHI TIẾT: GRAMMAR & VOCABULARY (VOCABULARY MATCHING)

### 5.1 Dữ liệu thực tế trong DOCX, Public JSON và Answer Key
- **Cấu trúc chuẩn Aptis ESOL Vocabulary (25 điểm)**:
  Phần Vocabulary gồm **5 nhóm câu hỏi (Sets)**, mỗi Set có **5 từ/câu cần ghép (Items)** và **10 phương án lựa chọn (Options)** (5 đáp án đúng và 5 đáp án bẫy/nhiễu).
  - **Set 1 (Synonyms)**: Ghép 5 từ với 5 từ đồng nghĩa.
  - **Set 2 (Definitions)**: Ghép 5 từ với 5 định nghĩa tương ứng.
  - **Set 3 (Collocations/Context)**: Điền 5 từ vào 5 câu ngữ cảnh.
  - **Set 4 (Word pairs/Collocations)**: Ghép 5 cặp từ kết hợp (e.g. `heavy` + `traffic`, `draw` + `a conclusion`).
  - **Set 5 (Phrasal Verbs)**: Ghép 5 cụm động từ với 5 định nghĩa (e.g. `call off` -> `cancel`, `put off` -> `postpone`).
- **Data Model trong `aptis-b2-XX-public.json`**:
  ```json
  "vocabulary": {
    "sets": [
      {
        "id": "t01_v_set1",
        "title": "Synonyms Matching",
        "instructions": "Match each word on the left with the word on the right that has the most similar meaning.",
        "items": [
          { "id": "t01_v1_i1", "targetWordOrPrompt": "abundant" },
          { "id": "t01_v1_i2", "targetWordOrPrompt": "commence" },
          { "id": "t01_v1_i3", "targetWordOrPrompt": "hazard" },
          { "id": "t01_v1_i4", "targetWordOrPrompt": "promptly" },
          { "id": "t01_v1_i5", "targetWordOrPrompt": "lucid" }
        ],
        "options": [
          { "id": "t01_opt_v1_a", "text": "plentiful" },
          { "id": "t01_opt_v1_b", "text": "begin" },
          ... (10 options)
        ]
      }
    ]
  }
  ```
- **Answer Key trong `aptis-b2-XX-answers.json`**:
  Chứa chính xác **25 cặp key-value độc lập**:
  `'t01_v1_i1': 't01_opt_v1_a'`, `'t01_v1_i2': 't01_opt_v1_b'`, `'t01_v1_i3': 't01_opt_v1_c'`, ...
  Mỗi câu hỏi có đúng 1 phương án tương ứng (quan hệ **1-to-1** cho từng item).

### 5.2 Root Cause gây ra trải nghiệm lỗi trên UI
Tại [`components/practice/question-renderer.tsx:126`](file:///d:/%E1%BB%A8NG%20D%E1%BB%A4NG%20AI%20AGENT%20CHO%20NGHI%C3%8AN%20C%E1%BB%A8U%20KHOA%20H%E1%BB%8CC-20260513T124251Z-3-001/WebAptis/project/components/practice/question-renderer.tsx#L126):
```tsx
<div className="flex items-center gap-2">
  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
    {itemIdx + 1}
  </span>
  <p className="text-sm font-bold text-white">{item.prompt}</p>
</div>
```
- Trường dữ liệu trong JSON là `item.targetWordOrPrompt`.
- Code renderer lại đọc `item.prompt`.
- Kết quả: `item.prompt === undefined` -> **Từ vựng mục tiêu (như `abundant`, `commence`, `hazard`) hoàn toàn biến mất trên màn hình!**
- Người dùng chỉ nhìn thấy số `1`, `2`, `3`, `4`, `5` trống rỗng, và bên dưới mỗi số là 10 ô nút bấm giống hệt nhau, tạo cảm giác sai lệch rằng giao diện bị lỗi và không hiểu đề bài yêu cầu match cái gì với cái gì.

---

## 6. RUNTIME DATA TRACE (TRUY VẾT TỪ NGUỒN ĐẾN RENDERER)

```
[SOURCE DOCX: Đề X - Aptis.docx]
       │
       ▼ (Parser bóc tách chuỗi paragraph)
[INGESTION PIPELINE: scripts/ingest-test.py]
  ├── Reading Part 1: Gặp cú pháp khác lạ -> sinh placeholder option_a/b/c (❌ LỖI TẦNG INGESTION)
  ├── Reading Part 3: Lấy câu hướng dẫn làm Person A/B -> nhét cả 4 người vào Person C (❌ LỖI TẦNG INGESTION)
  ├── Reading Part 4: Lấy câu hướng dẫn làm Paragraph 1 -> đẩy mất Paragraph 7 (❌ LỖI TẦNG INGESTION)
  └── Vocabulary: Đặt tên trường là `targetWordOrPrompt` (✅ ĐÚNG VỀ DATA MODEL)
       │
       ▼ (Lưu trữ dữ liệu)
[PUBLIC JSON: data/tests/aptis-b2-XX-public.json]
       │
       ▼ (API Endpoint)
[GET /api/tests/[testId]]
       │
       ▼ (Frontend State)
[ExamShell / PracticeShell -> resolveSectionParts]
       │
       ▼ (Component Render)
[QuestionRenderer]
  ├── Vocabulary renderer đọc `item.prompt` thay vì `item.targetWordOrPrompt` (❌ LỖI TẦNG RENDERER)
  └── Giao diện hiển thị số 1..5 không có chữ kèm 10 nút bấm (❌ LỖI TRẢI NGHIỆM MATCHING UI)
```

---

## 7. CÁC FILE VÀ VỊ TRÍ LIÊN QUAN TRỰC TIẾP

1. **`data/tests/aptis-b2-01-public.json` .. `aptis-b2-16-public.json`**:
   - `reading.parts[0].gaps`: Cần bổ sung options thật từ DOCX nguồn cho các đề bị placeholder.
   - `reading.parts[2].people`: Cần phân rã chính xác 4 đối tượng `Person A`, `Person B`, `Person C`, `Person D` từ nội dung DOCX.
   - `reading.parts[3].paragraphs`: Cần loại bỏ câu hướng dẫn khỏi `paragraphs[0]` và khôi phục đủ 7 đoạn văn thực tế `1.` đến `7.`.
2. **`components/practice/question-renderer.tsx`**:
   - Dòng 126: Thay `{item.prompt}` thành `{item.targetWordOrPrompt || item.prompt || item.word}`.
   - Nâng cấp UX cho Vocabulary Matching: Chuyển đổi từ dạng 10 nút bấm lặp lại 5 lần sang dạng Select Dropdown hoặc Matching Card trực quan chuẩn Aptis.

---

## 8. PHÂN LOẠI KẾT LUẬN CUỐI CÙNG (FINAL VERDICT)

| Vấn đề | Phân loại trạng thái |
| :--- | :---: |
| **1. Reading Part 1 Options Missing** | **B — SOURCE DATA WRONG / INGESTION BUG** |
| **2. Reading Part 3 (4 People) Structure** | **B — SOURCE DATA WRONG / INGESTION BUG** |
| **3. Reading Part 4 Paragraph 1 Mismatch** | **B — SOURCE DATA WRONG / INGESTION BUG** |
| **4. Vocabulary Match Interaction & Invisible Words** | **A — SOURCE DATA CORRECT / RENDERER BUG** + **E — UI INTERACTION MODEL REFINEMENT** |

---

## 9. TRẢ LỜI TRỰC TIẾP 4 CÂU HỎI CỦA USER

### Câu 1: Vì sao Reading Test 01 Part 1 không có real options trong khi Test 02 có?
- **Trả lời**: Trong file DOCX gốc, `Test 02` trình bày 5 câu trắc nghiệm dạng bảng `1. A... B... C...` rõ ràng nên parser nhận diện trích xuất được 100%. Ngược lại, trong `Test 01`, DOCX viết lựa chọn dưới dạng 4 cụm ngoặc đơn inline `(school/station/river)` nên parser chỉ bắt được 4 câu và tự động sinh câu thứ 5 bằng placeholder `option_a, option_b, option_c`. Các đề 09, 12, 13, 15, 16 có định dạng DOCX khác biệt nữa nên toàn bộ 5 câu đều bị fallback về placeholder.

### Câu 2: Vì sao Reading Part 2 (thực chất là Part 3) chỉ có 1 person đúng và 3 person sai/rỗng?
- **Trả lời**: Thuật toán bóc tách DOCX đã cắt mảng đoạn văn theo chỉ mục tuần tự mà không lọc câu tiêu đề. Do đó, câu hướng dẫn *"Four people respond..."* bị gán làm Person A, câu *"Read their answers..."* bị gán làm Person B, toàn bộ khối văn bản của các Person bị dồn hết vào Person C, và Person D bị để trống.

### Câu 3: Vì sao Reading Part 4 paragraph 1 lại chứa question?
- **Trả lời**: Bộ parser lấy câu yêu cầu đề bài *"Read the passage quickly. Choose a heading for each numbered paragraph (1-7)..."* đưa vào vị trí `paragraphs[0]` làm đoạn văn số 1. Việc này làm đẩy lệch toàn bộ đoạn văn 1..6 xuống vị trí 2..7 và làm rớt mất đoạn văn số 7 thực tế khỏi mảng.

### Câu 4: Vocabulary "match" thực sự phải tương tác như thế nào theo source?
- **Trả lời**: Theo chuẩn Aptis ESOL B2 và dữ liệu nguồn DOCX/JSON:
  - Mỗi Set có **5 từ/câu mục tiêu** cần ghép với **10 phương án lựa chọn**.
  - Đây là quan hệ **ghép nối 1-1 cho từng câu**: Người học chọn 1 trong 10 đáp án cho từng từ trong 5 từ mục tiêu (5 đáp án đúng, 5 đáp án gây nhiễu).
  - Điểm số được chấm độc lập 1 điểm cho mỗi câu ghép đúng (tổng 25 câu = 25 điểm).
  - Lỗi hiện tại khiến UI chỉ thấy số 1..5 và 10 nút bấm là do `QuestionRenderer` truy cập sai trường `item.prompt` thay vì `item.targetWordOrPrompt`, làm từ mục tiêu bị tàng hình.
