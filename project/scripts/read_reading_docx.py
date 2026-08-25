import zipfile
import xml.etree.ElementTree as ET

docx_path = r"D:\APTIS\Reading\APTIS_READING COMPREHENSION.docx"
with zipfile.ZipFile(docx_path) as z:
    xml_content = z.read("word/document.xml")
    tree = ET.fromstring(xml_content)
    texts = []
    for elem in tree.iter():
        if elem.tag.endswith('t') and elem.text:
            texts.append(elem.text)
    full_text = "\n".join(texts)
    print("=== READING COMPREHENSION DOCX CONTENT SAMPLE ===")
    print(full_text[:2500])
