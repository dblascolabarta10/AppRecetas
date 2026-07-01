// src/components/recetas/VistaDetalle.tsx
import React, { useState } from 'react';
import { ArrowLeft, Clock, Utensils, BookOpen, ChefHat, Send, Star } from 'lucide-react';
import { Receta, ComentarioFamiliar } from '../../types/recetas';
import { formatearMinutos, obtenerTiempoRelativo } from '../../utils/recetasHelpers';
import EstrellasValoracion from './EstrellasValoracion';
import CirculosDificultad from './CirculosDificultad';

interface Props {
  receta: Receta;
  comentarios: ComentarioFamiliar[];
  onBack: () => void;
  mapaCategorias: Record<string, string>;
  currentFamiliarId: string;
  onAñadirComentario: (puntuacion: number, comentario: string) => Promise<void>;
  renderEstrellasComentario: (n: number) => React.ReactNode;
}

export default function VistaDetalle({ 
  receta, comentarios, onBack, mapaCategorias, currentFamiliarId, onAñadirComentario, renderEstrellasComentario 
}: Props) {
  const pasos = receta.instrucciones.split('\n').map(p => p.replace(/^\d+\.\s?/, '').trim()).filter(p => p.length > 1);

  // Estados locales para la nueva reseña interactiva
  const [inputRating, setInputRating] = useState<number>(5);
  const [inputComentario, setInputComentario] = useState<string>('');
  const [enviando, setEnviando] = useState<boolean>(false);

  const esMia = String(receta.familiar_id) === String(currentFamiliarId);

  const handleEnviarReseña = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    await onAñadirComentario(inputRating, inputComentario);
    setInputComentario('');
    setInputRating(5);
    setEnviando(false);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-stone-50 w-full h-full">
      <header className="bg-white border-b border-stone-100 px-4 py-2 flex items-center gap-2 shrink-0">
        <button onClick={onBack} className="p-1 bg-stone-100 rounded-full"><ArrowLeft className="w-4 h-4" /></button>
        <h2 className="text-xs font-bold text-stone-800 truncate text-left flex-1">{receta.titulo}</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left w-full flex flex-col pb-16">
        <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-3xs shrink-0">
          <img src={receta.imagen_url || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500&auto=format&fit=crop&q=60"} alt={receta.titulo} className="w-full h-44 object-cover"/>
          <div className="p-4 space-y-2">
            <div className="flex justify-between items-start gap-2">
              <h1 className="text-xs font-black text-stone-900 leading-tight flex-1">{receta.titulo}</h1>
              <span className="text-[8px] font-mono font-bold bg-stone-100 border text-stone-500 px-2 py-0.5 rounded-md uppercase">{obtenerTiempoRelativo(receta.fecha_creacion)}</span>
            </div>
            <div className="flex justify-between items-center w-full text-[9px] font-bold text-stone-500">
              <span>Autor: {receta.autor_nombre}</span>
            </div>
            <div className="flex flex-col gap-1.5 border-t pt-2 mt-1">
              <div className="flex items-center justify-between w-full">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-stone-700"><Clock className="w-3 h-3 text-amber-500" /> {formatearMinutos(receta.tiempo_preparacion)}</span>
                <EstrellasValoracion rating={receta.valoracion_media} count={receta.num_valoraciones} />
              </div>
              <div className="flex items-center justify-between w-full border-t pt-1.5"><span className="text-stone-400 text-[7px] tracking-wide uppercase">Complejidad:</span><CirculosDificultad dificultad={receta.dificultad} /></div>
            </div>
          </div>
        </div>

        {receta.descripcion && <div className="w-full bg-white px-4 py-3 rounded-2xl border border-stone-200 text-[10px] text-stone-600 italic">"{receta.descripcion}"</div>}

        {receta.secreto_familiar && (
          <div className="space-y-1 w-full shrink-0">
            <span className="text-[9px] font-bold text-amber-700 uppercase block">🤫 Secreto Familiar Oculto</span>
            <div className="w-full bg-amber-50/60 p-3 rounded-2xl border border-amber-200 text-[10px] text-amber-900 shadow-3xs font-mono">{receta.secreto_familiar}</div>
          </div>
        )}

        <div className="space-y-1 w-full shrink-0">
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1"><Utensils className="w-3 h-3 text-amber-500" /> 🛒 Ingredientes</span>
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200 text-[10px] text-stone-800 shadow-3xs font-medium w-full whitespace-pre-wrap leading-relaxed">{receta.ingredientes_lista}</div>
        </div>

        <div className="space-y-1 w-full shrink-0">
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-amber-500" /> Elaboración</span>
          <div className="space-y-2.5 w-full">
            {pasos.map((paso, i) => (
              <div key={i} className="w-full bg-white p-3 rounded-xl border border-stone-200 flex gap-3 shadow-3xs items-start">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-[10px] text-stone-700 leading-relaxed flex-1">{paso}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sección de Anécdotas */}
        <div className="space-y-1.5 w-full shrink-0 pt-2">
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">💬 Anécdotas de la Familia</span>
          
          {/*  FORMULARIO INTERACTIVO PARA RESEÑAR RECETAS AJENAS */}
          {!esMia && (
            <form onSubmit={handleEnviarReseña} className="bg-amber-50/40 p-3 rounded-2xl border border-amber-200/50 flex flex-col gap-2.5 w-full shadow-3xs">
              <div className="flex justify-between items-center w-full">
                <span className="text-[9px] font-black uppercase text-amber-800 tracking-wide">Dejar nota o valoración:</span>
                
                {/* Selector táctil por estrellas */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      type="button" key={num} onClick={() => setInputRating(num)}
                      className="focus:outline-none transition-transform active:scale-90"
                    >
                      <Star className={`w-3.5 h-3.5 ${num <= inputRating ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-1.5 items-center w-full">
                <input
                  type="text" required placeholder="Ej: ¡Me quedó cremosísimo, tía! Añadí un..."
                  value={inputComentario} onChange={(e) => setInputComentario(e.target.value)}
                  className="flex-1 bg-white border border-stone-200 px-3 py-1.5 rounded-xl text-[10px] outline-none shadow-3xs"
                />
                <button
                  type="submit" disabled={enviando}
                  className="p-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2 w-full pt-1">
            {comentarios.length > 0 ? (
              comentarios.map((com) => (
                <div key={com.id} className="bg-white p-3 rounded-2xl border border-stone-200 shadow-3xs flex flex-col gap-1 w-full">
                  <div className="flex justify-between items-center w-full border-b border-stone-50 pb-1.5">
                    <span className="font-extrabold text-stone-900 text-[10px] flex items-center gap-1"><ChefHat className="w-3 h-3 text-amber-500" />{com.familiares?.nombre}</span>
                    <div className="flex items-center gap-1 text-[8px] font-mono text-stone-400">{renderEstrellasComentario(com.puntuacion)}<span>({obtenerTiempoRelativo(com.fecha_creacion)})</span></div>
                  </div>
                  <p className="text-[10px] text-stone-600 font-sans leading-relaxed italic bg-stone-50/40 p-2 rounded-xl border border-stone-100 mt-1">"{com.comentario}"</p>
                </div>
              ))
            ) : (
              <div className="bg-white p-4 rounded-2xl border border-stone-200 text-center text-[9px] text-stone-400 italic w-full">Nadie ha comentado todavía.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}