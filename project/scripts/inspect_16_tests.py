import zipfile
import xml.etree.ElementTree as ET
import os

folder = r"D:\APTIS\Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\01. Đề Luyện Tập"

for i in range(1, 17):
    # find file matching de i
    files = [f for f in os.listdir(folder) if f.startswith(f"Đề {i} ") or f.startswith(f"Đề {i}.") or f.startswith(f"Đề {i}-") or f == f"Đề {i}.docx" or f == f"Đề {i} - Aptis.docx" or f == f"Đề {i} - Aptis_.docx"]
    if not files:
        # try more flexible match
        files = [f for f in os.listdir(folder) if f"Đề {i}" in f]
    
    if files:
        fname = files[0]
        fpath = os.path.join(folder, fname)
        try:
            with zipfile.ZipFile(fpath) as z:
                xml_content = z.read("word/document.xml")
                tree = ET.fromstring(xml_content)
                texts = []
                for elem in tree.iter():
                    if elem.tag.endswith('t') and elem.text:
                        texts.append(elem.text)
                text = " ".join(texts)
                
                # Check for sections
                has_reading = "reading" in text.lower() or "read" in text.lower()
                has_listening = "listening" in text.lower() or "listen" in text.lower()
                has_grammar = "grammar" in text.lower()
                has_vocab = "vocabulary" in text.lower() or "vocab" in text.lower()
                has_writing = "writing" in text.lower()
                has_speaking = "speaking" in text.lower()
                
                print(f"=== {fname} ({round(os.path.getsize(fpath)/1024, 1)} KB) ===")
                print(f"  Length: {len(text)} chars")
                print(f"  Keywords: Reading={has_reading}, Listening={has_listening}, Grammar={has_grammar}, Vocab={has_vocab}, Writing={has_writing}, Speaking={has_speaking}")
                print(f"  Header snippet: {text[:250].strip()}")
                print(f"  Middle snippet: {text[len(text)//2:len(text)//2+250].strip()}")
                print()
        except Exception as e:
            print(f"ERROR reading {fname}: {e}")
    else:
        print(f"NOT FOUND: Đề {i}")
