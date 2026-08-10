import io

with io.open('frontend/src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    full_code = f.read()

with io.open('target_superadmin_top.txt', 'r', encoding='utf-8') as f:
    target_content = f.read()

new_superadmin_top = """      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold dark:text-white flex items-center gap-2">
            <DollarSign size={28} className="text-emerald-500"/> 
            Administración Financiera Global
          </h2>
          <p className="text-gray-400 text-sm mt-1 font-medium">Panel de control de tráfico y liquidación de scans aliados.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 p-1.5 rounded-xl">
            <div className="flex items-center px-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
              <Calendar size={16} className="mr-2"/> Ciclo
            </div>
            <input type="month" value={mes} onChange={e => setMes(e.target.value)}
              className="bg-gray-100 dark:bg-white/5 border-none px-3 py-2 rounded-lg text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer" />
          </div>
          <button onClick={refetch} className="flex items-center justify-center p-3.5 bg-gray-100 dark:bg-[#111114] hover:bg-emerald-500/10 rounded-xl hover:text-emerald-500 transition-colors border border-transparent dark:border-white/10">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""}/>
          </button>
        </div>
      </div>

      {/* Global Financial Cards */}
      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Main Pool Card */}
          <div className="bg-gradient-to-br from-gray-900 to-black dark:from-[#111114] dark:to-[#0A0A0C] border border-gray-800 dark:border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-2xl flex flex-col justify-between">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6 mb-4">
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Pool de Ingresos a Repartir (75%)</p>
                <h3 className="text-4xl font-black text-emerald-500 tabular-nums tracking-tight">
                  ${totalIngresos ? (Number(totalIngresos) * 0.75).toFixed(2) : "0.00"} <span className="text-xl text-gray-500 font-bold">USD</span>
                </h3>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5 backdrop-blur-sm">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Ingresos Brutos ($)</p>
                <input type="number" placeholder="Ej: 1000" value={totalIngresos} onChange={e => setTotalIngresos(e.target.value ? Number(e.target.value) : '')}
                  className="w-32 bg-black/50 border border-white/10 px-3 py-1.5 rounded-lg text-sm text-white outline-none focus:border-emerald-500 font-bold tabular-nums" />
              </div>
            </div>
          </div>
          
          {/* Traffic Summary */}
          <div className="grid grid-cols-2 gap-4">
             {/* Views Mes */}
             <div className="bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-3xl p-6 flex flex-col justify-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4"><Eye size={24}/></div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Vistas Validadas (Mes)</p>
                <p className="text-3xl font-black dark:text-white tabular-nums">{(data.grand_total_mes ?? 0).toLocaleString()}</p>
             </div>
             {/* Vistas Historicas */}
             <div className="bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-3xl p-6 flex flex-col justify-center">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 mb-4"><TrendingUp size={24}/></div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Vistas Históricas</p>
                <p className="text-3xl font-black dark:text-white tabular-nums">{data.grand_total.toLocaleString()}</p>
             </div>
          </div>
        </div>
      )}

      {/* Main List Container */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={40}/></div>
      ) : (
        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
          {/* Fake Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-white/2 border-b border-gray-200 dark:border-white/5 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
             <div className="col-span-5">Scan / Grupo Aliado</div>
             <div className="col-span-3 text-right">Tráfico Válido</div>
             <div className="col-span-3 text-right">Liquidación Estimada</div>
             <div className="col-span-1 text-right"></div>
          </div>
          
          <div className="flex flex-col">
            {(data?.scans ?? []).map(scan => {
              const det = scanDetail[scan.id];
              const isExpanded = expandedScan === scan.id;
              const isLoading = loadingDetail === scan.id;
              const pctGlobal = pct(scan.total_views, data?.grand_total ?? 0);
              const isSelected = selectedScans.has(scan.id);
              const toggleSelection = () => {
                const newSet = new Set(selectedScans);
                if (isSelected) newSet.delete(scan.id);
                else newSet.add(scan.id);
                setSelectedScans(newSet);
              };
              
              const scanPago = (selectedViewsMes > 0 && totalIngresos !== '') 
                ? (((scan.views_mes ?? 0) / selectedViewsMes) * (Number(totalIngresos) * 0.75))
                : 0;

              return (
                <div key={scan.id} className={`border-b border-gray-100 dark:border-white/5 last:border-0 transition-colors ${isSelected ? 'bg-transparent' : 'bg-gray-50/50 dark:bg-black/20 opacity-75'}`}>
                  {/* Table Row */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center group hover:bg-gray-50 dark:hover:bg-white/2 transition-colors cursor-pointer" onClick={() => loadScanDetail(scan.id)}>
                    {/* Col 1: Scan Info */}
                    <div className="col-span-1 md:col-span-5 flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                      {isSuperAdmin && (
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={toggleSelection} 
                          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 bg-gray-100 dark:bg-white/5 cursor-pointer shrink-0"
                        />
                      )}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-500 shrink-0 font-black">
                        {scan.nombre.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold dark:text-white truncate group-hover:text-emerald-500 transition-colors">{scan.nombre}</p>
                        <p className="text-[10px] text-gray-400 truncate">{scan.total_mangas} obras activas · {scan.total_capitulos} caps</p>
                      </div>
                    </div>
                    
                    {/* Col 2: Views */}
                    <div className="col-span-1 md:col-span-3 flex flex-col md:items-end justify-center">
                      <p className="text-sm font-bold dark:text-white tabular-nums">{(scan.views_mes ?? 0).toLocaleString()} <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">Mes</span></p>
                      <div className="w-24 mt-1 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden hidden md:block">
                        <div className="h-full bg-emerald-500/50 rounded-full" style={{ width: `${pctGlobal}%` }}/>
                      </div>
                    </div>

                    {/* Col 3: Pago */}
                    <div className="col-span-1 md:col-span-3 flex flex-col md:items-end justify-center">
                      {isSelected ? (
                         <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">${scanPago.toFixed(2)}</p>
                      ) : (
                         <p className="text-sm font-bold text-gray-400 tabular-nums line-through">$0.00</p>
                      )}
                      {isSelected && totalIngresos !== '' && <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Liquidación</p>}
                    </div>

                    {/* Col 4: Action */}
                    <div className="col-span-1 text-right flex justify-end">
                      <button onClick={(e) => { e.stopPropagation(); loadScanDetail(scan.id); }} disabled={isLoading}
                        className="flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 hover:text-emerald-500 transition w-full md:w-auto">
                        {isLoading ? <Loader2 size={14} className="animate-spin"/> : (isExpanded ? "Cerrar" : "Detalle")}
                      </button>
                    </div>
                  </div>
"""

if target_content in full_code:
    new_code = full_code.replace(target_content, new_superadmin_top)
    with io.open('frontend/src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
        f.write(new_code)
    print("Patch applied successfully!")
else:
    print("Target content NOT found in full_code!")
