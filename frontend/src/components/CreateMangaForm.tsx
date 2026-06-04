'use client';

import { useState, useCallback } from 'react';
import { authHeaders } from '@/lib/auth';
import { ImagePlus, Loader2, Save, X, Check } from 'lucide-react';
import { MANGA_TYPES, DEMOGRAPHICS, CONTENT_RATINGS, GENRES } from '@/lib/constants';

export default function CreateMangaForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState(MANGA_TYPES[0]);
  const [demography, setDemography] = useState(DEMOGRAPHICS[0]);
  const [contentRating, setContentRating] = useState(CONTENT_RATINGS[0]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Estado para la Imagen
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Estados Globales
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error'|'success', msg: string } | null>(null);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => 
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('cover', file);

      const res = await fetch('/api/mangas/cover-upload', {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setCoverUrl(data.coverUrl);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error subiendo imagen');
    } finally {
      setIsUploadingImage(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  }, [handleImageUpload]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      const payload = {
        title,
        description,
        type,
        demography,
        contentRating,
        genres: selectedGenres,
        coverUrl
      };

      const res = await fetch('/api/mangas', {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', msg: `¡Obras creada existosamente con ID: ${data.mangaId}!` });
        // Limpiar
        setTitle('');
        setDescription('');
        setCoverUrl(null);
        setSelectedGenres([]);
      } else {
        setFeedback({ type: 'error', msg: data.error || 'Error desconocido' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Error del lado del cliente' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0f0f13] border border-gray-200 dark:border-white/5 rounded-xl shadow-lg p-6 md:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8 border-b border-gray-200 dark:border-white/10 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ImagePlus className="text-rose-500" /> Nueva Obra
        </h2>
        <p className="text-sm text-gray-500 mt-1">Sube la portada principal y define todos los detalles estilo MangaDex.</p>
      </div>

      {feedback && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 font-medium ${feedback.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {feedback.type === 'success' ? <Check size={18} /> : <X size={18} />}
          {feedback.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Columna Izquierda: Imagen */}
          <div className="w-full md:w-1/3 flex flex-col gap-2 relative">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Portada Principal</label>
            
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`aspect-[3/4] w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all overflow-hidden relative ${!coverUrl ? 'border-gray-300 dark:border-white/20 hover:border-rose-500 bg-gray-50 dark:bg-[#1a1b20]' : 'border-rose-500'}`}
            >
              {isUploadingImage ? (
                <div className="flex flex-col items-center text-rose-500 gap-2">
                  <Loader2 className="animate-spin" size={32} />
                  <span className="text-sm font-semibold">Subiendo a R2...</span>
                </div>
              ) : coverUrl ? (
                <>
                  <img src={coverUrl} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover z-0" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <label className="cursor-pointer bg-black/80 text-white px-4 py-2 rounded-full font-semibold border border-white/20 hover:bg-rose-600 transition">
                      Cambiar
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        if (e.target.files && e.target.files[0]) handleImageUpload(e.target.files[0]);
                      }} />
                    </label>
                  </div>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center text-gray-400 hover:text-rose-500 gap-3 text-center">
                  <ImagePlus size={48} />
                  <span className="text-sm font-medium">Arrastra la portada aquí o Haz Clic</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        if (e.target.files && e.target.files[0]) handleImageUpload(e.target.files[0]);
                      }} />
                </label>
              )}
            </div>
            {!coverUrl && <p className="text-[11px] text-gray-400 text-center mt-1">El archivo se subirá automáticamente a R2 al seleccionarlo.</p>}
          </div>

          {/* Columna Derecha: Datos */}
          <div className="w-full md:w-2/3 flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Título de la Obra</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
                placeholder="Ej. Solo Leveling: Ragnarok"
                className="w-full bg-gray-50 dark:bg-[#1a1b20] border border-gray-200 dark:border-white/10 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none transition text-sm text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Sinopsis / Descripción</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                required 
                rows={4}
                placeholder="Breve resumen de la historia..."
                className="w-full bg-gray-50 dark:bg-[#1a1b20] border border-gray-200 dark:border-white/10 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none transition text-sm text-gray-900 dark:text-white resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Tipo</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-gray-50 dark:bg-[#1a1b20] border border-gray-200 dark:border-white/10 px-3 py-2 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-rose-500">
                  {MANGA_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Demografía</label>
                <select value={demography} onChange={(e) => setDemography(e.target.value)} className="w-full bg-gray-50 dark:bg-[#1a1b20] border border-gray-200 dark:border-white/10 px-3 py-2 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-rose-500">
                  {DEMOGRAPHICS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Clasificación</label>
                <select value={contentRating} onChange={(e) => setContentRating(e.target.value)} className="w-full bg-gray-50 dark:bg-[#1a1b20] border border-gray-200 dark:border-white/10 px-3 py-2 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-rose-500">
                  {CONTENT_RATINGS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sección Géneros */}
        <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex flex-col gap-3">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex justify-between items-center">
            <span>Géneros</span> {selectedGenres.length > 0 && <span className="text-rose-500 normal-case bg-rose-500/10 px-2 py-0.5 rounded-full text-[10px]">{selectedGenres.length} seleccionados</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => {
              const isSelected = selectedGenres.includes(genre);
              return (
                <button
                  type="button"
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                    isSelected 
                    ? 'bg-rose-500 text-white border-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.3)]' 
                    : 'bg-transparent text-gray-600 dark:text-gray-400 border-gray-300 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 mt-2 flex justify-end">
          <button 
            type="submit" 
            disabled={isSaving || !coverUrl || !title}
            className="bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {isSaving ? 'Guardando en BD...' : 'Publicar Obra Principal'}
          </button>
        </div>
      </form>
    </div>
  );
}
