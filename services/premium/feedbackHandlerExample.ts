/**
 * @file feedbackHandlerExample.ts
 * @description EXAMPLE / REFERENCE ONLY — not imported by the production app.
 * Shows the full "agreement loop" for handling thumbs-up/down feedback:
 *   1) Write feedback row for rendered card
 *   2) Fetch user model
 *   3) Compute learning update
 *   4) Save model + log deltas
 *
 * Safe to delete if no longer needed as a reference.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ShadowTrigger } from "./dreamTypes";
import { DreamModelService } from "./supabaseDreamModelService";
import { computeLearningUpdate, type UserDreamModel, type LearningContext } from "./adaptiveLearning";

export async function submitCardFeedbackAndLearn(args: {
  supabase: SupabaseClient;

  dreamId: string;
  renderedCardId: string;

  // ThemeDefinition id
  themeId: string;

  // -1 | 0 | 1
  rating: -1 | 0 | 1;

  // Matched triggers used to build card
  matchedTriggers: Array<{ trigger: ShadowTrigger; score: number }>;

  // Signals for weight nudging
  textCoverage: number;
  feelingsStrength: number;
  checkInCompleteness: number;
  historyCompleteness: number;

  reasonTags?: string[];
  note?: string;
}): Promise<void> {
  const {
    supabase,
    dreamId,
    renderedCardId,
    themeId,
    rating,
    matchedTriggers,
    textCoverage,
    feelingsStrength,
    checkInCompleteness,
    historyCompleteness,
    reasonTags,
    note,
  } = args;

  // 1) Resolve authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new Error('Not authenticated');

  // 2) Upsert feedback
  const { data: feedbackRow, error: fbErr } = await supabase
    .from("dream_card_feedback")
    .upsert(
      {
        user_id: user.id,
        dream_id: dreamId,
        rendered_card_id: renderedCardId,
        rating,
        reason_tags: reasonTags ?? [],
        note: note ?? null,
      },
      { onConflict: "user_id,rendered_card_id" }
    )
    .select("id")
    .single();

  if (fbErr) throw fbErr;

  // 3) Load model
  const model: UserDreamModel = await DreamModelService.getOrCreateModel(supabase);

  // 4) Compute update
  const ctx: LearningContext = {
    themeId,
    matchedTriggers,
    textCoverage,
    feelingsStrength,
    checkInCompleteness,
    historyCompleteness,
    reasonTags,
  };

  const { nextModel, delta } = computeLearningUpdate({ model, rating, ctx });

  // 5) Save model + log
  await DreamModelService.saveModelAndLog(supabase, {
    nextModel,
    delta,
    dreamId,
    feedbackId: feedbackRow?.id,
  });
}
