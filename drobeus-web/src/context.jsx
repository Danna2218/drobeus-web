import { createContext, useContext, useEffect, useState } from 'react';
import { api, sesion } from './api.js';

const Contexto = createContext(null);

// Guarda al usuario en memoria y avisa a toda la app cuando entra o sale
export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(sesion.usuario());

  // El interceptor avisa si no pudo renovar los tokens
  useEffect(() => {
    const cerrar = () => setUsuario(null);
    window.addEventListener('drobeus:sesion-cerrada', cerrar);
    return () => window.removeEventListener('drobeus:sesion-cerrada', cerrar);
  }, []);

  const guardarSesion = (datos) => {
    sesion.guardar(datos);
    setUsuario(sesion.usuario());
  };

  const actualizarUsuario = (parcial) => setUsuario(sesion.actualizarUsuario(parcial));

  // Cambiar de cuenta: se revoca el refresh token en el servidor y se borra la sesión local
  const salir = async () => {
    try {
      await api.post('/api/auth/logout', { refreshToken: sesion.refreshToken() });
    } catch {
      /* sin conexión: igual se cierra localmente */
    }
    sesion.limpiar();
    setUsuario(null);
  };

  return (
    <Contexto.Provider value={{ usuario, guardarSesion, actualizarUsuario, salir }}>
      {children}
    </Contexto.Provider>
  );
}

export const useSesion = () => useContext(Contexto);
