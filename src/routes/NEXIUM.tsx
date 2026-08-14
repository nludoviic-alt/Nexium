import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  BarChart3,
  Bell,
  Bot,
  Brain,
  Calculator,
  Calendar,
  CalendarDays,
  CandlestickChart,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Crosshair,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Flame,
  Globe2,
  Grid,
  History,
  Inbox,
  Layers,
  LayoutDashboard,
  Lock,
  Mail,
  Maximize2,
  Menu,
  MessageCircle,
  MessageSquare,
  Mic,
  MicOff,
  Minimize2,
  Paperclip,
  Pause,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  PhoneOff,
  Play,
  Plus,
  Power,
  Radar,
  Radio,
  RefreshCw,
  ScreenShare,
  Search,
  Send,
  Settings,
  Settings2,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  SlidersHorizontal,
  Sparkles,
  Star,
  Timer,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
  User,
  UserCheck,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Wallet,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useId, useMemo, useState, useRef, type ReactNode } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/NEXIUM")({
  head: () => ({
    meta: [
      { title: "Tableau de Bord Institutionnel — Nexium Markets MT5" },
      {
        name: "description",
        content:
          "AI Trading Control Center Nexium Markets : supervision en temps réel des 3 moteurs automatisés (AI Gold, FX Trend, Index Reversion), graphiques de trading en direct, télémétrie FIX et gouvernance du risque.",
      },
    ],
  }),
  component: NexiumDashboard,
});

// ----------------------------------------------------
// TYPES & DATA STRUCTURES
// ----------------------------------------------------
export interface EngineBot {
  id: "nexium-ai-gold" | "nexium-fx-trend" | "nexium-index-reversion";
  name: string;
  specialty: string;
  subtitle: string;
  statusBadge: "ACTIF" | "EN PAUSE" | "OFFLINE" | "ERREUR";
  mainState: "POSITION OPEN" | "RUNNING" | "WAITING FOR SETUP" | "RISK BLOCKED";
  markets: string;
  primarySymbol: string;
  strategy: string;
  marketRegime: string;
  regimeDetail: string;
  volatility: string;
  lastScore: string;
  lastScoreNum: number;
  openPositions: number;
  pnlToday: string;
  pnlTodayNum: number;
  lastSignalTime: string;
  heartbeatSec: number;
  theme: "gold" | "cyan" | "purple";
  // Decision & Pipeline
  pipeline: {
    marketData: boolean;
    marketRegime: boolean;
    strategy: boolean;
    signal: boolean;
    score: string;
    riskManager: boolean;
    execution: boolean;
    result: "TRADE EXECUTED" | "WAITING" | "REJECTED";
  };
  lastDecision: {
    action: string;
    symbol: string;
    score: number;
    result: "EXECUTED" | "REJECTED" | "WAITING FOR CONFIRMATION";
    reason?: string;
  };
  // Activity stats
  activity: {
    signals: number;
    qualified: number;
    executed: number;
    rejected: number;
    pnl: string;
  };
  // Risk stats
  risk: {
    allocation: string;
    drawdown: string;
    status: "NORMAL" | "CAUTION" | "BLOCKED";
  };
  // TradingView details
  chart: {
    symbol: string;
    price: string;
    spread: string;
    timeframe: string;
    tradeType: "BUY" | "SELL" | "NONE";
    entryPrice: string;
    slPrice: string;
    tpPrice: string;
    candles: Array<{ time: string; open: number; high: number; low: number; close: number; isUp: boolean }>;
  };
  version: string;
  uptime: string;
}

export interface PositionItem {
  id: string;
  ticket: string;
  side: "BUY" | "SELL";
  strategy: string;
  symbol: string;
  volume: string;
  entry: string;
  currentPrice: string;
  sl: string;
  tp: string;
  pnlNum: number;
  pnl: string;
  openTime: string;
  botId: "nexium-ai-gold" | "nexium-fx-trend" | "nexium-index-reversion";
}

export interface TransactionItem {
  id: string;
  date: string;
  type: "Dépôt validé" | "Retrait traité" | "Gain trading MT5" | "Clôture position";
  amount: string;
  amountNum: number;
  currency: string;
  status: "Confirmé" | "En cours" | "Exécuté";
  method?: string;
  color: string;
}

export interface JournalEntry {
  id: string;
  time: string;
  event: string;
  symbol?: string;
  detail: string;
  status: "VALIDÉ" | "EXÉCUTÉ" | "CLÔTURÉ" | "ALERTE" | "INFO";
  statusVariant: "emerald" | "sky" | "purple" | "amber" | "slate";
}

export interface ChatMessage {
  id: string;
  sender: "user" | "desk" | "system";
  senderName: string;
  text: string;
  time: string;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: "ABOVE" | "BELOW";
  triggered: boolean;
  createdAt: string;
}

// ----------------------------------------------------
// 3 INSTITUTIONAL BOTS DEFINITIONS
// ----------------------------------------------------
const INITIAL_BOTS: EngineBot[] = [
  {
    id: "nexium-ai-gold",
    name: "Nexium AI Gold",
    specialty: "Spécialiste de l'Or Spot (XAUUSD)",
    subtitle: "Trading algorithmique spécialisé sur l'or et les ruptures de volatilité.",
    statusBadge: "ACTIF",
    mainState: "POSITION OPEN",
    markets: "XAUUSD",
    primarySymbol: "XAUUSD",
    strategy: "Trend Pullback / Breakout",
    marketRegime: "TRENDING UP",
    regimeDetail: "Volatilité modérée · Tendance haussière H4/M15",
    volatility: "MODERATE",
    lastScore: "84 / 100",
    lastScoreNum: 84,
    openPositions: 1,
    pnlToday: "+$126.40",
    pnlTodayNum: 126.4,
    lastSignalTime: "Il y a 3 min",
    heartbeatSec: 8,
    theme: "gold",
    pipeline: {
      marketData: true,
      marketRegime: true,
      strategy: true,
      signal: true,
      score: "84/100",
      riskManager: true,
      execution: true,
      result: "TRADE EXECUTED",
    },
    lastDecision: {
      action: "BUY XAUUSD",
      symbol: "XAUUSD",
      score: 84,
      result: "EXECUTED",
    },
    activity: {
      signals: 48,
      qualified: 12,
      executed: 6,
      rejected: 6,
      pnl: "+$126.40",
    },
    risk: {
      allocation: "0.25%",
      drawdown: "1.2%",
      status: "NORMAL",
    },
    chart: {
      symbol: "XAUUSD (Spot Gold / US Dollar)",
      price: "2 388.90",
      spread: "0.10 pt (ECN Raw)",
      timeframe: "M15",
      tradeType: "BUY",
      entryPrice: "2 384.20",
      slPrice: "2 374.00",
      tpPrice: "2 405.00",
      candles: [
        { time: "13:45", open: 2378.5, high: 2381.2, low: 2377.8, close: 2380.9, isUp: true },
        { time: "14:00", open: 2380.9, high: 2383.0, low: 2379.5, close: 2382.4, isUp: true },
        { time: "14:15", open: 2382.4, high: 2385.6, low: 2381.8, close: 2384.2, isUp: true },
        { time: "14:30", open: 2384.2, high: 2389.8, low: 2383.9, close: 2387.5, isUp: true },
        { time: "14:45", open: 2387.5, high: 2390.4, low: 2386.2, close: 2388.9, isUp: true },
      ],
    },
    version: "v2.6.4 MQL5 ECN",
    uptime: "99.98% (Equinix NY4)",
  },
  {
    id: "nexium-fx-trend",
    name: "Nexium FX Trend",
    specialty: "Spécialiste des tendances Forex Majeures",
    subtitle: "Moteur de suivi de tendance dédié aux paires majeures Forex.",
    statusBadge: "ACTIF",
    mainState: "POSITION OPEN",
    markets: "EURUSD • GBPUSD • USDJPY",
    primarySymbol: "EURUSD",
    strategy: "Trend Following",
    marketRegime: "TRENDING",
    regimeDetail: "EURUSD Trending Down · USDJPY Trending Up",
    volatility: "LOW / STABLE",
    lastScore: "79 / 100",
    lastScoreNum: 79,
    openPositions: 2,
    pnlToday: "+$84.20",
    pnlTodayNum: 84.2,
    lastSignalTime: "Il y a 7 min",
    heartbeatSec: 11,
    theme: "cyan",
    pipeline: {
      marketData: true,
      marketRegime: true,
      strategy: true,
      signal: true,
      score: "74/100",
      riskManager: false,
      execution: false,
      result: "REJECTED",
    },
    lastDecision: {
      action: "SELL EURUSD",
      symbol: "EURUSD",
      score: 74,
      result: "REJECTED",
      reason: "Score minimum requis : 78",
    },
    activity: {
      signals: 63,
      qualified: 14,
      executed: 8,
      rejected: 6,
      pnl: "+$84.20",
    },
    risk: {
      allocation: "0.20%",
      drawdown: "0.8%",
      status: "NORMAL",
    },
    chart: {
      symbol: "EURUSD (Euro / US Dollar)",
      price: "1.08584",
      spread: "0.0 pips (ECN Zero)",
      timeframe: "H1",
      tradeType: "BUY",
      entryPrice: "1.08450",
      slPrice: "1.08150",
      tpPrice: "1.09100",
      candles: [
        { time: "11:00", open: 1.0832, high: 1.0844, low: 1.0828, close: 1.0841, isUp: true },
        { time: "12:00", open: 1.0841, high: 1.0849, low: 1.0838, close: 1.0845, isUp: true },
        { time: "13:00", open: 1.0845, high: 1.0862, low: 1.0843, close: 1.0855, isUp: true },
        { time: "14:00", open: 1.0855, high: 1.0865, low: 1.0851, close: 1.0858, isUp: true },
      ],
    },
    version: "v3.1.2 MQL5 ECN",
    uptime: "100.00% (Equinix NY4)",
  },
  {
    id: "nexium-index-reversion",
    name: "Nexium Index Reversion",
    specialty: "Spécialiste du retour à la moyenne sur indices",
    subtitle: "Moteur de retour à la moyenne haute fréquence conçu pour le Nasdaq et le Dow Jones.",
    statusBadge: "ACTIF",
    mainState: "WAITING FOR SETUP",
    markets: "NAS100 • US30",
    primarySymbol: "NAS100",
    strategy: "Mean Reversion",
    marketRegime: "RANGING",
    regimeDetail: "NAS100 Ranging · US30 High Volatility",
    volatility: "HIGH",
    lastScore: "81 / 100",
    lastScoreNum: 81,
    openPositions: 1,
    pnlToday: "-$22.60",
    pnlTodayNum: -22.6,
    lastSignalTime: "Il y a 12 min",
    heartbeatSec: 6,
    theme: "purple",
    pipeline: {
      marketData: true,
      marketRegime: true,
      strategy: true,
      signal: true,
      score: "81/100",
      riskManager: true,
      execution: false,
      result: "WAITING",
    },
    lastDecision: {
      action: "BUY NAS100",
      symbol: "NAS100",
      score: 81,
      result: "WAITING FOR CONFIRMATION",
      reason: "En attente de clôture de confirmation M15",
    },
    activity: {
      signals: 39,
      qualified: 9,
      executed: 4,
      rejected: 5,
      pnl: "-$22.60",
    },
    risk: {
      allocation: "0.15%",
      drawdown: "2.4%",
      status: "CAUTION",
    },
    chart: {
      symbol: "NAS100 (Nasdaq 100 Index)",
      price: "19 814.50",
      spread: "0.40 pt",
      timeframe: "M15",
      tradeType: "BUY",
      entryPrice: "19 820.00",
      slPrice: "19 750.00",
      tpPrice: "19 950.00",
      candles: [
        { time: "13:45", open: 19835.0, high: 19845.0, low: 19810.0, close: 19815.0, isUp: false },
        { time: "14:00", open: 19815.0, high: 19830.0, low: 19805.0, close: 19825.0, isUp: true },
        { time: "14:15", open: 19825.0, high: 19832.0, low: 19812.0, close: 19820.0, isUp: false },
        { time: "14:30", open: 19820.0, high: 19822.0, low: 19808.0, close: 19814.5, isUp: false },
      ],
    },
    version: "v1.9.0 MQL5 ECN",
    uptime: "99.95% (Equinix NY4)",
  },
];

const INITIAL_POSITIONS: PositionItem[] = [
  {
    id: "pos-1",
    ticket: "#892104",
    side: "BUY",
    strategy: "Trend Following",
    symbol: "EURUSD",
    volume: "0.50 lot",
    entry: "1.08450",
    currentPrice: "1.08584",
    sl: "1.08150",
    tp: "1.09100",
    pnlNum: 67.0,
    pnl: "+$67.00",
    openTime: "14:12:05",
    botId: "nexium-fx-trend",
  },
  {
    id: "pos-2",
    ticket: "#892119",
    side: "BUY",
    strategy: "Trend Pullback / Breakout",
    symbol: "XAUUSD",
    volume: "0.20 lot",
    entry: "2 384.20",
    currentPrice: "2 388.90",
    sl: "2 374.00",
    tp: "2 405.00",
    pnlNum: 126.4,
    pnl: "+$126.40",
    openTime: "14:28:40",
    botId: "nexium-ai-gold",
  },
  {
    id: "pos-3",
    ticket: "#892135",
    side: "BUY",
    strategy: "Mean Reversion",
    symbol: "NAS100",
    volume: "0.10 lot",
    entry: "19 820.00",
    currentPrice: "19 814.50",
    sl: "19 750.00",
    tp: "19 950.00",
    pnlNum: -22.6,
    pnl: "-$22.60",
    openTime: "14:35:10",
    botId: "nexium-index-reversion",
  },
];

const INITIAL_TRANSACTIONS: TransactionItem[] = [
  {
    id: "tx-1",
    date: "14 août 2026 · 14:02",
    type: "Dépôt validé",
    amount: "+$5,000.00",
    amountNum: 5000,
    currency: "USD",
    status: "Confirmé",
    method: "Virement Bancaire SEPA",
    color: "#00D084",
  },
  {
    id: "tx-2",
    date: "13 août 2026 · 18:45",
    type: "Gain trading MT5",
    amount: "+$342.80",
    amountNum: 342.8,
    currency: "USD",
    status: "Confirmé",
    method: "Robot MQL5",
    color: "#00D084",
  },
  {
    id: "tx-3",
    date: "11 août 2026 · 09:15",
    type: "Retrait traité",
    amount: "-$1,200.00",
    amountNum: -1200,
    currency: "USD",
    status: "Confirmé",
    method: "Virement SWIFT",
    color: "#f43f5e",
  },
];

const INITIAL_JOURNAL: JournalEntry[] = [
  {
    id: "j-1",
    time: "14:50:18",
    event: "MARKET_TICK",
    symbol: "XAUUSD",
    detail: "Cotation 2 388.90 reçue du flux Equinix NY4. Normalisation FIX réussie.",
    status: "INFO",
    statusVariant: "slate",
  },
  {
    id: "j-2",
    time: "14:48:16",
    event: "SETUP_VALID",
    symbol: "XAUUSD",
    detail: "Nexium AI Gold : signal BUY validé avec score IA 84/100. Passage au filtre Risk Manager.",
    status: "VALIDÉ",
    statusVariant: "emerald",
  },
  {
    id: "j-3",
    time: "14:48:15",
    event: "RISK_CHECK_PASSED",
    detail: "Vérification Risk Governor : exposition totale 0.80 lot (limite 3.00 lots). Risque conforme.",
    status: "VALIDÉ",
    statusVariant: "emerald",
  },
  {
    id: "j-4",
    time: "14:28:40",
    event: "ORDER_EXECUTED",
    symbol: "XAUUSD",
    detail: "Nexium AI Gold : ordre BUY 0.20 lot exécuté au cours 2 384.20 (Ticket #892119).",
    status: "EXÉCUTÉ",
    statusVariant: "sky",
  },
  {
    id: "j-5",
    time: "14:20:10",
    event: "SIGNAL_REJECTED",
    symbol: "EURUSD",
    detail: "Nexium FX Trend : signal SELL rejeté (Score 74/100 < seuil minimal 78/100).",
    status: "ALERTE",
    statusVariant: "amber",
  },
  {
    id: "j-6",
    time: "13:48:39",
    event: "POSITION_CLOSED_TP",
    symbol: "GBPUSD",
    detail: "Nexium FX Trend : position BUY clôturée sur Take-Profit à 1.28450 (+ $42.50).",
    status: "CLÔTURÉ",
    statusVariant: "purple",
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m-1",
    sender: "desk",
    senderName: "Nexium Desk Institutionnel",
    text: "Bonjour Ludovic. Vos 3 moteurs automatisés (AI Gold, FX Trend, Index Reversion) sont connectés et opérationnels sur le serveur Equinix NY4.",
    time: "14:30",
  },
];

export interface EmailItem {
  id: string;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  date: string;
  preview: string;
  body: string[];
  unread: boolean;
  priority: "NORMAL" | "URGENT" | "CRITIQUE";
  folder: "inbox" | "sent";
  hasAttachment?: boolean;
}

const INITIAL_EMAILS: EmailItem[] = [
  {
    id: "mail-1",
    from: "desk-quant@nexiummarkets.com",
    fromName: "Nexium Quant Research Desk",
    to: "ludovic.m@investisseur-nexium.com",
    subject: "Rapport d'arbitrage XAUUSD & Performance MQL5 — Session New York",
    date: "Aujourd'hui · 14:15",
    preview: "Veuillez trouver ci-joint l'analyse quantitative du signal BUY XAUUSD exécuté à 2 384.20...",
    body: [
      "Bonjour Ludovic,",
      "Le moteur Nexium AI Gold a identifié une opportunité de cassure de range sur l'or (XAUUSD) avec un score algorithmique de 84/100 lors de l'ouverture de New York.",
      "Le filtre du Risk Governor a validé un dimensionnement strict à 0.20 lot, avec un Stop-Loss positionné à 2 374.00 et un Take-Profit à 2 405.00.",
      "La position génère actuellement un P&L positif latent. Nos ingénieurs surveillent le carnet d'ordres L2 sur le flux Equinix NY4.",
      "Restant à votre entière disposition sur le Desk ou par appel direct.",
      "Bien cordialement,\nDr. Antoine R. — Head of Quantitative Trading",
    ],
    unread: true,
    priority: "URGENT",
    folder: "inbox",
    hasAttachment: true,
  },
  {
    id: "mail-2",
    from: "risk-governor@nexiummarkets.com",
    fromName: "Nexium Risk Governance Office",
    to: "ludovic.m@investisseur-nexium.com",
    subject: "Validation de conformité : Seuil de Drawdown Max (2.00%)",
    date: "Hier · 18:30",
    preview: "Votre compte MT5 #802194 respecte l'ensemble des règles de sécurité de capital institutionnel...",
    body: [
      "Cher Monsieur,",
      "Le système de surveillance automatisée a procédé à la revue quotidienne de vos 3 moteurs de trading.",
      "Le drawdown maximum enregistré sur les dernières 24h s'établit à 0.34%, très largement inférieur à votre limite de sécurité de 2.00%.",
      "Aucun coupe-circuit d'urgence n'a été requis. Vos allocations demeurent optimales.",
      "L'équipe Risk Governance",
    ],
    unread: false,
    priority: "NORMAL",
    folder: "inbox",
  },
];

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csvContent =
    "data:text/csv;charset=utf-8," +
    rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function StatusPill({
  children,
  variant = "emerald",
}: {
  children: ReactNode;
  variant?: "emerald" | "amber" | "sky" | "purple" | "slate" | "rose";
}) {
  const styles = {
    emerald: "border-[#00D084]/40 bg-[#00D084]/15 text-[#00D084] shadow-[0_0_12px_rgba(0,208,132,0.15)]",
    amber: "border-amber-500/40 bg-amber-500/15 text-amber-400",
    sky: "border-sky-500/40 bg-sky-500/15 text-sky-400",
    purple: "border-purple-500/40 bg-purple-500/15 text-purple-400",
    slate: "border-white/[0.12] bg-white/[0.05] text-gray-200",
    rose: "border-rose-500/40 bg-rose-500/15 text-rose-400",
  };

  const dotStyles = {
    emerald: "bg-[#00D084] shadow-[0_0_6px_#00D084]",
    amber: "bg-amber-400",
    sky: "bg-sky-400",
    purple: "bg-purple-400",
    slate: "bg-gray-300",
    rose: "bg-rose-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-xs font-bold tracking-wider uppercase transition-all ${styles[variant]}`}
    >
      <span className={`size-2 rounded-full ${dotStyles[variant]} animate-pulse`} />
      {children}
    </span>
  );
}

// ----------------------------------------------------
// TRADINGVIEW LIVE ENGINE CHART COMPONENT WITH ACTIVE PRESET SIMULATION
// ----------------------------------------------------
function TradingViewEngineChart({
  bot,
  onClosePosition,
  position,
}: {
  bot: EngineBot;
  onClosePosition?: (pos: PositionItem) => void;
  position?: PositionItem;
}) {
  const [activeTf, setActiveTf] = useState("M15");
  const [showIndicators, setShowIndicators] = useState(true);

  // Preset Selection
  const [activePreset, setActivePreset] = useState<
    "BREAKOUT_GOLD" | "TREND_FX" | "SMC_LIQUIDITY" | "MQL5_SCALPING"
  >("BREAKOUT_GOLD");

  // Simulation State (Start / Stop)
  const [isTradingActive, setIsTradingActive] = useState(true);
  const [scanStep, setScanStep] = useState<
    "SCANNING_L2" | "DETECTING_SETUP" | "VALIDATING_SCORE" | "ORDER_FILLED" | "MANAGING_TRADE" | "STOPPED"
  >("MANAGING_TRADE");
  const [scanLaserX, setScanLaserX] = useState(380);
  const [livePriceOffset, setLivePriceOffset] = useState(0);
  const [livePnlOffset, setLivePnlOffset] = useState(0);

  // Base price extraction
  const basePriceNum = parseFloat(bot.chart.price.replace(/\s/g, "")) || 2388.9;

  // Presets definition - Clean, concise & user friendly
  const PRESETS = [
    {
      id: "BREAKOUT_GOLD" as const,
      name: "Breakout M15 (Or)",
      tag: "OR SPOT",
      expectedScore: "88%",
      riskReward: "1:3.2",
    },
    {
      id: "TREND_FX" as const,
      name: "Tendance H1 (Forex)",
      tag: "EURUSD",
      expectedScore: "84%",
      riskReward: "1:2.8",
    },
    {
      id: "SMC_LIQUIDITY" as const,
      name: "Smart Money (SMC)",
      tag: "LIQUIDITÉ",
      expectedScore: "91%",
      riskReward: "1:4.0",
    },
    {
      id: "MQL5_SCALPING" as const,
      name: "Scalping FIX",
      tag: "RAPIDE",
      expectedScore: "82%",
      riskReward: "1:2.0",
    },
  ];

  const selectedPresetObj = PRESETS.find((p) => p.id === activePreset) ?? PRESETS[0];

  // Toggle Start / Stop
  const handleToggleTrading = () => {
    if (isTradingActive) {
      setIsTradingActive(false);
      setScanStep("STOPPED");
      toast.warning("Moteur et prises d'ordres mis en PAUSE.");
    } else {
      setIsTradingActive(true);
      setScanStep("SCANNING_L2");
      setScanLaserX(80);
      toast.success("Moteur et scan IA RÉACTIVÉS en direct !");
    }
  };

  // Trigger Live Scan Sequence upon preset switch
  const handleSelectPreset = (presetId: typeof activePreset) => {
    setActivePreset(presetId);
    setIsTradingActive(true);
    setScanStep("SCANNING_L2");
    setScanLaserX(60);
    toast.info(`Preset "${PRESETS.find((p) => p.id === presetId)?.name}" activé.`);

    setTimeout(() => {
      setScanStep("DETECTING_SETUP");
      setScanLaserX(280);
    }, 1000);

    setTimeout(() => {
      setScanStep("VALIDATING_SCORE");
      setScanLaserX(520);
    }, 2000);

    setTimeout(() => {
      setScanStep("ORDER_FILLED");
      setScanLaserX(660);
    }, 3200);

    setTimeout(() => {
      setScanStep("MANAGING_TRADE");
    }, 4500);
  };

  // Live Continuous Ticking Simulation
  useEffect(() => {
    if (!isTradingActive) return;

    const interval = setInterval(() => {
      setLivePriceOffset((prev) => {
        const delta = (Math.random() - 0.45) * 0.35;
        return parseFloat((prev + delta).toFixed(2));
      });
      setLivePnlOffset((prev) => {
        const delta = (Math.random() - 0.42) * 1.8;
        return parseFloat((prev + delta).toFixed(2));
      });
      if (scanStep === "SCANNING_L2" || scanStep === "DETECTING_SETUP") {
        setScanLaserX((prev) => (prev > 640 ? 60 : prev + 25));
      }
    }, 900);
    return () => clearInterval(interval);
  }, [isTradingActive, scanStep]);

  const currentPriceFormatted = (basePriceNum + livePriceOffset).toFixed(2);
  const currentPnlFormatted = (126.4 + livePnlOffset).toFixed(2);

  // Accent styles according to bot
  const accentTheme = {
    gold: {
      glow: "border-amber-500/40 shadow-[0_0_35px_rgba(245,158,11,0.12)]",
      badge: "border-amber-500/50 bg-amber-500/20 text-amber-300",
      line: "#f59e0b",
      bar: "bg-amber-400",
    },
    cyan: {
      glow: "border-sky-500/40 shadow-[0_0_35px_rgba(56,189,248,0.12)]",
      badge: "border-sky-500/50 bg-sky-500/20 text-sky-300",
      line: "#38bdf8",
      bar: "bg-sky-400",
    },
    purple: {
      glow: "border-purple-500/40 shadow-[0_0_35px_rgba(168,85,247,0.12)]",
      badge: "border-purple-500/50 bg-purple-500/20 text-purple-300",
      line: "#c084fc",
      bar: "bg-purple-400",
    },
  }[bot.theme];

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border bg-[#0d1117] p-5 sm:p-6 transition-all duration-500 ${accentTheme.glow}`}
    >
      {/* 1. BARRE DE PRESETS & BOUTON D'ARRÊT D'URGENCE / ACTIVATION */}
      <div className="border-b border-white/[0.08] pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className={`size-2.5 rounded-full ${isTradingActive ? "bg-[#00D084] animate-ping" : "bg-rose-500"}`} />
            <h3 className="text-base sm:text-lg font-black text-white">
              Stratégie &amp; Presets IA
            </h3>
            <span className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] font-bold text-gray-300">
              {bot.chart.symbol}
            </span>
          </div>

          {/* BOUTON GLOBAL : ACTIVER / STOPPER */}
          <button
            onClick={handleToggleTrading}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md ${
              isTradingActive
                ? "border border-rose-500/50 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                : "neon-btn text-black shadow-[0_0_15px_rgba(0,208,132,0.3)]"
            }`}
          >
            {isTradingActive ? (
              <>
                <Pause className="size-3.5 fill-current" />
                STOPPER LE TRADING
              </>
            ) : (
              <>
                <Play className="size-3.5 fill-current" />
                ACTIVER LE TRADING
              </>
            )}
          </button>
        </div>

        {/* 4 Boutons de Presets Épurés */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5">
          {PRESETS.map((preset) => {
            const isPresetActive = activePreset === preset.id && isTradingActive;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                  isPresetActive
                    ? "border-[#00D084] bg-[#00D084]/15 text-white shadow-[0_0_15px_rgba(0,208,132,0.15)] ring-1 ring-[#00D084]"
                    : "border-white/[0.08] bg-[#0c1017] text-gray-300 hover:border-white/[0.2] hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs truncate">{preset.name}</span>
                  {isPresetActive && (
                    <span className="size-1.5 rounded-full bg-[#00D084] animate-ping" />
                  )}
                </div>
                <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-gray-400">
                  <span>R:R {preset.riskReward}</span>
                  <span className="text-[#00D084] font-bold">{preset.expectedScore}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Top Header of the TradingView Workspace */}
      <div className="flex items-center justify-between border-b border-white/[0.06] py-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm sm:text-base font-black text-white">{bot.chart.symbol}</span>
          <span className="font-mono text-xs text-gray-400">Spread FIX : <strong className="text-white">{bot.chart.spread}</strong></span>
        </div>

        {/* Timeframe Bar */}
        <div className="flex items-center rounded-lg border border-white/[0.08] bg-[#080b0f] p-0.5 font-mono text-[11px]">
          {(["M1", "M5", "M15", "H1", "H4"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setActiveTf(tf)}
              className={`rounded px-2.5 py-1 font-bold transition cursor-pointer ${
                activeTf === tf ? "bg-[#00D084] text-black font-black" : "text-gray-400 hover:text-white"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* 3. TradingView Chart Area */}
      <div className="relative mt-3 h-[300px] sm:h-[340px] w-full rounded-2xl border border-white/[0.08] bg-[#07090d] p-4 flex flex-col justify-between overflow-hidden">
        {/* Background Grid Lines */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_30px]" />

        {/* AI Scanner Notification Banner Overlay */}
        <div className="relative z-20 flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0c1017]/85 px-3 py-2 text-xs font-mono backdrop-blur-md">
          <div className="flex items-center gap-2 truncate">
            <span className={`size-2 rounded-full ${isTradingActive ? "bg-[#00D084] animate-ping" : "bg-rose-500"}`} />
            <span className="text-gray-300 font-sans hidden sm:inline">IA :</span>
            <span className="font-bold text-white truncate">
              {!isTradingActive && "⏸ TRADING EN PAUSE (Surveillance inactive)"}
              {isTradingActive && scanStep === "SCANNING_L2" && "🔍 Scan du carnet d'ordres L2..."}
              {isTradingActive && scanStep === "DETECTING_SETUP" && "🎯 Détection de liquidité & cassure..."}
              {isTradingActive && scanStep === "VALIDATING_SCORE" && "⚡ Score validé (88%) · Risque OK"}
              {isTradingActive && scanStep === "ORDER_FILLED" && "✅ Ordre BUY exécuté (@ marché)"}
              {isTradingActive && scanStep === "MANAGING_TRADE" && "📊 Position active · TP dynamique"}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono shrink-0 ml-2">
            <span className="text-gray-400">Cours :</span>
            <strong className="text-white text-sm font-black">${currentPriceFormatted}</strong>
          </div>
        </div>

        {/* Candlesticks & Technical Signals SVG */}
        <div className="relative z-10 my-auto h-44 w-full">
          <svg viewBox="0 0 700 160" className="h-full w-full overflow-visible" preserveAspectRatio="none">
            {/* Moving Average Line */}
            {showIndicators && (
              <>
                <path
                  d="M 20,130 C 120,125 220,110 350,85 C 480,60 580,48 680,38"
                  fill="none"
                  stroke={accentTheme.line}
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  className="opacity-70"
                />
                <path
                  d="M 20,145 C 120,140 220,128 350,105 C 480,85 580,70 680,55"
                  fill="none"
                  stroke="#00D084"
                  strokeWidth="1.5"
                  className="opacity-50"
                />
              </>
            )}

            {/* AI LASER SCANNER LINE */}
            {isTradingActive && (
              <g>
                <line
                  x1={scanLaserX}
                  y1="5"
                  x2={scanLaserX}
                  y2="155"
                  stroke="#00D084"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />
                <circle cx={scanLaserX} cy="80" r="4" fill="#00D084" className="animate-ping" />
              </g>
            )}

            {/* Simulated Live Order Lines: TP & Entry & SL */}
            {bot.chart.tradeType !== "NONE" && isTradingActive && (
              <>
                {/* Take Profit Line */}
                <line x1="10" y1="25" x2="690" y2="25" stroke="#00D084" strokeWidth="1.5" strokeDasharray="5 3" />
                <text x="15" y="20" fill="#00D084" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  TP : {bot.chart.tpPrice} (+ $210.00)
                </text>

                {/* Entry Price Line */}
                <line x1="10" y1="75" x2="690" y2="75" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="15" y="70" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  ENTRÉE : {bot.chart.entryPrice}
                </text>

                {/* Stop Loss Line */}
                <line x1="10" y1="135" x2="690" y2="135" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="5 3" />
                <text x="15" y="130" fill="#f43f5e" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  SL : {bot.chart.slPrice} (- $75.00)
                </text>
              </>
            )}

            {/* Candlesticks Rendering */}
            {[
              { x: 60, highY: 110, lowY: 155, openY: 145, closeY: 120, up: true },
              { x: 120, highY: 100, lowY: 140, openY: 120, closeY: 130, up: false },
              { x: 180, highY: 95, lowY: 135, openY: 130, closeY: 105, up: true },
              { x: 240, highY: 80, lowY: 125, openY: 105, closeY: 90, up: true },
              { x: 300, highY: 75, lowY: 115, openY: 90, closeY: 100, up: false },
              { x: 360, highY: 65, lowY: 105, openY: 100, closeY: 75, up: true },
              { x: 420, highY: 55, lowY: 95, openY: 75, closeY: 60, up: true },
              { x: 480, highY: 45, lowY: 85, openY: 60, closeY: 50, up: true },
              { x: 540, highY: 40, lowY: 75, openY: 50, closeY: 55, up: false },
              { x: 600, highY: 30, lowY: 65, openY: 55, closeY: 38, up: true },
              { x: 660, highY: 18, lowY: 50, openY: 38, closeY: Math.max(22, 28 - livePriceOffset * 3), up: true },
            ].map((c, i) => (
              <g key={i}>
                <line
                  x1={c.x}
                  y1={c.highY}
                  x2={c.x}
                  y2={c.lowY}
                  stroke={c.up ? "#00D084" : "#f43f5e"}
                  strokeWidth="2"
                />
                <rect
                  x={c.x - 7}
                  y={Math.min(c.openY, c.closeY)}
                  width="14"
                  height={Math.max(Math.abs(c.closeY - c.openY), 5)}
                  fill={c.up ? "#00D084" : "#f43f5e"}
                  rx="1"
                  className={i === 10 && isTradingActive ? "animate-pulse" : ""}
                />
              </g>
            ))}
          </svg>
        </div>

        {/* 4. Bottom Bar: Real-time Live P&L and Execution Data */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/[0.06] pt-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Preset :</span>
            <span className="font-bold text-white">{selectedPresetObj.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="font-mono">
              <span className="text-gray-400">P&amp;L : </span>
              <strong className="text-sm font-black text-[#00D084]">
                +${currentPnlFormatted}
              </strong>
            </div>
            {position && onClosePosition && (
              <button
                onClick={() => onClosePosition(position)}
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
              >
                Clôturer Ticket {position.ticket}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 1. WEB AUDIO SYNTHESIZER & AUTO-TRADER WIDGETS
// ----------------------------------------------------
let sharedAudioCtx: AudioContext | null = null;

function initAudio() {
  if (sharedAudioCtx) return;
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const activeCtx = new Ctx() as AudioContext;
    sharedAudioCtx = activeCtx;
    const buffer = activeCtx.createBuffer(1, 1, 22050);
    const node = activeCtx.createBufferSource();
    node.buffer = buffer;
    node.connect(activeCtx.destination);
    node.start(0);
  } catch (e) {
    console.error("Audio initialization failed:", e);
  }
}

function playWinSound() {
  try {
    initAudio();
    const ctx = sharedAudioCtx;
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const notes = [
      { freq: 523.25, delay: 0, dur: 0.4 },
      { freq: 659.25, delay: 0.08, dur: 0.4 },
      { freq: 783.99, delay: 0.16, dur: 0.4 },
      { freq: 1046.50, delay: 0.24, dur: 0.6 },
    ];
    notes.forEach(({ freq, delay, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t);
      osc.stop(t + dur + 0.1);
    });
  } catch {}
}

function playLossSound() {
  try {
    initAudio();
    const ctx = sharedAudioCtx;
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const notes = [
      { freq: 392.00, delay: 0, dur: 0.3 },
      { freq: 329.63, delay: 0.1, dur: 0.3 },
      { freq: 261.63, delay: 0.2, dur: 0.5 },
    ];
    notes.forEach(({ freq, delay, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t);
      osc.stop(t + dur + 0.1);
    });
  } catch {}
}

function playOpenSound() {
  try {
    initAudio();
    const ctx = sharedAudioCtx;
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const notes = [
      { freq: 880.00, delay: 0, dur: 0.15 },
      { freq: 1318.51, delay: 0.05, dur: 0.25 }
    ];
    notes.forEach(({ freq, delay, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t);
      osc.stop(t + dur + 0.1);
    });
  } catch {}
}

// ── Mini Sparkline Price Chart ──
function SparklinePrice({ price }: { price: number }) {
  const [points, setPoints] = useState<number[]>([
    50, 52, 49, 53, 55, 54, 56, 58, 57, 59, 61, 60, 62, 64, 63, 65,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPoints((prev) => {
        const next = [...prev.slice(1)];
        const last = prev[prev.length - 1] ?? 55;
        next.push(Math.max(40, last + (Math.random() - 0.45) * 3));
        return next;
      });
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 100;
  const height = 40;
  const step = width / (points.length - 1);

  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * height;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const areaPath = `${path} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-14" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-auto-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00D084" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#00D084" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#spark-auto-grad)" />
      <path d={path} fill="none" stroke="#00D084" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Mini Cumulative Equity Curve Chart ──
function EquityCurveMini() {
  const [points, setPoints] = useState<number[]>([
    0, 5, 8, 3, 12, 18, 15, 22, 28, 25, 32, 38, 35, 42,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPoints((prev) => {
        const next = [...prev.slice(1)];
        const last = prev[prev.length - 1] ?? 25;
        next.push(Math.max(-5, last + (Math.random() - 0.3) * 4));
        return next;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const min = Math.min(0, ...points);
  const max = Math.max(...points, 1);
  const range = max - min || 1;
  const width = 100;
  const height = 40;
  const step = width / (points.length - 1);

  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * height;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const areaPath = `${path} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-14" preserveAspectRatio="none">
      <defs>
        <linearGradient id="equity-auto-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#equity-auto-grad)" />
      <path d={path} fill="none" stroke="#38bdf8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Countdown Timer Circular Gauge ──
function CountdownTimerGauge({ isRunning }: { isRunning: boolean }) {
  const [seconds, setSeconds] = useState(42);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSeconds((s) => (s <= 0 ? 60 : s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const pct = ((60 - seconds) / 60) * 100;

  return (
    <div className="flex flex-col items-center gap-1.5 py-1">
      <div className="relative size-16">
        <svg className="size-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 32}
            strokeDashoffset={2 * Math.PI * 32 - (pct / 100) * 2 * Math.PI * 32}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-sm font-black text-white">{seconds}s</span>
        </div>
      </div>
      <span className="text-[10px] text-gray-400 font-mono">
        {isRunning ? "Cycle tick M1" : "Moteur en pause"}
      </span>
    </div>
  );
}

// ── Circular Confidence Gauge ──
function ConfidenceCircularGauge({ value }: { value: number }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? "#00D084" : value >= 60 ? "#f59e0b" : "#f43f5e";

  return (
    <div className="relative size-24 shrink-0">
      <svg className="size-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.3s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-white font-mono">{value.toFixed(0)}%</span>
        <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Score IA</span>
      </div>
    </div>
  );
}

// ── Fear & Greed Sentiment Thermometer ──
function SentimentFearGreedBar({ trend, score }: { trend: string; score: number }) {
  const label = score >= 75 ? "Avidité Extrême" : score >= 55 ? "Optimisme Achat" : score >= 45 ? "Neutre" : score >= 25 ? "Prudence" : "Peur Extrême";

  return (
    <div className="space-y-1.5 py-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-rose-400 font-bold text-[11px]">Peur</span>
        <span className="font-bold text-white text-[11px]">{label}</span>
        <span className="text-[#00D084] font-bold text-[11px]">Avidité</span>
      </div>
      <div className="relative h-2.5 rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-[#00D084] overflow-hidden">
        <div
          className="absolute top-0 bottom-0 w-1.5 bg-white rounded-full shadow-[0_0_8px_#ffffff] transition-all duration-700"
          style={{ left: `calc(${score}% - 3px)` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
        <span>0</span>
        <span className="font-bold text-white">{score}/100</span>
        <span>100</span>
      </div>
    </div>
  );
}

// ── Latency Deriv / NY4 Meter ──
function LatencyDerivMeter({ connected }: { connected: boolean }) {
  const [ping, setPing] = useState(14);

  useEffect(() => {
    if (!connected) return;
    const interval = setInterval(() => {
      setPing(Math.round(10 + Math.random() * 12));
    }, 2000);
    return () => clearInterval(interval);
  }, [connected]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">Latence Cross-Connect</span>
        <span className="font-mono font-black text-[#00D084]">{connected ? `${ping} ms` : "Hors ligne"}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
        <div className="h-full rounded-full bg-[#00D084] transition-all duration-500" style={{ width: `${Math.min(100, ping * 4)}%` }} />
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 1. PAGE MOTEUR (AUTO-TRADER & AI TRADING CONTROL)
// ----------------------------------------------------
function EngineTab({
  bots,
  positions,
  onOpenBotDetail,
  onToggleBotPause,
  onClosePosition,
}: {
  bots: EngineBot[];
  positions: PositionItem[];
  onOpenBotDetail: (bot: EngineBot) => void;
  onToggleBotPause: (botId: EngineBot["id"]) => void;
  onClosePosition: (pos: PositionItem) => void;
}) {
  const [selectedBotId, setSelectedBotId] = useState<EngineBot["id"]>("nexium-ai-gold");
  const [viewMode, setViewMode] = useState<"solo" | "triptyque">("solo");
  const [tradingMode, setTradingMode] = useState<"simulation" | "demo" | "live">("demo");
  const [isEngineRunning, setIsEngineRunning] = useState(true);
  const [forcingTrade, setForcingTrade] = useState(false);
  const [logFilter, setLogFilter] = useState<"all" | "won" | "lost" | "open" | "error">("all");

  // 2 moteurs principaux
  const activeBots = useMemo(() => bots.slice(0, 2), [bots]);
  const selectedBot = activeBots.find((b) => b.id === selectedBotId) ?? activeBots[0];
  const matchingPos = positions.find((p) => p.botId === selectedBot.id);

  // Toggle Engine Power
  const toggleEnginePower = () => {
    if (isEngineRunning) {
      setIsEngineRunning(false);
      toast.info("Auto-trader mis en pause — Sécurité active.");
    } else {
      setIsEngineRunning(true);
      playOpenSound();
      toast.success("Auto-trader démarré avec succès sur flux NY4 !");
    }
  };

  // Test trade simulateur
  const handleTestTrade = () => {
    setForcingTrade(true);
    playOpenSound();
    toast.info(`Trade de test forcé lancé sur ${selectedBot.primarySymbol}...`);

    setTimeout(() => {
      setForcingTrade(false);
      const isWin = Math.random() > 0.35;
      if (isWin) {
        playWinSound();
        toast.success(`🎉 Trade test ${selectedBot.primarySymbol} : Gagné +$85.40 (Score IA 89/100)`);
      } else {
        playLossSound();
        toast.error(`Trade test ${selectedBot.primarySymbol} : Clôturé -$22.10 (Stop Loss strict respecté)`);
      }
    }, 2000);
  };

  // 5 Pipeline Stages
  const pipelineStages = useMemo(() => [
    {
      label: "Marché",
      icon: Radar,
      status: "Tick FIX NY4",
      ok: true,
      activeStyle: "bg-sky-500/10 border-sky-500/30 text-sky-300",
    },
    {
      label: "Analyse",
      icon: Brain,
      status: "3/3 Multi-TF",
      ok: isEngineRunning,
      activeStyle: "bg-purple-500/10 border-purple-500/30 text-purple-300",
    },
    {
      label: "Risque",
      icon: Shield,
      status: "Gouvernance OK",
      ok: true,
      activeStyle: "bg-[#00D084]/10 border-[#00D084]/30 text-[#00D084]",
    },
    {
      label: "Décision",
      icon: Cpu,
      status: `${selectedBot.lastDecision.action} (${selectedBot.lastScore})`,
      ok: isEngineRunning,
      activeStyle: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    },
    {
      label: "Exécution",
      icon: Zap,
      status: isEngineRunning ? "Prêt / En ligne" : "En pause",
      ok: isEngineRunning,
      activeStyle: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
    },
  ], [isEngineRunning, selectedBot]);

  // Mock Engine Logs
  const engineLogs = [
    { time: "18:54:10", level: "SUCCESS", msg: `Signal BUY qualifié sur ${selectedBot.primarySymbol} — Score IA : 84/100. Ordre transmis.` },
    { time: "18:52:45", level: "INFO", msg: "Balayage L2 Order Flow : Liquidité détectée à 2,384.50. Convergence 3 timeframes." },
    { time: "18:50:02", level: "WON", msg: "Position XAU/USD clôturée avec succès à Take Profit : +$126.40." },
    { time: "18:48:15", level: "OPEN", msg: "Ouverture position ACHAT sur EUR/USD (Lot 0.40) à 1.08584." },
    { time: "18:45:00", level: "INFO", msg: "Heartbeat serveur NY4 OK (Latence 11ms). Intégrité paquets FIX 100%." },
    { time: "18:41:20", level: "LOST", msg: "Clôture anticipée GBP/USD par Trailing Stop de sécurité : -$14.20." },
  ];

  const filteredLogs = engineLogs.filter((l) => {
    if (logFilter === "all") return true;
    if (logFilter === "won") return l.level === "WON" || l.level === "SUCCESS";
    if (logFilter === "lost") return l.level === "LOST";
    if (logFilter === "open") return l.level === "OPEN";
    if (logFilter === "error") return l.level === "ERROR";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── 1. HERO HEADER AVEC GLOW AMBIANT & ACTIONS RAPIDES ── */}
      <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#10141b]/90 p-5 sm:p-6 shadow-xl">
        <div
          className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #00D084 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="grid size-12 place-items-center rounded-xl border border-[#00D084]/40 bg-[#00D084]/15 text-[#00D084] shadow-[0_0_20px_rgba(0,208,132,0.2)]">
              <Cpu className="size-6 text-[#00D084]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Centre de Contrôle &amp; Auto-Trader IA
                </h2>
                <span className="rounded-full border border-[#00D084]/40 bg-[#00D084]/15 px-2.5 py-0.5 text-[11px] font-mono font-bold text-[#00D084]">
                  {activeBots.length} MOTEURS
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Algorithmes multi-indicateurs · 4 Timeframes · Exécution FIX chiffrée Equinix NY4
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => toast.success("Mode Prudent activé : Drawdown bridé à 1.5% max.")}
              className="flex items-center gap-1.5 rounded-xl border border-[#00D084]/40 bg-[#00D084]/10 hover:bg-[#00D084]/20 px-3.5 py-2 text-xs font-bold text-[#00D084] transition cursor-pointer"
            >
              <ShieldCheck className="size-4" /> Mode Prudent
            </button>

            <button
              onClick={handleTestTrade}
              disabled={forcingTrade}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#141a23] hover:bg-[#1a2330] px-3.5 py-2 text-xs font-bold text-white transition cursor-pointer shadow-sm"
            >
              <Activity className="size-4 text-sky-400" />
              {forcingTrade ? "Exécution test..." : "Trade de test"}
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. COCKPIT PRINCIPAL : SÉLECTEUR DE MODE + POWER BUTTON GÉANT + CARTES BOTS ── */}
      <section className="grid gap-4 lg:grid-cols-[300px_1fr_1fr_260px]">
        {/* 2.1 PANNEAU DE CONTRÔLE POWER & MODE (Gauche) */}
        <article className="rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 flex flex-col justify-between shadow-md">
          <div>
            {/* Sélecteur de mode 3-en-1 */}
            <div className="grid grid-cols-3 rounded-xl border border-white/[0.06] bg-[#080b0f] p-1">
              {(["simulation", "demo", "live"] as const).map((m) => {
                const isSelected = tradingMode === m;
                return (
                  <button
                    key={m}
                    onClick={() => {
                      if (m === "live") {
                        if (!confirm("Activer le mode LIVE avec capital réel ?")) return;
                      }
                      setTradingMode(m);
                      toast.info(`Mode d'exécution : ${m.toUpperCase()}`);
                    }}
                    className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-center transition-all cursor-pointer ${
                      isSelected
                        ? m === "live"
                          ? "bg-rose-500/25 text-rose-300 font-black border border-rose-500/40 shadow-sm"
                          : m === "demo"
                          ? "bg-[#00D084]/20 text-[#00D084] font-black border border-[#00D084]/40 shadow-sm"
                          : "bg-white/[0.1] text-white font-bold"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <span className="text-sm">{m === "simulation" ? "🧪" : m === "demo" ? "🎮" : "⚡"}</span>
                    <span className="text-[10px] font-bold uppercase">{m}</span>
                  </button>
                );
              })}
            </div>

            {/* Power Button Géant avec Ripple */}
            <div className="my-4 flex flex-col items-center gap-3">
              <div className="relative size-24">
                {isEngineRunning && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-[#00D084] opacity-25" />
                )}
                <button
                  onClick={toggleEnginePower}
                  className={`relative grid size-full place-items-center rounded-full border transition-all duration-300 cursor-pointer ${
                    isEngineRunning
                      ? "border-[#00D084]/60 bg-[#00D084]/15 text-[#00D084] shadow-[0_0_35px_rgba(0,208,132,0.35)]"
                      : "border-white/[0.1] bg-[#141a23] text-gray-400 hover:text-white"
                  }`}
                  title={isEngineRunning ? "Arrêter l'Auto-Trader" : "Démarrer l'Auto-Trader"}
                >
                  <Power className="size-10 transition-transform duration-200 hover:scale-110" />
                </button>
              </div>

              <div className="text-center">
                <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-black ${isEngineRunning ? "text-[#00D084]" : "text-gray-400"}`}>
                  <span className={`size-2 rounded-full ${isEngineRunning ? "bg-[#00D084] animate-pulse shadow-[0_0_6px_#00D084]" : "bg-gray-500"}`} />
                  {isEngineRunning ? "MOTEUR ACTIF" : "EN PAUSE"}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-2.5">
            <LatencyDerivMeter connected={true} />
          </div>
        </article>

        {/* 2.2 CARTE BOT 1 (GOLD) */}
        {activeBots[0] && (() => {
          const bot = activeBots[0];
          const isSelected = bot.id === selectedBotId;
          return (
            <article
              onClick={() => setSelectedBotId(bot.id)}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4.5 transition-all duration-300 flex flex-col justify-between bg-[#0b0e14] bg-[radial-gradient(ellipse_120%_80%_at_0%_0%,rgba(245,158,11,0.18),rgba(11,14,20,0.98))] ${
                isSelected
                  ? "border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/60"
                  : "border-amber-500/25 hover:border-amber-500/40"
              }`}
            >
              {isSelected && (
                <div className="absolute left-0 top-0 h-1 w-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
              )}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-amber-300">
                      {bot.primarySymbol}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white mt-1">{bot.name}</h3>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#00D084]/40 bg-[#00D084]/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#00D084] shrink-0">
                    <span className="size-1.5 rounded-full bg-[#00D084] animate-ping" />
                    ACTIF
                  </div>
                </div>

                <div className="mt-3.5 flex items-end justify-between border-y border-white/[0.06] py-2 font-mono">
                  <div>
                    <span className="text-[10px] text-gray-400 font-sans uppercase font-bold">P&amp;L JOUR</span>
                    <p className={`text-lg font-black mt-0.5 ${bot.pnlTodayNum >= 0 ? "text-[#00D084]" : "text-rose-400"}`}>
                      {bot.pnlToday}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs">
                      <span className="text-gray-400 text-[10px] uppercase font-sans mr-1">Score</span>
                      <strong className="text-white">{bot.lastScore}</strong>
                    </div>
                    <div className="mt-1 h-1 w-16 rounded-full bg-white/[0.08] overflow-hidden ml-auto">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${bot.lastScoreNum}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBotId(bot.id);
                  }}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                    isSelected
                      ? "neon-btn text-black shadow-[0_0_12px_rgba(0,208,132,0.25)]"
                      : "border border-white/[0.1] bg-[#141a23] hover:bg-[#1a2330] text-gray-200"
                  }`}
                >
                  {isSelected ? "● Connecté" : "Afficher →"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenBotDetail(bot);
                  }}
                  className="rounded-lg border border-white/[0.08] bg-black/40 hover:bg-black/60 px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer"
                >
                  Détails
                </button>
              </div>
            </article>
          );
        })()}

        {/* 2.3 CARTE BOT 2 (FOREX) */}
        {activeBots[1] && (() => {
          const bot = activeBots[1];
          const isSelected = bot.id === selectedBotId;
          return (
            <article
              onClick={() => setSelectedBotId(bot.id)}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4.5 transition-all duration-300 flex flex-col justify-between bg-[#0b0e14] bg-[radial-gradient(ellipse_120%_80%_at_0%_0%,rgba(56,189,248,0.18),rgba(11,14,20,0.98))] ${
                isSelected
                  ? "border-sky-400/80 shadow-[0_0_25px_rgba(56,189,248,0.2)] ring-1 ring-sky-400/60"
                  : "border-sky-500/25 hover:border-sky-500/40"
              }`}
            >
              {isSelected && (
                <div className="absolute left-0 top-0 h-1 w-full bg-sky-400 shadow-[0_0_10px_#38bdf8]" />
              )}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center rounded border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-sky-300">
                      {bot.primarySymbol}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white mt-1">{bot.name}</h3>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#00D084]/40 bg-[#00D084]/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#00D084] shrink-0">
                    <span className="size-1.5 rounded-full bg-[#00D084] animate-ping" />
                    ACTIF
                  </div>
                </div>

                <div className="mt-3.5 flex items-end justify-between border-y border-white/[0.06] py-2 font-mono">
                  <div>
                    <span className="text-[10px] text-gray-400 font-sans uppercase font-bold">P&amp;L JOUR</span>
                    <p className={`text-lg font-black mt-0.5 ${bot.pnlTodayNum >= 0 ? "text-[#00D084]" : "text-rose-400"}`}>
                      {bot.pnlToday}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs">
                      <span className="text-gray-400 text-[10px] uppercase font-sans mr-1">Score</span>
                      <strong className="text-white">{bot.lastScore}</strong>
                    </div>
                    <div className="mt-1 h-1 w-16 rounded-full bg-white/[0.08] overflow-hidden ml-auto">
                      <div className="h-full rounded-full bg-sky-400" style={{ width: `${bot.lastScoreNum}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBotId(bot.id);
                  }}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                    isSelected
                      ? "neon-btn text-black shadow-[0_0_12px_rgba(0,208,132,0.25)]"
                      : "border border-white/[0.1] bg-[#141a23] hover:bg-[#1a2330] text-gray-200"
                  }`}
                >
                  {isSelected ? "● Connecté" : "Afficher →"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenBotDetail(bot);
                  }}
                  className="rounded-lg border border-white/[0.08] bg-black/40 hover:bg-black/60 px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer"
                >
                  Détails
                </button>
              </div>
            </article>
          );
        })()}

        {/* 2.4 CARTE INTERRUPTEURS ON/OFF */}
        <article className="rounded-2xl border border-[#00D084]/25 bg-[#0c0f15] bg-[radial-gradient(ellipse_90%_90%_at_50%_-20%,rgba(0,208,132,0.12),rgba(12,15,21,0.95))] p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
                INTERRUPTEURS
              </span>
              <span className="size-2 rounded-full bg-[#00D084] animate-pulse" />
            </div>

            <div className="mt-2.5 space-y-2">
              {bots.map((b) => {
                const isBotActive = b.statusBadge === "ACTIF";
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-[#121620]/80 px-2.5 py-1.5"
                  >
                    <div className="truncate max-w-[120px]">
                      <p className="font-bold text-xs text-white truncate">{b.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{b.primarySymbol}</p>
                    </div>

                    <button
                      onClick={() => onToggleBotPause(b.id)}
                      className={`relative inline-flex h-4.5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                        isBotActive ? "bg-[#00D084]" : "bg-gray-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-3.5 transform rounded-full bg-black shadow ring-0 transition duration-200 ${
                          isBotActive ? "translate-x-4.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-gray-400">
            <span>Algorithmes</span>
            <span className="text-[#00D084] font-bold">2/3 Connectés</span>
          </div>
        </article>
      </section>

      {/* ── 3. PIPELINE D'ANALYSE & EXÉCUTION EN 5 ÉTAPES ── */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-4 space-y-2.5 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            PIPELINE D'ANALYSE &amp; EXÉCUTION MULTI-ÉTAPES (MQL5 + FIX)
          </span>
          <span className="text-[11px] font-mono text-[#00D084] font-bold">
            Moteur : {selectedBot.name}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {pipelineStages.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className={`rounded-xl border p-3 flex flex-col justify-between gap-2 transition-all shadow-sm ${
                  p.ok ? p.activeStyle : "bg-white/[0.02] border-white/[0.06] text-gray-500 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-90">{p.label}</span>
                  <Icon className="size-4" />
                </div>
                <div className="text-xs font-black truncate font-mono">{p.status}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 4. LIGNE HAUTE PRÉCISION : SPARKLINE PRIX + EQUITY CURVE + COMPTE À REBOURS ── */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* 4.1 Sparkline Prix */}
        <article className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-4 space-y-2 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-[#00D084]" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Prix Direct {selectedBot.primarySymbol}</span>
            </div>
            <span className="text-xs font-mono font-black text-white">
              {selectedBot.id === "nexium-ai-gold" ? "2,388.90" : "1.08584"}
            </span>
          </div>
          <SparklinePrice price={2388} />
          <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
            <span>30s</span>
            <span className="flex items-center gap-1 text-[#00D084] font-bold">
              <TrendingUp className="size-3" /> +0.48% (Momentum)
            </span>
            <span>Tick actuel</span>
          </div>
        </article>

        {/* 4.2 Courbe d'Équité */}
        <article className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-4 space-y-2 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-sky-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Courbe d'Équité Session</span>
            </div>
            <span className="text-xs font-mono font-black text-[#00D084]">+384.50 $</span>
          </div>
          <EquityCurveMini />
          <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
            <span>Début session</span>
            <span className="font-bold text-[#00D084]">+3.8% Profit</span>
            <span>En direct</span>
          </div>
        </article>

        {/* 4.3 Compte à Rebours */}
        <article className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-4 space-y-2 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="size-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Prochaine Analyse IA</span>
            </div>
          </div>
          <CountdownTimerGauge isRunning={isEngineRunning} />
        </article>
      </section>

      {/* ── 5. COCKPIT DUAL : ANALYSE TECHNIQUE (AVEC SENTIMENT) & DÉCISION IA (AVEC JAUGE) ── */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* 5.1 Carte Analyse Technique */}
        <article className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 space-y-3.5 shadow-md">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <div className="flex items-center gap-2">
              <Brain className="size-4.5 text-[#00D084]" />
              <h3 className="text-sm font-bold text-white">Analyse Technique Algorithmique</h3>
            </div>
            <span className="text-xs font-mono font-bold text-amber-300">{selectedBot.primarySymbol} · {selectedBot.timeframe}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/[0.06] bg-[#0c1017] p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Régime de Marché</span>
              <p className="text-sm font-black text-white mt-1 font-mono">{selectedBot.marketRegime}</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#0c1017] p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Timeframes Alignés</span>
              <p className="text-sm font-black text-[#00D084] mt-1 font-mono">3 / 3 (M1 · M5 · H1)</p>
            </div>
          </div>

          {/* Sentiment Bar */}
          <div className="border-t border-white/[0.06] pt-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sentiment Marché IA</span>
            <SentimentFearGreedBar trend="BULLISH" score={selectedBot.lastScoreNum} />
          </div>
        </article>

        {/* 5.2 Carte Décision IA */}
        <article className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 space-y-3.5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <div className="flex items-center gap-2">
                <Crosshair className="size-4.5 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Dernière Décision IA</h3>
              </div>
              <span className="rounded-full border border-[#00D084]/40 bg-[#00D084]/15 px-3 py-0.5 text-xs font-mono font-black text-[#00D084]">
                {selectedBot.lastDecision.action}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-4">
              <ConfidenceCircularGauge value={selectedBot.lastScoreNum} />
              <div className="flex-1 space-y-2 text-xs">
                <div className="rounded-xl border border-white/[0.06] bg-[#0c1017] p-3 leading-relaxed text-gray-300">
                  <span className="font-bold text-white">Justification du signal : </span>
                  {selectedBot.lastDecision.reason || "Convergence RSI survendu, cassure de moyenne mobile 50 et confirmation du carnet d'ordres NY4."}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-2.5 flex items-center justify-between text-[11px] font-mono text-gray-400">
            <span>Ordre FIX : <strong className="text-white">{selectedBot.lastDecision.result}</strong></span>
            <span className="text-[#00D084] font-bold">Risque &lt; 2.0%</span>
          </div>
        </article>
      </section>

      {/* ── 6. WORKSPACE TRADINGVIEW EN DIRECT AVEC LASER & PRESETS ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-300">
            AGISSEMENT DU MOTEUR EN DIRECT · WORKSPACE TRADINGVIEW
          </p>
          <span className="font-mono text-xs sm:text-sm text-gray-400">
            Moteur actif : <strong className="text-[#00D084]">{selectedBot.name}</strong>
          </span>
        </div>

        <TradingViewEngineChart
          bot={selectedBot}
          onClosePosition={onClosePosition}
          position={matchingPos}
        />
      </section>

      {/* ── 7. SECTION BASSE : CALENDRIER ÉCONOMIQUE + HEATMAP + LOGS MOTEURS FILTRABLES ── */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* 7.1 Calendrier Économique & Heatmap */}
        <div className="space-y-4">
          {/* Calendrier Économique */}
          <article className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Calendrier Économique HFT</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">3 prochains événements</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { time: "14:30", title: "NFP - Non-Farm Payrolls", impact: "high", curr: "USD" },
                { time: "16:00", title: "FOMC Statement", impact: "high", curr: "USD" },
                { time: "Demain 09:00", title: "ECB Rate Decision", impact: "medium", curr: "EUR" },
              ].map((ev, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-2.5 space-y-1 ${
                    ev.impact === "high"
                      ? "bg-amber-500/10 border-amber-500/25 text-amber-300"
                      : "bg-white/[0.02] border-white/[0.06] text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold">{ev.time}</span>
                    <span className="rounded bg-amber-400/20 px-1 py-0.2 text-[9px] font-bold text-amber-300">
                      ★★★
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white leading-tight truncate">{ev.title}</p>
                  <span className="text-[10px] text-gray-400 font-mono">{ev.curr}</span>
                </div>
              ))}
            </div>
          </article>

          {/* Heatmap Symboles */}
          <article className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-sky-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Heatmap Multi-Actifs</span>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { sym: "XAU/USD", bull: true, chg: "+0.84%" },
                { sym: "EUR/USD", bull: true, chg: "+0.32%" },
                { sym: "GBP/USD", bull: false, chg: "-0.18%" },
                { sym: "BTC/USD", bull: true, chg: "+2.10%" },
                { sym: "Vol 100", bull: true, chg: "+1.05%" },
              ].map((s) => (
                <div
                  key={s.sym}
                  className={`rounded-xl border p-2.5 text-center ${
                    s.bull
                      ? "border-[#00D084]/30 bg-[#00D084]/10 text-[#00D084]"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                  }`}
                >
                  <p className="text-[11px] font-bold text-white">{s.sym}</p>
                  <p className="text-xs font-black font-mono mt-0.5">{s.bull ? "▲" : "▼"} {s.chg}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        {/* 7.2 Journal & Logs Moteur Filtrables */}
        <article className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-4 space-y-3 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-[#00D084]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Journal &amp; Logs Moteur</h3>
              </div>

              {/* Filtres */}
              <div className="flex items-center rounded-lg border border-white/[0.06] bg-[#0c1017] p-0.5 text-[10px]">
                {(["all", "won", "lost", "open"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setLogFilter(f)}
                    className={`rounded px-2 py-0.5 font-bold uppercase transition cursor-pointer ${
                      logFilter === f
                        ? "bg-[#00D084] text-black"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Logs List */}
            <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs font-mono">
              {filteredLogs.map((l, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-lg border border-white/[0.04] bg-[#0c1017] p-2">
                  <span className="text-[10px] text-gray-500 shrink-0">{l.time}</span>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-black uppercase shrink-0 ${
                      l.level === "WON" || l.level === "SUCCESS"
                        ? "bg-[#00D084]/20 text-[#00D084]"
                        : l.level === "LOST" || l.level === "ERROR"
                        ? "bg-rose-500/20 text-rose-300"
                        : "bg-sky-500/20 text-sky-300"
                    }`}
                  >
                    {l.level}
                  </span>
                  <span className="text-gray-300 leading-snug flex-1 truncate">{l.msg}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Session Stats Bar */}
          <div className="border-t border-white/[0.06] pt-2.5 flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400">Win Rate Session : <strong className="text-[#00D084]">70%</strong> (7G / 3P)</span>
            <span className="flex items-center gap-1 text-amber-300 font-bold">
              <Flame className="size-3.5 text-amber-400" /> Streak : 4 gains
            </span>
          </div>
        </article>
      </section>
    </div>
  );
}

// ----------------------------------------------------
// 2. OVERVIEW VIEW
// ----------------------------------------------------
function OverviewTab({
  balance,
  running,
  onToggleRunning,
  bots,
  positions,
  onClosePosition,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenEngine,
  onOpenRisk,
}: {
  balance: number;
  running: boolean;
  onToggleRunning: () => void;
  bots: EngineBot[];
  positions: PositionItem[];
  onClosePosition: (pos: PositionItem) => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenEngine: () => void;
  onOpenRisk: () => void;
}) {
  const [chartTimeframe, setChartTimeframe] = useState<"24H" | "7J" | "30J" | "1A">("30J");
  const [tickerTick, setTickerTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerTick((t) => t + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalOpenPnl = positions.reduce((acc, p) => acc + p.pnlNum, 0);

  const chartPoints = useMemo(() => {
    switch (chartTimeframe) {
      case "24H":
        return [
          { label: "00h", val: 24720 },
          { label: "04h", val: 24750 },
          { label: "08h", val: 24730 },
          { label: "12h", val: 24810 },
          { label: "14h", val: 24860 },
        ];
      case "7J":
        return [
          { label: "Lun", val: 24100 },
          { label: "Mar", val: 24280 },
          { label: "Mer", val: 24450 },
          { label: "Jeu", val: 24620 },
          { label: "Ven", val: 24860 },
        ];
      case "30J":
        return [
          { label: "Sem 1", val: 22400 },
          { label: "Sem 2", val: 23150 },
          { label: "Sem 3", val: 23900 },
          { label: "Sem 4", val: 24860 },
        ];
      case "1A":
        return [
          { label: "T1", val: 15000 },
          { label: "T2", val: 18400 },
          { label: "T3", val: 21800 },
          { label: "T4", val: 24860 },
        ];
    }
  }, [chartTimeframe]);

  const minVal = Math.min(...chartPoints.map((p) => p.val));
  const maxVal = Math.max(...chartPoints.map((p) => p.val));
  const range = maxVal - minVal || 1;

  const svgPath = chartPoints
    .map((p, i) => {
      const x = (i / (chartPoints.length - 1)) * 500;
      const y = 140 - ((p.val - minVal) / range) * 110;
      return `${i === 0 ? "M" : "L"} ${x},${y}`;
    })
    .join(" ");

  const marketTickers = [
    { pair: "EUR/USD", price: (1.0858 + (tickerTick % 2 === 0 ? 0.0002 : -0.0001)).toFixed(5), change: "+0.28%", up: true },
    { pair: "XAU/USD", price: (2388.9 + (tickerTick % 3 === 0 ? 0.4 : -0.2)).toFixed(2), change: "+1.14%", up: true },
    { pair: "GBP/USD", price: (1.2845 + (tickerTick % 2 === 0 ? -0.0001 : 0.0003)).toFixed(5), change: "-0.09%", up: false },
    { pair: "BTC/USD", price: "64 250.00", change: "+2.45%", up: true },
    { pair: "NAS100", price: "19 814.50", change: "+0.65%", up: true },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Welcome */}
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <div className="pointer-events-none absolute -right-20 -top-20 size-96 rounded-full bg-[#00D084]/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00D084]/30 bg-[#00D084]/10 px-3.5 py-1 text-xs font-black tracking-wider text-[#00D084] uppercase">
              <Zap className="size-4" />
              TABLEAU DE BORD EXÉCUTIF MT5
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Bonjour, <span className="text-[#00D084]">Ludovic</span>
            </h2>
            <p className="max-w-xl text-sm sm:text-base text-gray-300 font-medium leading-relaxed">
              Vos 3 moteurs institutionnels (AI Gold, FX Trend, Index Reversion) sont synchronisés avec le serveur <strong className="text-white">Equinix NY4</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3.5">
            <button
              onClick={onToggleRunning}
              className={`inline-flex items-center gap-2.5 rounded-2xl px-6 py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg ${
                running
                  ? "neon-btn text-black shadow-[0_0_20px_rgba(0,208,132,0.3)] hover:scale-[1.02]"
                  : "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
              }`}
            >
              {running ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}
              {running ? "MOTEURS ACTIFS" : "MOTEURS EN PAUSE"}
            </button>

            <button
              onClick={onOpenDeposit}
              className="inline-flex items-center gap-2.5 rounded-2xl border border-white/[0.12] bg-[#141a23] hover:bg-[#1a2330] px-5 py-3.5 text-xs sm:text-sm font-bold text-white uppercase tracking-wider transition-all cursor-pointer"
            >
              <Plus className="size-4 text-[#00D084]" />
              DÉPÔT RAPIDE
            </button>
          </div>
        </div>

        {/* Live Market Tickers Ribbon */}
        <div className="mt-8 border-t border-white/[0.06] pt-5">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-400 mb-3">
            <Activity className="size-3.5 text-[#00D084]" /> COTATIONS DIRECTES · SPREAD FIX ULTRA-FAIBLE
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {marketTickers.map((tick) => (
              <div
                key={tick.pair}
                className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-[#0c1017] px-4 py-3 transition-colors hover:border-[#00D084]/40"
              >
                <div>
                  <span className="font-mono text-xs text-gray-400 font-bold">{tick.pair}</span>
                  <p className="font-mono text-sm sm:text-base font-black text-white">{tick.price}</p>
                </div>
                <span
                  className={`text-xs font-mono font-black ${
                    tick.up ? "text-[#00D084]" : "text-rose-400"
                  }`}
                >
                  {tick.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-3xl border border-[#00D084]/30 bg-[#10141b] p-6 sm:p-7 shadow-md transition-all hover:border-[#00D084]/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-gray-400">VALEUR DU COMPTE (EQUITY)</span>
            <Wallet className="size-5 text-[#00D084]" />
          </div>
          <p className="mt-4 font-mono text-3xl sm:text-4xl font-black text-white">
            ${(balance + totalOpenPnl).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-400">Solde cash</span>
            <span className="font-mono font-bold text-gray-200">${balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span>
          </div>
        </article>

        <article className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 sm:p-7 shadow-md transition-all hover:border-white/[0.15]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-gray-400">P&amp;L LATENT (EN COURS)</span>
            <TrendingUp className="size-5 text-[#00D084]" />
          </div>
          <p
            className={`mt-4 font-mono text-3xl sm:text-4xl font-black ${
              totalOpenPnl >= 0 ? "text-[#00D084]" : "text-rose-400"
            }`}
          >
            {totalOpenPnl >= 0 ? `+$${totalOpenPnl.toFixed(2)}` : `-$${Math.abs(totalOpenPnl).toFixed(2)}`}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-400">Positions actives</span>
            <span className="font-mono font-bold text-[#00D084]">{positions.length} en direct</span>
          </div>
        </article>

        <article className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 sm:p-7 shadow-md transition-all hover:border-white/[0.15]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-gray-400">MOTEURS EN LIGNE</span>
            <Bot className="size-5 text-sky-400" />
          </div>
          <p className="mt-4 font-mono text-3xl sm:text-4xl font-black text-sky-400">3 / 3</p>
          <div className="mt-3 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-400">Equinix NY4</span>
            <span className="font-mono font-bold text-[#00D084]">100% Opérationnel</span>
          </div>
        </article>

        <article className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 sm:p-7 shadow-md transition-all hover:border-white/[0.15]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-gray-400">RISQUE &amp; DRAWDOWN</span>
            <ShieldCheck className="size-5 text-[#00D084]" />
          </div>
          <p className="mt-4 font-mono text-3xl sm:text-4xl font-black text-white">0.34%</p>
          <div className="mt-3 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-400">Limite max autorisée</span>
            <span className="font-mono font-bold text-amber-400">2.00% / jour</span>
          </div>
        </article>
      </section>

      {/* Interactive Equity Curve & Quick Bot Summary */}
      <section className="grid gap-6 xl:grid-cols-[1.4fr_.6fr]">
        <article className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 sm:p-8 shadow-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-gray-400">ÉVOLUTION DE L'EQUITY</p>
              <h3 className="mt-1 text-lg sm:text-xl font-black text-white">Performance Cumulée des 3 Bots</h3>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0c1017] p-1">
              {(["24H", "7J", "30J", "1A"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setChartTimeframe(tf)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer ${
                    chartTimeframe === tf
                      ? "bg-[#00D084] text-black font-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="relative h-52 w-full">
              <svg viewBox="0 0 500 150" className="h-full w-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D084" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#00D084" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={`${svgPath} L 500,150 L 0,150 Z`} fill="url(#chartGrad)" />
                <path d={svgPath} fill="none" stroke="#00D084" strokeWidth="3.5" strokeLinecap="round" className="drop-shadow-[0_0_10px_rgba(0,208,132,0.6)]" />
              </svg>
            </div>
            <div className="mt-5 flex justify-between border-t border-white/[0.06] pt-3 text-xs sm:text-sm font-mono text-gray-300">
              {chartPoints.map((pt) => (
                <span key={pt.label}>
                  {pt.label} : <strong className="text-white">${pt.val.toLocaleString()}</strong>
                </span>
              ))}
            </div>
          </div>
        </article>

        {/* 3 Bots Quick Snapshot */}
        <article className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 sm:p-8 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-gray-400">MOTEURS OPÉRATIONNELS</p>
                <h3 className="mt-1 text-lg sm:text-xl font-black text-white">Supervision Rapide</h3>
              </div>
              <button
                onClick={onOpenEngine}
                className="text-xs sm:text-sm font-bold text-[#00D084] hover:underline cursor-pointer flex items-center gap-1"
              >
                Page Moteur <ChevronRight className="size-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3.5">
              {bots.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-[#0c1017] p-4 transition-colors hover:border-white/[0.12]"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`size-2.5 rounded-full ${
                        b.theme === "gold" ? "bg-amber-400" : b.theme === "cyan" ? "bg-sky-400" : "bg-purple-400"
                      }`}
                    />
                    <div>
                      <span className="font-bold text-sm sm:text-base text-white">{b.name}</span>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{b.markets}</p>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className={`text-sm sm:text-base font-black ${b.pnlTodayNum >= 0 ? "text-[#00D084]" : "text-rose-400"}`}>
                      {b.pnlToday}
                    </span>
                    <p className="text-xs text-gray-400">{b.openPositions} pos.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onOpenEngine}
            className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/[0.1] bg-[#141a23] py-3.5 text-xs sm:text-sm font-bold text-white hover:bg-[#1a2330] transition cursor-pointer"
          >
            <Zap className="size-4 text-[#00D084]" />
            OUVRIR LE CENTRE DE CONTRÔLE DES BOTS
          </button>
        </article>
      </section>
    </div>
  );
}

// ----------------------------------------------------
// 3. STRATÉGIES VIEW
// ----------------------------------------------------
function StrategiesTab({
  bots,
  onOpenBotDetail,
}: {
  bots: EngineBot[];
  onOpenBotDetail: (bot: EngineBot) => void;
}) {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00D084]/30 bg-[#00D084]/10 px-3.5 py-1 text-xs font-black tracking-wider text-[#00D084] uppercase mb-2">
              BIBLIOTHÈQUE STRATÉGIQUE MT5
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">Moteurs &amp; Algorithmes Certifiés</h2>
            <p className="mt-2 text-sm sm:text-base text-gray-300 max-w-2xl font-medium">
              Chaque moteur est optimisé pour une classe d'actifs dédiée et opère selon un cahier des charges quantitatif institutionnel.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {bots.map((b) => (
          <article
            key={b.id}
            className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 sm:p-8 shadow-md flex flex-col justify-between transition-all hover:border-[#00D084]/40"
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-black text-white">{b.name}</h3>
                <StatusPill variant="emerald">{b.statusBadge}</StatusPill>
              </div>
              <p className="mt-1 font-mono text-xs sm:text-sm text-[#00D084] font-bold">{b.specialty}</p>
              <p className="mt-4 text-xs sm:text-sm text-gray-300 leading-relaxed font-medium">{b.subtitle}</p>

              <div className="mt-6 space-y-2.5 text-xs sm:text-sm border-t border-white/[0.06] pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Marchés :</span>
                  <span className="font-mono font-bold text-white">{b.markets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Stratégie :</span>
                  <span className="font-bold text-gray-200">{b.strategy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Régime :</span>
                  <span className="font-mono text-[#00D084] font-bold">{b.marketRegime}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenBotDetail(b)}
              className="mt-6 w-full rounded-2xl border border-[#00D084]/40 bg-[#00D084]/10 py-3.5 text-xs sm:text-sm font-bold text-[#00D084] hover:bg-[#00D084]/20 transition cursor-pointer"
            >
              VOIR FICHE DÉTAILLÉE
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}

// ----------------------------------------------------
// 4. RISQUE VIEW (AVEC CALCULATEUR DE LOT & SIMULATEUR)
// ----------------------------------------------------
function RiskTab({
  balance,
  positions,
  onEmergencyHalt,
}: {
  balance: number;
  positions: PositionItem[];
  onEmergencyHalt: () => void;
}) {
  const [maxDrawdownPercent, setMaxDrawdownPercent] = useState(2.0);
  const [maxExposureLots, setMaxExposureLots] = useState(3.0);
  const [riskPerTrade, setRiskPerTrade] = useState(0.5);

  // Position Sizing Simulator
  const [simCapital, setSimCapital] = useState(balance);
  const [simRiskPercent, setSimRiskPercent] = useState(1.0);
  const [simStopLossPips, setSimStopLossPips] = useState(30);

  const calculatedRiskAmount = (simCapital * (simRiskPercent / 100));
  const calculatedLotSize = Number((calculatedRiskAmount / (simStopLossPips * 10)).toFixed(2));

  const handleSaveRisk = () => {
    toast.success("Paramètres du Risk Governor sauvegardés et transmis au terminal MT5.");
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-rose-500/30 bg-[#140c10] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-3.5 py-1 text-xs font-black tracking-wider text-rose-400 uppercase mb-2">
              RISK GOVERNOR &amp; SÉCURITÉ DU CAPITAL
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">Protection Active du Capital</h2>
            <p className="mt-2 text-sm sm:text-base text-gray-300 max-w-2xl font-medium">
              Le moteur applique un coupe-circuit strict dès que les tolérances de drawdown ou d'exposition sont atteintes.
            </p>
          </div>
          <StatusPill variant="emerald">GARDE-FOUS OPÉRATIONNELS</StatusPill>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 sm:p-8 shadow-md space-y-6">
          <div className="border-b border-white/[0.06] pb-4">
            <p className="text-xs font-black uppercase tracking-wider text-gray-400">RÉGLAGES EN DIRECT</p>
            <h3 className="mt-1 text-lg sm:text-xl font-black text-white">Seuils de Tolérance Algorithmique</h3>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm font-bold text-gray-300">
              <span>DRAWDOWN JOURNALIER MAXIMUM</span>
              <span className="font-mono text-[#00D084] text-base">{maxDrawdownPercent.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.1"
              value={maxDrawdownPercent}
              onChange={(e) => setMaxDrawdownPercent(parseFloat(e.target.value))}
              className="w-full accent-[#00D084] cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm font-bold text-gray-300">
              <span>EXPOSITION TOTALE MAXIMALE</span>
              <span className="font-mono text-sky-400 text-base">{maxExposureLots.toFixed(1)} lots</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="10.0"
              step="0.5"
              value={maxExposureLots}
              onChange={(e) => setMaxExposureLots(parseFloat(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm font-bold text-gray-300">
              <span>RISQUE ENGAGÉ PAR ORDRE</span>
              <span className="font-mono text-purple-400 text-base">{riskPerTrade.toFixed(2)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.05"
              value={riskPerTrade}
              onChange={(e) => setRiskPerTrade(parseFloat(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>

          <button
            onClick={handleSaveRisk}
            className="neon-btn w-full rounded-2xl py-4 text-xs sm:text-sm font-black uppercase tracking-wider text-black cursor-pointer transition-all hover:scale-[1.01]"
          >
            ENREGISTRER LES LIMITES DE RISQUE
          </button>
        </article>

        {/* Emergency Kill Switch */}
        <article className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-6 sm:p-8 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="size-5" />
              <p className="text-xs font-black uppercase tracking-wider">INTERRUPTEUR D'URGENCE (KILL SWITCH)</p>
            </div>
            <h3 className="mt-2 text-xl sm:text-2xl font-black text-white">Arrêt d'Urgence Immédiat</h3>
            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-gray-300 font-medium">
              En cas d'événement macroéconomique imprévu, activez cet interrupteur pour clôturer immédiatement toutes les positions et suspendre les bots.
            </p>
          </div>

          <button
            onClick={onEmergencyHalt}
            className="mt-8 w-full rounded-2xl border border-rose-500/60 bg-rose-500/30 py-4 text-xs sm:text-sm font-black uppercase tracking-wider text-white hover:bg-rose-500/50 transition cursor-pointer shadow-lg"
          >
            ACTIVER LE COUPE-CIRCUIT D'URGENCE
          </button>
        </article>
      </section>

      {/* CALCULATEUR DE LOTS ET SIMULATEUR DE POSITION (FONCTIONNALITÉ ADDITIONNELLE) */}
      <section className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 sm:p-8 shadow-md space-y-5">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-[#00D084]/20 text-[#00D084]">
              <Calculator className="size-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white">Simulateur de Lots &amp; Dimensionnement MT5</h3>
              <p className="text-xs sm:text-sm text-gray-400">Calculez instantanément la taille de position recommandée selon votre tolérance.</p>
            </div>
          </div>
          <span className="rounded-xl border border-white/[0.1] bg-[#0c1017] px-3.5 py-1.5 font-mono text-xs text-gray-300">
            ECN Standard
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-1.5">CAPITAL SIMULÉ ($)</label>
            <input
              type="number"
              value={simCapital}
              onChange={(e) => setSimCapital(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-white/[0.08] bg-[#0c1017] px-4 py-3 font-mono text-base font-bold text-white outline-none focus:border-[#00D084]"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-1.5">RISQUE SOUHAITÉ (%)</label>
            <input
              type="number"
              step="0.1"
              value={simRiskPercent}
              onChange={(e) => setSimRiskPercent(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-white/[0.08] bg-[#0c1017] px-4 py-3 font-mono text-base font-bold text-white outline-none focus:border-[#00D084]"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-1.5">DISTANCE STOP-LOSS (PIPS / PTS)</label>
            <input
              type="number"
              value={simStopLossPips}
              onChange={(e) => setSimStopLossPips(parseFloat(e.target.value) || 1)}
              className="w-full rounded-xl border border-white/[0.08] bg-[#0c1017] px-4 py-3 font-mono text-base font-bold text-white outline-none focus:border-[#00D084]"
            />
          </div>
        </div>

        {/* Results Banner */}
        <div className="grid gap-4 sm:grid-cols-3 rounded-2xl border border-[#00D084]/30 bg-[#00D084]/10 p-4 font-mono">
          <div>
            <span className="text-xs text-gray-400 uppercase font-sans font-bold">MONTANT À RISQUER ($)</span>
            <p className="text-lg sm:text-xl font-black text-white mt-0.5">${calculatedRiskAmount.toFixed(2)} USD</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase font-sans font-bold">VOLUME RECOMMANDÉ (LOTS)</span>
            <p className="text-lg sm:text-xl font-black text-[#00D084] mt-0.5">{calculatedLotSize} lot(s)</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase font-sans font-bold">VALEUR PAR PIP ESTIMÉE</span>
            <p className="text-lg sm:text-xl font-black text-sky-400 mt-0.5">${(calculatedLotSize * 10).toFixed(2)} / pip</p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ----------------------------------------------------
// 5. PORTEFEUILLE VIEW
// ----------------------------------------------------
function PortfolioTab({
  balance,
  transactions,
  onOpenDeposit,
  onOpenWithdraw,
}: {
  balance: number;
  transactions: TransactionItem[];
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
}) {
  const [searchTx, setSearchTx] = useState("");

  const filteredTx = transactions.filter((tx) =>
    tx.type.toLowerCase().includes(searchTx.toLowerCase()) ||
    tx.date.toLowerCase().includes(searchTx.toLowerCase()) ||
    tx.amount.includes(searchTx)
  );

  const handleExportStatement = () => {
    const rows = [
      ["Date", "Type", "Montant", "Devise", "Statut", "Moyen"],
      ...transactions.map((t) => [t.date, t.type, t.amount, t.currency, t.status, t.method ?? "-"]),
    ];
    downloadCsv("nexium-releve-transactions.csv", rows);
    toast.success("Relevé de compte exporté au format CSV avec succès.");
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00D084]/30 bg-[#00D084]/10 px-3.5 py-1 text-xs font-black tracking-wider text-[#00D084] uppercase mb-2">
              GESTION FINANCIÈRE &amp; TRÉSORERIE
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">Portefeuille &amp; Dépôts</h2>
            <p className="mt-2 text-sm sm:text-base text-gray-300 max-w-2xl font-medium">
              Consultez vos soldes en temps réel, créditez votre compte ou effectuez des retraits sécurisés.
            </p>
          </div>

          <div className="flex flex-wrap gap-3.5">
            <button
              onClick={onOpenDeposit}
              className="neon-btn inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-black cursor-pointer shadow-lg hover:scale-[1.02] transition-all"
            >
              <Plus className="size-4" />
              DÉPOSER DES FONDS
            </button>
            <button
              onClick={onOpenWithdraw}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.12] bg-[#141a23] hover:bg-[#1a2330] px-6 py-3.5 text-xs sm:text-sm font-bold text-white uppercase tracking-wider transition-all cursor-pointer"
            >
              RETIRER DES FONDS
            </button>
          </div>
        </div>
      </section>

      {/* Balances */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-3xl border border-[#00D084]/30 bg-[#10141b] p-6 sm:p-7">
          <p className="text-xs font-black uppercase tracking-wider text-[#00D084]">SOLDE CASH DISPONIBLE</p>
          <p className="mt-4 font-mono text-3xl sm:text-4xl font-black text-white">
            ${balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-2 text-xs sm:text-sm text-gray-400">Compte ECN Principal · USD</p>
        </article>

        <article className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 sm:p-7">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400">TOTAL GAINS GÉNERÉS</p>
          <p className="mt-4 font-mono text-3xl sm:text-4xl font-black text-[#00D084]">+$3 480.20</p>
          <p className="mt-2 text-xs sm:text-sm text-gray-400">Gains algorithmiques nets</p>
        </article>

        <article className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 sm:p-7">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400">RETRAITS EFFECTUÉS</p>
          <p className="mt-4 font-mono text-3xl sm:text-4xl font-black text-white">$1 200.00</p>
          <p className="mt-2 text-xs sm:text-sm text-gray-400">Virés sans frais</p>
        </article>

        <article className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 sm:p-7">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400">STATUT CONFORMITÉ</p>
          <p className="mt-4 font-mono text-2xl font-black text-[#00D084]">KYC VALIDÉ</p>
          <p className="mt-2 text-xs sm:text-sm text-gray-400">Niveau institutionnel illimité</p>
        </article>
      </section>

      {/* Transactions */}
      <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#10141b] shadow-md">
        <div className="flex flex-col gap-4 border-b border-white/[0.06] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-gray-400">MOUVEMENTS DE FONDS</p>
            <h3 className="mt-1 text-lg sm:text-xl font-black text-white">Historique des Transactions</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3.5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTx}
                onChange={(e) => setSearchTx(e.target.value)}
                className="rounded-xl border border-white/[0.08] bg-[#0c1017] pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-[#00D084]"
              />
            </div>

            <button
              onClick={handleExportStatement}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#141a23] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#1a2330] transition cursor-pointer"
            >
              <Download className="size-4 text-[#00D084]" />
              EXPORTER CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-white/[0.06] bg-[#0c1017] text-xs font-black uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-6 py-4">DATE</th>
                <th className="px-6 py-4">TYPE</th>
                <th className="px-6 py-4">MÉTHODE</th>
                <th className="px-6 py-4">MONTANT</th>
                <th className="px-6 py-4">STATUT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredTx.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-mono text-gray-400">{tx.date}</td>
                  <td className="px-6 py-4 font-bold text-white">{tx.type}</td>
                  <td className="px-6 py-4 text-gray-300">{tx.method ?? "Automatique"}</td>
                  <td className="px-6 py-4 font-mono font-black" style={{ color: tx.color }}>
                    {tx.amount}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1 text-xs font-mono font-bold text-gray-300">
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ----------------------------------------------------
// 6. TÉLÉMÉTRIE VIEW
// ----------------------------------------------------
function TelemetryTab() {
  const [selectedServer, setSelectedServer] = useState<"NY4" | "LD4" | "TY3">("NY4");
  const [pingResult, setPingResult] = useState<number>(21);
  const [isPinging, setIsPinging] = useState(false);

  const handleTestPing = () => {
    setIsPinging(true);
    setTimeout(() => {
      const base = selectedServer === "NY4" ? 21 : selectedServer === "LD4" ? 18 : 65;
      const jitter = Math.floor(Math.random() * 3);
      setPingResult(base + jitter);
      setIsPinging(false);
      toast.success(`Ping vers ${selectedServer} mesuré : ${base + jitter} ms.`);
    }, 800);
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00D084]/30 bg-[#00D084]/10 px-3.5 py-1 text-xs font-black tracking-wider text-[#00D084] uppercase mb-2">
              INFRASTRUCTURE RÉSEAU INSTITUTIONNELLE
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">Télémétrie FIX &amp; Serveurs MT5</h2>
            <p className="mt-2 text-sm sm:text-base text-gray-300 max-w-2xl font-medium">
              Monitoring en temps réel de la passerelle FIX 4.4, de la latence de routage et de l'intégrité des flux.
            </p>
          </div>
          <StatusPill variant="emerald">FLUX FIX ACTIF · SANS PERTE</StatusPill>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 sm:p-8 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-gray-400">PASSERELLES DISPONIBLES</p>
              <h3 className="mt-1 text-lg sm:text-xl font-black text-white">Datacenters Financiers</h3>
            </div>
            <button
              onClick={handleTestPing}
              disabled={isPinging}
              className="inline-flex items-center gap-2 rounded-xl border border-[#00D084]/40 bg-[#00D084]/10 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#00D084] hover:bg-[#00D084]/20 transition cursor-pointer"
            >
              <RefreshCw className={`size-4 ${isPinging ? "animate-spin" : ""}`} />
              TESTER LE PING
            </button>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-3">
            {[
              { id: "NY4", name: "Equinix NY4", city: "New York (USA)", ping: `${pingResult} ms` },
              { id: "LD4", name: "Equinix LD4", city: "Londres (UK)", ping: "18 ms" },
              { id: "TY3", name: "Equinix TY3", city: "Tokyo (JPN)", ping: "65 ms" },
            ].map((srv) => (
              <button
                key={srv.id}
                onClick={() => setSelectedServer(srv.id as any)}
                className={`rounded-2xl border p-5 text-left transition-all cursor-pointer ${
                  selectedServer === srv.id
                    ? "border-[#00D084]/60 bg-[#00D084]/10 ring-1 ring-[#00D084]/40"
                    : "border-white/[0.06] bg-[#0c1017] hover:border-white/[0.12]"
                }`}
              >
                <p className="font-bold text-sm sm:text-base text-white">{srv.name}</p>
                <p className="text-xs text-gray-400">{srv.city}</p>
                <p className="mt-3 font-mono text-xl font-black text-[#00D084]">{srv.ping}</p>
              </button>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 sm:p-8 shadow-md">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400">FLUX DE MESSAGES FIX</p>
          <div className="mt-4 space-y-3 font-mono text-xs sm:text-sm">
            {[
              "8=FIX.4.4|35=W|55=EURUSD|269=0|270=1.08584|271=50",
              "8=FIX.4.4|35=W|55=XAUUSD|269=1|270=2388.90|271=20",
              "8=FIX.4.4|35=8|39=2|150=2|37=892119|55=XAUUSD|32=0.20",
              "8=FIX.4.4|35=0|112=HEARTBEAT_ACK|NY4_GATEWAY",
            ].map((msg, i) => (
              <div key={i} className="rounded-xl border border-white/[0.04] bg-[#0c1017] p-3 text-gray-300">
                <span className="text-[#00D084] font-bold">[{new Date().toLocaleTimeString()}]</span> {msg}
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

// ----------------------------------------------------
// 7. JOURNAL VIEW
// ----------------------------------------------------
function JournalTab({ journal }: { journal: JournalEntry[] }) {
  const [search, setSearch] = useState("");

  const filtered = journal.filter((entry) =>
    entry.event.toLowerCase().includes(search.toLowerCase()) ||
    entry.detail.toLowerCase().includes(search.toLowerCase()) ||
    (entry.symbol && entry.symbol.toLowerCase().includes(search.toLowerCase()))
  );

  const handleExportJournal = () => {
    const rows = [
      ["Heure", "Événement", "Symbole", "Détail", "Statut"],
      ...journal.map((j) => [j.time, j.event, j.symbol ?? "-", j.detail, j.status]),
    ];
    downloadCsv("nexium-journal-audit.csv", rows);
    toast.success("Journal d'audit exporté au format CSV.");
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00D084]/30 bg-[#00D084]/10 px-3.5 py-1 text-xs font-black tracking-wider text-[#00D084] uppercase mb-2">
              REGISTRE D'AUDIT ET TRAÇABILITÉ
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">Journal Décisionnel des Algorithmes</h2>
            <p className="mt-2 text-sm sm:text-base text-gray-300 max-w-2xl font-medium">
              Historique inaltérable de chaque calcul de signal, contrôle de gouvernance du risque et exécution d'ordre.
            </p>
          </div>

          <button
            onClick={handleExportJournal}
            className="neon-btn inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-black cursor-pointer shadow-lg hover:scale-[1.02] transition-all"
          >
            <Download className="size-4" />
            EXPORTER LE JOURNAL (CSV)
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#10141b] shadow-md">
        <div className="p-6 border-b border-white/[0.06]">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par mot-clé..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-[#0c1017] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-[#00D084]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-white/[0.06] bg-[#0c1017] text-xs font-black uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-6 py-4">HEURE</th>
                <th className="px-6 py-4">ÉVÉNEMENT</th>
                <th className="px-6 py-4">SYMBOLE</th>
                <th className="px-6 py-4">DÉTAIL</th>
                <th className="px-6 py-4">STATUT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-mono text-gray-400">{entry.time}</td>
                  <td className="px-6 py-4 font-mono font-bold text-white">{entry.event}</td>
                  <td className="px-6 py-4 font-mono text-[#00D084] font-bold">{entry.symbol ?? "—"}</td>
                  <td className="px-6 py-4 text-gray-200 font-medium">{entry.detail}</td>
                  <td className="px-6 py-4">
                    <StatusPill variant={entry.statusVariant}>{entry.status}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ----------------------------------------------------
// 8. MESSAGERIE VIEW (CHAT DIRECT, APPEL PUR & EMAIL)
// ----------------------------------------------------
function MessagingTab({
  messages,
  onSendMessage,
}: {
  messages: ChatMessage[];
  onSendMessage: (txt: string) => void;
}) {
  const [activeChannel, setActiveChannel] = useState<"chat" | "call" | "email">("chat");

  // ---------------- CHAT STATE ----------------
  const [chatInput, setChatInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const handleChatSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const fullMessage = replyingTo
      ? `[En réponse à : "${replyingTo.text.slice(0, 50)}..."]\n${chatInput.trim()}`
      : chatInput.trim();

    onSendMessage(fullMessage);
    setChatInput("");
    setReplyingTo(null);

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
    }, 1200);
  };

  const handleQuickPrompt = (prompt: string) => {
    onSendMessage(prompt);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  // ---------------- AUDIO PHONE CALL STATE ----------------
  const [callState, setCallState] = useState<"IDLE" | "CALLING" | "CONNECTED" | "ENDED">("IDLE");
  const [selectedAgent, setSelectedAgent] = useState({
    name: "Dr. Antoine R.",
    role: "Directeur de Recherche Quantitative",
    avatar: "AR",
    phoneExt: "Ligne directe : +1 (212) 892-0144 · Poste #104",
    status: "Disponible immédiatement",
  });
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showKeypad, setShowKeypad] = useState(false);
  const [dialedDigits, setDialedDigits] = useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState === "CONNECTED") {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else if (callState === "IDLE") {
      setCallDuration(0);
      setDialedDigits("");
    }
    return () => clearInterval(interval);
  }, [callState]);

  const startAudioCall = (agent: typeof selectedAgent) => {
    setSelectedAgent(agent);
    setCallState("CALLING");
    toast.info(`Appel sécurisé vers ${agent.name}...`);

    setTimeout(() => {
      setCallState("CONNECTED");
      toast.success(`Communication établie avec ${agent.name}.`);
    }, 2000);
  };

  const endCall = () => {
    setCallState("ENDED");
    setShowKeypad(false);
    toast.warning("Appel téléphonique terminé.");
    setTimeout(() => {
      setCallState("IDLE");
    }, 1500);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleKeypadPress = (digit: string) => {
    setDialedDigits((prev) => prev + digit);
    toast.info(`Touche ${digit} transmise.`);
  };

  // ---------------- EMAIL STATE ----------------
  const [emails, setEmails] = useState<EmailItem[]>(INITIAL_EMAILS);
  const [emailFolder, setEmailFolder] = useState<"inbox" | "sent" | "compose">("inbox");
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(INITIAL_EMAILS[0]);

  // Compose form state
  const [composeTo, setComposeTo] = useState("desk-quant@nexiummarkets.com");
  const [composeSubject, setComposeSubject] = useState("");
  const [composePriority, setComposePriority] = useState<"NORMAL" | "URGENT" | "CRITIQUE">("NORMAL");
  const [composeBody, setComposeBody] = useState("");

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeSubject.trim() || !composeBody.trim()) {
      toast.error("Veuillez renseigner l'objet et le message.");
      return;
    }

    const newEmail: EmailItem = {
      id: `mail-${Date.now()}`,
      from: "ludovic.m@investisseur-nexium.com",
      fromName: "Ludovic M. (Compte #802194)",
      to: composeTo,
      subject: composeSubject,
      date: `Aujourd'hui · ${new Date().toLocaleTimeString().slice(0, 5)}`,
      preview: composeBody.slice(0, 80) + "...",
      body: composeBody.split("\n"),
      unread: false,
      priority: composePriority,
      folder: "sent",
    };

    setEmails((prev) => [newEmail, ...prev]);
    setSelectedEmail(newEmail);
    setEmailFolder("sent");
    setComposeSubject("");
    setComposeBody("");
    toast.success("E-mail transmis au Desk.");

    setTimeout(() => {
      const autoReply: EmailItem = {
        id: `mail-reply-${Date.now()}`,
        from: composeTo,
        fromName: composeTo.includes("quant") ? "Nexium Quant Desk" : "Nexium Risk Governance",
        to: "ludovic.m@investisseur-nexium.com",
        subject: `Re: ${newEmail.subject}`,
        date: `Aujourd'hui · ${new Date().toLocaleTimeString().slice(0, 5)}`,
        preview: "Accusé de réception officiel de votre demande...",
        body: [
          "Bonjour Ludovic,",
          `Nous accusons bonne réception de votre message : "${newEmail.subject}".`,
          "Votre gestionnaire de compte et l'équipe technique MT5 traitent votre demande prioritaire.",
          "Temps de traitement estimé : 15 minutes.",
          "Cordialement,\nLe Desk Nexium Markets",
        ],
        unread: true,
        priority: newEmail.priority,
        folder: "inbox",
      };
      setEmails((prev) => [autoReply, ...prev]);
      toast.info("Nouvel e-mail reçu : Accusé de réception.");
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. EN-TÊTE ÉPURÉ AVEC SÉLECTEUR DE CANAL */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Messagerie
            </h2>
            <span className="rounded-full border border-[#00D084]/40 bg-[#00D084]/15 px-2.5 py-0.5 text-[11px] font-mono font-bold text-[#00D084]">
              DESK EN DIRECT
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Assistance directe, appels et échanges chiffrés avec les ingénieurs quantitatifs.
          </p>
        </div>

        {/* Sélecteur de canal 3-en-1 harmonisé */}
        <div className="flex items-center rounded-2xl border border-white/[0.08] bg-[#0c1017] p-1 shadow-md">
          <button
            onClick={() => setActiveChannel("chat")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeChannel === "chat"
                ? "bg-[#00D084] text-black font-black shadow-[0_0_12px_rgba(0,208,132,0.3)]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <MessageSquare className="size-3.5" />
            Chat
            <span className="size-1.5 rounded-full bg-current animate-pulse" />
          </button>

          <button
            onClick={() => setActiveChannel("call")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeChannel === "call"
                ? "bg-[#00D084] text-black font-black shadow-[0_0_12px_rgba(0,208,132,0.3)]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <PhoneCall className="size-3.5" />
            Appel
            {callState === "CONNECTED" && (
              <span className="size-1.5 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveChannel("email")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeChannel === "email"
                ? "bg-[#00D084] text-black font-black shadow-[0_0_12px_rgba(0,208,132,0.3)]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Mail className="size-3.5" />
            E-mail
            {emails.filter((e) => e.unread).length > 0 && (
              <span className="rounded-full bg-amber-400 px-1.5 py-0.2 font-mono text-[10px] font-black text-black">
                {emails.filter((e) => e.unread).length}
              </span>
            )}
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CANAL 1: CHAT DIRECT */}
      {/* ========================================================================= */}
      {activeChannel === "chat" && (
        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#10141b] shadow-md flex flex-col min-h-[580px]">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#0c1017] px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/30">
                <Bot className="size-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Desk Quantitatif MT5</h3>
                <div className="flex items-center gap-1.5 text-[11px] text-[#00D084]">
                  <span className="size-1.5 rounded-full bg-[#00D084] animate-pulse" />
                  En ligne · Réponses &lt; 30s
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveChannel("call");
                startAudioCall(selectedAgent);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-[#00D084]/30 bg-[#00D084]/10 hover:bg-[#00D084]/20 px-3 py-1.5 text-xs font-bold text-[#00D084] transition cursor-pointer"
            >
              <Phone className="size-3.5" />
              Appeler
            </button>
          </div>

          {/* Quick Predefined Questions */}
          <div className="border-b border-white/[0.04] bg-[#080b0f] px-5 py-2.5 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              QUESTIONS RAPIDES (1-CLIC) :
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {[
                { label: "📊 Logique du signal Gold", text: "Pouvez-vous m'expliquer la logique du signal BUY exécuté sur Nexium AI Gold ?" },
                { label: "⚙️ Statut Equinix NY4", text: "Quel est le statut de latence et de connectivité sur le flux FIX NY4 ?" },
                { label: "🛡️ Marge de Drawdown", text: "Pouvez-vous confirmer la marge de drawdown restant disponible aujourd'hui ?" },
                { label: "📈 Bilan 7 jours", text: "Quel est le bilan consolidé des gains générés par les robots sur 7 jours ?" },
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(p.text)}
                  className="rounded-lg border border-white/[0.06] bg-[#12161f] hover:border-[#00D084]/40 hover:bg-[#00D084]/10 px-3 py-1.5 text-xs text-gray-300 hover:text-white transition shrink-0 cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-5 space-y-4 overflow-y-auto bg-black/20 max-h-[380px]">
            {messages.map((m) => {
              const isMe = m.sender === "user";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed ${
                      isMe
                        ? "rounded-tr-sm bg-[#00D084]/15 border border-[#00D084]/35 text-white"
                        : "rounded-tl-sm bg-[#141a23] border border-white/[0.08] text-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1.5 border-b border-white/[0.04] pb-1.5">
                      <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                        {!isMe && <span className="size-1.5 rounded-full bg-[#00D084]" />}
                        {m.senderName}
                      </span>
                      <span className="font-mono text-[10px] text-gray-400">{m.time}</span>
                    </div>

                    <p className="whitespace-pre-line text-gray-100 font-medium">
                      {m.text}
                    </p>

                    {!isMe && (
                      <div className="mt-2.5 border-t border-white/[0.04] pt-1.5 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setReplyingTo(m);
                            toast.info(`Citation prête pour ${m.senderName}.`);
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold text-[#00D084] hover:underline cursor-pointer"
                        >
                          <Send className="size-3" /> Répondre
                        </button>

                        <button
                          onClick={() => handleQuickPrompt("Merci, bien reçu.")}
                          className="rounded border border-white/[0.06] bg-black/40 px-2 py-0.5 text-[10px] font-mono text-gray-300 hover:text-white cursor-pointer"
                        >
                          ✓ Acquitter
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                <span className="size-1.5 rounded-full bg-[#00D084] animate-bounce" />
                <span className="size-1.5 rounded-full bg-[#00D084] animate-bounce [animation-delay:0.2s]" />
                <span className="size-1.5 rounded-full bg-[#00D084] animate-bounce [animation-delay:0.4s]" />
                Le Desk rédige une réponse...
              </div>
            )}
          </div>

          {/* Replying Banner */}
          {replyingTo && (
            <div className="bg-[#0c1017] border-t border-white/[0.06] px-5 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 truncate text-gray-300">
                <span className="font-bold text-[#00D084]">Réponse à {replyingTo.senderName} :</span>
                <span className="truncate text-gray-400 italic">"{replyingTo.text.slice(0, 50)}..."</span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-gray-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* Chat Input */}
          <form onSubmit={handleChatSubmit} className="border-t border-white/[0.06] bg-[#10141b] p-3.5 flex gap-2.5">
            <input
              type="text"
              placeholder="Écrivez un message au Desk Quant..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 rounded-xl border border-white/[0.08] bg-[#0c1017] px-4 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-[#00D084]"
            />
            <button
              type="submit"
              className="neon-btn rounded-xl px-5 font-bold text-xs uppercase tracking-wider text-black cursor-pointer flex items-center gap-1.5"
            >
              <Send className="size-3.5" />
              ENVOYER
            </button>
          </form>
        </section>
      )}

      {/* ========================================================================= */}
      {/* CANAL 2: APPEL AUDIO DIRECT */}
      {/* ========================================================================= */}
      {activeChannel === "call" && (
        <section className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6 shadow-md">
          {callState === "IDLE" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black text-white">Ligne Téléphonique Directe MT5</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Appelez directement un responsable sur ligne chiffrée.
                </p>
              </div>

              {/* Agent selector cards */}
              <div className="grid gap-3.5 md:grid-cols-3">
                {[
                  {
                    name: "Dr. Antoine R.",
                    role: "Directeur Recherche Quantitative",
                    avatar: "AR",
                    phoneExt: "Ligne directe : +1 (212) 892-0144 · #104",
                    status: "Disponible",
                  },
                  {
                    name: "Sarah Benali",
                    role: "Responsable Risk Governance",
                    avatar: "SB",
                    phoneExt: "Ligne directe : +1 (212) 892-0144 · #108",
                    status: "Disponible",
                  },
                  {
                    name: "Marc Lindberg",
                    role: "Ingénieur Datacenter Equinix NY4",
                    avatar: "ML",
                    phoneExt: "Ligne directe : +1 (212) 892-0144 · #112",
                    status: "En ligne",
                  },
                ].map((agent) => {
                  const isSelected = selectedAgent.name === agent.name;
                  return (
                    <div
                      key={agent.name}
                      onClick={() => setSelectedAgent(agent)}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-[#00D084] bg-[#00D084]/10 shadow-md ring-1 ring-[#00D084]"
                          : "border-white/[0.08] bg-[#0c1017] hover:border-white/[0.15]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="grid size-11 place-items-center rounded-xl bg-white/[0.08] font-mono text-sm font-black text-white">
                            {agent.avatar}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white">{agent.name}</h4>
                            <p className="text-xs text-gray-400">{agent.role}</p>
                          </div>
                        </div>

                        <div className="mt-3.5 border-t border-white/[0.06] pt-2.5 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 text-[#00D084] font-medium text-[11px]">
                            <span className="size-1.5 rounded-full bg-[#00D084] animate-pulse" />
                            {agent.status}
                          </div>
                          <p className="text-[10px] text-gray-400 font-mono">{agent.phoneExt}</p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startAudioCall(agent);
                        }}
                        className="neon-btn mt-4 w-full rounded-xl py-2.5 text-xs font-black uppercase tracking-wider text-black cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Phone className="size-3.5" />
                        APPELER
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ACTIVE CALL SCREEN */}
          {(callState === "CALLING" || callState === "CONNECTED" || callState === "ENDED") && (
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#080b0f] p-6 min-h-[420px] flex flex-col justify-between items-center text-center">
              <div className="flex items-center gap-2 rounded-full border border-white/[0.1] bg-black/40 px-3.5 py-1 text-[11px] font-mono text-gray-300">
                <Lock className="size-3 text-[#00D084]" />
                Ligne Chiffrée 256-bit MT5 · Equinix NY4
              </div>

              <div className="my-auto space-y-4">
                <div className="relative mx-auto size-24 sm:size-28">
                  <div className="grid size-full place-items-center rounded-2xl border-2 border-[#00D084] bg-[#10141b] text-2xl sm:text-3xl font-black text-white shadow-[0_0_30px_rgba(0,208,132,0.2)]">
                    {selectedAgent.avatar}
                  </div>
                  {callState === "CONNECTED" && (
                    <span className="absolute -bottom-1 -right-1 size-7 rounded-full bg-[#00D084] border-2 border-[#080b0f] grid place-items-center text-black font-black text-xs">
                      <Phone className="size-3.5" />
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">{selectedAgent.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-300 mt-0.5">{selectedAgent.role}</p>
                </div>

                {callState === "CALLING" && (
                  <div className="flex items-center justify-center gap-2 text-sm text-sky-400 font-mono animate-pulse">
                    <PhoneIncoming className="size-4 animate-bounce" />
                    Sonnerie en cours...
                  </div>
                )}

                {callState === "CONNECTED" && (
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-xl bg-[#00D084]/15 border border-[#00D084]/30 px-4 py-1.5 font-mono text-sm font-black text-[#00D084]">
                      <span className="size-2 rounded-full bg-[#00D084] animate-ping" />
                      {formatDuration(callDuration)}
                    </div>

                    {/* Audio Waveform */}
                    <div className="flex items-center justify-center gap-1.5 h-6">
                      {[10, 24, 16, 28, 14, 26, 18, 12, 22, 15].map((h, i) => (
                        <div
                          key={i}
                          className="w-1 bg-[#00D084] rounded-full animate-pulse"
                          style={{
                            height: `${h}px`,
                            animationDuration: `${0.4 + (i % 4) * 0.2}s`,
                          }}
                        />
                      ))}
                    </div>

                    {dialedDigits && (
                      <p className="text-xs text-amber-400 font-mono">
                        Touches : <strong>{dialedDigits}</strong>
                      </p>
                    )}
                  </div>
                )}

                {callState === "ENDED" && (
                  <div className="text-sm font-bold text-rose-400">
                    Appel téléphonique terminé.
                  </div>
                )}
              </div>

              {/* Keypad popup */}
              {showKeypad && (
                <div className="my-2 rounded-xl border border-white/[0.08] bg-[#10141b] p-3.5 shadow-xl">
                  <div className="grid grid-cols-3 gap-2">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((d) => (
                      <button
                        key={d}
                        onClick={() => handleKeypadPress(d)}
                        className="rounded-lg border border-white/[0.08] bg-[#141a23] hover:bg-[#00D084]/20 hover:text-[#00D084] size-10 font-mono font-bold text-white transition cursor-pointer text-sm"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Call Controls */}
              <div className="flex items-center justify-center gap-4 border-t border-white/[0.08] pt-4 w-full max-w-md">
                <button
                  onClick={() => setIsMuted((prev) => !prev)}
                  className={`grid size-11 place-items-center rounded-xl border transition cursor-pointer ${
                    isMuted
                      ? "border-rose-500/50 bg-rose-500/20 text-rose-400"
                      : "border-white/[0.1] bg-[#141a23] text-white hover:bg-white/[0.1]"
                  }`}
                >
                  {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                </button>

                <button
                  onClick={() => setIsSpeakerOn((prev) => !prev)}
                  className={`grid size-11 place-items-center rounded-xl border transition cursor-pointer ${
                    !isSpeakerOn
                      ? "border-amber-500/50 bg-amber-500/20 text-amber-400"
                      : "border-white/[0.1] bg-[#141a23] text-white hover:bg-white/[0.1]"
                  }`}
                >
                  {isSpeakerOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
                </button>

                <button
                  onClick={() => setShowKeypad((prev) => !prev)}
                  className={`grid size-11 place-items-center rounded-xl border transition cursor-pointer ${
                    showKeypad
                      ? "border-[#00D084] bg-[#00D084]/20 text-[#00D084]"
                      : "border-white/[0.1] bg-[#141a23] text-white hover:bg-white/[0.1]"
                  }`}
                >
                  <Sliders className="size-5" />
                </button>

                <button
                  onClick={endCall}
                  className="grid size-11 place-items-center rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md transition cursor-pointer"
                >
                  <PhoneOff className="size-5" />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* CANAL 3: E-MAIL SÉCURISÉ */}
      {/* ========================================================================= */}
      {activeChannel === "email" && (
        <section className="grid gap-5 xl:grid-cols-[300px_1fr]">
          {/* Email Sidebar */}
          <article className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-4.5 shadow-md flex flex-col justify-between space-y-3.5">
            <div className="space-y-3.5">
              <button
                onClick={() => setEmailFolder("compose")}
                className="neon-btn w-full rounded-xl py-3 text-xs font-black uppercase tracking-wider text-black cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <Plus className="size-3.5" />
                RÉDIGER UN E-MAIL
              </button>

              {/* Folder Buttons */}
              <div className="space-y-1">
                <button
                  onClick={() => setEmailFolder("inbox")}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer ${
                    emailFolder === "inbox"
                      ? "bg-white/[0.1] text-white font-black"
                      : "text-gray-400 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Inbox className="size-3.5 text-[#00D084]" />
                    Boîte de réception
                  </span>
                  <span className="font-mono text-[11px] text-gray-300">
                    {emails.filter((e) => e.folder === "inbox").length}
                  </span>
                </button>

                <button
                  onClick={() => setEmailFolder("sent")}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer ${
                    emailFolder === "sent"
                      ? "bg-white/[0.1] text-white font-black"
                      : "text-gray-400 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Send className="size-3.5 text-sky-400" />
                    Messages envoyés
                  </span>
                  <span className="font-mono text-[11px] text-gray-300">
                    {emails.filter((e) => e.folder === "sent").length}
                  </span>
                </button>
              </div>

              {/* Email List */}
              <div className="border-t border-white/[0.06] pt-3 space-y-2">
                <span className="text-[10px] font-black uppercase text-gray-400">
                  {emailFolder === "sent" ? "Messages envoyés" : "Messages reçus"}
                </span>

                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {emails
                    .filter((e) => (emailFolder === "sent" ? e.folder === "sent" : e.folder === "inbox"))
                    .map((item) => {
                      const isSelected = selectedEmail?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedEmail(item);
                            setEmailFolder(item.folder);
                          }}
                          className={`cursor-pointer rounded-xl border p-2.5 transition-all ${
                            isSelected
                              ? "border-[#00D084]/60 bg-[#00D084]/15"
                              : "border-white/[0.04] bg-[#0c1017] hover:border-white/[0.1]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white truncate max-w-[150px]">
                              {item.fromName}
                            </span>
                            <span className="font-mono text-[10px] text-gray-400">{item.date.split("·")[1] ?? item.date}</span>
                          </div>
                          <p className="text-[11px] font-medium text-gray-200 mt-0.5 truncate">{item.subject}</p>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.04] bg-[#080b0f] p-2.5 text-[11px] text-gray-400 font-mono">
              Serveur : <strong className="text-white">mail.nexiummarkets.com</strong>
            </div>
          </article>

          {/* Email View or Compose View */}
          <article className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6 shadow-md flex flex-col justify-between min-h-[480px]">
            {emailFolder === "compose" ? (
              /* COMPOSE FORM */
              <form onSubmit={handleSendEmail} className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <h3 className="font-bold text-base text-white">Rédiger un e-mail officiel</h3>
                  <span className="rounded-full border border-[#00D084]/30 bg-[#00D084]/10 px-2.5 py-0.5 text-[10px] font-mono text-[#00D084] font-bold">
                    CANAL SÉCURISÉ
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                      DESTINATAIRE
                    </label>
                    <select
                      value={composeTo}
                      onChange={(e) => setComposeTo(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#0c1017] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#00D084]"
                    >
                      <option value="desk-quant@nexiummarkets.com">desk-quant@nexiummarkets.com (Recherche)</option>
                      <option value="risk-governor@nexiummarkets.com">risk-governor@nexiummarkets.com (Risque)</option>
                      <option value="support-vip@nexiummarkets.com">support-vip@nexiummarkets.com (VIP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                      PRIORITÉ
                    </label>
                    <select
                      value={composePriority}
                      onChange={(e) => setComposePriority(e.target.value as any)}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#0c1017] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#00D084]"
                    >
                      <option value="NORMAL">Normal (1h)</option>
                      <option value="URGENT">Urgent (15 min)</option>
                      <option value="CRITIQUE">Critique (Immédiat)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                    OBJET DU MESSAGE
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Demande d'ajustement de lot..."
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0c1017] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#00D084]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                    CORPS DU MESSAGE
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Rédigez votre demande ici..."
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0c1017] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#00D084] resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 border-t border-white/[0.06] pt-3">
                  <button
                    type="button"
                    onClick={() => setEmailFolder("inbox")}
                    className="rounded-xl border border-white/[0.08] bg-[#0c1017] px-4 py-2 text-xs font-bold text-gray-400 hover:text-white cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="neon-btn rounded-xl px-5 py-2 text-xs font-black uppercase tracking-wider text-black cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="size-3.5" />
                    ENVOYER L'E-MAIL
                  </button>
                </div>
              </form>
            ) : selectedEmail ? (
              /* EMAIL DETAIL VIEW */
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                    <div>
                      <h3 className="font-bold text-base text-white">{selectedEmail.subject}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                        <span>De : <strong className="text-white">{selectedEmail.fromName}</strong> ({selectedEmail.from})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-400">{selectedEmail.date}</span>
                      <span className="rounded border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                        {selectedEmail.priority}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2.5 text-xs sm:text-sm text-gray-200 leading-relaxed font-medium">
                    {selectedEmail.body.map((par, i) => (
                      <p key={i}>{par}</p>
                    ))}
                  </div>

                  {/* Attachments if any */}
                  {selectedEmail.hasAttachment && (
                    <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#080b0f] p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Paperclip className="size-4 text-[#00D084]" />
                        <div>
                          <p className="font-bold text-xs text-white">rapport-arbitrage-xauusd-ny4.pdf</p>
                          <p className="text-[10px] text-gray-400 font-mono">1.4 MB · Signé numériquement</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toast.success("Téléchargement du rapport PDF en cours...")}
                        className="rounded-lg border border-white/[0.08] bg-[#141a23] px-3 py-1.5 text-xs font-bold text-[#00D084] hover:bg-[#1a2330] transition cursor-pointer"
                      >
                        Télécharger
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setComposeTo(selectedEmail.from);
                      setComposeSubject(`Re: ${selectedEmail.subject}`);
                      setEmailFolder("compose");
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#00D084] hover:underline cursor-pointer"
                  >
                    <Send className="size-3.5" />
                    Répondre à cet e-mail
                  </button>
                  <span className="text-[10px] text-gray-500 font-mono">ID: {selectedEmail.id}</span>
                </div>
              </div>
            ) : (
              <div className="my-auto text-center text-gray-400 text-xs">
                Sélectionnez un e-mail à gauche pour en afficher le contenu.
              </div>
            )}
          </article>
        </section>
      )}
    </div>
  );
}

// ----------------------------------------------------
// MAIN DASHBOARD COMPONENT
// ----------------------------------------------------
function NexiumDashboard() {
  const [running, setRunning] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Moteur");
  const [balance, setBalance] = useState(24860.42);

  // States
  const [bots, setBots] = useState<EngineBot[]>(INITIAL_BOTS);
  const [positions, setPositions] = useState<PositionItem[]>(INITIAL_POSITIONS);
  const [transactions, setTransactions] = useState<TransactionItem[]>(INITIAL_TRANSACTIONS);
  const [journal, setJournal] = useState<JournalEntry[]>(INITIAL_JOURNAL);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);

  // Modals & Detail Views
  const [selectedDetailBot, setSelectedDetailBot] = useState<EngineBot | null>(null);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("1000");
  const [depositMethod, setDepositMethod] = useState("Virement SEPA");

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("500");
  const [withdrawIban, setWithdrawIban] = useState("FR76 3000 4000 5000 6000 7000 123");

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  // Alerts State
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([
    { id: "alt-1", symbol: "XAUUSD", targetPrice: 2400.00, condition: "ABOVE", triggered: false, createdAt: "14:10" },
    { id: "alt-2", symbol: "NAS100", targetPrice: 19800.00, condition: "BELOW", triggered: false, createdAt: "13:45" },
  ]);
  const [newAlertSymbol, setNewAlertSymbol] = useState("XAUUSD");
  const [newAlertPrice, setNewAlertPrice] = useState("2395.00");

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(newAlertPrice);
    if (isNaN(p) || p <= 0) return;
    const newAlt: PriceAlert = {
      id: `alt-${Date.now()}`,
      symbol: newAlertSymbol,
      targetPrice: p,
      condition: "ABOVE",
      triggered: false,
      createdAt: new Date().toLocaleTimeString().slice(0, 5),
    };
    setPriceAlerts((prev) => [newAlt, ...prev]);
    toast.success(`Alerte de prix créée pour ${newAlertSymbol} à $${p.toFixed(2)}.`);
  };

  const navItems: ReadonlyArray<readonly [React.ComponentType<{ className?: string }>, string]> = [
    [LayoutDashboard, "Vue d’ensemble"],
    [Bot, "Moteur"],
    [CandlestickChart, "Stratégies"],
    [ShieldCheck, "Risque"],
    [Wallet, "Portefeuille"],
    [Database, "Télémétrie"],
    [FileText, "Journal"],
    [MessageCircle, "Messagerie"],
  ];

  // Actions
  const handleToggleEngine = () => {
    setRunning((prev) => {
      const next = !prev;
      if (next) {
        toast.success("Moteurs MT5 activés. Les 3 bots surveillent leurs marchés.");
      } else {
        toast.warning("Moteurs MT5 mis en pause. Aucune nouvelle prise d'ordre.");
      }
      return next;
    });
  };

  const handleToggleBotPause = (botId: EngineBot["id"]) => {
    setBots((prev) =>
      prev.map((b) => {
        if (b.id === botId) {
          const nextState = b.statusBadge === "ACTIF" ? "EN PAUSE" : "ACTIF";
          toast.info(`Moteur ${b.name} : ${nextState}.`);
          return {
            ...b,
            statusBadge: nextState as any,
            mainState: nextState === "ACTIF" ? "RUNNING" : ("RISK BLOCKED" as any),
          };
        }
        return b;
      })
    );
  };

  const handleClosePosition = (pos: PositionItem) => {
    setPositions((prev) => prev.filter((p) => p.id !== pos.id));
    setBalance((prev) => prev + pos.pnlNum);

    const now = new Date().toLocaleTimeString();
    const newTx: TransactionItem = {
      id: `tx-${Date.now()}`,
      date: `Aujourd'hui · ${now.slice(0, 5)}`,
      type: "Clôture position",
      amount: pos.pnl,
      amountNum: pos.pnlNum,
      currency: "USD",
      status: "Confirmé",
      method: `${pos.strategy} (${pos.symbol})`,
      color: pos.pnlNum >= 0 ? "#00D084" : "#f43f5e",
    };
    setTransactions((prev) => [newTx, ...prev]);

    const newJ: JournalEntry = {
      id: `j-${Date.now()}`,
      time: now,
      event: "POSITION_MANUAL_CLOSE",
      symbol: pos.symbol,
      detail: `Ticket ${pos.ticket} (${pos.strategy}) clôturé au marché. Résultat net : ${pos.pnl}.`,
      status: "CLÔTURÉ",
      statusVariant: "purple",
    };
    setJournal((prev) => [newJ, ...prev]);

    toast.success(`Position ${pos.symbol} (${pos.ticket}) clôturée : ${pos.pnl}.`);
  };

  const handleEmergencyHalt = () => {
    const totalPnl = positions.reduce((acc, p) => acc + p.pnlNum, 0);
    setBalance((prev) => prev + totalPnl);
    setPositions([]);
    setRunning(false);

    const now = new Date().toLocaleTimeString();
    const newJ: JournalEntry = {
      id: `j-${Date.now()}`,
      time: now,
      event: "EMERGENCY_KILL_SWITCH",
      detail: "Coupe-circuit d'urgence activé. Toutes les positions ont été liquidées et les 3 moteurs sont en veille.",
      status: "ALERTE",
      statusVariant: "amber",
    };
    setJournal((prev) => [newJ, ...prev]);

    toast.error("Coupe-circuit activé ! Toutes les positions sont fermées et les moteurs sont en pause.");
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val <= 0) {
      toast.error("Veuillez saisir un montant valide.");
      return;
    }
    setBalance((prev) => prev + val);
    const now = new Date().toLocaleTimeString();
    const newTx: TransactionItem = {
      id: `tx-${Date.now()}`,
      date: `Aujourd'hui · ${now.slice(0, 5)}`,
      type: "Dépôt validé",
      amount: `+$${val.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}`,
      amountNum: val,
      currency: "USD",
      status: "Confirmé",
      method: depositMethod,
      color: "#00D084",
    };
    setTransactions((prev) => [newTx, ...prev]);
    setDepositOpen(false);
    toast.success(`Dépôt de $${val.toFixed(2)} crédité avec succès.`);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(withdrawAmount);
    if (isNaN(val) || val <= 0) {
      toast.error("Veuillez saisir un montant valide.");
      return;
    }
    if (val > balance) {
      toast.error("Fonds insuffisants.");
      return;
    }
    setBalance((prev) => prev - val);
    const now = new Date().toLocaleTimeString();
    const newTx: TransactionItem = {
      id: `tx-${Date.now()}`,
      date: `Aujourd'hui · ${now.slice(0, 5)}`,
      type: "Retrait traité",
      amount: `-$${val.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}`,
      amountNum: -val,
      currency: "USD",
      status: "Confirmé",
      method: "Virement SEPA / SWIFT",
      color: "#f43f5e",
    };
    setTransactions((prev) => [newTx, ...prev]);
    setWithdrawOpen(false);
    toast.success(`Retrait de $${val.toFixed(2)} ordonné.`);
  };

  const handleSendMessage = (text: string) => {
    const now = new Date().toLocaleTimeString().slice(0, 5);
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      senderName: "Ludovic M.",
      text,
      time: now,
    };
    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      let replyText = "Votre demande est bien reçue par l'équipe technique MT5.";
      if (text.toLowerCase().includes("or") || text.toLowerCase().includes("gold")) {
        replyText = "Nexium AI Gold tourne actuellement sur XAUUSD avec 1 position BUY en cours et un score de signal de 84/100.";
      } else if (text.toLowerCase().includes("forex") || text.toLowerCase().includes("trend")) {
        replyText = "Nexium FX Trend surveille EURUSD, GBPUSD et USDJPY avec 2 positions ouvertes.";
      } else if (text.toLowerCase().includes("indice") || text.toLowerCase().includes("reversion")) {
        replyText = "Nexium Index Reversion est en veille active de setup sur NAS100 et US30.";
      }
      const deskMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "desk",
        senderName: "Nexium Desk Institutionnel",
        text: replyText,
        time: new Date().toLocaleTimeString().slice(0, 5),
      };
      setMessages((prev) => [...prev, deskMsg]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0b0d10] text-gray-100 font-sans selection:bg-[#00D084]/30">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-76 flex-col border-r border-white/[0.08] bg-[#0c1017] p-6 sm:p-7 transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Link to="/" className="group flex flex-col justify-center py-1 leading-none cursor-pointer">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-2xl font-black tracking-[0.22em] text-white uppercase group-hover:text-[#00D084] transition-colors">
                NEXIUM
              </span>
              <span className="h-4 w-px bg-gradient-to-b from-[#00D084] to-transparent" />
              <span className="text-xs font-extrabold tracking-[0.3em] text-[#00D084] uppercase">
                MARKETS
              </span>
            </div>
            <span className="mt-1.5 font-sans text-[9px] font-extrabold tracking-[0.35em] text-gray-400 uppercase">
              AI CONTROL CENTER
            </span>
          </Link>

          <button
            className="lg:hidden p-1 text-gray-400 hover:text-white"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Account Info */}
        <div className="mt-7 rounded-2xl border border-white/[0.08] bg-[#10141b] p-4 sm:p-5">
          <p className="text-xs font-black tracking-wider text-gray-400 uppercase">COMPTE CONNECTÉ</p>
          <p className="mt-1 text-base font-black text-white font-mono">Nexium Live · #802194</p>
          <div className="mt-2.5 flex items-center gap-2 text-xs font-bold text-[#00D084]">
            <Wifi className="size-4" /> Equinix NY4 · 21 ms (0% Perte)
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-7 space-y-1.5 flex-1 overflow-y-auto pr-1">
          {navItems.map(([Icon, label]) => {
            const isActive = activeNav === label;
            return (
              <button
                key={label}
                onClick={() => {
                  setActiveNav(label);
                  setMobileOpen(false);
                }}
                className={`flex w-full items-center gap-3.5 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? "border border-[#00D084]/40 bg-[#00D084]/15 text-white font-black shadow-[0_0_15px_rgba(0,208,132,0.12)]"
                    : "text-gray-300 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon className={`size-4.5 ${isActive ? "text-[#00D084]" : "text-gray-400"}`} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto border-t border-white/[0.06] pt-4 space-y-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-gray-400 hover:bg-white/[0.04] hover:text-white transition cursor-pointer"
          >
            <Settings className="size-4" />
            Paramètres du Terminal
          </button>
          <Link
            to="/"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-gray-400 hover:bg-white/[0.04] hover:text-white transition cursor-pointer"
          >
            <ExternalLink className="size-4 text-[#00D084]" />
            Retour au Site Public
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-76 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/[0.08] bg-[#0b0d10]/95 px-6 sm:px-8 backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1 text-gray-400 hover:text-white cursor-pointer"
              aria-label="Ouvrir le menu"
            >
              <Menu className="size-6" />
            </button>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-gray-400 font-mono">
                NEXIUM MARKETS / {activeNav.toUpperCase()}
              </p>
              <h1 className="mt-0.5 text-base sm:text-xl font-black text-white">
                {activeNav === "Vue d’ensemble" && "Pilotage & Performances Globales"}
                {activeNav === "Moteur" && "Moteurs de trading · AI Control Center"}
                {activeNav === "Stratégies" && "Catalogue des Stratégies Certifiées"}
                {activeNav === "Risque" && "Gouvernance & Coupe-circuit du Risque"}
                {activeNav === "Portefeuille" && "Gestion Financière & Relevés"}
                {activeNav === "Télémétrie" && "Télémétrie FIX & Infrastructure"}
                {activeNav === "Journal" && "Journal d'Audit & Traçabilité"}
                {activeNav === "Messagerie" && "Messagerie & Support Quant 24/7"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setAlertsOpen(true)}
              title="Centre d'alertes de prix"
              className="relative rounded-xl border border-white/[0.08] bg-[#141a23] p-2.5 text-gray-300 hover:text-white transition cursor-pointer"
            >
              <Bell className="size-4" />
              {priceAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-[#00D084] text-black font-mono font-black text-[9px] grid place-items-center">
                  {priceAlerts.length}
                </span>
              )}
            </button>

            <StatusPill variant="emerald">3 BOTS CONNECTÉS</StatusPill>
            <button
              onClick={() => setDepositOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#141a23] px-4 py-2 text-sm font-mono font-black text-[#00D084] hover:bg-[#1a2330] transition cursor-pointer"
            >
              ${balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} USD
            </button>
            <div className="grid size-10 place-items-center rounded-xl border border-white/[0.1] bg-[#141a23] text-sm font-black text-white">
              LM
            </div>
          </div>
        </header>

        {/* Tab Body */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-[1650px] w-full mx-auto">
          {activeNav === "Moteur" && (
            <EngineTab
              bots={bots}
              positions={positions}
              onOpenBotDetail={(bot) => setSelectedDetailBot(bot)}
              onToggleBotPause={handleToggleBotPause}
              onClosePosition={handleClosePosition}
            />
          )}

          {activeNav === "Vue d’ensemble" && (
            <OverviewTab
              balance={balance}
              running={running}
              onToggleRunning={handleToggleEngine}
              bots={bots}
              positions={positions}
              onClosePosition={handleClosePosition}
              onOpenDeposit={() => setDepositOpen(true)}
              onOpenWithdraw={() => setWithdrawOpen(true)}
              onOpenEngine={() => setActiveNav("Moteur")}
              onOpenRisk={() => setActiveNav("Risque")}
            />
          )}

          {activeNav === "Stratégies" && (
            <StrategiesTab
              bots={bots}
              onOpenBotDetail={(bot) => setSelectedDetailBot(bot)}
            />
          )}

          {activeNav === "Risque" && (
            <RiskTab
              balance={balance}
              positions={positions}
              onEmergencyHalt={handleEmergencyHalt}
            />
          )}

          {activeNav === "Portefeuille" && (
            <PortfolioTab
              balance={balance}
              transactions={transactions}
              onOpenDeposit={() => setDepositOpen(true)}
              onOpenWithdraw={() => setWithdrawOpen(true)}
            />
          )}

          {activeNav === "Télémétrie" && <TelemetryTab />}

          {activeNav === "Journal" && <JournalTab journal={journal} />}

          {activeNav === "Messagerie" && (
            <MessagingTab
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          )}
        </main>
      </div>

      {/* MODAL CENTRE D'ALERTES DE PRIX (NOUVELLE FONCTIONNALITÉ) */}
      {alertsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/[0.1] bg-[#10141b] p-7 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2.5">
                <Bell className="size-5 text-[#00D084]" />
                <h3 className="font-black text-xl text-white">Alertes de Marché MT5</h3>
              </div>
              <button onClick={() => setAlertsOpen(false)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <X className="size-5" />
              </button>
            </div>

            {/* List of active price alerts */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {priceAlerts.map((alt) => (
                <div
                  key={alt.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0c1017] p-3 text-xs sm:text-sm font-mono"
                >
                  <div>
                    <span className="font-bold text-white">{alt.symbol}</span>
                    <span className="text-gray-400"> {alt.condition === "ABOVE" ? ">" : "<"} ${alt.targetPrice.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => {
                      setPriceAlerts((prev) => prev.filter((a) => a.id !== alt.id));
                      toast.info(`Alerte ${alt.symbol} supprimée.`);
                    }}
                    className="text-gray-500 hover:text-rose-400 p-1 cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new alert form */}
            <form onSubmit={handleAddAlert} className="space-y-3 border-t border-white/[0.06] pt-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">ACTIF</label>
                  <select
                    value={newAlertSymbol}
                    onChange={(e) => setNewAlertSymbol(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0c1017] px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-[#00D084]"
                  >
                    <option value="XAUUSD">XAUUSD (Or)</option>
                    <option value="EURUSD">EURUSD (Forex)</option>
                    <option value="NAS100">NAS100 (Nasdaq)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">PRIX CIBLE</label>
                  <input
                    type="number"
                    step="any"
                    value={newAlertPrice}
                    onChange={(e) => setNewAlertPrice(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0c1017] px-3 py-2 font-mono text-xs sm:text-sm text-white outline-none focus:border-[#00D084]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="neon-btn w-full rounded-xl py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-black cursor-pointer"
              >
                CRÉER L'ALERTE
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 12. MODAL VUE DÉTAILLÉE DU BOT (VOIR LE MOTEUR) */}
      {selectedDetailBot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/[0.1] bg-[#10141b] p-7 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-white/[0.06] pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-black text-[#00D084] uppercase">
                    FICHE TECHNIQUE MOTEUR · {selectedDetailBot.version}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white mt-1">{selectedDetailBot.name}</h3>
                <p className="text-sm text-gray-300 font-medium">{selectedDetailBot.specialty} · {selectedDetailBot.markets}</p>
              </div>

              <button
                onClick={() => setSelectedDetailBot(null)}
                className="text-gray-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="size-6" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-white/[0.06] bg-[#0c1017] p-3.5 text-center">
                <span className="text-xs font-black text-gray-400 uppercase">ÉTAT</span>
                <p className="mt-1 font-mono text-base font-black text-[#00D084]">{selectedDetailBot.statusBadge}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-[#0c1017] p-3.5 text-center">
                <span className="text-xs font-black text-gray-400 uppercase">HEARTBEAT</span>
                <p className="mt-1 font-mono text-base font-black text-white">{selectedDetailBot.heartbeatSec}s</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-[#0c1017] p-3.5 text-center">
                <span className="text-xs font-black text-gray-400 uppercase">P&amp;L JOUR</span>
                <p className="mt-1 font-mono text-base font-black text-[#00D084]">{selectedDetailBot.pnlToday}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-[#0c1017] p-3.5 text-center">
                <span className="text-xs font-black text-gray-400 uppercase">UPTIME</span>
                <p className="mt-1 font-mono text-xs font-black text-sky-400">{selectedDetailBot.uptime}</p>
              </div>
            </div>

            {/* Strategy & Market Regime */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#0c1017] p-5 space-y-2.5 text-sm text-gray-300">
              <p className="font-bold text-white">Paramètres Quantitatifs du Robot :</p>
              <p>• Stratégie active : <strong>{selectedDetailBot.strategy}</strong></p>
              <p>• Régime de marché analysé : <strong className="text-[#00D084]">{selectedDetailBot.marketRegime}</strong> ({selectedDetailBot.regimeDetail})</p>
              <p>• Volatilité actuelle : <strong>{selectedDetailBot.volatility}</strong></p>
              <p>• Allocation de risque : <strong>{selectedDetailBot.risk.allocation}</strong> (Drawdown actuel : {selectedDetailBot.risk.drawdown})</p>
            </div>

            {/* Decision Pipeline Breakdown */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#0c1017] p-5">
              <span className="text-xs font-black uppercase tracking-wider text-gray-400">PIPELINE DE SIGNAL</span>
              <div className="mt-3 flex flex-wrap items-center gap-2.5 font-mono text-xs sm:text-sm">
                <span className="rounded-lg bg-black/40 px-3 py-1.5 text-gray-300">Market Data: ✓</span>
                <span className="rounded-lg bg-black/40 px-3 py-1.5 text-gray-300">Regime: ✓</span>
                <span className="rounded-lg bg-black/40 px-3 py-1.5 text-gray-300">Strategy: ✓</span>
                <span className="rounded-lg bg-black/40 px-3 py-1.5 text-[#00D084]">Score: {selectedDetailBot.lastScore}</span>
                <span className="rounded-lg bg-black/40 px-3 py-1.5 text-[#00D084]">Action: {selectedDetailBot.lastDecision.action}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3.5 pt-2">
              <button
                onClick={() => {
                  handleToggleBotPause(selectedDetailBot.id);
                  setSelectedDetailBot(null);
                }}
                className="flex-1 rounded-2xl border border-white/[0.08] bg-[#141a23] py-3.5 text-xs sm:text-sm font-bold text-white hover:bg-[#1a2330] transition cursor-pointer"
              >
                {selectedDetailBot.statusBadge === "ACTIF" ? "PAUSE NOUVELLES ENTRÉES" : "REPRENDRE LE MOTEUR"}
              </button>
              <button
                onClick={() => {
                  setSelectedDetailBot(null);
                  setActiveNav("Journal");
                }}
                className="neon-btn flex-1 rounded-2xl py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-black transition cursor-pointer"
              >
                VOIR LE JOURNAL DÉCISIONNEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DÉPÔT MODAL */}
      {depositOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#10141b] p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <h3 className="font-black text-xl text-white">Déposer des fonds</h3>
              <button onClick={() => setDepositOpen(false)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">MONTANT DU DÉPÔT (USD)</label>
                <input
                  type="number"
                  step="any"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full rounded-2xl border border-white/[0.08] bg-black/40 px-4 py-3.5 font-mono text-2xl font-bold text-white outline-none focus:border-[#00D084]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {["500", "1000", "5000"].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className="rounded-xl border border-white/[0.08] bg-[#141a23] py-2.5 text-xs sm:text-sm font-bold text-gray-200 hover:border-[#00D084]/40 transition cursor-pointer"
                  >
                    +${amt}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">MODE DE PAIEMENT SÉCURISÉ</label>
                <select
                  value={depositMethod}
                  onChange={(e) => setDepositMethod(e.target.value)}
                  className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] px-4 py-3 text-xs sm:text-sm text-white outline-none focus:border-[#00D084]"
                >
                  <option value="Virement SEPA">Virement Bancaire SEPA Instantané</option>
                  <option value="Carte ECN">Carte de Débit / Crédit ECN</option>
                  <option value="USDT TRC20">Crypto USDT (TRC20 / ERC20)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setDepositOpen(false)}
                  className="flex-1 rounded-2xl border border-white/[0.08] py-3 text-xs sm:text-sm font-bold text-gray-400 hover:text-white transition cursor-pointer"
                >
                  ANNULER
                </button>
                <button
                  type="submit"
                  className="neon-btn flex-1 rounded-2xl py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-black transition cursor-pointer"
                >
                  CONFIRMER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RETRAIT MODAL */}
      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#10141b] p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <h3 className="font-black text-xl text-white">Demande de Retrait</h3>
              <button onClick={() => setWithdrawOpen(false)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div className="rounded-2xl border border-[#00D084]/20 bg-[#00D084]/10 p-3.5 text-xs sm:text-sm text-gray-300">
                Solde disponible : <strong className="font-mono text-[#00D084] font-black">${balance.toFixed(2)} USD</strong>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">MONTANT DU RETRAIT (USD)</label>
                <input
                  type="number"
                  step="any"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full rounded-2xl border border-white/[0.08] bg-black/40 px-4 py-3.5 font-mono text-2xl font-bold text-white outline-none focus:border-[#00D084]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">COORDONNÉES BANCAIRES (IBAN)</label>
                <input
                  type="text"
                  value={withdrawIban}
                  onChange={(e) => setWithdrawIban(e.target.value)}
                  className="w-full rounded-2xl border border-white/[0.08] bg-black/40 px-4 py-3 font-mono text-xs sm:text-sm text-white outline-none focus:border-[#00D084]"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setWithdrawOpen(false)}
                  className="flex-1 rounded-2xl border border-white/[0.08] py-3 text-xs sm:text-sm font-bold text-gray-400 hover:text-white transition cursor-pointer"
                >
                  ANNULER
                </button>
                <button
                  type="submit"
                  className="neon-btn flex-1 rounded-2xl py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-black transition cursor-pointer"
                >
                  VALIDER LE RETRAIT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#10141b] p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <h3 className="font-black text-xl text-white">Paramètres du Terminal</h3>
              <button onClick={() => setSettingsOpen(false)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="rounded-2xl border border-white/[0.06] bg-[#0c1017] p-4 space-y-2 text-gray-300">
                <p className="font-bold text-white">Informations de Connexion :</p>
                <p>• Serveur : <strong>NexiumMarkets-Live01</strong></p>
                <p>• Login MT5 : <strong>802194</strong></p>
                <p>• Type de compte : <strong>ECN Zero Spread</strong></p>
              </div>

              <button
                onClick={() => {
                  setSettingsOpen(false);
                  toast.success("Paramètres enregistrés.");
                }}
                className="neon-btn mt-4 w-full rounded-2xl py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-black cursor-pointer"
              >
                ENREGISTRER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
