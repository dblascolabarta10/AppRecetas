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
import ModalConfirmacion from './ModalConfirmacion'; 

import { subirMultimediaReceta } from '../../services/recetasMultimedia';

export default function PantallaPrincipalRecetas() {
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState<boolean>(true);

  const [currentScreen, setCurrentScreen] = useState<'list' | 'detail' | 'create' | 'edit'>('list');
  const [selectedReceta, setSelectedReceta] = useState<Receta | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'saved' | 'mine' | 'search'>('mine');

  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [comentarios, setComentarios] = useState<ComentarioFamiliar[]>([]);
  
  // AQUÍ ESTABA LA TRAMPA: Esto empieza en TRUE
  const [loading, setLoading] = useState<boolean>(true);
  const [currentFamiliarId, setCurrentFamiliarId] = useState<string>('');
  
  const [savedRecetasIds, setSavedRecetasIds] = useState<string[]>(() => {
    const local = localStorage.getItem('recetas_guardadas_familia');
    return local ? JSON.parse(local) : [];
  });

  const [archivosMultimedia, setArchivosMultimedia] = useState<any[]>([]);
  const [multimediaReceta, setMultimediaReceta] = useState<any[]>([]);
  const [imagenFile, setImagenFile] = useState<File | null>(null);

  const [modalConfirm, setModalConfirm] = useState<{
    isOpen: boolean;
    titulo: string;
    mensaje: string;
    tipo: 'danger' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    titulo: '',
    mensaje: '',
    tipo: 'warning',
    onConfirm: () => {}
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<number[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [minTime, setMinTime] = useState<number>(0);
  const [maxTime, setMaxTime] = useState<number>(180);
  const [timeRange, setTimeRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'old'>('recent');

  const [tituloForm, setTituloForm] = useState<string>('');
  const [descripcionForm, setDescripcionForm] = useState<string>('');
  
  // ESTADO DE INGREDIENTES EN FORMATO OBJETO
  const [ingredientesListForm, setIngredientesListForm] = useState<any[]>([{ cantidad: '', unidad_medida: 'g', nombre: '' }]);
  const [pasosListForm, setPasosListForm] = useState<string[]>(['']);
  const [tiempoHorasForm, setTiempoHorasForm] = useState<number>(0);
  const [tiempoMinutosForm, setTiempoMinutosForm] = useState<number>(30);
  const [porcionesForm, setPorcionesForm] = useState<number>(4);
  const [dificultadForm, setDificultadForm] = useState<number>(3);
  const [categoriasFormMúltiples, setCategoriasFormMúltiples] = useState<string[]>([]);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [secretoForm, setSecretoForm] = useState<string>('');
  const [esPrivadaForm, setEsPrivadaForm] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const mapaCategorias = useMemo(() => {
    const obj: Record<string, string> = {};
    categorias.forEach(c => { obj[c.id] = c.nombre; });
    return obj;
  }, [categorias]);

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

  // 🔥 ESTE ES EL BLOQUE QUE ME COMÍ Y QUE CONGELABA LA APP 🔥
  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session, activeTab]);
  // -----------------------------------------------------------

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
    setLoading(true); // Se ponía en true, pero como no se llamaba, nunca acababa
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
          id, titulo, descripcion, instrucciones, tiempo_preparacion, fecha_creacion, imagen_url, dificultad, categoria_id, secreto_familiar, familiar_id, es_privada, valoracion_media, porciones,
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
      setLoading(false); // ¡Aquí es donde la rueda por fin para!
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

  const fetchMultimediaReceta = async (recetaId: string) => {
    try {
      const { data, error } = await supabase
        .from('recetas_multimedia')
        .select('*')
        .eq('receta_id', recetaId)
        .order('orden', { ascending: true });

      if (error) throw error;
      setMultimediaReceta(data || []);
    } catch (err) {
      console.error('Error al bajar multimedia:', err);
      setMultimediaReceta([]);
    }
  };

  const handlePrellenarFormEdicion = (receta: Receta) => {
    const inst = receta.instrucciones || '';
    let ings: any[] = [];
    let pasos: string[] = [];

    if (inst.includes('[PASOS]')) {
      const partesPasos = inst.split('[PASOS]');
      const bloquePasos = partesPasos[1] || '';
      pasos = bloquePasos.split('\n').map(p => p.replace(/^\d+\.\s?/, '').trim()).filter(Boolean);
    } else {
      pasos = inst.split('\n').map(p => p.trim()).filter(Boolean);
    }

    if (receta.receta_ingredientes && receta.receta_ingredientes.length > 0) {
      ings = receta.receta_ingredientes.map((ri: any) => ({
        cantidad: String(ri.cantidad),
        unidad_medida: ri.unidad_medida,
        nombre: ri.ingredientes?.nombre || ''
      }));
    } else {
      const partes = inst.split('[INGREDIENTES]');
      const bloque = partes[1]?.split('[PASOS]')[0] || '';
      ings = bloque.split('\n').map(i => ({
        cantidad: '1',
        unidad_medida: 'ud',
        nombre: i.replace(/^-\s*/, '').trim()
      })).filter(i => i.nombre);
    }

    setTituloForm(receta.titulo);
    setDescripcionForm(receta.descripcion || '');
    setEsPrivadaForm(receta.es_privada);
    setSecretoForm(receta.secreto_familiar || '');
    setTiempoHorasForm(Math.floor(receta.tiempo_preparacion / 60));
    setTiempoMinutosForm(receta.tiempo_preparacion % 60);
    setPorcionesForm(receta.porciones || 4);
    setDificultadForm(receta.dificultad);
    setCategoriasFormMúltiples(receta.categorias_ids || []);
    setIngredientesListForm(ings.length > 0 ? ings : [{ cantidad: '', unidad_medida: 'g', nombre: '' }]);
    setPasosListForm(pasos.length > 0 ? pasos : ['']);
    setImagenPreview(receta.imagen_url || null);
    setImagenFile(null);
    setArchivosMultimedia([]);
    setCurrentScreen('edit');
  };

  const ejecutarBorradoBaseDatos = async (id: string) => {
    try {
      const { error } = await supabase.from('recetas').delete().eq('id', id);
      if (error) throw error;
      
      setSuccessToast('Receta eliminada correctamente');
      if (selectedReceta && String(selectedReceta.id) === String(id)) {
        setCurrentScreen('list');
        setSelectedReceta(null);
      }
      await fetchData();
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleBorrarRecetaClick = (id: string) => {
    setModalConfirm({
      isOpen: true,
      titulo: 'Eliminar Receta',
      mensaje: '¿Seguro que quieres borrar este plato? Se eliminará del recetario familiar de forma permanente.',
      tipo: 'danger',
      onConfirm: () => ejecutarBorradoBaseDatos(id)
    });
  };

  const handleGuardarReceta = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!currentFamiliarId) {
    alert("Error de sesión: familiar no detectado.");
    return;
  }
  
  const ingFiltrados = ingredientesListForm.filter(i => i.nombre?.trim() !== '');
  const pasosFiltrados = pasosListForm.filter(p => p.trim() !== '');

  if (!tituloForm.trim() || ingFiltrados.length === 0 || pasosFiltrados.length === 0) {
    alert('Rellena los campos obligatorios.');
    return;
  }

  setIsSaving(true);
  try {
    const totalMinutos = (Number(tiempoHorasForm) * 60) + Number(tiempoMinutosForm);
    const pasosString = pasosFiltrados.map((p, idx) => `${idx + 1}. ${p.trim()}`).join('\n');
    const ingredientesString = ingFiltrados.map(i => `- ${i.cantidad} ${i.unidad_medida} ${i.nombre}`).join('\n');
    const instrucciones = `[CATEGORIAS]\n${categoriasFormMúltiples.join(',')}\n[INGREDIENTES]\n${ingredientesString}\n[PASOS]\n${pasosString}`;

    // 1. Guardar o Actualizar Receta
    let idReceta;
    if (currentScreen === 'edit' && selectedReceta) {
      await supabase.from('recetas').update({
        titulo: tituloForm.trim(),
        instrucciones,
        tiempo_preparacion: totalMinutos,
        dificultad: Number(dificultadForm),
        categoria_id: categoriasFormMúltiples[0] || categorias[0]?.id
      }).eq('id', selectedReceta.id);
      idReceta = selectedReceta.id;
    } else {
      const { data: nueva, error: errReceta } = await supabase.from('recetas').insert([{
        titulo: tituloForm.trim(),
        instrucciones,
        tiempo_preparacion: totalMinutos,
        familiar_id: currentFamiliarId,
        categoria_id: categoriasFormMúltiples[0] || categorias[0]?.id,
        dificultad: Number(dificultadForm)
      }]).select().single();
      if (errReceta) throw errReceta;
      idReceta = nueva.id;
    }

    // 2. Gestionar ingredientes (La parte que daba error)
    // Borramos solo los ingredientes de esta receta antes de volver a insertar
    await supabase.from('receta_ingredientes').delete().eq('receta_id', idReceta);

    for (const ing of ingFiltrados) {
      // Upsert ingrediente global (asegura que exista)
      const { data: ingData } = await supabase
        .from('ingredientes')
        .upsert({ nombre: ing.nombre.trim().toLowerCase() }, { onConflict: 'nombre' })
        .select('id')
        .single();

      // Insertar relación
      await supabase.from('receta_ingredientes').insert({
        receta_id: idReceta,
        ingrediente_id: ingData.id,
        cantidad: Number(ing.cantidad),
        unidad_medida: ing.unidad_medida
      });
    }

    setSuccessToast('Receta guardada con éxito');
    await fetchData();
    setCurrentScreen('list');
  } catch (err: any) {
    alert('Error al guardar: ' + err.message);
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
      setSuccessToast('Comentario añadido');
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
    <div className="w-full h-full md:p-4 md:space-y-4 md:max-w-md md:mx-auto flex flex-col">
      <div className="fixed inset-0 w-full h-full bg-stone-50 flex flex-col overflow-hidden md:relative md:inset-auto md:h-[640px] md:bg-slate-950 md:rounded-[40px] md:p-3 md:border-4 md:border-gray-800">
        <div className="w-full flex-1 bg-stone-50 flex flex-col text-stone-800 md:rounded-[28px] md:overflow-hidden relative">
          
          {session && (
            <div className="w-full flex justify-between items-center px-4 py-2 bg-stone-900 text-stone-100 text-[10px] font-mono shrink-0 z-30 border-b border-stone-800">
              <span className="truncate max-w-[70%]">Usuario: {session.user.email}</span>
              <button 
                type="button" 
                onClick={() => supabase.auth.signOut()} 
                className="flex items-center gap-1 text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wider focus:outline-none cursor-pointer"
              >
                <LogOut className="w-3 h-3" /> Salir
              </button>
            </div>
          )}

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
                      onBorrarReceta={handleBorrarRecetaClick} 
                      onToggleSave={(e, id) => {
                        e.stopPropagation();
                        const estaGuardada = savedRecetasIds.includes(String(id));
                        if (estaGuardada) {
                          setModalConfirm({
                            isOpen: true,
                            titulo: 'Quitar Marcador',
                            mensaje: '¿Quieres eliminar este plato de tu lista de recetas guardadas?',
                            tipo: 'warning',
                            onConfirm: () => {
                              setSavedRecetasIds(p => p.filter(x => x !== String(id)));
                            }
                          });
                        } else {
                          setSavedRecetasIds(p => [...p, String(id)]);
                        }
                      }}
                      onSelectReceta={(r) => { 
                        setSelectedReceta(r); 
                        setCurrentScreen('detail'); 
                        fetchComentariosReceta(String(r.id));
                        fetchMultimediaReceta(String(r.id)); 
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
                        <span className="text-[9px] uppercase tracking-wider">Mías</span>
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
                    onBorrarReceta={handleBorrarRecetaClick} 
                    multimedia={multimediaReceta} 
                    onEditarReceta={() => handlePrellenarFormEdicion(selectedReceta)}
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
                    porcionesForm={porcionesForm} setPorcionesForm={setPorcionesForm}
                    dificultadForm={dificultadForm} setDificultadForm={setDificultadForm} categorias={categorias} categoriasFormMúltiples={categoriasFormMúltiples}
                    onToggleFormCategory={(id) => setCategoriasFormMúltiples(p => p.includes(id) ? p.filter(x => x !== id) : p.length >= 3 ? p : [...p, id])}
                    ingredientesListForm={ingredientesListForm} 
                    handleIngredientChange={(i, k, v) => { const c = [...ingredientesListForm]; c[i] = { ...c[i], [k]: v }; setIngredientesListForm(c); }}
                    addIngredientField={() => setIngredientesListForm([...ingredientesListForm, { cantidad: '', unidad_medida: 'g', nombre: '' }])}
                    pasosListForm={pasosListForm} handlePasoChange={(i, v) => { const c = [...pasosListForm]; c[i] = v; setPasosListForm(c); }}
                    addPasoField={() => setPasosListForm([...pasosListForm, ''])}
                    imagenPreview={imagenPreview} handleImagenChange={(e) => { const f = e.target.files?.[0]; if (f) { setImagenFile(f); setImagenPreview(URL.createObjectURL(f)); } }}
                    isSaving={isSaving} obtenerColorCirculo={obtenerColorCirculo}
                    archivosMultimedia={archivosMultimedia} 
                    setArchivosMultimedia={setArchivosMultimedia} 
                  />
                )}

                {currentScreen === 'edit' && (
                  <VistaCrear
                    isEditing={true}
                    onBack={() => setCurrentScreen('detail')} onSubmit={handleGuardarReceta}
                    tituloForm={tituloForm} setTituloForm={setTituloForm} descripcionForm={descripcionForm} setDescripcionForm={setDescripcionForm}
                    esPrivadaForm={esPrivadaForm} setEsPrivadaForm={setEsPrivadaForm} secretoForm={secretoForm} setSecretoForm={setSecretoForm}
                    tiempoHorasForm={tiempoHorasForm} setTiempoHorasForm={setTiempoHorasForm} tiempoMinutosForm={tiempoMinutosForm} setTiempoMinutosForm={setTiempoMinutosForm}
                    porcionesForm={porcionesForm} setPorcionesForm={setPorcionesForm}
                    dificultadForm={dificultadForm} setDificultadForm={setDificultadForm} categorias={categorias} categoriasFormMúltiples={categoriasFormMúltiples}
                    onToggleFormCategory={(id) => setCategoriasFormMúltiples(p => p.includes(id) ? p.filter(x => x !== id) : p.length >= 3 ? p : [...p, id])}
                    ingredientesListForm={ingredientesListForm}
                    handleIngredientChange={(i, k, v) => { const c = [...ingredientesListForm]; c[i] = { ...c[i], [k]: v }; setIngredientesListForm(c); }}
                    addIngredientField={() => setIngredientesListForm([...ingredientesListForm, { cantidad: '', unidad_medida: 'g', nombre: '' }])}
                    pasosListForm={pasosListForm} handlePasoChange={(i, v) => { const c = [...pasosListForm]; c[i] = v; setPasosListForm(c); }}
                    addPasoField={() => setPasosListForm([...pasosListForm, ''])}
                    imagenPreview={imagenPreview} handleImagenChange={(e) => { const f = e.target.files?.[0]; if (f) { setImagenFile(f); setImagenPreview(URL.createObjectURL(f)); } }}
                    isSaving={isSaving} obtenerColorCirculo={obtenerColorCirculo}
                    archivosMultimedia={archivosMultimedia} 
                    setArchivosMultimedia={setArchivosMultimedia} 
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

          <ModalConfirmacion 
            isOpen={modalConfirm.isOpen}
            titulo={modalConfirm.titulo}
            mensaje={modalConfirm.mensaje}
            tipo={modalConfirm.tipo}
            onClose={() => setModalConfirm(prev => ({ ...prev, isOpen: false }))}
            onConfirm={modalConfirm.onConfirm}
          />

        </div>
      </div>
    </div>
  );
}