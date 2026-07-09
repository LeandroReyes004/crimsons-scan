import os

def disable_ads(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple trick: just add "return null;" right at the start of the function body
    if 'export default function ' in content:
        content = content.replace('export default function GlobalPopunders() {', 'export default function GlobalPopunders() { return null;')
        content = content.replace('export default function AdsterraBanner(props: any) {', 'export default function AdsterraBanner(props: any) { return null;')
        content = content.replace('export default function AdsterraBanner({', 'export default function AdsterraBanner(props: any) { return null; /*')
        content = content.replace('export default function LateralAds() {', 'export default function LateralAds() { return null;')
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

base = r"c:\Users\leandro.reyes\Music\crimsons-scan\frontend\src\components"
disable_ads(os.path.join(base, "GlobalPopunders.tsx"))
disable_ads(os.path.join(base, "AdsterraBanner.tsx"))
disable_ads(os.path.join(base, "LateralAds.tsx"))
print("Ads disabled")
