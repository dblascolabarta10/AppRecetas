// src/components/recetas/PantallaPrincipalRecetas.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { Receta, Categoria, ComentarioFamiliar } from '../../types/recetas';
import { obtenerColorCirculo } from '../../utils/recetasHelpers';
import { Search, ChefHat, Bookmark } from 'lucide-react';

// Importación de módulos divididos
import VistaLista from './VistaLista';
import VistaDetalle from './VistaDetalle';
import VistaCrear from './VistaCrear';
import PanelFiltros from './PanelFiltros';

export default function PantallaPrincipalRecetas() {
  const [currentScreen, setCurrentScreen] = useState<'list' | 'detail' | 'create'>('list');
  const [selectedReceta, setSelectedReceta] = useState<Receta | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'saved' | 'mine' | 'search'>('search');

  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [comentarios, setComentarios] = useState<ComentarioFamiliar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentFamiliarId, setCurrentFamiliarId] = useState<string>('');
  const [savedRecetasIds, setSavedRecetasIds] = useState<string[]>(() => {
    const local = localStorage.getItem('recetas_guardadas_familia');
    return local ? JSON.parse(local) : [];
  });

  // Estados de filtros
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<number[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [minTime, setMinTime] = useState<number>(0);
  const [maxTime, setMaxTime] = useState<number>(180);
  const [timeRange, setTimeRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'old'>('recent');

  // Estados del formulario
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

  // 🔥 RESTAURADA: Función que limpia todos los filtros de la interfaz
  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedDifficulties([]);
    setSelectedRatings([]);
    setMinTime(0);
    setMaxTime(180);
    setTimeRange('all');
    setSortBy('recent');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: dbCats } = await supabase.from('categorias').select('id, nombre');
      setCategorias(dbCats || []);

      const { data: fams } = await supabase.from('familiares').select('id').limit(1);
      if (fams?.length) setCurrentFamiliarId(fams[0].id);

      const { data: recs } = await supabase
        .from('recetas')
        .select(`
          id, titulo, descripcion, instrucciones, tiempo_preparacion, fecha_creacion, imagen_url, dificultad, categoria_id, secreto_familiar, valoracion_media, familiar_id, es_privada,
          familiares ( nombre ),
          receta_ingredientes ( cantidad, unidad_medida, es_opcional, ingredientes ( nombre ) ),
          comentarios_valoraciones ( id )
        `)
        .order('fecha_creacion', { ascending: false });

      if (recs) {
        const mapeadas = recs.map((r: any) => ({
          ...r,
          receta_ingredientes: r.receta_ingredientes?.map((ri: any) => ({
            cantidad: Number(ri.cantidad || 0),
            unidad_medida: ri.unidad_medida || 'unidades',
            nombre_ingrediente: ri.ingredientes?.nombre || 'Ingrediente',
            es_opcional: !!ri.es_opcional
          })) || [],
          categorias_ids: r.categoria_id ? [r.categoria_id] : [],
          num_valoraciones: r.comentarios_valoraciones?.length || 0,
          autor_nombre: r.familiares?.nombre || 'Familiar'
        }));
        setRecetas(mapeadas);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const mapaCategorias = useMemo(() => {
    const obj: Record<string, string> = {};
    categorias.forEach(c => { obj[c.id] = c.nombre; });
    return obj;
  }, [categorias]);

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
      if (selectedCategories.length > 0 && (!receta.categoria_id || !selectedCategories.includes(receta.categoria_id))) return false;
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

  return (
    <div className="w-full h-full md:p-4 md:space-y-4 md:max-w-md md:mx-auto">
      <div className="fixed inset-0 w-full h-full bg-stone-50 flex flex-col overflow-hidden md:relative md:inset-auto md:h-[640px] md:bg-slate-950 md:rounded-[40px] md:p-3 md:border-4 md:border-gray-800">
        <div className="w-full flex-1 bg-stone-50 flex flex-col text-stone-800 md:rounded-[28px] md:overflow-hidden relative">
          <div className="flex-1 flex flex-col relative overflow-hidden">
            
            {currentScreen === 'list' && (
              <>
                <VistaLista
                  recetas={recetasFiltradas} loading={loading} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                  activeTab={activeTab} currentFamiliarId={currentFamiliarId}
                  savedRecetasIds={savedRecetasIds} mapaCategorias={mapaCategorias}
                  onToggleSave={(e, id) => setSavedRecetasIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])}
                  onSelectReceta={(r) => { setSelectedReceta(r); setCurrentScreen('detail'); }}
                  onOpenFilters={() => setIsFilterPanelOpen(true)} onGoToCreate={() => setCurrentScreen('create')}
                />

                <div className="absolute bottom-0 inset-x-0 h-14 bg-amber-600 text-amber-100 flex items-center justify-around z-20 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-2">
                  <button 
                    type="button" onClick={() => setActiveTab('saved')}
                    className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-150 focus:outline-none ${
                      activeTab === 'saved' ? 'text-white scale-105 font-black' : 'opacity-70 hover:text-white'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 mb-0.5 ${activeTab === 'saved' ? 'fill-white stroke-[2.5]' : ''}`} />
                    <span className="text-[9px] uppercase tracking-wider">Guardadas</span>
                  </button>

                  <button 
                    type="button" onClick={() => setActiveTab('mine')}
                    className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-150 focus:outline-none ${
                      activeTab === 'mine' ? 'text-white scale-105 font-black' : 'opacity-70 hover:text-white'
                    }`}
                  >
                    <ChefHat className="w-4 h-4 mb-0.5" />
                    <span className="text-[9px] uppercase tracking-wider">Mías</span>
                  </button>

                  <button 
                    type="button" onClick={() => setActiveTab('search')}
                    className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-150 focus:outline-none ${
                      activeTab === 'search' ? 'text-white scale-105 font-black' : 'opacity-70 hover:text-white'
                    }`}
                  >
                    <Search className="w-4 h-4 mb-0.5 stroke-[2.5]" />
                    <span className="text-[9px] uppercase tracking-wider">Buscar</span>
                  </button>
                </div>
              </>
            )}

            {currentScreen === 'detail' && selectedReceta && (
              <VistaDetalle
                receta={selectedReceta} comentarios={comentarios} onBack={() => setCurrentScreen('list')}
                mapaCategorias={mapaCategorias}
                renderEstrellasComentario={(n) => <span className="text-amber-500">{'★'.repeat(n)}</span>}
              />
            )}

            {currentScreen === 'create' && (
              <VistaCrear
                onBack={() => setCurrentScreen('list')} onSubmit={(e) => { e.preventDefault(); }}
                tituloForm={tituloForm} setTituloForm={setTituloForm} descripcionForm={descripcionForm} setDescripcionForm={setDescripcionForm}
                esPrivadaForm={esPrivadaForm} setEsPrivadaForm={setEsPrivadaForm} secretoForm={secretoForm} setSecretoForm={setSecretoForm}
                tiempoHorasForm={tiempoHorasForm} setTiempoHorasForm={setTiempoHorasForm} tiempoMinutosForm={tiempoMinutosForm} setTiempoMinutosForm={setTiempoMinutosForm}
                dificultadForm={dificultadForm} setDificultadForm={setDificultadForm} categorias={categorias} categoriasFormMúltiples={categoriasFormMúltiples}
                onToggleFormCategory={(id) => setCategoriasFormMúltiples(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])}
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
          </div>
        </div>
      </div>
    </div>
  );
}