import { useState } from 'react';
import { useCrmModal } from '@/contexts/CrmModalContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { DataTable } from '@/components/ui/DataTable';
import { Plus, Trash2, ArrowRightCircle, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { confirmDelete } from '@/lib/confirmDelete';
import { StitchPageHeader } from '@/components/stitch/StitchPageHeader';
import { PageContainer } from '@/components/stitch/PageContainer';

export function LeadsContent() {
  const { openModal } = useCrmModal();
  const leads = useStore((state) => state.leads);
  const convertLead = useStore((state) => state.convertLead);
  const deleteLead = useStore((state) => state.deleteLead);
  const [convertingId, setConvertingId] = useState(null);

  const handleConvert = async (row) => {
    if (convertingId) return;
    setConvertingId(row.id);
    const result = await convertLead(row.id);
    setConvertingId(null);
    if (result?.ok) {
      window.alert(`«${row.first_name} ${row.last_name}» convertido a cliente correctamente.`);
    } else if (result?.error) {
      window.alert(result.error);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Lead',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${row.first_name} ${row.last_name}`} size="sm" />
          <div>
            <div className="font-medium text-stitch-text">{row.first_name} {row.last_name}</div>
            <div className="text-xs text-stitch-muted">{row.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'company', header: 'Empresa' },
    { key: 'source', header: 'Fuente', render: (val) => <Badge variant="gray">{val}</Badge> },
    {
      key: 'interest',
      header: 'Interés',
      render: (val) => {
        const styles = { hot: 'red', warm: 'amber', cold: 'blue' };
        const labels = { hot: '🔥 Caliente', warm: '🌤 Tibio', cold: '❄️ Frío' };
        return <Badge variant={styles[val] || 'gray'}>{labels[val] || val}</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Estado',
      render: (val) => {
        const variants = { new: 'blue', contacted: 'amber', qualified: 'green', converted: 'purple', lost: 'gray' };
        const labels = { new: 'nuevo', contacted: 'contactado', qualified: 'calificado', converted: 'convertido', lost: 'perdido' };
        return <Badge variant={variants[val] || 'gray'}>{labels[val] || val}</Badge>;
      },
    },
    {
      key: 'score',
      header: 'Score',
      sortable: true,
      render: (val) => (
        <span className={`font-bold ${val >= 70 ? 'text-emerald-600' : val >= 40 ? 'text-amber-600' : 'text-stitch-muted'}`}>
          {val}
        </span>
      ),
    },
    {
      key: 'budget',
      header: 'Presupuesto',
      render: (val) => (val ? <span className="text-stitch-muted">${Math.round(val).toLocaleString()}</span> : '—'),
    },
    {
      key: 'actions',
      header: '',
      render: (val, row) => (
        <div className="flex justify-center items-center gap-2 flex-wrap">
          {row.status !== 'converted' ? (
            <Button
              size="sm"
              variant="outline"
              type="button"
              disabled={convertingId === row.id}
              onClick={() => handleConvert(row)}
            >
              {convertingId === row.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ArrowRightCircle className="w-3 h-3" />
              )}
              Convertir
            </Button>
          ) : (
            <Badge variant="purple">✓ Convertido</Badge>
          )}
          <button
            type="button"
            title="Eliminar prospecto"
            onClick={() => {
              if (confirmDelete('este prospecto')) deleteLead(row.id);
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
        title="Leads"
        subtitle={`Gestión de prospectos · ${leads.length} registros`}
        actions={
          <Button type="button" onClick={() => openModal('lead')} className="w-full justify-center sm:w-auto">
            <Plus className="w-4 h-4" />
            Nuevo prospecto
          </Button>
        }
      />
      <DataTable columns={columns} data={leads} searchPlaceholder="Buscar prospectos..." pageName="leads" />
    </PageContainer>
  );
}
