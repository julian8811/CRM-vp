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
import { StitchPageHeader } from '@/components/stitch/StitchPageHeader';


// Users Page
export function UsersContent() {
  const { user, profile } = useAuth();
  const teamProfiles = useStore((s) => s.teamProfiles);
  const teamProfilesLoading = useStore((s) => s.teamProfilesLoading);
  const updateTeamMemberRole = useStore((s) => s.updateTeamMemberRole);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  const [roleStatus, setRoleStatus] = useState('');

  const sendInvite = async () => {
    setInviteStatus('');
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setInviteStatus('Ingresá un email válido.');
      return;
    }
    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: { email: inviteEmail.trim(), redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      setInviteStatus(error.message || 'Error al invitar');
      return;
    }
    if (data?.error) {
      setInviteStatus(data.error);
      return;
    }
    setInviteStatus(`Invitación enviada a ${inviteEmail.trim()}.`);
  };

  const users = (teamProfiles.length ? teamProfiles : profile
    ? [{
        id: user?.id,
        name: `${user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Usuario'} ${user?.user_metadata?.last_name || ''}`.trim(),
        email: user?.email || '—',
        role: profile.role || 'sales',
        team: profile.team || '—',
        status: 'active',
      }]
    : []).map((row) => ({
      ...row,
      name: row.name || `${row.first_name || ''} ${row.last_name || ''}`.trim(),
      status: 'active',
    }));

  const handleRoleChange = async (userId, nextRole) => {
    setRoleStatus('');
    const result = await updateTeamMemberRole(userId, nextRole);
    if (result.success) setRoleStatus('Rol actualizado.');
    else setRoleStatus(result.error || 'No se pudo actualizar el rol.');
  };
  
  const columns = [
    { key: 'name', header: 'Usuario', render: (val, row) => (
      <div className="flex items-center gap-3">
        <Avatar name={val} size="sm" />
        <div>
          <div className="font-medium text-slate-900 dark:text-white">{val}</div>
          <div className="text-xs text-slate-500">{row.email}</div>
        </div>
      </div>
    )},
    { key: 'role', header: 'Rol', render: (val, row) => {
      if (profile?.role === 'admin' && row.id !== user?.id) {
        return (
          <select
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
            value={val}
            onChange={(e) => handleRoleChange(row.id, e.target.value)}
          >
            <option value="sales">Vendedor</option>
            <option value="manager">Gerente</option>
            <option value="admin">Admin</option>
          </select>
        );
      }
      const variants = { admin: 'purple', manager: 'blue', sales: 'gray' };
      const labels = { admin: 'Admin', manager: 'Gerente', sales: 'Vendedor' };
      return <Badge variant={variants[val] || 'gray'}>{labels[val] || val}</Badge>;
    }},
    { key: 'team', header: 'Equipo' },
    { key: 'status', header: 'Estado', render: (val) => (
      <Badge variant={val === 'active' ? 'green' : 'gray'}>
        {val === 'active' ? 'Activo' : 'Inactivo'}
      </Badge>
    )},
  ];

  return (
    <div className="max-w-[1440px] mx-auto">
      <StitchPageHeader
        title="Usuarios"
        subtitle={`${users.length} ${users.length === 1 ? 'usuario' : 'usuarios'} · Equipo desde Supabase Auth + profiles`}
        actions={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          {profile?.role === 'admin' && (
            <>
              <Input
                type="email"
                placeholder="email@empresa.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full min-w-0 sm:w-56"
              />
              <Button type="button" variant="outline" onClick={sendInvite} className="w-full justify-center sm:w-auto">
                <UserPlus className="w-4 h-4" />
                Invitar
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center sm:w-auto"
            onClick={() => window.open('https://supabase.com/dashboard/project/tgosnmvlvzaykiuolrot/auth/users', '_blank', 'noopener')}
          >
            Gestionar en Supabase
          </Button>
        </div>
        }
      />
      {(inviteStatus || roleStatus) && (
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{inviteStatus || roleStatus}</p>
      )}
      {teamProfilesLoading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando equipo…
        </div>
      ) : !users.length ? (
        <p className="text-sm text-slate-500">No hay perfiles cargados. Verificá la tabla <code className="text-xs">profiles</code> y la migración <code className="text-xs">get_team_profiles</code>.</p>
      ) : (
        <DataTable columns={columns} data={users} searchPlaceholder="Buscar usuarios..." pageName="users" />
      )}
    </div>
  );
}
