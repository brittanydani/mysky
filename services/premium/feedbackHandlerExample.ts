// feedbackHandlerExample.ts
// Example: handle thumbs up/down from UI.
// This shows the whole "agreement loop":
// 1) Write feedback row for rendered card
// 2) Fetch user model
// 3) Compute learning update
// 4) Save model + log deltas

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

  // 1) Upsert feedback
  const { data: feedbackRow, error: fbErr } = await supabase
    .from("dream_card_feedback")
    .upsert(
      {
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

  // 2) Load model
  const model: UserDreamModel = await DreamModelService.getOrCreateModel(supabase);

  // 3) Compute update
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

  // 4) Save model + log
  await DreamModelService.saveModelAndLog(supabase, {
    nextModel,
    delta,
    dreamId,
    feedbackId: feedbackRow?.id,
  });
}
