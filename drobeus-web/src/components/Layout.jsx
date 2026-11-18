import { NavLink, Outlet } from 'react-router-dom';
import { useSesion } from '../context.jsx';

// Barra de navegación + contenido de la pantalla activa
export default function Layout() {
  const { usuario, salir } = useSesion();

  const cambiarCuenta = () => {
    if (window.confirm(`¿Quieres cerrar la sesión de ${usuario?.nombre}?`)) salir();
  };

  const enlace = ({ isActive }) => (isActive ? 'activo' : '');

  return (
    <div className="app">
      <header className="barra">
        <span className="marca">DrobeUs</span>
        <nav>
          <NavLink to="/" end className={enlace}>Inicio</NavLink>
          <NavLink to="/materias" className={enlace}>Materias</NavLink>
          <NavLink to="/agenda" className={enlace}>Agenda</NavLink>
          <NavLink to="/notas" className={enlace}>Notas</NavLink>
          <NavLink to="/perfil" className={enlace}>Perfil</NavLink>
          <NavLink to="/sesion" className={enlace}>Sesión</NavLink>
        </nav>
        <button className="enlace-boton" onClick={cambiarCuenta}>Cambiar cuenta</button>
      </header>
      <main className="contenido">
        <Outlet />
      </main>
    </div>
  );
}
