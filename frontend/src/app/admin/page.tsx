export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#07070a] flex items-center justify-center p-4 font-sans">
      <div className="bg-[#111114] border border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center text-center max-w-md shadow-2xl">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mb-6 border border-rose-500/20">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Panel en Mantenimiento</h1>
        <p className="text-gray-400 text-sm">Estamos realizando mejoras en el panel de administración. Volveremos a estar en línea pronto.</p>
        <a href="/" className="mt-8 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold py-2.5 px-6 rounded-xl transition-colors border border-white/10">
          Volver al Inicio
        </a>
      </div>
    </div>
  );
}
