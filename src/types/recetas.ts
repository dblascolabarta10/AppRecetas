// src/types/recetas.ts
export interface IngredienteRelacion {
  cantidad: number;
  unidad_medida: string;
  nombre_ingrediente: string;
  es_opcional: boolean;
}

export interface ComentarioFamiliar {
  id: string;
  puntuacion: number;
  comentario: string;
  fecha_creacion: string;
  familiares: {
    nombre: string;
  };
}

export interface Receta {
  id: string | number;
  titulo: string;
  descripcion?: string; 
  instrucciones: string;
  tiempo_preparacion: number;
  fecha_creacion: string; 
  imagen_url?: string;
  dificultad: number;
  valoracion_media: number; 
  num_valoraciones?: number; 
  categoria_id?: string;
  categorias_ids?: string[]; 
  secreto_familiar?: string;
  familiar_id: string;
  es_privada: boolean;
  autor_nombre?: string;
  ingredientes_lista?: string; 
  receta_ingredientes?: IngredienteRelacion[];
}

export interface Categoria {
  id: string;
  nombre: string;
}