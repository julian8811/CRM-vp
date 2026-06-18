import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCrmModal } from '@/contexts/CrmModalContext';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Plus, GripVertical, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/lib/crmMetrics';
import { confirmDelete } from '@/lib/confirmDelete';
import { STAGE_COLORS } from '@/config/crm';
import { PageContainer } from '@/components/stitch/PageContainer';

const STAGES = ['lead', 'contact', 'qualification', 'proposal', 'negotiation', 'closed_won'];

function probabilityStyle(p) {
  if (p >= 70) return 'text-stitch-success bg-stitch-success/10 border-stitch-success/20';
  if (p >= 40) return 'text-stitch-warning bg-stitch-warning/10 border-stitch-warning/20';
  return 'text-stitch-danger bg-stitch-danger/10 border-stitch-danger/20';
}

function OpportunityCard({ opp, stage, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
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
      className="stitch-kanban-card group relative touch-none"
    >
      <button
        type="button"
        title="Eliminar oportunidad"
        className="absolute right-2 top-2 z-10 rounded-md p-1 text-stitch-muted opacity-0 transition-opacity hover:bg-stitch-danger/10 hover:text-stitch-danger group-hover:opacity-100"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(opp.id, stage);
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-2 pr-6">
        <GripVertical className="w-4 h-4 text-stitch-muted opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-stitch-text mb-1 truncate">{opp.name}</h4>
          {opp.customer && (
            <p className="text-xs font-mono text-stitch-muted mb-3 truncate uppercase tracking-wide">{opp.customer}</p>
          )}
          <div className="flex justify-between items-end pt-3 border-t border-stitch-border/30">
            <div>
              <span className="block text-[10px] font-mono text-stitch-muted mb-0.5">VALOR</span>
              <span className="text-sm font-medium text-stitch-text">
                {formatCurrency(opp.value || 0)}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-mono text-stitch-muted mb-0.5">PROB.</span>
              <span className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded border ${probabilityStyle(opp.probability)}`}>
                {opp.probability}%
              </span>
            </div>
          </div>
          {opp.assignee && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-stitch-border/20">
              <Avatar name={opp.assignee} size="sm" />
              <span className="text-xs text-stitch-muted truncate">{opp.assignee}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PipelineColumn({ stage, opps, onDeleteOpp }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { type: 'column', stage },
  });

  const total = opps.reduce((s, o) => s + (o.value || 0), 0);
  const stageLabel = stage.replace(/_/g, ' ');

  return (
    <div className="stitch-kanban-col">
      <div className="flex justify-between items-center mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_COLORS[stage] || '#5f8bff' }} />
          <h3 className="text-xs font-mono font-semibold text-stitch-text uppercase tracking-wider">{stageLabel}</h3>
          <span className="px-2 py-0.5 rounded bg-stitch-surface-elevated text-stitch-muted text-[10px] font-mono">
            {opps.length}
          </span>
        </div>
        <span className="text-xs font-mono text-stitch-muted">{formatCurrency(total)}</span>
      </div>
      <SortableContext items={opps.map((o) => o.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex-1 min-h-[280px] sm:min-h-[360px] md:min-h-[420px] rounded-lg p-2 space-y-3 transition-colors custom-scrollbar overflow-y-auto ${
            isOver ? 'bg-stitch-primary-bright/5 ring-1 ring-stitch-primary-bright/30' : 'bg-stitch-surface-elevated/50'
          }`}
        >
          {opps.length === 0 ? (
            <div className="text-center py-12 text-sm text-stitch-muted font-mono pointer-events-none">Sin oportunidades</div>
          ) : (
            opps.map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} stage={stage} onDelete={onDeleteOpp} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function resolveTargetStage(over, pipeline, stages) {
  if (!over) return null;

  const overData = over.data.current;
  if (overData?.type === 'column' && overData.stage) return overData.stage;
  if (overData?.type === 'opportunity' && overData.stage) return overData.stage;
  if (stages.includes(String(over.id))) return String(over.id);

  for (const stage of stages) {
    if ((pipeline[stage] || []).some((o) => o.id === over.id)) {
      return stage;
    }
  }

  return null;
}

function findActiveOpportunity(pipeline, activeId) {
  if (!activeId) return null;
  for (const stage of STAGES) {
    const found = (pipeline[stage] || []).find((o) => o.id === activeId);
    if (found) return { ...found, stage };
  }
  return null;
}

function computePipelineTotals(pipeline) {
  let count = 0;
  let value = 0;
  STAGES.forEach((s) => {
    (pipeline[s] || []).forEach((o) => {
      count += 1;
      value += o.value || 0;
    });
  });
  return { count, value };
}

export function PipelineContent() {
  const { openModal } = useCrmModal();
  const pipeline = useStore((state) => state.pipeline) ?? {};
  const movePipelineOpportunity = useStore((state) => state.movePipelineOpportunity);
  const deleteOpportunity = useStore((state) => state.deleteOpportunity);

  const handleDeleteOpp = useCallback(
    (oppId, stage) => {
      if (!confirmDelete('esta oportunidad del embudo')) return;
      deleteOpportunity(oppId, stage);
    },
    [deleteOpportunity]
  );

  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeOppData = findActiveOpportunity(pipeline, activeId);
  const totalPipeline = computePipelineTotals(pipeline);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const fromStage = active.data.current?.stage;
    const toStage = resolveTargetStage(over, pipeline, STAGES);

    if (!fromStage || !toStage || fromStage === toStage) return;

    const result = await movePipelineOpportunity(active.id, fromStage, toStage);
    if (result?.ok === false && result.error && typeof window !== 'undefined') {
      window.alert(result.error);
    }
  };

  return (
    <PageContainer size="full" className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-stitch-text tracking-tight">Embudo de Ventas</h2>
          <p className="text-xs sm:text-sm text-stitch-muted mt-1">
            {totalPipeline.count} oportunidades · {formatCurrency(totalPipeline.value)} en pipeline
          </p>
        </div>
        <Button type="button" onClick={() => openModal('opportunity')} className="w-full sm:w-auto shrink-0">
          <Plus className="w-4 h-4" />
          Nueva Oportunidad
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e) => setActiveId(e.active.id)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="kanban-scroll custom-scrollbar gap-4 sm:gap-6">
          {STAGES.map((stage) => (
            <PipelineColumn
              key={stage}
              stage={stage}
              opps={pipeline[stage] || []}
              onDeleteOpp={handleDeleteOpp}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeOppData ? (
            <div className="stitch-kanban-card w-72 shadow-glow opacity-95 cursor-grabbing">
              <div className="font-semibold text-sm text-stitch-text mb-1">{activeOppData.name}</div>
              <div className="flex justify-between text-xs font-mono text-stitch-muted">
                <span>{formatCurrency(activeOppData.value)}</span>
                <span>{activeOppData.probability}%</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </PageContainer>
  );
}
