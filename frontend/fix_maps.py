import os
import re

directory = r"c:\Parsonal Website\CampusHat\frontend\src"

pattern1 = re.compile(r"\.then\(r => r\.data\?\.data\?\.results \|\| r\.data\?\.results \|\| r\.data\?\.data \|\| r\.data \|\| \[\]\)")
replacement1 = r".then(r => { const res = r.data?.data?.results || r.data?.results || r.data?.data || r.data; return Array.isArray(res) ? res : [] })"

pattern2 = re.compile(r"\.then\(r => r\.data\?\.results \|\| r\.data\?\.data \|\| r\.data \|\| \[\]\)")
replacement2 = r".then(r => { const res = r.data?.results || r.data?.data || r.data; return Array.isArray(res) ? res : [] })"

pattern3 = re.compile(r"const d = r\.data\?\.data \?\? r\.data\n\s+set.+?\(d \|\| \[\]\)")

# Specifically for page.tsx index
def fix_index(content):
    c = content.replace("const d = r.data?.data ?? r.data\n        setHeroProducts(d || [])", "const d = r.data?.data ?? r.data\n        setHeroProducts(Array.isArray(d) ? d : [])")
    c = c.replace("const d = r.data?.data ?? r.data\n        setCategories(d || [])", "const d = r.data?.data ?? r.data\n        setCategories(Array.isArray(d) ? d : [])")
    c = c.replace("const d = r.data?.data ?? r.data\n        setMarketplace(d || [])", "const d = r.data?.data ?? r.data\n        setMarketplace(Array.isArray(d) ? d : [])")
    c = c.replace("const d = r.data?.data ?? r.data\n        setStores(d || [])", "const d = r.data?.data ?? r.data\n        setStores(Array.isArray(d) ? d : [])")
    return c

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            
            orig = content
            content = pattern1.sub(replacement1, content)
            content = pattern2.sub(replacement2, content)
            content = fix_index(content)
            
            if orig != content:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Fixed {path}")

print("Done")
