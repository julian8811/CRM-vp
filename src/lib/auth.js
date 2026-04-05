import { supabase, isSupabaseConfigured } from './supabase'

export { supabase, isSupabaseConfigured }

/**
 * Iniciar sesión con email y contraseña
 * @param {string} email - Correo electrónico
 * @param {string} password - Contraseña
 * @returns {Promise<{data, error}>}
 */
export const signInWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

/**
 * Registrarse con email y contraseña
 * @param {string} email - Correo electrónico
 * @param {string} password - Contraseña
 * @param {object} metadata - Metadatos adicionales (first_name, last_name, role)
 * @returns {Promise<{data, error}>}
 */
export const signUpWithEmail = async (email, password, metadata = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  })
  return { data, error }
}

/**
 * Iniciar sesión con Google OAuth
 * @returns {Promise<{data, error}>}
 */
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  })
  return { data, error }
}

/**
 * Cerrar sesión
 * @returns {Promise<{error}>}
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Obtener el usuario actual
 * @returns {Promise<{data, error}>}
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

/**
 * Obtener sesión actual
 * @returns {Promise<{data, error}>}
 */
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

/**
 * Refrescar sesión
 * @returns {Promise<{data, error}>}
 */
export const refreshSession = async () => {
  const { data, error } = await supabase.auth.refreshSession()
  return { data, error }
}

/**
 * Escuchar cambios en el estado de autenticación
 * @param {function} callback - Función a ejecutar cuando cambie el estado
 * @returns {function} - Función para unsubscribe
 */
export const onAuthStateChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
  return () => subscription.unsubscribe()
}

/**
 * Obtener perfil del usuario desde la tabla profiles
 * @param {string} userId - ID del usuario
 * @returns {Promise<{data, error}>}
 */
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

/**
 * Actualizar perfil del usuario
 * @param {string} userId - ID del usuario
 * @param {object} updates - Campos a actualizar
 * @returns {Promise<{data, error}>}
 */
export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}
