import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '@/contexts/AuthContext';
import { useCrmModal } from '@/contexts/CrmModalContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Loader2, Plus, TrendingUp, DollarSign, Users, Target, ShoppingCart, GripVertical, MapPin, Building2, Mail, Phone, Edit2, Trash2, ArrowRightCircle, Package, AlertTriangle, FileText, Clock, CheckCircle, XCircle, Send, BarChart3, PieChart, Activity, Zap, Settings, UserPlus, Wrench, Headphones, Download, Filter, Eye, FileDown, Calendar, RefreshCw, Copy, Check, X, ChevronRight, Sparkles, Bot, Lightbulb, TrendingDown, UsersRound, Receipt, CreditCard, FileCheck, Workflow, Play, Pause, Clock3, Bell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '@/store/useStore';
import {
  formatCurrency,
  getRangeFromPreset,
  isInRange,
  pipelineTotals,
  sumOrdersTotal,
  buildFunnelRows,
  buildLast6MonthsOrderTrend,
  countEntities,
} from '@/lib/crmMetrics';
import { exportWorkbook } from '@/lib/exportExcel';
import { invokeCrmAi } from '@/lib/crmAi';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { updateProfile } from '@/lib/auth';
import { confirmDelete } from '@/lib/confirmDelete';
import { PAGE_TITLES, STAGE_COLORS } from '@/config/crm';


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
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#1B3A5C] via-[#162F4A] to-[#0f2035] lg:flex-row">
        <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
          <div className="max-w-md">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white">CRM-VP</span>
            </div>
            <h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Sistema CRM Innovador</h1>
            <p className="mb-8 text-blue-200">Gestiona tu ciclo comercial con inteligencia artificial.</p>
            <div className="rounded-xl bg-white/10 p-6 text-sm text-blue-200 backdrop-blur">
              <p className="mb-2 font-semibold text-white">Configuración requerida:</p>
              <ol className="list-inside list-decimal space-y-1">
                <li>Crea un proyecto en Supabase</li>
                <li>Ejecuta el schema SQL</li>
                <li>Configura .env.local</li>
              </ol>
            </div>
          </div>
        </div>
        <div className="flex w-full items-center justify-center bg-white p-8 dark:bg-slate-800 sm:p-12 lg:w-[480px] lg:max-w-none lg:flex-shrink-0">
          <div className="w-full max-w-sm text-center">
            <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Configuración Requerida</h2>
            <p className="mb-6 text-slate-500">Completá las variables de entorno</p>
          </div>
        </div>
      </div>
    );
  }

  if (registerSuccess) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#1B3A5C] via-[#162F4A] to-[#0f2035] lg:flex-row">
        <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
          <div className="max-w-md">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white">CRM-VP</span>
            </div>
            <h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Sistema CRM Innovador</h1>
            <p className="text-blue-200">Gestiona tu ciclo comercial.</p>
          </div>
        </div>
        <div className="flex w-full items-center justify-center bg-white p-8 dark:bg-slate-800 sm:p-12 lg:w-[480px] lg:max-w-none lg:flex-shrink-0">
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">¡Registro Exitoso!</h2>
            <p className="mb-6 text-slate-500">Verificá tu correo electrónico.</p>
            <Button onClick={() => setRegisterSuccess(false)} className="w-full">
              Volver al login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#1B3A5C] via-[#162F4A] to-[#0f2035] lg:flex-row">
      {/* Left - Branding */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6 sm:p-12">
        <div className="absolute left-10 top-16 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl sm:left-20 sm:top-20" />
        <div className="absolute bottom-16 right-10 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl sm:bottom-20 sm:right-20" />
        <div className="relative z-10 max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">CRM-VP</span>
          </div>
          <h1 className="mb-4 text-3xl font-bold leading-tight text-white sm:text-4xl">
            Sistema CRM Innovador para Ventas
          </h1>
          <p className="text-lg text-blue-200">
            Gestiona tu ciclo comercial con inteligencia artificial, automatización y analítica avanzada.
          </p>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex w-full items-center justify-center bg-white p-6 dark:bg-slate-800 sm:p-12 lg:w-[480px] lg:max-w-none lg:flex-shrink-0">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {isRegistering ? 'Crear Cuenta' : 'Bienvenido'}
          </h2>
          <p className="text-slate-500 mb-6">
            {isRegistering ? 'Regístrate para comenzar' : 'Inicia sesión para continuar'}
          </p>

          {(error || registerError) && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
              {registerError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label required>Nombre</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <Label required>Apellido</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Pérez"
                  />
                </div>
              </div>
            )}

            <div>
              <Label required>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@empresa.com"
              />
            </div>

            <div>
              <Label required>Contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </Button>
          </form>

          {!isRegistering && (
            <>
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs text-slate-400">o</span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
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
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {isRegistering ? '¿Ya tenés cuenta? Iniciá sesión' : '¿No tenés cuenta? Registrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
