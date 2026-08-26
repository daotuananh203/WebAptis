import os
import json
import glob
import re
import zipfile
import xml.etree.ElementTree as ET

def clean(s):
    if not s:
        return ""
    s = s.replace('\u00a0', ' ').replace('\u200b', '').replace('\ufeff', '')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def get_docx_paragraphs(path):
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

def normalize(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    return " ".join(text.split())

def find_first_occurrence(whisper_segs, keywords, start_after=0.0):
    for s in whisper_segs:
        if s['start'] >= start_after - 2.0:
            norm_s = normalize(s['text'])
            matches = sum(1 for kw in keywords if kw in norm_s)
            if matches >= 2 or (len(keywords) == 1 and keywords[0] in norm_s):
                return s['start']
    return None

print("Matcher loaded.")
