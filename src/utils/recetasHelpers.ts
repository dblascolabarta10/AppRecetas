// src/utils/recetasHelpers.ts
export const obtenerTiempoRelativo = (fechaStr?: string): string => {
  if (!fechaStr) return 'Reciente';
  try {
    const fechaCarga = new Date(fechaStr);
    const ahora = new Date();
    const diferenciaSms = ahora.getTime() - fechaCarga.getTime();
    const minutos = Math.floor(diferenciaSms / (1000 * 60));
    const horas = Math.floor(diferenciaSms / (1000 * 60 * 60));
    const dias = Math.floor(diferenciaSms / (1000 * 60 * 60 * 24));

    if (minutos < 60) return minutos <= 5 ? '¡Justo ahora!' : `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    if (dias === 1) return 'Ayer';
    if (dias < 30) return `Hace ${dias} días`;
    return fechaCarga.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  } catch {
    return 'Reciente';
  }
};

export const formatearMinutos = (totalMinutos: number): string => {
  if (totalMinutos <= 0) return '0 min';
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  if (horas === 0) return `${minutos} min`;
  if (minutos === 0) return `${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  return `${horas}h ${minutos}m`;
};

export const obtenerColorCirculo = (dificultad: number): string => {
  if (dificultad === 1) return 'bg-emerald-500';
  if (dificultad === 2) return 'bg-lime-500';
  if (dificultad === 3) return 'bg-amber-500';
  if (dificultad === 4) return 'bg-orange-500';
  return 'bg-red-500';
};