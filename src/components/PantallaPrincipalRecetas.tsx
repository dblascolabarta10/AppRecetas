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
   Star,
   Layers,
   Utensils
} from 'lucide-react';
import { supabase } from '../supabaseClient';

interface IngredienteRelacion {
  cantidad: number;
  unidad_medida: string;
  nombre_ingrediente: string;
}

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
  ingredientes_lista?: string; 
  receta_ingredientes?: IngredienteRelacion[];
  categorias?: { nombre: string }; 
  is_local?: boolean;
}

interface Categoria {
  id: string;
  nombre: string;
}

export default function PantallaPrincipalRecetas() {
  // --- CONTROL DE PANTALLAS ---
  const [currentScreen, setCurrentScreen] = useState<'list' | 'detail' | 'create'>('list');
  const [selectedReceta, setSelectedReceta] = useState<Receta | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);

  // --- ESTADOS DE DATOS ---
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('supabase');

  // --- ESTADOS DE FILTROS ---
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<number[]>([]);
  const [minTime, setMinTime] = useState<number>(0);
  const [maxTime, setMaxTime] = useState<number>(180);
  const [onlyWithSecrets, setOnlyWithSecrets] = useState<boolean>(false);

  // --- ESTADOS DEL FORMULARIO ---
  const [tituloForm, setTituloForm] = useState<string>('');
  const [instruccionesForm, setInstruccionesForm] = useState<string>('');
  const [ingredientesForm, setIngredientesForm] = useState<string>('');
  const [tiempoForm, setTiempoForm] = useState<number>(30);
  const [urlImagenForm, setUrlImagenForm] = useState<string>('');
  const [dificultadForm, setDificultadForm] = useState<number>(3);
  const [categoriaForm, setCategoriaForm] = useState<string>('');
  const [secretoForm, setSecretoForm] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Fallbacks locales consistentes por si la base de datos está vacía
  const fallbackCategorias: Categoria[] = [
    { id: 'demo-cat-1', nombre: 'Pasta y Arroz' },
    { id: 'demo-cat-2', nombre: 'Guisos y Estofados' }
  ];

  const fallbackRecetas: Receta[] = [
    {
      id: 'demo-rec-1',
      titulo: 'Croquetas de Jamón de la Abuela',
      ingredientes_lista: '• 200g de Jamón Ibérico picado\n• 1 Litro de Leche entera\n• 90g de Harina\n• 90g de Mantequilla',
      instrucciones: 'Derretir la mantequilla en una sartén. Dorar la harina para la roux. Verter la leche entera caliente despacio sin dejar de batir. Añadir el jamón picado y dejar reposar la masa.',
      tiempo_preparacion: 45,
      dificultad: 4,
      secreto_familiar: 'Añadir un toque de caldo de cocido concentrado.',
      categoria_id: 'demo-cat-2',
      receta_ingredientes: [
        { cantidad: 200, unidad_medida: 'gramos', nombre_ingrediente: 'Jamón Ibérico' },
        { cantidad: 1, unidad_medida: 'litro', nombre_ingrediente: 'Leche entera' }
      ],
      is_local: true
    }
  ];

  const formatearMinutos = (totalMinutos: number): string => {
    if (totalMinutos <= 0) return '0 min';
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    if (horas === 0) return `${minutos} min`;
    if (minutos === 0) return `${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    return `${horas}h ${minutos}m`;
  };

  const renderEstrellas = (dificultad: number) => {
    return (
      <div className="flex items-center gap-0.5 shrink-0">
        {[1, 2, 3, 4, 5].map((num) => (
          <Star 
            key={num} 
            className={`w-3 h-3 ${num <= dificultad ? 'fill-amber-500 text-amber-500' : 'text-stone-300'}`} 
          />
        ))}
      </div>
    );
  };

  // --- LEER DE BASE DE DATOS CON JOINS REALES ---
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Recoger las categorías de tu base de datos real
      const { data: dbCats } = await supabase.from('categorias').select('id, nombre');
      
      // Si Supabase devuelve categorías, las usamos, si no, metemos el fallback controlado
      if (dbCats && dbCats.length > 0) {
        setCategorias(dbCats);
      } else {
        setCategorias(fallbackCategorias);
      }

      // 2. Consulta relacional explícita cruzando ingredientes y categorías
      const { data: recs, error } = await supabase
        .from('recetas')
        .select(`
          id, titulo, instrucciones, tiempo_preparacion, fecha_creacion, imagen_url, dificultad, categoria_id, secreto_familiar,
          receta_ingredientes (
            cantidad,
            unidad_medida,
            ingredientes ( nombre )
          ),
          categorias ( nombre )
        `)
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;

      if (recs) {
        const mapeadas = recs.map((r: any) => {
          const ingRelacionales = r.receta_ingredientes?.map((ri: any) => {
            let nombreInyectado = 'Ingrediente';
            const fuenteIngrediente = ri.ingredientes || ri.ingrediente;
            if (fuenteIngrediente) {
              if (Array.isArray(fuenteIngrediente)) {
                nombreInyectado = fuenteIngrediente[0]?.nombre || 'Ingrediente';
              } else if (typeof fuenteIngrediente === 'object') {
                nombreInyectado = fuenteIngrediente.nombre || 'Ingrediente';
              }
            }
            return {
              cantidad: Number(ri.cantidad || 0),
              unidad_medida: ri.unidad_medida || 'unidades',
              nombre_ingrediente: nombreInyectado
            };
          }) || [];

          return {
            ...r,
            receta_ingredientes: ingRelacionales
          };
        });
        setRecetas(mapeadas);
        setDataSource('supabase');
      }
    } catch (err: any) {
      console.warn('Cargando entorno local demo:', err.message);
      setErrorMsg(err.message);
      setRecetas(fallbackRecetas);
      setCategorias(fallbackCategorias);
      setDataSource('local');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Diccionario reactivo para asociar los UUIDs de las categorías a sus nombres en pantalla
  const mapaCategorias = useMemo(() => {
    const obj: Record<string, string> = {};
    categorias.forEach(c => { obj[c.id] = c.nombre; });
    return obj;
  }, [categorias]);

  const handleToggleCategory = (id: string) => {
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleToggleDifficulty = (diff: number) => {
    setSelectedDifficulties(prev => prev.includes(diff) ? prev.filter(d => d !== diff) : [...prev, diff]);
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedDifficulties([]);
    setMinTime(0);
    setMaxTime(180);
    setOnlyWithSecrets(false);
  };

  // --- FILTRADO ADITIVO REAL POR ID ---
  const recetasFiltradas = useMemo(() => {
    return recetas.filter(receta => {
      const coincideBusqueda = receta.titulo.toLowerCase().includes(searchQuery.toLowerCase());
      const coincideCategory = selectedCategories.length === 0 || (receta.categoria_id && selectedCategories.includes(receta.categoria_id.toString()));
      const coincideDificultad = selectedDifficulties.length === 0 || selectedDifficulties.includes(receta.dificultad);
      const coincideTiempo = receta.tiempo_preparacion >= minTime && receta.tiempo_preparacion <= maxTime;
      const coincideSecreto = !onlyWithSecrets || (receta.secreto_familiar && receta.secreto_familiar.trim().length > 0);

      return coincideBusqueda && coincideCategory && coincideDificultad && coincideTiempo && coincideSecreto;
    });
  }, [recetas, searchQuery, selectedCategories, selectedDifficulties, minTime, maxTime, onlyWithSecrets]);

  const procesarPasosDeInstrucciones = (texto: string): string[] => {
    if (!texto) return [];
    let textoLimpio = texto;
    if (texto.includes('[PASOS]')) {
      textoLimpio = texto.split('[PASOS]\n')[1] || texto;
    }
    return textoLimpio
      .split(/\n|\.(?=\s|$)/g)
      .map(p => p.replace(/^\d+\.\s?|^Paso\s?\d+:\s?/i, '').trim())
      .filter(p => p.length > 3);
  };

  const handleVerDetalle = (receta: Receta) => {
    let finalReceta = { ...receta };
    if (receta.instrucciones.includes('[INGREDIENTES]')) {
      const partes = receta.instrucciones.split('[PASOS]\n');
      const ingredientesParte = partes[0].replace('[INGREDIENTES]\n', '');
      finalReceta.ingredientes_lista = ingredientesParte.trim();
      finalReceta.instrucciones = partes[1] || '';
    }
    setSelectedReceta(finalReceta);
    setCurrentScreen('detail');
  };

  const handleGuardarReceta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloForm.trim() || !instruccionesForm.trim()) {
      alert('Rellena los campos requeridos.');
      return;
    }
    setIsSaving(true);
    try {
      if (dataSource === 'supabase' && !errorMsg) {
        const { data: fam } = await supabase.from('familiares').select('id').limit(1);
        if (!fam?.length) throw new Error('No hay familiares en tu DB.');

        const instruccionesConIngredientes = `[INGREDIENTES]\n${ingredientesForm.trim()}\n[PASOS]\n${instruccionesForm.trim()}`;

        const { error } = await supabase.from('recetas').insert([
          {
            titulo: tituloForm.trim(),
            instrucciones: instruccionesConIngredientes,
            tiempo_preparacion: Number(tiempoForm),
            tiempo_coccion: 0,
            imagen_url: urlImagenForm.trim() || null,
            dificultad: Number(dificultadForm),
            secreto_familiar: secretoForm.trim() || null,
            familiar_id: fam[0].id,
            categoria_id: categoriaForm || categorias[0].id
          }
        ]);
        if (error) throw error;
        setSuccessToast('¡Guardado con éxito!');
        await fetchData();
      } else {
        const nueva: Receta = {
          id: `local-${Date.now()}`,
          titulo: tituloForm.trim(),
          ingredientes_lista: ingredientesForm.trim(),
          instrucciones: instruccionesForm.trim(),
          tiempo_preparacion: Number(tiempoForm),
          dificultad: Number(dificultadForm),
          secreto_familiar: secretoForm.trim() || null,
          imagen_url: urlImagenForm.trim() || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500&auto=format&fit=crop&q=60',
          categoria_id: categoriaForm || 'demo-cat-1',
          is_local: true
        };
        setRecetas(prev => [nueva, ...prev]);
        setSuccessToast('¡Guardado local activo!');
      }
      setTituloForm('');
      setInstruccionesForm('');
      setIngredientesForm('');
      setCurrentScreen('list');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4">
      
      <div className="p-3 rounded-xl border text-xs text-left flex gap-2 bg-emerald-500/5 border-emerald-500/20 text-emerald-600 font-bold">
        <Database className="w-4 h-4 shrink-0" />
        <span>Base de Datos: {dataSource === 'supabase' ? 'Supabase Conectado' : 'Modo Demo'}</span>
      </div>

      {successToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-mono text-xs font-bold px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-1.5">
          <Check className="w-4 h-4" />
          {successToast}
        </div>
      )}

      {/* CONTENEDOR MÓVIL BLINDADO */}
      <div className="w-full h-[640px] bg-slate-950 rounded-[40px] p-3 shadow-2xl relative overflow-hidden border-4 border-gray-800 flex flex-col">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-b-xl z-50" />
        
        <div className="w-full h-full bg-stone-50 rounded-[28px] overflow-hidden relative flex flex-col text-stone-800">
          
          <div className="h-7 shrink-0 bg-white px-5 flex justify-between items-center text-[9px] font-sans font-bold text-gray-400 border-b border-gray-100">
            <span>12:45 PM</span>
            <span>Wi-Fi</span>
          </div>

          <div className="flex-1 flex flex-col relative overflow-hidden">
            
            {/* --- VISTA 1: LISTADO DE RECETAS --- */}
            {currentScreen === 'list' && (
              <div className="absolute inset-0 flex flex-col w-full">
                <header className="bg-white border-b border-gray-200/50 px-4 pt-3 pb-3 flex flex-col gap-2.5 w-full shrink-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="text-left">
                      <span className="text-[8px] text-amber-600 font-extrabold tracking-widest uppercase block">Mis Recetas</span>
                      <h1 className="text-md font-black text-gray-900 tracking-tight">Cocina Familiar</h1>
                    </div>
                    <button 
                      onClick={() => setIsFilterPanelOpen(true)}
                      className="w-8 h-8 rounded-full flex items-center justify-center border border-stone-200 bg-stone-50 shrink-0"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar receta por título..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8.5 py-1.5 bg-gray-100 rounded-full text-xs outline-none"
                    />
                  </div>
                </header>

                {/* CONTENEDOR FLEX DE TARJETAS BLINDADO AL ANCHO COMPLETO */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 flex flex-col items-stretch w-full">
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
                        className="w-full bg-white border border-gray-200 rounded-2xl shadow-xs cursor-pointer overflow-hidden flex flex-col text-left shrink-0"
                      >
                        <div className="w-full h-40 bg-stone-200 relative">
                          <img src={receta.imagen_url || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500&auto=format&fit=crop&q=60"} alt={receta.titulo} className="w-full h-full object-cover"/>
                          <span className="absolute top-2 left-2 bg-black/60 text-white font-sans text-[8px] font-extrabold tracking-wide uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Layers className="w-2.5 h-2.5 text-amber-400" />
                            {receta.categorias?.nombre || mapaCategorias[receta.categoria_id || ''] || 'Comida'}
                          </span>
                        </div>

                        <div className="p-3.5 bg-white flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center gap-2 w-full">
                              <h3 className="font-extrabold text-stone-900 text-xs tracking-tight flex-1 truncate">{receta.titulo}</h3>
                              {renderEstrellas(receta.dificultad)}
                            </div>
                            <p className="text-[10px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                              {receta.instrucciones.replace(/\[INGREDIENTES\][\s\S]*?\[PASOS\]\n/, '')}
                            </p>
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
                    <div className="py-20 text-center text-stone-400 text-xs font-bold w-full">
                      Ninguna receta coincide con tus filtros.
                    </div>
                  )}
                </div>

                <button onClick={() => setCurrentScreen('create')} className="absolute bottom-5 right-5 w-11 h-11 bg-amber-600 hover:bg-amber-700 text-white rounded-full flex items-center justify-center shadow-lg z-10">
                  <Plus className="w-5.5 h-5.5 stroke-[2.5]" />
                </button>
              </div>
            )}

            {/* --- VISTA 2: PANTALLA DETALLE --- */}
            {currentScreen === 'detail' && selectedReceta && (
              <div className="absolute inset-0 flex flex-col bg-stone-50 w-full">
                <header className="bg-white border-b border-stone-100 px-4 py-2 flex items-center gap-2 shrink-0">
                  <button onClick={() => setCurrentScreen('list')} className="p-1 bg-stone-100 rounded-full"><ArrowLeft className="w-4 h-4" /></button>
                  <h2 className="text-xs font-bold text-stone-800 truncate text-left flex-1">{selectedReceta.titulo}</h2>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left flex flex-col items-stretch w-full">
                  <div className="w-full bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-3xs shrink-0">
                    <img src={selectedReceta.imagen_url || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500&auto=format&fit=crop&q=60"} alt={selectedReceta.titulo} className="w-full h-44 object-cover"/>
                    <div className="p-4 space-y-2">
                      <h1 className="text-xs font-black text-stone-900 leading-tight">{selectedReceta.titulo}</h1>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3 text-amber-500" /> {formatearMinutos(selectedReceta.tiempo_preparacion)}
                        </span>
                        <div className="inline-flex items-center gap-1.5 bg-stone-100 px-2 py-0.5 rounded-full text-[9px] font-bold text-stone-700">
                          <span>Dificultad:</span>
                          {renderEstrellas(selectedReceta.dificultad)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* INGREDIENTES */}
                  <div className="space-y-1 w-full shrink-0">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                      <Utensils className="w-3 h-3 text-amber-500" /> 🛒 Ingredientes Necesarios
                    </span>
                    <div className="bg-white p-3.5 rounded-2xl border border-stone-200 text-[10px] text-stone-800 shadow-3xs font-medium w-full">
                      {selectedReceta.receta_ingredientes && selectedReceta.receta_ingredientes.length > 0 ? (
                        <div className="space-y-1.5 w-full">
                          {selectedReceta.receta_ingredientes.map((ri, index) => (
                            <div key={index} className="flex justify-between items-center border-b border-stone-50 pb-1 last:border-0 last:pb-0 w-full">
                              <span>• {ri.nombre_ingrediente}</span>
                              <span className="font-mono text-stone-500 font-bold bg-stone-50 px-1.5 py-0.5 rounded border">
                                {ri.cantidad} {ri.unidad_medida}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : selectedReceta.ingredientes_lista ? (
                        <div className="whitespace-pre-line text-stone-700 leading-relaxed w-full">
                          {selectedReceta.ingredientes_lista}
                        </div>
                      ) : (
                        <p className="text-[9px] text-stone-400 italic">No se han especificado ingredientes.</p>
                      )}
                    </div>
                  </div>

                  {/* PASOS SEPARADOS */}
                  <div className="space-y-1 w-full shrink-0">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-amber-500" /> Elaboración Paso a Paso</span>
                    <div className="space-y-2.5 w-full">
                      {procesarPasosDeInstrucciones(selectedReceta.instrucciones).map((paso, i) => (
                        <div key={i} className="w-full bg-white p-3 rounded-xl border border-stone-200 flex gap-3 shadow-3xs items-start">
                          <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-[10px] text-stone-700 leading-relaxed font-sans flex-1">{paso}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- VISTA 3: PANTALLA CREAR RECETA --- */}
            {currentScreen === 'create' && (
              <div className="absolute inset-0 flex flex-col bg-stone-50 w-full">
                <header className="bg-white border-b border-stone-100 px-4 py-2 flex items-center gap-2 shrink-0">
                  <button type="button" onClick={() => setCurrentScreen('list')} className="p-1 bg-stone-100 rounded-full"><ArrowLeft className="w-4 h-4" /></button>
                  <h2 className="text-xs font-bold text-stone-800 text-left">Nueva Receta</h2>
                </header>

                <form onSubmit={handleGuardarReceta} className="flex-1 overflow-y-auto p-4 space-y-3 text-left w-full flex flex-col items-stretch">
                  <div className="space-y-1 w-full">
                    <label className="text-[9px] font-bold text-stone-400 uppercase block">Título *</label>
                    <input type="text" required placeholder="Ej. Lasaña boloñesa" value={tituloForm} onChange={(e) => setTituloForm(e.target.value)} className="w-full bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-xs outline-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 w-full">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase block">Tiempo (Mins) *</label>
                      <input type="number" required value={tiempoForm} onChange={(e) => setTiempoForm(Number(e.target.value))} className="w-full bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-xs outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase block">Dificultad *</label>
                      <select value={dificultadForm} onChange={(e) => setDificultadForm(Number(e.target.value))} className="w-full bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-xs outline-none bg-white">
                        {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} Estrellas</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1 w-full">
                    <label className="text-[9px] font-bold text-stone-400 uppercase block">Categoría</label>
                    <select value={categoriaForm} onChange={(e) => setCategoriaForm(e.target.value)} className="w-full bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-xs outline-none bg-white">
                      <option value="">Selecciona una categoría...</option>
                      {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1 w-full">
                    <label className="text-[9px] font-bold text-stone-400 uppercase block">Lista de Ingredientes *</label>
                    <textarea rows={3} required placeholder="• 200g de carne picada&#10;• Láminas de pasta..." value={ingredientesForm} onChange={(e) => setIngredientesForm(e.target.value)} className="w-full bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-[10px] resize-none outline-none leading-relaxed" />
                  </div>

                  <div className="space-y-1 w-full">
                    <label className="text-[9px] font-bold text-stone-400 uppercase block">Instrucciones de Elaboración *</label>
                    <textarea rows={4} required placeholder="Escribe los pasos separados por puntos o intros..." value={instruccionesForm} onChange={(e) => setInstruccionesForm(e.target.value)} className="w-full bg-white border border-stone-200 px-3 py-2 rounded-lg text-[10px] resize-none outline-none leading-relaxed" />
                  </div>

                  <div className="space-y-1 w-full">
                    <label className="text-[9px] font-bold text-stone-400 uppercase block">URL de la Imagen</label>
                    <input type="url" placeholder="https://enlace-foto.com/imagen.jpg" value={urlImagenForm} onChange={(e) => setUrlImagenForm(e.target.value)} className="w-full bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-xs outline-none" />
                  </div>
                </form>

                <div className="p-3 bg-white border-t border-stone-100 flex gap-2 shrink-0">
                  <button type="submit" onClick={handleGuardarReceta} disabled={isSaving} className="w-full py-2 bg-amber-600 text-white font-bold text-[10px] uppercase font-mono rounded-lg flex items-center justify-center gap-1">
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Guardar Receta
                  </button>
                </div>
              </div>
            )}

            {/* --- PANEL DE FILTROS REALES (SIN ERRORES DE ANCHO) --- */}
            {isFilterPanelOpen && (
              <div className="absolute inset-0 bg-black/40 z-50 flex flex-col justify-end">
                <div className="w-full max-h-[85%] bg-white rounded-t-3xl p-5 overflow-y-auto flex flex-col gap-4 text-left shadow-2xl">
                  <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                    <h2 className="text-xs font-black uppercase tracking-wider text-stone-500">Filtros de Recetas</h2>
                    <button onClick={() => setIsFilterPanelOpen(false)} className="p-1 bg-stone-100 rounded-full"><X className="w-4 h-4" /></button>
                  </div>

                  {/* Tipo de comida REAL de Supabase */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase text-stone-400">Tipo de Comida (Base de Datos)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {categorias.map(cat => (
                        <label key={cat.id} className="flex items-center gap-2 p-2 bg-stone-50 rounded-xl border border-stone-200/60 cursor-pointer text-[10px] truncate">
                          <input 
                            type="checkbox" 
                            checked={selectedCategories.includes(cat.id.toString())} 
                            onChange={() => handleToggleCategory(cat.id.toString())} 
                            className="accent-amber-600 shrink-0"
                          />
                          <span className="truncate">{cat.nombre}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Dificultad */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase text-stone-400">Dificultad</label>
                    <div className="flex justify-between gap-1">
                      {[1, 2, 3, 4, 5].map(num => (
                        <label key={num} className={`flex-1 py-1.5 rounded-xl border flex flex-col items-center gap-0.5 cursor-pointer text-[10px] font-bold ${
                          selectedDifficulties.includes(num) ? 'bg-amber-50 border-amber-600 text-amber-700' : 'bg-stone-50 border-stone-200 text-stone-600'
                        }`}>
                          <input type="checkbox" checked={selectedDifficulties.includes(num)} onChange={() => handleToggleDifficulty(num)} className="hidden"/>
                          <span>{num} ⭐</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Duración de Tiempo Doble Deslizador - Separados completamente sin solapamiento */}
                  <div className="space-y-3 w-full">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-bold uppercase text-stone-400">Duración Acotada</label>
                      <span className="text-[9px] font-mono font-bold text-amber-600">{formatearMinutos(minTime)} - {formatearMinutos(maxTime)}</span>
                    </div>

                    <div className="space-y-3 bg-stone-50 p-3 rounded-xl border border-stone-200 w-full box-border">
                      <div className="space-y-1 w-full">
                        <div className="flex justify-between text-[8px] text-stone-400 font-bold uppercase">Mínimo:</div>
                        <input 
                          type="range" min="0" max="180" step="5" value={minTime}
                          onChange={(e) => setMinTime(Math.min(maxTime, Number(e.target.value)))}
                          className="w-full accent-amber-600 cursor-pointer h-1 bg-stone-200 rounded-lg appearance-none block"
                        />
                      </div>
                      <div className="space-y-1 border-t border-stone-200/60 pt-2 w-full">
                        <div className="flex justify-between text-[8px] text-stone-400 font-bold uppercase">Máximo:</div>
                        <input 
                          type="range" min="0" max="180" step="5" value={maxTime}
                          onChange={(e) => setMaxTime(Math.max(minTime, Number(e.target.value)))}
                          className="w-full accent-amber-600 cursor-pointer h-1 bg-stone-200 rounded-lg appearance-none block"
                        />
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center justify-between p-2.5 bg-purple-50/50 border border-purple-200/50 rounded-xl cursor-pointer mt-1">
                    <span className="text-[10px] font-extrabold text-purple-900">🤫 Mostrar solo secretos</span>
                    <input type="checkbox" checked={onlyWithSecrets} onChange={(e) => setOnlyWithSecrets(e.target.checked)} className="accent-purple-600 w-4 h-4" />
                  </label>

                  <div className="flex gap-2 border-t border-stone-100 pt-3 mt-1">
                    <button onClick={() => setIsFilterPanelOpen(false)} className="flex-1 py-2 bg-amber-600 text-white text-[10px] font-bold uppercase rounded-xl text-center">Aplicar Filtros</button>
                    <button onClick={handleResetFilters} className="px-4 py-2 bg-stone-100 text-stone-600 text-[10px] font-bold uppercase rounded-xl text-center">Limpiar</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}