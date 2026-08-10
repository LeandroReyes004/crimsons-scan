import re

with open('frontend/src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if "import { ArrowRight, Flame, Sparkles, Settings" in content:
    content = content.replace("import { ArrowRight, Flame, Sparkles, Settings", "import { ArrowRight, Flame, Sparkles, Settings, Calendar, Trophy")

# Find the exact start of the JSX structure of Home
start_str = '    <div className="min-h-screen pb-20 overflow-x-hidden">'
start_idx = content.find(start_str)

if start_idx != -1:
    end_idx = content.rfind('  );\n}')
    
    if end_idx != -1:
        new_return = """    <div className="pb-20 overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 flex flex-col lg:flex-row gap-8">
        
        {/* LEFT COLUMN: Main Content */}
        <main className="flex-1 min-w-0 flex flex-col gap-12">
          
          {/* HERO BANNER */}
          <section className="relative w-full rounded-3xl overflow-hidden bg-[#111114] border border-white/5 shadow-2xl flex flex-col md:flex-row min-h-[350px]">
            {featured ? (
              <>
                {/* Image Background for Mobile / Overlay */}
                <div className="absolute inset-0 z-0 overflow-hidden opacity-30 md:opacity-20 blur-xl">
                  <img src={featuredCover || '/portada.jpg'} alt="" className="w-full h-full object-cover" />
                </div>
                
                <div className="relative z-10 p-8 md:p-10 flex-1 flex flex-col justify-center">
                  <div className="inline-block bg-rose-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full w-max mb-4 tracking-widest">
                    Estreno
                  </div>
                  <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4 tracking-tight drop-shadow-md">
                    {featured.titulo}
                  </h2>
                  <p className="text-gray-300 text-sm md:text-base max-w-lg mb-8 line-clamp-3 leading-relaxed">
                    {(featured as any).descripcion || 'El proyecto más esperado ya está aquí. ¡Acompáñanos en esta increíble historia llena de emociones!'}
                  </p>
                  
                  <Link href={featured.ultimo_capitulo_id ? `/manga/reader/${featured.id}/chapter/${featured.ultimo_capitulo_id}` : `/manga/reader/${featured.id}`} 
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-bold py-3 px-8 rounded-full shadow-[0_10px_25px_rgba(225,29,72,0.4)] transition-all active:scale-95 w-max">
                    LEE AHORA <ArrowRight size={18}/>
                  </Link>
                </div>
                
                {/* Image on Right for Desktop */}
                <div className="hidden md:block relative z-10 w-1/3 shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#111114] to-transparent z-10" />
                  <img src={featuredCover || '/portada.jpg'} alt={featured.titulo} className="w-full h-full object-cover object-center" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center min-h-[350px] animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
              </div>
            )}
          </section>

          {/* CONTINUAR LEYENDO (Favoritos o Más Leídos) */}
          <MangaRow
            title="CONTINUAR LEYENDO"
            icon={null}
            mangas={favMangas.length > 0 ? favMangas : masLeidos.slice(0, 5)}
            buildCard={buildCard}
            viewAllHref="/catalogo"
          />

          {/* RECIÉN ACTUALIZADOS */}
          <MangaRow
            title="RECIÉN ACTUALIZADOS"
            icon={null}
            mangas={recientes}
            buildCard={buildCard}
            viewAllHref="/catalogo"
          />
        </main>

        {/* RIGHT COLUMN: Sidebar (Top 5 & Calendar) */}
        <aside className="w-full lg:w-[320px] xl:w-[380px] shrink-0 flex flex-col gap-6">
          
          {/* TOP 5 SEMANAL */}
          <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-black flex items-center gap-2 text-white mb-6 tracking-widest uppercase">
              <Flame className="text-orange-500" size={16} fill="currentColor"/> TOP 5 SEMANAL
            </h3>
            
            <div className="flex flex-col gap-4">
              {masLeidos.slice(0, 5).map((m, idx) => (
                <Link key={m.id} href={`/manga/reader/${m.slug ?? m.id}`} className="flex items-center gap-4 group">
                  <span className={`text-xl font-black w-4 text-center ${idx === 0 ? 'text-rose-500' : idx === 1 ? 'text-orange-400' : idx === 2 ? 'text-amber-400' : 'text-gray-600'}`}>
                    {idx + 1}
                  </span>
                  <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 border border-white/10 shadow-md">
                    <img src={m.cover_r2_key ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'}/api/cover/${m.id}` : '/portada.jpg'} alt={m.titulo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-rose-400 transition-colors">{m.titulo}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Sparkles size={10} className="text-yellow-500" fill="currentColor"/>
                      <span className="text-[10px] text-gray-400 font-semibold">{m.views_total >= 1000 ? (m.views_total/1000).toFixed(1) + 'K' : m.views_total}</span>
                    </div>
                  </div>
                </Link>
              ))}
              {masLeidos.length === 0 && <p className="text-sm text-gray-500 italic">No hay datos suficientes.</p>}
            </div>
          </div>

          {/* CALENDARIO */}
          <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-black flex items-center gap-2 text-white mb-6 tracking-widest uppercase">
              <Calendar className="text-sky-400" size={16} fill="currentColor"/> CALENDARIO
            </h3>
            
            <div className="flex flex-col gap-3">
              {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((day, idx) => {
                const m = recientes[idx % (recientes.length || 1)];
                if (!m) return null;
                return (
                  <div key={day} className="flex items-center gap-4 text-sm group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors -mx-2">
                    <span className={`font-black w-8 text-center ${idx === 0 ? 'text-rose-500' : 'text-gray-500'}`}>{day}</span>
                    <span className="text-gray-300 font-medium truncate flex-1 group-hover:text-white transition-colors">{m.titulo}</span>
                    {m.ultimo_capitulo != null && (
                      <span className="text-gray-500 text-xs font-semibold whitespace-nowrap">Cap. {m.ultimo_capitulo}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </aside>
      </div>
      {/* Modal login */}
      {loginOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setLoginOpen(false); }}>
          <div className="bg-[#111114] rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-white/10">
            <h2 className="text-lg font-extrabold text-white mb-1">Iniciar sesión</h2>
            <p className="text-sm text-gray-500 mb-5">Ingresá con tu cuenta de Crimson Scan</p>
            {loginErr && (
              <div className="mb-4 p-3 rounded-xl text-sm font-medium bg-red-500/10 text-red-400">{loginErr}</div>
            )}
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input
                value={loginUser} onChange={e => setLoginUser(e.target.value)} required
                placeholder="Usuario" autoComplete="username"
                className="bg-black/30 border border-white/10 px-3 py-2.5 rounded-xl text-sm text-white focus:border-rose-500 outline-none transition"
              />
              <input
                type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} required
                placeholder="Contraseña" autoComplete="current-password"
                className="bg-black/30 border border-white/10 px-3 py-2.5 rounded-xl text-sm text-white focus:border-rose-500 outline-none transition"
              />
              <div className="flex gap-2 mt-1">
                <button type="submit" disabled={loginLoading}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition">
                  {loginLoading ? 'Entrando...' : 'Entrar'}
                </button>
                <button type="button" onClick={() => setLoginOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:bg-white/5 transition">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>"""
        content = content[:start_idx] + new_return + content[end_idx:]
        with open('frontend/src/app/page.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Patched successfully")
    else:
        print("Could not find end index")
else:
    print("Could not find start_str")
