// src/components/recetas/CirculosDificultad.tsx
import React from 'react';
import { obtenerColorCirculo } from '../../utils/recetasHelpers';

export default function CirculosDificultad({ dificultad }: { dificultad: number }) {
  const colorClass = obtenerColorCirculo(dificultad);
  return (
    <div className="flex items-center gap-1 shrink-0 bg-stone-100/80 px-2 py-0.5 rounded-full border border-stone-200/40">
      <span className="text-[7px] text-stone-500 font-sans font-black uppercase tracking-wider mr-0.5">Dif:</span>
      {Array.from({ length: dificultad }).map((_, i) => (
        <span key={i} className={`w-1.5 h-1.5 rounded-full ${colorClass}`} />
      ))}
    </div>
  );
}