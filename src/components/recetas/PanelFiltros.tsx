// src/components/recetas/PanelFiltros.tsx
import React from 'react';
import { X, Star, ArrowUpDown } from 'lucide-react';
import { Categoria } from '../../types/recetas';
import { formatearMinutos, obtenerColorCirculo } from '../../utils/recetasHelpers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categorias: Categoria[];
  selectedCategories: string[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  selectedDifficulties: number[];
  setSelectedDifficulties: React.Dispatch<React.SetStateAction<number[]>>;
  selectedRatings: number[];
  setSelectedRatings: React.Dispatch<React.SetStateAction<number[]>>;
  minTime: number;
  setMinTime: (t: number) => void;
  maxTime: number;
  setMaxTime: (t: number) => void;
  timeRange: string;
  setTimeRange: (r: string) => void;
  sortBy: 'recent' | 'old';
  setSortBy: (s: 'recent' | 'old') => void;
  onReset: () => void;
}

export default function PanelFiltros({
  isOpen, onClose, categorias, selectedCategories, setSelectedCategories,
  selectedDifficulties, setSelectedDifficulties, selectedRatings, setSelectedRatings,
  minTime, setMinTime, maxTime, setMaxTime, timeRange, setTimeRange, sortBy, setSortBy, onReset }: Props) {
  
  if (!isOpen) return null;
  
  return (
    <div onClick={onClose} className="absolute inset-0 bg-black/40 z-50 flex flex-col justify-end">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-h-[85%] bg-white rounded-t-3xl p-5 overflow-y-auto flex flex-col gap-4 text-left shadow-2xl">
        <div className="flex justify-between items-center border-b border-stone-100 pb-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-stone-500">Filtros de Recetas</h2>
          <button onClick={onClose} className="p-1 bg-stone-100 rounded-full"><X className="w-4 h-4" /></button>
        </div>

        {/* Tipo de Comida */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold uppercase text-stone-400">Tipo de Comida</label>
          <div className="grid grid-cols-2 gap-2">
            {categorias.map(cat => (
              <label key={cat.id} className="flex items-center gap-2 p-2 bg-stone-50 rounded-xl border border-stone-200/60 cursor-pointer text-[10px] truncate">
                <input type="checkbox" checked={selectedCategories.includes(cat.id)} onChange={() => setSelectedCategories(p => p.includes(cat.id) ? p.filter(c => c !== cat.id) : [...p, cat.id])} className="accent-amber-600 shrink-0"/>
                <span className="truncate">{cat.nombre}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Complejidad */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold uppercase text-stone-400">Complejidad (Circulos)</label>
          <div className="grid grid-cols-1 gap-1.5">
            {[1, 2, 3, 4, 5].map(num => (
              <label key={num} className="flex items-center justify-between p-2 rounded-xl border cursor-pointer text-[10px] font-bold bg-stone-50">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedDifficulties.includes(num)} onChange={() => setSelectedDifficulties(p => p.includes(num) ? p.filter(d => d !== num) : [...p, num])} className="accent-amber-600"/>
                  <span>Nivel {num}</span>
                </div>
                <div className="flex gap-1">{Array.from({ length: num }).map((_, i) => <span key={i} className={`w-2 h-2 rounded-full ${obtenerColorCirculo(num)}`} />)}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Valoracion Minima */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold uppercase text-stone-400">Valoracion Media Minima</label>
          <div className="grid grid-cols-1 gap-1.5">
            {[5, 4, 3, 2, 1].map(num => (
              <label key={num} className="flex items-center justify-between p-2 rounded-xl border cursor-pointer text-[10px] font-bold bg-stone-50">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedRatings.includes(num)} onChange={() => setSelectedRatings(p => p.includes(num) ? p.filter(r => r !== num) : [...p, num])} className="accent-amber-600"/>
                  <span>{num} {num === 5 ? 'Estrellas perfectas' : 'Estrellas o mas'}</span>
                </div>
                <div className="flex gap-0.5 text-amber-500">{Array.from({ length: num }).map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-500" />)}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Antiguedad */}
        <div className="space-y-2">
          <label className="text-[9px] font-bold uppercase text-stone-400">Antiguedad de las Recetas</label>
          <div className="flex gap-1.5 w-full">
            {['all', 'week', 'month'].map(r => (
              <button key={r} type="button" onClick={() => setTimeRange(r)} className={`flex-1 py-1.5 text-[9px] font-bold rounded-lg border uppercase ${timeRange === r ? 'bg-amber-600 text-white border-amber-600' : 'bg-stone-50 text-stone-500 border-stone-200'}`}>
                {r === 'all' ? 'Cualquier fecha' : r === 'week' ? 'Ultima semana' : 'Ultimo mes'}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 w-full mt-1">
            <button type="button" onClick={() => setSortBy('recent')} className={`flex-1 py-1.5 text-[9px] font-bold rounded-lg border uppercase flex items-center justify-center gap-1 ${sortBy === 'recent' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200'}`}><ArrowUpDown className="w-3 h-3" /> Mas recientes primero</button>
            <button type="button" onClick={() => setSortBy('old')} className={`flex-1 py-1.5 text-[9px] font-bold rounded-lg border uppercase flex items-center justify-center gap-1 ${sortBy === 'old' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200'}`}><ArrowUpDown className="w-3 h-3" /> Mas antiguas primero</button>
          </div>
        </div>

        {/* Duracion Slider */}
        <div className="space-y-3 w-full">
          <div className="flex justify-between items-center pt-1">
            <label className="text-[9px] font-bold uppercase text-stone-400">Duracion Acotada</label>
            <span className="text-[9px] font-mono font-bold text-amber-600">{formatearMinutos(minTime)} - {formatearMinutos(maxTime)}</span>
          </div>
          <div className="space-y-3 bg-stone-50 p-3 rounded-xl border border-stone-200 w-full box-border">
            <input type="range" min="0" max="180" step="5" value={minTime} onChange={(e) => setMinTime(Math.min(maxTime, Number(e.target.value)))} className="w-full accent-amber-600 h-1 bg-stone-200 appearance-none block" />
            <input type="range" min="0" max="180" step="5" value={maxTime} onChange={(e) => setMaxTime(Math.max(minTime, Number(e.target.value)))} className="w-full accent-amber-600 h-1 bg-stone-200 appearance-none block" />
          </div>
        </div>

        <div className="flex gap-2 border-t border-stone-100 pt-3 mt-1">
          <button onClick={onClose} className="flex-1 py-2 bg-amber-600 text-white text-[10px] font-bold uppercase rounded-xl">Aplicar Filtros</button>
          <button onClick={onReset} className="px-4 py-2 bg-stone-100 text-stone-600 text-[10px] font-bold uppercase rounded-xl">Limpiar</button>
        </div>
      </div>
    </div>
  );
}