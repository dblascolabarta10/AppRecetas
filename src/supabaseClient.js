// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Extraemos las variables usando import.meta.env en Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    '⚠️ Faltan las variables de entorno de Supabase. Revisa tu archivo .env o .env.local'
  );
}

// Inicialización del cliente singleton de Supabase
export const supabase = createClient(supabaseUrl, supabasePublishableKey);