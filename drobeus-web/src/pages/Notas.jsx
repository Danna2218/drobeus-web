import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorTexto } from '../api.js';
import { useSesion } from '../context.jsx';
import { promedioTexto } from '../util.js';

// Notas: promedio del periodo y de cada materia
export default function Notas() {
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const [periodo, setPeriodo] = useState(usuario?.periodoActual || '');
  const [borrador, setBorrador] = useState(periodo);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const { data } = await api.get('/api/notas/promedio', { params: { periodo: periodo || undefined } });
        if (activo) {
          setDatos(data);
          setError('');
        }
      } catch (e) {
        if (activo) setError(errorTexto(e));
      }
    })();
    return () => {
      activo = false;
    };
  }, [periodo]);

  return (
    <>
      <h1 className="titulo izq">Notas</h1>
      <form className="fila" onSubmit={(e) => { e.preventDefault(); setPeriodo(borrador.trim()); }}>
        <span className="texto-chico">Semestre</span>
        <input className="corto" value={borrador} onChange={(e) => setBorrador(e.target.value)} placeholder="2026-2" />
        <button className="boton chico">Ver</button>
      </form>
      {error && <p className="error">{error}</p>}

      <div className="tarjeta grande-numero">
        <span className="etiqueta">Promedio del periodo</span>
        <div className="numero">{promedioTexto(datos?.promedioPeriodo)}</div>
      </div>

      {datos?.materias?.length === 0 && <p className="vacio">Aún no tienes materias en este periodo.</p>}
      {datos?.materias?.map((m) => (
        <div className="item clic" key={m.materiaId}
          onClick={() => navegar(`/materias/${m.materiaId}?tab=notas`)}>
          <span className="punto" style={{ background: m.color || '#fff' }} />
          <div className="crece">
            <div className="item-titulo">{m.materia}</div>
            <div className="item-detalle">
              {m.totalNotas} {m.totalNotas === 1 ? 'nota registrada' : 'notas registradas'}
            </div>
          </div>
          <div className="numero chico">{promedioTexto(m.promedio)}</div>
        </div>
      ))}
      <p className="texto-chico centro">Toca una materia para ver y registrar sus notas</p>
    </>
  );
}
