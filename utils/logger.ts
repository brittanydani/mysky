type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

function redact(value: unknown): unknown {
  // Prevent accidental logging of sensitive fields.
  if (value && typeof value === 'object') {
    try {
      // Handle Error objects specially - extract message and name
      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          ...(value.cause ? { cause: String(value.cause) } : {}),
        };
      }

      const obj = Array.isArray(value) ? value.slice(0, 20) : { ...(value as Record<string, unknown>) };

      // If object is empty, return a more descriptive string
      if (!Array.isArray(obj) && Object.keys(obj).length === 0) {
        return '[empty object]';
      }

      const SENSITIVE_KEYS = [
        'birthDate','birthTime','birthPlace','latitude','longitude','content','title',
        'ciphertext','ciphertextHex','ct','iv','ivHex','payload','masterKey','token','authorization'
      ];

      if (!Array.isArray(obj)) {
        for (const k of Object.keys(obj)) {
          if (SENSITIVE_KEYS.includes(k.toLowerCase()) || SENSITIVE_KEYS.includes(k)) {
            (obj as Record<string, unknown>)[k] = '[REDACTED]';
          }
        }
      }
      return obj;
    } catch {
      return '[UNSERIALIZABLE_OBJECT]';
    }
  }
  return value;
}

function emit(level: LogLevel, ...args: unknown[]) {
  const safeArgs = args.map(redact);

  // In production, only warn/error.
  if (!isDev && (level === 'debug' || level === 'info')) return;

  // eslint-disable-next-line no-console
  (console[level] ?? console.log)(...safeArgs);
}

export const logger = {
  debug: (...args: unknown[]) => emit('debug', ...args),
  info: (...args: unknown[]) => emit('info', ...args),
  warn: (...args: unknown[]) => emit('warn', ...args),
  error: (...args: unknown[]) => emit('error', ...args),
};
