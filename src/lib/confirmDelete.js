/**
 * Confirmación antes de eliminar registros en el CRM.
 * @param {string} entityShortDescription - ej. "este cliente", "la cotización COT-123"
 */
export function confirmDelete(entityShortDescription) {
  if (typeof window === 'undefined') return false;
  return window.confirm(
    `¿Eliminar ${entityShortDescription}? Esta acción no se puede deshacer.`
  );
}
