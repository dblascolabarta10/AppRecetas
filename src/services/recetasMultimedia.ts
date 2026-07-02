import { supabase } from '../supabaseClient';

interface ArchivoSubido {
  file: File;
  tipo: 'foto' | 'video';
}

/**
 * Sube hasta 5 archivos a Supabase Storage y los registra en la tabla recetas_multimedia
 */
export const subirMultimediaReceta = async (recetaId: string, archivos: ArchivoSubido[]): Promise<void> => {
  if (archivos.length === 0) return;

  // Procesamos las subidas en paralelo para mejorar la velocidad en el movil
  const promesasSubida = archivos.map(async (item, indice) => {
    const extension = item.file.name.split('.').pop();
    // Creamos un nombre unico para evitar colisiones de archivos con el mismo nombre
    const nombreArchivo = `${Date.now()}_${indice}.${extension}`;
    const rutaAlmacenamiento = `recetas/${recetaId}/${nombreArchivo}`;

    // 1. Subir el archivo fisico al Bucket de Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('multimedia-recetas')
      .upload(rutaAlmacenamiento, item.file, {
        cacheControl: '3600',
        upsert: false
      });

    if (storageError) throw new Error(`Error en Storage (${item.file.name}): ${storageError.message}`);

    // 2. Obtener la URL publica del archivo que acabamos de subir
    const { data: publicUrlData } = supabase.storage
      .from('multimedia-recetas')
      .getPublicUrl(rutaAlmacenamiento);

    if (!publicUrlData?.publicUrl) throw new Error(`No se pudo generar la URL publica para ${item.file.name}`);

    // Devolvemos el objeto estructurado listo para el insert masivo
    return {
      receta_id: recetaId,
      url: publicUrlData.publicUrl,
      tipo: item.tipo,
      orden: indice
    };
  });

  // Esperamos a que todos los archivos terminen de subirse a la nube
  const registrosMultimedia = await Promise.all(promesasSubida);

  // 3. Insertar las URLs y metadatos en la tabla de la base de datos
  const { error: insertError } = await supabase
    .from('recetas_multimedia')
    .insert(registrosMultimedia);

  if (insertError) throw new Error(`Error al registrar la multimedia en la BDD: ${insertError.message}`);
};