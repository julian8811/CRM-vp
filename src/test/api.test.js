import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase first
const mockFrom = vi.fn();
const mockRpc = vi.fn();
const mockFunctionsInvoke = vi.fn();
const mockAuthGetUser = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
    rpc: (...args) => mockRpc(...args),
    functions: {
      invoke: (...args) => mockFunctionsInvoke(...args),
    },
    auth: {
      getUser: (...args) => mockAuthGetUser(...args),
    },
  },
}));

// Import api after mocking
const { api } = await import('../lib/api');

const mockCustomer = {
  id: 'cust-1',
  name: 'Test Customer',
  company: 'Test Corp',
  email: 'test@example.com',
};

const mockLead = {
  id: 'lead-1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
};

const mockProduct = {
  id: 'prod-1',
  sku: 'SKU-001',
  name: 'Test Product',
  price: 100,
};

// Helper to build mock query chain
const buildMockQuery = (data, error = null) => ({
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data, error }),
  maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  update: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  then: vi.fn((res) => Promise.resolve(res({ data, error }))),
});

describe('api.js - Customers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
  });

  it('customers.getAll returns success with data', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockCustomer], error: null }),
    });

    const result = await api.customers.getAll();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([mockCustomer]);
    expect(mockFrom).toHaveBeenCalledWith('customers');
  });

  it('customers.getAll returns error on failure', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Network error' } }),
    });

    const result = await api.customers.getAll();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('customers.create inserts and returns data', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockCustomer, error: null }),
    });

    const result = await api.customers.create(mockCustomer);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockCustomer);
  });

  it('customers.update updates and returns data', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ...mockCustomer, name: 'Updated' }, error: null }),
    });

    const result = await api.customers.update('cust-1', { name: 'Updated' });

    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Updated');
  });

  it('customers.delete deletes and returns success', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const result = await api.customers.delete('cust-1');

    expect(result.success).toBe(true);
    expect(result.data.deleted).toBe(true);
  });
});

describe('api.js - Leads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
  });

  it('leads.getAll returns success with data', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockLead], error: null }),
    });

    const result = await api.leads.getAll();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([mockLead]);
  });

  it('leads.create inserts and returns data', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockLead, error: null }),
    });

    const result = await api.leads.create(mockLead);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockLead);
  });

  it('leads.update updates and returns data', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ...mockLead, status: 'converted' }, error: null }),
    });

    const result = await api.leads.update('lead-1', { status: 'converted' });

    expect(result.success).toBe(true);
    expect(result.data.status).toBe('converted');
  });

  it('leads.delete deletes and returns success', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const result = await api.leads.delete('lead-1');

    expect(result.success).toBe(true);
    expect(result.data.deleted).toBe(true);
  });

  it('leads.convert updates status to converted', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ...mockLead, status: 'converted' }, error: null }),
    });

    const result = await api.leads.convert('lead-1');

    expect(result.success).toBe(true);
    expect(result.data.status).toBe('converted');
  });
});

describe('api.js - Products', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
  });

  it('products.getAll returns success with data', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockProduct], error: null }),
    });

    const result = await api.products.getAll();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([mockProduct]);
  });

  it('products.create handles duplicate SKU error', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key error' },
      }),
    });

    const result = await api.products.create(mockProduct);

    expect(result.success).toBe(false);
    expect(result.error).toContain('SKU');
  });

  it('products.delete deletes and returns success', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const result = await api.products.delete('prod-1');

    expect(result.success).toBe(true);
  });
});

describe('api.js - Opportunities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
  });

  it('opportunities.getAll returns success with data', async () => {
    const mockOpp = { id: 'opp-1', name: 'Deal', stage: 'lead', customers: { name: 'Test' } };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockOpp], error: null }),
    });

    const result = await api.opportunities.getAll();

    expect(result.success).toBe(true);
    expect(result.data[0].customer).toBe('Test');
  });

  it('opportunities.moveStage updates stage', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'opp-1', stage: 'contact' }, error: null }),
    });

    const result = await api.opportunities.moveStage('opp-1', 'contact');

    expect(result.success).toBe(true);
    expect(result.data.stage).toBe('contact');
  });
});

describe('api.js - Quotations & Orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
  });

  it('quotations.getAll returns success with transformed data', async () => {
    const mockQuote = { id: 'q-1', number: 'Q-001', customers: { name: 'ACME' }, total: 1000 };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockQuote], error: null }),
    });

    const result = await api.quotations.getAll();

    expect(result.success).toBe(true);
    expect(result.data[0].customer_name).toBe('ACME');
  });

  it('orders.getAll returns success with transformed data', async () => {
    const mockOrder = { id: 'o-1', number: 'O-001', customers: { name: 'ACME' }, total: 500 };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockOrder], error: null }),
    });

    const result = await api.orders.getAll();

    expect(result.success).toBe(true);
    expect(result.data[0].order_number).toBe('O-001');
  });
});

describe('api.js - Support Tickets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
  });

  it('supportTickets.getAll returns success with data', async () => {
    const mockTicket = { id: 'tk-1', subject: 'Help', status: 'open' };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockTicket], error: null }),
    });

    const result = await api.supportTickets.getAll();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([mockTicket]);
  });
});

describe('api.js - User Preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
    mockAuthGetUser.mockReset();
  });

  it('userPreferences.get returns user preferences', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { ai_assistant_enabled: true }, error: null }),
    });

    const result = await api.userPreferences.get();

    expect(result.success).toBe(true);
    expect(result.data.ai_assistant_enabled).toBe(true);
  });

  it('userPreferences.get returns error when no session', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null } });

    const result = await api.userPreferences.get();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('api.js - Automation Rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
  });

  it('automationRules.getAll returns success with data', async () => {
    const mockRule = { id: 'rule-1', name: 'Auto Reply', status: 'active' };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockRule], error: null }),
    });

    const result = await api.automationRules.getAll();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([mockRule]);
  });
});

describe('api.js - App Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
    mockAuthGetUser.mockReset();
  });

  it('appNotifications.getAll returns success with data', async () => {
    const mockNotif = { id: 'notif-1', title: 'New lead', read_at: null };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [mockNotif], error: null }),
    });

    const result = await api.appNotifications.getAll();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([mockNotif]);
  });
});

describe('api.js - Meta Integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
  });

  it('metaIntegrations.getAll returns success with data', async () => {
    const mockInt = { id: 'int-1', name: 'Meta Biz', status: 'active' };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockInt], error: null }),
    });

    const result = await api.metaIntegrations.getAll();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([mockInt]);
  });

  it('metaLeadForms.getAll returns success with data', async () => {
    const mockForm = { id: 'form-1', form_name: 'Lead Form' };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockForm], error: null }),
    });

    const result = await api.metaLeadForms.getAll();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([mockForm]);
  });

  it('metaLeadsRaw.getRecent returns success with data', async () => {
    const mockLead = { id: 'raw-lead-1', leadgen_id: '12345' };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [mockLead], error: null }),
    });

    const result = await api.metaLeadsRaw.getRecent();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([mockLead]);
  });
});

describe('api.js - CRM Conversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
  });

  it('crmConversations.getAll returns success with data', async () => {
    const mockConv = { id: 'conv-1', channel: 'whatsapp', status: 'open' };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockConv], error: null }),
    });

    const result = await api.crmConversations.getAll();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([mockConv]);
  });

  it('crmMessages.getByConversation returns success', async () => {
    const mockMsg = { id: 'msg-1', body: 'Hello', direction: 'inbound' };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockMsg], error: null }),
    });

    const result = await api.crmMessages.getByConversation('conv-1');

    expect(result.success).toBe(true);
    expect(result.data).toEqual([mockMsg]);
  });
});

describe('api.js - Search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockReset();
  });

  it('search.crm returns success with results', async () => {
    const mockResults = [
      { entity_type: 'customer', entity_id: 'c1', label: 'ACME Corp', subtitle: 'contact@acme.com' },
    ];
    mockRpc.mockResolvedValue({ data: mockResults, error: null });

    const result = await api.search.crm('acme');

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockResults);
  });

  it('search.crm returns empty array for empty query', async () => {
    const result = await api.search.crm('');

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('search.crm returns empty array for whitespace query', async () => {
    const result = await api.search.crm('   ');

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe('api.js - Meta Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFunctionsInvoke.mockReset();
  });

  it('metaFunctions.syncLeads calls invoke with correct params', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { synced: 5 }, error: null });

    const result = await api.metaFunctions.syncLeads('int-1', 'form-1');

    expect(mockFunctionsInvoke).toHaveBeenCalledWith('meta-sync-leads', {
      body: { integration_id: 'int-1', form_id: 'form-1' },
    });
    expect(result.success).toBe(true);
  });

  it('metaFunctions.sendWhatsApp calls invoke with correct params', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { sent: true }, error: null });

    const result = await api.metaFunctions.sendWhatsApp('conv-1', 'Hello!');

    expect(mockFunctionsInvoke).toHaveBeenCalledWith('meta-send-whatsapp', {
      body: { conversation_id: 'conv-1', text: 'Hello!' },
    });
    expect(result.success).toBe(true);
  });
});
