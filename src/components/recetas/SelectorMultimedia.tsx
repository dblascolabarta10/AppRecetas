import React, { ChangeEvent } from 'react';
import { Image, Video, X } from 'lucide-react';

interface ArchivoSubido {
  file: File;
  tipo: 'foto' | 'video';
  previewUrl: string;
}

interface Props {
  archivos: ArchivoSubido[];
  setArchivos: React.Dispatch<React.SetStateAction<ArchivoSubido[]>>;
}

export default function SelectorMultimedia({ archivos, setArchivos }: Props) {
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const listaArchivos = Array.from(e.target.files);
    
    // Validación del límite máximo de 5 archivos en total
    if (archivos.length + listaArchivos.length > 5) {
      alert('Solo puedes añadir un máximo de 5 archivos multimedia por receta.');
      return;
    }

    const nuevosArchivos: ArchivoSubido[] = listaArchivos.map((file) => {
      const esVideo = file.type.startsWith('video/');
      return {
        file,
        tipo: esVideo ? 'video' : 'foto', // ¡Corregido aquí para que clasifique bien!
        previewUrl: URL.createObjectURL(file) 
      };
    });

    setArchivos((prev) => [...prev, ...nuevosArchivos]);
  };

  const handleEliminarArchivo = (indexId: number) => {
    setArchivos((prev) => {
      const filtrados = prev.filter((_, i) => i !== indexId);
      URL.revokeObjectURL(prev[indexId].previewUrl);
      return filtrados;
    });
  };

  return (
    <div className="space-y-2 text-left bg-white p-4 rounded-2xl border border-stone-200 shadow-3xs">
      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
        Tutoriales y Fotos Adicionales (Máximo 5)
      </span>

      {/* Miniaturas de los archivos seleccionados actualmente */}
      {archivos.length > 0 && (
        <div className="grid grid-cols-5 gap-2 pt-1">
          {archivos.map((item, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
              {item.tipo === 'foto' ? (
                <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-stone-900 text-white">
                  <Video className="w-4 h-4" />
                </div>
              )}
              
              <button
                type="button"
                onClick={() => handleEliminarArchivo(i)}
                className="absolute top-1 right-1 p-0.5 bg-black/70 text-white rounded-full hover:bg-black"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botón nativo oculto */}
      {archivos.length < 5 && (
        <label className="flex items-center justify-center gap-2 w-full border border-dashed border-stone-300 rounded-xl py-3 px-4 bg-stone-50/50 cursor-pointer hover:bg-stone-50 transition-colors">
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Image className="w-4 h-4 text-stone-400" />
          <span className="text-[10px] font-bold text-stone-600">Añadir fotos o vídeos</span>
        </label>
      )}
    </div>
  );
}