import {
  PLAIN_ASYNC_USER_DATA_KEYS,
} from '../userDataKeys';

describe('userDataKeys', () => {
  it('PLAIN_ASYNC_USER_DATA_KEYS contains profile keys', () => {
    expect(PLAIN_ASYNC_USER_DATA_KEYS).toContain('@mysky:archetype_profile');
    expect(PLAIN_ASYNC_USER_DATA_KEYS).toContain('@mysky:cognitive_style');
    expect(PLAIN_ASYNC_USER_DATA_KEYS).toContain('@mysky:core_values');
    expect(PLAIN_ASYNC_USER_DATA_KEYS).toContain('msky_user_name');
  });

  it('PLAIN_ASYNC_USER_DATA_KEYS contains cache keys', () => {
    expect(PLAIN_ASYNC_USER_DATA_KEYS).toContain('mysky_custom_journal_tags');
    expect(PLAIN_ASYNC_USER_DATA_KEYS).toContain('@mysky:cache:daily_reflections');
    expect(PLAIN_ASYNC_USER_DATA_KEYS).toContain('@mysky:cache:somatic_entries');
    expect(PLAIN_ASYNC_USER_DATA_KEYS).toContain('@mysky:cache:trigger_events');
    expect(PLAIN_ASYNC_USER_DATA_KEYS).toContain('@mysky:cache:relationship_patterns');
  });

  it('has no duplicate keys', () => {
    const unique = new Set(PLAIN_ASYNC_USER_DATA_KEYS);
    expect(unique.size).toBe(PLAIN_ASYNC_USER_DATA_KEYS.length);
  });
});
