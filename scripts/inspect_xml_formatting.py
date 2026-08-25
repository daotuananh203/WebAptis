import glob
import zipfile
import xml.etree.ElementTree as ET

def get_answer_file(test_idx):
    pattern = f"APTIS/Listening/Bộ đề ôn tập/00. Bộ Đề Luyện Tập Aptis - HV/02. Đáp án/Đề {test_idx}*.docx"
    files = glob.glob(pattern)
    return files[0] if files else None

def inspect_answer_xml(test_idx):
    a_file = get_answer_file(test_idx)
    if not a_file:
        return
    with zipfile.ZipFile(a_file) as z:
        xml_content = z.read('word/document.xml')
        tree = ET.fromstring(xml_content)
        
        print(f"=== TEST {test_idx} HIGHLIGHTED / COLORED / BOLD RUNS ===")
        # Look for p elements
        for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            p_text = ''.join(node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text)
            if not p_text.strip():
                continue
            
            # Check runs in this paragraph
            marked_runs = []
            for r in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}r'):
                r_text = ''.join(t.text for t in r.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if t.text)
                rPr = r.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}rPr')
                is_bold = rPr is not None and rPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}b') is not None
                color = rPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}color') if rPr is not None else None
                color_val = color.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val') if color is not None else None
                highlight = rPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}highlight') if rPr is not None else None
                
                if (is_bold or color_val or highlight) and r_text.strip():
                    marked_runs.append((r_text.strip(), is_bold, color_val))
            
            if marked_runs:
                print(f"  P: '{p_text.strip()[:60]}' -> Marked: {marked_runs}")

for t in [1, 2, 3, 4, 8, 16]:
    inspect_answer_xml(t)
