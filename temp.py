with open('frontend/src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "{/* Disable modal */}" in line:
        start_idx = i
        break

if start_idx != -1:
    for i in range(start_idx + 1, len(lines)):
        if "============================================================" in lines[i]:
            end_idx = i - 1
            break

if start_idx != -1 and end_idx != -1:
    modal_lines = lines[start_idx:end_idx+1]
    
    del lines[start_idx:end_idx+1]
    
    insert_idx = -1
    for i, line in enumerate(lines):
        if "function SectionRevision()" in line:
            for j in range(i-1, -1, -1):
                if "</div>" in lines[j]:
                    insert_idx = j
                    break
            break
            
    if insert_idx != -1:
        for line in reversed(modal_lines):
            lines.insert(insert_idx, line)
            
        with open('frontend/src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
            f.writelines(lines)
        print("SUCCESS")
    else:
        print("FAILED TO FIND INSERTION POINT")
else:
    print("FAILED TO FIND MODAL BOUNDARIES")
