// src/components/recetas/PantallaPrincipalRecetas.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { Receta, Categoria, ComentarioFamiliar } from '../../types/recetas';
import { obtenerColorCirculo } from '../../utils/recetasHelpers';
import { Search, ChefHat, Bookmark, LogOut, RefreshCw } from 'lucide-react';

import VistaLista from './VistaLista';
import VistaDetalle from './VistaDetalle';
import VistaCrear from './VistaCrear';
import PanelFiltros from './PanelFiltros';
import VistaAuth from './VistaAuth'; 

export default function PantallaPrincipalRecetas() {
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState<boolean>(true);

  const [currentScreen, setCurrentScreen] = useState<'list' | 'detail' | 'create'>('list');
  const [selectedReceta, setSelectedReceta] = useState<Receta | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'saved' | 'mine' | 'search'>('mine');

  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [comentarios, setComentarios] = useState<ComentarioFamiliar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentFamiliarId, setCurrentFamiliarId] = useState<string>('');
  const [savedRecetasIds, setSavedRecetasIds] = useState<string[]>(() => {
    const local = localStorage.getItem('recetas_guardadas_familia');
    return local ? JSON.parse(local) : [];
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<number[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [minTime, setMinTime] = useState<number>(0);
  const [maxTime, setMaxTime] = useState<number>(180);
  const [timeRange, setTimeRange] = useState<string>( 'all');
  const [sortBy, setSortBy] = useState<'recent' | 'old'>('recent');

  const [tituloForm, setTituloForm] = useState<string>('');
  const [descripcionForm, setDescripcionForm] = useState<string>('');
  const [ingredientesListForm, setIngredientesListForm] = useState<string[]>(['']);
  const [pasosListForm, setPasosListForm] = useState<string[]>(['']);
  const [tiempoHorasForm, setTiempoHorasForm] = useState<number>(0);
  const [tiempoMinutosForm, setTiempoMinutosForm] = useState<number>(30);
  const [dificultadForm, setDificultadForm] = useState<number>(3);
  const [categoriasFormMúltiples, setCategoriasFormMúltiples] = useState<string[]>([]);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [secretoForm, setSecretoForm] = useState<string>('');
  const [esPrivadaForm, setEsPrivadaForm] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('recetas_guardadas_familia', JSON.stringify(savedRecetasIds));
  }, [savedRecetasIds]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      setSession(activeSession);
      setSessionLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      setSession(activeSession);
      if (!activeSession) {
        setCurrentFamiliarId('');
        setRecetas([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedDifficulties([]);
    setSelectedRatings([]);
    setMinTime(0);
    setMaxTime(180);
    setTimeRange('all');
    setSortBy('recent');
    setSearchQuery('');
  };

  const fetchData = async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const { data: dbCats } = await supabase.from('categorias').select('id, nombre');
      setCategorias(dbCats || []);

      const { data: currentFam } = await supabase
        .from('familiares')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
        
      if (currentFam) setCurrentFamiliarId(currentFam.id);

      const { data: recs } = await supabase
        .from('recetas')
        .select(`
          id, titulo, descripcion, instrucciones, tiempo_preparacion, fecha_creacion, imagen_url, dificultad, categoria_id, secreto_familiar, familiar_id, es_privada, valoracion_media,
          familiares ( nombre ),
          receta_ingredientes ( cantidad, unidad_medida, es_opcional, ingredientes ( nombre ) ),
          comentarios_valoraciones ( id )
        `)
        .order('fecha_creacion', { ascending: false });

      if (recs) {
        const mapeadas = recs.map((r: any) => {
          let finalCategories: string[] = r.categoria_id ? [r.categoria_id] : [];
          const inst = r.instrucciones || '';
          
          if (inst.includes('[CATEGORIAS]')) {
            const partesCat = inst.split('[INGREDIENTES]');
            const bloqueCat = partesCat[0].replace('[CATEGORIAS]', '').trim();
            if (bloqueCat) {
              finalCategories = bloqueCat.split(',').filter((id: string) => id.length > 0);
            }
          }

          return {
            ...r,
            receta_ingredientes: r.receta_ingredientes?.map((ri: any) => ({
              cantidad: Number(ri.cantidad || 0),
              unidad_medida: ri.unidad_medida || 'unidades',
              nombre_ingrediente: ri.ingredientes?.nombre || 'Ingrediente',
              es_opcional: !!ri.es_opcional
            })) || [],
            categorias_ids: finalCategories,
            num_valoraciones: r.comentarios_valoraciones?.length || 0,
            autor_nombre: r.familiares?.nombre || 'Familiar'
          };
        });
        setRecetas(mapeadas);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComentariosReceta = async (recetaId: string) => {
    try {
      const { data, error } = await supabase
        .from('comentarios_valoraciones')
        .select('id, puntuacion, comentario, fecha_creacion, familiares ( nombre )')
        .eq('receta_id', recetaId)
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      setComentarios(data || []);
    } catch (err) {
      console.error(err);
      setComentarios([]);
    }
  };

  useEffect(() => {
    if (session?.user) fetchData();
  }, [session, activeTab]);

  const mapaCategorias = useMemo(() => {
    const obj: Record<string, string> = {};
    categorias.forEach(c => { obj[c.id] = c.nombre; });
    return obj;
  }, [categorias]);

  const handleGuardarReceta = async (e: React.FormEvent) => {
    e.preventDefault();
    const ingFiltrados = ingredientesListForm.filter(i => i.trim() !== '');
    const pasosFiltrados = pasosListForm.filter(p => p.trim() !== '');

    if (!tituloForm.trim() || ingFiltrados.length === 0 || pasosFiltrados.length === 0) {
      alert('Rellena los campos obligatorios antes de guardar.');
      return;
    }
    setIsSaving(true);
    try {
      const totalMinutosCalculados = (Number(tiempoHorasForm) * 60) + Number(tiempoMinutosForm);
      const ingredientesString = ingFiltrados.map(i => `- ${i.trim()}`).join('\n');
      const pasosString = pasosFiltrados.map((p, idx) => `${idx + 1}. ${p.trim()}`).join('\n');
      const categoriasString = categoriasFormMúltiples.join(',');
      
      const instruccionesEmpaquetadas = `[CATEGORIAS]\n${categoriasString}\n[INGREDIENTES]\n${ingredientesString}\n[PASOS]\n${pasosString}`;

      const { error } = await supabase.from('recetas').insert([
        {
          titulo: tituloForm.trim(),
          descripcion: descripcionForm.trim() || null, 
          instrucciones: instruccionesEmpaquetadas,
          tiempo_preparacion: totalMinutosCalculados,
          tiempo_coccion: 0,
          imagen_url: imagenPreview || null, 
          dificultad: Number(dificultadForm),
          secreto_familiar: secretoForm.trim() || null,
          es_privada: esPrivadaForm,
          familiar_id: currentFamiliarId,
          categoria_id: categoriasFormMúltiples[0] || categorias[0]?.id
        }
      ]);

      if (error) throw error;
      setSuccessToast('Receta guardada con exito');
      await fetchData();

      setTituloForm(''); setDescripcionForm(''); setIngredientesListForm(['']); setPasosListForm(['']);
      setCategoriasFormMúltiples([]); setImagenPreview(null); setTiempoHorasForm(0); setTiempoMinutosForm(30);
      setSecretoForm(''); setEsPrivadaForm(false);
      setCurrentScreen('list');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAñadirComentario = async (puntuacion: number, comentario: string) => {
    if (!selectedReceta) return;
    try {
      const { error } = await supabase.from('comentarios_valoraciones').insert([
        {
          receta_id: selectedReceta.id,
          familiar_id: currentFamiliarId,
          puntuacion: puntuacion,
          comentario: comentario.trim() || null
        }
      ]);
      if (error) throw error;
      setSuccessToast('Comentario anadido');
      await fetchComentariosReceta(String(selectedReceta.id));
      await fetchData(); 
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const recetasFiltradas = useMemo(() => {
    let resultado = recetas.filter(receta => {
      if (activeTab === 'mine') {
        if (String(receta.familiar_id) !== String(currentFamiliarId)) return false;
      } else if (activeTab === 'search') {
        if (String(receta.familiar_id) === String(currentFamiliarId)) return false;
        if (receta.es_privada) return false; 
      } else if (activeTab === 'saved') {
        if (!savedRecetasIds.includes(String(receta.id))) return false;
      }

      if (!receta.titulo.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      if (selectedCategories.length > 0) {
        const coincidencia = receta.categorias_ids?.some(id => selectedCategories.includes(id));
        if (!coincidencia) return false;
      }
      
      if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(receta.dificultad)) return false;
      
      const rowRating = receta.num_valoraciones === 0 ? 0 : Math.floor(receta.valoracion_media || 5);
      if (selectedRatings.length > 0 && !selectedRatings.includes(rowRating)) return false;

      return receta.tiempo_preparacion >= minTime && receta.tiempo_preparacion <= maxTime;
    });

    return [...resultado].sort((a, b) => {
      const tA = new Date(a.fecha_creacion).getTime();
      const tB = new Date(b.fecha_creacion).getTime();
      return sortBy === 'recent' ? tB - tA : tA - tB;
    });
  }, [recetas, activeTab, currentFamiliarId, savedRecetasIds, searchQuery, selectedCategories, selectedDifficulties, selectedRatings, minTime, maxTime, sortBy]);

  if (sessionLoading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center text-stone-400 bg-slate-950">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mb-2" />
        <span className="text-[10px] font-mono uppercase tracking-wider">Verificando Credenciales...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full md:p-4 md:space-y-4 md:max-w-md md:mx-auto">
      {successToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-mono text-xs font-bold px-4 py-2 rounded-full shadow-lg z-50">
          {successToast}
        </div>
      )}

      {session && (
        <div className="hidden md:flex justify-between items-center p-3 rounded-xl border text-xs bg-amber-500/5 border-amber-500/20 text-amber-700 font-bold">
          <span className="truncate">Sesion: {session.user.email}</span>
          <button type="button" onClick={() => supabase.auth.signOut()} className="flex items-center gap-1 text-red-600 hover:text-red-700 text-[10px] uppercase font-mono tracking-wider font-black focus:outline-none cursor-pointer"><LogOut className="w-3.5 h-3.5" /> Salir</button>
        </div>
      )}

      <div className="fixed inset-0 w-full h-full bg-stone-50 flex flex-col overflow-hidden md:relative md:inset-auto md:h-[640px] md:bg-slate-950 md:rounded-[40px] md:p-3 md:border-4 md:border-gray-800">
        <div className="w-full flex-1 bg-stone-50 flex flex-col text-stone-800 md:rounded-[28px] md:overflow-hidden relative">
          <div className="flex-1 flex flex-col relative overflow-hidden">
            
            {!session ? (
              <VistaAuth />
            ) : (
              <>
                {currentScreen === 'list' && (
                  <>
                    <VistaLista
                      recetas={recetasFiltradas} loading={loading} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                      activeTab={activeTab} currentFamiliarId={currentFamiliarId}
                      savedRecetasIds={savedRecetasIds} mapaCategorias={mapaCategorias}
                      onToggleSave={(e, id) => {
                        e.stopPropagation();
                        setSavedRecetasIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
                      }}
                      onSelectReceta={(r) => { 
                        setSelectedReceta(r); 
                        setCurrentScreen('detail'); 
                        fetchComentariosReceta(String(r.id));
                      }}
                      onOpenFilters={() => setIsFilterPanelOpen(true)} onGoToCreate={() => setCurrentScreen('create')}
                    />

                    <div className="absolute bottom-0 inset-x-0 h-14 bg-amber-600 text-amber-100 flex items-center justify-around z-20 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-2">
                      <button type="button" onClick={() => setActiveTab('saved')} className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${activeTab === 'saved' ? 'text-white font-black scale-105' : 'opacity-70'}`}>
                        <Bookmark className={`w-4 h-4 mb-0.5 ${activeTab === 'saved' ? 'fill-white' : ''}`} />
                        <span className="text-[9px] uppercase tracking-wider">Guardadas</span>
                      </button>

                      <button type="button" onClick={() => setActiveTab('mine')} className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${activeTab === 'mine' ? 'text-white font-black scale-105' : 'opacity-70'}`}>
                        <ChefHat className="w-4 h-4 mb-0.5" />
                        <span className="text-[9px] uppercase tracking-wider">Mias</span>
                      </button>

                      <button type="button" onClick={() => setActiveTab('search')} className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${activeTab === 'search' ? 'text-white font-black scale-105' : 'opacity-70'}`}>
                        <Search className="w-4 h-4 mb-0.5" />
                        <span className="text-[9px] uppercase tracking-wider">Buscar</span>
                      </button>
                    </div>
                  </>
                )}

                {currentScreen === 'detail' && selectedReceta && (
                  <VistaDetalle
                    receta={selectedReceta} comentarios={comentarios} onBack={() => setCurrentScreen('list')}
                    mapaCategorias={mapaCategorias} currentFamiliarId={currentFamiliarId}
                    onAñadirComentario={handleAñadirComentario}
                    renderEstrellasComentario={(n) => (
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`text-[10px] ${i < n ? 'text-amber-500' : 'text-stone-200'}`}>★</span>
                        ))}
                      </div>
                    )}
                  />
                )}

                {currentScreen === 'create' && (
                  <VistaCrear
                    onBack={() => setCurrentScreen('list')} onSubmit={handleGuardarReceta}
                    tituloForm={tituloForm} setTituloForm={setTituloForm} descripcionForm={descripcionForm} setDescripcionForm={setDescripcionForm}
                    esPrivadaForm={esPrivadaForm} setEsPrivadaForm={setEsPrivadaForm} secretoForm={secretoForm} setSecretoForm={setSecretoForm}
                    tiempoHorasForm={tiempoHorasForm} setTiempoHorasForm={setTiempoHorasForm} tiempoMinutosForm={tiempoMinutosForm} setTiempoMinutosForm={setTiempoMinutosForm}
                    dificultadForm={dificultadForm} setDificultadForm={setDificultadForm} categorias={categorias} categoriasFormMúltiples={categoriasFormMúltiples}
                    onToggleFormCategory={(id) => setCategoriasFormMúltiples(p => p.includes(id) ? p.filter(x => x !== id) : p.length >= 3 ? p : [...p, id])}
                    ingredientesListForm={ingredientesListForm} handleIngredientChange={(i, v) => { const c = [...ingredientesListForm]; c[i] = v; setIngredientesListForm(c); }}
                    addIngredientField={() => setIngredientesListForm([...ingredientesListForm, ''])}
                    pasosListForm={pasosListForm} handlePasoChange={(i, v) => { const c = [...pasosListForm]; c[i] = v; setPasosListForm(c); }}
                    addPasoField={() => setPasosListForm([...pasosListForm, ''])}
                    imagenPreview={imagenPreview} handleImagenChange={(e) => { const f = e.target.files?.[0]; if (f) setImagenPreview(URL.createObjectURL(f)); }}
                    isSaving={isSaving} obtenerColorCirculo={obtenerColorCirculo}
                  />
                )}

                <PanelFiltros
                  isOpen={isFilterPanelOpen} onClose={() => setIsFilterPanelOpen(false)} categorias={categorias}
                  selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories}
                  selectedDifficulties={selectedDifficulties} setSelectedDifficulties={setSelectedDifficulties}
                  selectedRatings={selectedRatings} setSelectedRatings={setSelectedRatings}
                  minTime={minTime} setMinTime={setMinTime} maxTime={maxTime} setMaxTime={setMaxTime}
                  timeRange={timeRange} setTimeRange={setTimeRange} sortBy={sortBy} setSortBy={setSortBy}
                  onReset={handleResetFilters}
                />
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}