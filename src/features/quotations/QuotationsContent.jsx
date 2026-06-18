import { useState } from 'react';
import { useCrmModal } from '@/contexts/CrmModalContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { DataTable } from '@/components/ui/DataTable';
import { Plus, Trash2, Eye, Send, Download, ShoppingCart, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/lib/crmMetrics';
import { confirmDelete } from '@/lib/confirmDelete';
import { exportToExcel } from '@/lib/exportExcel';
import { StitchPageHeader } from '@/components/stitch/StitchPageHeader';
import { PageContainer } from '@/components/stitch/PageContainer';

const STATUS_LABELS = {
  draft: 'Borrador',
  sent: 'Enviada',
  approved: 'Aprobada',
  reviewed: 'Revisada',
  rejected: 'Rechazada',
};

export function QuotationsContent() {
  const { openModal } = useCrmModal();
  const quotations = useStore((state) => state.quotations);
  const deleteQuotation = useStore((state) => state.deleteQuotation);
  const updateQuotation = useStore((state) => state.updateQuotation);
  const convertQuotationToOrder = useStore((state) => state.convertQuotationToOrder);
  const [busyId, setBusyId] = useState(null);

  const handleView = (row) => {
    const lines = [
      `Número: ${row.quote_number || row.number || '—'}`,
      `Cliente: ${row.customer_name || '—'}`,
      `Total: ${formatCurrency(Number(row.total) || 0)}`,
      `Estado: ${STATUS_LABELS[row.status] || row.status}`,
      `Válida hasta: ${row.valid_until ? new Date(row.valid_until).toLocaleDateString('es-CO') : '—'}`,
      `Fecha: ${row.created_at ? new Date(row.created_at).toLocaleDateString('es-CO') : '—'}`,
    ];
    window.alert(lines.join('\n'));
  };

  const handleSend = async (row) => {
    if (busyId) return;
    setBusyId(row.id);
    const result = await updateQuotation(row.id, { status: 'sent' });
    setBusyId(null);
    if (result?.ok) {
      window.alert(`Cotización ${row.quote_number || row.number} marcada como enviada.`);
    } else {
      window.alert(result?.error || 'No se pudo enviar la cotización.');
    }
  };

  const handleConvertToOrder = async (row) => {
    if (busyId) return;
    if (!window.confirm(`¿Convertir la cotización ${row.quote_number || row.number} en pedido?`)) return;
    setBusyId(row.id);
    const result = await convertQuotationToOrder(row.id);
    setBusyId(null);
    if (result?.ok) {
      window.alert('Pedido creado desde la cotización.');
    } else {
      window.alert(result?.error || 'No se pudo convertir la cotización.');
    }
  };

  const handleExport = (row) => {
    exportToExcel(
      [row],
      `cotizacion-${row.quote_number || row.number || row.id}`,
      [
        { key: 'quote_number', header: 'Número' },
        { key: 'customer_name', header: 'Cliente' },
        { key: 'total', header: 'Total' },
        { key: 'status', header: 'Estado' },
        { key: 'valid_until', header: 'Válida hasta' },
        { key: 'created_at', header: 'Fecha' },
      ]
    );
  };

  const columns = [
    {
      key: 'quote_number',
      header: 'Número',
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
        const variants = { draft: 'gray', sent: 'blue', approved: 'green', reviewed: 'amber', rejected: 'red' };
        return <Badge variant={variants[val] || 'gray'}>{STATUS_LABELS[val] || val}</Badge>;
      },
    },
    {
      key: 'valid_until',
      header: 'Válida hasta',
      render: (val) => (val ? new Date(val).toLocaleDateString('es-CO') : '—'),
    },
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
            title="Marcar como enviada"
            disabled={busyId === row.id || row.status === 'sent' || row.status === 'approved'}
            onClick={() => handleSend(row)}
            className="p-1.5 rounded-lg hover:bg-stitch-surface-elevated text-stitch-muted hover:text-stitch-success transition-colors disabled:opacity-40"
          >
            {busyId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
          <button
            type="button"
            title="Convertir a pedido"
            disabled={busyId === row.id}
            onClick={() => handleConvertToOrder(row)}
            className="p-1.5 rounded-lg hover:bg-stitch-surface-elevated text-stitch-muted hover:text-stitch-success transition-colors disabled:opacity-40"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Exportar Excel"
            disabled={busyId === row.id}
            onClick={() => handleExport(row)}
            className="p-1.5 rounded-lg hover:bg-stitch-surface-elevated text-stitch-muted hover:text-stitch-primary-bright transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Eliminar cotización"
            disabled={busyId === row.id}
            onClick={() => {
              const num = row.quote_number || row.number || '';
              if (confirmDelete(num ? `la cotización ${num}` : 'esta cotización')) deleteQuotation(row.id);
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
        title="Cotizaciones"
        subtitle={`${quotations.length} cotizaciones`}
        actions={
          <Button type="button" onClick={() => openModal('quotation')} className="w-full justify-center sm:w-auto">
            <Plus className="w-4 h-4" />
            Nueva Cotización
          </Button>
        }
      />
      <DataTable columns={columns} data={quotations} searchPlaceholder="Buscar cotizaciones..." pageName="quotations" />
    </PageContainer>
  );
}
