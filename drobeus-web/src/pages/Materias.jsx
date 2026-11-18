import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorTexto } from '../api.js';
import { useSesion } from '../context.jsx';
import Formulario from '../components/Formulario.jsx';
import ImportarHorario from '../components/ImportarHorario.jsx';
import { PALETA, horarioATexto, textoAHorario } from '../util.js';

// Materias: listar, crear, editar, eliminar, elegir color y cargar el horario con IA
export default function Materias() {
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const [periodo, setPeriodo] = useState(usuario?.periodoActual || '');
  const [borrador, setBorrador] = useState(periodo);
  const [materias, setMaterias] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null); // null = cerrado; { materia: null | objeto }
  const [archivoHorario, setArchivoHorario] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/api/materias', { params: { periodo: periodo || undefined } });
      setMaterias(data.materias || []);
      setError('');
    } catch (e) {
      setError(errorTexto(e));
    }
  }, [periodo]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardar = async (v, existente) => {
    if (!v.nombre.trim()) return 'Escribe el nombre de la materia';
    const horario = textoAHorario(v.horario);
    if (horario === null) return 'Horario inválido. Usa: lunes 07:00-09:00, miercoles 07:00-09:00';

    if (existente) {
      await api.put(`/api/materias/${existente.id}`, {
        nombre: v.nombre.trim(), profesor: v.profesor.trim(), aula: v.aula.trim(),
        color: v.color, horario
      });
    } else {
      await api.post('/api/materias', {
        nombre: v.nombre.trim(), profesor: v.profesor.trim(), aula: v.aula.trim(),
        color: v.color, periodo: periodo || undefined,
        horario: horario.length ? horario : undefined
      });
    }
    await cargar();
    return null;
  };

  const eliminar = async (m) => {
    if (!window.confirm(`Se eliminará ${m.nombre} junto con sus apuntes, archivos, tareas y notas.`)) return;
    try {
      await api.delete(`/api/materias/${m.id}`);
      await cargar();
    } catch (e) {
      setError(errorTexto(e));
    }
  };

  const m = form?.materia;
  return (
    <>
      <h1 className="titulo izq">Mis materias</h1>
      <form className="fila" onSubmit={(e) => { e.preventDefault(); setPeriodo(borrador.trim()); }}>
        <span className="texto-chico">Semestre</span>
        <input className="corto" value={borrador} onChange={(e) => setBorrador(e.target.value)} placeholder="2026-2" />
        <button className="boton chico">Ver</button>
      </form>
      {error && <p className="error">{error}</p>}

      {materias.length === 0 && !error && <p className="vacio">Aún no tienes materias en este periodo.</p>}
      <div className="grid">
        {materias.map((x) => (
          <div className="tarjeta" key={x.id} onClick={() => navegar(`/materias/${x.id}`)}>
            <span className="punto grande" style={{ background: x.color || '#fff' }} />
            <div className="item-titulo">{x.nombre}</div>
            <div className="item-detalle">
              {x.totalApuntes ?? 0} {x.totalApuntes === 1 ? 'apunte' : 'apuntes'} ·{' '}
              {x.totalTareas ?? 0} {x.totalTareas === 1 ? 'tarea' : 'tareas'}
            </div>
            <div className="acciones" onClick={(e) => e.stopPropagation()}>
              <button className="enlace-boton" onClick={() => setForm({ materia: x })}>Editar</button>
              <button className="enlace-boton" onClick={() => eliminar(x)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      <div className="fila-botones">
        <button className="boton" onClick={() => setForm({ materia: null })}>+ Nueva materia</button>
        <label className="boton secundario archivo">
          Cargar horario desde un archivo
          <input type="file" hidden
            accept="image/*,.pdf,.docx,.txt,application/pdf,text/plain"
            onChange={(e) => { setArchivoHorario(e.target.files[0] || null); e.target.value = ''; }} />
        </label>
      </div>

      {form && (
        <Formulario
          titulo={m ? 'Editar materia' : 'Nueva materia'}
          onCerrar={() => setForm(null)}
          onGuardar={(v) => guardar(v, m)}
          campos={[
            { nombre: 'nombre', etiqueta: 'Nombre', valor: m?.nombre || '' },
            { nombre: 'profesor', etiqueta: 'Profesor', valor: m?.profesor || '' },
            { nombre: 'aula', etiqueta: 'Aula', valor: m?.aula || '' },
            { nombre: 'color', etiqueta: 'Color', tipo: 'color', valor: m?.color || PALETA[materias.length % PALETA.length] },
            { nombre: 'horario', etiqueta: 'Horario (opcional)', valor: horarioATexto(m?.horario),
              ayuda: 'lunes 07:00-09:00, miercoles 07:00-09:00' }
          ]}
        />
      )}

      {archivoHorario && (
        <ImportarHorario
          archivo={archivoHorario}
          periodo={periodo}
          totalActual={materias.length}
          alTerminar={(guardado) => { setArchivoHorario(null); if (guardado) cargar(); }}
        />
      )}
    </>
  );
}
