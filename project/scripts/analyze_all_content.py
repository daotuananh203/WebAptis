import os
import zipfile
import xml.etree.ElementTree as ET
import json
import re

ROOT_DIR = r"D:\APTIS"

def extract_text_from_docx(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as z:
            xml_content = z.read("word/document.xml")
            tree = ET.fromstring(xml_content)
            # Find all text elements
            texts = []
            for elem in tree.iter():
                if elem.tag.endswith('t') and elem.text:
                    texts.append(elem.text)
            return " ".join(texts)
    except Exception as e:
        return f"ERROR reading docx: {e}"

def extract_text_from_pptx(pptx_path):
    try:
        texts = []
        with zipfile.ZipFile(pptx_path) as z:
            for name in z.namelist():
                if name.startswith("ppt/slides/slide") and name.endswith(".xml"):
                    xml_content = z.read(name)
                    tree = ET.fromstring(xml_content)
                    slide_texts = []
                    for elem in tree.iter():
                        if elem.tag.endswith('t') and elem.text:
                            slide_texts.append(elem.text)
                    if slide_texts:
                        texts.append(" | ".join(slide_texts))
        return "\n--- SLIDE ---\n".join(texts)
    except Exception as e:
        return f"ERROR reading pptx: {e}"

def find_links_and_keywords(text):
    urls = re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', text)
    google_docs = [u for u in urls if 'docs.google.com' in u or 'drive.google.com' in u]
    
    # Check for Edulife mentions
    edulife_mentions = len(re.findall(r'edulife', text, re.IGNORECASE))
    bc_mentions = len(re.findall(r'british council', text, re.IGNORECASE))
    
    return {
        "urls": urls[:10],
        "google_docs": google_docs,
        "edulife_mentions": edulife_mentions,
        "bc_mentions": bc_mentions,
        "text_length": len(text),
        "snippet": text[:300].strip()
    }

def analyze():
    analysis_results = []
    
    for root, dirs, files in os.walk(ROOT_DIR):
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, ROOT_DIR)
            ext = os.path.splitext(f)[1].lower()
            size = os.path.getsize(full_path)
            
            info = {
                "name": f,
                "rel_path": rel_path,
                "ext": ext,
                "size_bytes": size,
                "size_mb": round(size / (1024 * 1024), 2),
            }
            
            if ext == ".docx":
                text = extract_text_from_docx(full_path)
                info["text_analysis"] = find_links_and_keywords(text)
            elif ext == ".pptx":
                text = extract_text_from_pptx(full_path)
                info["text_analysis"] = find_links_and_keywords(text)
            elif ext == ".pdf":
                info["notes"] = "Binary PDF document"
            elif ext == ".mp3":
                info["notes"] = "Audio track"
            elif ext == ".mp4":
                info["notes"] = "Video recording"
                
            analysis_results.append(info)
            
    print(f"Scanned {len(analysis_results)} files.")
    
    # Summary of findings
    with open(r"project\scripts\analysis_summary.json", "w", encoding="utf-8") as out:
        json.dump(analysis_results, out, ensure_ascii=False, indent=2)
        
    print("Summary written to project/scripts/analysis_summary.json")

if __name__ == "__main__":
    analyze()
