import os
import json
import glob
import re
import zipfile
import xml.etree.ElementTree as ET

def get_docx_text(path):
    if not path or not os.path.exists(path):
        return []
    with zipfile.ZipFile(path) as z:
        tree = ET.fromstring(z.read('word/document.xml'))
        paragraphs = []
        for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            t = ''.join(e.text for e in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if e.text).strip()
            if t:
                paragraphs.append(t)
        return paragraphs

for i in range(1, 16):
    pad = f"{i:02d}"
    t_pat = f"APTIS/Listening/Bộ đề ôn tập/00. Bộ Đề Luyện Tập Aptis - HV/04. Transcript/Đề {i}*.docx"
    t_files = glob.glob(t_pat)
    t_path = t_files[0] if t_files else None
    
    whisper_path = f"scratch_whisper_t{pad}.json"
    if not os.path.exists(whisper_path):
        print(f"Test {pad}: Whisper json missing!")
        continue
        
    with open(whisper_path, "r", encoding="utf-8") as f:
        w_segs = json.load(f)
        
    t_lines = get_docx_text(t_path)
    print(f"Test {pad}: Transcript {len(t_lines)} lines, Whisper {len(w_segs)} segments (total {w_segs[-1]['end']}s)")
