import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL, api, bitacora, errorTexto, renovarTokens, sesion } from '../api.js';

const decodificar = (token) => {
  try {
    const cuerpo = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(cuerpo));
  } catch {
    return null;
  }
};

const corto = (t) => (t ? `${t.slice(0, 28)}…${t.slice(-8)}` : '—');

// Panel para demostrar en clase el flujo de rotación de refresh tokens
export default function Sesion() {
  const [, repintar] = useState(0);
  const [eventos, setEventos] = useState(bitacora.lista());
  const [segundos, setSegundos] = useState(null);
  const [resultado, setResultado] = useState('');

  useEffect(() => bitacora.suscribir(setEventos), []);

  // Cuenta regresiva hasta que venza el access token
  useEffect(() => {
    const tick = () => {
      const p = decodificar(sesion.accessToken() || '');
      setSegundos(p?.exp ? Math.round(p.exp - Date.now() / 1000) : null);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [eventos]);

  const probar = async () => {
    try {
      const { data } = await api.get('/api/materias');
      setResultado(`Petición protegida correcta: ${data.total ?? 0} materias`);
    } catch (e) {
      setResultado(errorTexto(e));
    }
    repintar((n) => n + 1);
  };

  const simularVencido = () => {
    localStorage.setItem('accessToken', 'token.vencido.simulado');
    bitacora.agregar('Se dañó el access token a propósito. Ahora prueba una petición protegida.');
    setResultado('Access token dañado. Pulsa "Probar petición protegida" y mira la bitácora.');
    repintar((n) => n + 1);
  };

  const renovarAhora = async () => {
    try {
      await renovarTokens();
      setResultado('Tokens renovados: el refresh token anterior quedó invalidado.');
    } catch (e) {
      setResultado(errorTexto(e));
    }
    repintar((n) => n + 1);
  };

  const robo = async () => {
    const viejo = sesion.refreshAnterior();
    if (!viejo) {
      setResultado('Primero renueva los tokens para tener un refresh token anterior.');
      return;
    }
    if (!window.confirm('Reutilizar un refresh token viejo simula un robo y el servidor cerrará TODAS tus sesiones. ¿Continuar?')) return;
    try {
      await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken: viejo });
      setResultado('Inesperado: el servidor aceptó el token viejo.');
    } catch (e) {
      bitacora.agregar('El servidor detectó la reutilización y revocó todas las sesiones');
      setResultado(errorTexto(e));
    }
    repintar((n) => n + 1);
  };

  const payload = decodificar(sesion.accessToken() || '');

  return (
    <>
      <h1 className="titulo izq">Sesión y tokens</h1>
      <p className="texto-chico">
        El access token dura 15 minutos. Cuando vence, la API responde 401 y la app renueva todo sola con el refresh token.
      </p>

      <div className="tarjeta datos">
        <div><span className="etiqueta">Access token</span><code>{corto(sesion.accessToken())}</code></div>
        <div>
          <span className="etiqueta">Vence en</span>
          <strong>{segundos === null ? '—' : segundos > 0 ? `${segundos} s` : 'vencido'}</strong>
          {payload?.exp && <span className="texto-chico"> ({new Date(payload.exp * 1000).toLocaleTimeString('es-CO')})</span>}
        </div>
        <div><span className="etiqueta">Refresh token</span><code>{corto(sesion.refreshToken())}</code></div>
        <div><span className="etiqueta">Refresh anterior (invalidado)</span><code>{corto(sesion.refreshAnterior())}</code></div>
      </div>

      <div className="fila-botones">
        <button className="boton" onClick={probar}>Probar petición protegida</button>
        <button className="boton secundario" onClick={simularVencido}>Simular token vencido</button>
        <button className="boton secundario" onClick={renovarAhora}>Renovar ahora</button>
        <button className="boton secundario" onClick={robo}>Reusar refresh viejo (robo)</button>
      </div>
      {resultado && <p className="ok">{resultado}</p>}

      <h2 className="etiqueta">Bitácora del interceptor</h2>
      {eventos.length === 0 && <p className="vacio">Aún no hay eventos.</p>}
      <ul className="bitacora">
        {eventos.map((ev, i) => (
          <li key={`${ev.hora}-${i}`}><span>{ev.hora}</span> {ev.texto}</li>
        ))}
      </ul>
    </>
  );
}
