import zipfile
import xml.etree.ElementTree as ET
import re

docx_path = r"D:\APTIS\Reading\APTIS_READING COMPREHENSION.docx"
with zipfile.ZipFile(docx_path) as z:
    xml_content = z.read("word/document.xml")
    tree = ET.fromstring(xml_content)
    texts = []
    for elem in tree.iter():
        if elem.tag.endswith('t') and elem.text:
            texts.append(elem.text)
    full_text = "\n".join(texts)
    
    p1 = len(re.findall(r'Part\s+1', full_text, re.IGNORECASE))
    p2 = len(re.findall(r'Part\s+2', full_text, re.IGNORECASE))
    p3 = len(re.findall(r'Part\s+3', full_text, re.IGNORECASE))
    p4 = len(re.findall(r'Part\s+4', full_text, re.IGNORECASE))
    
    print(f"Reading Comprehension DOCX Stats:")
    print(f"  Part 1 mentions: {p1}")
    print(f"  Part 2 mentions: {p2}")
    print(f"  Part 3 mentions: {p3}")
    print(f"  Part 4 mentions: {p4}")
    print(f"  Total characters: {len(full_text)}")
