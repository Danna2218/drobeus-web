import { useEffect, useState } from 'react';
import { api, errorTexto } from '../api.js';
import { capitalizar, fechaISO, rangoSemana } from '../util.js';

const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

// Agenda: la semana de lunes a domingo con entregas, parciales y recordatorios
export default function Agenda() {
  const [base, setBase] = useState(new Date());
  const [semana, setSemana] = useState(null);
  const [recordatorios, setRecordatorios] = useState([]);
  const [diaElegido, setDiaElegido] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const [s, r] = await Promise.all([
          api.get('/api/agenda/semana', { params: { fecha: fechaISO(base) } }),
          api.get('/api/agenda/recordatorios', { params: { dias: 3 } })
        ]);
        if (!activo) return;
        setSemana(s.data);
        setRecordatorios(r.data.recordatorios || []);
        setError('');
      } catch (e) {
        if (activo) setError(errorTexto(e));
      }
    })();
    return () => {
      activo = false;
    };
  }, [base]);

  const mover = (dias) => {
    const nueva = new Date(base);
    nueva.setDate(nueva.getDate() + dias);
    setBase(nueva);
    setDiaElegido(null);
  };

  const hoy = fechaISO();
  const entregas = (semana?.entregas || []).filter(
    (e) => !diaElegido || String(e.fechaEntrega).slice(0, 10) === diaElegido
  );

  return (
    <>
      <h1 className="titulo izq">Agenda</h1>
      <p className="texto-chico">Semana {rangoSemana(semana?.desde, semana?.hasta)}</p>
      {error && <p className="error">{error}</p>}

      <div className="fila entre">
        <button className="enlace-boton" onClick={() => mover(-7)}>‹ Anterior</button>
        <button className="enlace-boton" onClick={() => { setBase(new Date()); setDiaElegido(null); }}>Hoy</button>
        <button className="enlace-boton" onClick={() => mover(7)}>Siguiente ›</button>
      </div>

      <div className="dias">
        {(semana?.dias || []).map((d, i) => (
          <button key={d.fecha}
            className={`dia ${d.fecha === hoy ? 'hoy' : ''} ${d.fecha === diaElegido ? 'activo' : ''}`}
            onClick={() => setDiaElegido(diaElegido === d.fecha ? null : d.fecha)}>
            <span>{LETRAS[i]}</span>
            <strong>{d.numero}</strong>
          </button>
        ))}
      </div>

      <h2 className="etiqueta">Entregas y parciales</h2>
      {entregas.length === 0 && (
        <p className="vacio">{diaElegido ? 'No tienes entregas ese día.' : 'No tienes entregas esta semana.'}</p>
      )}
      {entregas.map((e) => (
        <div className="item" key={e.id}>
          <span className="punto" style={{ background: e.color || '#fff' }} />
          <div>
            <div className="item-titulo">{e.titulo}</div>
            <div className="item-detalle">
              {capitalizar(e.dia).slice(0, 3)} {String(e.fechaEntrega).slice(8, 10)} · {e.materia}
            </div>
          </div>
        </div>
      ))}

      <h2 className="etiqueta">Recordatorios</h2>
      {recordatorios.length === 0 && <p className="vacio">Sin recordatorios por ahora.</p>}
      {recordatorios.map((r) => (
        <div className="item" key={r.tareaId}>
          <div className="item-titulo">🔔 {r.mensaje}</div>
        </div>
      ))}
    </>
  );
}
