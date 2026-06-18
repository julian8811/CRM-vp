import { useState } from 'react';
import { useCrmModal } from '@/contexts/CrmModalContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { DataTable } from '@/components/ui/DataTable';
import { Plus, Trash2, Eye, FileCheck, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/lib/crmMetrics';
import { confirmDelete } from '@/lib/confirmDelete';
import { StitchPageHeader } from '@/components/stitch/StitchPageHeader';
import { PageContainer } from '@/components/stitch/PageContainer';

const STATUS_LABELS = {
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  returned: 'Devuelto',
};

const NEXT_STATUS_LABEL = {
  confirmed: 'Preparando',
  preparing: 'Enviado',
  shipped: 'Entregado',
};

export function OrdersContent() {
  const { openModal } = useCrmModal();
  const orders = useStore((state) => state.orders);
  const deleteOrder = useStore((state) => state.deleteOrder);
  const advanceOrderStatus = useStore((state) => state.advanceOrderStatus);
  const [busyId, setBusyId] = useState(null);

  const handleView = (row) => {
    const lines = [
      `Pedido: ${row.order_number || row.number || '—'}`,
      `Cliente: ${row.customer_name || '—'}`,
      `Total: ${formatCurrency(Number(row.total) || 0)}`,
      `Estado: ${STATUS_LABELS[row.status] || row.status}`,
      `Transporte: ${row.carrier || '—'}`,
      `Fecha: ${row.created_at ? new Date(row.created_at).toLocaleDateString('es-CO') : '—'}`,
    ];
    window.alert(lines.join('\n'));
  };

  const handleAdvance = async (row) => {
    if (busyId) return;
    const nextLabel = NEXT_STATUS_LABEL[row.status];
    if (!nextLabel) {
      window.alert('Este pedido ya está entregado.');
      return;
    }
    if (!window.confirm(`¿Avanzar pedido ${row.order_number || row.number} a «${nextLabel}»?`)) return;
    setBusyId(row.id);
    const result = await advanceOrderStatus(row.id);
    setBusyId(null);
    if (result?.ok) {
      window.alert(`Pedido actualizado a «${nextLabel}».`);
    } else {
      window.alert(result?.error || 'No se pudo actualizar el pedido.');
    }
  };

  const columns = [
    {
      key: 'order_number',
      header: 'Pedido',
      sortable: true,
      render: (val) => <span className="font-mono text-sm font-medium text-stitch-text">{val}</span>,
    },
    {
      key: 'customer_name',
      header: 'Cliente',
      render: (val) => (
        <div className="flex items-center gap-2">
          <Avatar name={val || '?'} size="sm" />
          <span className="font-medium text-stitch-text">{val || '—'}</span>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      render: (val) => <span className="font-semibold text-stitch-text">{formatCurrency(Number(val) || 0)}</span>,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (val) => {
        const variants = { confirmed: 'amber', preparing: 'blue', shipped: 'purple', delivered: 'green', returned: 'red' };
        return <Badge variant={variants[val] || 'gray'}>{STATUS_LABELS[val] || val}</Badge>;
      },
    },
    { key: 'carrier', header: 'Transporte', render: (val) => val || '—' },
    {
      key: 'created_at',
      header: 'Fecha',
      render: (val) => (val ? new Date(val).toLocaleDateString('es-CO') : '—'),
    },
    {
      key: 'actions',
      header: '',
      render: (val, row) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            title="Ver detalle"
            disabled={busyId === row.id}
            onClick={() => handleView(row)}
            className="p-1.5 rounded-lg hover:bg-stitch-surface-elevated text-stitch-muted hover:text-stitch-primary-bright transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            title={NEXT_STATUS_LABEL[row.status] ? `Avanzar a ${NEXT_STATUS_LABEL[row.status]}` : 'Pedido completado'}
            disabled={busyId === row.id || !NEXT_STATUS_LABEL[row.status]}
            onClick={() => handleAdvance(row)}
            className="p-1.5 rounded-lg hover:bg-stitch-surface-elevated text-stitch-muted hover:text-stitch-success transition-colors disabled:opacity-40"
          >
            {busyId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
          </button>
          <button
            type="button"
            title="Eliminar pedido"
            disabled={busyId === row.id}
            onClick={() => {
              const num = row.order_number || row.number || '';
              if (confirmDelete(num ? `el pedido ${num}` : 'este pedido')) deleteOrder(row.id);
            }}
            className="p-1.5 rounded-lg hover:bg-stitch-surface-elevated text-stitch-muted hover:text-stitch-danger transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
      <StitchPageHeader
        title="Pedidos"
        subtitle={`${orders.length} pedidos`}
        actions={
          <Button type="button" onClick={() => openModal('order')} className="w-full justify-center sm:w-auto">
            <Plus className="w-4 h-4" />
            Nuevo Pedido
          </Button>
        }
      />
      <DataTable columns={columns} data={orders} searchPlaceholder="Buscar pedidos..." pageName="orders" />
    </PageContainer>
  );
}
