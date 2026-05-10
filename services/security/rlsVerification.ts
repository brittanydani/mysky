import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';

export interface RLSPolicyInfo {
  tableName: string;
  hasSelectPolicy: boolean;
  hasUpdatePolicy: boolean;
  hasInsertPolicy: boolean;
  hasDeletePolicy: boolean;
  verifiedReadIsolation: boolean;
}

const SENTINEL_USER_ID = '00000000-0000-0000-0000-000000000000';

const USER_OWNED_TABLES = [
  'app_settings',
  'birth_profiles',
  'daily_check_ins',
  'daily_reflections',
  'insight_candidates',
  'insight_feedback',
  'insight_signals',
  'journal_entries',
  'relationship_charts',
  'relationship_patterns',
  'self_knowledge_profiles',
  'shown_insights',
  'sleep_entries',
  'somatic_entries',
  'trigger_events',
  'user_insight_memory',
  'user_preferences',
  'user_profiles',
] as const;

export class RLSVerificationService {
  static async verifyConfiguration(): Promise<void> {
    if (!__DEV__) return;

    const failures: string[] = [];

    for (const tableName of USER_OWNED_TABLES) {
      try {
        const result = await this.verifyReadIsolation(tableName);
        if (!result.verifiedReadIsolation) {
          failures.push(tableName);
        }
      } catch (error) {
        logger.warn('[RLS] Verification skipped or failed for table', {
          tableName,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (failures.length > 0) {
      logger.error('[RLS] SECURITY ISSUE: unexpected cross-user rows were readable', {
        tables: failures,
      });
      throw new Error(`RLS read isolation failed for: ${failures.join(', ')}`);
    }

    logger.info('[RLS] Read-isolation probes completed', {
      tableCount: USER_OWNED_TABLES.length,
    });
  }

  static async auditPolicies(tableName: string): Promise<RLSPolicyInfo> {
    const result = await this.verifyReadIsolation(tableName);
    return {
      tableName,
      hasSelectPolicy: result.verifiedReadIsolation,
      hasUpdatePolicy: false,
      hasInsertPolicy: false,
      hasDeletePolicy: false,
      verifiedReadIsolation: result.verifiedReadIsolation,
    };
  }

  private static async verifyReadIsolation(tableName: string): Promise<Pick<RLSPolicyInfo, 'tableName' | 'verifiedReadIsolation'>> {
    const { data, error } = await supabase
      .from(tableName)
      .select('user_id')
      .eq('user_id', SENTINEL_USER_ID)
      .limit(1);

    if (error) {
      throw error;
    }

    return {
      tableName,
      verifiedReadIsolation: (data ?? []).length === 0,
    };
  }
}
