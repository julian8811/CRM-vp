import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import { Layout } from '@/components/layout/Layout';
import { CrmModalsHost } from '@/components/CrmModalsHost';
import { PAGE_TITLES } from '@/config/crm';
import { LoginPage } from '@/features/auth/LoginPage';
import { LoadingScreen } from '@/features/auth/LoadingScreen';
import { DashboardContent } from '@/features/dashboard/DashboardContent';
import { CustomersContent } from '@/features/customers/CustomersContent';
import { LeadsContent } from '@/features/leads/LeadsContent';
import { ProductsContent } from '@/features/products/ProductsContent';
import { PipelineContent } from '@/features/pipeline/PipelineContent';
import { QuotationsContent } from '@/features/quotations/QuotationsContent';
import { OrdersContent } from '@/features/orders/OrdersContent';
import { AutomationsContent } from '@/features/automations/AutomationsContent';
import { MetaContent } from '@/features/meta/MetaContent';
import { ReportsContent } from '@/features/reports/ReportsContent';
import { AIContent } from '@/features/ai/AIContent';
import { PostsaleContent } from '@/features/postsale/PostsaleContent';
import { SettingsContent } from '@/features/settings/SettingsContent';
import { UsersContent } from '@/features/users/UsersContent';

export default function App() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const fetchCustomers = useStore((state) => state.fetchCustomers);
  const fetchLeads = useStore((state) => state.fetchLeads);
  const fetchProducts = useStore((state) => state.fetchProducts);
  const fetchOpportunities = useStore((state) => state.fetchOpportunities);
  const fetchQuotations = useStore((state) => state.fetchQuotations);
  const fetchOrders = useStore((state) => state.fetchOrders);
  const fetchTickets = useStore((state) => state.fetchTickets);
  const fetchAutomations = useStore((state) => state.fetchAutomations);
  const fetchPreferences = useStore((state) => state.fetchPreferences);
  const fetchAppNotifications = useStore((state) => state.fetchAppNotifications);
  const fetchMetaIntegrations = useStore((state) => state.fetchMetaIntegrations);
  const fetchTeamProfiles = useStore((state) => state.fetchTeamProfiles);

  useEffect(() => {
    if (!user) return;
    fetchCustomers();
    fetchLeads();
    fetchProducts();
    fetchOpportunities();
    fetchQuotations();
    fetchOrders();
    fetchTickets();
    fetchAutomations();
    fetchPreferences();
    fetchAppNotifications();
    fetchMetaIntegrations();
    fetchTeamProfiles();
  }, [
    user,
    fetchCustomers,
    fetchLeads,
    fetchProducts,
    fetchOpportunities,
    fetchQuotations,
    fetchOrders,
    fetchTickets,
    fetchAutomations,
    fetchPreferences,
    fetchAppNotifications,
    fetchMetaIntegrations,
    fetchTeamProfiles,
  ]);

  if (authLoading) return <LoadingScreen />;
  if (!user) return <LoginPage />;

  const pageInfo = PAGE_TITLES[currentPage] || { title: currentPage, subtitle: '' };
  const meta = user.user_metadata || {};
  const layoutUser = {
    first_name: profile?.first_name ?? meta.first_name ?? user.email?.split('@')[0] ?? '',
    last_name: profile?.last_name ?? meta.last_name ?? '',
    role: profile?.role ?? meta.role ?? 'sales',
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardContent />;
      case 'customers':
        return <CustomersContent />;
      case 'leads':
        return <LeadsContent />;
      case 'pipeline':
        return <PipelineContent />;
      case 'products':
        return <ProductsContent />;
      case 'quotations':
        return <QuotationsContent />;
      case 'orders':
        return <OrdersContent />;
      case 'automations':
        return <AutomationsContent />;
      case 'meta':
        return <MetaContent />;
      case 'reports':
        return <ReportsContent />;
      case 'ai':
        return <AIContent />;
      case 'postsale':
        return <PostsaleContent />;
      case 'settings':
        return <SettingsContent />;
      case 'users':
        return <UsersContent />;
      default:
        return (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">{pageInfo.title}</h3>
              <p className="text-slate-500">Módulo en desarrollo</p>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <Layout
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        user={layoutUser}
        onLogout={logout}
        title={pageInfo.title}
        subtitle={pageInfo.subtitle}
      >
        <div key={currentPage}>{renderPage()}</div>
      </Layout>
      <CrmModalsHost />
    </>
  );
}
