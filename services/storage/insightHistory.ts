/**
 * Insight History Service
 * 
 * Persists daily insights so premium users can:
 * - View past insights ("What did yesterday say?")
 * - Save favorites
 * - See patterns over time
 * 
 * Free users only see today's insight (no history).
 */

import { localDb } from './localDb';
import { generateId } from './models';
import { HumanDailyGuidance } from '../astrology/humanGuidance';
import { logger } from '../../utils/logger';
import { toLocalDateString } from '../../utils/dateUtils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SavedInsight {
  id: string;
  date: string;                    // YYYY-MM-DD
  chartId: string;                 // Which chart this was for
  
  // The full guidance payload
  greeting: string;
  loveHeadline: string;
  loveMessage: string;
  energyHeadline: string;
  energyMessage: string;
  growthHeadline: string;
  growthMessage: string;
  gentleReminder: string;
  journalPrompt: string;
  
  // Cosmic context
  moonSign?: string;
  moonPhase?: string;
  
  // "Why this?" transparency (premium feature)
  signals?: string;                // JSON stringified array of signals
  
  // User interaction
  isFavorite: boolean;
  viewedAt?: string;               // Last time user viewed this
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface InsightSignal {
  transit: string;                 // e.g., "Moon conjunct natal Venus"
  orb: string;                     // e.g., "0.5°"
  domain: string;                  // e.g., "love"
  strength: 'strong' | 'moderate' | 'subtle';
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

class InsightHistoryServiceClass {
  
  /**
   * Save today's insight to history
   * Called automatically when generating daily guidance
   */
  async saveInsight(
    guidance: HumanDailyGuidance,
    chartId: string,
    signals?: { description: string; orb: string }[]
  ): Promise<SavedInsight> {
    const now = new Date().toISOString();
    
    // Check if we already have an insight for this date + chart
    const existing = await this.getInsightByDate(guidance.date, chartId);
    
    if (existing) {
      // Update existing insight
      const updated: SavedInsight = {
        ...existing,
        greeting: guidance.greeting,
        loveHeadline: guidance.love.headline,
        loveMessage: guidance.love.message,
        energyHeadline: guidance.energy.headline,
        energyMessage: guidance.energy.message,
        growthHeadline: guidance.growth.headline,
        growthMessage: guidance.growth.message,
        gentleReminder: guidance.gentleReminder,
        journalPrompt: guidance.journalPrompt,
        moonSign: guidance.moonSign,
        moonPhase: guidance.moonPhase,
        signals: signals ? JSON.stringify(signals) : existing.signals,
        updatedAt: now,
      };
      
      await localDb.saveInsight(updated);
      return updated;
    }
    
    // Create new insight
    const insight: SavedInsight = {
      id: generateId(),
      date: guidance.date,
      chartId,
      greeting: guidance.greeting,
      loveHeadline: guidance.love.headline,
      loveMessage: guidance.love.message,
      energyHeadline: guidance.energy.headline,
      energyMessage: guidance.energy.message,
      growthHeadline: guidance.growth.headline,
      growthMessage: guidance.growth.message,
      gentleReminder: guidance.gentleReminder,
      journalPrompt: guidance.journalPrompt,
      moonSign: guidance.moonSign,
      moonPhase: guidance.moonPhase,
      signals: signals ? JSON.stringify(signals) : undefined,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    };
    
    await localDb.saveInsight(insight);
    logger.info(`[InsightHistory] Saved insight for ${guidance.date}`);
    
    return insight;
  }
  
  /**
   * Get insight for a specific date
   */
  async getInsightByDate(date: string, chartId: string): Promise<SavedInsight | null> {
    return localDb.getInsightByDate(date, chartId);
  }
  
  /**
   * Get today's insight
   */
  async getTodaysInsight(chartId: string): Promise<SavedInsight | null> {
    const today = toLocalDateString(new Date());
    return this.getInsightByDate(today, chartId);
  }
  
  /**
   * Get insight history for a chart
   * Premium feature - returns all past insights
   */
  async getInsightHistory(
    chartId: string,
    options?: {
      limit?: number;
      startDate?: string;
      endDate?: string;
      favoritesOnly?: boolean;
    }
  ): Promise<SavedInsight[]> {
    return localDb.getInsightHistory(chartId, options);
  }
  
  /**
   * Get recent insights (last N days)
   */
  async getRecentInsights(chartId: string, days: number = 7): Promise<SavedInsight[]> {
    const endDate = toLocalDateString(new Date());
    const startDate = toLocalDateString(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
    
    return this.getInsightHistory(chartId, { startDate, endDate });
  }
  
  /**
   * Toggle favorite status
   */
  async toggleFavorite(insightId: string): Promise<boolean> {
    const insight = await localDb.getInsightById(insightId);
    if (!insight) return false;
    
    const newStatus = !insight.isFavorite;
    await localDb.updateInsightFavorite(insightId, newStatus);
    
    logger.info(`[InsightHistory] ${newStatus ? 'Favorited' : 'Unfavorited'} insight ${insightId}`);
    return newStatus;
  }
  
  /**
   * Get all favorite insights
   */
  async getFavorites(chartId: string): Promise<SavedInsight[]> {
    return this.getInsightHistory(chartId, { favoritesOnly: true });
  }
  
  /**
   * Mark insight as viewed
   */
  async markViewed(insightId: string): Promise<void> {
    await localDb.updateInsightViewedAt(insightId, new Date().toISOString());
  }
  
  /**
   * Get parsed signals for display
   */
  parseSignals(insight: SavedInsight): InsightSignal[] {
    if (!insight.signals) return [];
    
    try {
      const raw = JSON.parse(insight.signals) as { description: string; orb: string }[];
      return raw.map(s => ({
        transit: s.description,
        orb: s.orb,
        domain: this.inferDomain(s.description),
        strength: this.inferStrength(s.orb),
      }));
    } catch {
      return [];
    }
  }
  
  /**
   * Infer domain from transit description
   */
  private inferDomain(description: string): string {
    const lower = description.toLowerCase();
    if (lower.includes('venus') || lower.includes('7th')) return 'love';
    if (lower.includes('mars') || lower.includes('sun')) return 'energy';
    if (lower.includes('saturn') || lower.includes('10th')) return 'direction';
    if (lower.includes('moon') || lower.includes('4th')) return 'mood';
    if (lower.includes('mercury') || lower.includes('3rd')) return 'focus';
    if (lower.includes('jupiter') || lower.includes('9th')) return 'growth';
    return 'general';
  }
  
  /**
   * Infer strength from orb
   */
  private inferStrength(orb: string): 'strong' | 'moderate' | 'subtle' {
    const degrees = parseFloat(orb);
    if (isNaN(degrees)) return 'moderate';
    if (degrees <= 1) return 'strong';
    if (degrees <= 3) return 'moderate';
    return 'subtle';
  }
  
  /**
   * Get insight statistics
   */
  async getStats(chartId: string): Promise<{
    totalInsights: number;
    favorites: number;
    streak: number;
    mostCommonMood: string | null;
  }> {
    const all = await this.getInsightHistory(chartId);
    const favorites = all.filter(i => i.isFavorite);
    
    // Calculate streak (consecutive days with insights)
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = toLocalDateString(checkDate);
      
      if (all.some(ins => ins.date === dateStr)) {
        streak++;
      } else {
        break;
      }
    }
    
    // Most common moon sign (as proxy for mood)
    const moonCounts: Record<string, number> = {};
    for (const insight of all) {
      if (insight.moonSign) {
        moonCounts[insight.moonSign] = (moonCounts[insight.moonSign] || 0) + 1;
      }
    }
    const mostCommonMood = Object.entries(moonCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    
    return {
      totalInsights: all.length,
      favorites: favorites.length,
      streak,
      mostCommonMood,
    };
  }
}

// Export singleton
export const InsightHistoryService = new InsightHistoryServiceClass();
