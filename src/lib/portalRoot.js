/** Contenedor dedicado para portales; evita conflictos DOM con el root de React. */
export function getPortalRoot() {
  if (typeof document === 'undefined') return null;
  return document.getElementById('portal-root') ?? document.body;
}
