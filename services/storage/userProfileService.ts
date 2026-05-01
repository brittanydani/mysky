import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';
import { RETRY_PRESETS, withRetry } from '../../utils/withRetry';

export type SelfKnowledgeProfileType =
  | 'core_values'
  | 'archetype_profile'
  | 'cognitive_style'
  | 'intelligence_profile';

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const uid = data.session?.user?.id;
  if (!uid) throw new Error('Not authenticated');

  return uid;
}

export async function getDisplayName(): Promise<string | null> {
  const userId = await getUserId();

  return withRetry(
    async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        logger.warn('[UserProfileService] Failed to load display name from Supabase.', error);
        return null;
      }

      return typeof data?.display_name === 'string' ? data.display_name : null;
    },
    'getDisplayName',
    RETRY_PRESETS.standard,
  );
}

export async function saveDisplayName(displayName: string): Promise<void> {
  const userId = await getUserId();
  const trimmed = displayName.trim();

  return withRetry(
    async () => {
      const { error } = await supabase
        .from('user_profiles')
        .upsert(
          {
            user_id: userId,
            display_name: trimmed.length > 0 ? trimmed : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        );

      if (error) {
        logger.warn('[UserProfileService] Failed to save display name to Supabase.', error);
        throw error;
      }
    },
    'saveDisplayName',
    RETRY_PRESETS.standard,
  );
}

export async function getSelfKnowledgeProfile<T>(
  profileType: SelfKnowledgeProfileType,
  fallback: T,
): Promise<T> {
  const userId = await getUserId();

  return withRetry(
    async () => {
      const { data, error } = await supabase
        .from('self_knowledge_profiles')
        .select('payload')
        .eq('user_id', userId)
        .eq('profile_type', profileType)
        .maybeSingle();

      if (error) {
        logger.warn(`[UserProfileService] Failed to load ${profileType} from Supabase.`, error);
        return fallback;
      }

      return (data?.payload ?? fallback) as T;
    },
    'getSelfKnowledgeProfile',
    RETRY_PRESETS.standard,
  );
}

export async function saveSelfKnowledgeProfile<T>(
  profileType: SelfKnowledgeProfileType,
  payload: T,
): Promise<void> {
  const userId = await getUserId();

  return withRetry(
    async () => {
      const { error } = await supabase
        .from('self_knowledge_profiles')
        .upsert(
          {
            user_id: userId,
            profile_type: profileType,
            payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,profile_type' },
        );

      if (error) {
        logger.warn(`[UserProfileService] Failed to save ${profileType} to Supabase.`, error);
        throw error;
      }
    },
    'saveSelfKnowledgeProfile',
    RETRY_PRESETS.standard,
  );
}

export async function deleteSelfKnowledgeProfile(
  profileType: SelfKnowledgeProfileType,
): Promise<void> {
  const userId = await getUserId();

  return withRetry(
    async () => {
      const { error } = await supabase
        .from('self_knowledge_profiles')
        .delete()
        .eq('user_id', userId)
        .eq('profile_type', profileType);

      if (error) {
        logger.warn(`[UserProfileService] Failed to delete ${profileType} from Supabase.`, error);
        throw error;
      }
    },
    'deleteSelfKnowledgeProfile',
    RETRY_PRESETS.standard,
  );
}

export async function getUserPreference<T>(
  preferenceKey: string,
  fallback: T,
): Promise<T> {
  const userId = await getUserId();

  return withRetry(
    async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('payload')
        .eq('user_id', userId)
        .eq('preference_key', preferenceKey)
        .maybeSingle();

      if (error) {
        logger.warn(`[UserProfileService] Failed to load ${preferenceKey} from Supabase.`, error);
        return fallback;
      }

      return (data?.payload ?? fallback) as T;
    },
    'getUserPreference',
    RETRY_PRESETS.standard,
  );
}

export async function saveUserPreference<T>(
  preferenceKey: string,
  payload: T,
): Promise<void> {
  if (payload == null) {
    await deleteUserPreference(preferenceKey);
    return;
  }

  const userId = await getUserId();

  return withRetry(
    async () => {
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: userId,
            preference_key: preferenceKey,
            payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,preference_key' },
        );

      if (error) {
        logger.warn(`[UserProfileService] Failed to save ${preferenceKey} to Supabase.`, error);
        throw error;
      }
    },
    'saveUserPreference',
    RETRY_PRESETS.standard,
  );
}


export async function deleteUserPreference(preferenceKey: string): Promise<void> {
  const userId = await getUserId();

  return withRetry(
    async () => {
      const { error } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', userId)
        .eq('preference_key', preferenceKey);

      if (error) {
        logger.warn(`[UserProfileService] Failed to delete ${preferenceKey} from Supabase.`, error);
        throw error;
      }
    },
    'deleteUserPreference',
    RETRY_PRESETS.standard,
  );
}
