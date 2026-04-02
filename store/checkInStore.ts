import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { toLocalDateString, getCheckInDateString } from '../utils/dateUtils';

export type CheckInSaveStatus = 'idle' | 'success' | 'error';

interface CheckInStore {
  isSaving: boolean;
  isLoadingToday: boolean;
  saveStatus: CheckInSaveStatus;
  error: string | null;
  todayMood: number | null;
  saveDailyLog: (moodValue: number) => Promise<void>;
  loadTodayCheckIn: () => Promise<number | null>;
  resetStatus: () => void;
}

function clampMood(value: number) {
  return Math.max(0, Math.min(10, Math.round(value)));
}

export const useCheckInStore = create<CheckInStore>((set) => ({
  isSaving: false,
  isLoadingToday: false,
  saveStatus: 'idle',
  error: null,
  todayMood: null,

  saveDailyLog: async (moodValue: number) => {
    set({ isSaving: true, saveStatus: 'idle', error: null });

    try {
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (authError || !user) {
        set({
          isSaving: false,
          saveStatus: 'error',
          error: authError?.message ?? 'You must be signed in to save a check-in.',
        });
        return;
      }

      const safeMood = clampMood(moodValue);

      const { error } = await supabase
        .from('daily_check_ins')
        .upsert(
          {
            user_id:    user.id,
            mood_value: safeMood,
            log_date:   getCheckInDateString(),
          },
          { onConflict: 'user_id,log_date' }
        );

      if (error) {
        set({
          isSaving: false,
          saveStatus: 'error',
          error: 'Failed to save check-in. Please try again.',
        });
        return;
      }

      set({ isSaving: false, saveStatus: 'success', error: null, todayMood: safeMood });
    } catch (e: unknown) {
      const msg = e instanceof Error && e.message.includes('network')
        ? 'Network error — your check-in could not be saved. Please check your connection.'
        : 'Something went wrong saving your check-in. Please try again.';
      set({ isSaving: false, saveStatus: 'error', error: msg });
    }
  },

  loadTodayCheckIn: async () => {
    set({ isLoadingToday: true, error: null });

    try {
      const { data, error } = await supabase.rpc('get_today_check_in');

      if (error) {
        set({ isLoadingToday: false, error: error.message ?? "Failed to load today's check-in." });
        return null;
      }

      const exists     = Boolean(data?.exists);
      const moodValue  = exists && typeof data?.moodValue === 'number'
        ? clampMood(data.moodValue)
        : null;

      set({ isLoadingToday: false, todayMood: moodValue, error: null });
      return moodValue;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load today's check-in.";
      set({ isLoadingToday: false, error: msg });
      return null;
    }
  },

  resetStatus: () =>
    set({ isSaving: false, saveStatus: 'idle', error: null }),
}));
