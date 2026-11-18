import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { api, errorTexto } from '../api.js';
import { PALETA, comprimirImagen, horarioATexto } from '../util.js';

export default function ImportarHorario({ archivo, periodo, totalActual, alTerminar }) {
  const [estado, setEstado] = useState('analizando'); // analizando | confirmar | error
  const [propuestas, setPropuestas] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const listo = await comprimirImagen(archivo);
        const datos = new FormData();
        datos.append('archivo', listo);
        const { data } = await api.post('/api/horario/analizar', datos, { timeout: 120000 });
        if (!activo) return;
        if (!data.materias || data.materias.length === 0) {
          setMensaje('No encontré materias en ese documento. Prueba con una imagen más clara o agrégalas con + Nueva materia.');
          setEstado('error');
          return;
        }
        setPropuestas(data.materias);
        setEstado('confirmar');
      } catch (e) {
        if (!activo) return;
        setMensaje(errorTexto(e));
        setEstado('error');
      }
    })();
    return () => {
      activo = false;
    };
  }, [archivo]);

  const guardar = async () => {
    setGuardando(true);
    try {
      await api.post('/api/materias/lote', {
        periodo: periodo || undefined,
        materias: propuestas.map((m, i) => ({
          nombre: m.nombre,
          profesor: m.profesor,
          aula: m.aula,
          color: PALETA[(totalActual + i) % PALETA.length],
          horario: m.horario && m.horario.length ? m.horario : undefined
        }))
      });
      alTerminar(true);
    } catch (e) {
      setMensaje(errorTexto(e));
      setEstado('error');
    } finally {
      setGuardando(false);
    }
  };

  if (estado === 'analizando') {
    return (
      <Modal titulo="Analizando tu horario">
        <p>Estoy leyendo el documento y organizando tus materias. Puede tardar hasta un minuto...</p>
        <div className="cargando" />
      </Modal>
    );
  }

  if (estado === 'error') {
    return (
      <Modal titulo="No se pudo leer el horario" onCerrar={() => alTerminar(false)}>
        <p>{mensaje}</p>
        <div className="fila-botones">
          <button className="boton" onClick={() => alTerminar(false)}>
            Entendido
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal titulo={`Encontré ${propuestas.length} materias`}>
      <ul className="lista-simple">
        {propuestas.map((m, i) => (
          <li key={`${m.nombre}-${i}`}>
            <strong>{m.nombre}</strong>
            <br />
            <span className="texto-chico">{horarioATexto(m.horario) || 'Sin horario'}</span>
          </li>
        ))}
      </ul>
      <div className="fila-botones">
        <button className="boton secundario" onClick={() => alTerminar(false)}>
          Cancelar
        </button>
        <button className="boton" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar todas'}
        </button>
      </div>
    </Modal>
  );
}
