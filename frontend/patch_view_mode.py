import re

with open('src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add state variable
state_vars = '''  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');'''
code = code.replace('  const [showCreate, setShowCreate] = useState(false);', state_vars)

# 2. Add toggle buttons next to filter types
filters = r'''      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['Todos', 'Manga', 'Manhwa', 'Manhua', 'Novela'].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${filterType === t ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' : 'bg-white dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10'}`}>
            {t}
          </button>
        ))}
      </div>'''

filters_with_toggle = r'''      <div className="flex items-center justify-between gap-4 mb-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {['Todos', 'Manga', 'Manhwa', 'Manhua', 'Novela'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${filterType === t ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' : 'bg-white dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden shrink-0">
          <button onClick={() => setViewMode('list')} className={`px-3 py-2 transition-colors ${viewMode === 'list' ? 'bg-rose-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
            <LayoutDashboard size={16} />
          </button>
          <button onClick={() => setViewMode('grid')} className={`px-3 py-2 transition-colors ${viewMode === 'grid' ? 'bg-rose-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
            <Layers size={16} />
          </button>
        </div>
      </div>'''

code = code.replace(filters, filters_with_toggle)

# 3. Change container class from flex flex-col to grid when in grid mode
container_start = r'''      ) : (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
          {(!data?.mangas || data.mangas.length === 0) && ('''

container_start_new = r'''      ) : (
        <div className={`${viewMode === 'list' ? 'bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'}`}>
          {(!data?.mangas || data.mangas.length === 0) && ('''

code = code.replace(container_start, container_start_new)

# 4. Item wrapper
item_wrapper = r'''            <div key={m.id} className="group border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/2 transition">
              <div className="flex items-center gap-4 px-5 py-4 cursor-pointer" onClick={() => toggleCaps(m.id)}>
                <div className="w-12 h-16 shrink-0 bg-gray-200 dark:bg-white/5 rounded-lg overflow-hidden shadow-sm relative group-hover:shadow-md transition">
                  <img src={m.portada_url ? m.portada_url.replace('/covers/', '/covers/thumb_') : '/placeholder.jpg'} alt={m.titulo} className="w-full h-full object-cover" loading="lazy" />
                  {m.tipo === 'Novela' && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><BookOpen size={16} className="text-white"/></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">{m.titulo}</h3>
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    {m.tipo.toLowerCase()}  <span className="font-mono text-[10px]">{m.id.split('-')[0]}...</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {m.demografia && <span className="text-[10px] bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{m.demografia}</span>}
                    {m.generos && JSON.parse(m.generos).slice(0, 2).map((g: string) => <span key={g} className="text-[10px] bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{g}</span>)}
                    {m.generos && JSON.parse(m.generos).length > 2 && <span className="text-[10px] text-gray-400">+{JSON.parse(m.generos).length - 2}</span>}
                  </div>
                </div>
                <div className="flex flex-col md:flex-row items-end md:items-center gap-2 opacity-0 group-hover:opacity-100 transition" onClick={e => e.stopPropagation()}>
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
              </div>'''

item_wrapper_new = r'''            <div key={m.id} className={viewMode === 'list' ? 'group border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/2 transition' : 'group bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col'}>
              <div className={viewMode === 'list' ? 'flex items-center gap-4 px-5 py-4 cursor-pointer' : 'flex flex-col gap-3 p-4 cursor-pointer flex-1'} onClick={() => toggleCaps(m.id)}>
                <div className={viewMode === 'list' ? 'w-12 h-16 shrink-0 bg-gray-200 dark:bg-white/5 rounded-lg overflow-hidden shadow-sm relative group-hover:shadow-md transition' : 'w-full aspect-[2/3] shrink-0 bg-gray-200 dark:bg-white/5 rounded-xl overflow-hidden shadow-sm relative group-hover:shadow-md transition'}>
                  <img src={m.portada_url ? m.portada_url.replace('/covers/', '/covers/thumb_') : '/placeholder.jpg'} alt={m.titulo} className="w-full h-full object-cover" loading="lazy" />
                  {m.tipo === 'Novela' && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><BookOpen size={viewMode === 'grid' ? 32 : 16} className="text-white"/></div>}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2">{m.titulo}</h3>
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {m.tipo.toLowerCase()}  <span className="font-mono text-[10px]">{m.id.split('-')[0]}...</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {m.demografia && <span className="text-[10px] bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{m.demografia}</span>}
                      {m.generos && JSON.parse(m.generos).slice(0, 2).map((g: string) => <span key={g} className="text-[10px] bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{g}</span>)}
                      {m.generos && JSON.parse(m.generos).length > 2 && <span className="text-[10px] text-gray-400">+{JSON.parse(m.generos).length - 2}</span>}
                    </div>
                  </div>
                  <div className={`flex ${viewMode === 'list' ? 'flex-col md:flex-row items-end md:items-center' : 'justify-end mt-4 pt-4 border-t border-gray-100 dark:border-white/5'} gap-2 opacity-0 group-hover:opacity-100 transition`} onClick={e => e.stopPropagation()}>
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
              </div>'''

# We need to fix the  character encoding issue and just replace using regex.
code = code.replace(item_wrapper.replace('', '·'), item_wrapper_new)

with open('src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print('Patched Grid/List view successfully')
