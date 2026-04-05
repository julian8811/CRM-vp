import { createContext, useContext, useState, useEffect } from 'react'
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithGoogle, 
  signOut as signOutAuth,
  getSession,
  onAuthStateChange,
  getProfile,
  isSupabaseConfigured,
  supabase
} from '../lib/auth'
import { formatAuthError } from '../lib/authErrors'

const AuthContext = createContext(null)

/**
 * AuthProvider - Proveedor de contexto de autenticación
 * Maneja el estado de sesión y provee funciones de auth a toda la app
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    const configured = isSupabaseConfigured()
    setIsConfigured(configured)

    if (!configured) {
      setLoading(false)
      return
    }

    let unsubscribe = () => {}

    const initAuth = async () => {
      try {
        const { session } = await getSession()
        if (session?.user) {
          setUser(session.user)
          const { data: profileData } = await getProfile(session.user.id)
          if (profileData) {
            setProfile(profileData)
          }
        }
      } catch (e) {
        console.error('Auth init error:', e)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    unsubscribe = onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        } else if (session?.user) {
          setUser(session.user)
          const { data: profileData } = await getProfile(session.user.id)
          setProfile(profileData)
        }
      } catch (e) {
        console.error('Auth state change error:', e)
      } finally {
        setLoading(false)
      }
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [])

  /**
   * Iniciar sesión con email y password
   */
  const login = async (email, password) => {
    setError(null)
    setLoading(true)
    
    if (!isSupabaseConfigured()) {
      setError('Supabase no está configurado. Complete las variables de entorno.')
      setLoading(false)
      return { error: { message: 'Supabase no está configurado' } }
    }

    const { data, error: authError } = await signInWithEmail(email, password)
    
    if (authError) {
      setError(formatAuthError(authError))
      setLoading(false)
      return { error: authError }
    }

    const { data: { session } } = await supabase.auth.getSession()
    const authedUser = session?.user ?? data?.user
    if (authedUser) {
      setUser(authedUser)
      const { data: profileData, error: profileError } = await getProfile(authedUser.id)
      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('Perfil:', profileError.message)
      }
      setProfile(profileData ?? null)
    }
    
    setLoading(false)
    return { data }
  }

  /**
   * Registrarse con email y password
   */
  const register = async (email, password, firstName = '', lastName = '') => {
    setError(null)
    setLoading(true)
    
    if (!isSupabaseConfigured()) {
      setError('Supabase no está configurado. Complete las variables de entorno.')
      setLoading(false)
      return { error: { message: 'Supabase no está configurado' } }
    }

    const { data, error: authError } = await signUpWithEmail(email, password, {
      first_name: firstName,
      last_name: lastName,
      role: 'sales'
    })
    
    if (authError) {
      setError(formatAuthError(authError))
      setLoading(false)
      return { error: authError }
    }

    setLoading(false)
    return { data }
  }

  /**
   * Iniciar sesión con Google
   */
  const loginWithGoogle = async () => {
    setError(null)
    
    if (!isSupabaseConfigured()) {
      setError('Supabase no está configurado. Complete las variables de entorno.')
      return { error: { message: 'Supabase no está configurado' } }
    }

    const { data, error: authError } = await signInWithGoogle()
    
    if (authError) {
      setError(formatAuthError(authError))
      return { error: authError }
    }

    return { data }
  }

  /**
   * Cerrar sesión
   */
  const logout = async () => {
    setError(null)
    const { error: logoutError } = await signOutAuth()
    
    if (logoutError) {
      setError(logoutError.message)
      return { error: logoutError }
    }

    setUser(null)
    setProfile(null)
    return { error: null }
  }

  /**
   * Verificar si el usuario es admin
   */
  const isAdmin = profile?.role === 'admin'

  /**
   * Verificar si el usuario es manager
   */
  const isManager = profile?.role === 'manager' || profile?.role === 'admin'

  const value = {
    user,
    profile,
    loading,
    error,
    isConfigured,
    isAdmin,
    isManager,
    login,
    register,
    loginWithGoogle,
    logout,
    setError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook para usar el contexto de autenticación
 * @returns {object} - { user, profile, loading, login, register, logout, isAdmin, ... }
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}
