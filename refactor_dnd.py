import re

with open(r'c:\Users\Leandro\Music\crmison\crimsons-scan\frontend\src\app\uploader\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Insert SortablePageItem before UploaderPage
sortable_component = """
function SortablePageItem({ page, index, selectedManga, removePage }: { page: PageFile, index: number, selectedManga: Manga, removePage: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    "--p": page.status === 'done' ? 1 : ((page.progress || 0) / 100)
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 bg-gray-50 dark:bg-black/20 rounded-xl px-3 py-2">
      {selectedManga.tipo === 'novela' ? (
        <div {...attributes} {...listeners} className="w-9 h-12 bg-gray-200 dark:bg-white/10 rounded-lg flex items-center justify-center shrink-0 text-gray-500 font-bold text-[10px] cursor-grab active:cursor-grabbing outline-none">TXT</div>
      ) : (
        <div {...attributes} {...listeners} className="relative w-9 h-12 shrink-0 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing outline-none">
          <img src={page.preview} alt="" className="w-full h-full object-cover file__img--ghost" />
          <img src={page.preview} alt="" className="w-full h-full object-cover file__img--live" />
        </div>
      )}
      <div className="flex-1 min-w-0" {...attributes} {...listeners}>
        <p className="text-xs font-semibold dark:text-white">Pág. {String(page.order).padStart(3,'0')}</p>
        <p className="text-[10px] text-gray-400 truncate">{page.file.name}</p>
        {page.status === 'error' && <p className="text-[10px] text-red-500 truncate">{page.error}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {page.status === 'uploading' && <p className="text-[10px] font-bold text-blue-500 mr-2">{Math.round(page.progress || 0)}%</p>}
        {page.status === 'done'      && <Check size={16} className="text-emerald-500"/>}
        {page.status === 'error'     && <X size={16} className="text-red-500"/>}
        {page.status === 'pending'   && (
          <button onClick={() => removePage(page.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition active:scale-90 z-10 relative">
            <Trash2 size={14}/>
          </button>
        )}
      </div>
    </div>
  );
}

export default function UploaderPage() {
"""
content = content.replace("export default function UploaderPage() {", sortable_component)

# 2. Replace handleFiles and handleUpload
old_handle_logic = r"""  const handleFiles = async \(files: FileList \| null\) => \{
    if \(!files \|\| !selectedManga\) return;
    const isNovela = selectedManga.tipo === 'novela';
    const valid: PageFile\[\] = \[\];
    const rejected: string\[\] = \[\];
    for \(const file of Array\.from\(files\)\) \{
      if \(!isNovela && !ALLOWED_TYPES_IMG\.includes\(file\.type\)\) \{ rejected\.push\(file\.name\); continue; \}
      if \(isNovela && !file\.name\.toLowerCase\(\)\.endsWith\('\.txt'\) && file\.type !== 'text/plain'\) \{ rejected\.push\(file\.name\); continue; \}
      if \(file\.size > 10 \* 1024 \* 1024\) \{ rejected\.push\(`\$\{file\.name\} \(supera 10MB\)`\); continue; \}
      
      const final = \(!isNovela && convertWebP\) \? await toWebP\(file\) : file;
      valid\.push\(\{ file: final, preview: isNovela \? '' : URL\.createObjectURL\(final as File\), order: pages\.length \+ valid\.length \+ 1, status: 'pending' \}\);
    \}
    if \(rejected\.length > 0\) alert\(`Archivos rechazados:\\n\$\{rejected\.join\('\\n'\)\}`\);
    setPages\(prev => \[\.\.\.prev, \.\.\.valid\.map\(\(p, i\) => \(\{ \.\.\.p, order: prev\.length \+ i \+ 1 \}\)\)\]\);
  \};

  const moveUp   = \(i: number\) => \{ if \(i === 0\) return; const a = \[\.\.\.pages\]; \[a\[i-1\], a\[i\]\] = \[a\[i\], a\[i-1\]\]; setPages\(a\.map\(\(p,j\) => \(\{ \.\.\.p, order: j\+1 \}\)\)\); \};
  const moveDown = \(i: number\) => \{ if \(i === pages\.length-1\) return; const a = \[\.\.\.pages\]; \[a\[i\], a\[i\+1\]\] = \[a\[i\+1\], a\[i\]\]; setPages\(a\.map\(\(p,j\) => \(\{ \.\.\.p, order: j\+1 \}\)\)\); \};
  const removePage = \(i: number\) => setPages\(prev => prev\.filter\(\(_,j\) => j !== i\)\.map\(\(p,j\) => \(\{ \.\.\.p, order: j\+1 \}\)\)\);

  const handleUpload = async \(\) => \{
    if \(!capNumero \|\| pages\.length === 0 \|\| !selectedManga\) return;
    setDupError\(''\); setCreateError\(''\);
    const num = parseFloat\(capNumero\);
    if \(capitulos\.some\(c => c\.numero === num\)\) \{ setDupError\(`Ya existe el capítulo \$\{num\}\.`\); return; \}
    setUploading\(true\); setDone\(false\);
    try \{
      let currentCapId = capId;
      if \(!currentCapId\) \{
        const res = await fetch\(`\$\{API\}/api/chapters`, \{
          method: 'POST',
          headers: \{ \.\.\.authHeaders\(\), 'Content-Type': 'application/json' \},
          body: JSON\.stringify\(\{ manga_id: selectedManga\.id, numero: num, titulo: capTitulo \|\| null, fecha_publicacion: fechaPub \? new Date\(fechaPub\)\.toISOString\(\) : null, notify_discord: notifyDiscord \}\),
        \}\);
        const d = await res\.json\(\);
        if \(!res\.ok\) \{ setCreateError\(d\.error \|\| 'Error al crear'\); setUploading\(false\); return; \}
        currentCapId = d\.capituloId;
        setCapId\(currentCapId\); setCapEstado\(d\.estado\);
      \}
      for \(let i = 0; i < pages\.length; i\+\+\) \{
        const page = pages\[i\];
        if \(page\.status === 'done'\) continue;
        setPages\(prev => prev\.map\(\(p, j\) => j === i \? \{ \.\.\.p, status: 'uploading' \} : p\)\);
        const isNovela = selectedManga\.tipo === 'novela';
        const endpoint = isNovela \? '/api/upload/text' : '/api/upload/page';
        
        const fd = new FormData\(\);
        fd\.append\('capitulo_id', currentCapId!\);
        fd\.append\('numero', String\(page\.order\)\);
        if \(isNovela\) fd\.append\('text', page\.file\);
        else fd\.append\('image', page\.file\);

        try \{
          const res = await fetch\(`\$\{API\}\$\{endpoint\}`, \{ method: 'POST', headers: authHeaders\(\), body: fd \}\);
          const d   = await res\.json\(\);
          if \(!res\.ok\) throw new Error\(d\.error \|\| 'Error'\);
          setPages\(prev => prev\.map\(\(p, j\) => j === i \? \{ \.\.\.p, status: 'done' \} : p\)\);
        \} catch \(e: any\) \{
          setPages\(prev => prev\.map\(\(p, j\) => j === i \? \{ \.\.\.p, status: 'error', error: e\.message \} : p\)\);
        \}
      \}
      setDone\(true\);
      loadChapters\(selectedManga\);
    \} finally \{ setUploading\(false\); \}
  \};"""

new_handle_logic = """  const handleFiles = async (files: FileList | null) => {
    if (!files || !selectedManga) return;
    const isNovela = selectedManga.tipo === 'novela';
    const valid: PageFile[] = [];
    const rejected: string[] = [];
    for (const file of Array.from(files)) {
      if (!isNovela && !ALLOWED_TYPES_IMG.includes(file.type)) { rejected.push(file.name); continue; }
      if (isNovela && !file.name.toLowerCase().endsWith('.txt') && file.type !== 'text/plain') { rejected.push(file.name); continue; }
      if (file.size > 10 * 1024 * 1024) { rejected.push(`${file.name} (supera 10MB)`); continue; }
      
      const final = (!isNovela && convertWebP) ? await toWebP(file) : file;
      valid.push({ id: crypto.randomUUID(), file: final, preview: isNovela ? '' : URL.createObjectURL(final as File), order: pages.length + valid.length + 1, status: 'pending', progress: 0 });
    }
    if (rejected.length > 0) alert(`Archivos rechazados:\\n${rejected.join('\\n')}`);
    setPages(prev => [...prev, ...valid.map((p, i) => ({ ...p, order: prev.length + i + 1 }))]);
  };

  const removePage = (id: string) => setPages(prev => prev.filter((p) => p.id !== id).map((p,j) => ({ ...p, order: j+1 })));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newArr = arrayMove(items, oldIndex, newIndex);
        return newArr.map((p, j) => ({ ...p, order: j + 1 }));
      });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleUpload = async () => {
    if (!capNumero || pages.length === 0 || !selectedManga) return;
    setDupError(''); setCreateError('');
    const num = parseFloat(capNumero);
    if (capitulos.some(c => c.numero === num)) { setDupError(`Ya existe el capítulo ${num}.`); return; }
    setUploading(true); setDone(false);
    try {
      let currentCapId = capId;
      if (!currentCapId) {
        const res = await fetch(`${API}/api/chapters`, {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ manga_id: selectedManga.id, numero: num, titulo: capTitulo || null, fecha_publicacion: fechaPub ? new Date(fechaPub).toISOString() : null, notify_discord: notifyDiscord }),
        });
        const d = await res.json();
        if (!res.ok) { setCreateError(d.error || 'Error al crear'); setUploading(false); return; }
        currentCapId = d.capituloId;
        setCapId(currentCapId); setCapEstado(d.estado);
      }
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (page.status === 'done') continue;
        setPages(prev => prev.map((p, j) => j === i ? { ...p, status: 'uploading', progress: 0 } : p));
        const isNovela = selectedManga.tipo === 'novela';
        const endpoint = isNovela ? '/api/upload/text' : '/api/upload/page';
        
        const fd = new FormData();
        fd.append('capitulo_id', currentCapId!);
        fd.append('numero', String(page.order));
        if (isNovela) fd.append('text', page.file);
        else fd.append('image', page.file);

        try {
          await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${API}${endpoint}`);
            const headers = authHeaders();
            for (const [key, value] of Object.entries(headers)) {
              xhr.setRequestHeader(key, value as string);
            }
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                setPages(prev => prev.map((p, j) => j === i ? { ...p, progress: percentComplete } : p));
              }
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                setPages(prev => prev.map((p, j) => j === i ? { ...p, status: 'done', progress: 100 } : p));
                resolve(null);
              } else {
                let errStr = 'Error';
                try { errStr = JSON.parse(xhr.responseText).error || errStr; } catch(e){}
                reject(new Error(errStr));
              }
            };
            xhr.onerror = () => reject(new Error('Error de red'));
            xhr.send(fd);
          });
        } catch (e: any) {
          setPages(prev => prev.map((p, j) => j === i ? { ...p, status: 'error', error: e.message } : p));
        }
      }
      setDone(true);
      loadChapters(selectedManga);
    } finally { setUploading(false); }
  };"""

content = re.sub(old_handle_logic, new_handle_logic, content)

# 3. Replace the rendering block in JSX
old_jsx_logic = r"""                  \{pages\.length > 0 && \(
                    <div className="flex flex-col gap-2">
                      \{pages\.map\(\(page, i\) => \(
                        <div key=\{i\} className="flex items-center gap-2 bg-gray-50 dark:bg-black/20 rounded-xl px-3 py-2">
                          \{selectedManga\.tipo === 'novela' \? \(
                            <div className="w-9 h-12 bg-gray-200 dark:bg-white/10 rounded-lg flex items-center justify-center shrink-0 text-gray-500 font-bold text-\[10px\]">TXT</div>
                          \) : \(
                            <img src=\{page\.preview\} alt="" className="w-9 h-12 object-cover rounded-lg shrink-0"/>
                          \)\}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold dark:text-white">Pág\. \{String\(page\.order\)\.padStart\(3,'0'\)\}</p>
                            <p className="text-\[10px\] text-gray-400 truncate">\{page\.file\.name\}</p>
                            \{page\.status === 'error' && <p className="text-\[10px\] text-red-500 truncate">\{page\.error\}</p>\}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            \{page\.status === 'uploading' && <Loader2 size=\{16\} className="animate-spin text-blue-500"/>\}
                            \{page\.status === 'done'      && <Check size=\{16\} className="text-emerald-500"/>\}
                            \{page\.status === 'error'     && <X size=\{16\} className="text-red-500"/>\}
                            \{page\.status === 'pending'   && \(
                              <>
                                <button onClick=\{\(\) => moveUp\(i\)\} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition active:scale-90"><ArrowUp size=\{14\}/></button>
                                <button onClick=\{\(\) => moveDown\(i\)\} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition active:scale-90"><ArrowDown size=\{14\}/></button>
                                <button onClick=\{\(\) => removePage\(i\)\} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition active:scale-90"><Trash2 size=\{14\}/></button>
                              </>
                            \)\}
                          </div>
                        </div>
                      \)\)\}
                    </div>
                  \)\}"""

new_jsx_logic = """                  {pages.length > 0 && (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={pages.map(p => p.id)} strategy={verticalListSortingStrategy}>
                        <div className="flex flex-col gap-2">
                          {pages.map((page, i) => (
                            <SortablePageItem key={page.id} page={page} index={i} selectedManga={selectedManga} removePage={removePage} />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}"""

content = re.sub(old_jsx_logic, new_jsx_logic, content)

with open(r'c:\Users\Leandro\Music\crmison\crimsons-scan\frontend\src\app\uploader\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
