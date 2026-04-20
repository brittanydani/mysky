import { signUpAndEnsureSession } from '../signUpSession';

const mockSignUp = jest.fn();
const mockSignIn = jest.fn();

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signInWithPassword: (...args: unknown[]) => mockSignIn(...args),
    },
  },
}));

const fakeUser = { id: 'user-1', email: 'test@example.com' };
const fakeSession = { access_token: 'tok', user: fakeUser };

describe('signUpAndEnsureSession', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns session immediately when signUp returns a session', async () => {
    mockSignUp.mockResolvedValue({ data: { session: fakeSession, user: fakeUser }, error: null });

    const result = await signUpAndEnsureSession({ email: 'test@example.com', password: 'pass' });

    expect(result.session).toBe(fakeSession);
    expect(result.requiresEmailConfirmation).toBe(false);
    expect(result.user).toBe(fakeUser);
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('normalizes email (trims whitespace) before passing to supabase', async () => {
    mockSignUp.mockResolvedValue({ data: { session: fakeSession, user: fakeUser }, error: null });

    await signUpAndEnsureSession({ email: '  test@example.com  ', password: 'pass' });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'pass',
    });
  });

  it('falls back to signInWithPassword when signUp returns no session', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null, user: fakeUser }, error: null });
    mockSignIn.mockResolvedValue({ data: { session: fakeSession, user: fakeUser }, error: null });

    const result = await signUpAndEnsureSession({ email: 'test@example.com', password: 'pass' });

    expect(mockSignIn).toHaveBeenCalled();
    expect(result.session).toBe(fakeSession);
    expect(result.requiresEmailConfirmation).toBe(false);
  });

  it('returns requiresEmailConfirmation=true when signIn also fails', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null, user: fakeUser }, error: null });
    mockSignIn.mockResolvedValue({ data: null, error: { message: 'Email not confirmed' } });

    const result = await signUpAndEnsureSession({ email: 'test@example.com', password: 'pass' });

    expect(result.requiresEmailConfirmation).toBe(true);
    expect(result.session).toBeNull();
    expect(result.user).toBe(fakeUser);
  });

  it('returns requiresEmailConfirmation=true when signIn throws', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null, user: fakeUser }, error: null });
    mockSignIn.mockRejectedValue(new Error('Network error'));

    const result = await signUpAndEnsureSession({ email: 'test@example.com', password: 'pass' });

    expect(result.requiresEmailConfirmation).toBe(true);
    expect(result.session).toBeNull();
  });

  it('throws immediately when signUp returns an error', async () => {
    const authError = new Error('Email already registered');
    mockSignUp.mockResolvedValue({ data: { session: null, user: null }, error: authError });

    await expect(
      signUpAndEnsureSession({ email: 'test@example.com', password: 'pass' }),
    ).rejects.toThrow('Email already registered');
  });
});
