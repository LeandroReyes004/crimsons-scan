'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Shield, 
  Scale, 
  Lock, 
  Mail, 
  Baby, 
  Users, 
  Megaphone, 
  AlertTriangle, 
  Ban, 
  RefreshCw, 
  CheckCircle2, 
  Cookie, 
  Eye, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

type TabType = 'terminos' | 'dmca' | 'privacidad';

export default function ReglamentoPage() {
  const [activeTab, setActiveTab] = useState<TabType>('terminos');

  const tabs = [
    { id: 'terminos', label: 'Términos de Servicio', icon: Scale, testId: 'btn-term-rules' },
    { id: 'dmca', label: 'Protección DMCA', icon: Shield, testId: 'btn-term-dmca' },
    { id: 'privacidad', label: 'Política de Privacidad', icon: Lock, testId: 'btn-term-privacy' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0c] text-slate-900 dark:text-white font-sans transition-colors duration-300">
      
      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 h-16 px-6 sm:px-12 flex items-center justify-between shadow-sm dark:shadow-2xl">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl text-gray-500 hover:text-rose-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-all flex items-center justify-center">
            <ChevronLeft size={20} />
          </Link>
          <img src="/logo.png" alt="CrimsonScan" className="h-8 w-auto object-contain" />
        </div>
        <Link href="/" className="text-xs font-bold text-gray-500 hover:text-rose-500 hover:underline transition">
          Volver al Inicio
        </Link>
      </header>

      {/* Main Section Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-950/20 to-orange-950/10 py-16 px-6 sm:px-12 border-b border-gray-200 dark:border-white/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-6xl mx-auto text-center relative z-10 flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest animate-pulse">
            <Shield size={14} /> Centro Legal & Comunidad
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-400 leading-tight">
            Términos y Políticas
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
            Bienvenidos a <span className="text-rose-500 font-bold">Scan Crimson</span>. Hemos redactado estos términos de forma clara y directa para que sepas cómo funciona nuestra casa, cómo protegemos a la comunidad y cuáles son los límites legales.
          </p>
        </div>
      </section>

      {/* Layout Content */}
      <div className="max-w-6xl mx-auto px-6 sm:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar Tabs - Desktop / Responsive */}
          <aside className="lg:col-span-4 flex flex-col gap-3 lg:sticky lg:top-24">
            
            {/* Mobile Tab Select/Scroll */}
            <div className="flex lg:hidden overflow-x-auto pb-2 gap-2 scrollbar-none snap-x snap-mandatory">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={tab.testId}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center gap-2 shrink-0 snap-start px-5 py-3 rounded-2xl text-sm font-bold border transition-all duration-300 ${
                      isActive
                        ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-600/30'
                        : 'bg-white dark:bg-[#111114] border-gray-200 dark:border-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/10'
                    }`}
                  >
                    <IconComponent size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Desktop Tab Selector */}
            <div className="hidden lg:flex flex-col gap-2 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-4 rounded-3xl shadow-xl">
              <span className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 mb-2">Documentos Legales</span>
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={tab.testId}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-left text-sm font-bold border transition-all duration-300 group ${
                      isActive
                        ? 'bg-gradient-to-r from-rose-600 to-rose-500 border-rose-500 text-white shadow-lg shadow-rose-600/20 translate-x-1'
                        : 'bg-transparent border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/5 group-hover:bg-rose-500/10 group-hover:text-rose-500'
                    }`}>
                      <IconComponent size={16} />
                    </div>
                    <span className="flex-1">{tab.label}</span>
                    <ArrowRight size={14} className={`opacity-0 transition-all ${isActive ? 'opacity-100 translate-x-0.5' : ''}`} />
                  </button>
                );
              })}
            </div>

            {/* Support Callout Box */}
            <div className="bg-gradient-to-br from-rose-600/10 to-orange-500/10 border border-rose-500/20 p-5 rounded-3xl mt-4 flex flex-col gap-3">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles size={16} className="text-rose-500" /> ¿Necesitas Ayuda?
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Si tienes preguntas sobre nuestros términos o quieres reportar un problema, puedes abrir un ticket de soporte en la parte inferior o enviarnos un email.
              </p>
              <a 
                href="mailto:kaiser1205@proton.me" 
                className="text-xs font-bold text-rose-500 dark:text-rose-400 hover:underline mt-1 flex items-center gap-1.5"
              >
                kaiser1205@proton.me <ArrowRight size={12} />
              </a>
            </div>
          </aside>

          {/* Active Tab Panel - Content Area */}
          <main className="lg:col-span-8 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-6 sm:p-10 rounded-3xl shadow-xl min-h-[500px]">
            
            {/* TÉRMINOS DE SERVICIO */}
            {activeTab === 'terminos' && (
              <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                <div className="border-b border-gray-200 dark:border-white/5 pb-4">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Scale className="text-rose-500" size={24} /> 1. Reglas del Juego (Términos de Servicio)
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Última actualización: 21 de Junio, 2026</p>
                </div>

                {/* 1.1 Edad Minima */}
                <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 items-start">
                  <div className="p-3 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                    <Baby size={22} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">1.1. Edad Mínima para Entrar</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      Para navegar y tener una cuenta aquí, debes tener al menos <strong>13 años</strong>. Si aún no alcanzas esa edad, por favor, cierra la página. Esta plataforma y sus dinámicas no están diseñadas para un público infantil.
                    </p>
                  </div>
                </div>

                {/* 1.2 Convivencia y Normas */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="text-rose-500" size={18} /> 1.2. Convivencia y Normas de la Comunidad
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    Al registrarte o leer en Scan Crimson, aceptas mantener el respeto mutuo. No toleraremos comportamientos nocivos o malintencionados.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/10 flex flex-col gap-1.5">
                      <span className="text-xs font-black uppercase text-rose-500 tracking-wider">Cero Spam o Trampas</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        Nada de enlaces engañosos, intentos de estafa o saturación de comentarios. Protegemos la experiencia de lectura.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/10 flex flex-col gap-1.5">
                      <span className="text-xs font-black uppercase text-rose-500 tracking-wider">Guerra a los Spoilers</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        Arruinarle la lectura a otros no está bien. Si vas a comentar detalles clave de la trama, usa siempre las etiquetas de spoiler.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/10 flex flex-col gap-1.5 md:col-span-2">
                      <span className="text-xs font-black uppercase text-rose-500 tracking-wider flex items-center gap-1.5">
                        El Filtro +18 (Zona NSFW)
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        Sabemos que existe contenido dirigido a un público maduro. Por eso, cualquier material explícito, pornográfico o hentai tiene su propia zona aislada bajo la etiqueta <strong>"+18"</strong>. 
                      </p>
                      <div className="mt-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium leading-relaxed">
                        <strong>Advertencia:</strong> Entrar a esta zona requiere que seas mayor de edad legal bajo tu propia y estricta responsabilidad. Si un usuario o un grupo aliado sube contenido para adultos en las secciones generales o "SFW" (Safe for Work), el material será eliminado y la cuenta sancionada.
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/10 flex flex-col gap-1.5 md:col-span-2">
                      <span className="text-xs font-black uppercase text-rose-500 tracking-wider">Ambiente Sano</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        Expulsaremos a cualquiera que promueva el acoso, discursos de odio, violencia o que intente dañar la integridad de otros usuarios.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 1.3 Aliados */}
                <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 items-start">
                  <div className="p-3 bg-rose-100 dark:bg-rose-50/5 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                    <Users size={22} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">1.3. La Independencia de Nuestros Aliados (Los Scans)</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      Scan Crimson es un ecosistema tecnológico. Le damos alojamiento y herramientas a varios grupos de traducción (scans) para que publiquen sus obras. Sin embargo, <strong>cada scan es dueño, administrador y responsable único de lo que sube a su perfil</strong>. Nosotros ponemos la infraestructura y el lector de imágenes, pero no controlamos ni editamos previamente el material o las opiniones que estos grupos publican.
                    </p>
                  </div>
                </div>

                {/* 1.4 Publicidad */}
                <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 items-start">
                  <div className="p-3 bg-rose-100 dark:bg-rose-50/5 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                    <Megaphone size={22} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">1.4. Cómo Mantenemos los Servidores Vivos (Publicidad)</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      Pagar servidores potentes y sistemas de protección contra ataques cuesta dinero. Por eso, verás anuncios y enlaces de redes publicitarias externas. Nosotros no controlamos los sitios a los que te llevan esos anuncios, ni sus políticas. Si haces clic en una publicidad, la navegación externa corre por tu cuenta y riesgo.
                    </p>
                  </div>
                </div>

                {/* 1.5 Proteccion Tecnica */}
                <div className="flex gap-4 p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/20 items-start">
                  <div className="p-3 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                    <AlertTriangle size={22} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-bold text-amber-700 dark:text-amber-400">1.5. Nuestra Protección Técnica (Exención de Responsabilidad)</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      Hacemos todo lo posible por mantener la web rápida y blindada con sistemas de seguridad robustos, pero la tecnología no es perfecta. Ofrecemos Scan Crimson "tal cual" está. No podemos prometer que el sitio nunca se caerá, que no habrá latencia en el contador de vistas o que estamos 100% libres de ciberataques. No nos hacemos responsables si, por una falla en la base de datos o una migración, se pierde tu historial de lectura, tus marcadores o las estadísticas de un scan.
                    </p>
                  </div>
                </div>

                {/* 1.6 Baneo */}
                <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 items-start">
                  <div className="p-3 bg-rose-100 dark:bg-rose-50/5 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                    <Ban size={22} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">1.6. Derecho de Admisión y Baneo</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      Nuestra casa, nuestras reglas. Nos reservamos el derecho absoluto de banear usuarios, suspender cuentas de scans aliados o restringir el acceso a la web en cualquier momento y sin previo aviso. Seremos especialmente estrictos con aquellos que intenten inflar sus visualizaciones usando bots, scraping o scripts automatizados para alterar las estadísticas de lectura.
                    </p>
                  </div>
                </div>

                {/* 1.7 Actualizaciones */}
                <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 items-start">
                  <div className="p-3 bg-rose-100 dark:bg-rose-50/5 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                    <RefreshCw size={22} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">1.7. Actualizaciones del Reglamento</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      Podemos actualizar estas reglas cuando sea necesario para adaptarnos a nuevas tecnologías o leyes. Si sigues usando Scan Crimson después de un cambio, asumimos que estás de acuerdo con la nueva versión.
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* DMCA */}
            {activeTab === 'dmca' && (
              <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                <div className="border-b border-gray-200 dark:border-white/5 pb-4">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="text-rose-500" size={24} /> 2. Protección de Derechos de Autor (DMCA)
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Procedimiento de Notificación y Retirada</p>
                </div>

                <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex flex-col gap-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    Respetamos el trabajo de los creadores. Dado que el contenido de nuestra plataforma es subido de manera descentralizada por la comunidad de traductores, funcionamos bajo la normativa de <strong>"Notificación y Retirada" (DMCA)</strong>. Si eres el dueño legal de una obra y consideras que se están vulnerando tus derechos, escríbenos directamente a:
                  </p>
                  
                  <div className="flex items-center justify-center p-4 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl text-center self-center max-w-md w-full shadow-md">
                    <a 
                      href="mailto:kaiser1205@proton.me" 
                      className="text-lg font-black text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-2"
                    >
                      <Mail size={18} /> kaiser1205@proton.me
                    </a>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Requisitos Obligatorios de la Solicitud
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    Para que podamos actuar rápido y eliminar el contenido, tu correo debe incluir obligatoriamente la siguiente información:
                  </p>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { num: '1', title: 'Nombre de la Obra', text: 'El nombre exacto de la obra protegida.' },
                      { num: '2', title: 'Enlaces Directos (URLs)', text: 'Los enlaces directos (URLs exactas) donde se encuentra el material infractor dentro de Scan Crimson. No podemos procesar quejas que no incluyan el link exacto del capítulo.' },
                      { num: '3', title: 'Datos de Contacto', text: 'Tus datos de contacto reales (Nombre completo, teléfono y correo electrónico).' },
                      { num: '4', title: 'Declaración de Buena Fe', text: 'Una declaración afirmando que "crees de buena fe que el uso de este material no está autorizado por el autor original ni por la ley".' },
                      { num: '5', title: 'Declaración Jurada', text: 'Otra declaración jurada de que "la información de la queja es real y tienes la autoridad legal para representar los derechos de la obra".' },
                      { num: '6', title: 'Firma', text: 'Tu firma (física o electrónica).' }
                    ].map((item) => (
                      <div key={item.num} className="flex gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/10 items-start">
                        <div className="w-7 h-7 rounded-full bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center font-bold text-xs shrink-0 border border-rose-500/20">
                          {item.num}
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PRIVACIDAD */}
            {activeTab === 'privacidad' && (
              <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                <div className="border-b border-gray-200 dark:border-white/5 pb-4">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Lock className="text-rose-500" size={24} /> 3. Lo Que Sabemos de Ti (Política de Privacidad)
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Cómo protegemos y gestionamos tus datos</p>
                </div>

                {/* 3.1 Datos que guardamos */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Eye className="text-rose-500" size={18} /> 3.1. Los datos que guardamos
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    Para que la web funcione y podamos pagar justamente a los scans según sus lecturas, recopilamos información muy puntual:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/10 flex flex-col gap-2">
                      <div className="inline-flex items-center gap-1.5 text-rose-500 font-bold text-sm">
                        <Lock size={15} /> Tu Perfil
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        Si decides registrarte, guardamos tu correo y tu nombre de usuario. Tu contraseña se guarda <strong>completamente encriptada</strong> (ni siquiera nosotros podemos verla).
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/10 flex flex-col gap-2">
                      <div className="inline-flex items-center gap-1.5 text-rose-500 font-bold text-sm">
                        <Eye size={15} /> Tus Lecturas
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        Registramos datos técnicos anónimos (como tu dirección IP ofuscada, si navegas desde móvil o PC, y qué capítulos lees) para alimentar el contador de estadísticas internas.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3.2 Cookies */}
                <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 items-start">
                  <div className="p-3 bg-rose-100 dark:bg-rose-50/5 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                    <Cookie size={22} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">3.2. Cookies y Anunciantes</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      Usamos cookies propias para cosas simples: mantener tu sesión iniciada o recordar si prefieres el modo oscuro. Además, nuestros socios publicitarios usan sus propios rastreadores para saber desde qué país los visitas y no mostrarte anuncios repetidos. Puedes bloquear estas cookies desde tu navegador si lo prefieres, aunque algunas funciones del sitio podrían volverse más lentas.
                    </p>
                  </div>
                </div>

                {/* 3.3 Seguridad */}
                <div className="flex gap-4 p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 items-start">
                  <div className="p-3 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                    <CheckCircle2 size={22} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">3.3. Tu Seguridad es Prioridad</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      Tenemos medidas estrictas, incluyendo escudos perimetrales en la red, para evitar que extraños extraigan datos masivos de la plataforma. <strong>Jamás le venderemos tu base de datos, tu correo o tu perfil a empresas externas</strong>. La única información que compartimos son los números totales de vistas, y lo hacemos únicamente de forma interna con los administradores de los scans para gestionar el reparto de ingresos de la plataforma.
                    </p>
                  </div>
                </div>

              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
