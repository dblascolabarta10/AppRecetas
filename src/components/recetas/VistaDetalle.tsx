// src/components/recetas/VistaDetalle.tsx
import React, { useState } from 'react';
import { ArrowLeft, Clock, Utensils, BookOpen, ChefHat, Send, Star, Trash2, Share2, FileText } from 'lucide-react';
import { Receta, ComentarioFamiliar } from '../../types/recetas';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core'; 
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
  onBorrarReceta: (id: string) => Promise<void>;
  renderEstrellasComentario: (n: number) => React.ReactNode;
}

export default function VistaDetalle({ 
  receta, comentarios, onBack, mapaCategorias, currentFamiliarId, onAñadirComentario, onBorrarReceta, renderEstrellasComentario 
}: Props) {
  
  const rawInstrucciones = receta.instrucciones || '';
  let ingredientesTexto = 'Sin ingredientes especificados.';
  let pasosArray: string[] = [];

  if (rawInstrucciones.includes('[PASOS]')) {
    const partesPasos = rawInstrucciones.split('[PASOS]');
    const bloquePasos = partesPasos[1] || '';
    pasosArray = bloquePasos.split('\n').map(p => p.replace(/^\d+\.\s?/, '').trim()).filter(p => p.length > 0);
    
    const bloquePrevio = partesPasos[0];
    if (bloquePrevio.includes('[INGREDIENTES]')) {
      ingredientesTexto = bloquePrevio.split('[INGREDIENTES]')[1].trim();
    }
  } else {
    pasosArray = rawInstrucciones.split('\n').map(p => p.trim()).filter(p => p.length > 0);
  }

  const [inputRating, setInputRating] = useState<number>(5);
  const [inputComentario, setInputComentario] = useState<string>('');
  const [enviando, setEnviando] = useState<boolean>(false);

  const esMia = String(receta.familiar_id) === String(currentFamiliarId);

  // FUNCION: Compartir texto estructurado en Apps nativas (WhatsApp, etc)
  const handleCompartirTexto = async () => {
  const listadoPasos = pasosArray.map((p, i) => `${i + 1}. ${p}`).join('\n');
  const categoriasNombres = receta.categorias_ids
    ? receta.categorias_ids.map(id => mapaCategorias[id]).filter(Boolean).join(', ')
    : '';

  const textoCompartir = `RECETA FAMILIAR: ${receta.titulo.toUpperCase()}\n` +
    `${receta.descripcion ? `"${receta.descripcion}"\n` : ''}\n` +
    `Autor: ${receta.autor_nombre}\n` +
    `Tiempo: ${formatearMinutos(receta.tiempo_preparacion)}\n` +
    `${categoriasNombres ? `Categorias: ${categoriasNombres}\n` : ''}\n` +
    `INGREDIENTES:\n${ingredientesTexto}\n\n` +
    `ELABORACION:\n${listadoPasos}`;

  try {
    await Share.share({
      title: receta.titulo,
      text: textoCompartir,
      dialogTitle: 'Compartir receta familiar'
    });
  } catch (err) {
    console.log('Error al invocar el menu de comparticion movil', err);
  }
};

  // FUNCION: Exportacion limpia a PDF usando el motor de impresion del dispositivo móvil
  // Reescritura definitiva de la funcion con el plugin real
  const handleExportarPDF = async () => {
    // Creamos el bloque HTML limpio con estilos basicos para el PDF
    const estructuraCuerpo = document.querySelector('.printable-area')?.innerHTML || '';
    
    const documentoCompletoHtml = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: sans-serif; color: #1c1917; padding: 24px; background: white; }
            .no-print { display: none !important; }
            img { width: 100%; max-height: 220px; object-fit: cover; border-radius: 16px; margin-bottom: 12px; }
            h1 { font-size: 20px; font-weight: 900; margin-top: 0; }
            .bg-white { background: white; padding: 12px; border: 1px solid #e7e5e4; border-radius: 16px; }
            .whitespace-pre-wrap { white-space: pre-wrap; }
            .italic { font-style: italic; }
            .space-y-4 > * { margin-bottom: 16px; }
            .rounded-xl { border-radius: 12px; border: 1px solid #e7e5e4; padding: 10px; display: flex; gap: 10px; }
            .rounded-full { width: 20px; height: 20px; background: #d97706; color: white; border-radius: 50%; display: inline-flex; items-center justify-center; font-size: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          ${estructuraCuerpo}
        </body>
      </html>
    `;

    if (Capacitor.isNativePlatform()) {
      // Accedemos al objeto global de Cordova que inyecta el plugin en el movil
      const pluginImpresion = (window as any).cordova?.plugins?.printer;

      if (pluginImpresion) {
        // Ejecuta la orden de impresion nativa pasando el HTML estructurado
        pluginImpresion.print(documentoCompletoHtml);
      } else {
        alert('El plugin de impresion no se ha inicializado correctamente en el dispositivo.');
      }
    } else {
      // Si estas probando en la web del PC, sigue usando el comando del navegador
      window.print();
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-stone-50 w-full h-full printable-area">
      
      {/* Estilos CSS inline especificos para la exportacion a PDF mediante impresion */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            color: black;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <header className="bg-white border-b border-stone-100 px-4 py-2 flex items-center gap-2 shrink-0 no-print">
        <button onClick={onBack} className="p-1 bg-stone-100 rounded-full"><ArrowLeft className="w-4 h-4" /></button>
        <h2 className="text-xs font-bold text-stone-800 truncate text-left flex-1">{receta.titulo}</h2>
        
        {/* Boton para compartir por WhatsApp u otras Apps móviles */}
        <button 
          onClick={handleCompartirTexto}
          className="p-1.5 bg-stone-100 text-stone-600 rounded-full hover:bg-stone-200 transition-colors focus:outline-none"
          title="Compartir receta"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

        {/* Boton para exportar a PDF de forma nativa */}
        <button 
          onClick={handleExportarPDF}
          className="p-1.5 bg-stone-100 text-stone-600 rounded-full hover:bg-stone-200 transition-colors focus:outline-none"
          title="Exportar a PDF"
        >
          <FileText className="w-3.5 h-3.5" />
        </button>

        {esMia && (
          <button 
            onClick={() => onBorrarReceta(String(receta.id))} 
            className="p-1.5 bg-red-50 text-red-600 rounded-full border border-red-200 hover:bg-red-100 transition-colors focus:outline-none"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left w-full flex flex-col pb-16">
        <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-3xs shrink-0 p-4 space-y-3">
          <img src={receta.imagen_url || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500&auto=format&fit=crop&q=60"} alt={receta.titulo} className="w-full h-44 object-cover rounded-xl"/>
          
          <div className="space-y-2">
            <div className="flex justify-between items-start gap-2">
              <h1 className="text-xs font-black text-stone-900 leading-tight flex-1">{receta.titulo}</h1>
              <span className="text-[8px] font-mono font-bold bg-stone-100 border text-stone-500 px-2 py-0.5 rounded-md uppercase">{obtenerTiempoRelativo(receta.fecha_creacion)}</span>
            </div>
            
            <div className="text-[9px] font-bold text-stone-500">
              <span>Autor: {receta.autor_nombre}</span>
            </div>

            {receta.categorias_ids && receta.categorias_ids.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {receta.categorias_ids.map(catId => mapaCategorias[catId] && (
                  <span key={catId} className="bg-stone-100 text-stone-600 text-[9px] font-bold uppercase px-2.5 py-1 rounded-lg border border-stone-200">
                    {mapaCategorias[catId]}
                  </span>
                ))}
              </div>
            )}

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
            <span className="text-[9px] font-bold text-amber-700 uppercase block">Secreto Familiar Oculto</span>
            <div className="w-full bg-amber-50/60 p-3 rounded-2xl border border-amber-200 text-[10px] text-amber-900 shadow-3xs font-mono">{receta.secreto_familiar}</div>
          </div>
        )}

        <div className="space-y-1 w-full shrink-0">
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1"><Utensils className="w-3 h-3 text-amber-500" /> Ingredientes</span>
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200 text-[10px] text-stone-800 shadow-3xs font-medium w-full whitespace-pre-wrap leading-relaxed">{ingredientesTexto}</div>
        </div>

        <div className="space-y-1 w-full shrink-0">
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-amber-500" /> Elaboracion</span>
          <div className="space-y-2.5 w-full">
            {pasosArray.length > 0 ? (
              pasosArray.map((paso, i) => (
                <div key={i} className="w-full bg-white p-3 rounded-xl border border-stone-200 flex gap-3 shadow-3xs items-start">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-[10px] text-stone-700 leading-relaxed flex-1">{paso}</p>
                </div>
              ))
            ) : (
              <div className="bg-white p-4 rounded-2xl border border-stone-200 text-center text-[9px] text-stone-400 italic w-full">Sin pasos registrados.</div>
            )}
          </div>
        </div>

        {/* Formulario de comentarios y listado de anecdotas marcado como 'no-print' */}
        <div className="space-y-1.5 w-full shrink-0 pt-2 no-print">
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Anécdotas de la Familia</span>
          
          {!esMia && (
            <form onSubmit={handleEnviarReseña} className="bg-amber-50/40 p-3 rounded-2xl border border-amber-200/50 flex flex-col gap-2.5 w-full shadow-3xs">
              <div className="flex justify-between items-center w-full">
                <span className="text-[9px] font-black uppercase text-amber-800 tracking-wide">Dejar nota o valoracion:</span>
                
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
                  type="text" required placeholder="Ej: Me quedo cremosisimo, tia! Anade un..."
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
              <div className="bg-white p-4 rounded-2xl border border-stone-200 text-center text-[9px] text-stone-400 italic w-full">Nadie ha comentado todavia.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}