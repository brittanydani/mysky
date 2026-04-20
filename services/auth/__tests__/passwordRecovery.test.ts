import { requestPasswordRecoveryCode, completePasswordRecovery } from '../passwordRecovery';

const mockInvoke = jest.fn();

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

describe('requestPasswordRecoveryCode', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls password-recovery edge function with trimmed lowercase email', async () => {
    mockInvoke.mockResolvedValue({ error: null });

    await requestPasswordRecoveryCode('  User@Example.com  ');

    expect(mockInvoke).toHaveBeenCalledWith('password-recovery', {
      body: { action: 'request', email: 'user@example.com' },
    });
  });

  it('throws with the server error message when invoke returns an error', async () => {
    mockInvoke.mockResolvedValue({ error: { message: 'Rate limit exceeded' } });

    await expect(requestPasswordRecoveryCode('a@b.com')).rejects.toThrow('Rate limit exceeded');
  });

  it('throws fallback message when error has no message string', async () => {
    mockInvoke.mockResolvedValue({ error: {} });

    await expect(requestPasswordRecoveryCode('a@b.com')).rejects.toThrow(
      'Password recovery is temporarily unavailable.',
    );
  });
});

describe('completePasswordRecovery', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls password-recovery with verify action and trimmed params', async () => {
    mockInvoke.mockResolvedValue({ error: null });

    await completePasswordRecovery({
      email: '  User@Example.com  ',
      code: '  123456  ',
      newPassword: 'newPass123',
    });

    expect(mockInvoke).toHaveBeenCalledWith('password-recovery', {
      body: {
        action: 'verify',
        email: 'user@example.com',
        code: '123456',
        newPassword: 'newPass123',
      },
    });
  });

  it('throws with server error message on failure', async () => {
    mockInvoke.mockResolvedValue({ error: { message: 'Invalid code' } });

    await expect(
      completePasswordRecovery({ email: 'a@b.com', code: 'bad', newPassword: 'x' }),
    ).rejects.toThrow('Invalid code');
  });

  it('throws fallback message when error has no readable message', async () => {
    mockInvoke.mockResolvedValue({ error: true });

    await expect(
      completePasswordRecovery({ email: 'a@b.com', code: '000', newPassword: 'x' }),
    ).rejects.toThrow('Could not reset password right now.');
  });
});
