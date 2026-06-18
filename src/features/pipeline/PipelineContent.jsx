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


function OpportunityCard({ opp, stage, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: opp.id,
    data: { type: 'opportunity', opp, stage },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
    >
      <button
        type="button"
        title="Eliminar oportunidad"
        className="absolute right-2 top-2 z-10 rounded-md p-1 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950/40"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(opp.id, stage);
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-start gap-2 pr-6">
        <GripVertical className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-slate-900 dark:text-white mb-1 truncate">{opp.name}</div>
          {opp.customer && (
            <div className="text-xs text-slate-500 mb-2 truncate">{opp.customer}</div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              ${(opp.value / 1000000).toFixed(1)}M
            </span>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              opp.probability >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              opp.probability >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {opp.probability}%
            </span>
          </div>
          {opp.assignee && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <Avatar name={opp.assignee} size="xs" />
              <span className="text-xs text-slate-500">{opp.assignee}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Columna del Kanban
function PipelineColumn({ stage, opps, onDeleteOpp }) {
  const {
    setNodeRef,
    isOver,
  } = useSortable({
    id: stage,
    data: { type: 'column', stage },
  });

  const total = opps.reduce((s, o) => s + (o.value || 0), 0);

  return (
    <div className="flex-shrink-0 w-72">
      <div className={`bg-slate-100 dark:bg-slate-800 rounded-t-xl p-3 flex items-center justify-between transition-colors ${isOver ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STAGE_COLORS[stage] }} />
          <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{stage.replace('_', ' ')}</span>
          <span className="text-xs bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-500">{opps.length}</span>
        </div>
        <span className="text-xs text-slate-500">${(total / 1000000).toFixed(1)}M</span>
      </div>
      <div
        ref={setNodeRef}
        className={`bg-slate-50 dark:bg-slate-900/50 rounded-b-xl p-2 min-h-[400px] space-y-2 transition-colors ${isOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
      >
        <SortableContext items={opps.map(o => o.id)} strategy={verticalListSortingStrategy}>
          {opps.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">Sin oportunidades</div>
          ) : (
            opps.map(opp => (
              <OpportunityCard key={opp.id} opp={opp} stage={stage} onDelete={onDeleteOpp} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export function PipelineContent() {
  const { openModal } = useCrmModal();
  const pipeline = useStore(state => state.pipeline) || {};
  const movePipelineOpportunity = useStore(state => state.movePipelineOpportunity);
  const deleteOpportunity = useStore(state => state.deleteOpportunity);

  const handleDeleteOpp = useCallback((oppId, stage) => {
    if (!confirmDelete('esta oportunidad del embudo')) return;
    deleteOpportunity(oppId, stage);
  }, [deleteOpportunity]);
  const stages = useMemo(
    () => ['lead', 'contact', 'qualification', 'proposal', 'negotiation', 'closed_won'],
    []
  );

  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Encontrar la oportunidad activa
  const activeOppData = (() => {
    if (!activeId) return null;
    for (const stage of stages) {
      const opps = pipeline[stage] || [];
      const found = opps.find(o => o.id === activeId);
      if (found) return { ...found, stage };
    }
    return null;
  })();

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeData = active.data.current;
    const overData = over.data.current;

    let fromStage = activeData?.stage;
    let toStage = overData?.stage;

    // Si es un sortable dentro de la misma columna
    if (!toStage && overData?.type === 'opportunity') {
      // Buscar en qué etapa está el destino
      for (const stage of stages) {
        const opps = pipeline[stage] || [];
        if (opps.some(o => o.id === over.id)) {
          toStage = stage;
          break;
        }
      }
    }

    // Si arrastramos sobre una columna
    if (overData?.type === 'column') {
      toStage = overData.stage;
    }

    if (fromStage && toStage && fromStage !== toStage) {
      movePipelineOpportunity(active.id, fromStage, toStage);
    }

    setActiveId(null);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Embudo de Ventas</h2>
          <p className="text-sm text-slate-500">Arrastrá las oportunidades entre etapas</p>
        </div>
        <Button type="button" onClick={() => openModal('opportunity')} className="w-full justify-center sm:w-auto">
          <Plus className="w-4 h-4" />
          Nueva Oportunidad
        </Button>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map(stage => (
            <PipelineColumn key={stage} stage={stage} opps={pipeline[stage] || []} onDeleteOpp={handleDeleteOpp} />
          ))}
        </div>
        <DragOverlay>
          {activeOppData ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-xl cursor-grabbing w-72">
              <div className="font-medium text-sm text-slate-900 dark:text-white mb-1">{activeOppData.name}</div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">${(activeOppData.value / 1000000).toFixed(1)}M</span>
                <span className="text-slate-400">{activeOppData.probability}%</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
