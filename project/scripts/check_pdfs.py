import os

pdf_files = [
    r"D:\APTIS\B1 - LÝ THUYẾT (1).pdf",
    r"D:\APTIS\Reading\APTIS_READING COMPREHENSION.pdf",
    r"D:\APTIS\Reading\READING KEYS THEO ĐỀ T8+T9.pdf",
    r"D:\APTIS\Writing\APTIS_WRITING PART 1&2&3.pdf",
    r"D:\APTIS\Writing\APTIS_WRITING PART 4.pdf",
    r"D:\APTIS\Speaking\APTIS_SPEAKING PART 1&2.pdf",
    r"D:\APTIS\Speaking\APTIS_SPEAKING PART 1_Questions.pdf",
    r"D:\APTIS\Speaking\APTIS_SPEAKING PART 2(full).pdf",
    r"D:\APTIS\Speaking\Aptis_Speaking_Part 3.pdf",
    r"D:\APTIS\Speaking\APTIS_SPEAKING PART 4.pdf",
]

for p in pdf_files:
    if os.path.exists(p):
        size_kb = os.path.getsize(p) / 1024
        print(f"File: {os.path.basename(p)} ({size_kb:.1f} KB)")
        # Read first few bytes to verify PDF header
        with open(p, "rb") as f:
            header = f.read(10)
            print(f"   Header: {header}")
    else:
        print(f"File not found: {p}")
