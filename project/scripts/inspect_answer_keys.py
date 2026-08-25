import zipfile
import xml.etree.ElementTree as ET
import os

folder = r"D:\APTIS\Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\02. Đáp án"

for i in range(1, 17):
    files = [f for f in os.listdir(folder) if f.startswith(f"Đề {i}.") or f.startswith(f"Đề {i} ") or f.startswith(f"Đề {i}_") or f == f"Đề {i}.docx"]
    if files:
        fname = files[0]
        fpath = os.path.join(folder, fname)
        with zipfile.ZipFile(fpath) as z:
            xml_content = z.read("word/document.xml")
            tree = ET.fromstring(xml_content)
            texts = []
            for elem in tree.iter():
                if elem.tag.endswith('t') and elem.text:
                    texts.append(elem.text)
            text = " ".join(texts)
            
            has_reading_key = "reading" in text.lower() or "đọc" in text.lower()
            has_listening_key = "listening" in text.lower() or "nghe" in text.lower()
            
            print(f"=== ĐÁP ÁN: {fname} ===")
            print(f"  Length: {len(text)} chars | ListeningKey={has_listening_key}, ReadingKey={has_reading_key}")
            print(f"  Start: {text[:200].strip()}")
            print(f"  Middle: {text[len(text)//2:len(text)//2+200].strip()}")
            print(f"  End: {text[-200:].strip()}")
            print()
