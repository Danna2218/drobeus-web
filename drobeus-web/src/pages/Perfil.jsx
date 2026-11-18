import { useEffect, useState } from 'react';
import { api, errorTexto } from '../api.js';
import { useSesion } from '../context.jsx';
import Formulario from '../components/Formulario.jsx';

// Mi perfil: ver y editar mis datos, cerrar sesión o eliminar la cuenta
export default function Perfil() {
  const { usuario, actualizarUsuario, salir } = useSesion();
  const [valores, setValores] = useState({
    nombre: usuario?.nombre || '',
    institucion: usuario?.institucion || '',
    carrera: usuario?.carrera || '',
    periodoActual: usuario?.periodoActual || ''
  });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/auth/yo');
        const u = data.usuario;
        setValores({
          nombre: u.nombre || '',
          institucion: u.institucion || '',
          carrera: u.carrera || '',
          periodoActual: u.periodoActual || ''
        });
      } catch (e) {
        setError(errorTexto(e));
      }
    })();
  }, []);

  const cambiar = (campo) => (e) => setValores({ ...valores, [campo]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');
    try {
      await api.put(`/api/auth/perfil/${usuario.id}`, valores);
      actualizarUsuario(valores);
      setMensaje('Perfil actualizado');
    } catch (err) {
      setError(errorTexto(err));
    }
  };

  // Eliminar la cuenta pide la contraseña para confirmar
  const eliminarCuenta = async (v) => {
    if (!v.contrasena) return 'Escribe tu contraseña para confirmar';
    await api.delete('/api/auth/cuenta', { data: { contrasena: v.contrasena } });
    await salir();
    return null;
  };

  return (
    <>
      <h1 className="titulo izq">Mi perfil</h1>
      <p className="texto-chico">{usuario?.correo}</p>

      <form onSubmit={guardar}>
        <label className="etiqueta">Nombre</label>
        <input value={valores.nombre} onChange={cambiar('nombre')} required />
        <label className="etiqueta">Universidad - Colegio</label>
        <input value={valores.institucion} onChange={cambiar('institucion')} />
        <label className="etiqueta">Carrera</label>
        <input value={valores.carrera} onChange={cambiar('carrera')} />
        <label className="etiqueta">Periodo actual</label>
        <input value={valores.periodoActual} onChange={cambiar('periodoActual')} placeholder="2026-2" />

        {mensaje && <p className="ok">{mensaje}</p>}
        {error && <p className="error">{error}</p>}
        <div className="fila-botones">
          <button className="boton">Guardar cambios</button>
          <button type="button" className="boton secundario" onClick={salir}>Cerrar sesión</button>
          <button type="button" className="boton secundario" onClick={() => setConfirmarBorrado(true)}>
            Eliminar mi cuenta
          </button>
        </div>
      </form>

      {confirmarBorrado && (
        <Formulario
          titulo="Eliminar mi cuenta"
          ayuda="Se borrarán tu cuenta y todos tus datos (materias, apuntes, archivos, tareas y notas). No se puede deshacer."
          textoGuardar="Eliminar"
          campos={[{ nombre: 'contrasena', etiqueta: 'Tu contraseña', tipo: 'clave', valor: '' }]}
          onGuardar={eliminarCuenta}
          onCerrar={() => setConfirmarBorrado(false)}
        />
      )}
    </>
  );
}
