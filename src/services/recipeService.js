// src/services/recipeService.js
import { supabase } from '../supabaseClient';

/**
 * Obtiene todas las recetas familiares, ordenadas de las más recientes a las más antiguas.
 * Gracias a las políticas de seguridad RLS en PostgreSQL, si el usuario está autenticado
 * verá también recetas marcadas como "privadas", si no, solo las públicas.
 */
export async function obtenerRecetas() {
  try {
    const { data, error } = await supabase
      .from('recetas')
      .select(`
        id,
        nombre,
        descripcion,
        tiempo_preparacion,
        dificultad,
        es_privada,
        valoracion_media,
        fecha_creacion,
        familiares (
          nombre,
          rol_familiar
        ),
        categorias (
          nombre
        )
      `)
      .order('fecha_creacion', { ascending: false });

    if (error) {
      console.error('Error al consultar recetas:', error.message);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Error inesperado en obtenerRecetas:', err);
    return { data: null, error: err };
  }
}