import axios from 'axios';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

// Cliente HTTP para toda la aplicación (equivale a ApiClient en Android)
export const api = axios.create({ baseURL: API_URL, timeout: 60000 });

// ---------- Sesión guardada en el navegador ----------
const leerJSON = (clave) => {
  try {
    return JSON.parse(localStorage.getItem(clave));
  } catch {
    return null;
  }
};

export const sesion = {
  guardar({ accessToken, refreshToken, usuario }) {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    if (usuario) localStorage.setItem('usuario', JSON.stringify(usuario));
  },
  accessToken: () => localStorage.getItem('accessToken'),
  refreshToken: () => localStorage.getItem('refreshToken'),
  refreshAnterior: () => localStorage.getItem('refreshAnterior'),
  usuario: () => leerJSON('usuario'),
  actualizarUsuario(parcial) {
    const u = { ...(leerJSON('usuario') || {}), ...parcial };
    localStorage.setItem('usuario', JSON.stringify(u));
    return u;
  },
  limpiar() {
    ['accessToken', 'refreshToken', 'usuario', 'refreshAnterior'].forEach((k) => localStorage.removeItem(k));
  }
};

// ---------- Bitácora: muestra en vivo el flujo de renovación de tokens ----------
const oyentes = new Set();
let eventos = [];

export const bitacora = {
  agregar(texto) {
    eventos = [{ hora: new Date().toLocaleTimeString('es-CO'), texto }, ...eventos].slice(0, 40);
    oyentes.forEach((f) => f(eventos));
  },
  lista: () => eventos,
  suscribir(f) {
    oyentes.add(f);
    return () => oyentes.delete(f);
  }
};

// ---------- Petición: agrega el access token ----------
api.interceptors.request.use((config) => {
  const token = sesion.accessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---------- Renovación con rotación del refresh token ----------
let renovando = null; // evita pedir varios /refresh a la vez

export const renovarTokens = async () => {
  const anterior = sesion.refreshToken();
  bitacora.agregar('2) Petición silenciosa a /api/auth/refresh con el refresh token');
  // Se usa axios directo (no "api") para no entrar de nuevo en el interceptor
  const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken: anterior });
  bitacora.agregar('3) El servidor verificó el refresh token en la base de datos');
  bitacora.agregar('4) Rotación: el token viejo quedó invalidado y llegó un par nuevo');
  localStorage.setItem('refreshAnterior', anterior);
  sesion.guardar(data);
  return data.accessToken;
};

// ---------- Respuesta: si el token venció, renueva y repite la petición ----------
api.interceptors.response.use(
  (respuesta) => respuesta,
  async (error) => {
    const original = error.config;
    const codigo = error.response?.data?.codigo;
    const vencido =
      error.response?.status === 401 && (codigo === 'TOKEN_EXPIRADO' || codigo === 'TOKEN_INVALIDO');

    if (!vencido || !original || original._reintento || !sesion.refreshToken()) {
      return Promise.reject(error);
    }
    original._reintento = true;
    bitacora.agregar(`1) La API respondió 401 ${codigo} en ${String(original.method).toUpperCase()} ${original.url}`);

    try {
      renovando = renovando || renovarTokens().finally(() => { renovando = null; });
      const nuevoAccess = await renovando;
      original.headers.Authorization = `Bearer ${nuevoAccess}`;
      bitacora.agregar('5) Se reintenta la petición original; el usuario no nota la interrupción');
      return api(original);
    } catch (e) {
      bitacora.agregar('✖ No se pudo renovar: se cerró la sesión');
      sesion.limpiar();
      window.dispatchEvent(new Event('drobeus:sesion-cerrada'));
      return Promise.reject(e);
    }
  }
);

// ---------- Mensajes de error legibles ----------
export const errorTexto = (e) => {
  const data = e?.response?.data;
  if (data?.mensaje === 'Ruta no encontrada') {
    return 'El servidor aún no tiene esta función. Actualiza el backend en Render.';
  }
  if (data?.mensaje) return data.detalle ? `${data.mensaje} (${data.detalle})` : data.mensaje;
  if (!e?.response) {
    return 'Sin conexión con el servidor. Si Render estaba dormido, espera un minuto e intenta de nuevo.';
  }
  return `Error ${e.response.status}`;
};
