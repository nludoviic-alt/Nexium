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
  Camera,
  CandlestickChart,
  Check,
  CheckCheck,
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
  FileImage,
  FileText,
  Filter,
  Flame,
  Globe2,
  Grid,
  Headphones,
  History,
  Image as ImageIcon,
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
  MoreVertical,
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
  Reply,
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
  Smile,
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
import { TradingViewSuperchart } from "@/components/site/TradingViewSuperchart";

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
  sender: "user" | "desk" | "system" | "expert" | "ai" | "support";
  senderName: string;
  text: string;
  time: string;
  avatar?: string;
  image?: string;
  imageCaption?: string;
  isVoice?: boolean;
  voiceDuration?: string;
  reactions?: { emoji: string; count: number; byMe?: boolean }[];
  status?: "sent" | "delivered" | "read";
  replyTo?: { senderName: string; text: string };
  contactId?: string;
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
    sender: "support",
    senderName: "Elena V. (Support Client 24/7)",
    contactId: "support-client",
    text: "Bonjour Ludovic 👋 Bienvenue sur votre support prioritaire Nexium. Votre compte MT5 ECN #802194 est actif et vérifié. Comment pouvons-nous vous aider aujourd'hui ?",
    time: "14:10",
    status: "read",
  },
  {
    id: "m-2",
    sender: "expert",
    senderName: "Dr. Antoine R. (Expert Quant)",
    contactId: "expert-quant",
    text: "Bonjour Ludovic. La session New York montre un breakout algorithmique de volatilité sur XAUUSD. Le moteur AI Gold a validé le setup à 2 384.20 avec un ratio risque/rendement de 1:2.4. Ci-joint l'analyse graphique du signal.",
    time: "14:22",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1000&auto=format&fit=crop",
    imageCaption: "Graphique Breakout MQL5 — XAUUSD M15 (NY Session)",
    reactions: [{ emoji: "🚀", count: 2, byMe: true }, { emoji: "📈", count: 1 }],
    status: "read",
  },
  {
    id: "m-3",
    sender: "ai",
    senderName: "Nexium Core IA (Assistant Trading)",
    contactId: "ai-bot",
    text: "⚡ Télémétrie en direct :\n• 3 Robots actifs sur serveur Equinix NY4 (Latence : 0.8ms)\n• P&L Journalier cumulé : +$167.30 (+0.67%)\n• Drawdown max enregistré aujourd'hui : 0.34% (Seuil d'alerte : 2.00%)\n\nTous les voyants sont au vert pour la séance.",
    time: "14:28",
    reactions: [{ emoji: "⚡", count: 3, byMe: true }, { emoji: "🛡️", count: 1 }],
    status: "read",
  },
  {
    id: "m-4",
    sender: "desk",
    senderName: "Desk Conformité & Risque",
    contactId: "risk-governance",
    text: "Audit de conformité institutionnelle validé pour votre compte #802194. Vos Stop-Loss sont strictement synchronisés avec le carnet d'ordres ECN.",
    time: "14:30",
    status: "read",
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
  // Preset Selection
  const [activePreset, setActivePreset] = useState<
    "BREAKOUT_GOLD" | "TREND_FX" | "SMC_LIQUIDITY" | "MQL5_SCALPING"
  >("BREAKOUT_GOLD");

  // Simulation State (Start / Stop)
  const [isTradingActive, setIsTradingActive] = useState(true);

  // Presets definition
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

  const handleToggleTrading = () => {
    if (isTradingActive) {
      setIsTradingActive(false);
      toast.warning("Moteur et prises d'ordres mis en PAUSE.");
    } else {
      setIsTradingActive(true);
      toast.success("Moteur et scan IA RÉACTIVÉS en direct !");
    }
  };

  const handleSelectPreset = (presetId: typeof activePreset) => {
    setActivePreset(presetId);
    setIsTradingActive(true);
    toast.info(`Preset "${PRESETS.find((p) => p.id === presetId)?.name}" activé.`);
  };

  return (
    <div className="space-y-4">
      {/* 1. BARRE DE PRESETS & CONTRÔLE STRATÉGIE */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0d1117] p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className={`size-2.5 rounded-full ${isTradingActive ? "bg-[#00D084] animate-ping" : "bg-rose-500"}`} />
            <h3 className="text-base sm:text-lg font-black text-white">
              Stratégie &amp; Presets IA
            </h3>
            <span className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] font-bold text-gray-300">
              {bot.chart.symbol}
            </span>
          </div>

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

        {/* Presets Chips */}
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

      {/* 2. SUPERCHARTS WORKSTATION TRADINGVIEW PIXEL PAR PIXEL */}
      <TradingViewSuperchart
        initialSymbol={bot.id === "nexium-ai-gold" ? "BTCUSD" : "EURUSD"}
        isTradingActive={isTradingActive}
        onToggleTrading={handleToggleTrading}
      />
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
  const [tradingMode, setTradingMode] = useState<"simulation" | "demo" | "live">("demo");
  const [isEngineRunning, setIsEngineRunning] = useState(true);
  const [forcingTrade, setForcingTrade] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<"decision" | "metrics" | "journal">("decision");
  const [logFilter, setLogFilter] = useState<"all" | "won" | "lost" | "open">("all");

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
    }, 1800);
  };

  // 5 Pipeline Stages
  const pipelineStages = useMemo(() => [
    { label: "Marché", icon: Radar, status: "Tick FIX NY4", ok: true },
    { label: "Analyse", icon: Brain, status: "3/3 MTF", ok: isEngineRunning },
    { label: "Risque", icon: Shield, status: "Drawdown < 2%", ok: true },
    { label: "Décision", icon: Cpu, status: `${selectedBot.lastDecision.action} (${selectedBot.lastScore})`, ok: isEngineRunning },
    { label: "Exécution", icon: Zap, status: isEngineRunning ? "Prêt FIX" : "En pause", ok: isEngineRunning },
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
    return true;
  });

  return (
    <div className="space-y-5">
      {/* ── 1. BARRE DE COMMANDE PRINCIPALE (MODERNE, ÉPURÉE, ULTRA-FLUIDE) ── */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#10141b]/95 p-4 sm:p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Titre & Statut */}
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl border border-[#00D084]/40 bg-[#00D084]/15 text-[#00D084] shadow-[0_0_15px_rgba(0,208,132,0.2)]">
              <Cpu className="size-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Centre de Contrôle Moteurs IA
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00D084]/40 bg-[#00D084]/15 px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#00D084]">
                  <span className="size-1.5 rounded-full bg-[#00D084] animate-ping" />
                  NY4 · 11ms
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Supervision algorithmique · MT5 FIX · {activeBots.length} Moteurs actifs
              </p>
            </div>
          </div>

          {/* Mode Selector & Power & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Switcher Segmented */}
            <div className="flex items-center rounded-xl border border-white/[0.08] bg-[#080b0f] p-1 text-xs">
              {(["simulation", "demo", "live"] as const).map((m) => {
                const isSelected = tradingMode === m;
                return (
                  <button
                    key={m}
                    onClick={() => {
                      if (m === "live" && !confirm("Activer le mode LIVE avec capital réel ?")) return;
                      setTradingMode(m);
                      toast.info(`Mode : ${m.toUpperCase()}`);
                    }}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold uppercase transition cursor-pointer ${
                      isSelected
                        ? m === "live"
                          ? "bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-sm"
                          : "bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/40 shadow-sm"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>{m === "simulation" ? "🧪" : m === "demo" ? "🎮" : "⚡"}</span>
                    <span>{m}</span>
                  </button>
                );
              })}
            </div>

            {/* Master Power Toggle Button */}
            <button
              onClick={toggleEnginePower}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md ${
                isEngineRunning
                  ? "border border-[#00D084]/60 bg-[#00D084]/20 text-[#00D084] hover:bg-[#00D084]/30 shadow-[0_0_20px_rgba(0,208,132,0.25)]"
                  : "border border-white/[0.1] bg-[#141a23] text-gray-400 hover:text-white"
              }`}
            >
              <Power className="size-4" />
              <span>{isEngineRunning ? "Moteur Actif" : "En Pause"}</span>
            </button>

            {/* Quick Test Trade Button */}
            <button
              onClick={handleTestTrade}
              disabled={forcingTrade}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#141a23] hover:bg-[#1a2330] px-3.5 py-2 text-xs font-bold text-white transition cursor-pointer shadow-sm"
            >
              <Activity className="size-3.5 text-sky-400" />
              <span>{forcingTrade ? "Exécution..." : "Trade Test"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. CARTES BOTS ACTIFS + INTERRUPTEURS ON/OFF ── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_260px]">
        {/* 2.1 CARTE BOT 1 (GOLD) */}
        {activeBots[0] && (() => {
          const bot = activeBots[0];
          const isSelected = bot.id === selectedBotId;
          return (
            <article
              onClick={() => setSelectedBotId(bot.id)}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all duration-300 flex flex-col justify-between bg-[#0b0e14] bg-[radial-gradient(ellipse_120%_80%_at_0%_0%,rgba(245,158,11,0.15),rgba(11,14,20,0.98))] ${
                isSelected
                  ? "border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.18)] ring-1 ring-amber-400/60"
                  : "border-amber-500/25 hover:border-amber-500/40"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-amber-300">
                      {bot.primarySymbol}
                    </span>
                    <h3 className="text-base font-black text-white mt-1">{bot.name}</h3>
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00D084]/40 bg-[#00D084]/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#00D084]">
                    <span className="size-1.5 rounded-full bg-[#00D084] animate-ping" />
                    ACTIF
                  </span>
                </div>

                <div className="mt-3 flex items-end justify-between border-y border-white/[0.06] py-2 font-mono">
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
                  {isSelected ? "● Affiché sur le graphique" : "Sélectionner →"}
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

        {/* 2.2 CARTE BOT 2 (FOREX) */}
        {activeBots[1] && (() => {
          const bot = activeBots[1];
          const isSelected = bot.id === selectedBotId;
          return (
            <article
              onClick={() => setSelectedBotId(bot.id)}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all duration-300 flex flex-col justify-between bg-[#0b0e14] bg-[radial-gradient(ellipse_120%_80%_at_0%_0%,rgba(56,189,248,0.15),rgba(11,14,20,0.98))] ${
                isSelected
                  ? "border-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.18)] ring-1 ring-sky-400/60"
                  : "border-sky-500/25 hover:border-sky-500/40"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center rounded border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-sky-300">
                      {bot.primarySymbol}
                    </span>
                    <h3 className="text-base font-black text-white mt-1">{bot.name}</h3>
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00D084]/40 bg-[#00D084]/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#00D084]">
                    <span className="size-1.5 rounded-full bg-[#00D084] animate-ping" />
                    ACTIF
                  </span>
                </div>

                <div className="mt-3 flex items-end justify-between border-y border-white/[0.06] py-2 font-mono">
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
                  {isSelected ? "● Affiché sur le graphique" : "Sélectionner →"}
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

        {/* 2.3 CARTE INTERRUPTEURS ON/OFF */}
        <article className="rounded-2xl border border-[#00D084]/25 bg-[#0c0f15] p-4 shadow-md flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
                INTERRUPTEURS ALGOS
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
            <span>État</span>
            <span className="text-[#00D084] font-bold">2/3 Actifs</span>
          </div>
        </article>
      </section>

      {/* ── 3. WORKSPACE TRADINGVIEW EN DIRECT (PIXEL PAR PIXEL) ── */}
      <section className="space-y-2">
        <TradingViewEngineChart
          bot={selectedBot}
          onClosePosition={onClosePosition}
          position={matchingPos}
        />
      </section>

      {/* ── 4. COCKPIT D'INTELLIGENCE INFÉRIEUR À ONGLETS (FLUIDE & SANS ENCOMBREMENT) ── */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#10141b] shadow-xl overflow-hidden">
        {/* Navigation par Onglets */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#0c1017] px-4 py-2">
          <div className="flex items-center gap-1 text-xs">
            {[
              { id: "decision" as const, label: "🧠 Analyse & Décision IA" },
              { id: "metrics" as const, label: "📊 Métriques & Équité" },
              { id: "journal" as const, label: "🕒 Journal & Calendrier HFT" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveBottomTab(tab.id)}
                className={`rounded-lg px-3.5 py-1.5 font-bold transition-all cursor-pointer ${
                  activeBottomTab === tab.id
                    ? "bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/30 shadow-sm"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono text-gray-400 hidden sm:inline">
            Moteur : <strong className="text-white">{selectedBot.name}</strong>
          </span>
        </div>

        {/* CONTENU ONGLETS */}
        <div className="p-4 sm:p-5">
          {/* TAB 1: ANALYSE & DÉCISION */}
          {activeBottomTab === "decision" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* 5-Stage Pipeline */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {pipelineStages.map((p, idx) => {
                  const Icon = p.icon;
                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border p-3 flex flex-col justify-between gap-2 shadow-sm ${
                        p.ok
                          ? "bg-[#00D084]/10 border-[#00D084]/30 text-[#00D084]"
                          : "bg-white/[0.02] border-white/[0.06] text-gray-500 opacity-60"
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

              {/* Dual Cards: Technique & Décision */}
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-white/[0.06] bg-[#0c1017] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-xs font-bold text-white">Sentiment &amp; Régime</span>
                    <span className="text-xs font-mono text-amber-300">{selectedBot.primarySymbol}</span>
                  </div>
                  <SentimentFearGreedBar trend="BULLISH" score={selectedBot.lastScoreNum} />
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-[#0c1017] p-4 flex items-center gap-4">
                  <ConfidenceCircularGauge value={selectedBot.lastScoreNum} />
                  <div className="flex-1 space-y-1.5 text-xs text-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Action : {selectedBot.lastDecision.action}</span>
                      <span className="font-mono text-[#00D084] font-bold">Score {selectedBot.lastScore}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-gray-400">
                      {selectedBot.lastDecision.reason || "Signal validé par le multi-timeframe scanner et confirmation du carnet L2."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MÉTRIQUES & ÉQUITÉ */}
          {activeBottomTab === "metrics" && (
            <div className="grid gap-4 lg:grid-cols-3 animate-in fade-in duration-200">
              {/* Sparkline Direct */}
              <div className="rounded-xl border border-white/[0.06] bg-[#0c1017] p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-300">Prix Direct {selectedBot.primarySymbol}</span>
                  <span className="font-mono font-black text-white">{selectedBot.id === "nexium-ai-gold" ? "2,388.90" : "1.08584"}</span>
                </div>
                <SparklinePrice price={2388} />
                <span className="text-[10px] text-[#00D084] font-mono font-bold block text-right">+0.48% Momentum</span>
              </div>

              {/* Courbe d'Équité */}
              <div className="rounded-xl border border-white/[0.06] bg-[#0c1017] p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-300">Courbe d'Équité Session</span>
                  <span className="font-mono font-black text-[#00D084]">+384.50 $</span>
                </div>
                <EquityCurveMini />
                <span className="text-[10px] text-sky-400 font-mono font-bold block text-right">+3.8% Profit</span>
              </div>

              {/* Compte à Rebours & Win Rate */}
              <div className="rounded-xl border border-white/[0.06] bg-[#0c1017] p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs border-b border-white/[0.06] pb-2">
                  <span className="font-bold text-gray-300">Prochain Tick M1</span>
                  <span className="font-mono text-[#00D084] font-bold">Win Rate 70%</span>
                </div>
                <CountdownTimerGauge isRunning={isEngineRunning} />
              </div>
            </div>
          )}

          {/* TAB 3: JOURNAL & CALENDRIER */}
          {activeBottomTab === "journal" && (
            <div className="grid gap-4 lg:grid-cols-2 animate-in fade-in duration-200">
              {/* Logs filtrables */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Journal d'Arbitrage</span>
                  <div className="flex items-center rounded-lg border border-white/[0.06] bg-[#080b0f] p-0.5 text-[10px]">
                    {(["all", "won", "lost", "open"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setLogFilter(f)}
                        className={`rounded px-2 py-0.5 font-bold uppercase transition cursor-pointer ${
                          logFilter === f ? "bg-[#00D084] text-black" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1 text-xs font-mono">
                  {filteredLogs.map((l, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-white/[0.04] bg-[#0c1017] p-2">
                      <span className="text-[10px] text-gray-500 shrink-0">{l.time}</span>
                      <span
                        className={`rounded px-1 py-0.2 text-[9px] font-black uppercase shrink-0 ${
                          l.level === "WON" || l.level === "SUCCESS"
                            ? "bg-[#00D084]/20 text-[#00D084]"
                            : l.level === "LOST"
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

              {/* Calendrier Économique */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Calendrier Économique HFT</span>
                <div className="space-y-2">
                  {[
                    { time: "14:30", title: "NFP - Non-Farm Payrolls", curr: "USD", impact: "high" },
                    { time: "16:00", title: "FOMC Rate Decision", curr: "USD", impact: "high" },
                    { time: "Demain 09:00", title: "ECB Press Conference", curr: "EUR", impact: "medium" },
                  ].map((ev, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0c1017] p-2.5 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 font-mono">
                          {ev.time}
                        </span>
                        <span className="font-bold text-white truncate">{ev.title}</span>
                      </div>
                      <span className="font-mono text-[10px] text-gray-400 font-bold">{ev.curr}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
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
        <article className="rounded-2xl sm:rounded-3xl border border-[#00D084]/30 bg-[#10141b] p-5 sm:p-6 shadow-md transition-all hover:border-[#00D084]/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400">VALEUR DU COMPTE (EQUITY)</span>
            <Wallet className="size-4 sm:size-5 text-[#00D084]" />
          </div>
          <p className="mt-3 font-mono text-2xl sm:text-3xl font-black text-white">
            ${(balance + totalOpenPnl).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-2.5 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-400">Solde cash</span>
            <span className="font-mono font-bold text-gray-200">${balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span>
          </div>
        </article>

        <article className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6 shadow-md transition-all hover:border-white/[0.15]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400">P&amp;L LATENT (EN COURS)</span>
            <TrendingUp className="size-4 sm:size-5 text-[#00D084]" />
          </div>
          <p
            className={`mt-3 font-mono text-2xl sm:text-3xl font-black ${
              totalOpenPnl >= 0 ? "text-[#00D084]" : "text-rose-400"
            }`}
          >
            {totalOpenPnl >= 0 ? `+$${totalOpenPnl.toFixed(2)}` : `-$${Math.abs(totalOpenPnl).toFixed(2)}`}
          </p>
          <div className="mt-2.5 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-400">Positions actives</span>
            <span className="font-mono font-bold text-[#00D084]">{positions.length} en direct</span>
          </div>
        </article>

        <article className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6 shadow-md transition-all hover:border-white/[0.15]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400">AUTO-TRADERS EN LIGNE</span>
            <Bot className="size-4 sm:size-5 text-sky-400" />
          </div>
          <p className="mt-3 font-mono text-2xl sm:text-3xl font-black text-sky-400">3 / 3</p>
          <div className="mt-2.5 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-400">Equinix NY4</span>
            <span className="font-mono font-bold text-[#00D084]">100% Opérationnel</span>
          </div>
        </article>

        <article className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6 shadow-md transition-all hover:border-white/[0.15]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400">RISQUE &amp; DRAWDOWN</span>
            <ShieldCheck className="size-4 sm:size-5 text-[#00D084]" />
          </div>
          <p className="mt-3 font-mono text-2xl sm:text-3xl font-black text-white">0.34%</p>
          <div className="mt-2.5 flex items-center justify-between text-xs sm:text-sm">
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
              <h3 className="mt-1 text-lg sm:text-xl font-black text-white">Performance Cumulée des Auto-Traders</h3>
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
                <p className="text-xs font-black uppercase tracking-wider text-gray-400">AUTO-TRADERS OPÉRATIONNELS</p>
                <h3 className="mt-1 text-lg sm:text-xl font-black text-white">Supervision Rapide</h3>
              </div>
              <button
                onClick={onOpenEngine}
                className="text-xs sm:text-sm font-bold text-[#00D084] hover:underline cursor-pointer flex items-center gap-1"
              >
                Page Auto-Trader <ChevronRight className="size-4" />
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
                        b.statusBadge === "ACTIF" ? "bg-[#00D084] animate-pulse" : "bg-rose-500"
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
            OUVRIR L'AUTO-TRADER &amp; LE SUPERCHART
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
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00D084]/30 bg-[#00D084]/10 px-3.5 py-1 text-[10px] sm:text-xs font-black tracking-wider text-[#00D084] uppercase mb-2">
              BIBLIOTHÈQUE STRATÉGIQUE MT5
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Auto-Traders &amp; Algorithmes Certifiés</h2>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-300 max-w-2xl font-medium">
              Chaque algorithme Auto-Trader est optimisé pour une classe d'actifs dédiée et opère selon un cahier des charges quantitatif institutionnel.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {bots.map((b) => (
          <article
            key={b.id}
            className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6 shadow-md flex flex-col justify-between transition-all hover:border-[#00D084]/40"
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-black text-white">{b.name}</h3>
                <StatusPill variant={b.statusBadge === "ACTIF" ? "emerald" : "rose"}>
                  {b.statusBadge}
                </StatusPill>
              </div>
              <p className="mt-1 font-mono text-xs sm:text-sm text-[#00D084] font-bold">{b.specialty}</p>
              <p className="mt-3 text-xs sm:text-sm text-gray-300 leading-relaxed font-medium">{b.subtitle}</p>

              <div className="mt-5 space-y-2 text-xs sm:text-sm border-t border-white/[0.06] pt-3.5">
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
              className="mt-5 w-full rounded-xl sm:rounded-2xl border border-[#00D084]/40 bg-[#00D084]/10 py-3 text-xs sm:text-sm font-bold text-[#00D084] hover:bg-[#00D084]/20 transition cursor-pointer"
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
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-rose-500/30 bg-[#140c10] p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-3.5 py-1 text-[10px] sm:text-xs font-black tracking-wider text-rose-400 uppercase mb-2">
              RISK GOVERNOR &amp; SÉCURITÉ DU CAPITAL
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Protection Active du Capital</h2>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-300 max-w-2xl font-medium">
              Le moteur applique un coupe-circuit strict dès que les tolérances de drawdown ou d'exposition sont atteintes.
            </p>
          </div>
          <StatusPill variant="emerald">GARDE-FOUS OPÉRATIONNELS</StatusPill>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-7 shadow-md space-y-5">
          <div className="border-b border-white/[0.06] pb-3.5">
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400">RÉGLAGES EN DIRECT</p>
            <h3 className="mt-1 text-base sm:text-lg lg:text-xl font-black text-white">Seuils de Tolérance Algorithmique</h3>
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
            className="neon-btn w-full rounded-xl sm:rounded-2xl py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-black cursor-pointer transition-all hover:scale-[1.01]"
          >
            ENREGISTRER LES LIMITES DE RISQUE
          </button>
        </article>

        {/* Emergency Kill Switch */}
        <article className="rounded-2xl sm:rounded-3xl border border-rose-500/40 bg-rose-500/10 p-5 sm:p-7 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="size-4 sm:size-5" />
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider">INTERRUPTEUR D'URGENCE (KILL SWITCH)</p>
            </div>
            <h3 className="mt-2 text-lg sm:text-xl font-black text-white">Arrêt d'Urgence Immédiat</h3>
            <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-gray-300 font-medium">
              Coupe instantanément tous les signaux actifs, ferme l'intégralité des positions ouvertes sur MT5 et passe l'ensemble des Auto-Traders en mode sécurisé.
            </p>
          </div>

          <button
            onClick={onEmergencyHalt}
            className="mt-6 w-full rounded-xl sm:rounded-2xl bg-rose-600 hover:bg-rose-700 py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-lg transition-all cursor-pointer"
          >
            🚨 DÉCLENCHER LE COUPE-CIRCUIT IMMÉDIAT
          </button>
        </article>
      </section>
    </div>
  );
}

// ----------------------------------------------------
// 5. PORTEFEUILLE & HISTORIQUE DES TRANSACTIONS
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
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00D084]/30 bg-[#00D084]/10 px-3.5 py-1 text-[10px] sm:text-xs font-black tracking-wider text-[#00D084] uppercase mb-2">
              GESTION FINANCIÈRE &amp; TRÉSORERIE
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Portefeuille &amp; Dépôts</h2>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-300 max-w-2xl font-medium">
              Consultez vos soldes en temps réel, créditez votre compte ou effectuez des retraits sécurisés.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onOpenDeposit}
              className="neon-btn inline-flex items-center gap-2 rounded-xl sm:rounded-2xl px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-black cursor-pointer shadow-lg hover:scale-[1.02] transition-all"
            >
              <Plus className="size-4" />
              DÉPOSER DES FONDS
            </button>
            <button
              onClick={onOpenWithdraw}
              className="inline-flex items-center gap-2 rounded-xl sm:rounded-2xl border border-white/[0.12] bg-[#141a23] hover:bg-[#1a2330] px-5 py-3 text-xs sm:text-sm font-bold text-white uppercase tracking-wider transition-all cursor-pointer"
            >
              RETIRER DES FONDS
            </button>
          </div>
        </div>
      </section>

      {/* Balances */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl sm:rounded-3xl border border-[#00D084]/30 bg-[#10141b] p-5 sm:p-6">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#00D084]">SOLDE CASH DISPONIBLE</p>
          <p className="mt-3 font-mono text-2xl sm:text-3xl font-black text-white">
            ${balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-2 text-xs sm:text-sm text-gray-400">Compte ECN Principal · USD</p>
        </article>

        <article className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400">TOTAL GAINS GÉNERÉS</p>
          <p className="mt-3 font-mono text-2xl sm:text-3xl font-black text-[#00D084]">+$3 480.20</p>
          <p className="mt-2 text-xs sm:text-sm text-gray-400">Gains algorithmiques nets</p>
        </article>

        <article className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400">RETRAITS EFFECTUÉS</p>
          <p className="mt-3 font-mono text-2xl sm:text-3xl font-black text-white">$1 200.00</p>
          <p className="mt-2 text-xs sm:text-sm text-gray-400">Virés sans frais</p>
        </article>

        <article className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400">STATUT CONFORMITÉ</p>
          <p className="mt-3 font-mono text-xl sm:text-2xl font-black text-[#00D084]">KYC VALIDÉ</p>
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
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00D084]/30 bg-[#00D084]/10 px-3.5 py-1 text-[10px] sm:text-xs font-black tracking-wider text-[#00D084] uppercase mb-2">
              INFRASTRUCTURE RÉSEAU INSTITUTIONNELLE
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Télémétrie FIX &amp; Serveurs MT5</h2>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-300 max-w-2xl font-medium">
              Monitoring en temps réel de la passerelle FIX 4.4, de la latence de routage et de l'intégrité des flux.
            </p>
          </div>
          <StatusPill variant="emerald">FLUX FIX ACTIF · SANS PERTE</StatusPill>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-7 shadow-md space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
            <div>
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400">PASSERELLES DISPONIBLES</p>
              <h3 className="mt-1 text-base sm:text-lg lg:text-xl font-black text-white">Datacenters Financiers</h3>
            </div>
            <button
              onClick={handleTestPing}
              disabled={isPinging}
              className="inline-flex items-center gap-2 rounded-xl border border-[#00D084]/40 bg-[#00D084]/10 px-3.5 py-2 text-xs sm:text-sm font-bold text-[#00D084] hover:bg-[#00D084]/20 transition cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${isPinging ? "animate-spin" : ""}`} />
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
                className={`rounded-xl sm:rounded-2xl border p-4 sm:p-5 text-left transition-all cursor-pointer ${
                  selectedServer === srv.id
                    ? "border-[#00D084]/60 bg-[#00D084]/10 ring-1 ring-[#00D084]/40"
                    : "border-white/[0.06] bg-[#0c1017] hover:border-white/[0.12]"
                }`}
              >
                <p className="font-bold text-xs sm:text-sm text-white">{srv.name}</p>
                <p className="text-[11px] text-gray-400">{srv.city}</p>
                <p className="mt-2.5 font-mono text-lg sm:text-xl font-black text-[#00D084]">{srv.ping}</p>
              </button>
            ))}
          </div>
        </article>

        <article className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-7 shadow-md">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400">FLUX DE MESSAGES FIX</p>
          <div className="mt-3.5 space-y-2.5 font-mono text-xs sm:text-sm">
            {[
              "8=FIX.4.4|35=W|55=EURUSD|269=0|270=1.08584|271=50",
              "8=FIX.4.4|35=W|55=XAUUSD|269=1|270=2388.90|271=20",
              "8=FIX.4.4|35=8|39=2|150=2|37=892119|55=XAUUSD|32=0.20",
              "8=FIX.4.4|35=0|112=HEARTBEAT_ACK|NY4_GATEWAY",
            ].map((msg, i) => (
              <div key={i} className="rounded-xl border border-white/[0.04] bg-[#0c1017] p-2.5 sm:p-3 text-gray-300">
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
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00D084]/30 bg-[#00D084]/10 px-3.5 py-1 text-[10px] sm:text-xs font-black tracking-wider text-[#00D084] uppercase mb-2">
              REGISTRE D'AUDIT ET TRAÇABILITÉ
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Journal Décisionnel des Algorithmes</h2>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-300 max-w-2xl font-medium">
              Historique inaltérable de chaque calcul de signal, contrôle de gouvernance du risque et exécution d'ordre.
            </p>
          </div>

          <button
            onClick={handleExportJournal}
            className="neon-btn inline-flex items-center gap-2 rounded-xl sm:rounded-2xl px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-black cursor-pointer shadow-lg hover:scale-[1.02] transition-all"
          >
            <Download className="size-4" />
            EXPORTER LE JOURNAL (CSV)
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#10141b] shadow-md">
        <div className="p-5 sm:p-6 border-b border-white/[0.06]">
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
          <table className="w-full min-w-[760px] text-left text-xs sm:text-sm">
            <thead className="border-b border-white/[0.06] bg-[#0c1017] text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-5 py-3.5">HEURE</th>
                <th className="px-5 py-3.5">ÉVÉNEMENT</th>
                <th className="px-5 py-3.5">SYMBOLE</th>
                <th className="px-5 py-3.5">DÉTAIL</th>
                <th className="px-5 py-3.5">STATUT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-mono text-gray-400">{entry.time}</td>
                  <td className="px-5 py-3.5 font-mono font-bold text-white">{entry.event}</td>
                  <td className="px-5 py-3.5 font-mono text-[#00D084] font-bold">{entry.symbol ?? "—"}</td>
                  <td className="px-5 py-3.5 text-gray-200 font-medium">{entry.detail}</td>
                  <td className="px-5 py-3.5">
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
// 8. MESSAGERIE VIEW (MESSENGER CHAT, CAPTURES, ÉMOJIS, PRÉDÉFINIS, E-MAIL & APPELS)
// ----------------------------------------------------
interface MessengerContact {
  id: string;
  name: string;
  role: string;
  category: "support" | "expert" | "ai" | "risk";
  avatar: string;
  avatarBg: string;
  statusText: string;
  isOnline: boolean;
  sla: string;
  prompts: { label: string; text: string }[];
}

const MESSENGER_CONTACTS: MessengerContact[] = [
  {
    id: "support-client",
    name: "Service Client VIP 24/7",
    role: "Support Compte & Dépôts / Retraits",
    category: "support",
    avatar: "SC",
    avatarBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    statusText: "En ligne · Équipe disponible",
    isOnline: true,
    sla: "Réponse < 1 min",
    prompts: [
      { label: "💳 Dépôt instantané SEPA", text: "Comment effectuer un dépôt instantané par virement SEPA ou carte ECN ?" },
      { label: "💸 Délais de retrait", text: "Pouvez-vous me confirmer les délais d'exécution pour un retrait vers mon IBAN ?" },
      { label: "🛡️ Vérification KYC", text: "Mes documents de conformité et justificatifs sont-ils bien validés pour le compte #802194 ?" },
      { label: "🐞 Signaler un bug", text: "J'aimerais signaler un souci d'affichage sur les flux en direct de mon terminal." },
    ],
  },
  {
    id: "expert-quant",
    name: "Dr. Antoine R. (Expert Quant)",
    role: "Directeur Recherche & Stratégies MQL5",
    category: "expert",
    avatar: "AR",
    avatarBg: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    statusText: "Desk NY4 Actif · En ligne",
    isOnline: true,
    sla: "Desk Institutionnel",
    prompts: [
      { label: "📊 Signal BUY Gold", text: "Pouvez-vous m'expliquer la logique algorithmique du signal BUY sur Nexium AI Gold ?" },
      { label: "🔍 Audit de Risque", text: "Pourriez-vous réaliser un audit de risque détaillé sur l'allocation de mes 3 robots ?" },
      { label: "📉 Volatilité FX Trend", text: "Quel est le comportement prévu du bot lors des annonces économiques majeures (NFP/CPI) ?" },
      { label: "📈 Optimiser le Sharpe", text: "Quels ajustements recommandez-vous pour maximiser le Sharpe Ratio de mon compte ?" },
    ],
  },
  {
    id: "ai-bot",
    name: "Nexium Core IA (Trading Bot)",
    role: "Assistant Algorithmique Autonome",
    category: "ai",
    avatar: "IA",
    avatarBg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    statusText: "⚡ Moteur IA Actif · Latence 0.8ms",
    isOnline: true,
    sla: "Instantané · 0.02s",
    prompts: [
      { label: "⚡ Résumé des positions", text: "Génère un résumé complet en direct des 3 positions ouvertes et du P&L consolidé." },
      { label: "📊 Prévision Volatilité", text: "Quelle est l'analyse prédictive de volatilité sur XAUUSD pour les 4 prochaines heures ?" },
      { label: "🛡️ Vérifier le Drawdown", text: "Quel est le niveau de drawdown maximum et la distance par rapport au coupe-circuit ?" },
      { label: "🔄 Simuler Rééquilibrage", text: "Simule une allocation 50% AI Gold / 50% FX Trend sur les données historiques." },
    ],
  },
  {
    id: "risk-governance",
    name: "Desk Risque & Conformité",
    role: "Surveillance & Coupe-Circuits MT5",
    category: "risk",
    avatar: "CR",
    avatarBg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    statusText: "Surveillance Active Equinix",
    isOnline: true,
    sla: "Contrôle en continu",
    prompts: [
      { label: "🛡️ Marge de sécurité", text: "Pouvez-vous confirmer ma marge de drawdown restante pour la séance en cours ?" },
      { label: "⚖️ Plafonds d'exposition", text: "Quels sont les plafonds d'exposition autorisés par classe d'actifs sur le compte ECN ?" },
      { label: "🔒 Coupe-circuit 2%", text: "Comment fonctionne la protection automatique de capital à 2.00% de Drawdown ?" },
    ],
  },
];

const PRESET_SCREENSHOTS = [
  {
    id: "sc-gold",
    name: "Graphique Breakout Gold M15 (NY)",
    url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "sc-ecn",
    name: "Relevé Exécution ECN #802194",
    url: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "sc-fix",
    name: "Télémétrie FIX Latence NY4",
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop",
  },
];

const EMOJI_CATEGORIES = {
  trading: {
    label: "Finance & Trading",
    emojis: ["🚀", "📈", "📉", "💰", "💎", "⚡", "🔥", "🏆", "📊", "🛡️", "⚖️", "🎯", "💵", "🟢", "🔴"],
  },
  emotions: {
    label: "Réactions & Smileys",
    emojis: ["😀", "😂", "😎", "🤔", "🤫", "🤯", "🥳", "🤩", "🙌", "👏", "👍", "🤝", "❤️", "✨", "💯"],
  },
  tools: {
    label: "Symboles & Statuts",
    emojis: ["💡", "🧠", "🤖", "📞", "✉️", "🔒", "⏱️", "📌", "⚠️", "🛠️", "🔎", "📥", "📤", "✅", "💬"],
  },
};

function MessagingTab({
  messages,
  onSendMessage,
}: {
  messages: ChatMessage[];
  onSendMessage: (txt: string) => void;
}) {
  const [activeChannel, setActiveChannel] = useState<"chat" | "call" | "email">("chat");
  const [selectedContactId, setSelectedContactId] = useState<string>("support-client");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<"all" | "support" | "expert" | "ai">("all");

  // Local thread state with rich features
  const [chatThreads, setChatThreads] = useState<ChatMessage[]>(messages);
  const [chatInput, setChatInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingContactName, setTypingContactName] = useState("");

  // Emoji, Screenshot & Voice State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiTab, setEmojiTab] = useState<"trading" | "emotions" | "tools">("trading");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImageCaption, setAttachedImageCaption] = useState<string>("");
  const [showScreenshotMenu, setShowScreenshotMenu] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption?: string } | null>(null);

  // Voice recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keep local threads in sync if parent sends new messages
  useEffect(() => {
    setChatThreads((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const newFromProps = messages.filter((m) => !existingIds.has(m.id));
      if (newFromProps.length === 0) return prev;
      return [...prev, ...newFromProps];
    });
  }, [messages]);

  // Voice recording timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecordingVoice) {
      timer = setInterval(() => setVoiceDuration((v) => v + 1), 1000);
    } else {
      setVoiceDuration(0);
    }
    return () => clearInterval(timer);
  }, [isRecordingVoice]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatThreads, isTyping]);

  const activeContact = useMemo(() => {
    return MESSENGER_CONTACTS.find((c) => c.id === selectedContactId) ?? MESSENGER_CONTACTS[0];
  }, [selectedContactId]);

  const activeMessages = useMemo(() => {
    return chatThreads.filter((m) => {
      // If contactId is set, match it. If not set, default to support or active
      if (m.contactId) return m.contactId === selectedContactId;
      return selectedContactId === "support-client" || m.sender === "user";
    });
  }, [chatThreads, selectedContactId]);

  const filteredContacts = useMemo(() => {
    return MESSENGER_CONTACTS.filter((contact) => {
      const matchSearch =
        contact.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        contact.role.toLowerCase().includes(searchFilter.toLowerCase());
      const matchCategory =
        filterCategory === "all" ? true : contact.category === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [searchFilter, filterCategory]);

  // Handle image upload from file system
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAttachedImage(event.target.result as string);
        setAttachedImageCaption(file.name);
        toast.success(`Capture d'écran attachée : ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Preset Screenshot insertion
  const handleSelectPresetScreenshot = (item: typeof PRESET_SCREENSHOTS[0]) => {
    setAttachedImage(item.url);
    setAttachedImageCaption(item.name);
    setShowScreenshotMenu(false);
    toast.success(`Capture attachée : ${item.name}`);
  };

  // Handle Message Submission
  const handleSendMessageSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() && !attachedImage) return;

    const now = new Date().toLocaleTimeString().slice(0, 5);
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      senderName: "Ludovic M.",
      text: chatInput.trim(),
      time: now,
      contactId: selectedContactId,
      image: attachedImage ?? undefined,
      imageCaption: attachedImage ? attachedImageCaption : undefined,
      replyTo: replyingTo ? { senderName: replyingTo.senderName, text: replyingTo.text } : undefined,
      status: "sent",
    };

    setChatThreads((prev) => [...prev, userMsg]);
    onSendMessage(chatInput.trim() || "[Capture d'écran transmise]");

    // Reset input fields
    setChatInput("");
    setAttachedImage(null);
    setAttachedImageCaption("");
    setReplyingTo(null);
    setShowEmojiPicker(false);

    // Simulate smart dynamic response based on active contact
    setIsTyping(true);
    setTypingContactName(activeContact.name);

    setTimeout(() => {
      let replyText = "";
      const lower = userMsg.text.toLowerCase();

      if (selectedContactId === "support-client") {
        if (lower.includes("dépôt") || lower.includes("depot") || lower.includes("virement")) {
          replyText = "Les virements SEPA instantanés et cartes ECN sont crédités sans frais sous 1 à 3 minutes. Votre solde actuel s'élève à $24 860.42 USD.";
        } else if (lower.includes("retrait") || lower.includes("iban")) {
          replyText = "Votre demande de retrait est traitée avec priorité VIP. Le délai moyen d'exécution bancaire est de 15 à 30 minutes vers les banques européennes.";
        } else if (lower.includes("kyc") || lower.includes("compte") || lower.includes("document")) {
          replyText = "Votre compte MT5 #802194 bénéficie du statut Vérifié Institutionnel niveau 2 (Accès complet 0 spread). Tous vos documents sont en règle.";
        } else {
          replyText = `Bonjour Ludovic, notre équipe support a bien reçu votre message. Nous prenons en charge votre demande immédiatement. Un conseiller reste à votre écoute.`;
        }
      } else if (selectedContactId === "expert-quant") {
        if (lower.includes("or") || lower.includes("gold") || lower.includes("xauusd")) {
          replyText = "L'analyse quantitative sur XAUUSD confirme une structure de continuation haussière au-dessus du support 2 374.00. Nexium AI Gold maintient un score algorithmique optimal de 84/100.";
        } else if (lower.includes("audit") || lower.includes("risque") || lower.includes("drawdown")) {
          replyText = "L'audit de risque en temps réel indique une corrélation globale de 0.22 entre vos 3 bots, ce qui offre une excellente diversification sans sur-exposition de marge.";
        } else if (lower.includes("sharpe") || lower.includes("rendement")) {
          replyText = "Le Sharpe Ratio consolidé sur 30 jours est de 2.68. Pour le stabiliser davantage, nous recommandons de conserver les Take-Profits dynamiques actuels.";
        } else {
          replyText = `Bien reçu Ludovic. Le Desk de Recherche analyse votre point et surveille les carnets d'ordres L2 sur le flux Equinix NY4.`;
        }
      } else if (selectedContactId === "ai-bot") {
        replyText = `⚡ Moteur IA Nexium :\n• 3 Bots synchronisés sur serveur NY4 (Latence : 0.8ms)\n• Signaux analysés : 14 setups détectés sur la session\n• Sécurité capital : Drawdown actuel 0.34% (Seuil maximal : 2.00%)\n\nTout est nominal.`;
      } else {
        replyText = "Desk Risque : Votre allocation respecte l'ensemble des critères de solvabilité et de marge institutionnelle.";
      }

      const deskReply: ChatMessage = {
        id: `reply-${Date.now()}`,
        sender: selectedContactId === "expert-quant" ? "expert" : selectedContactId === "ai-bot" ? "ai" : "support",
        senderName: activeContact.name,
        contactId: selectedContactId,
        text: replyText,
        time: new Date().toLocaleTimeString().slice(0, 5),
        status: "read",
      };

      setChatThreads((prev) => [...prev, deskReply]);
      setIsTyping(false);
      setTypingContactName("");
    }, 1200);
  };

  // Handle Quick Prompt
  const handleQuickPromptClick = (text: string) => {
    setChatInput(text);
  };

  // Handle Emoji Insertion into Chat Input
  const handleInsertEmoji = (emoji: string) => {
    setChatInput((prev) => prev + emoji);
  };

  // Handle Adding Reactions to a message
  const handleToggleReaction = (messageId: string, emoji: string) => {
    setChatThreads((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const currentReactions = m.reactions ?? [];
        const existing = currentReactions.find((r) => r.emoji === emoji);

        let newReactions;
        if (existing) {
          if (existing.byMe) {
            newReactions = currentReactions
              .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, byMe: false } : r))
              .filter((r) => r.count > 0);
          } else {
            newReactions = currentReactions.map((r) =>
              r.emoji === emoji ? { ...r, count: r.count + 1, byMe: true } : r
            );
          }
        } else {
          newReactions = [...currentReactions, { emoji, count: 1, byMe: true }];
        }

        return { ...m, reactions: newReactions };
      })
    );
  };

  // Handle Voice Note Send
  const handleSendVoiceNote = () => {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      toast.info("Enregistrement de la note vocale en cours...");
    } else {
      setIsRecordingVoice(false);
      const formatted = `0:${voiceDuration.toString().padStart(2, "0")}`;
      const now = new Date().toLocaleTimeString().slice(0, 5);

      const voiceMsg: ChatMessage = {
        id: `voice-${Date.now()}`,
        sender: "user",
        senderName: "Ludovic M.",
        text: `🎙️ Note vocale (${formatted})`,
        time: now,
        contactId: selectedContactId,
        isVoice: true,
        voiceDuration: formatted,
        status: "sent",
      };

      setChatThreads((prev) => [...prev, voiceMsg]);
      toast.success("Note vocale chiffrée transmise.");
    }
  };

  // ---------------- AUDIO PHONE CALL STATE ----------------
  const [callState, setCallState] = useState<"IDLE" | "CALLING" | "CONNECTED" | "ENDED">("IDLE");
  const [callSelectedAgent, setCallSelectedAgent] = useState({
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
      interval = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    } else if (callState === "IDLE") {
      setCallDuration(0);
      setDialedDigits("");
    }
    return () => clearInterval(interval);
  }, [callState]);

  const startAudioCall = (agent: typeof callSelectedAgent) => {
    setCallSelectedAgent(agent);
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
    setTimeout(() => setCallState("IDLE"), 1500);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ---------------- EMAIL STATE ----------------
  const [emails, setEmails] = useState<EmailItem[]>(INITIAL_EMAILS);
  const [emailFolder, setEmailFolder] = useState<"inbox" | "sent" | "compose">("inbox");
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(INITIAL_EMAILS[0]);
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
    toast.success("E-mail officiel transmis au Desk.");

    setTimeout(() => {
      const autoReply: EmailItem = {
        id: `mail-reply-${Date.now()}`,
        from: composeTo,
        fromName: composeTo.includes("quant")
          ? "Dr. Antoine R. (Nexium Quant)"
          : composeTo.includes("support")
          ? "Elena V. (Support VIP)"
          : "Nexium Risk Governance",
        to: "ludovic.m@investisseur-nexium.com",
        subject: `Re: ${newEmail.subject}`,
        date: `Aujourd'hui · ${new Date().toLocaleTimeString().slice(0, 5)}`,
        preview: "Accusé de réception officiel de votre demande...",
        body: [
          "Bonjour Ludovic,",
          `Nous accusons bonne réception de votre message : "${newEmail.subject}".`,
          "Votre gestionnaire de compte et l'équipe technique MT5 traitent votre demande prioritaire.",
          "Temps de traitement moyen estimé : 10 minutes.",
          "Cordialement,\nLe Desk Nexium Markets Institutional",
        ],
        unread: true,
        priority: newEmail.priority,
        folder: "inbox",
      };
      setEmails((prev) => [autoReply, ...prev]);
      toast.info("Nouvel e-mail reçu : Accusé de réception officiel.");
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* ── 1. EN-TÊTE ULTRA-MODERNE & SÉLECTEUR DE CANAUX ── */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Centre de Messagerie &amp; Support
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00D084]/40 bg-[#00D084]/15 px-3 py-1 text-xs font-mono font-bold text-[#00D084]">
              <span className="size-2 rounded-full bg-[#00D084] animate-pulse" />
              DESK LIVE 24/7
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Messenger instantané, captures d'écran, notes vocales, boîte e-mail sécurisée et ligne chiffrée MT5.
          </p>
        </div>

        {/* Sélecteur de canal 3-en-1 avec badge non lu */}
        <div className="flex items-center rounded-2xl border border-white/[0.08] bg-[#0c1017] p-1.5 shadow-lg">
          <button
            onClick={() => setActiveChannel("chat")}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeChannel === "chat"
                ? "bg-[#00D084] text-black font-black shadow-[0_0_15px_rgba(0,208,132,0.35)]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <MessageSquare className="size-4" />
            <span>Messenger Live</span>
            <span className="size-2 rounded-full bg-current animate-pulse" />
          </button>

          <button
            onClick={() => setActiveChannel("email")}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeChannel === "email"
                ? "bg-[#00D084] text-black font-black shadow-[0_0_15px_rgba(0,208,132,0.35)]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Mail className="size-4" />
            <span>E-mail Officiel</span>
            {emails.filter((e) => e.unread).length > 0 && (
              <span className="rounded-full bg-amber-400 px-2 py-0.5 font-mono text-[10px] font-black text-black">
                {emails.filter((e) => e.unread).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveChannel("call")}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeChannel === "call"
                ? "bg-[#00D084] text-black font-black shadow-[0_0_15px_rgba(0,208,132,0.35)]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <PhoneCall className="size-4" />
            <span>Ligne Audio</span>
            {callState === "CONNECTED" && (
              <span className="size-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CANAL 1: MESSENGER LIVE (CHAT DIRECT, CAPTURES, ÉMOJIS, PRÉDÉFINIS) */}
      {/* ========================================================================= */}
      {activeChannel === "chat" && (
        <section className="grid gap-5 lg:grid-cols-[310px_1fr] min-h-[580px] lg:min-h-[600px] lg:max-h-[660px]">
          {/* 1.1 SIDEBAR DES CONTACTS ET CANAUX */}
          <aside className="flex flex-col justify-between rounded-3xl border border-white/[0.08] bg-[#10141b] p-4 shadow-xl space-y-3">
            <div className="space-y-3">
              {/* Search contacts */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un expert ou service..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-gray-500 outline-none focus:border-[#00D084] transition"
                />
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
                {[
                  { id: "all", label: "Tous" },
                  { id: "support", label: "🎧 Support" },
                  { id: "expert", label: "🧠 Experts" },
                  { id: "ai", label: "⚡ IA" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterCategory(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                      filterCategory === tab.id
                        ? "bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/40 font-black"
                        : "bg-[#141a23] text-gray-400 hover:text-white border border-white/[0.04]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Contacts List */}
              <div className="space-y-2 max-h-[380px] lg:max-h-[420px] overflow-y-auto pr-1">
                {filteredContacts.map((contact) => {
                  const isSelected = contact.id === selectedContactId;
                  const lastMsg = chatThreads.filter((m) => m.contactId === contact.id).slice(-1)[0];

                  return (
                    <div
                      key={contact.id}
                      onClick={() => {
                        setSelectedContactId(contact.id);
                        setReplyingTo(null);
                      }}
                      className={`cursor-pointer rounded-2xl border p-3 transition-all duration-200 ${
                        isSelected
                          ? "border-[#00D084] bg-[#00D084]/15 shadow-md ring-1 ring-[#00D084]/50"
                          : "border-white/[0.06] bg-[#0c1017] hover:border-white/[0.15] hover:bg-[#141a23]/60"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`relative grid size-10 place-items-center rounded-2xl border font-mono text-xs font-black shrink-0 ${contact.avatarBg}`}>
                          {contact.avatar}
                          {contact.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-[#00D084] border-2 border-[#0c1017]" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs text-white truncate">
                              {contact.name}
                            </h4>
                            <span className="text-[10px] font-mono text-gray-400">
                              {lastMsg ? lastMsg.time : "Live"}
                            </span>
                          </div>

                          <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            {contact.role}
                          </p>

                          <div className="mt-1.5 flex items-center justify-between text-[10px]">
                            <span className="text-[#00D084] font-medium flex items-center gap-1">
                              <span className="size-1.5 rounded-full bg-[#00D084] animate-pulse" />
                              {contact.sla}
                            </span>
                            <span className="font-mono text-gray-400 bg-white/[0.04] px-1.5 py-0.2 rounded">
                              MT5 Live
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Account Info Box */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#080b0f] p-2.5 text-[11px] font-mono text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Compte MT5 :</span>
                <strong className="text-white font-bold">#802194</strong>
              </div>
              <div className="flex justify-between">
                <span>Chiffrement :</span>
                <strong className="text-[#00D084] font-bold">AES-256 GCM</strong>
              </div>
            </div>
          </aside>

          {/* 1.2 MAIN CHAT CONVERSATION AREA */}
          <main className="flex flex-col justify-between rounded-3xl border border-white/[0.08] bg-[#10141b] shadow-2xl overflow-hidden min-h-[580px] lg:min-h-[600px] lg:max-h-[660px]">
            {/* ── CHAT HEADER ── */}
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0c1017] px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className={`grid size-10 place-items-center rounded-2xl border font-mono text-sm font-black ${activeContact.avatarBg}`}>
                  {activeContact.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-white text-sm sm:text-base leading-tight">
                      {activeContact.name}
                    </h3>
                    <span className="rounded-full bg-[#00D084]/15 border border-[#00D084]/30 px-2 py-0.2 text-[10px] font-mono font-bold text-[#00D084]">
                      {activeContact.sla}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-[#00D084] animate-pulse" />
                    {activeContact.statusText} · {activeContact.role}
                  </p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveChannel("call");
                    startAudioCall(callSelectedAgent);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-[#00D084]/30 bg-[#00D084]/10 hover:bg-[#00D084]/20 px-3 py-1.5 text-xs font-bold text-[#00D084] transition cursor-pointer shadow-sm"
                  title="Lancer un appel téléphonique chiffré"
                >
                  <Phone className="size-3.5" />
                  <span className="hidden sm:inline">Appeler</span>
                </button>

                <button
                  onClick={() => {
                    setActiveChannel("email");
                    setComposeTo(activeContact.id === "expert-quant" ? "desk-quant@nexiummarkets.com" : "support-vip@nexiummarkets.com");
                    setEmailFolder("compose");
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#141a23] hover:bg-[#1e2634] px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white transition cursor-pointer"
                  title="Envoyer un e-mail officiel"
                >
                  <Mail className="size-3.5" />
                  <span className="hidden sm:inline">E-mail</span>
                </button>
              </div>
            </div>

            {/* ── PREDEFINED QUICK QUESTIONS (1-CLICK) ── */}
            <div className="border-b border-white/[0.06] bg-[#080b0f] px-5 py-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Sparkles className="size-3 text-[#00D084]" />
                  MESSAGES PRÉDÉFINIS (1-CLIC) :
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {activeContact.prompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickPromptClick(p.text)}
                    className="rounded-xl border border-white/[0.08] bg-[#12161f] hover:border-[#00D084]/50 hover:bg-[#00D084]/15 px-3 py-1 text-xs text-gray-200 hover:text-white transition shrink-0 cursor-pointer shadow-sm flex items-center gap-1"
                  >
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── MESSAGE STREAM (HAUTEUR OPTIMISÉE SANS SCROLL GLOBAL) ── */}
            <div className="flex-1 p-5 space-y-3.5 overflow-y-auto bg-black/25 min-h-[300px] max-h-[380px]">
              {activeMessages.map((m) => {
                const isMe = m.sender === "user";

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1 group`}
                  >
                    {/* Quoted / Reply Preview if any */}
                    {m.replyTo && (
                      <div className={`text-[11px] rounded-xl px-3 py-1 mb-0.5 max-w-[80%] border ${
                        isMe
                          ? "bg-white/[0.05] border-white/[0.08] text-gray-400 text-right"
                          : "bg-black/40 border-white/[0.06] text-gray-400 text-left"
                      }`}>
                        <span className="font-bold text-gray-300">En réponse à {m.replyTo.senderName} :</span>{" "}
                        <span className="italic truncate">"{m.replyTo.text.slice(0, 40)}..."</span>
                      </div>
                    )}

                    <div
                      className={`relative max-w-[88%] sm:max-w-[75%] rounded-3xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-lg ${
                        isMe
                          ? "rounded-tr-sm bg-gradient-to-br from-[#00D084]/25 to-[#00D084]/10 border border-[#00D084]/40 text-white"
                          : "rounded-tl-sm bg-[#141a23] border border-white/[0.08] text-gray-200"
                      }`}
                    >
                      {/* Sender Header */}
                      <div className="flex items-center justify-between gap-3 mb-1.5 border-b border-white/[0.06] pb-1">
                        <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                          {!isMe && <span className="size-1.5 rounded-full bg-[#00D084]" />}
                          {m.senderName}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-gray-400">
                          <span>{m.time}</span>
                          {isMe && <CheckCheck className="size-3.5 text-[#00D084]" />}
                        </div>
                      </div>

                      {/* Message Text */}
                      <p className="whitespace-pre-line text-gray-100 font-medium leading-relaxed">
                        {m.text}
                      </p>

                      {/* Image / Screenshot preview if attached */}
                      {m.image && (
                        <div className="mt-2.5 overflow-hidden rounded-2xl border border-white/[0.1] bg-black/40">
                          <img
                            src={m.image}
                            alt={m.imageCaption ?? "Capture d'écran"}
                            onClick={() => setLightboxImage({ url: m.image!, caption: m.imageCaption })}
                            className="max-h-44 w-full object-cover cursor-pointer hover:scale-102 transition duration-200"
                          />
                          {m.imageCaption && (
                            <div className="p-1.5 text-[10px] font-mono text-gray-300 bg-[#0c1017] flex items-center justify-between">
                              <span className="truncate flex items-center gap-1.5">
                                <ImageIcon className="size-3 text-[#00D084]" />
                                {m.imageCaption}
                              </span>
                              <span className="text-[10px] text-gray-500 font-sans">Agrandir ↗</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Voice Note Audio Component */}
                      {m.isVoice && (
                        <div className="mt-2 rounded-2xl border border-white/[0.08] bg-[#0c1017] p-2.5 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setPlayingVoiceId(playingVoiceId === m.id ? null : m.id);
                              toast.info(playingVoiceId === m.id ? "Lecture arrêtée." : "Lecture de la note vocale...");
                            }}
                            className="grid size-8 place-items-center rounded-xl bg-[#00D084] text-black font-black cursor-pointer hover:scale-105 transition"
                          >
                            {playingVoiceId === m.id ? <Pause className="size-3.5" /> : <Play className="size-3.5 ml-0.5" />}
                          </button>

                          <div className="flex-1">
                            <div className="flex items-center gap-1 h-4">
                              {[10, 20, 14, 24, 12, 18, 26, 14, 22, 12, 18, 22, 10, 16].map((h, idx) => (
                                <div
                                  key={idx}
                                  className={`w-1 rounded-full transition-all duration-200 ${
                                    playingVoiceId === m.id ? "bg-[#00D084] animate-pulse" : "bg-gray-500"
                                  }`}
                                  style={{ height: `${h}px` }}
                                />
                              ))}
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-0.5">
                              <span>Note vocale chiffrée</span>
                              <span className="text-white font-bold">{m.voiceDuration ?? "0:06"}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Reactions bar */}
                      {m.reactions && m.reactions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-1 border-t border-white/[0.04]">
                          {m.reactions.map((r, i) => (
                            <button
                              key={i}
                              onClick={() => handleToggleReaction(m.id, r.emoji)}
                              className={`flex items-center gap-1 rounded-lg px-2 py-0.2 text-xs font-mono transition cursor-pointer ${
                                r.byMe
                                  ? "bg-[#00D084]/20 border border-[#00D084]/40 text-white"
                                  : "bg-white/[0.06] border border-white/[0.08] text-gray-300 hover:bg-white/[0.1]"
                              }`}
                            >
                              <span>{r.emoji}</span>
                              <span className="font-bold">{r.count}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Quick Action Tools on Message */}
                      <div className="mt-2 pt-1 border-t border-white/[0.04] flex items-center justify-between opacity-80 group-hover:opacity-100 transition">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setReplyingTo(m);
                              toast.info(`Citation prête pour ${m.senderName}.`);
                            }}
                            className="flex items-center gap-1 text-[11px] font-bold text-[#00D084] hover:underline cursor-pointer"
                          >
                            <Reply className="size-3" /> Citer
                          </button>

                          {/* Quick Emoji Reaction Launcher */}
                          <div className="flex items-center gap-1 ml-1.5">
                            {["👍", "❤️", "🚀", "🔥"].map((em) => (
                              <button
                                key={em}
                                onClick={() => handleToggleReaction(m.id, em)}
                                className="text-xs hover:scale-125 transition cursor-pointer p-0.5"
                                title={`Réagir avec ${em}`}
                              >
                                {em}
                              </button>
                            ))}
                          </div>
                        </div>

                        {!isMe && (
                          <button
                            onClick={() => {
                              handleToggleReaction(m.id, "✅");
                              toast.success("Message acquitté avec succès.");
                            }}
                            className="rounded-lg border border-white/[0.06] bg-black/40 px-2 py-0.2 text-[10px] font-mono text-gray-300 hover:text-white cursor-pointer"
                          >
                            ✓ Acquitter
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-gray-400 font-mono animate-in fade-in">
                  <div className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-[#00D084] animate-bounce" />
                    <span className="size-1.5 rounded-full bg-[#00D084] animate-bounce [animation-delay:0.2s]" />
                    <span className="size-1.5 rounded-full bg-[#00D084] animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>{typingContactName || "L'expert"} rédige une réponse...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── ATTACHED IMAGE PREVIEW (BEFORE SENDING) ── */}
            {attachedImage && (
              <div className="bg-[#0c1017] border-t border-white/[0.08] px-5 py-2.5 flex items-center justify-between animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3">
                  <img
                    src={attachedImage}
                    alt="Capture sélectionnée"
                    className="size-11 rounded-xl object-cover border border-[#00D084]/40"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      📷 {attachedImageCaption || "Capture d'écran prête à l'envoi"}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">Image jointe au message</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAttachedImage(null);
                    setAttachedImageCaption("");
                  }}
                  className="text-gray-400 hover:text-rose-400 p-1.5 rounded-lg bg-white/[0.04] cursor-pointer"
                  title="Supprimer la capture"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            {/* ── REPLAY BANNER ── */}
            {replyingTo && (
              <div className="bg-[#0c1017] border-t border-white/[0.08] px-5 py-1.5 flex items-center justify-between text-xs animate-in fade-in">
                <div className="flex items-center gap-2 truncate text-gray-300">
                  <Reply className="size-3 text-[#00D084] shrink-0" />
                  <span className="font-bold text-[#00D084]">Réponse à {replyingTo.senderName} :</span>
                  <span className="truncate text-gray-400 italic">"{replyingTo.text.slice(0, 50)}..."</span>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            {/* ── EMOJI PICKER POPOVER ── */}
            {showEmojiPicker && (
              <div className="border-t border-white/[0.08] bg-[#0c1017] p-2.5 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
                  <div className="flex items-center gap-2">
                    {(Object.keys(EMOJI_CATEGORIES) as (keyof typeof EMOJI_CATEGORIES)[]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setEmojiTab(cat)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                          emojiTab === cat
                            ? "bg-[#00D084] text-black"
                            : "bg-[#141a23] text-gray-300 hover:text-white"
                        }`}
                      >
                        {EMOJI_CATEGORIES[cat].label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(false)}
                    className="text-gray-400 hover:text-white p-1 cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-8 sm:grid-cols-15 gap-1 py-1">
                  {EMOJI_CATEGORIES[emojiTab].emojis.map((em, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleInsertEmoji(em)}
                      className="text-base hover:scale-125 transition cursor-pointer p-1 rounded hover:bg-white/[0.08] grid place-items-center"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── PRESET SCREENSHOT SELECTION POPOVER ── */}
            {showScreenshotMenu && (
              <div className="border-t border-white/[0.08] bg-[#0c1017] p-2.5 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Camera className="size-3.5 text-[#00D084]" />
                    Captures d'écran Démo MT5 :
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowScreenshotMenu(false)}
                    className="text-gray-400 hover:text-white p-1 cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {PRESET_SCREENSHOTS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectPresetScreenshot(item)}
                      className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#141a23] hover:border-[#00D084]/50 p-2 text-left text-xs text-gray-200 hover:text-white transition cursor-pointer"
                    >
                      <img src={item.url} alt={item.name} className="size-9 rounded-lg object-cover" />
                      <span className="truncate font-medium">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── INPUT TOOLBAR & SUBMISSION FORM ── */}
            <form onSubmit={handleSendMessageSubmit} className="border-t border-white/[0.08] bg-[#10141b] p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                {/* Hidden File Input for Real Screenshot / Image Upload */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                {/* Screenshot Upload Trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="grid size-9 sm:size-10 place-items-center rounded-xl border border-white/[0.08] bg-[#141a23] hover:bg-[#1e2634] text-gray-300 hover:text-white transition cursor-pointer shrink-0"
                  title="Téléverser une capture d'écran depuis l'ordinateur"
                >
                  <FileImage className="size-4 text-[#00D084]" />
                </button>

                {/* Preset Screenshot Samples */}
                <button
                  type="button"
                  onClick={() => setShowScreenshotMenu((prev) => !prev)}
                  className={`grid size-9 sm:size-10 place-items-center rounded-xl border transition cursor-pointer shrink-0 ${
                    showScreenshotMenu
                      ? "border-[#00D084] bg-[#00D084]/20 text-[#00D084]"
                      : "border-white/[0.08] bg-[#141a23] hover:bg-[#1e2634] text-gray-300 hover:text-white"
                  }`}
                  title="Choisir une capture prédéfinie MT5"
                >
                  <Camera className="size-4" />
                </button>

                {/* Emoji Picker Trigger */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className={`grid size-9 sm:size-10 place-items-center rounded-xl border transition cursor-pointer shrink-0 ${
                    showEmojiPicker
                      ? "border-[#00D084] bg-[#00D084]/20 text-[#00D084]"
                      : "border-white/[0.08] bg-[#141a23] hover:bg-[#1e2634] text-gray-300 hover:text-white"
                  }`}
                  title="Insérer un émoji"
                >
                  <Smile className="size-4 text-amber-400" />
                </button>

                {/* Voice Note Trigger */}
                <button
                  type="button"
                  onClick={handleSendVoiceNote}
                  className={`grid size-9 sm:size-10 place-items-center rounded-xl border transition cursor-pointer shrink-0 ${
                    isRecordingVoice
                      ? "border-rose-500 bg-rose-500/25 text-rose-400 animate-pulse"
                      : "border-white/[0.08] bg-[#141a23] hover:bg-[#1e2634] text-gray-300 hover:text-white"
                  }`}
                  title={isRecordingVoice ? "Arrêter et envoyer la note vocale" : "Enregistrer une note vocale"}
                >
                  <Mic className="size-4" />
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  placeholder={
                    isRecordingVoice
                      ? `Enregistrement (${voiceDuration}s)... Cliquez sur le micro pour envoyer.`
                      : `Écrire à ${activeContact.name}...`
                  }
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isRecordingVoice}
                  className="flex-1 rounded-2xl border border-white/[0.08] bg-[#0c1017] px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#00D084] transition"
                />

                {/* Submit Send Button */}
                <button
                  type="submit"
                  className="neon-btn rounded-2xl px-4 sm:px-5 py-2.5 font-black text-xs sm:text-sm uppercase tracking-wider text-black cursor-pointer flex items-center gap-1.5 shadow-lg shrink-0"
                >
                  <Send className="size-4" />
                  <span className="hidden sm:inline">ENVOYER</span>
                </button>
              </div>
            </form>
          </main>
        </section>
      )}

      {/* ========================================================================= */}
      {/* CANAL 2: E-MAIL OFFICIEL SÉCURISÉ (BOÎTE DE RÉCEPTION & COMPOSER) */}
      {/* ========================================================================= */}
      {activeChannel === "email" && (
        <section className="grid gap-5 xl:grid-cols-[310px_1fr] min-h-[580px] lg:min-h-[600px] lg:max-h-[660px]">
          {/* Email Sidebar & Folders */}
          <article className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-4.5 shadow-xl flex flex-col justify-between space-y-3.5">
            <div className="space-y-3.5">
              <button
                onClick={() => setEmailFolder("compose")}
                className="neon-btn w-full rounded-2xl py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-black cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                <Plus className="size-4" />
                RÉDIGER UN E-MAIL
              </button>

              {/* Folders List */}
              <div className="space-y-1">
                <button
                  onClick={() => setEmailFolder("inbox")}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                    emailFolder === "inbox"
                      ? "bg-white/[0.1] text-white font-black"
                      : "text-gray-400 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Inbox className="size-4 text-[#00D084]" />
                    Boîte de réception
                  </span>
                  <span className="font-mono text-xs text-gray-300">
                    {emails.filter((e) => e.folder === "inbox").length}
                  </span>
                </button>

                <button
                  onClick={() => setEmailFolder("sent")}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                    emailFolder === "sent"
                      ? "bg-white/[0.1] text-white font-black"
                      : "text-gray-400 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Send className="size-4 text-sky-400" />
                    Messages envoyés
                  </span>
                  <span className="font-mono text-xs text-gray-300">
                    {emails.filter((e) => e.folder === "sent").length}
                  </span>
                </button>
              </div>

              {/* Email List Preview */}
              <div className="border-t border-white/[0.06] pt-3 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                  {emailFolder === "sent" ? "Messages envoyés" : "Messages reçus"}
                </span>

                <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
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
                          className={`cursor-pointer rounded-2xl border p-3 transition-all ${
                            isSelected
                              ? "border-[#00D084]/60 bg-[#00D084]/15 shadow-md"
                              : "border-white/[0.06] bg-[#0c1017] hover:border-white/[0.15]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white truncate max-w-[150px]">
                              {item.fromName}
                            </span>
                            <span className="font-mono text-[10px] text-gray-400">
                              {item.date.split("·")[1] ?? item.date}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-gray-200 mt-0.5 truncate">{item.subject}</p>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-[#080b0f] p-2.5 text-xs text-gray-400 font-mono">
              Serveur SMTP : <strong className="text-white">mail.nexiummarkets.com</strong>
            </div>
          </article>

          {/* Email View or Compose View */}
          <article className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6 shadow-xl flex flex-col justify-between min-h-[580px] lg:min-h-[600px] lg:max-h-[660px]">
            {emailFolder === "compose" ? (
              /* COMPOSE FORM */
              <form onSubmit={handleSendEmail} className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <h3 className="font-black text-base text-white">Rédiger un e-mail officiel</h3>
                  <span className="rounded-full border border-[#00D084]/30 bg-[#00D084]/10 px-2.5 py-0.5 text-xs font-mono text-[#00D084] font-bold">
                    CANAL SÉCURISÉ
                  </span>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-1">
                      DESTINATAIRE
                    </label>
                    <select
                      value={composeTo}
                      onChange={(e) => setComposeTo(e.target.value)}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#00D084]"
                    >
                      <option value="desk-quant@nexiummarkets.com">desk-quant@nexiummarkets.com (Recherche &amp; Stratégies)</option>
                      <option value="support-vip@nexiummarkets.com">support-vip@nexiummarkets.com (Support Client VIP)</option>
                      <option value="risk-governor@nexiummarkets.com">risk-governor@nexiummarkets.com (Conformité &amp; Risque)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-1">
                      PRIORITÉ
                    </label>
                    <select
                      value={composePriority}
                      onChange={(e) => setComposePriority(e.target.value as any)}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#00D084]"
                    >
                      <option value="NORMAL">Normal (Traitement sous 1h)</option>
                      <option value="URGENT">Urgent (Traitement sous 15 min)</option>
                      <option value="CRITIQUE">Critique (Alerte Desk Immédiate)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-1">
                    OBJET DU MESSAGE
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Demande d'ajustement de lot sur Nexium AI Gold..."
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#00D084]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-1">
                    CORPS DU MESSAGE
                  </label>
                  <textarea
                    rows={7}
                    placeholder="Rédigez votre demande institutionnelle ici..."
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#00D084] resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] pt-3">
                  <button
                    type="button"
                    onClick={() => setEmailFolder("inbox")}
                    className="rounded-2xl border border-white/[0.08] bg-[#0c1017] px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-white cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="neon-btn rounded-2xl px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black cursor-pointer flex items-center gap-2 shadow-lg"
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
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                    <div>
                      <h3 className="font-black text-base text-white">{selectedEmail.subject}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <span>De : <strong className="text-white">{selectedEmail.fromName}</strong> ({selectedEmail.from})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-400">{selectedEmail.date}</span>
                      <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-300">
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
                    <div className="mt-4 rounded-2xl border border-white/[0.08] bg-[#080b0f] p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Paperclip className="size-4 text-[#00D084]" />
                        <div>
                          <p className="font-bold text-xs text-white">rapport-arbitrage-xauusd-ny4.pdf</p>
                          <p className="text-[11px] text-gray-400 font-mono">1.4 MB · Signé numériquement SHA-256</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toast.success("Téléchargement du rapport PDF en cours...")}
                        className="rounded-xl border border-white/[0.08] bg-[#141a23] px-3.5 py-1.5 text-xs font-bold text-[#00D084] hover:bg-[#1a2330] transition cursor-pointer"
                      >
                        Télécharger
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/[0.08] pt-3 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setComposeTo(selectedEmail.from);
                      setComposeSubject(`Re: ${selectedEmail.subject}`);
                      setEmailFolder("compose");
                    }}
                    className="flex items-center gap-2 text-xs font-bold text-[#00D084] hover:underline cursor-pointer"
                  >
                    <Send className="size-3.5" />
                    Répondre à cet e-mail officiel
                  </button>
                  <span className="text-xs text-gray-500 font-mono">ID: {selectedEmail.id}</span>
                </div>
              </div>
            ) : (
              <div className="my-auto text-center text-gray-400 text-sm">
                Sélectionnez un e-mail à gauche pour en afficher le contenu.
              </div>
            )}
          </article>
        </section>
      )}

      {/* ========================================================================= */}
      {/* CANAL 3: APPEL AUDIO DIRECT CHIFFRÉ */}
      {/* ========================================================================= */}
      {activeChannel === "call" && (
        <section className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 sm:p-8 shadow-xl">
          {callState === "IDLE" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-white">Ligne Téléphonique Directe MT5</h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Appel sécurisé chiffré de bout en bout avec les responsables de stratégie et le desk.
                </p>
              </div>

              {/* Agent selector cards */}
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    name: "Dr. Antoine R.",
                    role: "Directeur Recherche Quantitative",
                    avatar: "AR",
                    phoneExt: "Ligne directe : +1 (212) 892-0144 · #104",
                    status: "Disponible",
                  },
                  {
                    name: "Elena V.",
                    role: "Responsable Support VIP 24/7",
                    avatar: "EV",
                    phoneExt: "Ligne directe : +1 (212) 892-0144 · #102",
                    status: "Disponible",
                  },
                  {
                    name: "Sarah Benali",
                    role: "Responsable Risk Governance",
                    avatar: "SB",
                    phoneExt: "Ligne directe : +1 (212) 892-0144 · #108",
                    status: "Disponible",
                  },
                ].map((agent) => {
                  const isSelected = callSelectedAgent.name === agent.name;
                  return (
                    <div
                      key={agent.name}
                      onClick={() => setCallSelectedAgent(agent as any)}
                      className={`cursor-pointer rounded-3xl border p-5 transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-[#00D084] bg-[#00D084]/15 shadow-xl ring-1 ring-[#00D084]"
                          : "border-white/[0.08] bg-[#0c1017] hover:border-white/[0.2]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-3.5">
                          <div className="grid size-12 place-items-center rounded-2xl bg-white/[0.08] font-mono text-sm font-black text-white">
                            {agent.avatar}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white">{agent.name}</h4>
                            <p className="text-xs text-gray-400">{agent.role}</p>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-white/[0.06] pt-3 text-xs space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[#00D084] font-medium text-xs">
                            <span className="size-2 rounded-full bg-[#00D084] animate-pulse" />
                            {agent.status}
                          </div>
                          <p className="text-xs text-gray-400 font-mono">{agent.phoneExt}</p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startAudioCall(agent as any);
                        }}
                        className="neon-btn mt-5 w-full rounded-2xl py-3 text-xs font-black uppercase tracking-wider text-black cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Phone className="size-4" />
                        LANCER L'APPEL
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ACTIVE CALL SCREEN */}
          {(callState === "CALLING" || callState === "CONNECTED" || callState === "ENDED") && (
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-[#080b0f] p-8 min-h-[460px] flex flex-col justify-between items-center text-center">
              <div className="flex items-center gap-2 rounded-full border border-white/[0.1] bg-black/40 px-4 py-1.5 text-xs font-mono text-gray-300">
                <Lock className="size-3.5 text-[#00D084]" />
                Ligne Chiffrée 256-bit MT5 · Equinix NY4
              </div>

              <div className="my-auto space-y-5">
                <div className="relative mx-auto size-28">
                  <div className="grid size-full place-items-center rounded-3xl border-2 border-[#00D084] bg-[#10141b] text-3xl font-black text-white shadow-[0_0_30px_rgba(0,208,132,0.25)]">
                    {callSelectedAgent.avatar}
                  </div>
                  {callState === "CONNECTED" && (
                    <span className="absolute -bottom-1 -right-1 size-8 rounded-full bg-[#00D084] border-2 border-[#080b0f] grid place-items-center text-black font-black text-xs">
                      <Phone className="size-4" />
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white">{callSelectedAgent.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-300 mt-0.5">{callSelectedAgent.role}</p>
                </div>

                {callState === "CALLING" && (
                  <div className="flex items-center justify-center gap-2 text-sm text-sky-400 font-mono animate-pulse">
                    <PhoneIncoming className="size-4 animate-bounce" />
                    Établissement du tunnel sécurisé...
                  </div>
                )}

                {callState === "CONNECTED" && (
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-[#00D084]/15 border border-[#00D084]/30 px-5 py-2 font-mono text-sm font-black text-[#00D084]">
                      <span className="size-2.5 rounded-full bg-[#00D084] animate-ping" />
                      {formatDuration(callDuration)}
                    </div>

                    {/* Audio Waveform */}
                    <div className="flex items-center justify-center gap-1.5 h-8">
                      {[10, 24, 16, 28, 14, 26, 18, 12, 22, 15, 28, 19, 14, 24].map((h, i) => (
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
                        Touches DTMF : <strong>{dialedDigits}</strong>
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
                <div className="my-2 rounded-2xl border border-white/[0.08] bg-[#10141b] p-4 shadow-xl">
                  <div className="grid grid-cols-3 gap-2.5">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          setDialedDigits((prev) => prev + d);
                          toast.info(`Touche ${d} transmise.`);
                        }}
                        className="rounded-xl border border-white/[0.08] bg-[#141a23] hover:bg-[#00D084]/20 hover:text-[#00D084] size-11 font-mono font-bold text-white transition cursor-pointer text-sm"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Call Controls */}
              <div className="flex items-center justify-center gap-4 border-t border-white/[0.08] pt-5 w-full max-w-md">
                <button
                  onClick={() => setIsMuted((prev) => !prev)}
                  className={`grid size-12 place-items-center rounded-2xl border transition cursor-pointer ${
                    isMuted
                      ? "border-rose-500/50 bg-rose-500/20 text-rose-400"
                      : "border-white/[0.1] bg-[#141a23] text-white hover:bg-white/[0.1]"
                  }`}
                  title={isMuted ? "Réactiver le micro" : "Couper le micro"}
                >
                  {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                </button>

                <button
                  onClick={() => setIsSpeakerOn((prev) => !prev)}
                  className={`grid size-12 place-items-center rounded-2xl border transition cursor-pointer ${
                    !isSpeakerOn
                      ? "border-amber-500/50 bg-amber-500/20 text-amber-400"
                      : "border-white/[0.1] bg-[#141a23] text-white hover:bg-white/[0.1]"
                  }`}
                  title={isSpeakerOn ? "Désactiver le haut-parleur" : "Activer le haut-parleur"}
                >
                  {isSpeakerOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
                </button>

                <button
                  onClick={() => setShowKeypad((prev) => !prev)}
                  className={`grid size-12 place-items-center rounded-2xl border transition cursor-pointer ${
                    showKeypad
                      ? "border-[#00D084] bg-[#00D084]/20 text-[#00D084]"
                      : "border-white/[0.1] bg-[#141a23] text-white hover:bg-white/[0.1]"
                  }`}
                  title="Clavier DTMF"
                >
                  <Sliders className="size-5" />
                </button>

                <button
                  onClick={endCall}
                  className="grid size-12 place-items-center rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-xl transition cursor-pointer"
                  title="Raccrocher"
                >
                  <PhoneOff className="size-5" />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── LIGHTBOX MODAL FULL-SCREEN POUR LES CAPTURES D'ÉCRAN ── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/[0.15] bg-[#10141b] p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ImageIcon className="size-4 text-[#00D084]" />
                <span>{lightboxImage.caption || "Capture d'écran haute résolution"}</span>
              </div>
              <button
                onClick={() => setLightboxImage(null)}
                className="text-gray-400 hover:text-white p-1.5 rounded-xl bg-white/[0.06] cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/[0.08] max-h-[70vh] flex items-center justify-center bg-black">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.caption ?? "Capture"}
                className="max-h-[70vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 pt-1 font-mono">
              <span>Chiffrement SHA-256</span>
              <button
                onClick={() => toast.success("Téléchargement de la capture HD...")}
                className="rounded-xl border border-white/[0.08] bg-[#141a23] px-3.5 py-1.5 text-xs font-bold text-[#00D084] hover:bg-[#1a2330] cursor-pointer"
              >
                Télécharger l'image HD
              </button>
            </div>
          </div>
        </div>
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
  const [activeNav, setActiveNav] = useState("Auto-Trader");
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
    [Bot, "Auto-Trader"],
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
        toast.success("Auto-Trader activé en direct (Flux FIX Equinix NY4).");
      } else {
        toast.warning("Auto-Trader mis en pause de sécurité.");
      }
      return next;
    });
  };

  const handleToggleBotPause = (botId: EngineBot["id"]) => {
    setBots((prev) =>
      prev.map((b) => {
        if (b.id === botId) {
          const nextState = b.statusBadge === "ACTIF" ? "EN PAUSE" : "ACTIF";
          toast.info(`Auto-Trader ${b.name} : ${nextState}.`);
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
                {activeNav === "Auto-Trader" && "Auto-Trader · AI Control Center"}
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

            <StatusPill variant={running ? "emerald" : "rose"}>
              {running ? "AUTO-TRADER ACTIF" : "AUTO-TRADER EN PAUSE"}
            </StatusPill>

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
          {activeNav === "Auto-Trader" && (
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
              onOpenEngine={() => setActiveNav("Auto-Trader")}
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
          <div className="w-full max-w-xl rounded-3xl border border-white/[0.1] bg-[#10141b] p-7 sm:p-9 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="font-black text-2xl text-white">Déposer des fonds</h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Alimentez instantanément votre compte de trading ECN</p>
              </div>
              <button onClick={() => setDepositOpen(false)} className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition cursor-pointer">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">MONTANT DU DÉPÔT (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-2xl font-bold text-gray-500">$</span>
                  <input
                    type="number"
                    step="any"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full rounded-2xl border border-white/[0.1] bg-black/40 pl-10 pr-4 py-4 font-mono text-2xl sm:text-3xl font-bold text-white outline-none focus:border-[#00D084] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                {["500", "1000", "2500", "5000"].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className={`rounded-xl border py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                      depositAmount === amt
                        ? "border-[#00D084] bg-[#00D084]/15 text-[#00D084]"
                        : "border-white/[0.08] bg-[#141a23] text-gray-300 hover:border-[#00D084]/40 hover:text-white"
                    }`}
                  >
                    +${amt}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">MODE DE PAIEMENT SÉCURISÉ</label>
                <select
                  value={depositMethod}
                  onChange={(e) => setDepositMethod(e.target.value)}
                  className="w-full rounded-2xl border border-white/[0.1] bg-[#0c1017] px-4 py-3.5 text-xs sm:text-sm text-white outline-none focus:border-[#00D084] transition"
                >
                  <option value="Virement SEPA">Virement Bancaire SEPA Instantané</option>
                  <option value="Carte ECN">Carte de Débit / Crédit ECN</option>
                  <option value="USDT TRC20">Crypto USDT (TRC20 / ERC20)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositOpen(false)}
                  className="flex-1 rounded-2xl border border-white/[0.08] bg-[#141a23] py-3.5 text-xs sm:text-sm font-bold text-gray-400 hover:text-white hover:bg-[#1a2330] transition cursor-pointer"
                >
                  ANNULER
                </button>
                <button
                  type="submit"
                  className="neon-btn flex-1 rounded-2xl py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-black transition cursor-pointer"
                >
                  CONFIRMER LE DÉPÔT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RETRAIT MODAL */}
      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-3xl border border-white/[0.1] bg-[#10141b] p-7 sm:p-9 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="font-black text-2xl text-white">Demande de Retrait</h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Retirez vos fonds disponibles vers votre compte bancaire</p>
              </div>
              <button onClick={() => setWithdrawOpen(false)} className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition cursor-pointer">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-5">
              <div className="flex items-center justify-between rounded-2xl border border-[#00D084]/20 bg-[#00D084]/10 px-5 py-4 text-xs sm:text-sm text-gray-300">
                <span className="font-medium text-gray-300">Solde disponible :</span>
                <strong className="font-mono text-base sm:text-lg text-[#00D084] font-black">${balance.toFixed(2)} USD</strong>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">MONTANT DU RETRAIT (USD)</label>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(balance.toFixed(2))}
                    className="text-xs font-bold text-[#00D084] hover:underline cursor-pointer"
                  >
                    MAX (${balance.toFixed(2)})
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-2xl font-bold text-gray-500">$</span>
                  <input
                    type="number"
                    step="any"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full rounded-2xl border border-white/[0.1] bg-black/40 pl-10 pr-4 py-4 font-mono text-2xl sm:text-3xl font-bold text-white outline-none focus:border-[#00D084] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">COORDONNÉES BANCAIRES (IBAN)</label>
                <input
                  type="text"
                  value={withdrawIban}
                  onChange={(e) => setWithdrawIban(e.target.value)}
                  placeholder="FR76 3000 6000 0112 3456 7890 189"
                  className="w-full rounded-2xl border border-white/[0.1] bg-black/40 px-4 py-3.5 font-mono text-xs sm:text-sm text-white outline-none focus:border-[#00D084] transition"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWithdrawOpen(false)}
                  className="flex-1 rounded-2xl border border-white/[0.08] bg-[#141a23] py-3.5 text-xs sm:text-sm font-bold text-gray-400 hover:text-white hover:bg-[#1a2330] transition cursor-pointer"
                >
                  ANNULER
                </button>
                <button
                  type="submit"
                  className="neon-btn flex-1 rounded-2xl py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-black transition cursor-pointer"
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
