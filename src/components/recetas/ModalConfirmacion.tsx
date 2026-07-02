// src/components/recetas/ModalConfirmacion.tsx
import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titulo: string;
  mensaje: string;
  tipo?: 'danger' | 'warning';
}

export default function ModalConfirmacion({ isOpen, onClose, onConfirm, titulo, mensaje, tipo = 'warning' }: Props) {
  if (!isOpen) return null;

  const esPeligro = tipo === 'danger';

  return (
    <div 
      onClick={onClose} 
      className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-5 animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="w-full max-w-xs bg-white rounded-3xl border border-stone-200/80 p-5 shadow-2xl flex flex-col text-center space-y-4"
      >
        {/* Cabecera con icono dinámico */}
        <div className="flex justify-center">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs ${
            esPeligro 
              ? 'bg-red-50 border-red-200 text-red-600' 
              : 'bg-amber-50 border-amber-200 text-amber-600'
          }`}>
            {esPeligro ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
        </div>

        {/* Textos explicativos */}
        <div className="space-y-1">
          <h3 className="text-xs font-black text-stone-900 uppercase tracking-tight">{titulo}</h3>
          <p className="text-[10px] text-stone-500 font-medium leading-relaxed px-2">{mensaje}</p>
        </div>

        {/* Botones de accion estilizados */}
        <div className="flex gap-2 pt-1">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-mono font-black uppercase rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            onClick={() => { onConfirm(); onClose(); }} 
            className={`flex-1 py-2 text-white text-[10px] font-mono font-black uppercase rounded-xl shadow-md transition-all active:scale-98 cursor-pointer ${
              esPeligro ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}