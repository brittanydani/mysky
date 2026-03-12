import { useEffect } from 'react';
import { useCheckInStore } from '../store/checkInStore';
import { useCheckInInteractionStore } from '../store/checkInInteractionStore';

interface UseLoadTodayCheckInArgs {
  setSliderFromMood: (mood: number) => void;
  fallbackMood?: number;
}

export function useLoadTodayCheckIn({
  setSliderFromMood,
  fallbackMood = 5,
}: UseLoadTodayCheckInArgs) {
  const loadTodayCheckIn = useCheckInStore((state) => state.loadTodayCheckIn);
  const setLiveMood      = useCheckInInteractionStore((state) => state.setLiveMood);
  const setCommittedMood = useCheckInInteractionStore((state) => state.setCommittedMood);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const mood = await loadTodayCheckIn();
      if (cancelled) return;

      const value = typeof mood === 'number' ? mood : fallbackMood;
      setLiveMood(value);
      setCommittedMood(value);
      setSliderFromMood(value);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [fallbackMood, loadTodayCheckIn, setCommittedMood, setLiveMood, setSliderFromMood]);
}
