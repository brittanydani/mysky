// logger tests – no native deps required.
// We reset __DEV__ and process.env.NODE_ENV to exercise both prod and dev paths.

import { logger } from '../logger';

describe('logger', () => {
  let debugSpy: jest.SpyInstance;
  let infoSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    infoSpy  = jest.spyOn(console, 'info').mockImplementation(() => {});
    warnSpy  = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('in dev mode (__DEV__ = true)', () => {
    beforeAll(() => {
      (globalThis as any).__DEV__ = true;
    });

    it('logger.debug emits to console.debug', () => {
      logger.debug('hello debug');
      expect(debugSpy).toHaveBeenCalled();
    });

    it('logger.info emits to console.info', () => {
      logger.info('hello info');
      expect(infoSpy).toHaveBeenCalled();
    });

    it('logger.warn emits to console.warn', () => {
      logger.warn('low battery');
      expect(warnSpy).toHaveBeenCalled();
    });

    it('logger.error emits to console.error', () => {
      logger.error('boom');
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('redaction', () => {
    beforeAll(() => {
      (globalThis as any).__DEV__ = true;
    });

    it('redacts sensitive keys in plain objects', () => {
      logger.info({ password: 'hunter2', label: 'safe' });
      const call = infoSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(call.password).toBe('[REDACTED]');
      expect(call.label).toBe('safe');
    });

    it('redacts nested sensitive keys', () => {
      logger.info({ outer: { token: 'abc123', visible: true } });
      const call = infoSpy.mock.calls[0][0] as Record<string, unknown>;
      const outer = call.outer as Record<string, unknown>;
      expect(outer.token).toBe('[REDACTED]');
      expect(outer.visible).toBe(true);
    });

    it('serializes Error objects to name + message', () => {
      logger.error(new Error('something broke'));
      const call = errorSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(call.name).toBe('Error');
      expect(call.message).toBe('something broke');
    });

    it('passes through non-object primitives unchanged', () => {
      logger.info('plain string');
      expect(infoSpy).toHaveBeenCalledWith('plain string');

      logger.info(42);
      expect(infoSpy).toHaveBeenCalledWith(42);
    });

    it('redacts email field', () => {
      logger.warn({ email: 'user@example.com', status: 'active' });
      const call = warnSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(call.email).toBe('[REDACTED]');
    });

    it('truncates arrays to 20 items', () => {
      const arr = Array.from({ length: 30 }, (_, i) => i);
      logger.debug(arr);
      const call = debugSpy.mock.calls[0][0] as number[];
      expect(call).toHaveLength(20);
    });

    it('returns [empty object] for empty objects', () => {
      logger.info({});
      expect(infoSpy).toHaveBeenCalledWith('[empty object]');
    });
  });
});
