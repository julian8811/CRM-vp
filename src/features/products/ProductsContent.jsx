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
import { StitchPageHeader } from '@/components/stitch/StitchPageHeader';
import { PageContainer } from '@/components/stitch/PageContainer';


// Products Page
export function ProductsContent() {
  const { openModal } = useCrmModal();
  const products = useStore(state => state.products);
  const deleteProduct = useStore(state => state.deleteProduct);

  return (
    <PageContainer>
      <StitchPageHeader
        title="Productos"
        subtitle={`${products.length} productos en catálogo`}
        actions={
          <Button type="button" onClick={() => openModal('product')} className="w-full justify-center sm:w-auto">
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map(product => (
          <Card key={product.id} hover className="overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-stitch-surface-elevated to-stitch-bg flex items-center justify-center relative border-b border-stitch-border/30">
              <Package className="w-10 h-10 text-stitch-muted" />
              {product.stock <= 5 && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs px-2 py-1 rounded-full font-medium">
                  <AlertTriangle className="w-3 h-3" /> Existencia baja
                </div>
              )}
              <div className="absolute top-2 left-2">
                <Badge variant="green">Activo</Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="text-xs text-stitch-muted font-mono mb-1">{product.sku}</div>
              {product.category && (
                <div className="text-[11px] text-stitch-muted mb-1 line-clamp-1" title={product.category}>
                  {product.category}
                </div>
              )}
              <div className="font-semibold text-stitch-text mb-2 line-clamp-2">{product.name}</div>
              <div className="flex items-baseline gap-2 mb-3">
                {product.discount_price ? (
                  <>
                    <span className="text-lg font-bold text-stitch-text">${Math.round(product.discount_price).toLocaleString()}</span>
                    <span className="text-sm text-stitch-muted line-through">${Math.round(product.price).toLocaleString()}</span>
                  </>
                ) : (
                  <span className="text-lg font-bold text-stitch-text">${Math.round(product.price).toLocaleString()}</span>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stitch-muted">Existencia: <span className={`font-medium ${product.stock <= 5 ? 'text-stitch-danger' : 'text-stitch-text'}`}>{product.stock}</span></span>
                <span className="text-stitch-muted">Margen: <span className="font-medium text-stitch-text">{product.margin}%</span></span>
              </div>
              <div className="mt-3 flex justify-end border-t border-stitch-border/30 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
                  onClick={() => {
                    if (confirmDelete(`el producto «${product.name}»`)) deleteProduct(product.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}

// Componente de tarjeta de oportunidad en el Pipeline
