import re

with open('src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_code = r'''            <div key={m.id} className={viewMode === 'list' ? (i !== 0 ? 'border-t border-gray-100 dark:border-white/5' : '') : 'bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col'}>
              <div className={viewMode === 'list' ? 'flex items-center gap-3 px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 dark:hover:bg-white/2 transition' : 'flex flex-col gap-3 p-4 flex-1'}>
                <div className={viewMode === 'list' ? 'w-10 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0 flex items-center justify-center text-gray-300' : 'w-full aspect-[2/3] rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0 flex items-center justify-center text-gray-300 relative group'}>
                  {m.cover_r2_key ? (
                    <img src={`${API}/api/cover/${m.id}`} alt={m.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen size={viewMode === 'list' ? 16 : 32}/>
                  )}
                  {viewMode === 'grid' && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                      <button onClick={() => toggleCaps(m.id)} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105">
                        <BookOpen size={16}/> Capítulos
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <p className={`font-bold text-sm dark:text-white ${viewMode === 'list' ? 'truncate' : 'line-clamp-2'}`} title={m.titulo}>{m.titulo}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{m.tipo} · <span className="font-mono">{m.id.slice(0,8)}...</span></p>
                    {(m as any).generos && JSON.parse((m as any).generos || '[]').length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {JSON.parse((m as any).generos).slice(0,3).map((g: string) => (
                          <span key={g} className="text-[10px] bg-gray-100 dark:bg-white/5 text-gray-500 px-1.5 py-0.5 rounded-full">{g}</span>
                        ))}
                        {JSON.parse((m as any).generos).length > 3 && (
                          <span className="text-[10px] text-gray-400">+{JSON.parse((m as any).generos).length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={`flex ${viewMode === 'list' ? 'items-center shrink-0' : 'justify-between mt-3 pt-3 border-t border-gray-100 dark:border-white/5'} gap-2`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Eye size={12}/>{m.views_total}</span>
                      <Badge estado={m.estado}/>
                    </div>
                    <div className="flex items-center gap-1">
                      {viewMode === 'list' && (
                        <button onClick={() => toggleCaps(m.id)}
                          className={`p-1.5 rounded-lg transition ${expandedId === m.id ? 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10'}`}
                          title="Ver capítulos">
                          <ChevronDown size={14} className={`transition-transform ${expandedId === m.id ? 'rotate-180' : ''}`}/>
                        </button>
                      )}
                      {!isReadOnly && (
                        <button onClick={() => { setEditing(m); setShowCreate(false); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition" title="Editar">
                          <Edit3 size={14}/>
                        </button>
                      )}
                      {!isReadOnly && (
                        <button onClick={() => handleDelete(m)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition" title="Eliminar">
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
'''

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if '{data?.mangas?.filter' in line:
        start_idx = i + 1
    if '{expandedId === m.id && (' in line and start_idx != -1:
        end_idx = i - 1
        break

if start_idx != -1 and end_idx != -1:
    lines[start_idx:end_idx+1] = [new_code]
    with open('src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print(f'Replaced lines {start_idx} to {end_idx}')
else:
    print('Failed to find block indices')
