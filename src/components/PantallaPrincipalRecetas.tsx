// src/components/PantallaPrincipalRecetas.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
   Search, 
   Plus, 
   Clock, 
   ChefHat, 
   Check, 
   RefreshCw, 
   Database, 
   ArrowLeft, 
   BookOpen,
   SlidersHorizontal,
   X,
   Star
} from 'lucide-react';
import { supabase } from '../supabaseClient';

interface Receta {
  id: string | number;
  titulo: string;
  instrucciones: string;
  tiempo_preparacion: number;
  fecha_creacion?: string;
  imagen_url?: string;
  dificultad: number;
  categoria_id?: string;
  secreto_familiar?: string;
  is_local?: boolean;
}

interface Categoria {
  id: string;
  nombre: string;
}

export default function PantallaPrincipalRecetas() {
  // --- CONTROL DE PANTALLAS Y MENÚS ---
  const [currentScreen, setCurrentScreen] = useState<'list' | 'detail' | 'create'>('list');
  const [selectedReceta, setSelectedReceta] = useState<Receta | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);

  // --- ESTADOS DE DATOS ---
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('supabase');

  // --- ESTADOS DE BÚSQUEDA Y FILTROS AVANZADOS ---
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<number[]>([]);
  const [minTime, setMinTime] = useState<number>(0);
  const [maxTime, setMaxTime] = useState<number>(180);
  const [onlyWithSecrets, setOnlyWithSecrets] = useState<boolean>(false);

  // --- ESTADOS DEL FORMULARIO (CREAR) ---
  const [tituloForm, setTituloForm] = useState<string>('');
  const [instruccionesForm, setInstruccionesForm] = useState<string>('');
  const [tiempoForm, setTiempoForm] = useState<number>(30);
  const [urlImagenForm, setUrlImagenForm] = useState<string>('');
  const [dificultadForm, setDificultadForm] = useState<number>(3);
  const [categoriaForm, setCategoriaForm] = useState<string>('');
  const [secretoForm, setSecretoForm] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Categorías Demo fijas por si Supabase no tiene registros
  const categoriasDemoFallback: Categoria[] = [
    { id: 'cat-default-1', nombre: 'Pasta y Arroz' },
    { id: 'cat-default-2', nombre: 'Guisos y Estofados' },
    { id: 'cat-default-3', nombre: 'Carnes y Pescados' },
    { id: 'cat-default-4', nombre: 'Postres y Dulces' }
  ];

  // Recetas de prueba mapeadas con las categorías del fallback
  const recetasDemoFallback: Receta[] = [
    {
      id: 'demo-1',
      titulo: 'Croquetas de Jamón de la Abuela Teresa',
      instrucciones: '1. Derretir la mantequilla y dorar la harina.\n2. Verter la leche entera caliente despacio.\n3. Añadir el jamón picado y reposar masa.',
      tiempo_preparacion: 45,
      dificultad: 4,
      secreto_familiar: 'Añadir un chorrito de caldo de cocido concentrado a la leche.',
      fecha_creacion: new Date().toISOString(),
      imagen_url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=60',
      categoria_id: 'cat-default-2',
      is_local: true
    },
    {
      id: 'demo-2',
      titulo: 'Guisado de Patatas con Costillas',
      instrucciones: '1. Sofreír cebolla, ajo y costillas.\n2. Chascar las patatas en gajos.\n3. Cubrir con caldo y vino blanco.',
      tiempo_preparacion: 65,
      dificultad: 2,
      fecha_creacion: new Date(Date.now() - 86400000).toISOString(),
      imagen_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=60',
      categoria_id: 'cat-default-2',
      is_local: true
    }
  ];

  // --- FUNCIÓN PARA FORMATEAR DURACIÓN (TIEMPO REAL) ---
  const formatearMinutos = (totalMinutos: number): string => {
    if (totalMinutos <= 0) return '0 min';
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    
    if (horas === 0) return `${minutos} min`;
    if (minutos === 0) return `${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    return `${horas}h ${minutos}m`;
  };

  // --- LEER RECETAS Y CATEGORÍAS (SUPABASE) ---
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data: databaseCats, error: errCats } = await supabase.from('categorias').select('id, nombre');
      if (errCats) throw errCats;
      
      if (databaseCats && databaseCats.length > 0) {
        setCategorias(databaseCats);
      } else {
        setCategorias(categoriasDemoFallback);
      }

      const { data: recs, error: errRecs } = await supabase
        .from('recetas')
        .select('id, titulo, instrucciones, tiempo_preparacion, fecha_creacion, imagen_url, dificultad, categoria_id, secreto_familiar')
        .order('fecha_creacion', { ascending: false });

      if (errRecs) throw errRecs;
      if (recs) {
        setRecetas(recs);
        setDataSource('supabase');
      }
    } catch (err: any) {
      console.warn('Cargando entorno demo local:', err.message);
      setErrorMsg(err.message);
      setRecetas(recetasDemoFallback);
      setCategorias(categoriasDemoFallback);
      setDataSource('local');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- COMPORTAMIENTO DE FILTROS ---
  const handleToggleCategory = (id: string) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleToggleDifficulty = (diff: number) => {
    setSelectedDifficulties(prev => 
      prev.includes(diff) ? prev.filter(d => d !== diff) : [...prev, diff]
    );
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedDifficulties([]);
    setMinTime(0);
    setMaxTime(180);
    setOnlyWithSecrets(false);
  };

  // --- MOTOR DE FILTRADO (MEMORIA COMPARTIDA) ---
  const recetasFiltradas = useMemo(() => {
    return recetas.filter(receta => {
      const coincideBusqueda = receta.titulo.toLowerCase().includes(searchQuery.toLowerCase());
      const coincideCategoria = selectedCategories.length === 0 || (receta.categoria_id && selectedCategories.includes(receta.categoria_id));
      const coincideDificultad = selectedDifficulties.length === 0 || selectedDifficulties.includes(receta.dificultad);
      const coincideTiempo = receta.tiempo_preparacion >= minTime && receta.tiempo_preparacion <= maxTime;
      const coincideSecreto = !onlyWithSecrets || (receta.secreto_familiar && receta.secreto_familiar.trim().length > 0);

      return coincideBusqueda && coincideCategoria && coincideDificultad && coincideTiempo && coincideSecreto;
    });
  }, [recetas, searchQuery, selectedCategories, selectedDifficulties, minTime, maxTime, onlyWithSecrets]);

  // --- GUARDAR RECETA ---
  const handleGuardarReceta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloForm.trim() || !instruccionesForm.trim()) {
      alert('Por favor, rellena los campos obligatorios.');
      return;
    }

    setIsSaving(true);
    try {
      if (dataSource === 'supabase' && !errorMsg) {
        const { data: fam } = await supabase.from('familiares').select('id').limit(1);
        let finalCatId = categoriaForm;

        if (!fam?.length) throw new Error('Crea un familiar en tu base de datos primero.');
        if (!finalCatId && categorias.length > 0) finalCatId = categorias[0].id;

        const { error } = await supabase
          .from('recetas')
          .insert([
            {
              titulo: tituloForm.trim(),
              instrucciones: instruccionesForm.trim(),
              tiempo_preparacion: Number(tiempoForm),
              tiempo_coccion: 0,
              imagen_url: urlImagenForm.trim() || null,
              dificultad: Number(dificultadForm),
              secreto_familiar: secretoForm.trim() || null,
              familiar_id: fam[0].id,
              categoria_id: finalCatId
            }
          ]);

        if (error) throw error;
        setSuccessToast('¡Receta guardada en Supabase!');
        await fetchData();
      } else {
        const nuevaReceta: Receta = {
          id: `local-${Date.now()}`,
          titulo: tituloForm.trim(),
          instrucciones: instruccionesForm.trim(),
          tiempo_preparacion: Number(tiempoForm),
          dificultad: Number(dificultadForm),
          secreto_familiar: secretoForm.trim() || null,
          fecha_creacion: new Date().toISOString(),
          imagen_url: urlImagenForm.trim() || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500&auto=format&fit=crop&q=60',
          categoria_id: categoriaForm || 'cat-default-1',
          is_local: true
        };
        setRecetas(prev => [nuevaReceta, ...prev]);
        setSuccessToast('¡Guardado en base de datos local!');
      }

      setTituloForm('');
      setInstruccionesForm('');
      setTiempoForm(30);
      setUrlImagenForm('');
      setSecretoForm('');
      setCurrentScreen('list');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      console.error(err);
      alert(`Error al guardar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerDetalle = (receta: Receta) => {
    setSelectedReceta(receta);
    setCurrentScreen('detail');
  };

  const obtenerFechaAmigable = (fechaStr?: string) => {
    if (!fechaStr) return 'Reciente';
    try {
      const f = new Date(fechaStr);
      return f.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch {
      return 'Reciente';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4">
      
      {/* Indicador de Estado */}
      <div className="p-3 rounded-xl border text-xs text-left flex gap-2 bg-emerald-500/5 border-emerald-500/20 text-emerald-600">
        <Database className="w-4 h-4 shrink-0" />
        <div>
          <span className="font-bold">Base de Datos: {dataSource === 'supabase' ? 'Supabase Activo' : 'Modo Demo'}</span>
        </div>
      </div>

      {successToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-mono text-xs font-bold px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-1.5">
          <Check className="w-4 h-4" />
          {successToast}
        </div>
      )}

      {/* CONTENEDOR MÓVIL SIMULADO */}
      <div className="w-full h-[640px] bg-slate-950 rounded-[40px] p-3 shadow-2xl relative overflow-hidden border-4 border-gray-800 flex flex-col">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-b-xl z-50" />
        
        <div className="w-full h-full bg-stone-50 rounded-[28px] overflow-hidden relative flex flex-col text-stone-800">
          
          {/* Status Bar */}
          <div className="h-8 shrink-0 bg-white px-5 flex justify-between items-center text-[9px] font-sans font-bold text-gray-400 border-b border-gray-100">
            <span>12:45 PM</span>
            <span className="font-mono">Wi-Fi</span>
          </div>

          <div className="flex-1 flex flex-col relative overflow-hidden">
            
            {/* --- PANTALLA PRINCIPAL (LISTADO) --- */}
            {currentScreen === 'list' && (
              <div className="absolute inset-0 flex flex-col">
                <header className="bg-white border-b border-gray-200/50 px-4 pt-3 pb-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <span className="text-[8px] text-amber-600 font-extrabold tracking-widest uppercase block">Mis Recetas</span>
                      <h1 className="text-md font-black text-gray-900 tracking-tight">Cocina Familiar</h1>
                    </div>
                    <button 
                      onClick={() => setIsFilterPanelOpen(true)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                        selectedCategories.length > 0 || selectedDifficulties.length > 0 || minTime > 0 || maxTime < 180 || onlyWithSecrets
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar receta por título..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8.5 pr-8 py-1.5 bg-gray-100 rounded-full text-xs outline-none focus:bg-white border border-transparent focus:border-amber-500/20"
                    />
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                  {loading ? (
                    <div className="h-full flex flex-col items-center justify-center py-20 text-gray-400">
                      <RefreshCw className="w-5 h-5 animate-spin text-amber-600 mb-2" />
                      <span className="text-[10px]">Cargando recetario...</span>
                    </div>
                  ) : recetasFiltradas.length > 0 ? (
                    recetasFiltradas.map((receta) => (
                      <div
                        key={receta.id}
                        onClick={() => handleVerDetalle(receta)}
                        className="bg-white border border-gray-200 rounded-2xl shadow-xs cursor-pointer overflow-hidden flex flex-col text-left"
                      >
                        <div className="w-full h-40 bg-stone-200 relative">
                          <img
                            src={receta.imagen_url || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500&auto=format&fit=crop&q=60"} 
                            alt={receta.titulo}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="p-3.5 bg-white flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-extrabold text-stone-900 text-xs tracking-tight flex-1">{receta.titulo}</h3>
                              <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-bold">
                                <Star className="w-3 h-3 fill-amber-500" />
                                {receta.dificultad}
                              </div>
                            </div>
                            <p className="text-[10px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">{receta.instrucciones}</p>
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-stone-400 font-mono border-t border-stone-100 mt-2.5 pt-2">
                            <span className="flex items-center gap-1 text-stone-700 font-bold">
                              <Clock className="w-3 h-3 text-amber-500" />
                              {formatearMinutos(receta.tiempo_preparacion)}
                            </span>
                            {receta.secreto_familiar && (
                              <span className="bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded text-[8px] font-sans font-extrabold uppercase tracking-wider">🤫 Secreto</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center text-stone-400 text-xs font-bold">
                      Ninguna receta coincide con tus filtros.
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setCurrentScreen('create')}
                  className="absolute bottom-5 right-5 w-11 h-11 bg-amber-600 hover:bg-amber-700 text-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <Plus className="w-5.5 h-5.5 stroke-[2.5]" />
                </button>

                {/* --- PANEL DE FILTROS AVANZADOS (BOTTOM SHEET) --- */}
                {isFilterPanelOpen && (
                  <div className="absolute inset-0 bg-black/40 z-50 flex flex-col justify-end">
                    <div className="w-full max-h-[85%] bg-white rounded-t-3xl p-5 overflow-y-auto flex flex-col gap-4 text-left shadow-2xl">
                      <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                        <h2 className="text-xs font-black uppercase tracking-wider text-stone-500">Filtros de Recetas</h2>
                        <button onClick={() => setIsFilterPanelOpen(false)} className="p-1 bg-stone-100 rounded-full"><X className="w-4 h-4" /></button>
                      </div>

                      {/* Filtro 1: Tipos de comida */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase text-stone-400">Tipo de Comida</label>
                        <div className="grid grid-cols-2 gap-2">
                          {categorias.map(cat => (
                            <label key={cat.id} className="flex items-center gap-2 p-2 bg-stone-50 rounded-xl border border-stone-200/60 cursor-pointer text-[10px]">
                              <input 
                                type="checkbox" 
                                checked={selectedCategories.includes(cat.id)}
                                onChange={() => handleToggleCategory(cat.id)}
                                className="accent-amber-600"
                              />
                              <span className="truncate">{cat.nombre}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Filtro 2: Dificultad */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase text-stone-400">Dificultad</label>
                        <div className="flex justify-between gap-1">
                          {[1, 2, 3, 4, 5].map(num => (
                            <label key={num} className={`flex-1 py-1.5 rounded-xl border flex flex-col items-center gap-0.5 cursor-pointer text-[10px] font-bold ${
                              selectedDifficulties.includes(num) ? 'bg-amber-50 border-amber-600 text-amber-700' : 'bg-stone-50 border-stone-200 text-stone-600'
                            }`}>
                              <input 
                                type="checkbox" 
                                checked={selectedDifficulties.includes(num)}
                                onChange={() => handleToggleDifficulty(num)}
                                className="hidden"
                              />
                              <span>{num} ⭐</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Filtro 3: Barra de tiempo doble (Horas/Minutos en tiempo real) */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] font-bold uppercase text-stone-400">Duración Estimada</label>
                          <span className="text-[9px] font-mono font-bold text-amber-600">
                            {formatearMinutos(minTime)} - {formatearMinutos(maxTime)}
                          </span>
                        </div>
                        
                        {/* Inputs numéricos manuales */}
                        <div className="flex gap-3 items-center">
                          <div className="flex-1 flex gap-1 items-center bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1">
                            <span className="text-[9px] text-stone-400 font-bold uppercase">Mín (m)</span>
                            <input 
                              type="number" 
                              min="0"
                              max="180"
                              value={minTime} 
                              onChange={(e) => setMinTime(Math.min(maxTime, Math.max(0, Number(e.target.value))))}
                              className="w-full text-right outline-none text-xs bg-transparent font-bold"
                            />
                          </div>
                          <div className="flex-1 flex gap-1 items-center bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1">
                            <span className="text-[9px] text-stone-400 font-bold uppercase">Máx (m)</span>
                            <input 
                              type="number" 
                              min="0"
                              max="180"
                              value={maxTime} 
                              onChange={(e) => setMaxTime(Math.max(minTime, Math.min(180, Number(e.target.value))))}
                              className="w-full text-right outline-none text-xs bg-transparent font-bold"
                            />
                          </div>
                        </div>

                        {/* Contenedor del Rango Doble Nativo */}
                        <div className="relative w-full h-4 mt-2 flex items-center bg-stone-100 rounded-full">
                          <input 
                            type="range" 
                            min="0" 
                            max="180" 
                            step="5"
                            value={minTime}
                            onChange={(e) => setMinTime(Math.min(maxTime, Number(e.target.value)))}
                            className="absolute w-full accent-amber-600 cursor-pointer pointer-events-auto bg-transparent appearance-none h-1 z-30"
                          />
                          <input 
                            type="range" 
                            min="0" 
                            max="180" 
                            step="5"
                            value={maxTime}
                            onChange={(e) => setMaxTime(Math.max(minTime, Number(e.target.value)))}
                            className="absolute w-full accent-amber-700 cursor-pointer pointer-events-auto bg-transparent appearance-none h-1 z-20"
                          />
                        </div>
                      </div>

                      {/* Filtro 4: Secretos de familia */}
                      <label className="flex items-center justify-between p-2.5 bg-purple-50/50 border border-purple-200/50 rounded-xl cursor-pointer mt-1">
                        <span className="text-[10px] font-extrabold text-purple-900">🤫 Mostrar solo secretos</span>
                        <input 
                          type="checkbox" 
                          checked={onlyWithSecrets}
                          onChange={(e) => setOnlyWithSecrets(e.target.checked)}
                          className="accent-purple-600 w-4 h-4"
                        />
                      </label>

                      {/* Botones */}
                      <div className="flex gap-2 border-t border-stone-100 pt-3 mt-1">
                        <button 
                          onClick={() => setIsFilterPanelOpen(false)}
                          className="flex-1 py-2 bg-amber-600 text-white text-[10px] font-bold uppercase rounded-xl text-center"
                        >
                          Aplicar Filtros
                        </button>
                        <button 
                          onClick={handleResetFilters}
                          className="px-4 py-2 bg-stone-100 text-stone-600 text-[10px] font-bold uppercase rounded-xl text-center"
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- PANTALLA DETALLE --- */}
            {currentScreen === 'detail' && selectedReceta && (
              <div className="absolute inset-0 flex flex-col bg-stone-50">
                <header className="bg-white border-b border-stone-100 px-4 py-2 flex items-center gap-2">
                  <button onClick={() => setCurrentScreen('list')} className="p-1 bg-stone-100 rounded-full"><ArrowLeft className="w-4 h-4" /></button>
                  <h2 className="text-xs font-bold text-stone-800 truncate text-left flex-1">{selectedReceta.titulo}</h2>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
                  <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-3xs">
                    <img src={selectedReceta.imagen_url || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500&auto=format&fit=crop&q=60"} alt={selectedReceta.titulo} className="w-full h-44 object-cover"/>
                    <div className="p-4">
                      <h1 className="text-xs font-black text-stone-900 leading-tight">{selectedReceta.titulo}</h1>
                      <div className="flex gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3 text-amber-500" /> {formatearMinutos(selectedReceta.tiempo_preparacion)}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                          Dificultad: {selectedReceta.dificultad}/5
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedReceta.secreto_familiar && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider block">🤫 El secreto de la receta</span>
                      <div className="bg-purple-50/40 p-4 rounded-2xl border border-purple-200/40 text-[10px] text-purple-950 italic leading-relaxed">
                        "{selectedReceta.secreto_familiar}"
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-amber-500" /> Preparación</span>
                    <div className="bg-white p-4 rounded-2xl border border-stone-200 text-[10px] text-stone-700 whitespace-pre-line leading-relaxed">
                      {selectedReceta.instrucciones}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- PANTALLA CREAR RECETA --- */}
            {currentScreen === 'create' && (
              <div className="absolute inset-0 flex flex-col bg-stone-50">
                <header className="bg-white border-b border-stone-100 px-4 py-2 flex items-center gap-2">
                  <button type="button" onClick={() => setCurrentScreen('list')} className="p-1 bg-stone-100 rounded-full"><ArrowLeft className="w-4 h-4" /></button>
                  <h2 className="text-xs font-bold text-stone-800 text-left">Nueva Receta</h2>
                </header>

                <form onSubmit={handleGuardarReceta} className="flex-1 overflow-y-auto p-4 space-y-3 text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase block">Título *</label>
                    <input type="text" required placeholder="Ej. Croquetas de jamón" value={tituloForm} onChange={(e) => setTituloForm(e.target.value)} className="w-full bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-xs outline-none focus:border-amber-600" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase block">Tiempo (Mins) *</label>
                      <input type="number" required value={tiempoForm} onChange={(e) => setTiempoForm(Number(e.target.value))} className="w-full bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-xs outline-none focus:border-amber-600" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase block">Dificultad (1-5) *</label>
                      <select value={dificultadForm} onChange={(e) => setDificultadForm(Number(e.target.value))} className="w-full bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-xs outline-none focus:border-amber-600">
                        {[1,2,3,4,5].map(num => <option key={num} value={num}>{num} {num===1?'Estrella': 'Estrellas'}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase block">Categoría de Comida</label>
                    <select value={categoriaForm} onChange={(e) => setCategoriaForm(e.target.value)} className="w-full bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-xs outline-none focus:border-amber-600">
                      <option value="">Selecciona una categoría...</option>
                      {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase block">URL de la Imagen</label>
                    <input type="url" placeholder="https://enlace-foto.com/imagen.jpg" value={urlImagenForm} onChange={(e) => setUrlImagenForm(e.target.value)} className="w-full bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-xs outline-none focus:border-amber-600" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-purple-400 uppercase block">🤫 Secreto Familiar (Opcional)</label>
                    <input type="text" placeholder="El truco que nadie sabe..." value={secretoForm} onChange={(e) => setSecretoForm(e.target.value)} className="w-full bg-white border border-purple-200 px-3 py-1.5 rounded-lg text-xs outline-none focus:border-purple-600" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase block">Instrucciones *</label>
                    <textarea rows={3} required placeholder="Paso a paso..." value={instruccionesForm} onChange={(e) => setInstruccionesForm(e.target.value)} className="w-full bg-white border border-stone-200 px-3 py-2 rounded-lg text-[10px] outline-none focus:border-amber-600 resize-none leading-relaxed" />
                  </div>
                </form>

                <div className="p-3 bg-white border-t border-stone-100 flex gap-2">
                  <button type="button" onClick={handleGuardarReceta} disabled={isSaving} className="flex-1 py-2 bg-amber-600 text-white font-bold text-[10px] uppercase font-mono rounded-lg flex items-center justify-center gap-1">
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Guardar Receta
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}