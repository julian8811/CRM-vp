/**
 * Mensajes claros en español para errores comunes de Supabase Auth.
 * @see https://supabase.com/docs/reference/javascript/auth-signinwithpassword
 */
export function formatAuthError(error) {
  if (!error) return 'Error desconocido al iniciar sesión.'
  const msg = (error.message || '').toLowerCase()
  const status = error.status

  if (msg.includes('email not confirmed') || msg.includes('confirm')) {
    return 'Tu correo aún no está confirmado. Revisá tu bandeja o desactivá "Confirm email" en Supabase → Authentication → Providers → Email (solo para pruebas).'
  }
  if (
    msg.includes('invalid login') ||
    msg.includes('invalid credentials') ||
    msg.includes('wrong password') ||
    status === 400
  ) {
    return 'Email o contraseña incorrectos. Si recién te registraste, puede que debas confirmar el correo primero.'
  }
  if (msg.includes('user not found') || msg.includes('user does not exist')) {
    return 'No existe una cuenta con ese correo. Registrate primero.'
  }
  if (msg.includes('too many requests') || msg.includes('rate limit')) {
    return 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.'
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Error de red. Comprobá tu conexión y que la URL de Supabase sea correcta.'
  }

  return error.message || 'No se pudo iniciar sesión.'
}
