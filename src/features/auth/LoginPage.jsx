import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Loader2 } from 'lucide-react';
import { CrmLogo } from '@/components/brand/CrmLogo';

function BrandPanel({ title, subtitle }) {
  return (
    <div className="relative hidden lg:flex flex-1 items-center justify-center overflow-hidden p-6 sm:p-12 bg-stitch-gradient">
      <div className="absolute left-10 top-16 h-48 w-48 rounded-full bg-stitch-primary-bright/20 blur-3xl sm:left-20 sm:top-20" />
      <div className="absolute bottom-16 right-10 h-64 w-64 rounded-full bg-stitch-action/10 blur-3xl sm:bottom-20 sm:right-20" />
      <div className="relative z-10 max-w-md">
        <div className="mb-8">
          <CrmLogo size="lg" />
        </div>
        <h1 className="mb-4 text-3xl font-bold leading-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="text-lg text-stitch-primary/80">{subtitle}</p>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login, register, loginWithGoogle, error, loading, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = async () => {
    setRegisterError('');
    setGoogleLoading(true);
    const { error: googleError } = await loginWithGoogle();
    setGoogleLoading(false);
    if (googleError) setRegisterError(googleError.message || 'No se pudo iniciar con Google');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    
    if (isRegistering) {
      const { error: regError } = await register(email, password, firstName, lastName);
      if (regError) {
        setRegisterError(regError.message);
      } else {
        setRegisterSuccess(true);
      }
    } else {
      await login(email, password);
    }
  };

  if (!isConfigured) {
    return (
      <div className="flex min-h-dvh flex-col lg:flex-row">
        <BrandPanel
          title="Sistema CRM Innovador"
          subtitle="Gestiona tu ciclo comercial con inteligencia artificial."
        />
        <div className="flex w-full items-center justify-center bg-white p-8 dark:bg-stitch-surface sm:p-12 lg:w-[480px] lg:max-w-none lg:flex-shrink-0">
          <div className="w-full max-w-sm text-center">
            <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-stitch-text">Configuración Requerida</h2>
            <p className="mb-6 text-stitch-muted">Completá las variables de entorno</p>
            <div className="rounded-xl bg-stitch-surface-elevated p-6 text-sm text-stitch-muted text-left">
              <p className="mb-2 font-semibold text-stitch-text">Pasos:</p>
              <ol className="list-inside list-decimal space-y-1">
                <li>Crea un proyecto en Supabase</li>
                <li>Ejecuta el schema SQL</li>
                <li>Configura .env.local</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (registerSuccess) {
    return (
      <div className="flex min-h-dvh flex-col lg:flex-row">
        <BrandPanel title="Sistema CRM Innovador" subtitle="Gestiona tu ciclo comercial." />
        <div className="flex w-full items-center justify-center bg-white p-8 dark:bg-stitch-surface sm:p-12 lg:w-[480px] lg:max-w-none lg:flex-shrink-0">
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stitch-success/20">
              <svg className="h-8 w-8 text-stitch-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-stitch-text">¡Registro Exitoso!</h2>
            <p className="mb-6 text-stitch-muted">Verificá tu correo electrónico.</p>
            <Button onClick={() => setRegisterSuccess(false)} className="w-full">
              Volver al login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <BrandPanel
        title="Sistema CRM Innovador para Ventas"
        subtitle="Gestiona tu ciclo comercial con inteligencia artificial, automatización y analítica avanzada."
      />

      <div className="flex w-full items-center justify-center bg-white p-6 dark:bg-stitch-surface sm:p-12 lg:w-[480px] lg:max-w-none lg:flex-shrink-0 safe-bottom">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex justify-center lg:hidden">
            <CrmLogo size="md" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-stitch-text mb-1">
            {isRegistering ? 'Crear Cuenta' : 'Bienvenido'}
          </h2>
          <p className="text-stitch-muted mb-6">
            {isRegistering ? 'Regístrate para comenzar' : 'Inicia sesión para continuar'}
          </p>

          {(error || registerError) && (
            <div className="mb-4 p-3 bg-stitch-danger/10 border border-stitch-danger/30 rounded-xl text-sm text-stitch-danger">
              {registerError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label required>Nombre</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Juan" />
                </div>
                <div>
                  <Label required>Apellido</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Pérez" />
                </div>
              </div>
            )}

            <div>
              <Label required>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@empresa.com" />
            </div>

            <div>
              <Label required>Contraseña</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </Button>
          </form>

          {!isRegistering && (
            <>
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-stitch-border" />
                <span className="text-xs text-stitch-muted">o</span>
                <div className="h-px flex-1 bg-stitch-border" />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={googleLoading || loading}
                onClick={handleGoogle}
              >
                {googleLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Continuar con Google
              </Button>
            </>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-stitch-primary-bright hover:underline"
            >
              {isRegistering ? '¿Ya tenés cuenta? Iniciá sesión' : '¿No tenés cuenta? Registrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
