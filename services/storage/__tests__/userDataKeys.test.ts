import {
  ENCRYPTED_ASYNC_USER_DATA_KEYS,
  PLAIN_ASYNC_USER_DATA_KEYS,
} from '../userDataKeys';

describe('userDataKeys', () => {
  it('ENCRYPTED_ASYNC_USER_DATA_KEYS contains expected keys', () => {
    expect(ENCRYPTED_ASYNC_USER_DATA_KEYS).toContain('@mysky:archetype_profile');
    expect(ENCRYPTED_ASYNC_USER_DATA_KEYS).toContain('@mysky:cognitive_style');
    expect(ENCRYPTED_ASYNC_USER_DATA_KEYS).toContain('@mysky:core_values');
    expect(ENCRYPTED_ASYNC_USER_DATA_KEYS).toContain('@mysky:somatic_entries');
    expect(ENCRYPTED_ASYNC_USER_DATA_KEYS).toContain('@mysky:trigger_events');
    expect(ENCRYPTED_ASYNC_USER_DATA_KEYS).toContain('@mysky:relationship_patterns');
    expect(ENCRYPTED_ASYNC_USER_DATA_KEYS).toContain('@mysky:daily_reflections');
    expect(ENCRYPTED_ASYNC_USER_DATA_KEYS).toContain('msky_user_name');
  });

  it('PLAIN_ASYNC_USER_DATA_KEYS contains expected keys', () => {
    expect(PLAIN_ASYNC_USER_DATA_KEYS).toContain('mysky_custom_journal_tags');
  });

  it('no key appears in both encrypted and plain lists', () => {
    const overlap = (ENCRYPTED_ASYNC_USER_DATA_KEYS as readonly string[]).filter((k) =>
      (PLAIN_ASYNC_USER_DATA_KEYS as readonly string[]).includes(k),
    );
    expect(overlap).toHaveLength(0);
  });
});
