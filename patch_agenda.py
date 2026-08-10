import io
import re

with io.open('frontend/src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    full_code = f.read()

new_revision_form = """function SectionRevision() {
  const { data, loading, refetch } = useAPI<{ capitulos: CapAgenda[] }>('/api/admin/scheduled');
  const [processing, setProcessing] = useState<string | null>(null);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [newFecha, setNewFecha]     = useState('');

  const publishNow = async (id: string) => {
    setProcessing(id);
    await fetch(`${API}/api/chapters/${id}/reschedule`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha_publicacion: null }),
    });
    refetch();
    setProcessing(null);
  };

  const reschedule = async (id: string) => {
    setProcessing(id);
    const utcDate = newFecha ? new Date(newFecha).toISOString() : null;
    await fetch(`${API}/api/chapters/${id}/reschedule`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha_publicacion: utcDate }),
    });
    setEditingId(null);
    refetch();
    setProcessing(null);
  };

  const deleteChapter = async (id: string) => {
    if (!confirm('¿Eliminar este capítulo? Esta acción no se puede deshacer.')) return;
    setProcessing(id);
    await fetch(`${API}/api/chapters/${id}`, { method: 'DELETE', headers: authHeaders() });
    refetch();
    setProcessing(null);
  };

  const groupedCaps = (data?.capitulos ?? []).reduce((acc: Record<string, CapAgenda[]>, cap) => {
    let groupName = "Sin Fecha Programada";
    if (cap.fecha_publicacion) {
        const date = new Date(cap.fecha_publicacion);
        const formattedDate = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        groupName = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    }
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(cap);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold dark:text-white">Agenda de Publicaciones</h2>
          <p className="text-gray-500 text-sm mt-1">{data?.capitulos?.length ?? 0} capítulos en espera</p>
        </div>
        <button onClick={refetch} className="flex items-center gap-2 text-sm text-gray-500 hover:text-rose-500 transition">
          <RefreshCw size={15}/> Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-rose-500" size={32}/></div>
      ) : data?.capitulos?.length === 0 ? (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center py-16 text-gray-400">
          <Check size={40} className="mb-3 text-emerald-400"/>
          <p className="font-medium">No hay capítulos programados</p>
          <p className="text-sm mt-1">Los capítulos subidos aparecen aquí antes de publicarse</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(groupedCaps).map(([dateLabel, caps]) => (
            <div key={dateLabel} className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">{dateLabel}</h3>
              <div className="flex flex-col rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111114] shadow-sm">
                {caps.map((cap, i) => {
                  const esProgramado = cap.estado === 'programado' && cap.fecha_publicacion;
                  const fechaLocal = cap.fecha_publicacion ? new Date(cap.fecha_publicacion) : null;
                  const yaVencio = fechaLocal && fechaLocal < new Date();
                  
                  return (
                    <div key={cap.id} className={`flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 gap-4 transition hover:bg-gray-50 dark:hover:bg-white/2 ${i !== 0 ? 'border-t border-gray-100 dark:border-white/5' : ''}`}>
                      
                      {/* Lado Izquierdo: Info de Manga */}
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-[15px] dark:text-white truncate" title={cap.manga_titulo}>{cap.manga_titulo}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-semibold text-gray-400">Cap. {cap.numero}{cap.titulo ? ` — ${cap.titulo}` : ''}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/10"></span>
                          <span className="text-xs font-medium text-blue-500/80 dark:text-blue-400/80 truncate">por {cap.uploader_username}</span>
                        </div>
                      </div>
                      
                      {/* Centro: Tiempo (solo si no estamos editando) */}
                      {editingId !== cap.id && (
                        <div className="flex items-center gap-3 shrink-0">
                          {!esProgramado && <Badge estado={cap.estado}/>}
                          {esProgramado && !yaVencio && (
                             <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 flex items-center gap-1.5 border border-gray-200 dark:border-white/5">
                               <Clock size={12} className="opacity-70"/>
                               {fechaLocal!.toLocaleTimeString('es', { hour:'2-digit', minute:'2-digit' })}
                               <span className="opacity-50 ml-1 font-normal">({Math.ceil((fechaLocal!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d)</span>
                             </span>
                          )}
                          {esProgramado && yaVencio && (
                             <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 flex items-center gap-1.5 border border-orange-200 dark:border-orange-500/20">
                               <Clock size={12}/> Vencido
                             </span>
                          )}
                        </div>
                      )}

                      {/* Lado Derecho: Acciones o Modo Edición */}
                      {editingId === cap.id ? (
                         <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto mt-3 lg:mt-0">
                           <input type="datetime-local" value={newFecha} onChange={e => setNewFecha(e.target.value)}
                             className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none w-full lg:w-48 transition"/>
                           <button onClick={() => reschedule(cap.id)} disabled={processing === cap.id}
                             className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition flex justify-center items-center h-[38px]">
                             {processing === cap.id ? <Loader2 size={16} className="animate-spin"/> : 'Guardar'}
                           </button>
                           <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition">
                             <X size={16}/>
                           </button>
                         </div>
                      ) : (
                         <div className="flex items-center gap-1 shrink-0 mt-3 lg:mt-0 ml-auto lg:ml-0">
                            <button onClick={() => {
                                setEditingId(cap.id);
                                if (cap.fecha_publicacion) {
                                  const d = new Date(cap.fecha_publicacion);
                                  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
                                  setNewFecha(local.toISOString().slice(0,16));
                                } else {
                                  setNewFecha('');
                                }
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition"
                              title="Reprogramar">
                              <Clock size={14}/> <span>Reprogramar</span>
                            </button>
                            
                            <button onClick={() => publishNow(cap.id)} disabled={processing === cap.id}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold text-gray-400 border border-transparent hover:border-emerald-500/30 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition disabled:opacity-50"
                              title="Publicar ahora de inmediato">
                              {processing === cap.id ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} <span className="hidden sm:inline">Publicar ya</span>
                            </button>
                            
                            <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 mx-1"></div>

                            <button onClick={() => deleteChapter(cap.id)} disabled={processing === cap.id}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                              title="Eliminar capítulo">
                              {processing === cap.id ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                            </button>
                         </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}"""

# Use regex to match function SectionRevision() { ... } up to the next section or the end of the file.
new_code = re.sub(r'function SectionRevision\(\)\s*\{.*?(?=\n\s*// ===+|\n\s*function SectionUsuarios)', new_revision_form, full_code, flags=re.DOTALL)

with io.open('frontend/src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(new_code)
print('Done!')
