export function calculateUserRank(capitulosLeidos: number): { name: string; color: string } {
  if (capitulosLeidos < 11) {
    return { name: "Lector Casual", color: "bg-gray-500 text-white border-gray-400" };
  } else if (capitulosLeidos < 51) {
    return { name: "Lector Habitual", color: "bg-emerald-600 text-white border-emerald-500" };
  } else if (capitulosLeidos < 151) {
    return { name: "Devorador de Mangas", color: "bg-cyan-600 text-white border-cyan-500 shadow-[0_0_10px_rgba(8,145,178,0.4)]" };
  } else if (capitulosLeidos < 500) {
    return { name: "Sabio de la Lectura", color: "bg-fuchsia-600 text-white border-fuchsia-500 shadow-[0_0_15px_rgba(192,38,211,0.5)]" };
  } else {
    return { name: "Dios del Manhwa", color: "bg-gradient-to-r from-yellow-400 to-amber-600 text-white border-yellow-300 shadow-[0_0_20px_rgba(251,191,36,0.6)] font-black uppercase tracking-widest" };
  }
}
