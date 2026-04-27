import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';
import type { LawfulBasisRecord } from './types';

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const uid = data.session?.user?.id;
  if (!uid) throw new Error('Not authenticated');

  return uid;
}

export async function getPrivacyPolicyVersion(): Promise<string | null> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('privacy_policy_versions')
    .select('version')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logger.warn('[PrivacySupabase] Failed to load policy version.', error);
    return null;
  }

  return typeof data?.version === 'string' ? data.version : null;
}

export async function setPrivacyPolicyVersion(version: string): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from('privacy_policy_versions')
    .upsert(
      {
        user_id: userId,
        version,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (error) throw error;

  await auditPrivacyEvent('privacy_policy_version_update', { version });
}

export async function getConsentRecord(): Promise<{ granted: boolean; timestamp?: string; version?: string } | null> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('privacy_consent_records')
    .select('granted, policy_version, timestamp')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logger.warn('[PrivacySupabase] Failed to load consent record.', error);
    return null;
  }

  if (!data) return null;

  await auditPrivacyEvent('privacy_consent_read', { found: true });

  return {
    granted: Boolean(data.granted),
    timestamp: typeof data.timestamp === 'string' ? data.timestamp : undefined,
    version: typeof data.policy_version === 'string' ? data.policy_version : undefined,
  };
}

export async function setPrivacyConsent(
  granted: boolean,
  policyVersion = '1.0',
  reason = 'user_action',
): Promise<void> {
  const userId = await getUserId();
  const timestamp = new Date().toISOString();

  const { error } = await supabase
    .from('privacy_consent_records')
    .upsert(
      {
        user_id: userId,
        granted,
        policy_version: policyVersion,
        reason,
        timestamp,
        updated_at: timestamp,
      },
      { onConflict: 'user_id' },
    );

  if (error) throw error;

  await auditPrivacyEvent('privacy_consent_update', { granted, policyVersion, reason });
}

export async function getLawfulBasisRecords(): Promise<LawfulBasisRecord[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('lawful_basis_records')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) {
    logger.warn('[PrivacySupabase] Failed to load lawful basis records.', error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: String(row.id),
    timestamp: String(row.timestamp),
    policyVersion: String(row.policy_version ?? '1.0'),
    lawfulBasis: row.lawful_basis,
    purpose: String(row.purpose ?? ''),
    dataCategories: Array.isArray(row.data_categories) ? row.data_categories : [],
    processingActivities: Array.isArray(row.processing_activities) ? row.processing_activities : [],
    retentionPeriod: row.retention_period ?? undefined,
  }));
}

export async function saveLawfulBasisRecord(record: LawfulBasisRecord): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from('lawful_basis_records')
    .upsert(
      {
        id: record.id,
        user_id: userId,
        timestamp: record.timestamp,
        policy_version: record.policyVersion,
        lawful_basis: record.lawfulBasis,
        purpose: record.purpose,
        data_categories: record.dataCategories,
        processing_activities: record.processingActivities,
        retention_period: record.retentionPeriod ?? null,
      },
      { onConflict: 'id' },
    );

  if (error) throw error;
}

export async function auditPrivacyEvent(
  operation: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    const userId = await getUserId();

    const { error } = await supabase
      .from('privacy_audit_events')
      .insert({
        user_id: userId,
        operation,
        metadata,
      });

    if (error) throw error;
  } catch (error) {
    logger.warn('[PrivacySupabase] Failed to write privacy audit event.', error);
  }
}

export async function deletePrivacyComplianceData(): Promise<void> {
  const userId = await getUserId();

  await Promise.all([
    supabase.from('privacy_audit_events').delete().eq('user_id', userId),
    supabase.from('lawful_basis_records').delete().eq('user_id', userId),
    supabase.from('privacy_consent_records').delete().eq('user_id', userId),
    supabase.from('privacy_policy_versions').delete().eq('user_id', userId),
  ]);
}
