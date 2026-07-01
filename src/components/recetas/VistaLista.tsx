// src/components/recetas/VistaLista.tsx
import React from 'react';
import { Search, Clock, SlidersHorizontal, Plus, Bookmark } from 'lucide-react';
import { Receta } from '../../types/recetas';
import { formatearMinutos } from '../../utils/recetasHelpers';
import EstrellasValoracion from './EstrellasValoracion';
import CirculosDificultad from './CirculosDificultad';
import { BookmarkCheck, RefreshCw } from 'lucide-react';

interface Props {
  recetas: Receta[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  activeTab: 'saved' | 'mine' | 'search';
  currentFamiliarId: string;
  savedRecetasIds: string[];
  onToggleSave: (e: React.MouseEvent, id: string) => void;
  onSelectReceta: (r: Receta) => void;
  onOpenFilters: () => void;
  onGoToCreate: () => void;
  mapaCategorias: Record<string, string>;
}

export default function VistaLista({
  recetas, loading, searchQuery, setSearchQuery, activeTab,
  currentFamiliarId, savedRecetasIds, onToggleSave, onSelectReceta, onOpenFilters, onGoToCreate, mapaCategorias
}: Props) {
  return (
    <div className="absolute inset-0 flex flex-col w-full h-full">
      <header className="bg-white border-b border-gray-200/50 px-4 pt-3 pb-3 flex flex-col gap-2 shrink-0">
        <div className="text-left flex justify-between items-center w-full">
          <div>
            <span className="text-[8px] text-amber-600 font-extrabold tracking-widest uppercase block">Libro Familiar</span>
            <h1 className="text-md font-black text-gray-900 tracking-tight">Cocina Relacional</h1>
          </div>
        </div>

        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text" 
            placeholder={
              activeTab === 'search' ? "Buscar recetas de otros familiares..." : 
              activeTab === 'mine' ? "Buscar entre mis recetas..." : "Buscar en mis marcadores..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 py-1.5 bg-gray-100 rounded-full text-xs outline-none"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 flex flex-col items-stretch w-full pb-36 bg-stone-50/50">
        {loading ? (
          <div className="py-20 text-center text-gray-400"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-600" /></div>
        ) : recetas.length > 0 ? (
          recetas.map((receta) => {
            const esMia = String(receta.familiar_id) === String(currentFamiliarId);
            const estaGuardada = savedRecetasIds.includes(String(receta.id));
            return (
              <div key={receta.id} onClick={() => onSelectReceta(receta)} className="w-full bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden flex flex-col text-left shrink-0 relative transition-transform active:scale-[0.99] cursor-pointer">
                <div className="w-full h-40 bg-stone-200 relative">
                  <img src={receta.imagen_url || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500&auto=format&fit=crop&q=60"} alt={receta.titulo} className="w-full h-full object-cover"/>
                  
                  {!esMia && (
                    <button type="button" onClick={(e) => onToggleSave(e, String(receta.id))} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 shadow-md border focus:outline-none z-10">
                      {estaGuardada ? <BookmarkCheck className="w-3.5 h-3.5 text-amber-600 fill-amber-600" /> : <Bookmark className="w-3.5 h-3.5 text-stone-400" />}
                    </button>
                  )}
                </div>

                <div className="p-3.5 bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center gap-2 w-full">
                      <h3 className="font-extrabold text-stone-900 text-xs truncate flex-1">{receta.titulo}</h3>
                      <EstrellasValoracion rating={receta.valoracion_media} count={receta.num_valoraciones} />
                    </div>
                    <p className="text-[10px] text-stone-500 mt-1 line-clamp-2 italic">{receta.descripcion || 'Sin descripcion disponible.'}</p>
                    
                    {/* Visualizacion de múltiples etiquetas independientes */}
                    {receta.categorias_ids && receta.categorias_ids.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {receta.categorias_ids.map(catId => mapaCategorias[catId] && (
                          <span key={catId} className="bg-stone-100 text-stone-600 text-[8px] font-bold uppercase px-2 py-0.5 rounded-md border border-stone-200/60 tracking-wide">
                            {mapaCategorias[catId]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-stone-400 font-mono border-t border-stone-100 mt-2.5 pt-2">
                    <span className={`text-[8px] font-sans font-black px-1.5 py-0.2 rounded border ${esMia ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-stone-50 border-stone-200 text-stone-600'}`}>{esMia ? 'Tuya' : `De: ${receta.autor_nombre}`}</span>
                    <CirculosDificultad dificultad={receta.dificultad} />
                    <span className="flex items-center gap-1 font-sans text-stone-400 font-medium"><Clock className="w-2.5 h-2.5" /> {formatearMinutos(receta.tiempo_preparacion)}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center text-stone-400 text-xs font-bold w-full bg-white rounded-2xl border border-dashed p-6">
            {activeTab === 'search' && 'No hay platos disponibles de otros familiares.'}
            {activeTab === 'mine' && 'Aun no has creado ninguna receta propia.'}
            {activeTab === 'saved' && 'No tienes ninguna receta guardada en tus marcadores.'}
          </div>
        )}
      </div>

      <button onClick={onOpenFilters} className="absolute bottom-20 left-6 w-11 h-11 rounded-full flex items-center justify-center shadow-lg bg-amber-600 text-white z-10 active:scale-95 transition-transform"><SlidersHorizontal className="w-4 h-4 stroke-[2.5]" /></button>
      <button onClick={onGoToCreate} className="absolute bottom-20 right-6 w-11 h-11 bg-amber-600 hover:bg-amber-700 text-white rounded-full flex items-center justify-center shadow-lg z-10 active:scale-95 transition-transform"><Plus className="w-5 h-5 stroke-[2.5]" /></button>
    </div>
  );
}