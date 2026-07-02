// src/App.jsx
import React, { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from './supabaseClient';
import PantallaPrincipalRecetas from './components/recetas/PantallaPrincipalRecetas';

export default function App() {
  useEffect(() => {
    const buscarUrlYEstablecerSesion = CapApp.addListener('appUrlOpen', async (data) => {
      const urlDeRetorno = data.url;

      // Flexibilizamos la condicion: con que venga el access_token nos vale para intentar entrar
      if (urlDeRetorno.includes('access_token')) {
        try {
          const parteDelHash = urlDeRetorno.split('#')[1];
          const parametrosUrl = new URLSearchParams(parteDelHash);
          
          const tokenDeAcceso = parametrosUrl.get('access_token');
          const tokenDeRefresco = parametrosUrl.get('refresh_token');

          if (tokenDeAcceso) {
            // Seteamos la sesion y recuperamos si el cliente de Supabase devuelve algun error oculto
            const { error } = await supabase.auth.setSession({
              access_token: tokenDeAcceso,
              refresh_token: tokenDeRefresco || '' // Si no hay token de refresco, pasamos cadena vacia para que no de undefined
            });

            if (error) throw error;

            // Si llega aqui, el estado global de Supabase cambia y la vista se conmuta sola
            alert('¡Exito! Sesion vinculada correctamente en el dispositivo.');
          } else {
            alert('Error: El parametro access_token venia vacio dentro del hash.');
          }
        } catch (err) {
          // Si supabase.auth.setSession explota, lo veras aqui en tu pantalla
          alert('Error critico de Supabase al procesar la sesion: ' + err.message);
        }
      } else if (urlDeRetorno.includes('error')) {
        alert('Error devuelto por el proveedor de autenticacion: ' + urlDeRetorno);
      }

      // Cerramos el navegador de forma segura tras procesar los datos
      await Browser.close();
    });

    return () => {
      buscarUrlYEstablecerSesion.then(h => h.remove());
    };
  }, []);

  return <PantallaPrincipalRecetas />;
}