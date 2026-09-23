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
