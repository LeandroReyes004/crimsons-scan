import io

with io.open('frontend/src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    full_code = f.read()

with io.open('target_revenue_block.txt', 'r', encoding='utf-8') as f:
    target_content = f.read()

# Add Calendar to lucide-react imports if not there
if 'Calendar,' not in full_code and 'Calendar ' not in full_code:
    full_code = full_code.replace("from 'lucide-react';", ", Calendar\n} from 'lucide-react';")


new_ownscan_view = """// Vista para admin_scan: solo su propio scan
  if (ownScanId) {
    const det = scanDetail[ownScanId];
    const isLoading = loadingDetail === ownScanId;
    
    // Calculamos valores financieros simulados basados en CPM de $1.50
    const cpm = 1.50;
    const totalGenerado = det ? (det.scan_total_mes / 1000) * cpm : 0;
    
    return (
      <div className="flex flex-col gap-8 animate-in fade-in duration-300">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold dark:text-white flex items-center gap-2">
              <DollarSign size={28} className="text-emerald-500"/> 
              {currentUser?.scan_nombre || 'Tu Scan'} - Detalle de Ingresos
            </h2>
            <p className="text-gray-400 text-sm mt-1 font-medium">Panel financiero y rendimiento de tráfico válido.</p>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 p-1.5 rounded-xl">
            <div className="flex items-center px-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
              <Calendar size={16} className="mr-2"/> Ciclo
            </div>
            <input type="month" value={mes} onChange={e => setMes(e.target.value)}
              className="bg-gray-100 dark:bg-white/5 border-none px-3 py-2 rounded-lg text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer" />
          </div>
        </div>

        {isLoading && <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={40}/></div>}
        
        {det && (
          <>
            {/* Financial Summary Card */}
            <div className="bg-gradient-to-br from-gray-900 to-black dark:from-[#111114] dark:to-[#0A0A0C] border border-gray-800 dark:border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
              {/* Background Decorator */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Total Generado (Estimado)</p>
                  <div className="flex items-center gap-4">
                    <h3 className="text-5xl font-black text-white tabular-nums tracking-tight">
                      ${totalGenerado.toFixed(2)} <span className="text-2xl text-gray-500 font-bold">USD</span>
                    </h3>
                    <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={12}/> Pendiente de Liquidación
                    </span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 backdrop-blur-sm min-w-[140px]">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><Eye size={12}/> Vistas del mes</p>
                    <p className="text-xl font-bold text-white tabular-nums">{(det.scan_total_mes ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 backdrop-blur-sm min-w-[140px]">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingUp size={12}/> CPM Acordado</p>
                    <p className="text-xl font-bold text-emerald-400 tabular-nums">${cpm.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown Table */}
            <div>
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <BarChart2 size={16}/> Desglose por Obra
              </h4>
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
                                  <p className="text-[10px] text-gray-400 font-medium">{manga.capitulos.length} capítulos computados</p>
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

            {/* Payment Information Card */}
            <div className="bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-white/5 rounded-2xl p-6 flex items-center justify-between gap-4 shadow-sm mt-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 flex items-center justify-center text-gray-900 dark:text-white shadow-sm shrink-0">
                  <ShieldCheck size={20} className="text-emerald-500"/>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-0.5">Método de Recepción Registrado</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold dark:text-white">Binance Pay (ID)</p>
                    <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                      *** {currentUser?.scan_id ? currentUser.scan_id.slice(-4) : 'XXXX'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">Los pagos se procesan automáticamente entre el día 1 y 5 del mes siguiente.</p>
              </div>
            </div>

          </>
        )}
      </div>
    );
  }
"""

if target_content in full_code:
    new_code = full_code.replace(target_content, new_ownscan_view)
    with io.open('frontend/src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
        f.write(new_code)
    print("Patch applied perfectly!")
else:
    print("Target content NOT found in full_code!")
