// src/components/recetas/VistaAuth.tsx
import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { ChefHat, Lock, Mail, User, RefreshCw, Check } from 'lucide-react';

interface Props {
  onBack?: () => void;
}

export default function VistaCrear({ onBack }: Props) {
  const [isLogin, setIsFilterLogin] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [nombre, setNombre] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  //  NUEVA FUNCIÓN: LOGIN CON GOOGLE EN UN CLIC
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Cuando compiles con Capacitor para móvil, cambiaremos esto por tu Deep Link (esquema de tu app)
          redirectTo: window.location.origin 
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al conectar con Google.');
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        if (error) throw error;
      } else {
        if (!nombre.trim()) throw new Error('El nombre es obligatorio.');
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: { data: { nombre: nombre.trim() } }
        });
        if (error) throw error;
        alert('¡Alta correcta! Ya puedes iniciar sesión.');
        setIsFilterLogin(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-stone-50 w-full h-full justify-center p-6 text-left overflow-y-auto">
      <div className="w-full max-w-sm mx-auto space-y-5 bg-white p-6 rounded-3xl border border-stone-200 shadow-xl">
        
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md">
            <ChefHat className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-md font-black tracking-tight text-stone-900">Recetario Familiar</h2>
            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Acceso Seguro Delegado</p>
          </div>
        </div>

        {/*  BOTÓN MAJESTUOSO DE GOOGLE SIGN-IN */}
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="w-full h-10 bg-white hover:bg-stone-50 text-stone-700 font-sans font-bold text-xs rounded-xl border border-stone-200 shadow-3xs flex items-center justify-center gap-2.5 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.253-3.133C18.427.94 15.608 0 12.24 0 5.58 0 .134 5.373.134 12s5.446 12 12.106 12c6.96 0 12.134-4.832 12.134-12.24 0-.822-.09-1.44-.2-1.92H12.24z"/>
          </svg>
          <span>Continuar con Google</span>
        </button>

        <div className="flex items-center my-4 before:flex-1 before:border-t before:border-stone-200 after:flex-1 after:border-t after:border-stone-200">
          <span className="mx-3 text-[9px] text-stone-400 font-bold uppercase tracking-wider">O usar correo</span>
        </div>

        {/* Conmutador */}
        <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
          <button type="button" onClick={() => setIsFilterLogin(true)} className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${isLogin ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-400'}`}>Entrar</button>
          <button type="button" onClick={() => setIsFilterLogin(false)} className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${!isLogin ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-400'}`}>Registrarse</button>
        </div>

        {errorMsg && <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[9px] font-mono font-bold">⚠️ {errorMsg}</div>}

        <form onSubmit={handleAuthSubmit} className="space-y-3.5">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-stone-400 uppercase">Nombre</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
                <input type="text" required placeholder="Tía Enriqueta" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-stone-50 border border-stone-200 pl-9 pr-3 py-1.5 rounded-xl text-xs outline-none focus:border-amber-500" />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-stone-400 uppercase">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
              <input type="email" required placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-stone-50 border border-stone-200 pl-9 pr-3 py-1.5 rounded-xl text-xs outline-none focus:border-amber-500" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-stone-400 uppercase">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
              <input type="password" required minLength={6} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-stone-50 border border-stone-200 pl-9 pr-3 py-1.5 rounded-xl text-xs outline-none focus:border-amber-500" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-2 bg-amber-600 text-white font-mono font-bold text-[10px] uppercase rounded-xl flex items-center justify-center gap-1.5 shadow-md">
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
            {isLogin ? 'Entrar con correo' : 'Crear Cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}