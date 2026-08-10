import re

with open(r'c:\Users\Leandro\Music\crmison\crimsons-scan\frontend\src\app\uploader\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_sortable = r"""function SortablePageItem\(\{ page, index, selectedManga, removePage \}: \{ page: PageFile, index: number, selectedManga: Manga, removePage: \(id: string\) => void \}\) \{
  const \{ attributes, listeners, setNodeRef, transform, transition, isDragging \} = useSortable\(\{ id: page\.id \}\);
  
  const style = \{
    transform: CSS\.Transform\.toString\(transform\),
    transition,
    opacity: isDragging \? 0\.5 : 1,
    "--p": page\.status === 'done' \? 1 : \(\(page\.progress \|\| 0\) / 100\)
  \} as React\.CSSProperties;

  return \(
    <div ref=\{setNodeRef\} style=\{style\} className="flex items-center gap-2 bg-gray-50 dark:bg-black/20 rounded-xl px-3 py-2">"""

new_sortable = """function SortablePageItem({ page, index, selectedManga, removePage, dropOrigin }: { page: PageFile, index: number, selectedManga: Manga, removePage: (id: string) => void, dropOrigin: {x: number, y: number} | null }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  const elRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (dropOrigin && elRef.current && page.status === 'pending' && page.progress === 0) {
      const rect = elRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      try {
        elRef.current.animate([
          { transform: `translate(${dropOrigin.x - cx}px, ${dropOrigin.y - cy}px) scale(0.2)`, opacity: 0 },
          { transform: 'none', opacity: 1 }
        ], { duration: 500, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' });
      } catch(e) {}
    }
  }, []);

  const setRefs = useCallback((node: HTMLDivElement) => {
    setNodeRef(node);
    elRef.current = node;
  }, [setNodeRef]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    "--p": page.status === 'done' ? 1 : ((page.progress || 0) / 100)
  } as React.CSSProperties;

  return (
    <div ref={setRefs} style={style} className="flex items-center gap-2 bg-gray-50 dark:bg-black/20 rounded-xl px-3 py-2">"""

content = re.sub(old_sortable, new_sortable, content)


old_state = r"""  const \[isDraggingOver, setIsDraggingOver\] = useState\(false\);"""
new_state = """  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dropOrigin, setDropOrigin] = useState<{x: number, y: number} | null>(null);"""
content = re.sub(old_state, new_state, content)

old_drop = r"""                <div 
                  onDragOver=\{\(e\) => \{ e\.preventDefault\(\); setIsDraggingOver\(true\); \}\}
                  onDragLeave=\{\(e\) => \{ e\.preventDefault\(\); setIsDraggingOver\(false\); \}\}
                  onDrop=\{\(e\) => \{ e\.preventDefault\(\); setIsDraggingOver\(false\); handleFiles\(e\.dataTransfer\.files\); \}\}
                  className=\{`bg-white dark:bg-\[\#111114\] rounded-2xl border p-4 transition-colors \$\{isDraggingOver \? 'border-rose-500/50 bg-rose-50 dark:bg-rose-500/10' : 'border-gray-100 dark:border-white/5'\} `\}
                >"""

new_drop = """                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDraggingOver(false); }}
                  onDrop={(e) => { 
                    e.preventDefault(); 
                    setIsDraggingOver(false); 
                    setDropOrigin({ x: e.clientX, y: e.clientY });
                    handleFiles(e.dataTransfer.files); 
                    setTimeout(() => setDropOrigin(null), 50);
                  }}
                  className={`bg-white dark:bg-[#111114] rounded-2xl border p-4 transition-colors ${isDraggingOver ? 'border-rose-500/50 bg-rose-50 dark:bg-rose-500/10' : 'border-gray-100 dark:border-white/5'} `}
                >"""
content = re.sub(r'className={`bg-white dark:bg-\[\#111114\] rounded-2xl border p-4 transition-colors \$\{isDraggingOver \? \'border-rose-500/50 bg-rose-50 dark:bg-rose-500/10\' : \'border-gray-100 dark:border-white/5\'\}`\}', 
                 r"className={`bg-white dark:bg-[#111114] rounded-2xl border p-4 transition-colors ${isDraggingOver ? 'border-rose-500/50 bg-rose-50 dark:bg-rose-500/10' : 'border-gray-100 dark:border-white/5'} `}", content)
content = re.sub(old_drop, new_drop, content)


old_item_render = r"""<SortablePageItem key=\{page\.id\} page=\{page\} index=\{i\} selectedManga=\{selectedManga\} removePage=\{removePage\} />"""
new_item_render = """<SortablePageItem key={page.id} page={page} index={i} selectedManga={selectedManga} removePage={removePage} dropOrigin={dropOrigin} />"""
content = re.sub(old_item_render, new_item_render, content)


with open(r'c:\Users\Leandro\Music\crmison\crimsons-scan\frontend\src\app\uploader\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
