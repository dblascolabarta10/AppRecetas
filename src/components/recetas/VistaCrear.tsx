// src/components/recetas/VistaCrear.tsx
import React from 'react';
import { ArrowLeft, Layers, Plus, Upload, Check, RefreshCw } from 'lucide-react';
import { Categoria } from '../../types/recetas';

interface Props {
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  tituloForm: string; setTituloForm: (s: string) => void;
  descripcionForm: string; setDescripcionForm: (s: string) => void;
  esPrivadaForm: boolean; setEsPrivadaForm: (b: boolean) => void;
  secretoForm: string; setSecretoForm: (s: string) => void;
  tiempoHorasForm: number; setTiempoHorasForm: (n: number) => void;
  tiempoMinutosForm: number; setTiempoMinutosForm: (n: number) => void;
  dificultadForm: number; setDificultadForm: (n: number) => void;
  categorias: Categoria[];
  categoriasFormMúltiples: string[];
  onToggleFormCategory: (id: string) => void;
  ingredientesListForm: string[];
  handleIngredientChange: (i: number, s: string) => void;
  addIngredientField: () => void;
  pasosListForm: string[];
  handlePasoChange: (i: number, s: string) => void;
  addPasoField: () => void;
  imagenPreview: string | null;
  handleImagenChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSaving: boolean;
  obtenerColorCirculo: (n: number) => string;
}

export default function VistaCrear({
  onBack, onSubmit, tituloForm, setTituloForm, descripcionForm, setDescripcionForm,
  esPrivadaForm, setEsPrivadaForm, secretoForm, setSecretoForm, tiempoHorasForm, setTiempoHorasForm,
  tiempoMinutosForm, setTiempoMinutosForm, dificultadForm, setDificultadForm, categorias,
  categoriasFormMúltiples, onToggleFormCategory, ingredientesListForm, handleIngredientChange,
  addIngredientField, pasosListForm, handlePasoChange, addPasoField, imagenPreview, handleImagenChange, isSaving, obtenerColorCirculo
}: Props) {
  return (
    <div className="absolute inset-0 flex flex-col bg-stone-50 w-full">
      <header className="bg-white border-b border-stone-100 px-4 py-2 flex items-center gap-2 shrink-0">
        <button type="button" onClick={onBack} className="p-1 bg-stone-100 rounded-full"><ArrowLeft className="w-4 h-4" /></button>
        <h2 className="text-xs font-bold text-stone-800 text-left">Nueva Receta</h2>
      </header>

      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-left w-full flex flex-col items-stretch pb-12">
        <input type="text" required placeholder="Título del plato *" value={tituloForm} onChange={(e) => setTituloForm(e.target.value)} className="w-full bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-xs outline-none shadow-3xs" />
        <input type="text" placeholder="Descripción / Introducción" value={descripcionForm} onChange={(e) => setDescripcionForm(e.target.value)} className="w-full bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-xs outline-none shadow-3xs" />

        <div className="flex gap-2 bg-white p-2 rounded-xl border border-stone-200 shadow-3xs">
          <button type="button" onClick={() => setEsPrivadaForm(false)} className={`flex-1 py-1 text-[9px] font-bold rounded uppercase ${!esPrivadaForm ? 'bg-emerald-600 text-white' : 'bg-stone-50 text-stone-500'}`}>Pública</button>
          <button type="button" onClick={() => setEsPrivadaForm(true)} className={`flex-1 py-1 text-[9px] font-bold rounded uppercase ${esPrivadaForm ? 'bg-red-600 text-white' : 'bg-stone-50 text-stone-500'}`}>Privada</button>
        </div>

        <input type="text" placeholder="Secreto familiar (Opcional)" value={secretoForm} onChange={(e) => setSecretoForm(e.target.value)} className="w-full bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-xs outline-none shadow-3xs font-mono text-amber-900" />

        <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-stone-200 shadow-3xs">
          <div className="flex items-center gap-2">
            <input type="number" min="0" value={tiempoHorasForm} onChange={(e) => setTiempoHorasForm(Math.max(0, Number(e.target.value)))} className="w-12 text-center bg-stone-50 border p-1 rounded font-mono text-xs outline-none" />
            <span className="text-[10px] text-stone-500 font-bold uppercase">Horas</span>
          </div>
          <div className="flex items-center gap-2 border-l pl-3 border-stone-100">
            <input type="number" min="0" max="59" value={tiempoMinutosForm} onChange={(e) => setTiempoMinutosForm(Math.max(0, Math.min(59, Number(e.target.value))))} className="w-12 text-center bg-stone-50 border p-1 rounded font-mono text-xs outline-none" />
            <span className="text-[10px] text-stone-500 font-bold uppercase">Mins</span>
          </div>
        </div>

        {/* Dificultad */}
        <div className="flex flex-col gap-1 bg-white p-2 rounded-xl border border-stone-200 shadow-3xs">
          {[1, 2, 3, 4, 5].map((num) => (
            <button key={num} type="button" onClick={() => setDificultadForm(num)} className={`flex items-center justify-between p-2 rounded-lg text-[10px] font-extrabold uppercase border ${dificultadForm === num ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 text-stone-600'}`}>
              <span>Nivel {num}</span>
              <div className="flex gap-1">{Array.from({ length: num }).map((_, i) => <span key={i} className={`w-2 h-2 rounded-full ${obtenerColorCirculo(num)}`} />)}</div>
            </button>
          ))}
        </div>

        {/* Categorías */}
        <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-3xs flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
          {categorias.map(c => (
            <button key={c.id} type="button" onClick={() => onToggleFormCategory(c.id)} className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border flex items-center gap-1 ${categoriasFormMúltiples.includes(c.id) ? 'bg-amber-600 text-white border-amber-600' : 'bg-stone-50 text-stone-500'}`}><Layers className="w-2.5 h-2.5" /> {c.nombre}</button>
          ))}
        </div>

        {/* Ingredientes */}
        <div className="space-y-2">
          {ingredientesListForm.map((ing, index) => (
            <div key={index} className="flex items-center gap-2 w-full">
              <span className="text-xs font-mono font-bold text-stone-400 w-3">-</span>
              <input type="text" placeholder={`Ingrediente ${index + 1}`} value={ing} onChange={(e) => handleIngredientChange(index, e.target.value)} className="flex-1 bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-xs outline-none" />
            </div>
          ))}
          {ingredientesListForm.length < 15 && <button type="button" onClick={addIngredientField} className="w-full bg-white border border-stone-200 rounded-lg text-stone-400 flex items-center justify-center h-[32px]"><Plus className="w-4 h-4 stroke-[3]" /></button>}
        </div>

        {/* Pasos */}
        <div className="space-y-2">
          {pasosListForm.map((paso, index) => (
            <div key={index} className="flex items-center gap-2 w-full">
              <span className="text-xs font-mono font-bold text-stone-400 w-4 text-right">{index + 1}.</span>
              <input type="text" placeholder={`Paso ${index + 1}`} value={paso} onChange={(e) => handlePasoChange(index, e.target.value)} className="flex-1 bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-xs outline-none" />
            </div>
          ))}
          {pasosListForm.length < 15 && <button type="button" onClick={addPasoField} className="w-full bg-white border border-stone-200 rounded-lg text-stone-400 flex items-center justify-center h-[32px]"><Plus className="w-4 h-4 stroke-[3]" /></button>}
        </div>

        {/* Foto */}
        <div className="bg-white rounded-xl border border-stone-200 p-3 flex flex-col items-center justify-center min-h-[110px]">
          {imagenPreview ? (
            <div className="w-full flex flex-col items-center gap-2">
              <img src={imagenPreview} alt="Preview" className="w-full h-28 object-cover rounded-lg border" />
              <label className="text-[8px] font-black text-amber-600 border bg-amber-50 px-2 py-0.5 rounded cursor-pointer uppercase">Cambiar<input type="file" accept="image/*" onChange={handleImagenChange} className="hidden" /></label>
            </div>
          ) : (
            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer py-4">
              <Upload className="w-6 h-6 text-stone-400 animate-bounce" />
              <span className="text-[9px] text-stone-500 font-extrabold mt-1.5 uppercase">Cargar de galería</span>
              <input type="file" accept="image/*" onChange={handleImagenChange} className="hidden" />
            </label>
          )}
        </div>
      </form>

      <div className="p-3 bg-white border-t border-stone-100 flex gap-2 shrink-0 z-10">
        <button type="submit" onClick={onSubmit} disabled={isSaving} className="w-full py-2 bg-amber-600 text-white font-bold text-[10px] uppercase font-mono rounded-lg flex items-center justify-center gap-1">
          {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Guardar Receta Real
        </button>
      </div>
    </div>
  );
}