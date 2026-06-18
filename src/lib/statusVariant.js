export function statusVariant(status) {
  if (status === 'active' || status === 'processed') return 'green';
  if (status === 'paused' || status === 'draft') return 'amber';
  if (status === 'error') return 'red';
  return 'gray';
}
