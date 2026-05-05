import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';

// Mock the api module before importing store
const mockCustomersGetAll = vi.fn();
const mockCustomersCreate = vi.fn();
const mockCustomersUpdate = vi.fn();
const mockCustomersDelete = vi.fn();
const mockLeadsGetAll = vi.fn();
const mockLeadsCreate = vi.fn();
const mockLeadsDelete = vi.fn();
const mockLeadsConvert = vi.fn();
const mockOpportunitiesGetAll = vi.fn();
const mockOpportunitiesMoveStage = vi.fn();
const mockProductsGetAll = vi.fn();

vi.mock('../lib/api', () => ({
  default: {
    customers: {
      getAll: (...args) => mockCustomersGetAll(...args),
      create: (...args) => mockCustomersCreate(...args),
      update: (...args) => mockCustomersUpdate(...args),
      delete: (...args) => mockCustomersDelete(...args),
    },
    leads: {
      getAll: (...args) => mockLeadsGetAll(...args),
      create: (...args) => mockLeadsCreate(...args),
      delete: (...args) => mockLeadsDelete(...args),
      convert: (...args) => mockLeadsConvert(...args),
    },
    opportunities: {
      getAll: (...args) => mockOpportunitiesGetAll(...args),
      create: vi.fn(),
      update: vi.fn(),
      moveStage: (...args) => mockOpportunitiesMoveStage(...args),
      delete: vi.fn(),
    },
    products: {
      getAll: (...args) => mockProductsGetAll(...args),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock supabase
vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: vi.fn(() => true),
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: { user: { id: 'test-user-id' } } } })),
    },
  },
}));

const mockCustomer = {
  id: 'cust-1',
  name: 'Test Customer',
  company: 'Test Corp',
  email: 'test@example.com',
  phone: '123456',
  city: 'Medellín',
  customer_type: 'corporate',
  score: 75,
  lifetime_value: 10000,
  purchase_count: 5,
  user_id: 'test-user-id',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockLead = {
  id: 'lead-1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  company: 'ACME',
  source: 'web',
  interest: 'warm',
  score: 60,
  budget: 5000,
  status: 'new',
  user_id: 'test-user-id',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockOpportunity = {
  id: 'opp-1',
  name: 'Big Deal',
  customer_id: 'cust-1',
  stage: 'lead',
  value: 50000,
  probability: 50,
  days_in_stage: 0,
  user_id: 'test-user-id',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const emptyPipeline = {
  lead: [],
  contact: [],
  qualification: [],
  proposal: [],
  negotiation: [],
  closed_won: [],
  closed_lost: [],
};

const emptyLoading = {
  customers: false,
  leads: false,
  products: false,
  opportunities: false,
  quotations: false,
  orders: false,
  tickets: false,
  automations: false,
  preferences: false,
  notifications: false,
  meta: false,
  conversations: false,
};

const createEmptyState = () => ({
  customers: [],
  leads: [],
  products: [],
  pipeline: { ...emptyPipeline },
  quotations: [],
  orders: [],
  tickets: [],
  automations: [],
  userPreferences: null,
  appNotifications: [],
  metaIntegrations: [],
  metaLeadForms: [],
  metaLeadsRaw: [],
  crmConversations: [],
  crmMessagesByConversation: {},
  loading: { ...emptyLoading },
  error: null,
});

describe('useStore - Initial State', () => {
  beforeEach(() => {
    useStore.setState(createEmptyState());
    vi.clearAllMocks();
  });

  it('has empty arrays for customers, leads, products when API is configured', () => {
    const state = useStore.getState();
    expect(state.customers).toEqual([]);
    expect(state.leads).toEqual([]);
    expect(state.products).toEqual([]);
  });

  it('has empty pipeline with all stages', () => {
    const state = useStore.getState();
    expect(state.pipeline).toEqual(emptyPipeline);
  });

  it('has empty loading states', () => {
    const state = useStore.getState();
    expect(state.loading.customers).toBe(false);
    expect(state.loading.leads).toBe(false);
    expect(state.loading.products).toBe(false);
    expect(state.loading.opportunities).toBe(false);
  });
});

describe('useStore - Customers CRUD', () => {
  beforeEach(() => {
    useStore.setState(createEmptyState());
    vi.clearAllMocks();
    mockCustomersGetAll.mockReset();
    mockCustomersCreate.mockReset();
    mockCustomersUpdate.mockReset();
    mockCustomersDelete.mockReset();
  });

  it('fetchCustomers sets customers on success', async () => {
    mockCustomersGetAll.mockResolvedValue({ success: true, data: [mockCustomer] });

    await useStore.getState().fetchCustomers();

    expect(mockCustomersGetAll).toHaveBeenCalled();
    const state = useStore.getState();
    expect(state.customers).toEqual([mockCustomer]);
  });

  it('fetchCustomers handles error gracefully', async () => {
    mockCustomersGetAll.mockResolvedValue({ success: false, error: 'Network error' });

    await useStore.getState().fetchCustomers();

    const state = useStore.getState();
    expect(state.customers).toEqual([]);
  });

  it('addCustomer adds new customer to state', async () => {
    mockCustomersCreate.mockResolvedValue({ success: true, data: mockCustomer });

    const result = await useStore.getState().addCustomer({
      name: 'Test Customer',
      company: 'Test Corp',
      email: 'test@example.com',
    });

    expect(mockCustomersCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Customer',
        company: 'Test Corp',
        email: 'test@example.com',
        user_id: 'test-user-id',
      })
    );
    const state = useStore.getState();
    expect(state.customers[0]).toEqual(mockCustomer);
    expect(result).toEqual(mockCustomer);
  });

  it('updateCustomer updates existing customer', async () => {
    useStore.setState({ customers: [mockCustomer] });
    mockCustomersUpdate.mockResolvedValue({ success: true, data: { ...mockCustomer, name: 'Updated Name' } });

    const result = await useStore.getState().updateCustomer('cust-1', { name: 'Updated Name' });

    expect(mockCustomersUpdate).toHaveBeenCalledWith('cust-1', { name: 'Updated Name' });
    const state = useStore.getState();
    expect(state.customers[0].name).toBe('Updated Name');
    expect(result.name).toBe('Updated Name');
  });

  it('deleteCustomer removes customer from state', async () => {
    useStore.setState({ customers: [mockCustomer] });
    mockCustomersDelete.mockResolvedValue({ success: true });

    await useStore.getState().deleteCustomer('cust-1');

    const state = useStore.getState();
    expect(state.customers).toEqual([]);
  });
});

describe('useStore - Leads CRUD', () => {
  beforeEach(() => {
    useStore.setState(createEmptyState());
    vi.clearAllMocks();
    mockLeadsGetAll.mockReset();
    mockLeadsCreate.mockReset();
    mockLeadsDelete.mockReset();
  });

  it('fetchLeads sets leads on success', async () => {
    mockLeadsGetAll.mockResolvedValue({ success: true, data: [mockLead] });

    await useStore.getState().fetchLeads();

    expect(mockLeadsGetAll).toHaveBeenCalled();
    const state = useStore.getState();
    expect(state.leads).toEqual([mockLead]);
  });

  it('addLead adds new lead to state', async () => {
    mockLeadsCreate.mockResolvedValue({ success: true, data: mockLead });

    const result = await useStore.getState().addLead({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    });

    expect(mockLeadsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        user_id: 'test-user-id',
      })
    );
    const state = useStore.getState();
    expect(state.leads[0]).toEqual(mockLead);
  });

  it('deleteLead removes lead from state', async () => {
    useStore.setState({ leads: [mockLead] });
    mockLeadsDelete.mockResolvedValue({ success: true });

    await useStore.getState().deleteLead('lead-1');

    const state = useStore.getState();
    expect(state.leads).toEqual([]);
  });
});

describe('useStore - Pipeline Operations', () => {
  beforeEach(() => {
    useStore.setState(createEmptyState());
    vi.clearAllMocks();
    mockOpportunitiesGetAll.mockReset();
    mockOpportunitiesMoveStage.mockReset();
  });

  it('movePipelineOpportunity moves opportunity between stages', async () => {
    const initialPipeline = {
      lead: [{ ...mockOpportunity }],
      contact: [],
      qualification: [],
      proposal: [],
      negotiation: [],
      closed_won: [],
      closed_lost: [],
    };
    useStore.setState({ pipeline: initialPipeline });
    mockOpportunitiesMoveStage.mockResolvedValue({ success: true, data: { ...mockOpportunity, stage: 'contact' } });

    await useStore.getState().movePipelineOpportunity('opp-1', 'lead', 'contact');

    expect(mockOpportunitiesMoveStage).toHaveBeenCalledWith('opp-1', 'contact');
    const state = useStore.getState();
    expect(state.pipeline.lead).toEqual([]);
    expect(state.pipeline.contact[0].id).toBe('opp-1');
    expect(state.pipeline.contact[0].stage).toBe('contact');
  });

  it('fetchOpportunities groups by stage', async () => {
    const opps = [
      { ...mockOpportunity, stage: 'lead' },
      { ...mockOpportunity, id: 'opp-2', stage: 'proposal' },
    ];
    mockOpportunitiesGetAll.mockResolvedValue({ success: true, data: opps });

    await useStore.getState().fetchOpportunities();

    const state = useStore.getState();
    expect(state.pipeline.lead.length).toBe(1);
    expect(state.pipeline.proposal.length).toBe(1);
  });
});

describe('useStore - State Immutability', () => {
  beforeEach(() => {
    useStore.setState(createEmptyState());
    vi.clearAllMocks();
    mockCustomersGetAll.mockReset();
    mockCustomersCreate.mockReset();
  });

  it('fetchCustomers updates customers array', async () => {
    mockCustomersGetAll.mockResolvedValue({ success: true, data: [mockCustomer] });

    await useStore.getState().fetchCustomers();

    const state = useStore.getState();
    expect(state.customers.length).toBe(1);
    expect(state.customers[0]).toEqual(mockCustomer);
  });

  it('addCustomer creates new customers array', async () => {
    mockCustomersCreate.mockResolvedValue({ success: true, data: mockCustomer });

    await useStore.getState().addCustomer({
      name: 'Test',
      company: 'Corp',
      email: 'test@test.com',
    });

    const state = useStore.getState();
    expect(state.customers.length).toBe(1);
    expect(state.customers[0]).toEqual(mockCustomer);
  });
});
