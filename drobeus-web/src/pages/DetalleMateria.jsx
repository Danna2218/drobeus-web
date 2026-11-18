import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, errorTexto } from '../api.js';
import Formulario from '../components/Formulario.jsx';
import {
  TIPOS_FECHA, comprimirImagen, diasHasta, estaEntregada, fechaBonita, nombreConExtension,
  sinExtension, tamanoTexto, textoPlazo, tipoArchivo
} from '../util.js';

const PESTANAS = [
  ['apuntes', 'Apuntes'],
  ['trabajos', 'Trabajos'],
  ['fechas', 'Fechas'],
  ['notas', 'Notas']
];

const num = (n) => (Number(n) % 1 === 0 ? String(Number(n)) : Number(n).toFixed(2));

// Dentro de una materia: apuntes (texto, fotos y archivos), trabajos, fechas y notas
export default function DetalleMateria() {
  const { id } = useParams();
  const navegar = useNavigate();
  const [params, setParams] = useSearchParams();
  const pestana = params.get('tab') || 'apuntes';

  const [materia, setMateria] = useState(null);
  const [datos, setDatos] = useState({ apuntes: [], archivos: [], tareas: [], notas: [] });
  const [buscar, setBuscar] = useState('');
  const [form, setForm] = useState(null); 
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [m, a, f, t, n] = await Promise.all([
        api.get(`/api/materias/${id}`),
        api.get('/api/apuntes', { params: { materia: id, buscar: buscar || undefined } }),
        api.get('/api/archivos', { params: { materia: id } }).catch(() => ({ data: { archivos: [] } })),
        api.get('/api/tareas', { params: { materia: id } }),
        api.get('/api/notas', { params: { materia: id } })
      ]);
      setMateria(m.data.materia);
      setDatos({
        apuntes: a.data.apuntes || [],
        archivos: f.data.archivos || [],
        tareas: t.data.tareas || [],
        notas: n.data.notas || []
      });
      setError('');
    } catch (e) {
      setError(errorTexto(e));
    }
  }, [id, buscar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Ejecuta una acción de la API y recarga la pantalla
  const correr = async (accion) => {
    try {
      await accion();
      await cargar();
    } catch (e) {
      setError(errorTexto(e));
    }
  };

  const eliminarMateria = async () => {
    if (!window.confirm('Se eliminará esta materia junto con sus apuntes, archivos, tareas y notas.')) return;
    try {
      await api.delete(`/api/materias/${id}`);
      navegar('/materias');
    } catch (e) {
      setError(errorTexto(e));
    }
  };

  // ---------- Apuntes ----------
  const formApunte = (a) => setForm({
    titulo: a ? 'Editar apunte' : 'Nuevo apunte',
    campos: [
      { nombre: 'titulo', etiqueta: 'Título', valor: a?.titulo || '' },
      { nombre: 'contenido', etiqueta: 'Contenido', tipo: 'area', valor: a?.contenido || '' }
    ],
    guardar: async (v) => {
      if (!v.titulo.trim()) return 'Escribe el título';
      await (a
        ? api.put(`/api/apuntes/${a._id}`, { titulo: v.titulo.trim(), contenido: v.contenido })
        : api.post('/api/apuntes', { materia: id, titulo: v.titulo.trim(), tipo: 'texto', contenido: v.contenido }));
      await cargar();
      return null;
    }
  });

  // ---------- Archivos y fotos ----------
  const elegirArchivo = async (e) => {
    const original = e.target.files[0];
    e.target.value = '';
    if (!original) return;
    const archivo = await comprimirImagen(original);
    if (archivo.size > 10 * 1024 * 1024) {
      setError('El archivo supera los 10 MB');
      return;
    }
    // Antes de subir se puede poner un nombre fácil de reconocer (se conserva la extensión)
    setForm({
      titulo: 'Nombre del archivo',
      ayuda: 'Ponle un nombre para reconocerlo después (ej. Apuntes de límites).',
      textoGuardar: 'Subir',
      campos: [{ nombre: 'nombre', etiqueta: 'Nombre', valor: sinExtension(archivo.name) }],
      guardar: async (v) => {
        const datosForm = new FormData();
        datosForm.append('archivo', archivo);
        datosForm.append('materia', id);
        datosForm.append('nombre', nombreConExtension(v.nombre, archivo.name));
        await api.post('/api/archivos', datosForm, { timeout: 120000 });
        await cargar();
        return null;
      }
    });
  };

  const abrirArchivo = async (f) => {
    const ventana = window.open('', '_blank'); // se abre antes de descargar para evitar bloqueos
    try {
      const { data } = await api.get(`/api/archivos/${f._id}/descargar`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      if (ventana) ventana.location.href = url;
      else window.location.href = url;
    } catch (e) {
      ventana?.close();
      setError(errorTexto(e));
    }
  };

  const formRenombrar = (f) => setForm({
    titulo: 'Cambiar nombre',
    campos: [{ nombre: 'nombre', etiqueta: 'Nombre', valor: f.nombre }],
    guardar: async (v) => {
      if (!v.nombre.trim()) return 'Escribe un nombre';
      await api.put(`/api/archivos/${f._id}`, { nombre: v.nombre.trim() });
      await cargar();
      return null;
    }
  });

  // ---------- Trabajos y fechas ----------
  const formTarea = (t, fechas) => setForm({
    titulo: t ? 'Editar' : fechas ? 'Nueva fecha' : 'Nuevo trabajo',
    campos: [
      { nombre: 'titulo', etiqueta: 'Título', valor: t?.titulo || '' },
      { nombre: 'tipo', etiqueta: 'Tipo', tipo: 'select',
        opciones: fechas ? TIPOS_FECHA : ['tarea', 'taller', 'informe'],
        valor: t?.tipo || (fechas ? 'parcial' : 'tarea') },
      { nombre: 'fechaEntrega', etiqueta: 'Fecha', tipo: 'fecha', valor: t?.fechaEntrega?.slice(0, 10) || '' }
    ],
    guardar: async (v) => {
      if (!v.titulo.trim()) return 'Escribe el título';
      if (!v.fechaEntrega) return 'Elige la fecha';
      const cuerpo = { titulo: v.titulo.trim(), tipo: v.tipo, fechaEntrega: v.fechaEntrega };
      await (t ? api.put(`/api/tareas/${t._id}`, cuerpo) : api.post('/api/tareas', { materia: id, ...cuerpo }));
      await cargar();
      return null;
    }
  });

  // ---------- Notas ----------
  const formNota = (n) => setForm({
    titulo: n ? 'Editar nota' : 'Nueva nota',
    campos: [
      { nombre: 'descripcion', etiqueta: 'Descripción', valor: n?.descripcion || '', ayuda: 'Quiz 1' },
      { nombre: 'valor', etiqueta: 'Nota (0 a 5)', tipo: 'numero', valor: n?.valor ?? '' },
      { nombre: 'porcentaje', etiqueta: 'Porcentaje (0 a 100)', tipo: 'numero', valor: n?.porcentaje ?? '' }
    ],
    guardar: async (v) => {
      const valor = parseFloat(String(v.valor).replace(',', '.'));
      const porcentaje = parseFloat(String(v.porcentaje).replace(',', '.'));
      if (!v.descripcion.trim()) return 'Escribe la descripción';
      if (Number.isNaN(valor) || valor < 0 || valor > 5) return 'La nota debe estar entre 0 y 5';
      if (Number.isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) return 'El porcentaje debe estar entre 0 y 100';
      const cuerpo = { descripcion: v.descripcion.trim(), valor, porcentaje };
      await (n ? api.put(`/api/notas/${n._id}`, cuerpo) : api.post('/api/notas', { materia: id, ...cuerpo }));
      await cargar();
      return null;
    }
  });

  const quitar = (texto, url) => {
    if (window.confirm(texto)) correr(() => api.delete(url));
  };

  // ---------- Pintado de cada pestaña ----------
  const pintarTareas = (fechas) => {
    const lista = datos.tareas
      .filter((t) => TIPOS_FECHA.includes(String(t.tipo || '').toLowerCase()) === fechas)
      .sort((a, b) => String(a.fechaEntrega).localeCompare(String(b.fechaEntrega)));

    return (
      <>
        {lista.length === 0 && (
          <p className="vacio">{fechas ? 'No hay fechas de parciales.' : 'No hay trabajos.'}</p>
        )}
        {lista.map((t) => {
          const entregada = estaEntregada(t);
          return (
            <div className={`item ${entregada ? 'apagado' : ''}`} key={t._id}>
              <div className="crece">
                <div className="item-titulo">{t.titulo}</div>
                <div className="item-detalle">
                  {t.tipo} · {fechaBonita(t.fechaEntrega)} · {entregada ? 'Entregada ✓' : textoPlazo(diasHasta(t.fechaEntrega))}
                </div>
              </div>
              <div className="acciones">
                {!entregada && (
                  <button className="enlace-boton" onClick={() => correr(() => api.patch(`/api/tareas/${t._id}/entregar`))}>
                    Entregar
                  </button>
                )}
                <button className="enlace-boton" onClick={() => formTarea(t, fechas)}>Editar</button>
                <button className="enlace-boton" onClick={() => quitar(`¿Eliminar "${t.titulo}"?`, `/api/tareas/${t._id}`)}>
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
        <button className="boton" onClick={() => formTarea(null, fechas)}>
          {fechas ? '+ Añadir fecha' : '+ Añadir trabajo'}
        </button>
      </>
    );
  };

  const pintarApuntes = () => {
    const filtrados = datos.archivos.filter(
      (f) => !buscar || f.nombre.toLowerCase().includes(buscar.toLowerCase())
    );
    const filas = [
      ...datos.apuntes.map((a) => ({ clave: a._id, fecha: a.createdAt || '', tipo: 'apunte', obj: a })),
      ...filtrados.map((f) => ({ clave: f._id, fecha: f.createdAt || '', tipo: 'archivo', obj: f }))
    ].sort((x, y) => String(y.fecha).localeCompare(String(x.fecha)));

    return (
      <>
        <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por título" />
        {filas.length === 0 && <p className="vacio">Aún no hay apuntes.</p>}
        {filas.map(({ clave, tipo, obj }) =>
          tipo === 'apunte' ? (
            <div className="item" key={clave}>
              <div className="crece">
                <div className="item-titulo">{obj.titulo}</div>
                <div className="item-detalle">
                  {(obj.contenido || '').replace(/\n/g, ' ').slice(0, 80)} · {fechaBonita(obj.createdAt)}
                </div>
              </div>
              <div className="acciones">
                <button className="enlace-boton" onClick={() => formApunte(obj)}>Editar</button>
                <button className="enlace-boton" onClick={() => quitar(`¿Eliminar "${obj.titulo}"?`, `/api/apuntes/${obj._id}`)}>
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <div className="item" key={clave}>
              <div className="crece">
                <div className="item-titulo">{obj.nombre}</div>
                <div className="item-detalle">
                  {tipoArchivo(obj.mime)} · {tamanoTexto(obj.tamano)} · {fechaBonita(obj.createdAt)}
                </div>
              </div>
              <div className="acciones">
                <button className="enlace-boton" onClick={() => abrirArchivo(obj)}>Abrir</button>
                <button className="enlace-boton" onClick={() => formRenombrar(obj)}>Cambiar nombre</button>
                <button className="enlace-boton" onClick={() => quitar(`¿Eliminar "${obj.nombre}"?`, `/api/archivos/${obj._id}`)}>
                  Eliminar
                </button>
              </div>
            </div>
          )
        )}
        <div className="fila-botones">
          <button className="boton" onClick={() => formApunte(null)}>+ Escribir apunte</button>
          <label className="boton secundario archivo">
            + Subir foto, PDF o documento
            <input type="file" hidden onChange={elegirArchivo} />
          </label>
        </div>
      </>
    );
  };

  const pintarNotas = () => {
    const porcentaje = datos.notas.reduce((a, n) => a + (n.porcentaje || 0), 0);
    const ponderado = datos.notas.reduce((a, n) => a + n.valor * (n.porcentaje || 0), 0);
    return (
      <>
        <div className="resumen">
          {porcentaje > 0
            ? `PROMEDIO: ${(ponderado / porcentaje).toFixed(2)}  ·  Evaluado: ${num(porcentaje)}%  ·  ${datos.notas.length} notas`
            : 'Aún no tienes notas registradas'}
        </div>
        {datos.notas.map((n) => (
          <div className="item" key={n._id}>
            <div className="crece">
              <div className="item-titulo">{n.descripcion}</div>
              <div className="item-detalle">Nota {num(n.valor)} · {num(n.porcentaje || 0)}%</div>
            </div>
            <div className="acciones">
              <button className="enlace-boton" onClick={() => formNota(n)}>Editar</button>
              <button className="enlace-boton" onClick={() => quitar(`¿Eliminar "${n.descripcion}"?`, `/api/notas/${n._id}`)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
        <button className="boton" onClick={() => formNota(null)}>+ Añadir nota</button>
      </>
    );
  };

  return (
    <>
      <div className="fila entre">
        <Link to="/materias" className="enlace-boton">‹ Materias</Link>
        <button className="enlace-boton" onClick={eliminarMateria}>Eliminar materia</button>
      </div>
      <h1 className="titulo izq">
        <span className="punto grande" style={{ background: materia?.color || '#fff' }} /> {materia?.nombre || '...'}
      </h1>
      <p className="texto-chico">{[materia?.profesor, materia?.aula].filter(Boolean).join(' · ')}</p>
      {error && <p className="error">{error}</p>}

      <div className="pestanas">
        {PESTANAS.map(([clave, texto]) => (
          <button key={clave} className={pestana === clave ? 'activa' : ''} onClick={() => setParams({ tab: clave })}>
            {texto}
          </button>
        ))}
      </div>

      {pestana === 'apuntes' && pintarApuntes()}
      {pestana === 'trabajos' && pintarTareas(false)}
      {pestana === 'fechas' && pintarTareas(true)}
      {pestana === 'notas' && pintarNotas()}

      {form && (
        <Formulario
          titulo={form.titulo}
          ayuda={form.ayuda}
          textoGuardar={form.textoGuardar}
          campos={form.campos}
          onGuardar={form.guardar}
          onCerrar={() => setForm(null)}
        />
      )}
    </>
  );
}
