import {
  ENCRYPTED_ASYNC_USER_DATA_KEYS,
  PLAIN_ASYNC_USER_DATA_KEYS,
} from '../userDataKeys';

describe('userDataKeys', () => {
  it('ENCRYPTED_ASYNC_USER_DATA_KEYS contains expected keys', () => {
    expect(ENCRYPTED_ASYNC_USER_DATA_KEYS).toContain('@mysky:archetype_profile');
    expect(ENCRYPTED_ASYNC_USER_DATA_KEYS).toContain('@mysky:cognitive_style');
    expect(ENCRYPTED_ASYNC_USER_DATA_KEYS).toContain('@mysky:core_values');
    expect(ENCRYPTED_ASYNC_USER_DATA_KEYS).toContain('msky_user_name');
  });

  it('PLAIN_ASYNC_USER_DATA_KEYS contains expected keys', () => {
    expect(PLAIN_ASYNC_USER_DATA_KEYS).toContain('mysky_custom_journal_tags');
    expect(PLAIN_ASYNC_USER_DATA_KEYS).toContain('@mysky:cache:daily_reflections');
    expect(PLAIN_ASYNC_USER_DATA_KEYS).toContain('@mysky:cache:somatic_entries');
    expect(PLAIN_ASYNC_USER_DATA_KEYS).toContain('@mysky:cache:trigger_events');
    expect(PLAIN_ASYNC_USER_DATA_KEYS).toContain('@mysky:cache:relationship_patterns');
  });

  it('no key appears in both encrypted and plain lists', () => {
    const overlap = (ENCRYPTED_ASYNC_USER_DATA_KEYS as readonly string[]).filter((k) =>
      (PLAIN_ASYNC_USER_DATA_KEYS as readonly string[]).includes(k),
    );
    expect(overlap).toHaveLength(0);
  });
});
