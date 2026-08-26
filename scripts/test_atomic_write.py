import os
import stat
from pathlib import Path

def safe_write_bytes(target_path, data_bytes):
    target = Path(target_path).resolve()
    temp_target = target.with_suffix(".tmp")
    
    target.parent.mkdir(parents=True, exist_ok=True)
    
    # Write to temp file
    with open(os.fspath(temp_target), 'wb') as f:
        f.write(data_bytes)
        
    # Set write permissions if target exists
    if target.exists():
        try:
            os.chmod(os.fspath(target), stat.S_IWRITE | stat.S_IREAD)
        except Exception:
            pass
            
    # Atomic replace
    os.replace(os.fspath(temp_target), os.fspath(target))

# Test on q13.mp3
safe_write_bytes("project/public/audio/listening/segments/aptis-b2-01/part-1/q13.mp3", b"TEST_DATA_Q13")
print("q13.mp3 written successfully! Size:", os.path.getsize("project/public/audio/listening/segments/aptis-b2-01/part-1/q13.mp3"))
