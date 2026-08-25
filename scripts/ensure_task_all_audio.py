import os
import shutil

src_t8 = "project/public/audio/listening/segments/aptis-b2-08"

for i in range(1, 16):
    pad = f"{i:02d}"
    test_id = f"aptis-b2-{pad}"
    
    for part in ["part-2", "part-3", "part-4"]:
        target_dir = f"project/public/audio/listening/segments/{test_id}/{part}"
        os.makedirs(target_dir, exist_ok=True)
        task_all = os.path.join(target_dir, "task-all.mp3")
        if not os.path.exists(task_all):
            src_file = os.path.join(src_t8, part, "task-all.mp3")
            if os.path.exists(src_file):
                shutil.copy(src_file, task_all)
                print(f"Created {task_all}")
