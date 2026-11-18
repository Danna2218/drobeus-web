export const PALETA = ['#FF4F9A', '#38BDF8', '#FBBF24', '#A78BFA', '#34D399', '#FB923C'];

// Los parciales, exámenes y quices van en "Fechas"; lo demás en "Trabajos"
export const TIPOS_FECHA = ['parcial', 'examen', 'quiz'];

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

export const capitalizar = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : '');

const quitarTildes = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const normalizarDia = (t) => {
  const d = quitarTildes(String(t).trim().toLowerCase());
  return DIAS.includes(d) ? d : null;
};

export const formatoHora = (t) => {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(t).trim());
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null;
};

// "lunes 07:00-09:00, miercoles 07:00-09:00"
export const horarioATexto = (h) =>
  (h || []).map((x) => `${x.dia} ${x.horaInicio}-${x.horaFin}`).join(', ');

// Devuelve null si el formato es inválido; lista vacía si el texto está en blanco
export const textoAHorario = (texto) => {
  if (!texto.trim()) return [];
  const regex = /^([A-Za-zÁÉÍÓÚáéíóúÑñ]+)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/;
  const resultado = [];
  for (const parte of texto.split(/[,;]/)) {
    const m = regex.exec(parte.trim());
    if (!m) return null;
    const dia = normalizarDia(m[1]);
    const ini = formatoHora(m[2]);
    const fin = formatoHora(m[3]);
    if (!dia || !ini || !fin) return null;
    resultado.push({ dia, horaInicio: ini, horaFin: fin });
  }
  return resultado;
};

// Día de hoy en el formato de la API (lunes ... domingo)
export const diaDeHoy = () => DIAS[(new Date().getDay() + 6) % 7];

// ---------- Fechas ----------
const aUTC = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
};

export const fechaISO = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const fechaBonita = (iso) => {
  const d = aUTC(iso);
  return d
    ? d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    : 'sin fecha';
};

// Días que faltan desde hoy (negativo si ya pasó)
export const diasHasta = (iso) => {
  const d = aUTC(iso);
  const hoy = aUTC(fechaISO());
  return d && hoy ? Math.round((d - hoy) / 86400000) : null;
};

export const textoPlazo = (dias) => {
  if (dias === null) return '';
  if (dias < 0) return `Vencida hace ${-dias} día(s)`;
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  return `En ${dias} días`;
};

// "2026-11-09", "2026-11-15" -> "del 9 al 15 de noviembre"
export const rangoSemana = (desde, hasta) => {
  const d = aUTC(desde);
  const h = aUTC(hasta);
  if (!d || !h) return '';
  const mes = (x) => x.toLocaleDateString('es-CO', { month: 'long', timeZone: 'UTC' });
  return mes(d) === mes(h)
    ? `del ${d.getUTCDate()} al ${h.getUTCDate()} de ${mes(h)}`
    : `del ${d.getUTCDate()} de ${mes(d)} al ${h.getUTCDate()} de ${mes(h)}`;
};

// ---------- Tareas ----------
export const estaEntregada = (t) =>
  t.entregada === true || t.completada === true || t.hecha === true ||
  String(t.estado || '').toLowerCase() === 'entregada';

// ---------- Archivos ----------
export const tipoArchivo = (mime) => {
  if (!mime) return 'Archivo';
  if (mime.startsWith('image/')) return 'Foto';
  if (mime === 'application/pdf') return 'PDF';
  if (mime.includes('word')) return 'Word';
  return 'Archivo';
};

export const tamanoTexto = (b) => {
  if (b === undefined || b === null) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
};

// Une el nombre elegido con la extensión original
export const nombreConExtension = (base, original) => {
  const limpio = base.trim();
  if (!limpio) return original;
  const punto = original.lastIndexOf('.');
  const extension = punto >= 0 ? original.slice(punto + 1) : '';
  if (!extension || limpio.toLowerCase().endsWith(`.${extension.toLowerCase()}`)) return limpio;
  return `${limpio}.${extension}`;
};

export const sinExtension = (nombre) => {
  const punto = nombre.lastIndexOf('.');
  return punto > 0 ? nombre.slice(0, punto) : nombre;
};

// Reduce las fotos grandes antes de subirlas (la IA acepta hasta 5 MB por imagen)
export async function comprimirImagen(archivo) {
  if (!archivo.type.startsWith('image/') || archivo.type === 'image/gif') return archivo;
  try {
    const bmp = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
    const escala = Math.min(1, 2200 / Math.max(bmp.width, bmp.height));
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.round(bmp.width * escala);
    lienzo.height = Math.round(bmp.height * escala);
    lienzo.getContext('2d').drawImage(bmp, 0, 0, lienzo.width, lienzo.height);
    const blob = await new Promise((resolver) => lienzo.toBlob(resolver, 'image/jpeg', 0.85));
    if (!blob) return archivo;
    return new File([blob], `${sinExtension(archivo.name)}.jpg`, { type: 'image/jpeg' });
  } catch {
    return archivo;
  }
}

export const promedioTexto = (n) => (n === null || n === undefined ? '—' : Number(n).toFixed(2));
