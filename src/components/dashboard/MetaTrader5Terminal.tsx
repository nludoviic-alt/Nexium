import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Menu,
  Search,
  Plus,
  Sliders,
  Bell,
  RotateCcw,
  RotateCw,
  Camera,
  Maximize2,
  Minimize2,
  Settings,
  ChevronDown,
  TrendingUp,
  Activity,
  Zap,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  Eye,
  Trash2,
  Lock,
  Type,
  Maximize,
  HelpCircle,
  FileText,
  Bookmark,
  Flame,
  MessageSquare,
  Radio,
  SlidersHorizontal,
  Crosshair,
  PenTool,
  Grid,
  MoreHorizontal,
  Edit3,
  X,
  EyeOff,
  Shield,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  isPresetExpired,
  PRESET_BOT_ID,
  PRESET_IDS,
  PRESET_LABEL,
  PRESET_RULES,
  PRESET_STAT_KEYS,
  PRESET_SYMBOL,
  type PresetId,
} from "@/lib/preset-rules";

// ----------------------------------------------------
// TYPES & DEFINITIONS
// ----------------------------------------------------
export interface Mt5Position {
  ticket: number;
  time: string;
  type: "BUY" | "SELL";
  lots: number;
  symbol: string;
  openPrice: number;
  currentPrice: number;
  sl: number;
  tp: number;
  commission: number;
  swap: number;
  profit: number;
  comment?: string | undefined;
  /** Renseigné pour les trades ouverts par un bot de preset (DÉMO). */
  presetId?: PresetId | undefined;
  /** $ gagnés/perdus par unité de prix (TP atteint = gain cible exact). */
  pointValue?: number | undefined;
  /** Bougie d'entrée (séquence du moteur de prix) pour l'affichage sur le graphique. */
  openSeq?: number | undefined;
  openedAt?: number | undefined;
}

export interface ChartPoint {
  x: number;
  y: number;
  price?: number | undefined;
}

export interface ChartDrawing {
  id: string;
  type:
    | "trendline"
    | "fibonacci"
    | "brush"
    | "text"
    | "patterns"
    | "prediction"
    | "icons"
    | "ruler";
  points: ChartPoint[];
  color?: string | undefined;
  text?: string | undefined;
  isLocked?: boolean | undefined;
  params?: {
    riskReward?: number | undefined;
    priceDelta?: number | undefined;
    percentDelta?: number | undefined;
    barsCount?: number | undefined;
  } | undefined;
}

export interface WatchlistSymbol {
  symbol: string;
  name: string;
  category: "INDICES" | "STOCKS" | "FUTURES";
  last: number;
  chg: number;
  chgPct: number;
  digits: number;
  prefix?: string;
  description: string;
  sector?: string;
  volume: string;
  avgVolume: string;
  marketCap?: string;
  keyFacts?: string;
  hasDiv?: boolean;
  iconBg?: string;
  iconText?: string;
  nextEarnings?: string;
}

const WATCHLIST_SYMBOLS: WatchlistSymbol[] = [
  // INDICES
  {
    symbol: "SPX",
    name: "S&P 500 Index",
    category: "INDICES",
    last: 7733.39,
    chg: -31.25,
    chgPct: -0.40,
    digits: 2,
    hasDiv: true,
    iconBg: "bg-[#e53935]",
    iconText: "SPX",
    description: "S&P 500 Index · CBOE",
    sector: "Indices · US Large Cap 500",
    volume: "2.84 B",
    avgVolume: "3.45 B",
    marketCap: "48.20 T",
    nextEarnings: "In 14 days",
    keyFacts: "L'indice S&P 500 consolide sous ses sommets historiques avec un support institutionnel solide à 7 700 pts.",
  },
  {
    symbol: "NDQ",
    name: "Nasdaq 100",
    category: "INDICES",
    last: 30508.52,
    chg: -223.88,
    chgPct: -0.73,
    digits: 2,
    iconBg: "bg-[#0288d1]",
    iconText: "NDQ",
    description: "US Tech 100 Index · CME",
    sector: "Indices · Technology Heavy",
    volume: "1.12 B",
    avgVolume: "1.34 B",
    marketCap: "22.50 T",
    nextEarnings: "In 21 days",
    keyFacts: "Le secteur des semi-conducteurs et de l'IA maintient une prime de liquidité élevée sur les contrats E-mini Nasdaq.",
  },
  {
    symbol: "DJI",
    name: "Dow Jones Industrial",
    category: "INDICES",
    last: 51689.16,
    chg: -180.04,
    chgPct: -0.35,
    digits: 2,
    iconBg: "bg-[#00acc1]",
    iconText: "DJI",
    description: "Dow Jones Industrial Average · NYSE",
    sector: "Indices · US Blue Chips",
    volume: "420.0 M",
    avgVolume: "390.0 M",
    marketCap: "14.10 T",
    nextEarnings: "In 28 days",
    keyFacts: "Rotation sectorielle défensive observée vers la santé et les valeurs industrielles traditionnelles.",
  },
  {
    symbol: "VIX",
    name: "CBOE Volatility Index",
    category: "INDICES",
    last: 14.65,
    chg: 0.44,
    chgPct: 3.10,
    digits: 2,
    hasDiv: true,
    iconBg: "bg-[#43a047]",
    iconText: "VIX",
    description: "CBOE Volatility Index · S&P 500 Options",
    sector: "Volatility · Implied Volatility",
    volume: "18.2 M",
    avgVolume: "22.1 M",
    marketCap: "—",
    nextEarnings: "N/A",
    keyFacts: "Le régime de volatilité demeure sous la borne de contrôle des 18.00, propice aux stratégies algorithmiques de mean-reversion.",
  },
  {
    symbol: "DXY",
    name: "US Dollar Index",
    category: "INDICES",
    last: 101.034,
    chg: 0.493,
    chgPct: 0.49,
    digits: 3,
    iconBg: "bg-[#00897b]",
    iconText: "DXY",
    description: "US Dollar Currency Index · ICE",
    sector: "Currency Index · Basket",
    volume: "350.0 M",
    avgVolume: "410.0 M",
    marketCap: "—",
    nextEarnings: "N/A",
    keyFacts: "Le dollar américain maintient son canal haussier face au panier de devises du G10 suite aux données de rendement obligataire.",
  },

  // STOCKS
  {
    symbol: "AAPL",
    name: "Apple Inc",
    category: "STOCKS",
    last: 338.43,
    chg: -1.32,
    chgPct: -0.39,
    digits: 2,
    prefix: "$",
    iconBg: "bg-white text-black",
    iconText: "",
    description: "Apple Inc · NASDAQ",
    sector: "Electronic Tech · Telecom",
    volume: "8.67 M",
    avgVolume: "41.57 M",
    marketCap: "4.93 T",
    nextEarnings: "In 36 days",
    keyFacts: "Apple (AAPL) unveiled a foldable iPhone Duo (starts $1,999, ships Oct 23), iPhone 18 Pro/Max with upgraded chips and AI, Watch Series 12/Ultra 4, AirPods 5, plus iOS 27.",
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc",
    category: "STOCKS",
    last: 380.46,
    chg: 1.56,
    chgPct: 0.41,
    digits: 2,
    prefix: "$",
    iconBg: "bg-[#e53935]",
    iconText: "T",
    description: "Tesla Inc · NASDAQ",
    sector: "Consumer Durables · Motor Vehicles",
    volume: "24.12 M",
    avgVolume: "68.40 M",
    marketCap: "1.21 T",
    nextEarnings: "In 42 days",
    keyFacts: "Tesla accélère ses livraisons mondiales et prépare l'expansion de ses unités Cybercab et de la conduite autonome FSD V13.",
  },
  {
    symbol: "NFLX",
    name: "Netflix Inc",
    category: "STOCKS",
    last: 71.90,
    chg: -0.27,
    chgPct: -0.37,
    digits: 2,
    prefix: "$",
    iconBg: "bg-[#b71c1c]",
    iconText: "N",
    description: "Netflix Inc · NASDAQ",
    sector: "Consumer Services · Media",
    volume: "1.45 M",
    avgVolume: "3.20 M",
    marketCap: "312.0 B",
    nextEarnings: "In 19 days",
    keyFacts: "Forte croissance des abonnements financés par la publicité et élargissement de l'offre d'événements sportifs en direct.",
  },

  // FUTURES
  {
    symbol: "USOIL",
    name: "Crude Oil (WTI)",
    category: "FUTURES",
    last: 91.30,
    chg: 1.46,
    chgPct: 1.63,
    digits: 2,
    prefix: "$",
    iconBg: "bg-[#455a64]",
    iconText: "🛢️",
    description: "WTI Crude Oil Spot · NYMEX",
    sector: "Commodities · Energy",
    volume: "89.4 K",
    avgVolume: "110.0 K",
    marketCap: "—",
    nextEarnings: "N/A",
    keyFacts: "Rebond technique du baril WTI suite aux baisses de stocks stratégiques et aux tensions géopolitiques mondiales.",
  },
  {
    symbol: "GOLD",
    name: "Gold Spot / USD",
    category: "FUTURES",
    last: 4390.275,
    chg: 60.235,
    chgPct: 1.50,
    digits: 3,
    prefix: "$",
    iconBg: "bg-[#f57f17]",
    iconText: "Au",
    description: "Spot Gold / US Dollar · ECN FIX",
    sector: "Commodities · Metals",
    volume: "164.2 K",
    avgVolume: "190.5 K",
    marketCap: "21.4 T",
    nextEarnings: "N/A",
    keyFacts: "L'Or physique bénéficie d'une accumulation soutenue des banques centrales mondiales et des fonds souverains.",
  },
];

interface CandleBar {
  /** Numéro de bougie commun à tous les symboles : sert à placer les trades sur le graphique. */
  seq?: number | undefined;
  dateLabel: string;
  monthLabel?: string | undefined;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isUp: boolean;
  event?: "D" | "E" | "lightning" | undefined;
}

// ── Moteur de marché DÉMO ──
// Chaque tick fait évoluer le prix de tous les symboles par une marche
// aléatoire neutre (aucun biais haussier/baissier) ; une bougie se forme
// toutes les CANDLE_TICKS ticks. L'historique initial est généré avec la
// même volatilité que le direct, pour que les niveaux d'entrée / SL / TP des
// trades restent lisibles sur le graphique.
const TICK_MS = 380;
const CANDLE_TICKS = 24;
const HISTORY_CANDLES = 60;
const TICK_VOLATILITY = 0.00035;

const SYMBOL_DIGITS: Record<string, number> = Object.fromEntries(
  WATCHLIST_SYMBOLS.map((s) => [s.symbol, s.digits])
);

function roundTo(value: number, digits: number) {
  return +value.toFixed(digits);
}

function stepPrice(price: number, digits: number) {
  return roundTo(price + (Math.random() - 0.5) * price * TICK_VOLATILITY, digits);
}

function candleTimeLabel(ms: number) {
  return new Date(ms).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** Génère un historique qui se termine exactement au prix courant. */
function buildSeries(symbol: string, currentPrice: number, lastSeq: number): CandleBar[] {
  const digits = SYMBOL_DIGITS[symbol] ?? 2;
  // Marche aléatoire à rebours depuis le prix courant.
  const candles: CandleBar[] = [];
  let close = currentPrice;
  const now = Date.now();
  for (let i = 0; i < HISTORY_CANDLES; i++) {
    let price = close;
    let high = price;
    let low = price;
    for (let t = 0; t < CANDLE_TICKS; t++) {
      price = stepPrice(price, digits);
      high = Math.max(high, price);
      low = Math.min(low, price);
    }
    const open = price;
    const seq = lastSeq - i;
    const startMs = now - i * CANDLE_TICKS * TICK_MS;
    candles.unshift({
      seq,
      dateLabel: candleTimeLabel(startMs),
      monthLabel: seq % 10 === 0 ? candleTimeLabel(startMs).slice(0, 5) : undefined,
      open,
      high,
      low,
      close,
      volume: Math.round(300000 + Math.random() * 700000),
      isUp: close >= open,
    });
    close = open;
  }
  return candles;
}

export interface PresetQuotaStats {
  // Nombre de trades clôturés dans le cycle en cours (gagnants ou perdants).
  goldWins: number; // Max 2
  fxWins: number;   // Max 5
  indexWins: number; // Illimité
  goldPnl?: number;
  fxPnl?: number;
  indexPnl?: number;
  goldInitialStake?: number;
  fxInitialStake?: number;
  indexInitialStake?: number;
  /** Identifiant du cycle validé par l'admin (une nouvelle validation = nouveau cycle). */
  goldCycle?: string;
  fxCycle?: string;
  indexCycle?: string;
}

export interface PresetStakes {
  goldStake: number;   // default 100 ($ USD)
  fxStake: number;     // default 100 ($ USD)
  indexStake: number;  // default 100 ($ USD)
}

export interface Mt5HistoryItem {
  ticket: number;
  openTime: string;
  closeTime: string;
  type: "BUY" | "SELL";
  lots: number;
  symbol: string;
  openPrice: number;
  closePrice: number;
  sl: number;
  tp: number;
  profit: number;
  comment: string;
  presetId?: PresetId | undefined;
  openSeq?: number | undefined;
  closeSeq?: number | undefined;
  exitReason?: string | undefined;
}

/** Trades clôturés, P&L et mise initiale (figée au lancement du cycle) d'un preset. */
export function presetCycleStats(stats: PresetQuotaStats, stakes: PresetStakes, id: PresetId) {
  const keys = PRESET_STAT_KEYS[id];
  return {
    trades: stats[keys.trades] ?? 0,
    pnl: stats[keys.pnl] ?? 0,
    initialStake: stats[keys.initialStake] ?? stakes[PRESET_RULES[id].stakeKey],
  };
}

// ----------------------------------------------------
// MAIN TRADINGVIEW WORKSTATION COMPONENT (DARK THEME & COMPACT SIDEBAR)
// ----------------------------------------------------
export function MetaTrader5Terminal({
  balance = 10000,
  bonus = 0,
  mt5AccountNumber = "892041",
  clientName = "Client Nexium",
  activePreset,
  bots = [],
  onOpenDeposit,
  onOpenWithdraw,
  onBalanceChange,
  onPositionsChange,
  quotaStats = { goldWins: 0, fxWins: 0, indexWins: 0 },
  onQuotaChange,
  presetStakes = { goldStake: 100, fxStake: 750, indexStake: 2500 },
  onOpenStakeConfig,
  storageKey,
}: {
  balance?: number;
  bonus?: number;
  mt5AccountNumber?: string;
  clientName?: string;
  activePreset?: string | null;
  bots?: Array<{ id: string; name: string; statusBadge: string }>;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onBalanceChange?: (newBalance: number) => void;
  onPositionsChange?: (positions: Mt5Position[]) => void;
  quotaStats?: PresetQuotaStats;
  onQuotaChange?: (stats: PresetQuotaStats) => void;
  presetStakes?: PresetStakes;
  onOpenStakeConfig?: () => void;
  /** Clé localStorage du compte DÉMO (positions, historique, cotations). */
  storageKey?: string;
}) {
  // État DÉMO sauvegardé (positions ouvertes, historique, derniers prix)
  const savedDemo = useMemo(() => {
    if (!storageKey || typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(storageKey);
      return raw
        ? (JSON.parse(raw) as { positions?: Mt5Position[]; history?: Mt5HistoryItem[]; prices?: Record<string, number> })
        : null;
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Selected Symbol (Default AAPL)
  const defaultSymbol: WatchlistSymbol = WATCHLIST_SYMBOLS.find((s) => s.symbol === "AAPL") || WATCHLIST_SYMBOLS[0] || {
    symbol: "AAPL",
    name: "Apple Inc.",
    category: "STOCKS",
    last: 232.45,
    chg: 3.12,
    chgPct: 1.36,
    digits: 2,
    description: "Apple Inc. · NASDAQ",
    volume: "45.2M",
    avgVolume: "52.1M",
  };
  // Prix unique par symbole : alimente la watchlist, le graphique et le P&L.
  const pricesRef = useRef<Record<string, number>>({
    ...Object.fromEntries(WATCHLIST_SYMBOLS.map((s) => [s.symbol, s.last])),
    ...(savedDemo?.prices || {}),
  });
  const seriesRef = useRef<Record<string, CandleBar[]>>({});
  const lastSeqRef = useRef<number>(HISTORY_CANDLES - 1);
  const getSeries = (symbol: string) => {
    let series = seriesRef.current[symbol];
    if (!series) {
      series = buildSeries(symbol, pricesRef.current[symbol] ?? 100, lastSeqRef.current);
      seriesRef.current[symbol] = series;
    }
    return series;
  };
  const withLivePrice = (s: WatchlistSymbol): WatchlistSymbol => ({ ...s, last: pricesRef.current[s.symbol] ?? s.last });

  const [selectedSymbol, setSelectedSymbol] = useState<WatchlistSymbol>(() => withLivePrice(defaultSymbol));
  const [watchlist, setWatchlist] = useState<WatchlistSymbol[]>(() => WATCHLIST_SYMBOLS.map(withLivePrice));
  const [timeframe, setTimeframe] = useState<string>("1D");
  
  // Mise / Sizing Mode
  const [stakeMode, setStakeMode] = useState<"USD" | "LOT">("USD");
  const [stakeUsd, setStakeUsd] = useState<string>("100");
  const [lotSize, setLotSize] = useState<string>("0.10");
  
  const [candles, setCandles] = useState<CandleBar[]>(() => getSeries(defaultSymbol.symbol).slice());

  // Crosshair & Hover state
  const [hoveredCandle, setHoveredCandle] = useState<CandleBar | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const chartSvgRef = useRef<SVGSVGElement | null>(null);
  const tickCounterRef = useRef<number>(0);

  // Active Tool state
  const [activeDrawTool, setActiveDrawTool] = useState<string>("crosshair");
  const [activeRightTab, setActiveRightTab] = useState<string>("watchlist");
  const [showIndicators, setShowIndicators] = useState(false);
  const [clockTime, setClockTime] = useState<string>("15:04:17 UTC");

  // Drawing Tools State
  const [drawings, setDrawings] = useState<ChartDrawing[]>([]);
  const [inProgressDrawing, setInProgressDrawing] = useState<ChartDrawing | null>(null);
  const [isBrushActive, setIsBrushActive] = useState<boolean>(false);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);

  // Drawing Toolbar Modes & Toggles
  const [isMagnetOn, setIsMagnetOn] = useState<boolean>(false);
  const [isLockDrawMode, setIsLockDrawMode] = useState<boolean>(false);
  const [isLockAll, setIsLockAll] = useState<boolean>(false);
  const [isDrawingsHidden, setIsDrawingsHidden] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [showToolsDrawer, setShowToolsDrawer] = useState<boolean>(false);

  // Account Manager / Positions state
  // Toute modification des positions passe par commitPositions pour que le
  // moteur (setInterval) lise toujours la liste à jour via positionsRef.
  const [positions, setPositions] = useState<Mt5Position[]>(() => savedDemo?.positions || []);
  const positionsRef = useRef<Mt5Position[]>(positions);
  const commitPositions = (next: Mt5Position[]) => {
    positionsRef.current = next;
    setPositions(next);
  };

  // Closed Trades History
  const [tradeHistory, setTradeHistory] = useState<Mt5HistoryItem[]>(() => savedDemo?.history || []);
  const tradeHistoryRef = useRef<Mt5HistoryItem[]>([]);
  useEffect(() => { tradeHistoryRef.current = tradeHistory; }, [tradeHistory]);

  useEffect(() => {
    onPositionsChange?.(positions);
  }, [positions]);

  // Sauvegarde du compte DÉMO : rien n'est perdu à l'arrêt du bot ni au rechargement.
  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ positions, history: tradeHistory.slice(0, 200), prices: pricesRef.current })
      );
    } catch {}
  }, [storageKey, positions, tradeHistory]);

  const [bottomTab, setBottomTab] = useState<"positions" | "history" | "quotas">("positions");
  const [isBottomOpen, setIsBottomOpen] = useState(true);

  // Keep live UTC clock updated
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, "0");
      const m = String(now.getUTCMinutes()).padStart(2, "0");
      const s = String(now.getUTCSeconds()).padStart(2, "0");
      setClockTime(`${h}:${m}:${s} UTC`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Affiche la série du symbole choisi (historique conservé par symbole)
  useEffect(() => {
    setCandles(getSeries(selectedSymbol.symbol).slice());
  }, [selectedSymbol.symbol]);

  // ── Bots des presets (DÉMO) ──
  // Un bot ne trade que si : preset validé par l'admin + bot lancé par le
  // client + quota du cycle non atteint. Rien ne démarre tout seul.
  const activeList = (activePreset || "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  const isPresetRunning = (id: PresetId) =>
    activeList.includes(id) &&
    bots.find((b) => b.id === PRESET_BOT_ID[id])?.statusBadge === "ACTIF" &&
    !isPresetExpired(id, presetCycleStats(quotaStats, presetStakes, id).trades);
  const runningPresets: Record<PresetId, boolean> = {
    AI_GOLD: isPresetRunning("AI_GOLD"),
    FX_TREND: isPresetRunning("FX_TREND"),
    INDEX_REVERSION: isPresetRunning("INDEX_REVERSION"),
  };

  // Valeurs courantes lues par le moteur (évite de recréer l'intervalle à chaque rendu)
  const latestRef = useRef({ balance, quotaStats, presetStakes, runningPresets, onBalanceChange, onQuotaChange });
  latestRef.current = { balance, quotaStats, presetStakes, runningPresets, onBalanceChange, onQuotaChange };
  const selectedSymbolRef = useRef(selectedSymbol.symbol);
  selectedSymbolRef.current = selectedSymbol.symbol;
  const nextSetupAtRef = useRef<Partial<Record<PresetId, number>>>({});

  // Au lancement d'un bot, le graphique bascule sur son symbole pour suivre ses trades
  const prevRunningRef = useRef(runningPresets);
  useEffect(() => {
    const started = PRESET_IDS.find((id) => runningPresets[id] && !prevRunningRef.current[id]);
    prevRunningRef.current = runningPresets;
    if (!started) return;
    const target = watchlist.find((w) => w.symbol === PRESET_SYMBOL[started]);
    if (target) setSelectedSymbol(target);
  }, [runningPresets.AI_GOLD, runningPresets.FX_TREND, runningPresets.INDEX_REVERSION]);

  /** Applique le résultat d'un trade de preset au cycle (trades, P&L, mise initiale figée). */
  const applyTradeToStats = (stats: PresetQuotaStats, id: PresetId, profit: number): PresetQuotaStats => {
    const keys = PRESET_STAT_KEYS[id];
    const current = presetCycleStats(stats, latestRef.current.presetStakes, id);
    return {
      ...stats,
      [keys.trades]: current.trades + 1,
      [keys.pnl]: +(current.pnl + profit).toFixed(2),
      [keys.initialStake]: current.initialStake,
    };
  };

  /** Profit d'une position au prix donné. */
  const profitAt = (pos: Mt5Position, price: number) => {
    const dir = pos.type === "BUY" ? 1 : -1;
    if (pos.pointValue) return +(dir * (price - pos.openPrice) * pos.pointValue).toFixed(2);
    const pnlFactor = pos.symbol === "GOLD" ? 100 : pos.symbol === "EURUSD" ? 200 : 10;
    return +(dir * (price - pos.openPrice) * pos.lots * pnlFactor).toFixed(2);
  };

  const toHistoryItem = (pos: Mt5Position, exitPrice: number, profit: number, reason: string): Mt5HistoryItem => ({
    ticket: pos.ticket,
    openTime: pos.time,
    closeTime: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    type: pos.type,
    lots: pos.lots,
    symbol: pos.symbol,
    openPrice: pos.openPrice,
    closePrice: exitPrice,
    sl: pos.sl,
    tp: pos.tp,
    profit,
    comment: `${pos.comment || "Trade"} — ${reason}`,
    presetId: pos.presetId,
    openSeq: pos.openSeq,
    closeSeq: lastSeqRef.current,
    exitReason: reason,
  });

  /** Ouvre un trade de bot : TP = gain cible exact du preset, SL = moitié du gain cible (R:R 1:2). */
  const buildBotPosition = (id: PresetId, stake: number, tradeNumber: number): Mt5Position => {
    const symbol = PRESET_SYMBOL[id];
    const digits = SYMBOL_DIGITS[symbol] ?? 2;
    const price = pricesRef.current[symbol] ?? 100;
    const type: "BUY" | "SELL" = Math.random() < 0.5 ? "BUY" : "SELL";
    const dir = type === "BUY" ? 1 : -1;
    const targetProfit = +(stake * PRESET_RULES[id].targetRate).toFixed(2);
    const tpDist = price * 0.0012;
    const slDist = tpDist / 2;
    return {
      ticket: Math.floor(8900000 + Math.random() * 90000),
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      type,
      lots: +Math.max(0.01, stake / 1000).toFixed(2),
      symbol,
      openPrice: price,
      currentPrice: price,
      sl: roundTo(price - dir * slDist, digits),
      tp: roundTo(price + dir * tpDist, digits),
      commission: 0,
      swap: 0,
      profit: 0,
      comment: `Preset ${PRESET_LABEL[id]} · Trade #${tradeNumber} (Mise initiale: $${stake})`,
      presetId: id,
      pointValue: targetProfit / tpDist,
      openSeq: lastSeqRef.current,
      openedAt: Date.now(),
    };
  };

  // Moteur temps réel : cotations, bougies, P&L des positions et bots des presets
  useEffect(() => {
    const interval = setInterval(() => {
      const L = latestRef.current;
      const now = Date.now();

      // 1. Cotations (marche aléatoire neutre)
      tickCounterRef.current += 1;
      const roll = tickCounterRef.current >= CANDLE_TICKS;
      if (roll) {
        tickCounterRef.current = 0;
        lastSeqRef.current += 1;
      }
      const deltas: Record<string, number> = {};
      for (const [sym, prev] of Object.entries(pricesRef.current)) {
        const next = stepPrice(prev, SYMBOL_DIGITS[sym] ?? 2);
        pricesRef.current[sym] = next;
        deltas[sym] = next - prev;
      }

      // 2. Bougies de tous les symboles déjà affichés
      for (const [sym, series] of Object.entries(seriesRef.current)) {
        const price = pricesRef.current[sym] ?? 0;
        const last = series[series.length - 1];
        if (!last) continue;
        series[series.length - 1] = {
          ...last,
          close: price,
          high: Math.max(last.high, price),
          low: Math.min(last.low, price),
          isUp: price >= last.open,
          volume: last.volume + Math.round(Math.random() * 20000),
        };
        if (roll) {
          series.shift();
          const label = candleTimeLabel(now);
          series.push({
            seq: lastSeqRef.current,
            dateLabel: label,
            monthLabel: lastSeqRef.current % 10 === 0 ? label.slice(0, 5) : undefined,
            open: price,
            close: price,
            high: price,
            low: price,
            volume: Math.round(300000 + Math.random() * 200000),
            isUp: true,
          });
        }
      }
      setWatchlist((prev) =>
        prev.map((item) => {
          const last = pricesRef.current[item.symbol];
          if (last === undefined) return item;
          const chg = roundTo(item.chg + (deltas[item.symbol] ?? 0), item.digits);
          return { ...item, last, chg, chgPct: +((chg / (last - chg || 1)) * 100).toFixed(2) };
        })
      );
      setCandles(getSeries(selectedSymbolRef.current).slice());
      setSelectedSymbol((s) => {
        const last = pricesRef.current[s.symbol] ?? s.last;
        const chg = roundTo(s.chg + (deltas[s.symbol] ?? 0), s.digits || 2);
        return { ...s, last, chg, chgPct: +((chg / (last || 1)) * 100).toFixed(2) };
      });

      // 3. Positions : P&L au prix du marché, clôture des trades de bot sur TP / SL / arrêt
      let stats = L.quotaStats;
      let balanceDelta = 0;
      const closed: Mt5HistoryItem[] = [];
      const notices: Array<() => void> = [];
      const nextPositions: Mt5Position[] = [];
      for (const pos of positionsRef.current) {
        const price = pricesRef.current[pos.symbol] ?? pos.currentPrice;
        if (pos.presetId) {
          const dir = pos.type === "BUY" ? 1 : -1;
          const hitTp = dir * (price - pos.tp) >= 0;
          const hitSl = dir * (price - pos.sl) <= 0;
          const stopped = !L.runningPresets[pos.presetId];
          if (hitTp || hitSl || stopped) {
            const exitPrice = hitTp ? pos.tp : hitSl ? pos.sl : price;
            const profit = profitAt(pos, exitPrice);
            const reason = hitTp ? "Take Profit atteint" : hitSl ? "Stop Loss touché" : "Bot arrêté (clôture au marché)";
            closed.push(toHistoryItem(pos, exitPrice, profit, reason));
            balanceDelta += profit;
            stats = applyTradeToStats(stats, pos.presetId, profit);
            const id = pos.presetId;
            const { trades } = presetCycleStats(stats, L.presetStakes, id);
            const max = PRESET_RULES[id].maxTrades;
            notices.push(() => {
              const quota = max === Infinity ? `${trades} trade(s)` : `${trades}/${max}`;
              const msg = `${PRESET_LABEL[id]} (DÉMO) : ${reason} sur ${pos.symbol} — ${profit >= 0 ? "+" : "-"}$${Math.abs(profit).toFixed(2)} · ${quota}`;
              if (profit >= 0) toast.success(msg);
              else toast.error(msg);
              if (isPresetExpired(id, trades)) {
                toast.info(`${PRESET_LABEL[id]} : quota atteint (${trades}/${max}) — preset EXPIRÉ. Vous pouvez faire une nouvelle demande d'activation.`);
              }
            });
            continue;
          }
        }
        nextPositions.push({ ...pos, currentPrice: price, profit: profitAt(pos, price) });
      }

      // 4. Bots lancés : recherche de setup puis ouverture d'un trade (un à la fois par preset)
      for (const id of PRESET_IDS) {
        if (!L.runningPresets[id]) {
          delete nextSetupAtRef.current[id];
          continue;
        }
        const { trades, initialStake } = presetCycleStats(stats, L.presetStakes, id);
        if (isPresetExpired(id, trades) || nextPositions.some((p) => p.presetId === id)) continue;
        const due = nextSetupAtRef.current[id];
        if (due === undefined) {
          nextSetupAtRef.current[id] = now + 5000 + Math.random() * 7000;
          continue;
        }
        if (now < due) continue;
        delete nextSetupAtRef.current[id];
        const pos = buildBotPosition(id, initialStake, trades + 1);
        nextPositions.unshift(pos);
        notices.push(() => {
          playTradeAudio();
          toast.info(
            `${PRESET_LABEL[id]} (DÉMO) : ${pos.type} ${pos.symbol} @ ${pos.openPrice} · TP ${pos.tp} · SL ${pos.sl}`
          );
        });
      }

      commitPositions(nextPositions);
      if (closed.length > 0) {
        setTradeHistory((hist) => [...closed.reverse(), ...hist]);
        L.onQuotaChange?.(stats);
      }
      if (balanceDelta !== 0) L.onBalanceChange?.(+(L.balance + balanceDelta).toFixed(2));
      notices.forEach((notify) => notify());
    }, TICK_MS);

    return () => clearInterval(interval);
  }, []);

  // Audio effect for order execution
  const playTradeAudio = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  // One-Click BUY/SELL execution with Stake Amount ($ USD) or Lots
  const handleExecuteOrder = (type: "BUY" | "SELL") => {
    let lots: number;
    let commentText: string;
    const price = selectedSymbol.last;

    if (stakeMode === "USD") {
      const stake = Math.max(10, parseFloat(stakeUsd) || 100);
      lots = +(Math.max(0.01, (stake / (price * 0.05 || 500)))).toFixed(2);
      commentText = `Ordre 1-Click (Mise: $${stake.toFixed(0)} USD)`;
    } else {
      lots = Math.max(0.01, parseFloat(lotSize) || 0.10);
      commentText = `Ordre 1-Click (${lots} lot)`;
    }

    const slDist = price * 0.015;
    const tpDist = price * 0.03;

    const newPos: Mt5Position = {
      ticket: Math.floor(8900000 + Math.random() * 90000),
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      type,
      lots,
      symbol: selectedSymbol.symbol,
      openPrice: price,
      currentPrice: price,
      sl: +(type === "BUY" ? price - slDist : price + slDist).toFixed(selectedSymbol.digits),
      tp: +(type === "BUY" ? price + tpDist : price - tpDist).toFixed(selectedSymbol.digits),
      commission: -1.50,
      swap: 0.00,
      profit: 0.00,
      comment: commentText,
    };

    commitPositions([newPos, ...positionsRef.current]);
    playTradeAudio();
    if (stakeMode === "USD") {
      toast.success(
        `Ordre ${type} exécuté sur ${selectedSymbol.symbol} (Mise : $${parseFloat(stakeUsd) || 100} USD — ${lots} lot) !`
      );
    } else {
      toast.success(
        `Ordre ${type} ${lots} lot(s) exécuté avec succès sur ${selectedSymbol.symbol} à $${selectedSymbol.last} !`
      );
    }
  };

  // ----------------------------------------------------
  // DRAWING TOOLS LOGIC & EVENT HANDLERS
  // ----------------------------------------------------
  const handleToolSelect = (toolId: string) => {
    if (toolId === "magnet") {
      const next = !isMagnetOn;
      setIsMagnetOn(next);
      toast.info(next ? "Mode Aimant activé (Attraction automatique aux mèches des bougies)" : "Mode Aimant désactivé");
      return;
    }
    if (toolId === "lock_draw") {
      const next = !isLockDrawMode;
      setIsLockDrawMode(next);
      toast.info(next ? "Mode dessin continu activé" : "Mode dessin continu désactivé");
      return;
    }
    if (toolId === "lock_all") {
      const next = !isLockAll;
      setIsLockAll(next);
      toast.info(next ? "Tous les tracés et annotations sont verrouillés" : "Tracés déverrouillés");
      return;
    }
    if (toolId === "hide") {
      const next = !isDrawingsHidden;
      setIsDrawingsHidden(next);
      toast.info(next ? "Dessins masqués" : "Dessins affichés");
      return;
    }
    if (toolId === "trash") {
      if (drawings.length === 0 && !inProgressDrawing) {
        toast.info("Aucun dessin à supprimer sur le graphique.");
        return;
      }
      setDrawings([]);
      setInProgressDrawing(null);
      setSelectedDrawingId(null);
      toast.success("Graphique réinitialisé : tous les tracés ont été supprimés.");
      return;
    }
    if (toolId === "zoom") {
      const nextScale = zoomScale === 1 ? 1.45 : 1;
      setZoomScale(nextScale);
      toast.info(nextScale > 1 ? "Zoom avant activé (Échelle 145%)" : "Zoom réinitialisé (100%)");
      return;
    }

    setActiveDrawTool(toolId);
    setInProgressDrawing(null);
    setSelectedDrawingId(null);

    const toolMessages: Record<string, string> = {
      crosshair: "Mode Curseur Réticule actif.",
      trendline: "Ligne de tendance : Cliquez sur 2 points du graphique pour tracer la ligne.",
      fibonacci: "Retracement Fibonacci : Cliquez sur le point haut et le point bas.",
      brush: "Pinceau : Maintenez le clic gauche et tracez librement sur le graphique.",
      text: "Texte : Cliquez sur le graphique pour insérer une annotation personnalisée.",
      patterns: "Harmoniques : Cliquez sur le graphique pour insérer une figure X-A-B-C-D.",
      prediction: "Prédiction Long / Short : Cliquez pour positionner la boîte Risk/Reward (1:3).",
      icons: "Signal IA : Cliquez pour insérer un marqueur de flux FIX 4.4.",
      ruler: "Règle : Cliquez sur 2 points pour mesurer barres, prix et % de variation.",
    };

    if (toolMessages[toolId]) {
      toast.info(toolMessages[toolId]);
    }
  };

  const handleChartMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isLockAll) return;
    if (!chartSvgRef.current) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * chartWidth;
    const rawY = ((e.clientY - rect.top) / rect.height) * chartHeight;
    const snapped = getPointCoordinates(rawX, rawY);

    if (activeDrawTool === "brush") {
      setIsBrushActive(true);
      const newBrush: ChartDrawing = {
        id: `draw-${Date.now()}`,
        type: "brush",
        points: [snapped],
        color: "#00D084",
      };
      setInProgressDrawing(newBrush);
    }
  };

  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartSvgRef.current) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * chartWidth;
    const rawY = ((e.clientY - rect.top) / rect.height) * chartHeight;
    const snapped = getPointCoordinates(rawX, rawY);
    setMousePos({ x: snapped.x, y: snapped.y });

    const index = Math.floor((snapped.x - 20) / candleSpacing);
    if (index >= 0 && index < candles.length) {
      setHoveredCandle(candles[index] ?? null);
    }

    if (isBrushActive && inProgressDrawing && inProgressDrawing.type === "brush") {
      setInProgressDrawing((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          points: [...prev.points, snapped],
        };
      });
      return;
    }

    if (
      inProgressDrawing &&
      (inProgressDrawing.type === "trendline" ||
        inProgressDrawing.type === "fibonacci" ||
        inProgressDrawing.type === "ruler")
    ) {
      const first = inProgressDrawing.points[0];
      if (first) {
        setInProgressDrawing((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            points: [first, snapped],
          };
        });
      }
    }
  };

  const handleChartMouseUp = () => {
    if (isBrushActive && inProgressDrawing && inProgressDrawing.type === "brush") {
      setIsBrushActive(false);
      if (inProgressDrawing.points.length > 2) {
        setDrawings((prev) => [...prev, inProgressDrawing]);
        toast.success("Tracé au pinceau enregistré.");
      }
      setInProgressDrawing(null);
      if (!isLockDrawMode) {
        setActiveDrawTool("crosshair");
      }
    }
  };

  const handleChartClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isLockAll) return;
    if (!chartSvgRef.current) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * chartWidth;
    const rawY = ((e.clientY - rect.top) / rect.height) * chartHeight;
    const snapped = getPointCoordinates(rawX, rawY);

    if (activeDrawTool === "crosshair") {
      return;
    }

    if (activeDrawTool === "trendline") {
      if (!inProgressDrawing) {
        setInProgressDrawing({
          id: `draw-${Date.now()}`,
          type: "trendline",
          points: [snapped, snapped],
          color: "#2962ff",
        });
      } else {
        const first = inProgressDrawing.points[0] ?? snapped;
        const completed: ChartDrawing = {
          ...inProgressDrawing,
          points: [first, snapped],
        };
        setDrawings((prev) => [...prev, completed]);
        setInProgressDrawing(null);
        toast.success("Ligne de tendance tracée avec succès.");
        if (!isLockDrawMode) setActiveDrawTool("crosshair");
      }
      return;
    }

    if (activeDrawTool === "fibonacci") {
      if (!inProgressDrawing) {
        setInProgressDrawing({
          id: `draw-${Date.now()}`,
          type: "fibonacci",
          points: [snapped, snapped],
          color: "#ff9800",
        });
      } else {
        const first = inProgressDrawing.points[0] ?? snapped;
        const completed: ChartDrawing = {
          ...inProgressDrawing,
          points: [first, snapped],
        };
        setDrawings((prev) => [...prev, completed]);
        setInProgressDrawing(null);
        toast.success("Niveaux de retracement Fibonacci (0% à 100%) tracés.");
        if (!isLockDrawMode) setActiveDrawTool("crosshair");
      }
      return;
    }

    if (activeDrawTool === "ruler") {
      if (!inProgressDrawing) {
        setInProgressDrawing({
          id: `draw-${Date.now()}`,
          type: "ruler",
          points: [snapped, snapped],
          color: "#2962ff",
        });
      } else {
        const first = inProgressDrawing.points[0] ?? snapped;
        const completed: ChartDrawing = {
          ...inProgressDrawing,
          points: [first, snapped],
        };
        setDrawings((prev) => [...prev, completed]);
        setInProgressDrawing(null);
        toast.success("Mesure de distance enregistrée.");
        if (!isLockDrawMode) setActiveDrawTool("crosshair");
      }
      return;
    }

    if (activeDrawTool === "text") {
      const defaultText = `Zone Clé @ ${snapped.price || selectedSymbol.last}`;
      const userText = window.prompt("Texte de l'annotation graphique :", defaultText) || defaultText;
      const newText: ChartDrawing = {
        id: `draw-${Date.now()}`,
        type: "text",
        points: [snapped],
        text: userText,
        color: "#2962ff",
      };
      setDrawings((prev) => [...prev, newText]);
      toast.success("Annotation ajoutée sur le graphique.");
      if (!isLockDrawMode) setActiveDrawTool("crosshair");
      return;
    }

    if (activeDrawTool === "patterns") {
      const x = snapped.x;
      const y = snapped.y;
      const patternDrawing: ChartDrawing = {
        id: `draw-${Date.now()}`,
        type: "patterns",
        points: [
          { x: Math.max(30, x - 90), y: Math.min(chartHeight - 60, y + 45) },
          { x: Math.max(50, x - 50), y: Math.max(60, y - 55) },
          { x: x - 10, y: y + 15 },
          { x: Math.min(chartWidth - 90, x + 35), y: Math.max(60, y - 35) },
          { x: Math.min(chartWidth - 70, x + 80), y: Math.min(chartHeight - 60, y + 50) },
        ],
        color: "#ff9800",
      };
      setDrawings((prev) => [...prev, patternDrawing]);
      toast.success("Figure harmonique X-A-B-C-D positionnée.");
      if (!isLockDrawMode) setActiveDrawTool("crosshair");
      return;
    }

    if (activeDrawTool === "prediction") {
      const predDrawing: ChartDrawing = {
        id: `draw-${Date.now()}`,
        type: "prediction",
        points: [snapped],
        color: "#089981",
        params: {
          riskReward: 3.0,
        },
      };
      setDrawings((prev) => [...prev, predDrawing]);
      toast.success("Outil de Position Long / Short (R:R 1:3.0) positionné.");
      if (!isLockDrawMode) setActiveDrawTool("crosshair");
      return;
    }

    if (activeDrawTool === "icons") {
      const iconDrawing: ChartDrawing = {
        id: `draw-${Date.now()}`,
        type: "icons",
        points: [snapped],
        color: "#f59e0b",
      };
      setDrawings((prev) => [...prev, iconDrawing]);
      toast.success("Marqueur de signal IA et flux FIX 4.4 placé.");
      if (!isLockDrawMode) setActiveDrawTool("crosshair");
      return;
    }
  };

  const handleClosePosition = (ticket: number) => {
    const pos = positionsRef.current.find((p) => p.ticket === ticket);
    if (!pos) return;
    const exitPrice = pricesRef.current[pos.symbol] ?? pos.currentPrice;
    const profit = profitAt(pos, exitPrice);
    commitPositions(positionsRef.current.filter((p) => p.ticket !== ticket));
    setTradeHistory((hist) => [toHistoryItem(pos, exitPrice, profit, "Clôturé manuellement"), ...hist]);
    onBalanceChange?.(+(balance + profit).toFixed(2));

    // Un trade de preset clôturé à la main compte dans le quota du cycle
    if (pos.presetId) {
      const id = pos.presetId;
      const nextStats = applyTradeToStats(quotaStats, id, profit);
      onQuotaChange?.(nextStats);
      const { trades } = presetCycleStats(nextStats, presetStakes, id);
      if (isPresetExpired(id, trades)) {
        toast.info(`${PRESET_LABEL[id]} : quota atteint (${trades}/${PRESET_RULES[id].maxTrades}) — preset EXPIRÉ.`);
      }
    }

    toast.info(`Position #${ticket} clôturée avec un P&L de ${profit >= 0 ? "+" : ""}$${profit.toFixed(2)} USD (DÉMO).`);
  };

  // Dynamic Chart Dimensions & Scale based on active candles
  const chartWidth = 1000;
  const chartHeight = 490;
  const paddingRight = 68;
  const paddingBottom = 40;
  const paddingTop = 25;

  const { minPrice, maxPrice, priceTicks } = useMemo(() => {
    if (candles.length === 0) {
      return { minPrice: 235, maxPrice: 355, priceTicks: [350, 340, 330, 320, 310, 300, 290, 280, 270, 260, 250, 240] };
    }
    const allLows = candles.map((c) => c.low);
    const allHighs = candles.map((c) => c.high);
    const rawMin = Math.min(...allLows, selectedSymbol.last);
    const rawMax = Math.max(...allHighs, selectedSymbol.last);
    const pad = (rawMax - rawMin) * 0.08 || 1;
    const minP = rawMin - pad;
    const maxP = rawMax + pad;
    const step = (maxP - minP) / 10;
    const ticks: number[] = [];
    for (let i = 1; i <= 9; i++) {
      ticks.push(minP + step * i);
    }
    return { minPrice: minP, maxPrice: maxP, priceTicks: ticks.reverse() };
  }, [candles, selectedSymbol.last]);

  const maxVolume = useMemo(() => {
    const vols = candles.map((c) => c.volume);
    return Math.max(...vols, 1000000);
  }, [candles]);

  const getY = (price: number) => {
    const range = maxPrice - minPrice || 1;
    return (
      paddingTop +
      (1 - (price - minPrice) / range) * (chartHeight - paddingTop - paddingBottom)
    );
  };

  const getPriceFromY = (y: number) => {
    const range = maxPrice - minPrice || 1;
    const ratio = (y - paddingTop) / (chartHeight - paddingTop - paddingBottom);
    return +(minPrice + (1 - ratio) * range).toFixed(selectedSymbol.digits || 2);
  };

  const getVolY = (vol: number) => {
    const maxH = 95;
    return chartHeight - paddingBottom - (vol / (maxVolume || 1)) * maxH;
  };

  const candleSpacing = useMemo(() => {
    return ((chartWidth - paddingRight - 35) / Math.max(candles.length, 1)) * zoomScale;
  }, [chartWidth, paddingRight, candles.length, zoomScale]);

  const getPointCoordinates = (rawX: number, rawY: number): ChartPoint => {
    const rawPrice = getPriceFromY(rawY);
    if (!isMagnetOn || candles.length === 0) {
      return { x: rawX, y: rawY, price: rawPrice };
    }
    const candleIdx = Math.round((rawX - 25) / candleSpacing);
    const clampedIdx = Math.max(0, Math.min(candles.length - 1, candleIdx));
    const c = candles[clampedIdx];
    if (!c) {
      return { x: rawX, y: rawY, price: rawPrice };
    }
    const snapX = 25 + clampedIdx * candleSpacing;

    const prices = [c.high, c.low, c.open, c.close];
    let bestPrice = c.high;
    let minDiff = Math.abs(rawY - getY(c.high));
    for (const p of prices) {
      const diff = Math.abs(rawY - getY(p));
      if (diff < minDiff) {
        minDiff = diff;
        bestPrice = p;
      }
    }
    return { x: snapX, y: getY(bestPrice), price: bestPrice };
  };

  // Dynamic Exponential Moving Averages (EMA 9 & EMA 21) for fluid live chart movement
  const ema9Points = useMemo(() => {
    if (candles.length < 3 || !candles[0]) return "";
    const k = 2 / (9 + 1);
    let ema = candles[0].close;
    return candles
      .map((c, i) => {
        ema = c.close * k + ema * (1 - k);
        const x = 25 + i * candleSpacing;
        const y = getY(ema);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [candles, candleSpacing, maxPrice, minPrice]);

  const ema21Points = useMemo(() => {
    if (candles.length < 3 || !candles[0]) return "";
    const k = 2 / (21 + 1);
    let ema = candles[0].close;
    return candles
      .map((c, i) => {
        ema = c.close * k + ema * (1 - k);
        const x = 25 + i * candleSpacing;
        const y = getY(ema);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [candles, candleSpacing, maxPrice, minPrice]);

  // Active hover candle info
  const activeCandle = hoveredCandle ?? (candles.length > 0 ? (candles[candles.length - 1] ?? null) : null);

  const totalOpenProfit = useMemo(
    () => positions.reduce((acc, p) => acc + p.profit, 0),
    [positions]
  );

  return (
    <div className="flex flex-col bg-[#131722] border border-[#2a2e39] rounded-2xl shadow-2xl overflow-hidden font-sans select-none text-[#d1d4dc] antialiased">
      {/* Bandeau DÉMO : tout ce terminal est une simulation */}
      <div className="flex items-center gap-2 border-b border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-[11px] font-mono text-amber-200">
        <span className="rounded border border-amber-400/60 bg-amber-400/20 px-1.5 py-0.5 font-black tracking-wider text-amber-300">DÉMO</span>
        <span>Compte de démonstration : cotations et trades simulés, aucun ordre réel n'est transmis. Le solde démo est séparé de votre portefeuille.</span>
      </div>
      {/* ── 1. TOP TRADINGVIEW TOOLBAR HEADER (DARK THEME) ── */}
      <div className="flex items-center justify-between border-b border-[#2a2e39] bg-[#131722] px-2.5 py-1 text-xs font-semibold overflow-x-auto no-scrollbar gap-1.5 h-10">
        {/* Left Side Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Main Menu Hamburger */}
          <button
            title="Menu principal"
            className="p-1.5 hover:bg-[#2a2e39] rounded-md text-[#d1d4dc] transition cursor-pointer"
          >
            <Menu className="size-4" />
          </button>

          <div className="h-4 w-px bg-[#2a2e39] mx-1" />

          {/* Symbol Selector Dropdown Button */}
          <button
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#2a2e39] rounded-md font-bold text-white transition cursor-pointer text-xs"
            title="Rechercher un symbole"
          >
            <span className="font-bold tracking-tight text-[13px]">{selectedSymbol.symbol}</span>
            <ChevronDown className="size-3 text-[#787b86]" />
          </button>

          {/* Compare Symbol Icon */}
          <button
            title="Comparer ou ajouter un symbole"
            className="p-1.5 hover:bg-[#2a2e39] rounded-md text-[#787b86] hover:text-white transition cursor-pointer"
          >
            <Plus className="size-3.5" />
          </button>

          {/* Timeframe Dropdown (D) */}
          <button
            className="flex items-center gap-1 px-2 py-1 hover:bg-[#2a2e39] rounded-md text-white font-bold text-xs transition cursor-pointer"
            title="Intervalle de temps"
          >
            <span>D</span>
            <ChevronDown className="size-3 text-[#787b86]" />
          </button>

          {/* Candle Type Dropdown */}
          <button
            title="Type de graphique (Bougies)"
            className="flex items-center gap-1 p-1.5 hover:bg-[#2a2e39] rounded-md text-[#787b86] hover:text-white transition cursor-pointer"
          >
            <Activity className="size-3.5 text-white" />
            <ChevronDown className="size-3 text-[#787b86]" />
          </button>

          <div className="h-4 w-px bg-[#2a2e39] mx-1" />

          {/* Indicators Button */}
          <button
            onClick={() => setShowIndicators(!showIndicators)}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#2a2e39] text-white rounded-md transition cursor-pointer font-semibold text-xs"
          >
            <span className="font-serif italic font-bold text-[#2962ff] text-xs">fx</span>
            <span>Indicators</span>
          </button>

          {/* Templates Grid Button */}
          <button
            title="Modèles d'indicateurs"
            className="p-1.5 hover:bg-[#2a2e39] rounded-md text-[#787b86] hover:text-white transition cursor-pointer"
          >
            <Grid className="size-3.5" />
          </button>

          {/* Alert Button */}
          <button
            onClick={() => toast.success(`Alerte de prix configurée pour ${selectedSymbol.symbol} à $${selectedSymbol.last}`)}
            className="flex items-center gap-1 px-2 py-1 hover:bg-[#2a2e39] text-white rounded-md transition cursor-pointer font-semibold text-xs"
          >
            <Clock className="size-3.5 text-[#787b86]" />
            <span>Alert</span>
          </button>

          {/* Replay */}
          <button
            title="Replay du marché"
            className="flex items-center gap-1 px-2 py-1 hover:bg-[#2a2e39] text-white rounded-md transition cursor-pointer font-semibold text-xs"
          >
            <RotateCcw className="size-3.5 text-[#787b86]" />
            <span>Replay</span>
          </button>

          <div className="h-4 w-px bg-[#2a2e39] mx-1" />

          {/* Undo / Redo */}
          <button
            title="Annuler"
            className="p-1.5 hover:bg-[#2a2e39] rounded text-[#787b86] hover:text-white transition"
          >
            <RotateCcw className="size-3.5" />
          </button>
          <button
            title="Rétablir"
            className="p-1.5 hover:bg-[#2a2e39] rounded text-[#787b86] hover:text-white transition"
          >
            <RotateCw className="size-3.5" />
          </button>
        </div>

        {/* Right Side Header Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Layout Multi-Chart Selector */}
          <button
            title="Sélectionner la mise en page"
            className="flex items-center gap-0.5 p-1.5 hover:bg-[#2a2e39] rounded-md text-[#787b86] hover:text-white transition cursor-pointer"
          >
            <div className="size-3.5 border border-[#787b86] rounded-sm" />
            <ChevronDown className="size-3 text-[#787b86]" />
          </button>

          {/* Save Button */}
          <button
            onClick={() => toast.success("Configuration sauvegardée dans votre profil cloud.")}
            className="flex items-center gap-1 px-2 py-1 hover:bg-[#2a2e39] rounded-md text-xs font-semibold text-white transition cursor-pointer"
          >
            <span>Save</span>
            <ChevronDown className="size-3 text-[#787b86]" />
          </button>

          {/* Search Icon */}
          <button
            title="Rechercher"
            className="p-1.5 hover:bg-[#2a2e39] rounded-md text-[#787b86] hover:text-white transition cursor-pointer"
          >
            <Search className="size-4" />
          </button>

          {/* Settings Gear */}
          <button
            title="Propriétés du graphique"
            className="p-1.5 hover:bg-[#2a2e39] rounded-md text-[#787b86] hover:text-white transition cursor-pointer"
          >
            <Settings className="size-4" />
          </button>

          {/* Fullscreen Icon */}
          <button
            title="Mode plein écran"
            className="p-1.5 hover:bg-[#2a2e39] rounded-md text-[#787b86] hover:text-white transition cursor-pointer"
          >
            <Maximize2 className="size-4" />
          </button>

          {/* Snapshot Camera */}
          <button
            title="Prendre un instantané"
            onClick={() => toast.success("Capture instantanée TradingView enregistrée.")}
            className="p-1.5 hover:bg-[#2a2e39] rounded-md text-[#787b86] hover:text-white transition cursor-pointer"
          >
            <Camera className="size-4" />
          </button>

          {/* Trade Button */}
          <button
            onClick={() => handleExecuteOrder("BUY")}
            className="px-3 py-1 bg-[#1e222d] border border-[#363a45] hover:bg-[#2a2e39] text-white rounded-md text-xs font-bold transition cursor-pointer"
          >
            <span>Trade</span>
          </button>

          {/* Publish Button */}
          <button
            onClick={() => toast.info("Analyse publiée sur le réseau institutionnel Nexium.")}
            className="px-3.5 py-1 bg-[#2962ff] hover:bg-[#1e4bd8] text-white rounded-md text-xs font-bold transition cursor-pointer shadow-sm"
          >
            <span>Publish</span>
          </button>
        </div>
      </div>

      {/* ── 2. MAIN WORKSPACE ROW (LEFT TOOLBAR + CHART + COMPACT RIGHT SIDEBAR + FAR RIGHT STRIP) ── */}
      <div className="flex flex-row flex-1 min-h-[580px] relative bg-[#131722]">
        {/* LEFT DRAWING TOOLBAR STRIP (DARK) */}
        <div className="w-11 border-r border-[#2a2e39] bg-[#131722] flex flex-col items-center py-2 gap-1 text-[#787b86] shrink-0 z-10">
          {/* Top Hamburger Menu */}
          <button
            onClick={() => setShowToolsDrawer(!showToolsDrawer)}
            title="Menu des outils & Presets graphiques"
            className={`p-1.5 rounded-md transition cursor-pointer mb-0.5 ${
              showToolsDrawer ? "bg-[#2962ff] text-white shadow-sm" : "hover:bg-[#2a2e39] hover:text-white"
            }`}
          >
            <Menu className="size-4" />
          </button>

          <div className="w-5 h-px bg-[#2a2e39] mb-0.5" />

          {[
            { id: "crosshair", icon: Crosshair, title: "Curseur Réticule (Crosshair)" },
            { id: "trendline", icon: PenTool, title: "Lignes de tendance & Rayons" },
            { id: "fibonacci", icon: Layers, title: "Retracement de Fibonacci (0% à 100%)" },
            { id: "brush", icon: Edit3, title: "Pinceau & Tracé libre" },
            { id: "text", icon: Type, title: "Outil Texte & Annotations personnalisées" },
            { id: "patterns", icon: Activity, title: "Figures chartistes & Harmoniques (XABCD)" },
            { id: "prediction", icon: TrendingUp, title: "Position Longue / Courte & Ratio R:R (1:3)" },
            { id: "icons", icon: Sparkles, title: "Signaux Algorithmiques & Marqueurs IA" },
            { id: "ruler", icon: Maximize, title: "Règle de mesure (Barres, Prix & %)" },
            { id: "zoom", icon: Search, title: zoomScale > 1 ? "Zoom 145% (Cliquer pour dézoomer)" : "Zoom avant (145%)" },
            { id: "magnet", icon: Zap, title: isMagnetOn ? "Mode Aimant ACTIF (Attraction aux mèches)" : "Activer le Mode Aimant" },
            { id: "lock_draw", icon: Lock, title: isLockDrawMode ? "Mode dessin continu ACTIF" : "Rester en mode dessin" },
            { id: "lock_all", icon: Shield, title: isLockAll ? "Tous les dessins sont VERROUILLÉS" : "Verrouiller tous les outils de dessin" },
            { id: "hide", icon: isDrawingsHidden ? EyeOff : Eye, title: isDrawingsHidden ? "Afficher les dessins" : "Masquer tous les dessins" },
            { id: "trash", icon: Trash2, title: "Supprimer tous les dessins" },
          ].map((tool) => {
            const Icon = tool.icon;
            const isToolActive = activeDrawTool === tool.id;
            const isToggleActive =
              (tool.id === "magnet" && isMagnetOn) ||
              (tool.id === "lock_draw" && isLockDrawMode) ||
              (tool.id === "lock_all" && isLockAll) ||
              (tool.id === "hide" && isDrawingsHidden) ||
              (tool.id === "zoom" && zoomScale > 1);

            const isHighlighted = isToolActive || isToggleActive;

            return (
              <button
                key={tool.id}
                onClick={() => handleToolSelect(tool.id)}
                title={tool.title}
                className={`p-1.5 rounded-md transition cursor-pointer relative ${
                  isHighlighted
                    ? "bg-[#2962ff]/25 text-[#2962ff] shadow-sm ring-1 ring-[#2962ff]/50"
                    : "hover:bg-[#2a2e39] hover:text-white"
                }`}
              >
                <Icon className="size-4" />
                {isToggleActive && (
                  <span className="absolute top-1 right-1 size-1.5 rounded-full bg-[#2962ff] ring-1 ring-[#131722]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Slide-out Tools Drawer when Menu is clicked */}
        {showToolsDrawer && (
          <div className="absolute top-0 left-11 z-30 w-72 bg-[#131722]/98 backdrop-blur-md border-r border-b border-[#2a2e39] shadow-2xl p-3.5 flex flex-col gap-3 animate-in fade-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-[#2a2e39]">
              <div className="flex items-center gap-1.5">
                <Menu className="size-4 text-[#2962ff]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Outils d'Analyse</span>
              </div>
              <button
                onClick={() => setShowToolsDrawer(false)}
                className="p-1 hover:bg-[#2a2e39] rounded text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* Quick Actions List */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] font-bold text-[#787b86] uppercase tracking-wider block">Tracés actifs ({drawings.length})</span>
              {drawings.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic py-1">Aucun tracé actif. Utilisez les icônes de la barre latérale pour dessiner.</p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {drawings.map((d, idx) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-1.5 rounded bg-[#1e222d] border border-[#2a2e39] text-[11px]"
                    >
                      <span className="font-mono text-slate-200 capitalize">
                        #{idx + 1} {d.type} {d.text ? `(${d.text})` : ""}
                      </span>
                      <button
                        onClick={() => {
                          setDrawings((prev) => prev.filter((item) => item.id !== d.id));
                          toast.success("Tracé supprimé.");
                        }}
                        className="p-0.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded cursor-pointer transition"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Global Actions */}
            <div className="pt-2 border-t border-[#2a2e39] flex flex-col gap-1.5">
              <button
                onClick={() => {
                  setDrawings([]);
                  setInProgressDrawing(null);
                  toast.success("Tous les tracés ont été effacés.");
                }}
                className="w-full py-1.5 px-2.5 rounded bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 text-rose-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="size-3 text-rose-400" />
                <span>Effacer tous les dessins</span>
              </button>
            </div>
          </div>
        )}

        {/* CENTER: CHART CANVAS & SVG (DARK) */}
        <div className="flex-1 flex flex-col relative bg-[#131722] overflow-hidden min-w-0">
          {/* Top-Left Chart Info Bar & 1-Click Order Buttons */}
          <div className="absolute top-2 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
            {/* Symbol & OHLC Live Line */}
            <div className="flex items-center gap-2 text-xs font-mono font-medium flex-wrap bg-[#131722]/90 backdrop-blur-sm px-1.5 py-0.5 rounded border border-[#2a2e39]/50">
              <span className="flex items-center gap-1.5 text-white font-bold text-xs">
                <span className="size-2 rounded-full bg-white text-black flex items-center justify-center text-[8px] font-black"></span>
                <span>{selectedSymbol.name}</span>
                <span className="text-[#787b86]">·</span>
                <span>{timeframe}</span>
                <span className="text-[#787b86]">·</span>
                <span>{selectedSymbol.description.split("·")[1]?.trim() || "NASDAQ"}</span>
                <span className="text-[#089981] font-bold text-[10px]">● ≈</span>
              </span>

              {activeCandle && (
                <div className="flex items-center gap-1.5 text-[11px] text-[#787b86]">
                  <span>O<strong className="text-[#f23645] ml-0.5">{activeCandle.open.toFixed(2)}</strong></span>
                  <span>H<strong className="text-[#f23645] ml-0.5">{activeCandle.high.toFixed(2)}</strong></span>
                  <span>L<strong className="text-[#f23645] ml-0.5">{activeCandle.low.toFixed(2)}</strong></span>
                  <span>C<strong className="text-[#f23645] ml-0.5">{activeCandle.close.toFixed(2)}</strong></span>
                  <span className="text-[#f23645] font-bold">
                    {selectedSymbol.chg.toFixed(2)} ({selectedSymbol.chgPct.toFixed(2)}%)
                  </span>
                </div>
              )}
            </div>

            {/* ONE-CLICK TRADING ORDER PANEL (WITH STAKE AMOUNT & LOT SIZE SELECTOR) */}
            <div className="flex flex-col gap-1 bg-[#131722]/95 backdrop-blur-md p-1.5 rounded-xl border border-[#363a45] shadow-2xl w-fit">
              {/* Top: Mode Switcher & Quick Stake Chips */}
              <div className="flex items-center gap-1.5 pb-0.5 border-b border-[#2a2e39]/60">
                <div className="flex items-center bg-[#1e222d] rounded-md p-0.5 border border-[#363a45]/60">
                  <button
                    onClick={() => setStakeMode("USD")}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition cursor-pointer ${
                      stakeMode === "USD"
                        ? "bg-[#2962ff] text-white shadow-sm"
                        : "text-[#787b86] hover:text-white"
                    }`}
                  >
                    $ MISE
                  </button>
                  <button
                    onClick={() => setStakeMode("LOT")}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition cursor-pointer ${
                      stakeMode === "LOT"
                        ? "bg-[#2962ff] text-white shadow-sm"
                        : "text-[#787b86] hover:text-white"
                    }`}
                  >
                    LOTS
                  </button>
                </div>

                {/* Quick Selection Chips */}
                <div className="flex items-center gap-1">
                  {stakeMode === "USD"
                    ? [
                        { v: 100, l: "$100" },
                        { v: 500, l: "$500" },
                        { v: 1000, l: "$1K" },
                        { v: 2500, l: "$2.5K" },
                        { v: 5000, l: "$5K" },
                        { v: 10000, l: "$10K" },
                      ].map((item) => (
                        <button
                          key={item.v}
                          onClick={() => setStakeUsd(String(item.v))}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono transition cursor-pointer ${
                            stakeUsd === String(item.v)
                              ? "bg-amber-500 text-slate-950 shadow-sm"
                              : "bg-[#1e222d] text-[#787b86] hover:text-white hover:bg-[#2a2e39]"
                          }`}
                        >
                          {item.l}
                        </button>
                      ))
                    : [0.05, 0.10, 0.50, 1.00, 2.00].map((val) => (
                        <button
                          key={val}
                          onClick={() => setLotSize(String(val))}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono transition cursor-pointer ${
                            lotSize === String(val)
                              ? "bg-cyan-500 text-slate-950 shadow-sm"
                              : "bg-[#1e222d] text-[#787b86] hover:text-white hover:bg-[#2a2e39]"
                          }`}
                        >
                          {val}L
                        </button>
                      ))}
                </div>

                {onOpenStakeConfig && (
                  <button
                    type="button"
                    onClick={onOpenStakeConfig}
                    className="ml-auto flex items-center gap-1 text-[9px] font-mono font-bold text-amber-400/90 hover:text-amber-300 transition cursor-pointer bg-[#1e222d] px-1.5 py-0.5 rounded border border-amber-500/20 hover:border-amber-400/40"
                    title="Ouvrir la page dédiée Configuration des Mises"
                  >
                    <SlidersHorizontal className="size-2.5" />
                    <span>Mises</span>
                  </button>
                )}
              </div>

              {/* Bottom: SELL, INPUT, BUY */}
              <div className="flex items-center gap-1.5 pt-0.5">
                {/* SELL BOX */}
                <button
                  onClick={() => handleExecuteOrder("SELL")}
                  className="flex flex-col items-center justify-center bg-gradient-to-b from-[#f23645] to-[#c92534] hover:from-[#ff4d5e] hover:to-[#db2b3b] text-white rounded-lg px-3 py-1 shadow-[0_0_12px_rgba(242,54,69,0.45)] transition-all cursor-pointer active:scale-95 min-w-[72px]"
                  title="Passer un ordre de Vente (SELL)"
                >
                  <span className="text-xs font-black font-mono tracking-tight leading-tight text-white drop-shadow-sm">
                    {selectedSymbol.last.toFixed(selectedSymbol.digits)}
                  </span>
                  <span className="text-[8.5px] font-black uppercase tracking-widest text-white/95 mt-0.5">SELL</span>
                </button>

                {/* SIZING INPUT */}
                <div className="px-0.5 flex flex-col items-center">
                  <div className="relative flex items-center">
                    {stakeMode === "USD" && (
                      <span className="absolute left-1.5 text-[10px] font-bold text-amber-400 font-mono pointer-events-none">$</span>
                    )}
                    <input
                      type="text"
                      value={stakeMode === "USD" ? stakeUsd : lotSize}
                      onChange={(e) => {
                        if (stakeMode === "USD") setStakeUsd(e.target.value);
                        else setLotSize(e.target.value);
                      }}
                      className={`w-16 text-center text-xs font-mono font-black border border-[#363a45] rounded-lg bg-[#1e222d] py-1 text-white focus:outline-none focus:border-[#2962ff] shadow-inner ${
                        stakeMode === "USD" ? "pl-3.5 text-amber-300" : "text-cyan-300"
                      }`}
                      title={stakeMode === "USD" ? "Montant de la mise en USD" : "Taille du lot"}
                    />
                  </div>
                  <span className="text-[8px] font-mono text-[#787b86] mt-0.5">
                    {stakeMode === "USD"
                      ? `≈ ${(Math.max(0.01, (parseFloat(stakeUsd) || 100) / (selectedSymbol.last * 0.05 || 500))).toFixed(2)} lot`
                      : `≈ $${((parseFloat(lotSize) || 0.1) * (selectedSymbol.last * 0.05 || 500)).toFixed(0)} USD`}
                  </span>
                </div>

                {/* BUY BOX */}
                <button
                  onClick={() => handleExecuteOrder("BUY")}
                  className="flex flex-col items-center justify-center bg-gradient-to-b from-[#2962ff] to-[#1e4bd8] hover:from-[#4377ff] hover:to-[#2454ee] text-white rounded-lg px-3 py-1 shadow-[0_0_12px_rgba(41,98,255,0.45)] transition-all cursor-pointer active:scale-95 min-w-[72px]"
                  title="Passer un ordre d'Achat (BUY)"
                >
                  <span className="text-xs font-black font-mono tracking-tight leading-tight text-white drop-shadow-sm">
                    {(selectedSymbol.last + (selectedSymbol.digits === 2 ? 0.06 : 0.00015)).toFixed(selectedSymbol.digits)}
                  </span>
                  <span className="text-[8.5px] font-black uppercase tracking-widest text-white/95 mt-0.5">BUY</span>
                </button>
              </div>
            </div>

            {/* Volume & Indicators Legend */}
            <div className="flex items-center gap-2 text-[10px] font-mono flex-wrap">
              <div className="flex items-center gap-1 text-[#787b86]">
                <span>Vol</span>
                <strong className="text-[#f23645]">45.65 M</strong>
              </div>
              <span className="text-[#2a2e39]">|</span>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-[#2962ff] font-bold">EMA (9, close)</span>
                <span className="text-[#ff9800] font-bold">EMA (21, close)</span>
              </div>
              <span className="text-[#2a2e39]">|</span>
              <span className="inline-flex items-center gap-1 text-[#089981] font-bold text-[9px] bg-[#089981]/10 px-1.5 py-0.5 rounded border border-[#089981]/30">
                <span className="size-1.5 rounded-full bg-[#089981] animate-pulse" />
                FIX 4.4 LIVE FEED (0.8ms)
              </span>
            </div>
          </div>

          {/* SVG CANDLESTICK & VOLUME CHART (DARK THEME) */}
          <div className="flex-1 w-full h-full relative cursor-crosshair">
            <svg
              ref={chartSvgRef}
              className="w-full h-full"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
              onMouseDown={handleChartMouseDown}
              onMouseMove={handleChartMouseMove}
              onMouseUp={handleChartMouseUp}
              onClick={handleChartClick}
              onDoubleClick={() => {
                setSelectedDrawingId(null);
                if (zoomScale > 1) setZoomScale(1);
              }}
              onMouseLeave={() => {
                setMousePos(null);
                setHoveredCandle(null);
                if (isBrushActive) handleChartMouseUp();
              }}
            >
              {/* Dynamic Dark Grid Lines */}
              {priceTicks.map((price, pi) => {
                const y = getY(price);
                return (
                  <line
                    key={`grid-y-${pi}`}
                    x1="0"
                    y1={y}
                    x2={chartWidth - paddingRight}
                    y2={y}
                    stroke="#1e222d"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                );
              })}

              {/* Vertical Grid Lines */}
              {candles
                .filter((c) => c.monthLabel)
                .map((c, i) => {
                  const idx = candles.indexOf(c);
                  const x = 25 + idx * candleSpacing;
                  return (
                    <line
                      key={`grid-x-${i}`}
                      x1={x}
                      y1={paddingTop}
                      x2={x}
                      y2={chartHeight - paddingBottom}
                      stroke="#1e222d"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  );
                })}

              {/* TradingView Watermark at Bottom Left */}
              <g opacity="0.20" transform="translate(15, 360)">
                <path
                  d="M0 10 L10 0 L20 10 L15 10 L15 22 L5 22 L5 10 Z"
                  fill="#787b86"
                />
                <text
                  x="28"
                  y="16"
                  fill="#787b86"
                  fontSize="18"
                  fontWeight="900"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  letterSpacing="-0.5"
                >
                  TradingView
                </text>
              </g>

              {/* Volume Bars at Bottom */}
            {candles.map((c, i) => {
                const x = 25 + i * candleSpacing;
                const barY = getVolY(c.volume);
                const barH = chartHeight - paddingBottom - barY;
                const barW = Math.max(candleSpacing * 0.7, 3);
                return (
                  <rect
                    key={`vol-${i}`}
                    x={x - barW / 2}
                    y={barY}
                    width={barW}
                    height={barH}
                    fill={c.isUp ? "rgba(8, 153, 129, 0.45)" : "rgba(242, 54, 69, 0.45)"}
                  />
                );
              })}

              {/* Candlestick Wicks & Bodies */}
              {candles.map((c, i) => {
                const x = 25 + i * candleSpacing;
                const highY = getY(c.high);
                const lowY = getY(c.low);
                const openY = getY(c.open);
                const closeY = getY(c.close);

                const topY = Math.min(openY, closeY);
                const bodyH = Math.max(Math.abs(closeY - openY), 2);
                const candleWidth = Math.max(candleSpacing * 0.7, 4.5);

                const color = c.isUp ? "#089981" : "#f23645";

                return (
                  <g key={`candle-${i}`}>
                    {/* Wick */}
                    <line
                      x1={x}
                      y1={highY}
                      x2={x}
                      y2={lowY}
                      stroke={color}
                      strokeWidth="1.2"
                    />
                    {/* Body */}
                    <rect
                      x={x - candleWidth / 2}
                      y={topY}
                      width={candleWidth}
                      height={bodyH}
                      fill={color}
                      rx="0.5"
                    />

                    {/* Timeline Event Badges (Earnings E, Dividend D, Event ⚡) */}
                    {c.event === "E" && (
                      <g transform={`translate(${x}, ${chartHeight - paddingBottom - 10})`}>
                        <circle cx="0" cy="0" r="6" fill="#1e222d" stroke="#2962ff" strokeWidth="1.2" />
                        <text x="0" y="3" fill="#2962ff" fontSize="7" fontWeight="bold" textAnchor="middle">
                          E
                        </text>
                      </g>
                    )}
                    {c.event === "D" && (
                      <g transform={`translate(${x}, ${chartHeight - paddingBottom - 10})`}>
                        <circle cx="0" cy="0" r="6" fill="#1e222d" stroke="#0288d1" strokeWidth="1.2" />
                        <text x="0" y="3" fill="#0288d1" fontSize="7" fontWeight="bold" textAnchor="middle">
                          D
                        </text>
                      </g>
                    )}
                    {c.event === "lightning" && (
                      <g transform={`translate(${x}, ${chartHeight - paddingBottom - 10})`}>
                        <circle cx="0" cy="0" r="6" fill="#7b1fa2" />
                        <text x="0" y="3" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
                          ⚡
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Dynamic Exponential Moving Averages (EMA 9 & EMA 21) */}
              {ema9Points && (
                <polyline
                  points={ema9Points}
                  fill="none"
                  stroke="#2962ff"
                  strokeWidth="1.5"
                  strokeOpacity="0.85"
                />
              )}
              {ema21Points && (
                <polyline
                  points={ema21Points}
                  fill="none"
                  stroke="#ff9800"
                  strokeWidth="1.5"
                  strokeOpacity="0.85"
                />
              )}

              {/* Active Pulsing Laser Beacon on Latest Candle */}
              {candles.length > 0 && (() => {
                const lastIndex = candles.length - 1;
                const lastCandle = candles[lastIndex];
                if (!lastCandle) return null;
                const lastX = 25 + lastIndex * candleSpacing;
                const lastY = getY(lastCandle.close);
                const color = lastCandle.isUp ? "#089981" : "#f23645";
                return (
                  <g>
                    <circle cx={lastX} cy={lastY} r="8" fill={color} opacity="0.4" className="animate-ping" />
                    <circle cx={lastX} cy={lastY} r="4" fill={color} />
                    <circle cx={lastX} cy={lastY} r="2" fill="#ffffff" />
                  </g>
                );
              })()}

              {/* Trades sur les bougies : entrée, sens, SL/TP, sortie et résultat */}
              {(() => {
                const firstSeq = candles[0]?.seq;
                if (firstSeq === undefined) return null;
                const plotRight = chartWidth - paddingRight;
                const xForSeq = (seq: number | undefined) =>
                  seq === undefined ? null : 25 + (seq - firstSeq) * candleSpacing;
                const visible = (x: number | null): x is number => x !== null && x >= 10 && x <= plotRight;
                const digits = selectedSymbol.digits || 2;

                const closedTrades = tradeHistory
                  .filter((t) => t.symbol === selectedSymbol.symbol && t.openSeq !== undefined)
                  .slice(0, 25);
                const openTrades = positions.filter((p) => p.symbol === selectedSymbol.symbol && p.openSeq !== undefined);

                const entryMarker = (key: string, x: number, price: number, type: "BUY" | "SELL", label: string) => {
                  const y = getY(price);
                  const color = type === "BUY" ? "#089981" : "#f23645";
                  // Flèche sous le prix pour un BUY (pointe vers le haut), au-dessus pour un SELL
                  const path = type === "BUY" ? `M ${x} ${y + 4} l -6 10 h 12 z` : `M ${x} ${y - 4} l -6 -10 h 12 z`;
                  return (
                    <g key={key}>
                      <path d={path} fill={color} stroke="#131722" strokeWidth="1" />
                      <text x={x + 8} y={type === "BUY" ? y + 16 : y - 10} fill={color} fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                        {label}
                      </text>
                    </g>
                  );
                };

                return (
                  <g pointerEvents="none">
                    {closedTrades.map((t) => {
                      const xIn = xForSeq(t.openSeq);
                      const xOut = xForSeq(t.closeSeq);
                      if (!visible(xIn) && !visible(xOut)) return null;
                      const x1 = Math.max(10, xIn ?? 10);
                      const x2 = Math.min(plotRight, xOut ?? plotRight);
                      const yIn = getY(t.openPrice);
                      const yOut = getY(t.closePrice);
                      const win = t.profit >= 0;
                      const resultColor = win ? "#089981" : "#f23645";
                      return (
                        <g key={`hist-mark-${t.ticket}`}>
                          <line x1={x1} y1={getY(t.tp)} x2={x2} y2={getY(t.tp)} stroke="#089981" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
                          <line x1={x1} y1={getY(t.sl)} x2={x2} y2={getY(t.sl)} stroke="#f23645" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
                          <line x1={x1} y1={yIn} x2={x2} y2={yOut} stroke={resultColor} strokeWidth="1.2" strokeDasharray="5 3" />
                          {visible(xIn) && entryMarker(`hist-in-${t.ticket}`, xIn, t.openPrice, t.type, `${t.type} ${t.openPrice.toFixed(digits)}`)}
                          {visible(xOut) && (
                            <g>
                              <circle cx={xOut} cy={yOut} r="4.5" fill="#131722" stroke={resultColor} strokeWidth="2" />
                              <rect x={xOut - 34} y={yOut - 26} width="68" height="15" rx="3" fill={resultColor} />
                              <text x={xOut} y={yOut - 15} fill="#ffffff" fontSize="9.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                                {win ? "+" : "-"}${Math.abs(t.profit).toFixed(2)}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                    {openTrades.map((p) => {
                      const xIn = xForSeq(p.openSeq);
                      const lastX = 25 + (candles.length - 1) * candleSpacing;
                      const yIn = getY(p.openPrice);
                      const yNow = getY(p.currentPrice);
                      const color = p.profit >= 0 ? "#089981" : "#f23645";
                      return (
                        <g key={`open-mark-${p.ticket}`}>
                          {visible(xIn) && (
                            <>
                              <line x1={xIn} y1={yIn} x2={lastX} y2={yNow} stroke={color} strokeWidth="1.2" strokeDasharray="5 3" />
                              {entryMarker(`open-in-${p.ticket}`, xIn, p.openPrice, p.type, `${p.type} ${p.openPrice.toFixed(digits)}`)}
                            </>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })()}

              {/* Active Open Positions On-Chart Horizontal SL / TP / Entry Lines */}
              {positions
                .filter(
                  (p) =>
                    p.symbol === selectedSymbol.symbol ||
                    (selectedSymbol.symbol === "DJI" && p.symbol === "US30") ||
                    (selectedSymbol.symbol === "NDQ" && p.symbol === "NAS100") ||
                    (selectedSymbol.symbol === "GOLD" && p.symbol === "XAUUSD")
                )
                .map((pos) => {
                  const entryY = getY(pos.openPrice);
                  const tpY = getY(pos.tp);
                  const slY = getY(pos.sl);
                  return (
                    <g key={`pos-chart-${pos.ticket}`}>
                      {/* Entry Line */}
                      <line
                        x1="0"
                        y1={entryY}
                        x2={chartWidth - paddingRight}
                        y2={entryY}
                        stroke="#2962ff"
                        strokeWidth="1.2"
                        strokeDasharray="4 2"
                      />
                      <rect
                        x={10}
                        y={entryY - 9}
                        width={140}
                        height={18}
                        fill="#1e222d"
                        stroke="#2962ff"
                        strokeWidth="1"
                        rx="3"
                      />
                      <text
                        x={16}
                        y={entryY + 3.5}
                        fill="#2962ff"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {pos.type} {pos.lots}L @ {pos.openPrice}
                      </text>

                      {/* TP Line */}
                      <line
                        x1="0"
                        y1={tpY}
                        x2={chartWidth - paddingRight}
                        y2={tpY}
                        stroke="#089981"
                        strokeWidth="1.2"
                        strokeDasharray="4 2"
                      />
                      <rect
                        x={10}
                        y={tpY - 9}
                        width={85}
                        height={18}
                        fill="#089981"
                        rx="3"
                      />
                      <text
                        x={16}
                        y={tpY + 3.5}
                        fill="#ffffff"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        TP: {pos.tp}
                      </text>

                      {/* SL Line */}
                      <line
                        x1="0"
                        y1={slY}
                        x2={chartWidth - paddingRight}
                        y2={slY}
                        stroke="#f23645"
                        strokeWidth="1.2"
                        strokeDasharray="4 2"
                      />
                      <rect
                        x={10}
                        y={slY - 9}
                        width={85}
                        height={18}
                        fill="#f23645"
                        rx="3"
                      />
                      <text
                        x={16}
                        y={slY + 3.5}
                        fill="#ffffff"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        SL: {pos.sl}
                      </text>
                    </g>
                  );
                })}

              {/* Live Price Line (Red dashed line across chart) */}
              {(() => {
                const curPriceY = getY(selectedSymbol.last);
                return (
                  <g>
                    <line
                      x1="0"
                      y1={curPriceY}
                      x2={chartWidth - paddingRight}
                      y2={curPriceY}
                      stroke="#f23645"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    {/* Live Price Badge with Countdown Timer on Right Scale */}
                    <rect
                      x={chartWidth - paddingRight + 1}
                      y={curPriceY - 14}
                      width={paddingRight - 2}
                      height={28}
                      fill="#f23645"
                      rx="2"
                    />
                    <text
                      x={chartWidth - paddingRight + 5}
                      y={curPriceY - 2}
                      fill="#ffffff"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {selectedSymbol.last.toFixed(selectedSymbol.digits)}
                    </text>
                    <text
                      x={chartWidth - paddingRight + 5}
                      y={curPriceY + 9}
                      fill="#ffffff"
                      fontSize="8"
                      fontFamily="monospace"
                    >
                      04:55:41
                    </text>
                  </g>
                );
              })()}

              {/* ── DRAWINGS & ANNOTATIONS LAYER ── */}
              {!isDrawingsHidden && (
                <g className="drawings-layer">
                  {[...drawings, ...(inProgressDrawing ? [inProgressDrawing] : [])].map((d) => {
                    const isSelected = selectedDrawingId === d.id;

                    if (d.type === "trendline" && d.points.length >= 2) {
                      const p1 = d.points[0];
                      const p2 = d.points[1];
                      if (!p1 || !p2) return null;
                      const price1 = p1.price ?? getPriceFromY(p1.y);
                      const price2 = p2.price ?? getPriceFromY(p2.y);
                      const pDiff = price2 - price1;
                      const pPct = price1 ? (pDiff / price1) * 100 : 0;
                      const midX = (p1.x + p2.x) / 2;
                      const midY = (p1.y + p2.y) / 2;
                      const color = d.color || "#2962ff";

                      return (
                        <g
                          key={d.id}
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDrawingId(isSelected ? null : d.id);
                          }}
                        >
                          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth="14" />
                          <line
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke={color}
                            strokeWidth={isSelected ? "2.5" : "2"}
                            strokeDasharray={isSelected ? "4 2" : undefined}
                          />
                          <circle cx={p1.x} cy={p1.y} r={isSelected ? "5" : "4"} fill={color} stroke="#ffffff" strokeWidth="1.5" />
                          <circle cx={p2.x} cy={p2.y} r={isSelected ? "5" : "4"} fill={color} stroke="#ffffff" strokeWidth="1.5" />
                          <g transform={`translate(${midX}, ${midY})`}>
                            <rect
                              x="-48"
                              y="-10"
                              width="96"
                              height="20"
                              rx="4"
                              fill="#131722"
                              stroke={color}
                              strokeWidth="1"
                              opacity="0.95"
                            />
                            <text
                              x="0"
                              y="3.5"
                              fill="#ffffff"
                              fontSize="8.5"
                              fontFamily="monospace"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {pDiff >= 0 ? "+" : ""}{pDiff.toFixed(2)} ({pPct >= 0 ? "+" : ""}{pPct.toFixed(1)}%)
                            </text>
                          </g>
                        </g>
                      );
                    }

                    if (d.type === "fibonacci" && d.points.length >= 2) {
                      const p1 = d.points[0];
                      const p2 = d.points[1];
                      if (!p1 || !p2) return null;
                      const topY = Math.min(p1.y, p2.y);
                      const botY = Math.max(p1.y, p2.y);
                      const totalH = botY - topY || 1;
                      const leftX = Math.min(p1.x, p2.x);
                      const rightX = Math.max(chartWidth - paddingRight - 10, Math.max(p1.x, p2.x) + 140);
                      const width = rightX - leftX;

                      const fibSteps = [
                        { lvl: 0.0, col: "#787b86", bg: "rgba(120, 123, 134, 0.06)", txt: "0.0% (0.000)" },
                        { lvl: 0.236, col: "#f23645", bg: "rgba(242, 54, 69, 0.08)", txt: "23.6% (0.236)" },
                        { lvl: 0.382, col: "#ff9800", bg: "rgba(255, 152, 0, 0.08)", txt: "38.2% (0.382)" },
                        { lvl: 0.50, col: "#089981", bg: "rgba(8, 153, 129, 0.10)", txt: "50.0% (0.500)" },
                        { lvl: 0.618, col: "#2962ff", bg: "rgba(41, 98, 255, 0.12)", txt: "61.8% (0.618 Golden)" },
                        { lvl: 0.786, col: "#9c27b0", bg: "rgba(156, 39, 176, 0.08)", txt: "78.6% (0.786)" },
                        { lvl: 1.0, col: "#787b86", bg: "rgba(120, 123, 134, 0.06)", txt: "100.0% (1.000)" },
                      ];

                      return (
                        <g
                          key={d.id}
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDrawingId(isSelected ? null : d.id);
                          }}
                        >
                          {fibSteps.slice(0, -1).map((step, idx) => {
                            const nextStep = fibSteps[idx + 1];
                            if (!nextStep) return null;
                            const y1 = topY + totalH * step.lvl;
                            const y2 = topY + totalH * nextStep.lvl;
                            return (
                              <rect
                                key={`fib-band-${idx}`}
                                x={leftX}
                                y={y1}
                                width={width}
                                height={y2 - y1}
                                fill={nextStep.bg}
                              />
                            );
                          })}
                          {fibSteps.map((step, idx) => {
                            const yPos = topY + totalH * step.lvl;
                            const levelPrice = getPriceFromY(yPos);
                            return (
                              <g key={`fib-lvl-${idx}`}>
                                <line
                                  x1={leftX}
                                  y1={yPos}
                                  x2={rightX}
                                  y2={yPos}
                                  stroke={step.col}
                                  strokeWidth="1"
                                  strokeDasharray="3 2"
                                  opacity="0.85"
                                />
                                <text
                                  x={leftX + 4}
                                  y={yPos - 3}
                                  fill={step.col}
                                  fontSize="8.5"
                                  fontFamily="monospace"
                                  fontWeight="bold"
                                >
                                  {step.txt} · {levelPrice.toFixed(selectedSymbol.digits || 2)}
                                </text>
                              </g>
                            );
                          })}
                        </g>
                      );
                    }

                    if (d.type === "brush" && d.points.length >= 2) {
                      const pathStr = d.points.reduce((acc, p, idx) => {
                        return idx === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
                      }, "");

                      return (
                        <g
                          key={d.id}
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDrawingId(isSelected ? null : d.id);
                          }}
                        >
                          <path
                            d={pathStr}
                            stroke={d.color || "#00D084"}
                            strokeWidth={isSelected ? "3.5" : "2.5"}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity={isSelected ? 1 : 0.88}
                          />
                        </g>
                      );
                    }

                    if (d.type === "text" && d.points.length >= 1) {
                      const p = d.points[0];
                      if (!p) return null;
                      const txt = d.text || `Zone Clé @ ${p.price || selectedSymbol.last}`;
                      const boxW = Math.max(120, txt.length * 7.5 + 24);

                      return (
                        <g
                          key={d.id}
                          transform={`translate(${p.x}, ${p.y})`}
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDrawingId(isSelected ? null : d.id);
                          }}
                        >
                          <rect
                            x="-10"
                            y="-14"
                            width={boxW}
                            height="28"
                            rx="6"
                            fill="#1e222d"
                            stroke={isSelected ? "#00D084" : "#2962ff"}
                            strokeWidth={isSelected ? "2" : "1.5"}
                            opacity="0.95"
                          />
                          <text
                            x="4"
                            y="4"
                            fill="#ffffff"
                            fontSize="10"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {txt}
                          </text>
                        </g>
                      );
                    }

                    if (d.type === "patterns" && d.points.length >= 5) {
                      const [pX, pA, pB, pC, pD] = d.points;
                      if (!pX || !pA || !pB || !pC || !pD) return null;
                      return (
                        <g
                          key={d.id}
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDrawingId(isSelected ? null : d.id);
                          }}
                        >
                          <polygon
                            points={`${pX.x},${pX.y} ${pA.x},${pA.y} ${pB.x},${pB.y}`}
                            fill="rgba(255, 152, 0, 0.12)"
                            stroke="none"
                          />
                          <polygon
                            points={`${pB.x},${pB.y} ${pC.x},${pC.y} ${pD.x},${pD.y}`}
                            fill="rgba(41, 98, 255, 0.12)"
                            stroke="none"
                          />
                          <polyline
                            points={`${pX.x},${pX.y} ${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y} ${pD.x},${pD.y}`}
                            fill="none"
                            stroke="#ff9800"
                            strokeWidth="1.8"
                            strokeDasharray={isSelected ? "4 2" : undefined}
                          />
                          {[
                            { p: pX, label: "X" },
                            { p: pA, label: "A (0.618)" },
                            { p: pB, label: "B (0.382)" },
                            { p: pC, label: "C (0.886)" },
                            { p: pD, label: "D (1.272 TP)" },
                          ].map((v, vIdx) => (
                            <g key={`v-${vIdx}`} transform={`translate(${v.p.x}, ${v.p.y})`}>
                              <circle cx="0" cy="0" r="4" fill="#ff9800" stroke="#ffffff" strokeWidth="1.5" />
                              <text x="6" y="3" fill="#ff9800" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                                {v.label}
                              </text>
                            </g>
                          ))}
                        </g>
                      );
                    }

                    if (d.type === "prediction" && d.points.length >= 1) {
                      const entryP = d.points[0];
                      if (!entryP) return null;
                      const targetH = 65;
                      const stopH = 30;
                      const boxW = 160;
                      const leftX = entryP.x;

                      return (
                        <g
                          key={d.id}
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDrawingId(isSelected ? null : d.id);
                          }}
                        >
                          <rect
                            x={leftX}
                            y={entryP.y - targetH}
                            width={boxW}
                            height={targetH}
                            fill="rgba(8, 153, 129, 0.20)"
                            stroke="#089981"
                            strokeWidth="1.2"
                            rx="2"
                          />
                          <text x={leftX + 6} y={entryP.y - targetH + 14} fill="#089981" fontSize="9" fontWeight="bold" fontFamily="monospace">
                            TARGET TP: +$300.00 (+3.0%)
                          </text>

                          <rect
                            x={leftX}
                            y={entryP.y}
                            width={boxW}
                            height={stopH}
                            fill="rgba(242, 54, 69, 0.20)"
                            stroke="#f23645"
                            strokeWidth="1.2"
                            rx="2"
                          />
                          <text x={leftX + 6} y={entryP.y + 18} fill="#f23645" fontSize="9" fontWeight="bold" fontFamily="monospace">
                            STOP LOSS: -$100.00 (-1.0%)
                          </text>

                          <line x1={leftX} y1={entryP.y} x2={leftX + boxW} y2={entryP.y} stroke="#ffffff" strokeWidth="1.5" />
                          <rect x={leftX + 30} y={entryP.y - 8} width="100" height="16" rx="3" fill="#1e222d" stroke="#2962ff" strokeWidth="1" />
                          <text x={leftX + 80} y={entryP.y + 3.5} fill="#2962ff" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                            Ratio R:R = 1 : 3.00
                          </text>
                        </g>
                      );
                    }

                    if (d.type === "icons" && d.points.length >= 1) {
                      const p = d.points[0];
                      if (!p) return null;
                      return (
                        <g
                          key={d.id}
                          transform={`translate(${p.x}, ${p.y})`}
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDrawingId(isSelected ? null : d.id);
                          }}
                        >
                          <circle cx="0" cy="0" r="14" fill="#2962ff" opacity="0.25" className="animate-ping" />
                          <circle cx="0" cy="0" r="8" fill="#2962ff" stroke="#ffffff" strokeWidth="1.5" />
                          <rect x="12" y="-10" width="130" height="20" rx="4" fill="#131722" stroke="#2962ff" strokeWidth="1" />
                          <text x="18" y="3.5" fill="#60a5fa" fontSize="9" fontWeight="bold" fontFamily="monospace">
                            ✨ Signal NXM FIX 4.4
                          </text>
                        </g>
                      );
                    }

                    if (d.type === "ruler" && d.points.length >= 2) {
                      const p1 = d.points[0];
                      const p2 = d.points[1];
                      if (!p1 || !p2) return null;
                      const rX = Math.min(p1.x, p2.x);
                      const rY = Math.min(p1.y, p2.y);
                      const rW = Math.max(Math.abs(p2.x - p1.x), 15);
                      const rH = Math.max(Math.abs(p2.y - p1.y), 15);
                      const barsCount = Math.max(1, Math.round(rW / candleSpacing));
                      const price1 = p1.price ?? getPriceFromY(p1.y);
                      const price2 = p2.price ?? getPriceFromY(p2.y);
                      const priceDiff = Math.abs(price2 - price1);
                      const pctDiff = price1 ? (priceDiff / price1) * 100 : 0;

                      return (
                        <g
                          key={d.id}
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDrawingId(isSelected ? null : d.id);
                          }}
                        >
                          <rect
                            x={rX}
                            y={rY}
                            width={rW}
                            height={rH}
                            fill="rgba(41, 98, 255, 0.14)"
                            stroke="#2962ff"
                            strokeWidth="1.2"
                            strokeDasharray="3 2"
                          />
                          <g transform={`translate(${rX + rW / 2}, ${rY + rH / 2})`}>
                            <rect x="-65" y="-12" width="130" height="24" rx="4" fill="#131722" stroke="#2962ff" strokeWidth="1" />
                            <text x="0" y="3.5" fill="#ffffff" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                              {barsCount} barres · ${priceDiff.toFixed(2)} ({pctDiff.toFixed(2)}%)
                            </text>
                          </g>
                        </g>
                      );
                    }

                    return null;
                  })}
                </g>
              )}

              {/* Hover Crosshair & Dynamic Tags */}
              {mousePos && (
                <g>
                  {/* Vertical Line */}
                  <line
                    x1={mousePos.x}
                    y1={paddingTop}
                    x2={mousePos.x}
                    y2={chartHeight - paddingBottom}
                    stroke="#787b86"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  {/* Horizontal Line */}
                  <line
                    x1="0"
                    y1={mousePos.y}
                    x2={chartWidth - paddingRight}
                    y2={mousePos.y}
                    stroke="#787b86"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  {/* Right Axis Hover Badge */}
                  {(() => {
                    const range = maxPrice - minPrice || 1;
                    const hoverPrice =
                      minPrice +
                      (1 - (mousePos.y - paddingTop) / (chartHeight - paddingTop - paddingBottom)) *
                        range;
                    return (
                      <g>
                        <rect
                          x={chartWidth - paddingRight + 1}
                          y={mousePos.y - 9}
                          width={paddingRight - 2}
                          height={18}
                          fill="#2a2e39"
                          rx="2"
                        />
                        <text
                          x={chartWidth - paddingRight + 5}
                          y={mousePos.y + 3.5}
                          fill="#ffffff"
                          fontSize="9.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {hoverPrice.toFixed(selectedSymbol.digits)}
                        </text>
                      </g>
                    );
                  })()}

                  {/* Bottom X-Axis Hover Tag (Pill) */}
                  {hoveredCandle && (
                    <g>
                      <rect
                        x={mousePos.x - 42}
                        y={chartHeight - paddingBottom + 2}
                        width={84}
                        height={18}
                        fill="#2a2e39"
                        rx="3"
                      />
                      <text
                        x={mousePos.x}
                        y={chartHeight - paddingBottom + 14}
                        fill="#ffffff"
                        fontSize="9.5"
                        fontFamily="sans-serif"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {hoveredCandle.monthLabel || hoveredCandle.dateLabel}
                      </text>
                    </g>
                  )}
                </g>
              )}

              {/* Volume Badge on Right Axis */}
              <g transform={`translate(${chartWidth - paddingRight + 1}, ${chartHeight - paddingBottom - 18})`}>
                <rect width={paddingRight - 2} height={16} fill="#f23645" rx="2" />
                <text x="5" y="11.5" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  8.67 M
                </text>
              </g>

              {/* Right Price Scale Numbers */}
              {priceTicks.map((price, pi) => {
                const y = getY(price);
                return (
                  <text
                    key={`price-label-${pi}`}
                    x={chartWidth - paddingRight + 5}
                    y={y + 3.5}
                    fill="#787b86"
                    fontSize="9.5"
                    fontFamily="monospace"
                  >
                    {price.toFixed(selectedSymbol.digits || 2)}
                  </text>
                );
              })}

              {/* Bottom Time Scale Markers */}
              {candles
                .filter((c) => c.monthLabel)
                .map((c, i) => {
                  const idx = candles.indexOf(c);
                  const x = 25 + idx * candleSpacing;
                  return (
                    <text
                      key={`month-label-${i}`}
                      x={x}
                      y={chartHeight - 12}
                      textAnchor="middle"
                      fill="#787b86"
                      fontSize="9.5"
                      fontFamily="sans-serif"
                    >
                      {c.monthLabel}
                    </text>
                  );
                })}
            </svg>

            {/* Floating Selection & Action HUD for Selected Drawing */}
            {selectedDrawingId && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-[#1e222d]/95 backdrop-blur-md border border-[#363a45] shadow-2xl py-1.5 px-3 rounded-xl animate-in fade-in zoom-in-95">
                <span className="text-[11px] font-mono font-bold text-slate-200">
                  Tracé sélectionné
                </span>
                <div className="h-3.5 w-px bg-[#363a45]" />
                <button
                  onClick={() => {
                    setDrawings((prev) => prev.filter((d) => d.id !== selectedDrawingId));
                    setSelectedDrawingId(null);
                    toast.success("Tracé supprimé.");
                  }}
                  className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Trash2 className="size-3" />
                  <span>Supprimer</span>
                </button>
                <button
                  onClick={() => setSelectedDrawingId(null)}
                  className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Bottom Quick Timeframe Bar (Dark) */}
          <div className="flex items-center justify-between border-t border-[#2a2e39] bg-[#131722] px-2.5 py-1 text-xs text-[#787b86]">
            <div className="flex items-center gap-1 font-bold">
              {["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "All"].map((span) => (
                <button
                  key={span}
                  className="px-1.5 py-0.5 rounded hover:bg-[#2a2e39] hover:text-white text-[11px] font-semibold transition cursor-pointer"
                >
                  {span}
                </button>
              ))}
              <Calendar className="size-3.5 ml-1 text-[#787b86]" />
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono font-semibold text-[#787b86]">
              <span>{clockTime}</span>
              <span className="font-bold text-white">ADJ</span>
            </div>
          </div>
        </div>

        {/* ── 3. COMPACT RIGHT SIDEBAR (w-64 TO SAVE SPACE) ── */}
        <div className="w-64 border-l border-[#2a2e39] bg-[#131722] flex flex-col shrink-0">
          {/* Watchlist Header */}
          <div className="flex items-center justify-between border-b border-[#2a2e39] px-2.5 py-1.5 h-10">
            <button className="flex items-center gap-1 font-bold text-xs text-white hover:text-[#2962ff] transition">
              <span>Watchlist</span>
              <ChevronDown className="size-3 text-[#787b86]" />
            </button>
            <div className="flex items-center gap-1.5 text-[#787b86]">
              <button
                title="Ajouter un symbole"
                className="p-1 hover:bg-[#2a2e39] rounded hover:text-white cursor-pointer"
              >
                <Plus className="size-3.5" />
              </button>
              <button
                title="Filtres & Sections"
                className="p-1 hover:bg-[#2a2e39] rounded hover:text-white cursor-pointer"
              >
                <SlidersHorizontal className="size-3.5" />
              </button>
              <button
                title="Options"
                className="p-1 hover:bg-[#2a2e39] rounded hover:text-white cursor-pointer"
              >
                <MoreHorizontal className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Watchlist Columns Header */}
          <div className="grid grid-cols-12 px-2.5 py-1 border-b border-[#1e222d] text-[9.5px] font-bold text-[#787b86] uppercase tracking-wider bg-[#1e222d]/40">
            <span className="col-span-5">Symbol</span>
            <span className="col-span-4 text-right">Last</span>
            <span className="col-span-3 text-right">Chg%</span>
          </div>

          {/* Watchlist Items list (Compact) */}
          <div className="flex-1 overflow-y-auto max-h-[290px] divide-y divide-[#1e222d] text-xs font-mono">
            {/* 1. INDICES */}
            <div className="px-2.5 py-1 text-[9.5px] font-bold text-[#787b86] flex items-center gap-1 bg-[#1e222d]/70">
              <ChevronDown className="size-2.5" />
              <span>INDICES</span>
            </div>
            {watchlist
              .filter((w) => w.category === "INDICES")
              .map((item) => {
                const isSelected = selectedSymbol.symbol === item.symbol;
                const isUp = item.chg >= 0;
                return (
                  <button
                    key={item.symbol}
                    onClick={() => setSelectedSymbol(item)}
                    className={`w-full grid grid-cols-12 items-center px-2.5 py-1.5 text-left transition cursor-pointer ${
                      isSelected ? "bg-[#2a2e39] font-bold text-white" : "hover:bg-[#1e222d] text-[#d1d4dc]"
                    }`}
                  >
                    <div className="col-span-5 flex items-center gap-1 truncate">
                      <span className={`size-3.5 rounded-full ${item.iconBg} text-white flex items-center justify-center text-[6.5px] font-black shrink-0`}>
                        {item.iconText}
                      </span>
                      <span className="font-bold truncate text-[11.5px]">{item.symbol}</span>
                      {item.hasDiv && <span className="text-[8px] text-[#f57f17] font-black">D</span>}
                    </div>
                    <span className="col-span-4 text-right font-semibold text-[11px] text-white">
                      {item.last.toLocaleString("en-US", { minimumFractionDigits: item.digits })}
                    </span>
                    <span
                      className={`col-span-3 text-right font-bold text-[10.5px] ${
                        isUp ? "text-[#089981]" : "text-[#f23645]"
                      }`}
                    >
                      {isUp ? "+" : ""}{item.chgPct.toFixed(2)}%
                    </span>
                  </button>
                );
              })}

            {/* 2. STOCKS */}
            <div className="px-2.5 py-1 text-[9.5px] font-bold text-[#787b86] flex items-center gap-1 bg-[#1e222d]/70">
              <ChevronDown className="size-2.5" />
              <span>STOCKS</span>
            </div>
            {watchlist
              .filter((w) => w.category === "STOCKS")
              .map((item) => {
                const isSelected = selectedSymbol.symbol === item.symbol;
                const isUp = item.chg >= 0;
                return (
                  <button
                    key={item.symbol}
                    onClick={() => setSelectedSymbol(item)}
                    className={`w-full grid grid-cols-12 items-center px-2.5 py-1.5 text-left transition cursor-pointer ${
                      isSelected
                        ? "bg-[#2962ff] text-white font-bold rounded-sm shadow-sm"
                        : "hover:bg-[#1e222d] text-[#d1d4dc]"
                    }`}
                  >
                    <div className="col-span-5 flex items-center gap-1 truncate">
                      <span className={`size-3.5 rounded-full ${item.iconBg} flex items-center justify-center text-[7px] font-black shrink-0`}>
                        {item.iconText}
                      </span>
                      <span className="font-bold truncate text-[11.5px]">{item.symbol}</span>
                    </div>
                    <span className="col-span-4 text-right font-semibold text-[11px] text-white">
                      {item.last.toFixed(item.digits)}
                    </span>
                    <span
                      className={`col-span-3 text-right font-bold text-[10.5px] ${
                        isSelected ? "text-white" : isUp ? "text-[#089981]" : "text-[#f23645]"
                      }`}
                    >
                      {isUp ? "+" : ""}{item.chgPct.toFixed(2)}%
                    </span>
                  </button>
                );
              })}

            {/* 3. FUTURES */}
            <div className="px-2.5 py-1 text-[9.5px] font-bold text-[#787b86] flex items-center gap-1 bg-[#1e222d]/70">
              <ChevronDown className="size-2.5" />
              <span>FUTURES</span>
            </div>
            {watchlist
              .filter((w) => w.category === "FUTURES")
              .map((item) => {
                const isSelected = selectedSymbol.symbol === item.symbol;
                const isUp = item.chg >= 0;
                return (
                  <button
                    key={item.symbol}
                    onClick={() => setSelectedSymbol(item)}
                    className={`w-full grid grid-cols-12 items-center px-2.5 py-1.5 text-left transition cursor-pointer ${
                      isSelected ? "bg-[#2a2e39] font-bold text-white" : "hover:bg-[#1e222d] text-[#d1d4dc]"
                    }`}
                  >
                    <div className="col-span-5 flex items-center gap-1 truncate">
                      <span className={`size-3.5 rounded-full ${item.iconBg} text-white flex items-center justify-center text-[6.5px] font-black shrink-0`}>
                        {item.iconText}
                      </span>
                      <span className="font-bold truncate text-[11.5px]">{item.symbol}</span>
                    </div>
                    <span className="col-span-4 text-right font-semibold text-[11px] text-white">
                      {item.last.toLocaleString("en-US", { minimumFractionDigits: item.digits })}
                    </span>
                    <span
                      className={`col-span-3 text-right font-bold text-[10.5px] ${
                        isUp ? "text-[#089981]" : "text-[#f23645]"
                      }`}
                    >
                      {isUp ? "+" : ""}{item.chgPct.toFixed(2)}%
                    </span>
                  </button>
                );
              })}
          </div>

          {/* ── SYMBOL DETAILS CARD (BOTTOM RIGHT PANEL - COMPACT DARK) ── */}
          <div className="border-t border-[#2a2e39] p-3 bg-[#131722] space-y-1.5 text-xs">
            {/* Header: Logo + AAPL + actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                <span className="size-3.5 rounded-full bg-white text-black flex items-center justify-center text-[8px] font-black"></span>
                <span>{selectedSymbol.symbol}</span>
              </div>
              <div className="flex items-center gap-1 text-[#787b86]">
                <button className="p-0.5 hover:bg-[#2a2e39] rounded hover:text-white">
                  <Grid className="size-3" />
                </button>
                <button className="p-0.5 hover:bg-[#2a2e39] rounded hover:text-white">
                  <Edit3 className="size-3" />
                </button>
                <button className="p-0.5 hover:bg-[#2a2e39] rounded hover:text-white">
                  <MoreHorizontal className="size-3" />
                </button>
              </div>
            </div>

            {/* Subtitle */}
            <div className="text-[10.5px] text-[#787b86] truncate">
              {selectedSymbol.description}
            </div>

            {/* Big Price Display */}
            <div className="flex items-baseline gap-1.5 pt-0.5">
              <span className="text-xl font-black font-mono text-white">
                {selectedSymbol.last.toFixed(selectedSymbol.digits)}
              </span>
              <span className="text-[10px] text-[#787b86] font-bold">USD</span>
              <span
                className={`text-[10.5px] font-mono font-bold ${
                  selectedSymbol.chg >= 0 ? "text-[#089981]" : "text-[#f23645]"
                }`}
              >
                {selectedSymbol.chg >= 0 ? "+" : ""}{selectedSymbol.chg.toFixed(selectedSymbol.digits)} ({selectedSymbol.chgPct >= 0 ? "+" : ""}{selectedSymbol.chgPct.toFixed(2)}%)
              </span>
            </div>

            {/* Market Open Status */}
            <div className="flex items-center gap-1.5 text-[10px] text-[#089981] font-medium">
              <span className="size-1.5 rounded-full bg-[#089981]" />
              <span>Market open</span>
            </div>

            {/* Purple Key Facts AI Card */}
            {selectedSymbol.keyFacts && (
              <div className="rounded-lg border border-[#4338ca]/30 bg-[#1e1b4b]/50 p-2 space-y-0.5">
                <div className="flex items-center gap-1 text-[#a5b4fc] text-[10px] font-bold">
                  <Sparkles className="size-3" />
                  <span>Key facts</span>
                </div>
                <p className="text-[9.5px] text-[#c7d2fe] leading-tight line-clamp-2">
                  {selectedSymbol.keyFacts}
                </p>
                <button className="text-[9.5px] text-[#60a5fa] hover:underline font-semibold block pt-0.5">
                  Keep reading &gt;
                </button>
              </div>
            )}

            {/* Key Stats */}
            <div className="space-y-0.5 pt-0.5 text-[10.5px]">
              <div className="flex items-center justify-between text-[#787b86]">
                <span>Volume</span>
                <strong className="text-white font-mono font-semibold">{selectedSymbol.volume}</strong>
              </div>
              <div className="flex items-center justify-between text-[#787b86]">
                <span>Avg Volume (30D)</span>
                <strong className="text-white font-mono font-semibold">{selectedSymbol.avgVolume}</strong>
              </div>
              {selectedSymbol.marketCap && (
                <div className="flex items-center justify-between text-[#787b86]">
                  <span>Market cap</span>
                  <strong className="text-white font-mono font-semibold">{selectedSymbol.marketCap}</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 4. FAR RIGHT VERTICAL ICON TOOLBAR (DARK) ── */}
        <div className="w-9 border-l border-[#2a2e39] bg-[#131722] flex flex-col items-center py-2 gap-2 text-[#787b86] shrink-0">
          <button
            onClick={() => setActiveRightTab("watchlist")}
            title="Watchlist & Détails"
            className={`p-1.5 rounded-md transition cursor-pointer ${
              activeRightTab === "watchlist"
                ? "bg-[#2a2e39] text-white"
                : "hover:bg-[#2a2e39] hover:text-white"
            }`}
          >
            <Bookmark className="size-3.5" />
          </button>
          <button
            onClick={() => setActiveRightTab("alerts")}
            title="Alertes"
            className="p-1.5 rounded-md hover:bg-[#2a2e39] hover:text-white transition cursor-pointer"
          >
            <Clock className="size-3.5" />
          </button>
          <button
            onClick={() => setActiveRightTab("news")}
            title="Actualités & Flux d'informations"
            className="p-1.5 rounded-md hover:bg-[#2a2e39] hover:text-white transition cursor-pointer"
          >
            <Layers className="size-3.5" />
          </button>
          <button
            onClick={() => setActiveRightTab("data")}
            title="Fenêtre de données"
            className="p-1.5 rounded-md hover:bg-[#2a2e39] hover:text-white transition cursor-pointer"
          >
            <Crosshair className="size-3.5" />
          </button>
          <button
            onClick={() => setActiveRightTab("hotlists")}
            title="Listes d'intérêts"
            className="p-1.5 rounded-md hover:bg-[#2a2e39] hover:text-white transition cursor-pointer"
          >
            <Flame className="size-3.5" />
          </button>
          <button
            onClick={() => setActiveRightTab("calendar")}
            title="Calendrier économique"
            className="p-1.5 rounded-md hover:bg-[#2a2e39] hover:text-white transition cursor-pointer"
          >
            <Calendar className="size-3.5" />
          </button>
          <button
            onClick={() => setActiveRightTab("ideas")}
            title="Mes idées de trading"
            className="p-1.5 rounded-md hover:bg-[#2a2e39] hover:text-white transition cursor-pointer"
          >
            <Sparkles className="size-3.5" />
          </button>
          <button
            onClick={() => setActiveRightTab("chats")}
            title="Chats publics et privés"
            className="p-1.5 rounded-md hover:bg-[#2a2e39] hover:text-white transition cursor-pointer"
          >
            <MessageSquare className="size-3.5" />
          </button>
          <button
            onClick={() => setActiveRightTab("stream")}
            title="Flux d'idées en direct"
            className="p-1.5 rounded-md hover:bg-[#2a2e39] hover:text-white transition cursor-pointer"
          >
            <Radio className="size-3.5" />
          </button>
          <button
            onClick={() => setActiveRightTab("notifications")}
            title="Notifications"
            className="p-1.5 rounded-md hover:bg-[#2a2e39] hover:text-white transition cursor-pointer"
          >
            <Bell className="size-3.5" />
          </button>
          <button
            onClick={() => setActiveRightTab("order_panel")}
            title="Passation d'ordres"
            className="p-1.5 rounded-md hover:bg-[#2a2e39] hover:text-white transition cursor-pointer"
          >
            <FileText className="size-3.5" />
          </button>
          <button
            title="Aide & Raccourcis"
            className="p-1.5 rounded-md hover:bg-[#2a2e39] hover:text-white transition cursor-pointer mt-auto"
          >
            <HelpCircle className="size-3.5" />
          </button>
        </div>
      </div>

      {/* ── 5. BOTTOM ACCOUNT MANAGER / POSITIONS / HISTORIQUE / QUOTAS PANEL (DARK) ── */}
      <div className="border-t border-[#2a2e39] bg-[#131722]">
        {/* Panel Top Header Tab */}
        <div className="flex items-center justify-between px-3 py-1 bg-[#131722] border-b border-[#2a2e39] text-xs font-semibold text-[#787b86]">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setBottomTab("positions");
                setIsBottomOpen(true);
              }}
              className={`px-3 py-1 rounded-t-md font-bold text-xs border border-b-0 shadow-sm flex items-center gap-1.5 cursor-pointer transition ${
                bottomTab === "positions" && isBottomOpen
                  ? "bg-[#1e222d] text-white border-[#2a2e39]"
                  : "bg-transparent text-[#787b86] border-transparent hover:text-white"
              }`}
            >
              <span>Positions Ouvertes ({positions.length})</span>
            </button>

            <button
              onClick={() => {
                setBottomTab("history");
                setIsBottomOpen(true);
              }}
              className={`px-3 py-1 rounded-t-md font-bold text-xs border border-b-0 shadow-sm flex items-center gap-1.5 cursor-pointer transition ${
                bottomTab === "history" && isBottomOpen
                  ? "bg-[#1e222d] text-white border-[#2a2e39]"
                  : "bg-transparent text-[#787b86] border-transparent hover:text-white"
              }`}
            >
              <span>Historique Ordres ({tradeHistory.length})</span>
            </button>

            <button
              onClick={() => {
                setBottomTab("quotas");
                setIsBottomOpen(true);
              }}
              className={`px-3 py-1 rounded-t-md font-bold text-xs border border-b-0 shadow-sm flex items-center gap-1.5 cursor-pointer transition ${
                bottomTab === "quotas" && isBottomOpen
                  ? "bg-[#1e222d] text-cyan-400 border-[#2a2e39]"
                  : "bg-transparent text-[#787b86] border-transparent hover:text-white"
              }`}
            >
              <Sparkles className="size-3" />
              <span>Quotas Abonnements ({quotaStats.goldWins}/2 · {quotaStats.fxWins}/5 · ∞)</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-[#787b86]">Solde démo: <strong className="text-white">${balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</strong></span>
              <span className="text-[#787b86]">P&amp;L Flottant: <strong className={totalOpenProfit >= 0 ? "text-[#089981]" : "text-[#f23645]"}>
                {totalOpenProfit >= 0 ? "+" : ""}${totalOpenProfit.toFixed(2)} USD
              </strong></span>
            </div>

            <div className="flex items-center gap-1 text-[#787b86]">
              <button
                onClick={() => setIsBottomOpen(!isBottomOpen)}
                className="p-1 hover:bg-[#2a2e39] rounded hover:text-white cursor-pointer"
                title="Minimiser / Dérouler"
              >
                {isBottomOpen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Tab Content */}
        {isBottomOpen && bottomTab === "positions" && (
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#1e222d] border-b border-[#2a2e39] text-[10px] uppercase text-[#787b86]">
                <tr>
                  <th className="px-3 py-1.5">Ticket</th>
                  <th className="px-3 py-1.5">Heure</th>
                  <th className="px-3 py-1.5">Type</th>
                  <th className="px-3 py-1.5">Lots</th>
                  <th className="px-3 py-1.5">Symbole</th>
                  <th className="px-3 py-1.5">Prix Ouverture</th>
                  <th className="px-3 py-1.5">Prix Actuel</th>
                  <th className="px-3 py-1.5">S / L</th>
                  <th className="px-3 py-1.5">T / P</th>
                  <th className="px-3 py-1.5 text-right">P&amp;L</th>
                  <th className="px-3 py-1.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2e39]">
                {positions.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-6 text-slate-500 font-sans text-xs">
                      Aucune position ouverte actuellement. Utilisez le panneau 1-Click SELL / BUY ou lancez un Bot Preset ci-dessus.
                    </td>
                  </tr>
                ) : (
                  positions.map((pos) => (
                    <tr key={pos.ticket} className="hover:bg-[#1e222d]/70 transition">
                      <td className="px-3 py-1.5 font-bold text-white">#{pos.ticket}</td>
                      <td className="px-3 py-1.5 text-slate-400">{pos.time}</td>
                      <td className="px-3 py-1.5 font-bold">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${pos.type === "BUY" ? "bg-[#172d54] text-[#2962ff]" : "bg-[#362128] text-[#f23645]"}`}>
                          {pos.type}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 font-bold text-white">{pos.lots.toFixed(2)}</td>
                      <td className="px-3 py-1.5 font-bold text-white">{pos.symbol}</td>
                      <td className="px-3 py-1.5 text-slate-300">{pos.openPrice.toFixed(2)}</td>
                      <td className="px-3 py-1.5 font-bold text-white">{pos.currentPrice.toFixed(2)}</td>
                      <td className="px-3 py-1.5 text-slate-500">{pos.sl ? pos.sl.toFixed(2) : "—"}</td>
                      <td className="px-3 py-1.5 text-slate-500">{pos.tp ? pos.tp.toFixed(2) : "—"}</td>
                      <td className={`px-3 py-1.5 text-right font-black ${pos.profit >= 0 ? "text-[#089981]" : "text-[#f23645]"}`}>
                        {pos.profit >= 0 ? "+" : ""}${pos.profit.toFixed(2)}
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <button
                          onClick={() => handleClosePosition(pos.ticket)}
                          className="p-1 hover:bg-[#f23645]/20 text-[#f23645] rounded-md transition cursor-pointer"
                          title="Clôturer la position (valider P&L & Quota)"
                        >
                          <X className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {isBottomOpen && bottomTab === "history" && (
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#1e222d] border-b border-[#2a2e39] text-[10px] uppercase text-[#787b86]">
                <tr>
                  <th className="px-3 py-1.5">Ticket</th>
                  <th className="px-3 py-1.5">Ouv.</th>
                  <th className="px-3 py-1.5">Clôture</th>
                  <th className="px-3 py-1.5">Type</th>
                  <th className="px-3 py-1.5">Lots</th>
                  <th className="px-3 py-1.5">Symbole</th>
                  <th className="px-3 py-1.5">Prix Ouv.</th>
                  <th className="px-3 py-1.5">Prix Clôture</th>
                  <th className="px-3 py-1.5 text-right">P&amp;L Réalisé</th>
                  <th className="px-3 py-1.5">Commentaire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2e39]">
                {tradeHistory.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-6 text-slate-500 font-sans text-xs">
                      Aucun ordre clôturé dans l'historique de cette session.
                    </td>
                  </tr>
                ) : (
                  tradeHistory.map((item) => (
                    <tr key={item.ticket} className="hover:bg-[#1e222d]/70 transition">
                      <td className="px-3 py-1.5 font-bold text-white">#{item.ticket}</td>
                      <td className="px-3 py-1.5 text-slate-400">{item.openTime}</td>
                      <td className="px-3 py-1.5 text-slate-300 font-bold">{item.closeTime}</td>
                      <td className="px-3 py-1.5 font-bold">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${item.type === "BUY" ? "bg-[#172d54] text-[#2962ff]" : "bg-[#362128] text-[#f23645]"}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 font-bold text-white">{item.lots.toFixed(2)}</td>
                      <td className="px-3 py-1.5 font-bold text-white">{item.symbol}</td>
                      <td className="px-3 py-1.5 text-slate-400">{item.openPrice.toFixed(2)}</td>
                      <td className="px-3 py-1.5 font-bold text-white">{item.closePrice.toFixed(2)}</td>
                      <td className={`px-3 py-1.5 text-right font-black ${item.profit >= 0 ? "text-[#089981]" : "text-[#f23645]"}`}>
                        {item.profit >= 0 ? "+" : ""}${item.profit.toFixed(2)}
                      </td>
                      <td className="px-3 py-1.5 text-slate-400 font-sans text-[11px] truncate max-w-xs">{item.comment}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {isBottomOpen && bottomTab === "quotas" && (
          <div className="p-3 bg-[#0d1017]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PRESET_IDS.map((id, index) => {
                const rules = PRESET_RULES[id];
                const { trades, pnl, initialStake } = presetCycleStats(quotaStats, presetStakes, id);
                const limited = rules.maxTrades !== Infinity;
                const expired = isPresetExpired(id, trades);
                const approved = activeList.includes(id);
                const running = runningPresets[id];
                const status = !approved ? "INACTIF" : expired ? "EXPIRÉ" : running ? "BOT LANCÉ" : "BOT ARRÊTÉ";
                const statusClass = !approved
                  ? "border-slate-600/50 bg-slate-800/40 text-slate-400"
                  : expired
                  ? "border-rose-500/40 bg-rose-500/20 text-rose-300"
                  : running
                  ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                  : "border-amber-500/40 bg-amber-500/15 text-amber-300";
                const accent = ["text-amber-300", "text-cyan-300", "text-purple-300"][index];
                const bar = ["bg-amber-400", "bg-cyan-400", "bg-purple-400"][index];
                return (
                  <div key={id} className="p-3 rounded-xl border border-[#2a2e39] bg-[#131722] flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold ${accent}`}>{rules.name} : {PRESET_LABEL[id]}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${statusClass}`}>{status}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Gain cible : +{Math.round(rules.targetRate * 100)}% de la mise initiale · {limited ? `${rules.maxTrades} trades max` : "trades illimités"} · {PRESET_SYMBOL[id]}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                      <div>
                        <span className="block text-[9px] uppercase text-slate-500">Mise initiale</span>
                        <strong className="text-white">${initialStake}</strong>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase text-slate-500">Trades</span>
                        <strong className="text-white">{limited ? `${Math.min(trades, rules.maxTrades)}/${rules.maxTrades}` : trades}</strong>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase text-slate-500">{expired ? "P&L final" : "P&L cycle"}</span>
                        <strong className={pnl >= 0 ? "text-[#089981]" : "text-[#f23645]"}>
                          {pnl >= 0 ? "+" : "-"}${Math.abs(pnl).toFixed(2)}
                        </strong>
                      </div>
                    </div>
                    {limited && (
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${expired ? "bg-rose-500" : bar}`}
                          style={{ width: `${Math.min(100, (trades / rules.maxTrades) * 100)}%` }}
                        />
                      </div>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono">
                      Objectif par trade : +${(initialStake * rules.targetRate).toFixed(2)} (TP) · risque : -${((initialStake * rules.targetRate) / 2).toFixed(2)} (SL)
                    </span>
                    {expired && (
                      <span className="text-[10px] font-bold text-rose-300 font-mono">
                        Cycle terminé — nouvelle demande d'activation nécessaire.
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
