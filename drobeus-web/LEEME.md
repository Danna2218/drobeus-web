# DrobeUs Web (React + Vite)

Frontend en React que usa **la misma API** de DrobeUs (Node.js + Express + MongoDB Atlas en Render).

## Cómo ejecutarlo
Necesitas Node.js 18 o superior.

```bash
npm install
npm run dev
```
Abre http://localhost:5173

La URL de la API está en el archivo `.env`:
```
VITE_API_URL=https://drobeus-api.onrender.com
```
Para probar contra tu PC cambia a `http://localhost:3000` y reinicia `npm run dev`.
Si Render estaba dormido, la primera petición puede tardar hasta un minuto.

## Qué incluye
- Registro, Login y "Empecemos" (perfil + carga de horario con IA)
- Inicio: clases de hoy y tareas por entregar
- Materias: crear, editar, eliminar, color y horario
- Dentro de una materia: Apuntes (texto, fotos, PDF y archivos, con nombre editable), Trabajos, Fechas y Notas
- Notas: promedio del periodo y por materia
- Agenda: semana, entregas y recordatorios
- Perfil: editar datos, cerrar sesión y eliminar cuenta
- Sesión: panel para demostrar la rotación de refresh tokens en vivo

## Cómo está organizado
```
src/
  main.jsx            arranca React y el enrutador
  App.jsx             rutas y rutas protegidas (si no hay sesión, va a /login)
  api.js              Axios + interceptores: pone el token y renueva si da 401 (equivale a ApiClient)
  context.jsx         sesión del usuario para toda la app
  util.js             fechas, horarios, archivos
  components/         Modal, Formulario, ImportarHorario, Layout...
  pages/              una pantalla por archivo
  styles.css          estilos
```

## Flujo de una petición (para explicarlo)
1. La pantalla (`pages/*.jsx`) llama a `api.get/post/put/delete`.
2. El interceptor de petición (`api.js`) agrega `Authorization: Bearer <accessToken>`.
3. Axios convierte el objeto JavaScript en JSON y lo envía por HTTPS a Render.
4. La API (rutas, middleware, controladores, modelos) consulta MongoDB Atlas y responde JSON.
5. Si responde `401 TOKEN_EXPIRADO`, el interceptor de respuesta llama a `/api/auth/refresh`,
   guarda el par nuevo (rotación) y repite la petición original sin que el usuario lo note.
6. La pantalla recibe el JSON ya convertido en objeto y lo pinta.

## Compilar para publicar
```bash
npm run build
```
Genera la carpeta `dist/`, que se puede subir a Netlify o Vercel.
Si publicas en otro dominio, la API ya acepta peticiones desde cualquier origen (CORS).

## Nota de seguridad
Los tokens se guardan en `localStorage` para simplificar. En producción lo recomendable es guardar
el refresh token en una cookie HttpOnly (como muestra el diagrama de la clase).
