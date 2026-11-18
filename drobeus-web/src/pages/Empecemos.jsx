import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorTexto } from '../api.js';
import { useSesion } from '../context.jsx';
import ImportarHorario from '../components/ImportarHorario.jsx';

// Primera vez: datos académicos 
export default function Empecemos() {
  const { usuario, actualizarUsuario } = useSesion();
  const navegar = useNavigate();
  const [institucion, setInstitucion] = useState(usuario?.institucion || '');
  const [carrera, setCarrera] = useState(usuario?.carrera || '');
  const [periodo, setPeriodo] = useState(usuario?.periodoActual || '2026-2');
  const [archivo, setArchivo] = useState(null);
  const [importando, setImportando] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const iniciar = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await api.put(`/api/auth/perfil/${usuario.id}`, {
        institucion: institucion.trim(),
        carrera: carrera.trim(),
        periodoActual: periodo.trim()
      });
      actualizarUsuario({ institucion: institucion.trim(), carrera: carrera.trim(), periodoActual: periodo.trim() });
      if (archivo) setImportando(true);
      else navegar('/', { replace: true });
    } catch (err) {
      setError(errorTexto(err));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="pantalla-centro">
      <form className="tarjeta-form" onSubmit={iniciar}>
        <h1 className="titulo">Empecemos !</h1>

        <input value={institucion} onChange={(e) => setInstitucion(e.target.value)}
          placeholder="Universidad - Colegio" required />
        <input value={carrera} onChange={(e) => setCarrera(e.target.value)} placeholder="Carrera" required />
        <input value={periodo} onChange={(e) => setPeriodo(e.target.value)}
          placeholder="Semestre - Grado (ej. 2026-2)" required />

        <label className="boton ancho archivo">
          {archivo ? `Horario cargado ✓ (${archivo.name})` : 'Carga aquí tu horario'}
          <input type="file" hidden
            accept="image/*,.pdf,.docx,.txt,application/pdf,text/plain"
            onChange={(e) => setArchivo(e.target.files[0] || null)} />
        </label>
        <p className="texto-chico centro">Imagen, PDF, Word o texto. La IA organiza tus materias sola.</p>

        {error && <p className="error">{error}</p>}
        <button className="boton ancho" disabled={cargando}>{cargando ? 'Guardando...' : 'Iniciar'}</button>
      </form>

      {importando && (
        <ImportarHorario
          archivo={archivo}
          periodo={periodo.trim()}
          totalActual={0}
          alTerminar={() => navegar('/', { replace: true })}
        />
      )}
    </div>
  );
}
