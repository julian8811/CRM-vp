import { useCrmModal } from '../contexts/CrmModalContext';
import {
  CustomerModal,
  LeadModal,
  ProductModal,
  QuotationModal,
  OrderModal,
  OpportunityModal,
} from './Modals';

export function CrmModalsHost() {
  const { modal, closeModal } = useCrmModal();
  if (!modal?.name) return null;

  switch (modal.name) {
    case 'customer':
      return <CustomerModal onClose={closeModal} customer={modal.customer} />;
    case 'lead':
      return <LeadModal onClose={closeModal} />;
    case 'product':
      return <ProductModal onClose={closeModal} />;
    case 'quotation':
      return <QuotationModal onClose={closeModal} />;
    case 'order':
      return <OrderModal onClose={closeModal} />;
    case 'opportunity':
      return <OpportunityModal onClose={closeModal} />;
    default:
      return null;
  }
}
