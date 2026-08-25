import os
import zipfile
import xml.etree.ElementTree as ET
import json
import re

ROOT_DIR = r"D:\APTIS"

def extract_pptx_slides(pptx_path):
    slides = []
    if not os.path.exists(pptx_path):
        return slides
    try:
        with zipfile.ZipFile(pptx_path) as z:
            # Sort slide names by index
            slide_names = [n for n in z.namelist() if n.startswith("ppt/slides/slide") and n.endswith(".xml")]
            # Sort naturally: slide1.xml, slide2.xml, ...
            slide_names.sort(key=lambda x: int(re.search(r'slide(\d+)\.xml', x).group(1)) if re.search(r'slide(\d+)\.xml', x) else 0)
            
            for sname in slide_names:
                xml_content = z.read(sname)
                tree = ET.fromstring(xml_content)
                texts = []
                for elem in tree.iter():
                    if elem.tag.endswith('t') and elem.text:
                        txt = elem.text.strip()
                        if txt:
                            texts.append(txt)
                if texts:
                    slides.append({
                        "slide_file": sname,
                        "texts": texts,
                        "raw_content": "\n".join(texts)
                    })
    except Exception as e:
        print(f"Error reading {pptx_path}: {e}")
    return slides

# Scan all PPTX files in D:\APTIS
all_pptx = []
for root, dirs, files in os.walk(ROOT_DIR):
    for f in files:
        if f.lower().endswith(".pptx"):
            full = os.path.join(root, f)
            rel = os.path.relpath(full, ROOT_DIR)
            slides = extract_pptx_slides(full)
            all_pptx.append({
                "name": f,
                "rel_path": rel,
                "total_slides": len(slides),
                "slides": slides
            })

print(f"Total PPTX files scanned: {len(all_pptx)}")
for p in all_pptx:
    print(f"- {p['rel_path']} ({p['total_slides']} slides)")

with open(r"project\scripts\pptx_extracted.json", "w", encoding="utf-8") as out:
    json.dump(all_pptx, out, ensure_ascii=False, indent=2)
