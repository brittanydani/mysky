// supabaseDreamModelService.ts
// Supabase integration helpers (read model, ensure model, write updates, log deltas).
//
// You'll call this after a user thumbs up/down a card.
//
// Requires:
//   npm i @supabase/supabase-js
//
// Usage example:
//   const model = await DreamModelService.getOrCreateModel(supabase)
//   const { nextModel, delta } = computeLearningUpdate({ model, rating, ctx })
//   await DreamModelService.saveModelAndLog(supabase, { nextModel, delta, dreamId, feedbackId })

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ShadowTrigger } from "./dreamSynthesisEngine";
import type { EngineWeights, UserDreamModel, LearningDelta } from "./adaptiveLearning";

type DbUserDreamModelRow = {
  user_id: string;
  engine_weights: EngineWeights;
  trigger_multipliers: Partial<Record<ShadowTrigger, number>>;
  theme_multipliers: Record<string, number>;
  feedback_count: number;
  last_feedback_at: string | null;
};

export class DreamModelService {
  static async getOrCreateModel(supabase: SupabaseClient): Promise<UserDreamModel> {
    // Ensure exists via RPC
    const { data: ensured, error: ensureErr } = await supabase.rpc("ensure_user_dream_model");
    if (ensureErr) throw ensureErr;

    // Read it
    const { data, error } = await supabase
      .from("user_dream_model")
      .select("engine_weights, trigger_multipliers, theme_multipliers, feedback_count")
      .single();

    if (error) throw error;

    const row = data as DbUserDreamModelRow;

    return {
      engine_weights: row.engine_weights,
      trigger_multipliers: row.trigger_multipliers ?? {},
      theme_multipliers: row.theme_multipliers ?? {},
      feedback_count: row.feedback_count ?? 0,
    };
  }

  static async saveModelAndLog(
    supabase: SupabaseClient,
    args: {
      nextModel: UserDreamModel;
      delta: LearningDelta;
      dreamId?: string;
      feedbackId?: string;
    }
  ): Promise<void> {
    const { nextModel, delta, dreamId, feedbackId } = args;

    // Update model
    const { error: upErr } = await supabase
      .from("user_dream_model")
      .update({
        engine_weights: nextModel.engine_weights,
        trigger_multipliers: nextModel.trigger_multipliers,
        theme_multipliers: nextModel.theme_multipliers,
        feedback_count: nextModel.feedback_count,
        last_feedback_at: new Date().toISOString(),
      })
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id);

    if (upErr) throw upErr;

    // Log deltas
    const { error: logErr } = await supabase.from("user_dream_model_updates").insert({
      dream_id: dreamId ?? null,
      feedback_id: feedbackId ?? null,
      delta_engine_weights: delta.deltaEngineWeights ?? {},
      delta_trigger_multipliers: delta.deltaTriggerMultipliers ?? {},
      delta_theme_multipliers: delta.deltaThemeMultipliers ?? {},
    });

    if (logErr) throw logErr;
  }
}
