export const PRESET_RULES = {
  AI_GOLD: { stakeKey: "goldStake", targetRate: 0.5, maxTrades: 2, name: "Preset 1" },
  FX_TREND: { stakeKey: "fxStake", targetRate: 0.75, maxTrades: 5, name: "Preset 2" },
  INDEX_REVERSION: { stakeKey: "indexStake", targetRate: 0.98, maxTrades: Infinity, name: "Preset 3" },
} as const;

export type PresetId = keyof typeof PRESET_RULES;

export function getPresetId(comment = ""): PresetId | null {
  if (comment.includes("AI Gold")) return "AI_GOLD";
  if (comment.includes("FX Trend")) return "FX_TREND";
  if (comment.includes("Index Reversion")) return "INDEX_REVERSION";
  return null;
}

export function canRequestPresetCycle(id: PresetId, tradeCount: number) {
  return PRESET_RULES[id].maxTrades === Infinity || tradeCount >= PRESET_RULES[id].maxTrades;
}

export const PRESET_IDS: PresetId[] = ["AI_GOLD", "FX_TREND", "INDEX_REVERSION"];

/** Clé du moteur dans `engines_config` et identifiant du bot côté dashboard. */
export const PRESET_ENGINE_KEY: Record<PresetId, "aiGold" | "fxTrend" | "indexReversion"> = {
  AI_GOLD: "aiGold",
  FX_TREND: "fxTrend",
  INDEX_REVERSION: "indexReversion",
};

export const PRESET_BOT_ID: Record<PresetId, "nexium-ai-gold" | "nexium-fx-trend" | "nexium-index-reversion"> = {
  AI_GOLD: "nexium-ai-gold",
  FX_TREND: "nexium-fx-trend",
  INDEX_REVERSION: "nexium-index-reversion",
};

export const PRESET_LABEL: Record<PresetId, string> = {
  AI_GOLD: "Nexium AI Gold",
  FX_TREND: "Nexium FX Trend",
  INDEX_REVERSION: "Nexium Index Reversion",
};

/** Symbole traité par chaque bot sur le terminal. */
export const PRESET_SYMBOL: Record<PresetId, string> = {
  AI_GOLD: "GOLD",
  FX_TREND: "DXY",
  INDEX_REVERSION: "NDQ",
};

/**
 * Champs du cycle d'un preset dans les statistiques de quota.
 * `*Wins` compte les trades CLÔTURÉS du cycle (gagnants ou perdants) — le nom
 * est conservé pour rester compatible avec les données déjà enregistrées.
 */
export const PRESET_STAT_KEYS = {
  AI_GOLD: { trades: "goldWins", pnl: "goldPnl", initialStake: "goldInitialStake", cycle: "goldCycle" },
  FX_TREND: { trades: "fxWins", pnl: "fxPnl", initialStake: "fxInitialStake", cycle: "fxCycle" },
  INDEX_REVERSION: { trades: "indexWins", pnl: "indexPnl", initialStake: "indexInitialStake", cycle: "indexCycle" },
} as const;

export function isPresetExpired(id: PresetId, tradeCount: number) {
  return tradeCount >= PRESET_RULES[id].maxTrades;
}
