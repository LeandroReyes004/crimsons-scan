import io

with io.open('frontend/src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    full_code = f.read()

with io.open('target_superadmin_block.txt', 'r', encoding='utf-8') as f:
    target_content = f.read()

new_superadmin_view = """                {/* Detalle expandido */}
                {isExpanded && det && (() => {
                  const cpm = 1.50;
                  const totalGenerado = det ? (det.scan_total_mes / 1000) * cpm : 0;
                  return (
                  <div className="border-t border-gray-100 dark:border-white/5 px-6 py-6 bg-gray-50/50 dark:bg-[#0A0A0C] animate-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
                      <div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Total Generado (Estimado)</p>
                        <div className="flex items-center gap-4">
                          <h3 className="text-4xl font-black text-emerald-500 tabular-nums tracking-tight">
                            ${totalGenerado.toFixed(2)} <span className="text-xl text-gray-500 font-bold">USD</span>
                          </h3>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="bg-white dark:bg-[#111114] rounded-2xl p-4 border border-gray-200 dark:border-white/5 min-w-[140px]">
                          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><Eye size={12}/> Vistas del mes</p>
                          <p className="text-xl font-bold dark:text-white tabular-nums">{(det.scan_total_mes ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-white dark:bg-[#111114] rounded-2xl p-4 border border-gray-200 dark:border-white/5 min-w-[140px]">
                          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingUp size={12}/> CPM Acordado</p>
                          <p className="text-xl font-bold text-emerald-500 tabular-nums">${cpm.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-white/2 border-b border-gray-200 dark:border-white/5 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                              <th className="px-6 py-4 font-bold">Obra</th>
                              <th className="px-6 py-4 font-bold text-right">Vistas Válidas</th>
                              <th className="px-6 py-4 font-bold text-right">Tarifa / CPM</th>
                              <th className="px-6 py-4 font-bold text-right">Total Parcial</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {det.mangas.map(manga => {
                              const mangaViews = manga.views_mes ?? 0;
                              const mangaRev = (mangaViews / 1000) * cpm;
                              return (
                                <tr key={manga.id} className="hover:bg-gray-50 dark:hover:bg-white/2 transition-colors group">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 shrink-0 border border-gray-200 dark:border-white/5">
                                        <BookOpen size={16}/>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-bold dark:text-white truncate group-hover:text-emerald-500 transition-colors">{manga.titulo}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{manga.tipo} · {manga.capitulos.length} capítulos</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <p className="text-sm font-bold dark:text-white tabular-nums">{mangaViews.toLocaleString()}</p>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <p className="text-sm text-gray-500 tabular-nums">${cpm.toFixed(2)}</p>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">${mangaRev.toFixed(2)}</p>
                                  </td>
                                </tr>
                              );
                            })}
                            {det.mangas.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500 italic">No hay obras registradas en este periodo.</td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot className="bg-gray-50 dark:bg-white/2 border-t border-gray-200 dark:border-white/10">
                            <tr>
                              <td className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Total Acumulado</td>
                              <td className="px-6 py-4 text-right text-sm font-black dark:text-white tabular-nums">{(det.scan_total_mes ?? 0).toLocaleString()}</td>
                              <td className="px-6 py-4"></td>
                              <td className="px-6 py-4 text-right text-base font-black text-emerald-500 tabular-nums">${totalGenerado.toFixed(2)} USD</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                  );
                })()}"""

if target_content in full_code:
    new_code = full_code.replace(target_content, new_superadmin_view)
    with io.open('frontend/src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
        f.write(new_code)
    print("SuperAdmin patch applied successfully!")
else:
    print("Target content NOT found in full_code!")
