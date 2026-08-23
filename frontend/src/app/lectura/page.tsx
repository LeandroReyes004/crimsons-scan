'use client';
import Link from 'next/link';
import { BookOpen, Clock, ArrowLeft } from 'lucide-react';

export default function LecturaPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0c] pt-20 px-4 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-8 rounded-3xl shadow-xl text-center">
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock size={40} />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Historial de Lectura
        </h1>
        
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Estamos trabajando en esta sección. Muy pronto podrás ver aquí todo tu progreso y reanudar tus mangas favoritos justo donde los dejaste.
        </p>
        
        <Link 
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-6 rounded-full transition-all w-full"
        >
          <ArrowLeft size={20} />
          <span>Volver al Inicio</span>
        </Link>
      </div>
    </div>
  );
}
