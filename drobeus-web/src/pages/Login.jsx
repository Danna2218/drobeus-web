import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api, errorTexto } from '../api.js';
import { useSesion } from '../context.jsx';

export default function Login() {
  const { usuario, guardarSesion } = useSesion();
  const navegar = useNavigate();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  const entrar = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      // La API devuelve los datos del usuario, el access token y el refresh token
      const { data } = await api.post('/api/auth/login', { correo: correo.trim(), contrasena: clave });
      guardarSesion(data);
      navegar(data.usuario?.institucion ? '/' : '/empecemos', { replace: true });
    } catch (err) {
      setError(errorTexto(err));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="pantalla-centro">
      <form className="tarjeta-form" onSubmit={entrar}>
        <h1 className="titulo">Login</h1>
        <p className="texto-chico centro">Inicia sesión para continuar.</p>

        <label className="etiqueta" htmlFor="correo">Correo</label>
        <input id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)}
          placeholder="correo@uniautonoma.edu.co" required />

        <label className="etiqueta" htmlFor="clave">Contraseña</label>
        <input id="clave" type="password" value={clave} onChange={(e) => setClave(e.target.value)}
          placeholder="******" required />

        {error && <p className="error">{error}</p>}
        <button className="boton ancho" disabled={cargando}>{cargando ? 'Entrando...' : 'Entrar'}</button>
        <p className="centro texto-chico">
          ¿Primera vez? <Link to="/registro">Crea tu cuenta</Link>
        </p>
      </form>
    </div>
  );
}
