import { useEffect } from 'react';

// Ventana emergente. Si no recibe onCerrar, no se puede cerrar (por ejemplo mientras analiza)
export default function Modal({ titulo, onCerrar, children }) {
  useEffect(() => {
    if (!onCerrar) return undefined;
    const tecla = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [onCerrar]);

  return (
    <div
      className="modal-fondo"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar && onCerrar()}
    >
      <div className="modal">
        {titulo && <h2>{titulo}</h2>}
        {children}
      </div>
    </div>
  );
}
