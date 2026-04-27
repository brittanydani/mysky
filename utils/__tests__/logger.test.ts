// logger tests – no native deps required.
// The logger computes dev/prod mode at import time, so each test loads it
// after setting __DEV__.

describe('logger', () => {
  let debugSpy: jest.SpyInstance;
  let infoSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  const loadDevLogger = () => {
    jest.resetModules();
    jest.unmock('../logger');
    (globalThis as any).__DEV__ = true;

    jest.doMock('../sentry', () => ({
      captureError: jest.fn(),
    }));

    return jest.requireActual('../logger').logger as typeof import('../logger').logger;
  };

  beforeEach(() => {
    debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.dontMock('../sentry');
    jest.restoreAllMocks();
    delete (globalThis as any).__DEV__;
  });

  describe('in dev mode (__DEV__ = true)', () => {
    it('logger.debug emits to console.debug', () => {
      const logger = loadDevLogger();
      logger.debug('hello debug');
      expect(debugSpy).toHaveBeenCalled();
    });

    it('logger.info emits to console.info', () => {
      const logger = loadDevLogger();
      logger.info('hello info');
      expect(infoSpy).toHaveBeenCalled();
    });

    it('logger.warn emits to console.warn', () => {
      const logger = loadDevLogger();
      logger.warn('low battery');
      expect(warnSpy).toHaveBeenCalled();
    });

    it('logger.error emits to console.error', () => {
      const logger = loadDevLogger();
      logger.error('boom');
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('redaction', () => {
    it('redacts sensitive keys in plain objects', () => {
      const logger = loadDevLogger();
      logger.info({ password: 'hunter2', label: 'safe' });
      const call = infoSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(call.password).toBe('[REDACTED]');
      expect(call.label).toBe('safe');
    });

    it('redacts nested sensitive keys', () => {
      const logger = loadDevLogger();
      logger.info({ outer: { token: 'abc123', visible: true } });
      const call = infoSpy.mock.calls[0][0] as Record<string, unknown>;
      const outer = call.outer as Record<string, unknown>;
      expect(outer.token).toBe('[REDACTED]');
      expect(outer.visible).toBe(true);
    });

    it('serializes Error objects to name + message', () => {
      const logger = loadDevLogger();
      logger.error(new Error('something broke'));
      const call = errorSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(call.name).toBe('Error');
      expect(call.message).toBe('something broke');
    });

    it('passes through non-object primitives unchanged', () => {
      const logger = loadDevLogger();
      logger.info('plain string');
      expect(infoSpy).toHaveBeenCalledWith('plain string');

      logger.info(42);
      expect(infoSpy).toHaveBeenCalledWith(42);
    });

    it('redacts email field', () => {
      const logger = loadDevLogger();
      logger.warn({ email: 'user@example.com', status: 'active' });
      const call = warnSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(call.email).toBe('[REDACTED]');
    });

    it('truncates arrays to 20 items', () => {
      const logger = loadDevLogger();
      const arr = Array.from({ length: 30 }, (_, i) => i);
      logger.debug(arr);
      const call = debugSpy.mock.calls[0][0] as number[];
      expect(call).toHaveLength(20);
    });

    it('returns [empty object] for empty objects', () => {
      const logger = loadDevLogger();
      logger.info({});
      expect(infoSpy).toHaveBeenCalledWith('[empty object]');
    });
  });
});
