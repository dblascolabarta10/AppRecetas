// src/App.jsx
import { useEffect } from 'react';
import { supabase } from './supabaseClient';
import PantallaPrincipalRecetas from './components/recetas/PantallaPrincipalRecetas';
function App() {
  useEffect(() => {
    async function testConexion() {
      const { data, error } = await supabase.from('recetas').select('*');
      if (error) {
        console.error("❌ ¡Error de conexión con Supabase!:", error.message);
      } else {
        console.log("✅ ¡Conexión con Supabase exitosa! Datos recibidos:", data);
      }
    }
    testConexion();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 w-full flex items-center justify-center p-4 m-0 box-border">
      <PantallaPrincipalRecetas />
    </div>
  );
}

export default App;