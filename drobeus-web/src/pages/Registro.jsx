import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api, errorTexto } from '../api.js';
import { useSesion } from '../context.jsx';

export default function Registro() {
  const { usuario, guardarSesion } = useSesion();
  const navegar = useNavigate();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  const registrar = async (e) => {
    e.preventDefault();
    setError('');
    if (clave.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres');
      return;
    }
    setCargando(true);
    try {
      const { data } = await api.post('/api/auth/registro', {
        nombre: nombre.trim(),
        correo: correo.trim(),
        contrasena: clave
      });
      guardarSesion(data);
      navegar('/empecemos', { replace: true });
    } catch (err) {
      setError(errorTexto(err));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="pantalla-centro">
      <form className="tarjeta-form" onSubmit={registrar}>
        <h1 className="titulo">Crear cuenta</h1>
        <p className="texto-chico centro">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí.</Link>
        </p>

        <label className="etiqueta" htmlFor="nombre">Nombre</label>
        <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)}
          placeholder="Danna Campo" required />

        <label className="etiqueta" htmlFor="correo">Correo</label>
        <input id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)}
          placeholder="correo@uniautonoma.edu.co" required />

        <label className="etiqueta" htmlFor="clave">Contraseña</label>
        <input id="clave" type="password" value={clave} onChange={(e) => setClave(e.target.value)}
          placeholder="Mínimo 6 caracteres" required />

        {error && <p className="error">{error}</p>}
        <button className="boton ancho" disabled={cargando}>{cargando ? 'Creando cuenta...' : 'Registrarme'}</button>
      </form>
    </div>
  );
}
