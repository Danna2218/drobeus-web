import { useEffect, useState } from 'react';
import { api, errorTexto } from '../api.js';
import { useSesion } from '../context.jsx';
import { diaDeHoy } from '../util.js';

// Inicio: clases de hoy y tareas por entregar (datos reales desde la API)
export default function Home() {
  const { usuario } = useSesion();
  const [clases, setClases] = useState(null);
  const [pendientes, setPendientes] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const [c, p] = await Promise.all([
          api.get('/api/materias/hoy', { params: { dia: diaDeHoy() } }),
          api.get('/api/tareas/pendientes')
        ]);
        if (!activo) return;
        setClases(c.data.clases || []);
        setPendientes(p.data.pendientes || []);
      } catch (e) {
        if (activo) setError(errorTexto(e));
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  return (
    <>
      <h1 className="titulo izq">Hola, {usuario?.nombre?.split(' ')[0]}</h1>
      <p className="texto-chico">
        {new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })} · Semestre {usuario?.periodoActual}
      </p>
      {error && <p className="error">{error}</p>}

      <h2 className="etiqueta">Horario de hoy</h2>
      {clases === null && !error && <div className="cargando" />}
      {clases && clases.length === 0 && <p className="vacio">Sin clases hoy. Disfruta tu día.</p>}
      {clases && clases.map((c, i) => (
        <div className="item" key={`${c.materiaId}-${i}`}>
          <span className="punto" style={{ background: c.color || '#fff' }} />
          <div>
            <div className="item-titulo">{c.materia}</div>
            <div className="item-detalle">{c.horaInicio} – {c.horaFin} · {c.aula || ''}</div>
          </div>
        </div>
      ))}

      <h2 className="etiqueta">Por entregar</h2>
      {pendientes && pendientes.length === 0 && <p className="vacio">Estás al día.</p>}
      {pendientes && pendientes.map((t) => (
        <div className="item" key={t.id}>
          <div>
            <div className="item-titulo">{t.titulo}</div>
            <div className="item-detalle">{t.materia || ''} · {t.falta || ''}</div>
          </div>
        </div>
      ))}
    </>
  );
}
