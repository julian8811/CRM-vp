import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase first
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockSignOut = vi.fn();
const mockGetUser = vi.fn();
const mockGetSession = vi.fn();
const mockRefreshSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args) => mockSignInWithPassword(...args),
      signUp: (...args) => mockSignUp(...args),
      signInWithOAuth: (...args) => mockSignInWithOAuth(...args),
      signOut: (...args) => mockSignOut(...args),
      getUser: (...args) => mockGetUser(...args),
      getSession: (...args) => mockGetSession(...args),
      refreshSession: (...args) => mockRefreshSession(...args),
      onAuthStateChange: (...args) => mockOnAuthStateChange(...args),
    },
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

// Import after mocking
const {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut,
  getCurrentUser,
  getSession,
  refreshSession,
  onAuthStateChange,
} = await import('../lib/auth');

describe('auth.js - signInWithEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls supabase.auth.signInWithPassword with correct params', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
    });

    const result = await signInWithEmail('test@example.com', 'password123');

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.data.user.email).toBe('test@example.com');
    expect(result.error).toBeNull();
  });

  it('returns error on invalid credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    });

    const result = await signInWithEmail('wrong@example.com', 'wrongpass');

    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('Invalid login credentials');
  });
});

describe('auth.js - signUpWithEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls supabase.auth.signUp with correct params', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'new@example.com' }, session: null },
      error: null,
    });

    const result = await signUpWithEmail('new@example.com', 'password123', {
      first_name: 'John',
      last_name: 'Doe',
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password123',
      options: {
        data: { first_name: 'John', last_name: 'Doe' },
      },
    });
    expect(result.data.user.email).toBe('new@example.com');
    expect(result.error).toBeNull();
  });

  it('calls signUp without metadata when not provided', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: 'user-1' }, session: null },
      error: null,
    });

    await signUpWithEmail('test@example.com', 'password123');

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: {
        data: {},
      },
    });
  });

  it('returns error when email already exists', async () => {
    mockSignUp.mockResolvedValue({
      data: null,
      error: { message: 'User already registered' },
    });

    const result = await signUpWithEmail('existing@example.com', 'password123');

    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('User already registered');
  });
});

describe('auth.js - signInWithGoogle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls supabase.auth.signInWithOAuth with google provider', async () => {
    const originalWindow = global.window;
    global.window = {
      location: { origin: 'https://crm-vp.vercel.app', pathname: '/dashboard' },
    };

    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://supabase.com/oauth/authorize?...' },
      error: null,
    });

    const result = await signInWithGoogle();

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'https://crm-vp.vercel.app/dashboard',
      },
    });
    expect(result.data.url).toContain('supabase.com');
    expect(result.error).toBeNull();

    global.window = originalWindow;
  });

  it('handles OAuth error gracefully', async () => {
    const originalWindow = global.window;
    global.window = {
      location: { origin: 'http://localhost:5173', pathname: '/' },
    };

    mockSignInWithOAuth.mockResolvedValue({
      data: null,
      error: { message: 'OAuth provider error' },
    });

    const result = await signInWithGoogle();

    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('OAuth provider error');

    global.window = originalWindow;
  });
});

describe('auth.js - signOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls supabase.auth.signOut', async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const result = await signOut();

    expect(mockSignOut).toHaveBeenCalled();
    expect(result.error).toBeNull();
  });

  it('returns error on signOut failure', async () => {
    mockSignOut.mockResolvedValue({ error: { message: 'Sign out failed' } });

    const result = await signOut();

    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('Sign out failed');
  });
});

describe('auth.js - getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls supabase.auth.getUser and returns user', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com', user_metadata: { first_name: 'John' } };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const result = await getCurrentUser();

    expect(mockGetUser).toHaveBeenCalled();
    expect(result.user).toEqual(mockUser);
    expect(result.error).toBeNull();
  });

  it('returns null user when no session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await getCurrentUser();

    expect(result.user).toBeNull();
  });
});

describe('auth.js - getSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls supabase.auth.getSession and returns session', async () => {
    const mockSession = { access_token: 'abc123', user: { id: 'user-1' } };
    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

    const result = await getSession();

    expect(mockGetSession).toHaveBeenCalled();
    expect(result.session).toEqual(mockSession);
  });
});

describe('auth.js - refreshSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls supabase.auth.refreshSession', async () => {
    const mockSession = { access_token: 'new-token', user: { id: 'user-1' } };
    mockRefreshSession.mockResolvedValue({ data: { session: mockSession }, error: null });

    const result = await refreshSession();

    expect(mockRefreshSession).toHaveBeenCalled();
    expect(result.data.session.access_token).toBe('new-token');
  });
});

describe('auth.js - onAuthStateChange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  });

  it('subscribes to auth state changes', async () => {
    const callback = vi.fn();
    const unsubscribe = await onAuthStateChange(callback);

    expect(mockOnAuthStateChange).toHaveBeenCalledWith(expect.any(Function));
    expect(typeof unsubscribe).toBe('function');
  });
});
