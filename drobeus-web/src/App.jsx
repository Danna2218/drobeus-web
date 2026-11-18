import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useSesion } from './context.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import Empecemos from './pages/Empecemos.jsx';
import Home from './pages/Home.jsx';
import Materias from './pages/Materias.jsx';
import DetalleMateria from './pages/DetalleMateria.jsx';
import Notas from './pages/Notas.jsx';
import Agenda from './pages/Agenda.jsx';
import Perfil from './pages/Perfil.jsx';
import Sesion from './pages/Sesion.jsx';

function Protegida() {
  const { usuario } = useSesion();
  const lugar = useLocation();
  if (!usuario) return <Navigate to="/login" replace />;
  if (!usuario.institucion && lugar.pathname !== '/empecemos') {
    return <Navigate to="/empecemos" replace />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route element={<Protegida />}>
        <Route path="/empecemos" element={<Empecemos />} />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/materias" element={<Materias />} />
          <Route path="/materias/:id" element={<DetalleMateria />} />
          <Route path="/notas" element={<Notas />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/sesion" element={<Sesion />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
