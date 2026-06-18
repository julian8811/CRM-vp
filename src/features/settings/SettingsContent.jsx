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


// Settings Page
export function SettingsContent() {
  const { user, profile } = useAuth();
  const meta = user?.user_metadata || {};
  const userPreferences = useStore((s) => s.userPreferences);
  const savePreferences = useStore((s) => s.savePreferences);
  const avatarInputRef = useRef(null);
  const [avatarErr, setAvatarErr] = useState('');
  const [profileForm, setProfileForm] = useState(null);
  const [profileStatus, setProfileStatus] = useState('');
  const resolvedProfileForm = profileForm ?? {
    first_name: profile?.first_name || meta.first_name || '',
    last_name: profile?.last_name || meta.last_name || '',
  };

  const defaultFlags = { leadEmail: true, reminders: true, quoteAlerts: false, weekly: true };
  const flags = { ...defaultFlags, ...(userPreferences?.notification_flags || {}) };

  const saveProfile = async () => {
    if (!user?.id) return;
    setProfileStatus('');
    const { error: profileError } = await updateProfile(user.id, {
      first_name: resolvedProfileForm.first_name.trim(),
      last_name: resolvedProfileForm.last_name.trim(),
    });
    if (profileError) {
      setProfileStatus(profileError.message);
      return;
    }
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        first_name: resolvedProfileForm.first_name.trim(),
        last_name: resolvedProfileForm.last_name.trim(),
      },
    });
    if (authError) setProfileStatus(authError.message);
    else setProfileStatus('Perfil actualizado.');
  };

  const toggle = async (key) => {
    const nextFlags = { ...flags, [key]: !flags[key] };
    await savePreferences({
      ai_assistant_enabled: Boolean(userPreferences?.ai_assistant_enabled),
      notification_flags: nextFlags,
    });
  };

  const onAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setAvatarErr('');
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) {
      setAvatarErr(upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    const { error: pErr } = await updateProfile(user.id, { avatar_url: pub.publicUrl });
    if (pErr) setAvatarErr(pErr.message);
    else window.location.reload();
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Configuración</h2>
        <p className="text-sm text-slate-500">Perfil y preferencias en Supabase (tabla user_preferences).</p>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Perfil (sesión actual)</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar src={profile?.avatar_url} name={`${meta.first_name || user?.email || '?'} ${meta.last_name || ''}`} size="lg" />
                <div>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" id="avatar-upload" onChange={onAvatar} />
                  <Button type="button" variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()}>
                    Cambiar foto
                  </Button>
                  {avatarErr && <p className="text-xs text-red-600 mt-1">{avatarErr}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Nombre</Label>
                  <Input
                    value={resolvedProfileForm.first_name}
                    onChange={(e) => setProfileForm({ ...resolvedProfileForm, first_name: e.target.value })}
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <Label>Apellido</Label>
                  <Input
                    value={resolvedProfileForm.last_name}
                    onChange={(e) => setProfileForm({ ...resolvedProfileForm, last_name: e.target.value })}
                    placeholder="Pérez"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="button" size="sm" onClick={saveProfile}>Guardar perfil</Button>
              </div>
              {profileStatus && <p className="text-xs text-slate-500">{profileStatus}</p>}
              <div>
                <Label>Email</Label>
                <Input readOnly type="email" value={user?.email || ''} />
              </div>
              {profile?.role && (
                <div>
                  <Label>Rol (perfil)</Label>
                  <Input readOnly value={profile.role} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Notificaciones</h3>
            <div className="space-y-3">
              {[
                { key: 'leadEmail', label: 'Email cuando llega un nuevo lead' },
                { key: 'reminders', label: 'Recordatorios de seguimiento' },
                { key: 'quoteAlerts', label: 'Alertas de cotización expirando' },
                { key: 'weekly', label: 'Resumen semanal de ventas' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                  <button
                    type="button"
                    onClick={() => toggle(item.key)}
                    className={`w-11 h-6 rounded-full transition-colors ${flags[item.key] ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${flags[item.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Integraciones</h3>
            <div className="space-y-3">
              {[
                { name: 'Supabase', status: isSupabaseConfigured() ? 'connected' : 'disconnected', icon: '🗄️' },
                { name: 'Google OAuth', status: 'connected', icon: '🔐' },
                { name: 'Meta (Lead Ads / WhatsApp)', status: 'disconnected', icon: '📣' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.name}</span>
                  </div>
                  <Badge variant={item.status === 'connected' ? 'green' : 'gray'}>
                    {item.status === 'connected' ? 'Conectado' : 'No conectado'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
