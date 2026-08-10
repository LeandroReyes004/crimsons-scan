import io

with io.open('manga_form_extract_utf8.txt', 'r', encoding='utf-8') as f:
    old_manga_form = f.read().strip()

new_manga_form = """function MangaForm({ initial, onSave, onCancel, title, isSuperAdmin }: {
  initial?: Partial<Manga>;
  onSave: (data: any, coverFile: File | null) => Promise<void>;
  onCancel: () => void;
  title: string;
  isSuperAdmin: boolean;
}) {
  const currentUser = getUser();
  const [titulo, setTitulo]       = useState(initial?.titulo || '');
  const [tipo, setTipo]           = useState(initial?.tipo || 'manga');
  const [estado, setEstado]       = useState(initial?.estado || 'en_curso');
  const [descripcion, setDesc]    = useState(initial?.descripcion || '');
  const [jointScanId, setJointScanId] = useState(initial?.joint_scan_id || '');
  const [scanId, setScanId]       = useState(
    isSuperAdmin
      ? (initial?.scan_id || '')
      : (initial?.scan_id || currentUser?.scan_id || '')
  );
  const [scans, setScans]         = useState<{id:string; nombre:string}[]>([]);
  const [generos, setGeneros]     = useState<string[]>(() => {
    try { return initial ? JSON.parse(initial.generos || '[]') : []; } catch { return []; }
  });
  const [esAdulto, setEsAdulto]   = useState<boolean>(!!(initial?.es_adulto));
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving]       = useState(false);
  const [feedback, setFeedback]   = useState<string | null>(null);

  // Combobox states
  const [genreSearch, setGenreSearch] = useState('');
  const [showGenreMenu, setShowGenreMenu] = useState(false);
  const [jointSearch, setJointSearch] = useState('');
  const [showJointMenu, setShowJointMenu] = useState(false);
  const genreInputRef = useRef<HTMLInputElement>(null);
  const jointInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API}/api/scans`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setScans(d.scans || []));
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
       if (genreInputRef.current && !genreInputRef.current.contains(e.target as Node)) setShowGenreMenu(false);
       if (jointInputRef.current && !jointInputRef.current.contains(e.target as Node)) setShowJointMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleGenre = (g: string) => setGeneros(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await onSave({ titulo, tipo, estado, descripcion, generos, scan_id: scanId || null, joint_scan_id: jointScanId || null, es_adulto: esAdulto }, coverFile);
      setFeedback('✅ Guardado');
      setTimeout(onCancel, 1200);
    } catch (err: any) {
      setFeedback(`❌ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredGenres = GENRES_LIST.filter(g => g.toLowerCase().includes(genreSearch.toLowerCase()));
  const filteredJoints = scans.filter(s => s.id !== scanId && s.id !== currentUser?.scan_id && s.nombre.toLowerCase().includes(jointSearch.toLowerCase()));

  // We find the selected joint scan name
  const selectedJointName = scans.find(s => s.id === jointScanId)?.nombre || '';

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onCancel} />
      
      <div className="relative w-full max-w-[600px] h-full bg-white dark:bg-[#111114] shadow-2xl overflow-y-auto p-8 animate-in slide-in-from-right duration-300 flex flex-col">
        <button onClick={onCancel} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
          <X size={20}/>
        </button>
        
        <h3 className="font-bold dark:text-white mb-6 flex items-center gap-2 text-xl">
           <Plus size={20} className="text-rose-500"/> {title}
        </h3>
        
        {feedback && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${feedback.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
            {feedback}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Título *</label>
              <input value={titulo} onChange={e => setTitulo(e.target.value)} required placeholder="Ej: Solo Leveling Ragnarok"
                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-4 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"/>
            </div>
            
            {isSuperAdmin && (
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"><Layers size={11}/> Scan Responsable</label>
                <select value={scanId} onChange={e => setScanId(e.target.value)}
                  className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-4 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none">
                  <option value="">— Sin asignar —</option>
                  {scans.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)}
                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-4 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none">
                <option value="manga">Manga</option>
                <option value="manhwa">Manhwa</option>
                <option value="manhua">Manhua</option>
                <option value="novela">Novela</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Estado</label>
              <select value={estado} onChange={e => setEstado(e.target.value)}
                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-4 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none">
                <option value="en_curso">En curso</option>
                <option value="completado">Completado</option>
                <option value="pausado">Pausado</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2 md:col-span-2 relative" ref={jointInputRef}>
               <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">🤝 Joint (Opcional)</label>
               <div className="relative">
                 <input 
                   type="text" 
                   value={showJointMenu ? jointSearch : selectedJointName} 
                   onChange={e => {
                     setJointSearch(e.target.value);
                     if (e.target.value === '' && !showJointMenu) setJointScanId('');
                   }}
                   onFocus={() => setShowJointMenu(true)}
                   placeholder="Buscar un grupo aliado..."
                   className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-4 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"
                 />
                 {jointScanId && !showJointMenu && (
                   <button type="button" onClick={() => { setJointScanId(''); setJointSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                     <X size={14}/>
                   </button>
                 )}
               </div>
               
               {showJointMenu && (
                 <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 py-1">
                    {filteredJoints.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-500 italic">No hay grupos disponibles</p>
                    ) : (
                      filteredJoints.map(s => (
                        <button 
                          key={s.id} 
                          type="button" 
                          onClick={() => { setJointScanId(s.id); setJointSearch(''); setShowJointMenu(false); }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition flex items-center gap-2 dark:text-white"
                        >
                          <span className={`w-2 h-2 rounded-full ${s.id ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          {s.nombre}
                        </button>
                      ))
                    )}
                 </div>
               )}
            </div>
            
            <div className="flex items-center gap-3 mt-1 md:col-span-2">
              <button type="button" onClick={() => setEsAdulto(v => !v)}
                className={`w-11 h-6 rounded-full transition-colors shrink-0 ${esAdulto ? 'bg-rose-500' : 'bg-gray-300 dark:bg-white/20'}`}>
                <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 mt-0.5 ${esAdulto ? 'translate-x-5' : 'translate-x-0'}`}/>
              </button>
              <span className="text-sm dark:text-white font-medium">Contenido +18</span>
            </div>
          </div>
  
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sinopsis</label>
            <textarea value={descripcion} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Descripción de la obra..."
              className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-4 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none resize-none transition"/>
          </div>
  
          <div className="flex flex-col gap-2 relative" ref={genreInputRef}>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center justify-between">
              Géneros
              {generos.length > 0 && <span className="text-rose-500 normal-case text-[10px] bg-rose-500/10 px-2 py-0.5 rounded-full">{generos.length} seleccionados</span>}
            </label>
            <input 
               type="text" 
               value={genreSearch} 
               onChange={e => setGenreSearch(e.target.value)}
               onFocus={() => setShowGenreMenu(true)}
               placeholder="Buscar géneros..."
               className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-4 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"
            />
            
            {showGenreMenu && (
              <div className="absolute top-[68px] left-0 right-0 max-h-48 overflow-y-auto bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 py-1">
                 {filteredGenres.length === 0 ? (
                   <p className="px-4 py-3 text-sm text-gray-500 italic">No hay géneros que coincidan</p>
                 ) : (
                   filteredGenres.map(g => (
                     <button 
                       key={g} 
                       type="button" 
                       onClick={() => { toggleGenre(g); setGenreSearch(''); setShowGenreMenu(false); }}
                       className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition flex items-center justify-between dark:text-white"
                     >
                       {g}
                       {generos.includes(g) && <Check size={14} className="text-rose-500"/>}
                     </button>
                   ))
                 )}
              </div>
            )}
            
            {generos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {generos.map(g => (
                  <span key={g} className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-rose-100 dark:border-rose-500/20">
                    {g}
                    <button type="button" onClick={() => toggleGenre(g)} className="hover:bg-rose-200 dark:hover:bg-rose-500/30 rounded-full p-0.5 transition">
                      <X size={12}/>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
  
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5"><ImageIcon size={12}/> Portada</label>
            <input type="file" accept="image/*" onChange={async e => { const f = e.target.files?.[0]; setCoverFile(f ? await toWebP(f, 800) : null); }}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-50 file:text-rose-700 dark:file:bg-rose-500/10 dark:file:text-rose-400 cursor-pointer border border-dashed border-gray-200 dark:border-white/10 rounded-xl py-2 px-2 hover:bg-gray-50 dark:hover:bg-white/2 transition"/>
          </div>
  
          <div className="flex gap-4 mt-auto pt-6 border-t border-gray-100 dark:border-white/5">
            <button type="submit" disabled={saving || !titulo}
              className="flex-1 flex justify-center items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-3.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all shadow-lg hover:shadow-rose-500/25">
              {saving ? <Loader2 size={18} className="animate-spin"/> : <Check size={18}/>}
              {saving ? 'Guardando Obra...' : 'Guardar Obra'}
            </button>
            <button type="button" onClick={onCancel}
              className="flex-1 flex justify-center px-5 py-3.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}"""

with io.open('frontend/src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    full_code = f.read()

# Make sure old_manga_form is actually found
if old_manga_form in full_code:
    full_code = full_code.replace(old_manga_form, new_manga_form)
    with io.open('frontend/src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
        f.write(full_code)
    print("MangaForm replaced successfully")
else:
    print("old_manga_form NOT FOUND in page.tsx")
    # let's try a regex fallback just in case
    import re
    full_code = re.sub(r'function MangaForm.*?(?=\ninterface MangaChapter)', new_manga_form + '\n', full_code, flags=re.DOTALL)
    with io.open('frontend/src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
        f.write(full_code)
    print("MangaForm replaced via regex fallback")
