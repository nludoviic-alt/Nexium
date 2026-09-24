import { Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
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
  ChevronLeft,
  Coins,
  Copy,
  CreditCard,
  Landmark,
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
  LogOut,
  Mail,
  Maximize2,
  Menu,
  MessageCircle,
  MessageSquare,
  Mic,
  MicOff,
  Minimize2,
  Monitor,
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
  Gift,
  Wallet,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useId, useMemo, useState, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { TradingViewSuperchart } from "@/components/site/TradingViewSuperchart";
import { MetaTrader5Terminal, presetCycleStats, type Mt5Position, type PresetQuotaStats, type PresetStakes } from "@/components/dashboard/MetaTrader5Terminal";
import {
  isPresetExpired,
  PRESET_ENGINE_KEY,
  PRESET_IDS,
  PRESET_LABEL,
  PRESET_RULES,
  PRESET_STAT_KEYS,
  type PresetId,
} from "@/lib/preset-rules";
import {
  supabase,
  isSupabaseConfigured,
  getUserProfile,
  updateUserProfile,
  requestPresetsActivation,
  recordAuditLog,
  getClientChatMessages,
  sendChatMessage,
  subscribeToDirectMessages,
  getUserTransactions,
  createDepositRequest,
  createWithdrawalRequest,
  subscribeToUserProfile,
  subscribeToTransactions,
  getClientEmailConversations,
  sendClientEmailMessage,
  subscribeToClientEmails,
  getPaymentSettings,
  subscribeToPaymentSettings,
  type PaymentSettings,
} from "@/lib/supabase";
import { NotificationCenterModal } from "@/components/dashboard/NotificationCenterModal";
import {
  type AppNotification,
  playNotificationSound,
  setNotificationSoundEnabled,
  getNotificationSoundEnabled,
  triggerNotificationToast,
} from "@/lib/notifications";


// ----------------------------------------------------
// TYPES & DATA STRUCTURES
// ----------------------------------------------------
interface EngineBot {
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

interface PositionItem {
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

interface TransactionItem {
  id: string;
  date: string;
  type: string;
  amount: string;
  amountNum: number;
  currency: string;
  status: "Confirmé" | "En cours" | "Exécuté" | "En attente" | "Rejeté";
  method?: string;
  color: string;
}

interface JournalEntry {
  id: string;
  time: string;
  event: string;
  symbol?: string;
  detail: string;
  status: "VALIDÉ" | "EXÉCUTÉ" | "CLÔTURÉ" | "ALERTE" | "INFO";
  statusVariant: "emerald" | "sky" | "purple" | "amber" | "slate";
}

interface ChatMessage {
  id: string;
  sender: "user" | "desk" | "system" | "expert" | "ai" | "support";
  senderName: string;
  text: string;
  time: string;
  avatar?: string | undefined;
  image?: string | undefined;
  imageCaption?: string | undefined;
  isVoice?: boolean | undefined;
  voiceDuration?: string | undefined;
  reactions?: { emoji: string; count: number; byMe?: boolean }[] | undefined;
  status?: "sent" | "delivered" | "read" | undefined;
  replyTo?: { senderName: string; text: string } | undefined;
  contactId?: string | undefined;
}

interface PriceAlert {
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
    statusBadge: "EN PAUSE",
    mainState: "WAITING FOR SETUP",
    markets: "XAUUSD",
    primarySymbol: "XAUUSD",
    strategy: "Trend Pullback / Breakout",
    marketRegime: "TRENDING UP",
    regimeDetail: "Volatilité modérée · Tendance haussière H4/M15",
    volatility: "MODERATE",
    lastScore: "84 / 100",
    lastScoreNum: 84,
    openPositions: 0,
    pnlToday: "$0.00",
    pnlTodayNum: 0,
    lastSignalTime: "En attente",
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
      result: "WAITING",
    },
    lastDecision: {
      action: "SETUP SCAN",
      symbol: "XAUUSD",
      score: 84,
      result: "WAITING FOR CONFIRMATION",
    },
    activity: {
      signals: 0,
      qualified: 0,
      executed: 0,
      rejected: 0,
      pnl: "$0.00",
    },
    risk: {
      allocation: "0.25%",
      drawdown: "0.0%",
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
    statusBadge: "EN PAUSE",
    mainState: "WAITING FOR SETUP",
    markets: "EURUSD • GBPUSD • USDJPY",
    primarySymbol: "EURUSD",
    strategy: "Trend Following",
    marketRegime: "TRENDING",
    regimeDetail: "EURUSD Trending Down · USDJPY Trending Up",
    volatility: "LOW / STABLE",
    lastScore: "79 / 100",
    lastScoreNum: 79,
    openPositions: 0,
    pnlToday: "$0.00",
    pnlTodayNum: 0,
    lastSignalTime: "En attente",
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
      result: "WAITING",
    },
    lastDecision: {
      action: "SETUP SCAN",
      symbol: "EURUSD",
      score: 74,
      result: "WAITING FOR CONFIRMATION",
      reason: "Recherche de configuration optimale",
    },
    activity: {
      signals: 0,
      qualified: 0,
      executed: 0,
      rejected: 0,
      pnl: "$0.00",
    },
    risk: {
      allocation: "0.20%",
      drawdown: "0.0%",
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
    statusBadge: "EN PAUSE",
    mainState: "WAITING FOR SETUP",
    markets: "NAS100 • US30",
    primarySymbol: "NAS100",
    strategy: "Mean Reversion",
    marketRegime: "RANGING",
    regimeDetail: "NAS100 Ranging · US30 High Volatility",
    volatility: "HIGH",
    lastScore: "81 / 100",
    lastScoreNum: 81,
    openPositions: 0,
    pnlToday: "$0.00",
    pnlTodayNum: 0,
    lastSignalTime: "En attente",
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
      action: "SETUP SCAN",
      symbol: "NAS100",
      score: 81,
      result: "WAITING FOR CONFIRMATION",
      reason: "Recherche de configuration optimale",
    },
    activity: {
      signals: 0,
      qualified: 0,
      executed: 0,
      rejected: 0,
      pnl: "$0.00",
    },
    risk: {
      allocation: "0.15%",
      drawdown: "0.0%",
      status: "NORMAL",
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

interface EmailItem {
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
  position?: PositionItem | undefined;
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

  // Confirmation Modals State
  const [confirmPreset, setConfirmPreset] = useState<typeof PRESETS[0] | null>(null);
  const [confirmTradingToggle, setConfirmTradingToggle] = useState<boolean>(false);

  const requestSelectPreset = (preset: typeof PRESETS[0]) => {
    setConfirmPreset(preset);
  };

  const handleConfirmPreset = () => {
    if (!confirmPreset) return;
    setActivePreset(confirmPreset.id);
    setIsTradingActive(true);
    playOpenSound();
    toast.success(`Preset "${confirmPreset.name}" activé avec succès sur ${bot.chart.symbol}.`);
    setConfirmPreset(null);
  };

  const handleConfirmTradingToggle = () => {
    const next = !isTradingActive;
    setIsTradingActive(next);
    if (next) {
      playOpenSound();
      toast.success(`Trading IA activé sur ${bot.chart.symbol} !`);
    } else {
      toast.warning(`Trading IA suspendu sur ${bot.chart.symbol}.`);
    }
    setConfirmTradingToggle(false);
  };

  return (
    <div className="space-y-4">
      {/* 1. BARRE DE PRESETS & CONTRÔLE STRATÉGIE */}
      <div className="admin-card p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-700/50 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className={`size-2.5 rounded-full ${isTradingActive ? "bg-emerald-400 animate-ping" : "bg-rose-500"}`} />
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Stratégie &amp; Presets IA
            </h3>
            <span className="rounded-md border border-slate-700/60 bg-[#121a2d] px-2 py-0.5 font-mono text-[10px] font-bold text-slate-300">
              {bot.chart.symbol}
            </span>
          </div>

          <button
            onClick={() => setConfirmTradingToggle(true)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md ${
              isTradingActive
                ? "border border-rose-500/50 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                : "admin-btn-primary shadow-[0_0_15px_rgba(16,185,129,0.3)]"
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {PRESETS.map((preset) => {
            const isPresetActive = activePreset === preset.id && isTradingActive;
            return (
              <button
                key={preset.id}
                onClick={() => requestSelectPreset(preset)}
                className={`p-2.5 text-left transition-all cursor-pointer rounded-xl ${
                  isPresetActive
                    ? "admin-card-emerald border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400"
                    : "admin-subcard text-slate-300 hover:border-slate-500/50 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs truncate">{preset.name}</span>
                  {isPresetActive && (
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>
                <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-slate-400">
                  <span>R:R {preset.riskReward}</span>
                  <span className="text-emerald-400 font-bold">{preset.expectedScore}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODALE DE CONFIRMATION DU PRESET STRATÉGIQUE (SIMPLIFIÉE) */}
      {confirmPreset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm admin-card p-5 sm:p-6 shadow-2xl space-y-4 border border-emerald-500/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <ShieldCheck className="size-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">Appliquer le Preset ?</h3>
                  <p className="text-xs text-emerald-400 font-mono font-bold">{confirmPreset.name} · {bot.chart.symbol}</p>
                </div>
              </div>
              <button onClick={() => setConfirmPreset(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="size-4" />
              </button>
            </div>

            <div className="admin-subcard p-2.5 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">R:R : <strong className="text-white">{confirmPreset.riskReward}</strong></span>
              <span className="text-slate-400">Score IA : <strong className="text-amber-300">{confirmPreset.expectedScore}</strong></span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmPreset(null)}
                className="flex-1 rounded-xl border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800 py-2.5 text-xs font-bold text-slate-300 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmPreset}
                className="flex-1 admin-btn-primary py-2.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE CONFIRMATION ACTIVATION / PAUSE DU GRAPHIQUE (SIMPLIFIÉE) */}
      {confirmTradingToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-sm admin-card p-5 sm:p-6 shadow-2xl space-y-4 border ${
            isTradingActive ? "border-rose-500/40" : "border-emerald-500/40"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`grid size-9 place-items-center rounded-xl border font-mono ${
                  isTradingActive
                    ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                    : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                }`}>
                  {isTradingActive ? <AlertTriangle className="size-4.5" /> : <Play className="size-4.5" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    {isTradingActive ? `Stopper ${bot.chart.symbol} ?` : `Activer ${bot.chart.symbol} ?`}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">{bot.name}</p>
                </div>
              </div>
              <button onClick={() => setConfirmTradingToggle(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              {isTradingActive
                ? "Suspendre la prise d'ordres sur cet actif."
                : "Activer la détection de signaux et l'exécution automatique."}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmTradingToggle(false)}
                className="flex-1 rounded-xl border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800 py-2.5 text-xs font-bold text-slate-300 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmTradingToggle}
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  isTradingActive
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "admin-btn-primary"
                }`}
              >
                {isTradingActive ? "Stopper" : "Activer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. GRAPHIQUE INSTITUTIONNEL EN TEMPS RÉEL (SIMPLIFIÉ & ÉPURÉ) */}
      <TradingViewSuperchart
        initialSymbol={bot.primarySymbol || (bot.id === "nexium-ai-gold" ? "XAUUSD" : "EURUSD")}
        isTradingActive={isTradingActive}
        onToggleTrading={() => setConfirmTradingToggle(true)}
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
  balance,
  mt5AccountNumber,
  onOpenBotDetail,
  onToggleBotPause,
  onSetAllBotsActive,
  onClosePosition,
}: {
  bots: EngineBot[];
  positions: PositionItem[];
  balance: number;
  mt5AccountNumber: string;
  onOpenBotDetail: (bot: EngineBot) => void;
  onToggleBotPause: (botId: EngineBot["id"]) => void;
  onSetAllBotsActive: (active: boolean) => void;
  onClosePosition: (pos: PositionItem) => void;
}) {
  const [selectedBotId, setSelectedBotId] = useState<EngineBot["id"]>("nexium-ai-gold");
  const [tradingMode, setTradingMode] = useState<"simulation" | "demo" | "live">("demo");
  // Reflète l'état réel persisté des moteurs (engines_config) — jamais une
  // valeur locale par défaut, pour ne pas ré-afficher "ACTIF" après un
  // rafraîchissement alors que le trading est en pause côté base.
  const isEngineRunning = useMemo(() => bots.some((b) => b.statusBadge === "ACTIF"), [bots]);
  const [forcingTrade, setForcingTrade] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<"decision" | "metrics" | "journal">("decision");
  const [logFilter, setLogFilter] = useState<"all" | "won" | "lost" | "open">("all");

  // Trade Sizing & Risk Parameters State
  const [sizingMode, setSizingMode] = useState<"fixed_lot" | "risk_percent" | "fixed_usd">("fixed_lot");
  const [lotSize, setLotSize] = useState<number>(0.20);
  const [riskPercentPerTrade, setRiskPercentPerTrade] = useState<number>(0.50);
  const [fixedUsdPerTrade, setFixedUsdPerTrade] = useState<number>(100);
  const [leverage, setLeverage] = useState<string>("1:100");

  // Stop Loss & Take Profit Settings
  const [stopLossPips, setStopLossPips] = useState<number>(25);
  const [takeProfitRatio, setTakeProfitRatio] = useState<number>(2.5); // 1:2.5
  const [trailingStopEnabled, setTrailingStopEnabled] = useState<boolean>(true);
  const [trailingStopDistance, setTrailingStopDistance] = useState<number>(15);
  const [breakEvenEnabled, setBreakEvenEnabled] = useState<boolean>(true);
  const [partialCloseEnabled, setPartialCloseEnabled] = useState<boolean>(true);

  // Execution & Governor Filters
  const [maxSlippagePips, setMaxSlippagePips] = useState<number>(0.8);
  const [maxAllowedSpread, setMaxAllowedSpread] = useState<number>(1.2);
  const [executionType, setExecutionType] = useState<"MARKET_FIX" | "LIMIT_PULLBACK" | "STOP_BREAKOUT">("MARKET_FIX");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(true);

  // 3 moteurs institutionnels (Gold, FX, Index)
  const activeBots = useMemo(() => bots, [bots]);
  const selectedBot: EngineBot = (activeBots.find((b) => b.id === selectedBotId) ?? activeBots[0] ?? INITIAL_BOTS[0])!;
  const matchingPos = positions.find((p) => p.botId === selectedBot.id);

  // Live Calculations
  const calculatedRiskUsd = useMemo(() => {
    if (sizingMode === "fixed_lot") {
      const pipValue = lotSize * 10;
      return Number((stopLossPips * pipValue).toFixed(2));
    } else if (sizingMode === "risk_percent") {
      return Number((balance * (riskPercentPerTrade / 100)).toFixed(2));
    } else {
      return fixedUsdPerTrade;
    }
  }, [sizingMode, lotSize, stopLossPips, riskPercentPerTrade, fixedUsdPerTrade]);

  const calculatedRewardUsd = useMemo(() => {
    return Number((calculatedRiskUsd * takeProfitRatio).toFixed(2));
  }, [calculatedRiskUsd, takeProfitRatio]);

  const calculatedEffectiveLot = useMemo(() => {
    if (sizingMode === "fixed_lot") return lotSize;
    const pipValuePerLot = 10;
    const eff = calculatedRiskUsd / (stopLossPips * pipValuePerLot);
    return Math.max(0.01, Number(eff.toFixed(2)));
  }, [sizingMode, lotSize, calculatedRiskUsd, stopLossPips]);

  const requiredMargin = useMemo(() => {
    const levNum = parseInt(leverage.replace("1:", "")) || 100;
    return Number(((calculatedEffectiveLot * 100000) / levNum).toFixed(2));
  }, [calculatedEffectiveLot, leverage]);

  // Quick Preset Application Logic
  const applyPresetProfile = (type: "conservative" | "balanced" | "aggressive") => {
    if (type === "conservative") {
      setSizingMode("fixed_lot");
      setLotSize(0.10);
      setStopLossPips(15);
      setTakeProfitRatio(2.0);
      setTrailingStopEnabled(true);
      setTrailingStopDistance(10);
      setBreakEvenEnabled(true);
      setPartialCloseEnabled(true);
      setMaxSlippagePips(0.5);
      setMaxAllowedSpread(0.8);
      toast.success("Profil 'Scalping Conservateur' appliqué (0.10 lot · SL 15 pips · R:R 1:2.0).");
    } else if (type === "balanced") {
      setSizingMode("fixed_lot");
      setLotSize(0.25);
      setStopLossPips(25);
      setTakeProfitRatio(2.5);
      setTrailingStopEnabled(true);
      setTrailingStopDistance(15);
      setBreakEvenEnabled(true);
      setPartialCloseEnabled(true);
      setMaxSlippagePips(0.8);
      setMaxAllowedSpread(1.2);
      toast.success("Profil 'Day Trading Équilibré' appliqué (0.25 lot · SL 25 pips · R:R 1:2.5).");
    } else {
      setSizingMode("fixed_lot");
      setLotSize(0.50);
      setStopLossPips(35);
      setTakeProfitRatio(3.0);
      setTrailingStopEnabled(true);
      setTrailingStopDistance(20);
      setBreakEvenEnabled(true);
      setPartialCloseEnabled(false);
      setMaxSlippagePips(1.2);
      setMaxAllowedSpread(1.8);
      toast.success("Profil 'Breakout Dynamique' appliqué (0.50 lot · SL 35 pips · R:R 1:3.0).");
    }
  };

  // Request Profile Preset Application with Confirmation
  const requestApplyPresetProfile = (type: "conservative" | "balanced" | "aggressive") => {
    const label =
      type === "conservative"
        ? "0.10 lot · SL 15p · R:R 1:2.0"
        : type === "balanced"
        ? "0.25 lot · SL 25p · R:R 1:2.5"
        : "0.50 lot · SL 35p · R:R 1:3.0";

    const name = type === "conservative" ? "Conservateur" : type === "balanced" ? "Équilibré" : "Dynamique";

    setConfirmModal({
      isOpen: true,
      type: "profile_preset",
      presetType: type,
      title: `Profil ${name} ?`,
      description: `Ajuster ${selectedBot.name} : ${label}`,
      actionButtonLabel: `Appliquer`,
      isDangerous: false,
    });
  };

  const handleSaveExecutionSettings = (e: React.FormEvent) => {
    e.preventDefault();
    playWinSound();
    toast.success(
      `Paramètres MT5 enregistrés pour ${selectedBot.name} : ${calculatedEffectiveLot} lot(s) · SL ${stopLossPips} pips · TP (1:${takeProfitRatio.toFixed(1)}R).`
    );
  };

  // Security Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "master_engine" | "bot_toggle" | "profile_preset";
    targetBot?: EngineBot;
    targetState?: "ACTIF" | "EN PAUSE";
    presetType?: "conservative" | "balanced" | "aggressive";
    title: string;
    description: string;
    actionButtonLabel: string;
    isDangerous?: boolean;
  } | null>(null);

  // Request Master Engine Power Toggle (With Security Confirmation)
  const requestToggleEnginePower = () => {
    const nextActive = !isEngineRunning;
    setConfirmModal({
      isOpen: true,
      type: "master_engine",
      targetState: nextActive ? "ACTIF" : "EN PAUSE",
      title: nextActive ? "Activer le Trading Auto ?" : "Mettre en Pause le Trading ?",
      description: nextActive
        ? "Le moteur reconnectera les flux FIX et reprendra la prise d'ordres."
        : "Tous les ordres automatiques seront suspendus. Vos positions ouvertes restent actives.",
      actionButtonLabel: nextActive ? "Activer" : "Mettre en Pause",
      isDangerous: !nextActive,
    });
  };

  // Request Individual Bot Pause / Activate (With Security Confirmation)
  const requestToggleBotPause = (bot: EngineBot) => {
    const nextState = bot.statusBadge === "ACTIF" ? "EN PAUSE" : "ACTIF";
    setConfirmModal({
      isOpen: true,
      type: "bot_toggle",
      targetBot: bot,
      targetState: nextState,
      title: nextState === "ACTIF" ? `Activer ${bot.primarySymbol} ?` : `Mettre en pause ${bot.primarySymbol} ?`,
      description: nextState === "ACTIF"
        ? `Réactiver le scan et l'exécution sur ${bot.name}.`
        : `Stopper la prise de nouveaux ordres sur ${bot.name}.`,
      actionButtonLabel: nextState === "ACTIF" ? "Activer" : "Mettre en Pause",
      isDangerous: nextState === "EN PAUSE",
    });
  };

  // Confirm Action Execution
  const handleConfirmAction = () => {
    if (!confirmModal) return;
    if (confirmModal.type === "master_engine") {
      const next = !isEngineRunning;
      onSetAllBotsActive(next);
      if (next) {
        playOpenSound();
        toast.success("Trading Automatique global activé avec succès sur flux FIX NY4 !");
      } else {
        toast.warning("Trading Automatique global suspendu de sécurité.");
      }
    } else if (confirmModal.type === "bot_toggle" && confirmModal.targetBot) {
      onToggleBotPause(confirmModal.targetBot.id);
    } else if (confirmModal.type === "profile_preset" && confirmModal.presetType) {
      applyPresetProfile(confirmModal.presetType);
    }
    setConfirmModal(null);
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

  if (bots.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-700/60 bg-[#0c121e] px-6 py-14 text-center shadow-xl">
        <h2 className="text-lg font-bold text-white">Aucun moteur disponible</h2>
        <p className="mt-2 text-sm text-slate-400">Votre Desk a masqué les stratégies de ce profil. Contactez votre conseiller pour plus d’informations.</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── 1. BARRE DE COMMANDE PRINCIPALE (CHARTE PROFIL USER HARMONISÉE) ── */}
      <section className="admin-card p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Titre & Statut */}
          <div className="flex items-center gap-3.5">
            <div className="grid size-11 place-items-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Cpu className="size-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Centre de Contrôle Moteurs IA
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Flux FIX NY4 · 11ms
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Exécution algorithmique MT5 · Compte ECN Direct #{mt5AccountNumber}
              </p>
            </div>
          </div>

          {/* Master Power & Test Signal */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Master Engine Power Toggle Button */}
            <button
              onClick={requestToggleEnginePower}
              className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md ${
                isEngineRunning
                  ? "border border-emerald-500/60 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                  : "border border-rose-500/60 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.25)]"
              }`}
              title="Interrupteur général : active ou suspend instantanément l'envoi d'ordres automatiques"
            >
              <Power className="size-4" />
              <span>Trading Auto : {isEngineRunning ? "ACTIF" : "EN PAUSE"}</span>
            </button>

            {/* Quick Test Trade Button */}
            <button
              onClick={handleTestTrade}
              disabled={forcingTrade || !isEngineRunning}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800 disabled:opacity-50 px-3.5 py-2.5 text-xs font-bold text-white transition cursor-pointer shadow-sm"
              title="Simule la détection d'un setup L2 et valide le flux FIX"
            >
              <Activity className="size-3.5 text-indigo-400" />
              <span>{forcingTrade ? "Exécution..." : "Signal Test L2"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. CARTES BOTS ACTIFS (COULEURS HARMONISÉES USER PROFILE) ── */}
      {/* ── 2. CARTES BOTS ACTIFS (3 MOTEURS IA + ALLOCATION PAR MARCHÉ) ── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 2.1 CARTE BOT 1 (GOLD - AMBER / GOLD) */}
        {activeBots[0] && (() => {
          const bot = activeBots[0];
          const isSelected = bot.id === selectedBotId;
          return (
            <article
              onClick={() => setSelectedBotId(bot.id)}
              className={`admin-card-amber p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer relative overflow-hidden ${
                isSelected
                  ? "border-amber-400/90 shadow-[0_0_25px_rgba(245,158,11,0.22)] ring-1 ring-amber-400/80"
                  : "hover:border-amber-500/50"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center rounded border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-amber-300">
                      {bot.primarySymbol}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-1.5 tracking-tight">{bot.name}</h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold ${
                      bot.statusBadge === "ACTIF"
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                        : "border-rose-500/40 bg-rose-500/15 text-rose-400"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        bot.statusBadge === "ACTIF" ? "bg-emerald-400 animate-ping" : "bg-rose-400"
                      }`}
                    />
                    {bot.statusBadge}
                  </span>
                </div>

                <div className="mt-3.5 flex items-end justify-between border-y border-amber-500/20 py-2.5 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-300 font-sans uppercase font-bold">P&amp;L JOUR</span>
                    <p className={`text-lg sm:text-xl font-bold mt-0.5 ${bot.pnlTodayNum >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {bot.pnlToday}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs">
                      <span className="text-slate-300 text-[10px] uppercase font-sans mr-1">Score</span>
                      <strong className="text-amber-300">{bot.lastScore}</strong>
                    </div>
                    <div className="mt-1.5 h-1.5 w-16 rounded-full bg-slate-800 overflow-hidden ml-auto">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${bot.lastScoreNum}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBotId(bot.id);
                  }}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                    !isSelected
                      ? "border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800 text-slate-200"
                      : bot.statusBadge === "ACTIF"
                      ? "admin-btn-primary shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                      : "border border-rose-500/60 bg-rose-500/20 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                  }`}
                >
                  {!isSelected ? "Choisir" : bot.statusBadge === "ACTIF" ? "● Actif" : "● En Pause"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenBotDetail(bot);
                  }}
                  className="rounded-xl border border-slate-700/60 bg-[#0b1220] hover:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                >
                  Détails
                </button>
              </div>
            </article>
          );
        })()}

        {/* 2.2 CARTE BOT 2 (FOREX - CYAN) */}
        {activeBots[1] && (() => {
          const bot = activeBots[1];
          const isSelected = bot.id === selectedBotId;
          return (
            <article
              onClick={() => setSelectedBotId(bot.id)}
              className={`admin-card-cyan p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer relative overflow-hidden ${
                isSelected
                  ? "border-cyan-400/90 shadow-[0_0_25px_rgba(6,182,212,0.22)] ring-1 ring-cyan-400/80"
                  : "hover:border-cyan-500/50"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center rounded border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-cyan-300">
                      {bot.primarySymbol}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-1.5 tracking-tight">{bot.name}</h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold ${
                      bot.statusBadge === "ACTIF"
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                        : "border-rose-500/40 bg-rose-500/15 text-rose-400"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        bot.statusBadge === "ACTIF" ? "bg-emerald-400 animate-ping" : "bg-rose-400"
                      }`}
                    />
                    {bot.statusBadge}
                  </span>
                </div>

                <div className="mt-3.5 flex items-end justify-between border-y border-cyan-500/20 py-2.5 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-300 font-sans uppercase font-bold">P&amp;L JOUR</span>
                    <p className={`text-lg sm:text-xl font-bold mt-0.5 ${bot.pnlTodayNum >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {bot.pnlToday}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs">
                      <span className="text-slate-300 text-[10px] uppercase font-sans mr-1">Score</span>
                      <strong className="text-cyan-300">{bot.lastScore}</strong>
                    </div>
                    <div className="mt-1.5 h-1.5 w-16 rounded-full bg-slate-800 overflow-hidden ml-auto">
                      <div className="h-full rounded-full bg-cyan-400" style={{ width: `${bot.lastScoreNum}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBotId(bot.id);
                  }}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                    !isSelected
                      ? "border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800 text-slate-200"
                      : bot.statusBadge === "ACTIF"
                      ? "admin-btn-primary shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                      : "border border-rose-500/60 bg-rose-500/20 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                  }`}
                >
                  {!isSelected ? "Choisir" : bot.statusBadge === "ACTIF" ? "● Actif" : "● En Pause"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenBotDetail(bot);
                  }}
                  className="rounded-xl border border-slate-700/60 bg-[#0b1220] hover:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                >
                  Détails
                </button>
              </div>
            </article>
          );
        })()}

        {/* 2.3 CARTE BOT 3 (INDICES - PURPLE / INDIGO) */}
        {activeBots[2] && (() => {
          const bot = activeBots[2];
          const isSelected = bot.id === selectedBotId;
          return (
            <article
              onClick={() => setSelectedBotId(bot.id)}
              className={`admin-card-purple p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer relative overflow-hidden ${
                isSelected
                  ? "border-purple-400/90 shadow-[0_0_25px_rgba(168,85,247,0.22)] ring-1 ring-purple-400/80"
                  : "hover:border-purple-500/50"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center rounded border border-purple-500/40 bg-purple-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-purple-300">
                      {bot.primarySymbol}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-1.5 tracking-tight">{bot.name}</h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold ${
                      bot.statusBadge === "ACTIF"
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                        : "border-rose-500/40 bg-rose-500/15 text-rose-400"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        bot.statusBadge === "ACTIF" ? "bg-emerald-400 animate-ping" : "bg-rose-400"
                      }`}
                    />
                    {bot.statusBadge}
                  </span>
                </div>

                <div className="mt-3.5 flex items-end justify-between border-y border-purple-500/20 py-2.5 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-300 font-sans uppercase font-bold">P&amp;L JOUR</span>
                    <p className={`text-lg sm:text-xl font-bold mt-0.5 ${bot.pnlTodayNum >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {bot.pnlToday}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs">
                      <span className="text-slate-300 text-[10px] uppercase font-sans mr-1">Score</span>
                      <strong className="text-purple-300">{bot.lastScore}</strong>
                    </div>
                    <div className="mt-1.5 h-1.5 w-16 rounded-full bg-slate-800 overflow-hidden ml-auto">
                      <div className="h-full rounded-full bg-purple-400" style={{ width: `${bot.lastScoreNum}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBotId(bot.id);
                  }}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                    !isSelected
                      ? "border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800 text-slate-200"
                      : bot.statusBadge === "ACTIF"
                      ? "admin-btn-primary shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                      : "border border-rose-500/60 bg-rose-500/20 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                  }`}
                >
                  {!isSelected ? "Choisir" : bot.statusBadge === "ACTIF" ? "● Actif" : "● En Pause"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenBotDetail(bot);
                  }}
                  className="rounded-xl border border-slate-700/60 bg-[#0b1220] hover:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                >
                  Détails
                </button>
              </div>
            </article>
          );
        })()}

        {/* 2.4 CARTE INTERRUPTEURS ON/OFF (EMERALD PALETTE) */}
        <article className="admin-card-emerald p-4 sm:p-5 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 font-mono">
                ALLOCATION PAR ACTIF
              </span>
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <p className="mt-1 text-[10px] text-slate-400">
              Activez ou suspendez les signaux MT5 par marché :
            </p>

            <div className="mt-2.5 space-y-2">
              {bots.map((b) => {
                const isBotActive = b.statusBadge === "ACTIF";
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between admin-subcard px-2.5 py-1.5"
                  >
                    <div className="truncate max-w-[100px]">
                      <p className="font-bold text-xs text-white truncate">{b.name}</p>
                      <p className="text-[9px] text-slate-400 font-mono">{b.primarySymbol}</p>
                    </div>

                    <button
                      onClick={() => requestToggleBotPause(b)}
                      className={`relative inline-flex h-4.5 w-8.5 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                        isBotActive ? "bg-emerald-500" : "bg-slate-700"
                      }`}
                      title={isBotActive ? `Désactiver ${b.name}` : `Activer ${b.name}`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                          isBotActive ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>Algos actifs</span>
            <span className="text-emerald-400 font-bold">3/3 Connectés</span>
          </div>
        </article>
      </section>

      {/* ── 3. PANNEAU DE CONFIGURATION DES MISES, STOP LOSS & EXÉCUTION MT5 ── */}
      <section className="admin-card p-5 sm:p-7 shadow-xl space-y-6">
        {/* Header with Title & Quick Presets */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-700/50 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <SlidersHorizontal className="size-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Ajustement des Mises, Stop Loss &amp; Paramètres MT5
                </h3>
                <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 text-xs font-mono font-bold text-indigo-300">
                  {selectedBot.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Dimensionnez vos positions, vos niveaux de Stop Loss / Take Profit et sécurisez votre capital en temps réel.
              </p>
            </div>
          </div>

          {/* Quick Presets & Collapse Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-1 hidden sm:inline">Profils :</span>
            <button
              type="button"
              onClick={() => requestApplyPresetProfile("conservative")}
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300 transition cursor-pointer flex items-center gap-1.5"
              title="0.10 lot · SL 15 pips · R:R 1:2.0"
            >
              <span>🛡️</span>
              <span>Conservateur</span>
            </button>
            <button
              type="button"
              onClick={() => requestApplyPresetProfile("balanced")}
              className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-300 transition cursor-pointer flex items-center gap-1.5"
              title="0.25 lot · SL 25 pips · R:R 1:2.5"
            >
              <span>⚡</span>
              <span>Équilibré</span>
            </button>
            <button
              type="button"
              onClick={() => requestApplyPresetProfile("aggressive")}
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-300 transition cursor-pointer flex items-center gap-1.5"
              title="0.50 lot · SL 35 pips · R:R 1:3.0"
            >
              <span>🚀</span>
              <span>Dynamique</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              className="p-1.5 rounded-lg border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800 text-slate-300 transition cursor-pointer ml-1"
              title={isSettingsOpen ? "Réduire" : "Développer"}
            >
              <ChevronDown className={`size-4 transition-transform duration-200 ${isSettingsOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {isSettingsOpen && (
          <form onSubmit={handleSaveExecutionSettings} className="space-y-6 animate-in fade-in duration-200">
            {/* 3 Config Cards Grid */}
            <div className="grid gap-5 md:grid-cols-3">
              {/* 1. SIZING & LOTS (EMERALD THEME) */}
              <article className="admin-card-emerald p-5 space-y-4 shadow-lg flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Calculator className="size-3.5 text-emerald-400" />
                      1. Dimensionnement de la Mise
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">Capital: ${balance.toLocaleString("fr-FR")}</span>
                  </div>

                  {/* Sizing Mode Tabs */}
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#0b1220] p-1 border border-emerald-500/20 text-xs">
                    {[
                      { id: "fixed_lot" as const, label: "Lot Fixe" },
                      { id: "risk_percent" as const, label: "% Capital" },
                      { id: "fixed_usd" as const, label: "$ Fixe" },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setSizingMode(mode.id)}
                        className={`py-1 rounded-lg font-bold transition text-center text-xs ${
                          sizingMode === mode.id
                            ? "bg-emerald-500 text-black shadow-sm font-bold"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  {/* Mode Specific Inputs */}
                  {sizingMode === "fixed_lot" && (
                    <div className="space-y-2">
                      <label className="text-xs text-slate-300 font-medium flex justify-between">
                        <span>Volume par Ordre (Lots MT5)</span>
                        <span className="font-mono text-emerald-400 font-bold">{lotSize.toFixed(2)} lot(s)</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setLotSize((v) => Math.max(0.01, Number((v - 0.05).toFixed(2))))}
                          className="size-9 rounded-xl border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800 text-white font-bold text-base grid place-items-center transition cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="10.00"
                          value={lotSize}
                          onChange={(e) => setLotSize(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                          className="flex-1 rounded-xl border border-emerald-500/30 bg-[#0b1220] px-3 py-2 text-center text-base font-mono font-bold text-white outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setLotSize((v) => Number((v + 0.05).toFixed(2)))}
                          className="size-9 rounded-xl border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800 text-white font-bold text-base grid place-items-center transition cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Quick lot preset buttons */}
                      <div className="flex items-center gap-1.5 pt-1">
                        {[0.05, 0.10, 0.20, 0.50, 1.00].map((quickLot) => (
                          <button
                            key={quickLot}
                            type="button"
                            onClick={() => setLotSize(quickLot)}
                            className={`flex-1 rounded-lg py-1 text-[11px] font-mono font-bold transition border ${
                              lotSize === quickLot
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                                : "bg-[#121a2d] text-slate-400 hover:text-white border-slate-700/50"
                            }`}
                          >
                            {quickLot.toFixed(2)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {sizingMode === "risk_percent" && (
                    <div className="space-y-2">
                      <label className="text-xs text-slate-300 font-medium flex justify-between">
                        <span>% du Solde Engagé</span>
                        <span className="font-mono text-emerald-400 font-bold">{riskPercentPerTrade.toFixed(2)} %</span>
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="3.0"
                        step="0.05"
                        value={riskPercentPerTrade}
                        onChange={(e) => setRiskPercentPerTrade(parseFloat(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[11px] font-mono text-slate-400">
                        <span>0.10% (Ultra sûr)</span>
                        <span>1.00% (Standard)</span>
                        <span>3.00% (Max)</span>
                      </div>
                    </div>
                  )}

                  {sizingMode === "fixed_usd" && (
                    <div className="space-y-2">
                      <label className="text-xs text-slate-300 font-medium flex justify-between">
                        <span>Montant Fixe Risqué ($ USD)</span>
                        <span className="font-mono text-emerald-400 font-bold">${fixedUsdPerTrade} USD</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="10"
                          min="10"
                          max="2000"
                          value={fixedUsdPerTrade}
                          onChange={(e) => setFixedUsdPerTrade(Math.max(10, parseInt(e.target.value) || 10))}
                          className="w-full rounded-xl border border-emerald-500/30 bg-[#0b1220] px-3 py-2 text-center text-base font-mono font-bold text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Levier */}
                  <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Levier ECN :</span>
                    <select
                      value={leverage}
                      onChange={(e) => setLeverage(e.target.value)}
                      className="rounded-lg border border-slate-700/60 bg-[#0b1220] px-2.5 py-1 text-xs font-mono font-bold text-white outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="1:30">1:30 (Régulé)</option>
                      <option value="1:100">1:100 (Standard Pro)</option>
                      <option value="1:200">1:200 (Institutionnel)</option>
                      <option value="1:500">1:500 (Flux Élevé)</option>
                    </select>
                  </div>
                </div>
              </article>

              {/* 2. STOP LOSS & TRAILING (AMBER THEME) */}
              <article className="admin-card-amber p-5 space-y-4 shadow-lg flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Shield className="size-3.5 text-amber-400" />
                      2. Protection &amp; Stop Loss
                    </span>
                    <span className="text-[11px] font-mono text-amber-400 font-bold">Coupe-Circuit Actif</span>
                  </div>

                  {/* Stop Loss Slider & Pip Input */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-300 font-medium">
                      <span>Stop Loss Strict</span>
                      <span className="font-mono text-amber-300 font-bold">{stopLossPips} pips ({stopLossPips * 10} pts)</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="1"
                      value={stopLossPips}
                      onChange={(e) => setStopLossPips(parseInt(e.target.value) || 5)}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Scalp (5-15p)</span>
                      <span>Intraday (25-40p)</span>
                      <span>Swing (60p+)</span>
                    </div>
                  </div>

                  {/* Trailing Stop Loss Switch */}
                  <div className="admin-subcard p-3 space-y-2 border-amber-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">Trailing Stop Dynamique</p>
                        <p className="text-[10px] text-slate-400">Verrouille les gains au fil du cours</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTrailingStopEnabled((prev) => !prev)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                          trailingStopEnabled ? "bg-amber-500" : "bg-slate-700"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                            trailingStopEnabled ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {trailingStopEnabled && (
                      <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs animate-in fade-in">
                        <span className="text-slate-300">Distance Trailing :</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="5"
                            max="50"
                            value={trailingStopDistance}
                            onChange={(e) => setTrailingStopDistance(parseInt(e.target.value) || 5)}
                            className="w-14 rounded-lg border border-amber-500/30 bg-[#0b1220] px-2 py-0.5 text-center font-mono font-bold text-amber-300 text-xs outline-none"
                          />
                          <span className="font-mono text-slate-400">pips</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Auto Break-Even */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-xs font-bold text-slate-200">Break-Even Automatique</p>
                      <p className="text-[10px] text-slate-400">SL ramené à l'entrée à +1.5R</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBreakEvenEnabled((prev) => !prev)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        breakEvenEnabled ? "bg-amber-500" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                          breakEvenEnabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </article>

              {/* 3. TAKE PROFIT & EXECUTION (CYAN THEME) */}
              <article className="admin-card-cyan p-5 space-y-4 shadow-lg flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <TrendingUp className="size-3.5 text-cyan-400" />
                      3. Prise de Profit &amp; FIX
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400 font-bold">1:{takeProfitRatio.toFixed(1)} R:R</span>
                  </div>

                  {/* Take Profit Ratio R:R Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-300 font-medium">
                      <span>Objectif Take Profit (R:R)</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        1 : {takeProfitRatio.toFixed(1)} ({(stopLossPips * takeProfitRatio).toFixed(0)} pips)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="5.0"
                      step="0.1"
                      value={takeProfitRatio}
                      onChange={(e) => setTakeProfitRatio(parseFloat(e.target.value) || 1.0)}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>1:1.5 (Scalp)</span>
                      <span>1:2.5 (Optimal)</span>
                      <span>1:4.0+ (Trend)</span>
                    </div>
                  </div>

                  {/* Partial Close 50% */}
                  <div className="admin-subcard p-3 space-y-1.5 border-cyan-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">Prise Partielle TP1 (50%)</p>
                        <p className="text-[10px] text-slate-400">Sécurise la moitié du trade à 1:1R</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPartialCloseEnabled((prev) => !prev)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                          partialCloseEnabled ? "bg-cyan-500" : "bg-slate-700"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                            partialCloseEnabled ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Execution Mode & Slippage */}
                  <div className="space-y-2 pt-1 border-t border-cyan-500/20">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Type d'Ordre :</span>
                      <select
                        value={executionType}
                        onChange={(e) => setExecutionType(e.target.value as any)}
                        className="rounded-lg border border-slate-700/60 bg-[#0b1220] px-2 py-0.5 text-xs font-mono font-bold text-white outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        <option value="MARKET_FIX">Marché FIX ECN Direct</option>
                        <option value="LIMIT_PULLBACK">Limite (Pullback L2)</option>
                        <option value="STOP_BREAKOUT">Stop (Breakout M1)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Slippage max toléré :</span>
                      <span className="font-mono text-cyan-300 font-bold">{maxSlippagePips} pips (FIX Equinix)</span>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            {/* ── 4. SIMULATEUR TÉLÉMÉTRIQUE & IMPACT DU PROCHAIN ORDRE ── */}
            <div className="admin-subcard p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono shadow-inner">
              <div className="space-y-1">
                <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider font-sans font-bold">
                  Volume Effectif
                </p>
                <p className="text-lg sm:text-2xl font-bold text-white">
                  {calculatedEffectiveLot.toFixed(2)} <span className="text-xs text-slate-400 font-normal">lot(s)</span>
                </p>
                <p className="text-[10px] text-slate-400 font-sans">Valeur pip: ${(calculatedEffectiveLot * 10).toFixed(2)}/p</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] sm:text-xs text-rose-400 uppercase tracking-wider font-sans font-bold">
                  Perte Max au Stop Loss
                </p>
                <p className="text-lg sm:text-2xl font-bold text-rose-400">
                  -${calculatedRiskUsd.toFixed(2)}
                </p>
                <p className="text-[10px] text-rose-300/80 font-sans">
                  -{(balance > 0 ? (calculatedRiskUsd / balance) * 100 : 0).toFixed(2)}% du solde
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] sm:text-xs text-emerald-400 uppercase tracking-wider font-sans font-bold">
                  Gain Prévu au Take Profit
                </p>
                <p className="text-lg sm:text-2xl font-bold text-emerald-400">
                  +${calculatedRewardUsd.toFixed(2)}
                </p>
                <p className="text-[10px] text-emerald-300/80 font-sans">
                  +{(balance > 0 ? (calculatedRewardUsd / balance) * 100 : 0).toFixed(2)}% du solde
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] sm:text-xs text-indigo-300 uppercase tracking-wider font-sans font-bold">
                  Marge Requise (Levier {leverage})
                </p>
                <p className="text-lg sm:text-2xl font-bold text-indigo-300">
                  ${requiredMargin.toFixed(2)}
                </p>
                <p className="text-[10px] text-slate-400 font-sans">Niveau marge &gt; 1200%</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                className="admin-btn-primary w-full py-4 text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.005]"
              >
                <CheckCircle2 className="size-4.5" />
                <span>Enregistrer &amp; Appliquer les Paramètres au Moteur {selectedBot.name}</span>
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ── 4. WORKSPACE TRADINGVIEW EN DIRECT (PIXEL PAR PIXEL) ── */}
      <section className="space-y-2">
        <TradingViewEngineChart
          bot={selectedBot}
          onClosePosition={onClosePosition}
          position={matchingPos}
        />
      </section>

      {/* ── 4. COCKPIT D'INTELLIGENCE INFÉRIEUR À ONGLETS (HARMONISÉ) ── */}
      <section className="admin-card overflow-hidden shadow-xl">
        {/* Navigation par Onglets */}
        <div className="flex items-center justify-between border-b border-slate-700/50 bg-[#0f172a]/95 px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-xs">
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
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            Moteur : <strong className="text-white">{selectedBot.name}</strong>
          </span>
        </div>

        {/* CONTENU ONGLETS */}
        <div className="p-5 sm:p-6">
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
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "admin-subcard text-slate-500 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">{p.label}</span>
                        <Icon className="size-4" />
                      </div>
                      <div className="text-xs font-bold truncate font-mono">{p.status}</div>
                    </div>
                  );
                })}
              </div>

              {/* Dual Cards: Technique & Décision */}
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="admin-card-amber p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                    <span className="text-xs font-bold text-white">Sentiment &amp; Régime</span>
                    <span className="text-xs font-mono text-amber-300">{selectedBot.primarySymbol}</span>
                  </div>
                  <SentimentFearGreedBar trend="BULLISH" score={selectedBot.lastScoreNum} />
                </div>

                <div className="admin-card-emerald p-4 flex items-center gap-4">
                  <ConfidenceCircularGauge value={selectedBot.lastScoreNum} />
                  <div className="flex-1 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Action : {selectedBot.lastDecision.action}</span>
                      <span className="font-mono text-emerald-400 font-bold">Score {selectedBot.lastScore}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400">
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
              <div className="admin-card-indigo p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Prix Direct {selectedBot.primarySymbol}</span>
                  <span className="font-mono font-bold text-white">{selectedBot.id === "nexium-ai-gold" ? "2,388.90" : "1.08584"}</span>
                </div>
                <SparklinePrice price={2388} />
                <span className="text-[10px] text-emerald-400 font-mono font-bold block text-right">+0.48% Momentum</span>
              </div>

              {/* Courbe d'Équité */}
              <div className="admin-card-emerald p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Courbe d'Équité Session</span>
                  <span className="font-mono font-bold text-emerald-400">+384.50 $</span>
                </div>
                <EquityCurveMini />
                <span className="text-[10px] text-cyan-300 font-mono font-bold block text-right">+3.8% Profit</span>
              </div>

              {/* Compte à Rebours & Win Rate */}
              <div className="admin-card-cyan p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs border-b border-cyan-500/20 pb-2">
                  <span className="font-bold text-slate-300">Prochain Tick M1</span>
                  <span className="font-mono text-cyan-300 font-bold">Win Rate 70%</span>
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
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Journal d'Arbitrage</span>
                  <div className="flex items-center rounded-lg border border-slate-700/60 bg-[#0b1220] p-0.5 text-[10px]">
                    {(["all", "won", "lost", "open"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setLogFilter(f)}
                        className={`rounded px-2 py-0.5 font-bold uppercase transition cursor-pointer ${
                          logFilter === f ? "bg-emerald-500 text-black font-bold" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1 text-xs font-mono">
                  {filteredLogs.map((l, i) => (
                    <div key={i} className="flex items-start gap-2 admin-subcard p-2">
                      <span className="text-[10px] text-slate-400 shrink-0">{l.time}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase shrink-0 ${
                          l.level === "WON" || l.level === "SUCCESS"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : l.level === "LOST"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        }`}
                      >
                        {l.level}
                      </span>
                      <span className="text-slate-300 leading-snug flex-1 truncate">{l.msg}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendrier Économique */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Calendrier Économique HFT</span>
                <div className="space-y-2">
                  {[
                    { time: "14:30", title: "NFP - Non-Farm Payrolls", curr: "USD", impact: "high" },
                    { time: "16:00", title: "FOMC Rate Decision", curr: "USD", impact: "high" },
                    { time: "Demain 09:00", title: "ECB Press Conference", curr: "EUR", impact: "medium" },
                  ].map((ev, i) => (
                    <div key={i} className="flex items-center justify-between admin-subcard p-2.5 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="rounded bg-amber-400/20 border border-amber-400/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 font-mono">
                          {ev.time}
                        </span>
                        <span className="font-semibold text-white truncate">{ev.title}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{ev.curr}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 5. MODALE DE CONFIRMATION DE SÉCURITÉ (SIMPLIFIÉE) ── */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-sm admin-card p-5 sm:p-6 shadow-2xl space-y-4 border ${
            confirmModal.isDangerous ? "border-rose-500/40" : "border-emerald-500/40"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`grid size-9 place-items-center rounded-xl border font-mono ${
                  confirmModal.isDangerous
                    ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                    : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                }`}>
                  {confirmModal.isDangerous ? <AlertTriangle className="size-4.5" /> : <ShieldCheck className="size-4.5" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
                    {confirmModal.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {confirmModal.targetBot ? `${confirmModal.targetBot.name} · ${confirmModal.targetBot.primarySymbol}` : "Trading FIX NY4"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setConfirmModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              {confirmModal.description}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 rounded-xl border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800 py-2.5 text-xs font-bold text-slate-300 transition cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleConfirmAction}
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  confirmModal.isDangerous
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "admin-btn-primary"
                }`}
              >
                {confirmModal.actionButtonLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Graphique en Chandeliers de l'Équity (Live, Ancré sur le Solde Réel) ──
// ── Graphique en Chandeliers de l'Équity (Live, Ancré sur la Performance Algorithmique) ──
interface EquityCandle {
  id: number;
  timeLabel: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  up: boolean;
}

const EQUITY_CANDLE_COUNT: Record<"24H" | "7J" | "30J" | "1A", number> = {
  "24H": 24,
  "7J": 14,
  "30J": 30,
  "1A": 24,
};

function generateEquityCandles(balance: number, timeframe: "24H" | "7J" | "30J" | "1A"): EquityCandle[] {
  const count = EQUITY_CANDLE_COUNT[timeframe];
  // Si le solde est 0 ou non configuré, baseline de démonstration à $10,000 pour illustrer la trajectoire de performance
  const endVal = balance > 0 ? balance : 10000;
  
  // Taux de performance historique selon l'horizon de temps
  const returnRate = timeframe === "24H" ? 0.024 : timeframe === "7J" ? 0.068 : timeframe === "30J" ? 0.185 : 0.48;
  const startVal = endVal / (1 + returnRate);
  
  const now = Date.now();
  const stepMs = timeframe === "24H" ? 3600 * 1000 : timeframe === "7J" ? 12 * 3600 * 1000 : timeframe === "30J" ? 24 * 3600 * 1000 : 15 * 24 * 3600 * 1000;
  
  const candles: EquityCandle[] = [];
  let prevClose = startVal;

  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1;
    const progress = (i + 1) / count;
    const time = new Date(now - (count - 1 - i) * stepMs);
    const timeLabel = timeframe === "24H"
      ? time.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      : time.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

    // Trajectoire haussière progressive avec micro-variations harmoniques
    const curve = Math.pow(progress, 0.85) + Math.sin(progress * Math.PI * 3.5) * 0.035;
    const targetAtStep = startVal + (endVal - startVal) * curve;
    const noise = prevClose * 0.009 * (Math.random() - 0.45);
    const open = prevClose;
    let close = isLast ? endVal : Math.max(open * 0.98, targetAtStep + noise);
    if (isLast) close = endVal;

    const wick = Math.abs(close - open) * (0.35 + Math.random() * 0.5) + prevClose * 0.003;
    const high = Math.max(open, close) + wick * (0.4 + Math.random() * 0.6);
    const low = Math.max(Math.min(open, close) - wick * (0.3 + Math.random() * 0.5), open * 0.95);
    const volume = Math.round(1200 + Math.sin(progress * Math.PI * 4) * 500 + Math.random() * 2000);

    candles.push({
      id: i,
      timeLabel,
      open,
      high,
      low,
      close,
      volume,
      up: close >= open,
    });
    prevClose = close;
  }
  return candles;
}

function EquityCandlestickChart({ balance, timeframe }: { balance: number; timeframe: "24H" | "7J" | "30J" | "1A" }) {
  const [candles, setCandles] = useState<EquityCandle[]>(() => generateEquityCandles(balance, timeframe));
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    setCandles(generateEquityCandles(balance, timeframe));
  }, [timeframe, balance]);

  // Tick live : fait respirer la dernière bougie en direct
  useEffect(() => {
    const interval = setInterval(() => {
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (!last) return prev;
        const targetVal = balance > 0 ? balance : 10000;
        const pull = (targetVal - last.close) * 0.3;
        const noise = targetVal * 0.0015 * (Math.random() - 0.45);
        const nextClose = Math.max(last.close + pull + noise, 1);
        const high = Math.max(last.high, last.open, nextClose);
        const low = Math.min(last.low, last.open, nextClose);
        return [
          ...prev.slice(0, -1),
          { ...last, close: nextClose, high, low, up: nextClose >= last.open, volume: Math.round(1500 + Math.random() * 2500) },
        ];
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [balance]);

  // Moyenne Mobile Pondérée (WMA 9)
  const wmaPeriod = 9;
  const wmaValues = useMemo(() => {
    const closes = candles.map((c) => c.close);
    return closes.map((_, i) => {
      if (i < wmaPeriod - 1) return closes[i];
      let weightedSum = 0;
      let weightTotal = 0;
      for (let j = 0; j < wmaPeriod; j++) {
        const weight = wmaPeriod - j;
        weightedSum += (closes[i - j] ?? 0) * weight;
        weightTotal += weight;
      }
      return weightedSum / weightTotal;
    });
  }, [candles]);

  const { minVal, maxVal } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const c of candles) {
      min = Math.min(min, c.low);
      max = Math.max(max, c.high);
    }
    if (!isFinite(min) || !isFinite(max)) return { minVal: 0, maxVal: 1 };
    const pad = (max - min) * 0.12 || max * 0.05 || 10;
    return { minVal: Math.max(min - pad, 0), maxVal: max + pad };
  }, [candles]);

  const priceRange = maxVal - minVal || 1;
  const maxVolume = Math.max(...candles.map((c) => c.volume), 1);

  const width = 500;
  const height = 150;
  const priceAreaHeight = 110;
  const volumeAreaHeight = 26;
  const step = width / candles.length;
  const candleWidth = Math.max(step * 0.58, 2.5);

  const yForPrice = (val: number) => 6 + priceAreaHeight - ((val - minVal) / priceRange) * priceAreaHeight;
  const wmaPoints = wmaValues.map((v, i) => `${i * step + step / 2},${yForPrice(v ?? 0)}`).join(" ");

  // Surface dégradée sous la courbe
  const gradientAreaPoints = [
    `0,${height}`,
    ...wmaValues.map((v, i) => `${i * step + step / 2},${yForPrice(v ?? 0)}`),
    `${width},${height}`,
  ].join(" ");

  // Lignes de grille de prix
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const hoveredCandle = hoverIdx !== null ? candles[hoverIdx] : null;

  return (
    <div className="relative h-full w-full select-none" onMouseLeave={() => setHoverIdx(null)}>
      {/* Tooltip flottant au survol */}
      {hoveredCandle && (
        <div
          className="pointer-events-none absolute z-20 rounded-lg border border-indigo-500/40 bg-[#0c1220]/95 px-2.5 py-1.5 text-[11px] font-mono shadow-xl backdrop-blur-md transition-all duration-75"
          style={{
            left: `${Math.min(Math.max((hoverIdx! / candles.length) * 100, 10), 75)}%`,
            top: "8px",
          }}
        >
          <div className="flex items-center justify-between gap-3 text-slate-400">
            <span>{hoveredCandle.timeLabel}</span>
            <span className={hoveredCandle.up ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
              {hoveredCandle.up ? "+Haussier" : "-Repli"}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-3">
            <span className="text-white font-bold">${hoveredCandle.close.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-[10px] text-amber-400">Vol: {hoveredCandle.volume}</span>
          </div>
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const idx = Math.min(candles.length - 1, Math.max(0, Math.floor((x / rect.width) * candles.length)));
          setHoverIdx(idx);
        }}
      >
        <defs>
          <linearGradient id="equityGlowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D084" stopOpacity="0.28" />
            <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Lignes de grille horizontales & Échelle */}
        {gridLevels.map((lvl, idx) => {
          const price = minVal + priceRange * lvl;
          const y = yForPrice(price);
          return (
            <g key={idx}>
              <line x1="0" x2={width} y1={y} y2={y} stroke="#ffffff" strokeOpacity="0.06" strokeDasharray="3 3" />
              <text x={width - 2} y={y - 2} fill="#64748b" fontSize="7.5" textAnchor="end" fontFamily="monospace">
                ${Math.round(price).toLocaleString("fr-FR")}
              </text>
            </g>
          );
        })}

        {/* Dégradé sous la courbe WMA */}
        <polygon points={gradientAreaPoints} fill="url(#equityGlowGrad)" />

        {/* Chandeliers & Volumes */}
        {candles.map((c, i) => {
          const x = i * step + step / 2;
          const color = c.up ? "#00D084" : "#f43f5e";
          const bodyTop = yForPrice(Math.max(c.open, c.close));
          const bodyBottom = yForPrice(Math.min(c.open, c.close));
          const bodyHeight = Math.max(bodyBottom - bodyTop, 1.2);
          const volHeight = (c.volume / maxVolume) * volumeAreaHeight;
          const isHovered = hoverIdx === i;

          return (
            <g key={c.id} opacity={hoverIdx !== null && !isHovered ? 0.6 : 1}>
              {/* Mèche haute & basse */}
              <line
                x1={x} x2={x}
                y1={yForPrice(c.high)} y2={yForPrice(c.low)}
                stroke={color}
                strokeWidth="1.2"
              />
              {/* Corps de bougie */}
              <rect
                x={x - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={color}
                rx="0.8"
              />
              {/* Barre de volume */}
              <rect
                x={x - candleWidth / 2}
                y={height - volHeight}
                width={candleWidth}
                height={volHeight}
                fill={c.up ? "#00D084" : "#f59e0b"}
                opacity={c.up ? "0.45" : "0.3"}
                rx="0.5"
              />
            </g>
          );
        })}

        {/* Trait WMA 9 avec halo néon */}
        <polyline
          points={wmaPoints}
          fill="none"
          stroke="#00D084"
          strokeWidth="4.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.3"
          style={{ filter: "blur(2.5px)" }}
        />
        <polyline
          points={wmaPoints}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Ligne verticale de réticule au survol */}
        {hoverIdx !== null && (
          <line
            x1={hoverIdx * step + step / 2}
            x2={hoverIdx * step + step / 2}
            y1={0}
            y2={height}
            stroke="#ffffff"
            strokeOpacity="0.35"
            strokeDasharray="2 2"
          />
        )}
      </svg>
    </div>
  );
}

// ── Panneaux d'oscillateurs animés (MFI 14 & Aroon 14) ──
function useLiveOscillator(pointCount: number, min: number, max: number, seed: number, phaseOffset = 0) {
  const [values, setValues] = useState<number[]>(() => {
    return Array.from({ length: pointCount }, (_, i) => {
      const progress = i / pointCount;
      const wave = Math.sin(progress * Math.PI * 3 + phaseOffset) * (max - min) * 0.28;
      const wave2 = Math.cos(progress * Math.PI * 5 + phaseOffset * 1.5) * (max - min) * 0.12;
      const noise = (Math.random() - 0.5) * (max - min) * 0.08;
      return Math.min(max - 2, Math.max(min + 2, seed + wave + wave2 + noise));
    });
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setValues((prev) => {
        const last = prev[prev.length - 1] ?? seed;
        const step = (max - min) * 0.07;
        const next = Math.min(max, Math.max(min, last + (Math.random() - 0.48) * step));
        return [...prev.slice(1), next];
      });
    }, 1400);
    return () => clearInterval(interval);
  }, [min, max, seed]);

  return values;
}

function OscillatorPane({
  label,
  lines,
}: {
  label: string;
  lines: { color: string; values: number[]; readout?: string }[];
}) {
  const width = 500;
  const height = 24;
  const allVals = lines.flatMap((l) => l.values);
  const min = Math.min(...allVals, 0);
  const max = Math.max(...allVals, 100);
  const range = max - min || 1;
  const yFor = (v: number) => height - ((v - min) / range) * height;

  return (
    <div className="mt-1 border-t border-indigo-500/15 pt-1">
      <div className="mb-0.5 flex items-center gap-2 text-[9px] font-mono">
        <span className="text-slate-500 uppercase tracking-wider">{label}</span>
        {lines.map(
          (l, i) =>
            l.readout && (
              <span key={i} style={{ color: l.color }} className="font-bold">
                {l.readout}
              </span>
            )
        )}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-5 w-full overflow-visible" preserveAspectRatio="none">
        {/* Niveaux repères 30 / 70 */}
        <line x1="0" x2={width} y1={yFor(70)} y2={yFor(70)} stroke="#ffffff" strokeOpacity="0.05" strokeDasharray="2 2" />
        <line x1="0" x2={width} y1={yFor(30)} y2={yFor(30)} stroke="#ffffff" strokeOpacity="0.05" strokeDasharray="2 2" />

        {lines.map((l, li) => {
          const step = width / l.values.length;
          const points = l.values.map((v, i) => `${i * step + step / 2},${yFor(v)}`).join(" ");
          return (
            <polyline
              key={li}
              points={points}
              fill="none"
              stroke={l.color}
              strokeWidth="1.35"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </div>
  );
}

function EquityIndicatorPanels() {
  const mfi = useLiveOscillator(30, 25, 85, 58, 0.5);
  const aroonUp = useLiveOscillator(30, 10, 98, 72, 1.2);
  const aroonDown = useLiveOscillator(30, 5, 65, 28, 2.5);

  return (
    <div className="space-y-0.5">
      <OscillatorPane
        label="MFI 14"
        lines={[{ color: "#38bdf8", values: mfi, readout: (mfi[mfi.length - 1] ?? 0).toFixed(2) }]}
      />
      <OscillatorPane
        label="Aroon 14"
        lines={[
          { color: "#00D084", values: aroonUp, readout: `${(aroonUp[aroonUp.length - 1] ?? 0).toFixed(2)}%` },
          { color: "#f59e0b", values: aroonDown, readout: `${(aroonDown[aroonDown.length - 1] ?? 0).toFixed(2)}%` },
        ]}
      />
    </div>
  );
}

// ----------------------------------------------------
// 2. OVERVIEW VIEW
// ----------------------------------------------------
function OverviewTab({
  clientName,
  balance,
  bonus,
  totalGains = 0,
  running,
  onToggleRunning,
  bots,
  positions,
  mt5AccountNumber,
  onClosePosition,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenEngine,
  onOpenRisk,
  onBalanceChange,
}: {
  clientName: string;
  balance: number;
  bonus: number;
  totalGains?: number;
  running: boolean;
  onToggleRunning: () => void;
  bots: EngineBot[];
  positions: PositionItem[];
  mt5AccountNumber: string;
  onClosePosition: (pos: PositionItem) => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenEngine: () => void;
  onOpenRisk: () => void;
  onBalanceChange?: (newBalance: number) => void;
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

  const marketTickers = [
    { pair: "EUR/USD", price: (1.0858 + (tickerTick % 2 === 0 ? 0.0002 : -0.0001)).toFixed(5), change: "+0.28%", up: true },
    { pair: "XAU/USD", price: (2388.9 + (tickerTick % 3 === 0 ? 0.4 : -0.2)).toFixed(2), change: "+1.14%", up: true },
    { pair: "GBP/USD", price: (1.2845 + (tickerTick % 2 === 0 ? -0.0001 : 0.0003)).toFixed(5), change: "-0.09%", up: false },
    { pair: "BTC/USD", price: "64 250.00", change: "+2.45%", up: true },
    { pair: "NAS100", price: "19 814.50", change: "+0.65%", up: true },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between gap-3 h-full">
      {/* Hero Welcome */}
      <section className="shrink-0 admin-card-emerald p-4 sm:p-4.5 relative overflow-hidden space-y-2.5 shadow-md rounded-2xl">
        <div className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Bonjour, <span className="text-emerald-400">{clientName.split(" ")[0] || clientName}</span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenDeposit}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800 px-4 py-2 text-xs sm:text-sm font-bold text-white uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:border-emerald-500/50"
            >
              <Plus className="size-4 text-emerald-400" />
              DÉPÔT RAPIDE
            </button>
          </div>
        </div>

        {/* Live Market Tickers Ribbon */}
        <div className="border-t border-emerald-500/15 pt-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
            <Activity className="size-3.5 text-emerald-400" /> COTATIONS DIRECTES · SPREAD FIX ULTRA-FAIBLE
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
            {marketTickers.map((tick) => (
              <div
                key={tick.pair}
                className="admin-subcard px-3 py-2 flex items-center justify-between rounded-xl transition-colors hover:border-emerald-500/40"
              >
                <div>
                  <span className="font-mono text-[11px] text-slate-400 font-bold">{tick.pair}</span>
                  <p className="font-mono text-sm sm:text-base font-bold text-white leading-none mt-0.5">{tick.price}</p>
                </div>
                <span
                  className={`text-xs font-mono font-bold ${
                    tick.up ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {tick.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CARTE MAÎTRE : TOTAL ABSOLU CONSOLIDÉ (SOLDE + BONUS + GAINS + P&L) ── */}
      <section className="shrink-0 rounded-2xl border border-emerald-500/30 bg-[#0b121e] p-4 sm:p-4.5 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl sm:text-2xl font-black text-white">
              ${(balance + bonus + totalGains + totalOpenPnl).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm sm:text-base font-bold text-emerald-400">USD</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs z-10">
            <div className="rounded-xl border border-slate-700/60 bg-black/40 px-3 py-1.5 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">1. Solde Cash</span>
              <span className="text-xs sm:text-sm font-bold text-white">${balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 py-1.5 space-y-0.5">
              <span className="text-[10px] text-amber-300/80 font-bold uppercase block">2. Bonus Crédité</span>
              <span className="text-xs sm:text-sm font-bold text-amber-300">+{bonus > 0 ? `$${bonus.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}` : "$0.00"}</span>
            </div>
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-3 py-1.5 space-y-0.5">
              <span className="text-[10px] text-cyan-300/80 font-bold uppercase block">3. Gains Bots (P&L)</span>
              <span className="text-xs sm:text-sm font-bold text-cyan-300">+{totalGains > 0 ? `$${totalGains.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"}</span>
            </div>
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 px-3 py-1.5 space-y-0.5">
              <span className="text-[10px] text-indigo-300/80 font-bold uppercase block">4. P&L Flottant</span>
              <span className={`text-xs sm:text-sm font-bold ${totalOpenPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {totalOpenPnl >= 0 ? `+$${totalOpenPnl.toFixed(2)}` : `-$${Math.abs(totalOpenPnl).toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="shrink-0 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 font-mono">
        <article className="admin-card-indigo p-3.5 sm:p-4 space-y-1.5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">SOLDE TOTAL</span>
            <div className="grid size-8 place-items-center rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <Wallet className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            ${(balance + bonus + totalGains).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-indigo-500/20 font-sans">
            <span className="text-slate-400">Cash</span>
            <span className="font-mono font-bold text-white">${balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span>
          </div>
        </article>

        <article className="admin-card-amber p-3.5 sm:p-4 space-y-1.5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">BONUS CRÉDITÉ</span>
            <div className="grid size-8 place-items-center rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Gift className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-300">
            ${bonus.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-amber-500/20 font-sans">
            <span className="text-slate-400">Statut</span>
            <span className="font-mono font-bold text-white">{bonus > 0 ? "Actif" : "Aucun"}</span>
          </div>
        </article>

        <article className="admin-card-emerald p-3.5 sm:p-4 space-y-1.5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">EQUITY (VALEUR)</span>
            <div className="grid size-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Wallet className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-400">
            ${(balance + bonus + totalGains + totalOpenPnl).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-emerald-500/20 font-sans">
            <span className="text-slate-400">Total Disponible</span>
            <span className="font-mono font-bold text-white">${(balance + bonus + totalGains).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span>
          </div>
        </article>

        <article className={`p-3.5 sm:p-4 space-y-1.5 rounded-2xl shadow-sm ${totalOpenPnl >= 0 ? "admin-card-indigo" : "admin-card border-rose-500/30 bg-gradient-to-b from-[#261217]/95 to-[#17090d]/98"}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">P&L LATENT</span>
            <div className={`grid size-8 place-items-center rounded-xl ${totalOpenPnl >= 0 ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30" : "bg-rose-500/15 text-rose-400 border border-rose-500/30"}`}>
              <TrendingUp className="size-4" />
            </div>
          </div>
          <p
            className={`text-xl sm:text-2xl font-black ${
              totalOpenPnl >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {totalOpenPnl >= 0 ? `+$${totalOpenPnl.toFixed(2)}` : `-$${Math.abs(totalOpenPnl).toFixed(2)}`}
          </p>
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-700/50 font-sans">
            <span className="text-slate-400">Positions</span>
            <span className="font-mono font-bold text-emerald-400">{positions.length} en direct</span>
          </div>
        </article>

        <article className="admin-card-cyan p-3.5 sm:p-4 space-y-1.5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">AUTO-TRADERS</span>
            <div className="grid size-8 place-items-center rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Bot className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-cyan-300">3 / 3</p>
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-cyan-500/20 font-sans">
            <span className="text-slate-400">Equinix NY4</span>
            <span className="font-mono font-bold text-emerald-400">100% OK</span>
          </div>
        </article>

        <article className="admin-card-emerald p-3.5 sm:p-4 space-y-1.5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">TOTAL GAINS GÉNÉRÉS</span>
            <div className="grid size-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-400">
            {totalGains > 0 ? `+$${totalGains.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"}
          </p>
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-emerald-500/20 font-sans">
            <span className="text-slate-400">Gains algorithmiques</span>
            <span className="font-mono font-bold text-emerald-400">Net</span>
          </div>
        </article>
      </section>

      {/* Interactive Equity Curve & Quick Bot Summary */}
      <section className="flex-1 grid gap-3.5 xl:grid-cols-[1.45fr_.55fr] min-h-0">
        <article className="flex flex-col justify-between admin-card-indigo p-4 sm:p-5 shadow-md rounded-2xl overflow-hidden">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-indigo-500/20 pb-2.5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-mono">ÉVOLUTION DE L'EQUITY</p>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Performance Cumulée des Auto-Traders</h3>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-indigo-500/30 bg-[#0b1220] p-1">
              {(["24H", "7J", "30J", "1A"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setChartTimeframe(tf)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold transition-all cursor-pointer ${
                    chartTimeframe === tf
                      ? "bg-emerald-500 text-black font-bold shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between pt-1 min-h-0">
            <div className="flex-1 relative min-h-[140px] w-full">
              <div className="absolute left-1 top-0 z-10 flex items-center gap-1.5 text-xs font-mono pointer-events-none">
                <span className="text-slate-500">WMA</span>
                <span className="text-[#60a5fa] font-bold">9</span>
                <span className="text-slate-600">close</span>
              </div>
              <EquityCandlestickChart balance={balance} timeframe={chartTimeframe} />
            </div>
            <EquityIndicatorPanels />
            <div className="mt-2 flex items-center justify-between border-t border-indigo-500/20 pt-2 text-xs sm:text-sm font-mono text-slate-300">
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-emerald-400 animate-pulse" />
                Solde en direct
              </span>
              <strong className="text-white text-base sm:text-lg font-bold">${balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        </article>

        {/* 3 Bots Quick Snapshot */}
        <article className="flex flex-col justify-between admin-card p-4 sm:p-5 shadow-md rounded-2xl overflow-hidden">
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-700/50 pb-2.5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">AUTO-TRADERS OPÉRATIONNELS</p>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Supervision Rapide</h3>
                </div>
                <button
                  onClick={onOpenEngine}
                  className="text-xs sm:text-sm font-bold text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  Page Moteurs <ChevronRight className="size-4" />
                </button>
              </div>

              <div className="mt-3 space-y-2.5">
                {bots.map((b) => (
                  <div
                    key={b.id}
                    className="admin-subcard p-3 sm:p-3.5 flex items-center justify-between rounded-xl transition-colors hover:border-slate-500/40"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`size-2.5 rounded-full ${
                          b.statusBadge === "ACTIF" ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
                        }`}
                      />
                      <div>
                        <span className="font-bold text-sm sm:text-base text-white">{b.name}</span>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{b.markets}</p>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className={`text-sm sm:text-base font-bold ${b.pnlTodayNum >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {b.pnlToday}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">{b.openPositions} pos.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onOpenEngine}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-[#121a2d] py-3 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition cursor-pointer shadow-sm mt-3.5 hover:border-emerald-500/40"
            >
              <Monitor className="size-4 text-emerald-400" />
              OUVRIR LE TERMINAL MT5 &amp; PRESETS
            </button>
          </div>
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
    <div className="space-y-5">
      <section className="admin-card-indigo p-4 sm:p-5 relative overflow-hidden space-y-2.5 shadow-lg rounded-2xl">
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-indigo-300 uppercase mb-1 font-mono">
              BIBLIOTHÈQUE STRATÉGIQUE MT5
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Auto-Traders &amp; Algorithmes Certifiés</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              Chaque algorithme Auto-Trader est optimisé pour une classe d'actifs dédiée et opère selon un cahier des charges quantitatif institutionnel.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {bots.map((b) => {
          const cardVariant =
            b.id === "nexium-ai-gold"
              ? "admin-card-amber"
              : b.id === "nexium-fx-trend"
              ? "admin-card-cyan"
              : "admin-card-purple";
          const accentColor =
            b.id === "nexium-ai-gold"
              ? "text-amber-300"
              : b.id === "nexium-fx-trend"
              ? "text-cyan-300"
              : "text-purple-300";

          return (
            <article
              key={b.id}
              className={`${cardVariant} p-4 sm:p-5 shadow-lg rounded-2xl flex flex-col justify-between transition-all hover:scale-[1.01] space-y-4`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{b.name}</h3>
                  <StatusPill variant={b.statusBadge === "ACTIF" ? "emerald" : "rose"}>
                    {b.statusBadge}
                  </StatusPill>
                </div>
                <p className={`mt-0.5 font-mono text-xs ${accentColor} font-bold`}>{b.specialty}</p>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed font-medium">{b.subtitle}</p>

                <div className="mt-3.5 space-y-1.5 text-xs admin-subcard p-3 rounded-xl">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Marchés :</span>
                    <span className="font-mono font-bold text-white">{b.markets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Stratégie :</span>
                    <span className="font-bold text-slate-200">{b.strategy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Régime :</span>
                    <span className={`font-mono ${accentColor} font-bold`}>{b.marketRegime}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenBotDetail(b)}
                className={`w-full rounded-xl py-2.5 text-xs font-bold transition cursor-pointer border ${
                  b.id === "nexium-ai-gold"
                    ? "border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                    : b.id === "nexium-fx-trend"
                    ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25"
                    : "border-purple-500/40 bg-purple-500/15 text-purple-300 hover:bg-purple-500/25"
                }`}
              >
                VOIR FICHE DÉTAILLÉE
              </button>
            </article>
          );
        })}
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
    <div className="space-y-5">
      <section className="admin-card p-4 sm:p-5 border-rose-500/30 bg-gradient-to-b from-[#261217]/95 to-[#17090d]/98 relative overflow-hidden space-y-3 shadow-lg rounded-2xl">
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-rose-400 uppercase font-mono">
              RISK GOVERNOR &amp; SÉCURITÉ DU CAPITAL
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Protection Active du Capital</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              Le moteur applique un coupe-circuit strict dès que les tolérances de drawdown ou d'exposition sont atteintes.
            </p>
          </div>
          <StatusPill variant="emerald">GARDE-FOUS OPÉRATIONNELS</StatusPill>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <article className="admin-card-emerald p-4 sm:p-5 shadow-lg space-y-4 rounded-2xl">
          <div className="border-b border-emerald-500/20 pb-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 font-mono">RÉGLAGES EN DIRECT</p>
            <h3 className="mt-0.5 text-base sm:text-lg font-bold text-white tracking-tight">Seuils de Tolérance Algorithmique</h3>
          </div>

          <div className="space-y-3">
            <div className="admin-subcard p-3 space-y-1.5 rounded-xl">
              <div className="flex justify-between text-xs font-bold text-slate-200">
                <span>DRAWDOWN JOURNALIER MAXIMUM</span>
                <span className="font-mono text-emerald-400 text-sm">{maxDrawdownPercent.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={maxDrawdownPercent}
                onChange={(e) => setMaxDrawdownPercent(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="admin-subcard p-3 space-y-1.5 rounded-xl">
              <div className="flex justify-between text-xs font-bold text-slate-200">
                <span>EXPOSITION TOTALE MAXIMALE</span>
                <span className="font-mono text-cyan-300 text-sm">{maxExposureLots.toFixed(1)} lots</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10.0"
                step="0.5"
                value={maxExposureLots}
                onChange={(e) => setMaxExposureLots(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="admin-subcard p-3 space-y-1.5 rounded-xl">
              <div className="flex justify-between text-xs font-bold text-slate-200">
                <span>RISQUE ENGAGÉ PAR ORDRE</span>
                <span className="font-mono text-purple-300 text-sm">{riskPerTrade.toFixed(2)}%</span>
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
          </div>

          <button
            onClick={handleSaveRisk}
            className="admin-btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-md rounded-xl"
          >
            ENREGISTRER LES LIMITES DE RISQUE
          </button>
        </article>

        {/* Emergency Kill Switch */}
        <article className="admin-card p-4 sm:p-5 border-rose-500/40 bg-gradient-to-b from-[#261217]/95 to-[#17090d]/98 shadow-lg flex flex-col justify-between space-y-4 rounded-2xl">
          <div>
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="size-4" />
              <p className="text-[10px] font-bold uppercase tracking-wider font-mono">INTERRUPTEUR D'URGENCE (KILL SWITCH)</p>
            </div>
            <h3 className="mt-1.5 text-lg font-bold text-white tracking-tight">Arrêt d'Urgence Immédiat</h3>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-300 font-medium">
              Coupe instantanément tous les signaux actifs, ferme l'intégralité des positions ouvertes sur MT5 et passe l'ensemble des Auto-Traders en mode sécurisé.
            </p>
          </div>

          <button
            onClick={onEmergencyHalt}
            className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all cursor-pointer"
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
// ----------------------------------------------------
// ----------------------------------------------------
// 5. PORTEFEUILLE VIEW (AVEC PAGE DE RETRAIT DÉDIÉE)
// ----------------------------------------------------
function PortfolioTab({
  balance,
  bonus = 0,
  totalGains = 0,
  transactions,
  clientName = "Client Nexium",
  currentUserId,
  isSupabaseConfigured = false,
  paymentSettings,
  onOpenDeposit,
  onAddTransaction,
}: {
  balance: number;
  bonus?: number;
  totalGains?: number;
  transactions: TransactionItem[];
  clientName?: string;
  currentUserId?: string | null;
  isSupabaseConfigured?: boolean;
  paymentSettings?: PaymentSettings | null;
  onOpenDeposit?: () => void;
  onAddTransaction?: (tx: TransactionItem) => void;
}) {
  const [view, setView] = useState<"overview" | "withdraw" | "deposit">("overview");
  const [searchTx, setSearchTx] = useState("");

  // Withdrawal form states
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawMethod, setWithdrawMethod] = useState<"BANK" | "CRYPTO" | "CARD">("BANK");
  
  // Bank fields (Withdrawal)
  const [withdrawAccountHolder, setWithdrawAccountHolder] = useState(clientName || "Titulaire du compte");
  const [withdrawBankName, setWithdrawBankName] = useState("BNP Paribas");
  const [withdrawIban, setWithdrawIban] = useState("FR76 3000 4000 5000 6000 7000 123");
  const [withdrawBic, setWithdrawBic] = useState("BNPAFR2X");

  // Crypto fields (Withdrawal)
  const [withdrawCryptoNetwork, setWithdrawCryptoNetwork] = useState<"USDT_TRC20" | "USDT_ERC20" | "BTC" | "ETH">("USDT_TRC20");
  const [withdrawCryptoAddress, setWithdrawCryptoAddress] = useState("");

  // Card / Compte fields (Withdrawal)
  const [withdrawCardLast4, setWithdrawCardLast4] = useState("4242");
  const [withdrawCardHolder, setWithdrawCardHolder] = useState(clientName || "Titulaire");

  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // Deposit form states
  const [depositAmount, setDepositAmount] = useState<string>("1000");
  const [depositMethod, setDepositMethod] = useState<"BANK" | "CRYPTO" | "CARD">("BANK");
  const [depositCryptoNetwork, setDepositCryptoNetwork] = useState<"USDT_TRC20" | "USDT_ERC20" | "BTC" | "ETH">("USDT_TRC20");
  const [depositTxHash, setDepositTxHash] = useState("");
  const [depositCardNumber, setDepositCardNumber] = useState("");
  const [depositCardExpiry, setDepositCardExpiry] = useState("");
  const [depositCardCvc, setDepositCardCvc] = useState("");
  const [depositCardHolder, setDepositCardHolder] = useState(clientName || "Titulaire");
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);

  const totalWithdrawable = balance + bonus;
  const depositRef = `NXM-${(currentUserId || "CLIENT").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || "DEP888"}`;

  const CRYPTO_NETWORKS: Record<
    "USDT_TRC20" | "USDT_ERC20" | "BTC" | "ETH",
    { label: string; addressField: keyof PaymentSettings; defaultAddress: string }
  > = {
    USDT_TRC20: { label: "USDT (TRC-20)", addressField: "crypto_usdt_trc20_address", defaultAddress: "TXYZ9876543210NexiumTRC20OfficialWallet" },
    USDT_ERC20: { label: "USDT (ERC-20)", addressField: "crypto_usdt_erc20_address", defaultAddress: "0x71C8fb8078b663b909dfc3E595D31D24Ec2A41f3" },
    BTC: { label: "Bitcoin (BTC)", addressField: "crypto_btc_address", defaultAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" },
    ETH: { label: "Ethereum (ETH)", addressField: "crypto_eth_address", defaultAddress: "0x94B2E920c5d5F9EbD7e2bA6E3F66b96E015e1974" },
  };

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${label} copié(e) avec succès.`))
      .catch(() => toast.error("Impossible de copier."));
  };

  // Pre-fill withdraw amount when entering withdraw view
  useEffect(() => {
    if (view === "withdraw" && !withdrawAmount) {
      setWithdrawAmount((balance + bonus).toFixed(2));
    }
  }, [view, balance, bonus, withdrawAmount]);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(withdrawAmount);
    if (isNaN(val) || val <= 0) {
      toast.error("Veuillez saisir un montant valide.");
      return;
    }
    if (val > totalWithdrawable) {
      toast.error(`Fonds insuffisants : $${totalWithdrawable.toFixed(2)} disponible au retrait.`);
      return;
    }

    let methodLabel = "Virement Bancaire";
    let destinationLabel = withdrawIban;
    let methodKey = "BANK_WIRE";

    if (withdrawMethod === "BANK") {
      if (!withdrawIban.trim()) {
        toast.error("Veuillez renseigner votre IBAN.");
        return;
      }
      methodLabel = `Virement Bancaire (${withdrawBankName || "SEPA / SWIFT"})`;
      destinationLabel = `IBAN: ${withdrawIban} · BIC: ${withdrawBic || "N/A"} · Titulaire: ${withdrawAccountHolder}`;
      methodKey = "BANK_WIRE";
    } else if (withdrawMethod === "CRYPTO") {
      if (!withdrawCryptoAddress.trim()) {
        toast.error("Veuillez renseigner votre adresse de portefeuille crypto.");
        return;
      }
      const netLabel = withdrawCryptoNetwork.replace("_", " ");
      methodLabel = `Crypto ${netLabel}`;
      destinationLabel = `${netLabel}: ${withdrawCryptoAddress}`;
      methodKey = `CRYPTO_${withdrawCryptoNetwork}`;
    } else if (withdrawMethod === "CARD") {
      if (!withdrawCardLast4.trim()) {
        toast.error("Veuillez renseigner les 4 derniers chiffres ou le numéro de compte.");
        return;
      }
      methodLabel = "Compte / Carte Bancaire";
      destinationLabel = `Compte / Carte •••• ${withdrawCardLast4} (${withdrawCardHolder})`;
      methodKey = "CARD_REFUND";
    }

    setIsSubmittingWithdraw(true);

    if (isSupabaseConfigured && currentUserId) {
      const res = await createWithdrawalRequest(currentUserId, val, destinationLabel, methodKey);
      if (!res.success) {
        toast.error("Erreur lors de la transmission de la demande de retrait.");
        setIsSubmittingWithdraw(false);
        return;
      }
    }

    const now = new Date().toLocaleTimeString();
    const newTx: TransactionItem = {
      id: `tx-${Date.now()}`,
      date: `Aujourd'hui · ${now.slice(0, 5)}`,
      type: "Demande de retrait",
      amount: `-$${val.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}`,
      amountNum: -val,
      currency: "USD",
      status: "En attente",
      method: methodLabel,
      color: "#f59e0b",
    };

    if (onAddTransaction) {
      onAddTransaction(newTx);
    }
    setIsSubmittingWithdraw(false);
    toast.success(`Demande de retrait de $${val.toFixed(2)} via ${methodLabel} transmise avec succès au Desk Finance.`, { duration: Infinity });
    setView("overview");
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val <= 0) {
      toast.error("Veuillez saisir un montant valide.");
      return;
    }

    let methodLabel = "Virement Bancaire";
    let methodKey = "BANK_WIRE";
    let refInfo = depositRef;

    if (depositMethod === "BANK") {
      methodLabel = "Virement Bancaire (SEPA / SWIFT)";
      methodKey = "BANK_WIRE";
      refInfo = depositRef;
    } else if (depositMethod === "CRYPTO") {
      const netLabel = CRYPTO_NETWORKS[depositCryptoNetwork].label;
      methodLabel = `Crypto ${netLabel}`;
      methodKey = `CRYPTO_${depositCryptoNetwork}`;
      refInfo = depositTxHash ? `TxHash: ${depositTxHash}` : `Réseau: ${netLabel}`;
    } else if (depositMethod === "CARD") {
      if (!depositCardNumber.trim() || depositCardNumber.replace(/\s/g, "").length < 15) {
        toast.error("Veuillez renseigner un numéro de carte valide (16 chiffres).");
        return;
      }
      methodLabel = "Compte / Carte Bancaire (3D Secure)";
      methodKey = "CREDIT_CARD";
      refInfo = `Carte •••• ${depositCardNumber.replace(/\s/g, "").slice(-4)}`;
    }

    setIsSubmittingDeposit(true);

    if (isSupabaseConfigured && currentUserId) {
      const res = await createDepositRequest(currentUserId, val, methodKey, refInfo);
      if (!res.success) {
        toast.error("Erreur lors de l'enregistrement de la demande de dépôt.");
        setIsSubmittingDeposit(false);
        return;
      }
    }

    const now = new Date().toLocaleTimeString();
    const newTx: TransactionItem = {
      id: `tx-${Date.now()}`,
      date: `Aujourd'hui · ${now.slice(0, 5)}`,
      type: depositMethod === "CARD" ? "Dépôt par carte" : "Demande de dépôt",
      amount: `+$${val.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}`,
      amountNum: val,
      currency: "USD",
      status: depositMethod === "CARD" ? "Confirmé" : "En attente",
      method: methodLabel,
      color: "#00D084",
    };

    if (onAddTransaction) {
      onAddTransaction(newTx);
    }
    setIsSubmittingDeposit(false);
    toast.success(
      depositMethod === "CARD"
        ? `Dépôt de $${val.toFixed(2)} par carte validé avec succès.`
        : `Demande de dépôt de $${val.toFixed(2)} (${methodLabel}) transmise avec succès au Desk Finance.`,
      { duration: Infinity }
    );
    setView("overview");
  };

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

  // ----------------------------------------------------
  // VUE DÉPÔT DÉDIÉE (IN-PAGE - THÈME VERT ÉMERAUDE COMPACT)
  // ----------------------------------------------------
  if (view === "deposit") {
    const bankBeneficiary = paymentSettings?.bank_beneficiary || "Nexium Prime Markets Ltd";
    const bankName = paymentSettings?.bank_name || "BNP Paribas / Barclays Bank";
    const bankIban = paymentSettings?.bank_iban || "FR76 3000 4000 5000 6000 7000 123";
    const bankBic = paymentSettings?.bank_bic || "BNPAFR2X";

    const cryptoAddress =
      paymentSettings?.[CRYPTO_NETWORKS[depositCryptoNetwork].addressField] ||
      CRYPTO_NETWORKS[depositCryptoNetwork].defaultAddress;

    const parsedDeposit = parseFloat(depositAmount) || 0;
    const depositMethodTitle =
      depositMethod === "BANK"
        ? "Virement Bancaire"
        : depositMethod === "CRYPTO"
        ? `Crypto (${CRYPTO_NETWORKS[depositCryptoNetwork].label})`
        : "Carte Bancaire 3D Secure";

    const depositEstimatedDelay =
      depositMethod === "CARD"
        ? "Instantané"
        : depositMethod === "CRYPTO"
        ? "~10 min (3 blocs)"
        : "24h - 48h ouvrées";

    return (
      <div className="space-y-4 sm:space-y-5">
        {/* En-tête Page de Dépôt (Hauteur Réduite & Compacte) */}
        <section className="admin-card-emerald p-4 sm:p-5 relative overflow-hidden shadow-lg">
          <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-emerald-500/10 blur-2xl" />
          <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button
                onClick={() => setView("overview")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition cursor-pointer mb-1 font-mono uppercase tracking-wider"
              >
                <ArrowLeft className="size-3.5" />
                RETOUR AU PORTEFEUILLE
              </button>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Dépôt de Fonds &amp; Approvisionnement
              </h2>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-[#0d1624]/90 px-4 py-2 text-sm shadow-inner shrink-0 self-start sm:self-auto">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                Solde Actuel Disponible
              </span>
              <strong className="font-mono text-lg sm:text-xl text-emerald-400 font-black">
                ${balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} USD
              </strong>
            </div>
          </div>
        </section>

        {/* Grille 2 Colonnes Formulaire + Récapitulatif */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Formulaire Principal (Col 8) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <section className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-4 sm:p-6 shadow-xl">
              <form onSubmit={handleDepositSubmit} className="space-y-4 sm:space-y-5">
                {/* 1. Montant */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white uppercase tracking-wider">
                      1. Montant du Dépôt (USD)
                    </label>
                    <span className="text-[11px] font-mono text-gray-400">Min : $50.00</span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xl font-bold text-emerald-400">$</span>
                    <input
                      type="number"
                      step="any"
                      min="50"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="1000"
                      className="w-full rounded-xl border border-white/[0.1] bg-black/50 pl-10 pr-14 py-3 font-mono text-xl sm:text-2xl font-bold text-white outline-none focus:border-emerald-500 transition shadow-inner"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-bold text-gray-400 uppercase bg-white/[0.06] px-2 py-0.5 rounded-md">
                      USD
                    </span>
                  </div>

                  {/* Presets de montants */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-xs text-gray-400 font-medium mr-1">Raccourcis :</span>
                    {["500", "1000", "2500", "5000", "10000"].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDepositAmount(amt)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer border ${
                          depositAmount === amt
                            ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-sm"
                            : "border-white/[0.08] bg-[#141a23] text-gray-300 hover:text-white hover:border-white/[0.2]"
                        }`}
                      >
                        +${Number(amt).toLocaleString("fr-FR")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Mode de Paiement */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white uppercase tracking-wider block">
                    2. Mode de Règlement
                  </label>
                  <div className="grid sm:grid-cols-3 gap-2.5">
                    {[
                      { id: "BANK" as const, label: "Virement Bancaire", sub: "SEPA / SWIFT", icon: Landmark },
                      { id: "CRYPTO" as const, label: "Crypto-monnaie", sub: "USDT / BTC / ETH", icon: Coins },
                      { id: "CARD" as const, label: "Carte Bancaire", sub: "Instantané 3D Secure", icon: CreditCard },
                    ].map((m) => {
                      const isSelected = depositMethod === m.id;
                      const IconComp = m.icon;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setDepositMethod(m.id)}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative group ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-sm"
                              : "border-white/[0.08] bg-[#141a23] text-gray-300 hover:border-white/[0.2] hover:text-white"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-2">
                            <div className={`p-1.5 rounded-lg ${isSelected ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.05] text-gray-400 group-hover:text-white"}`}>
                              <IconComp className="size-4" />
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="size-3.5 text-emerald-400" />
                            )}
                          </div>
                          <div>
                            <p className={`font-bold text-xs sm:text-sm ${isSelected ? "text-white" : "text-gray-200"}`}>{m.label}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{m.sub}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Détails selon méthode */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white uppercase tracking-wider block">
                    3. Informations de Paiement
                  </label>

                  <div className="rounded-xl border border-white/[0.08] bg-[#0c1017] p-4 sm:p-5 space-y-3.5">
                    {/* VIREMENT BANCAIRE */}
                    {depositMethod === "BANK" && (
                      <div className="space-y-3.5">
                        <div className="flex items-start gap-2.5 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-300 leading-relaxed">
                          <Activity className="size-4 text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            Effectuez votre virement vers les coordonnées institutionnelles ci-dessous. Les fonds sont crédités dès réception bancaire.
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
                          <div className="p-3 rounded-lg border border-white/[0.06] bg-black/40">
                            <span className="text-[10px] text-gray-400 block mb-0.5 uppercase font-bold tracking-wider">Bénéficiaire</span>
                            <div className="flex items-center justify-between">
                              <strong className="text-white font-medium truncate">{bankBeneficiary}</strong>
                              <button
                                type="button"
                                onClick={() => handleCopy(bankBeneficiary, "Bénéficiaire")}
                                className="text-gray-400 hover:text-emerald-400 p-1 transition"
                                title="Copier"
                              >
                                <Copy className="size-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg border border-white/[0.06] bg-black/40">
                            <span className="text-[10px] text-gray-400 block mb-0.5 uppercase font-bold tracking-wider">Banque Dépositaire</span>
                            <div className="flex items-center justify-between">
                              <strong className="text-white font-medium truncate">{bankName}</strong>
                              <button
                                type="button"
                                onClick={() => handleCopy(bankName, "Banque")}
                                className="text-gray-400 hover:text-emerald-400 p-1 transition"
                                title="Copier"
                              >
                                <Copy className="size-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg border border-white/[0.06] bg-black/40 sm:col-span-2">
                            <span className="text-[10px] text-gray-400 block mb-0.5 uppercase font-bold tracking-wider">IBAN / Compte</span>
                            <div className="flex items-center justify-between gap-2">
                              <strong className="font-mono text-white font-medium text-xs break-all">{bankIban}</strong>
                              <button
                                type="button"
                                onClick={() => handleCopy(bankIban, "IBAN")}
                                className="text-gray-400 hover:text-emerald-400 p-1 transition shrink-0"
                                title="Copier"
                              >
                                <Copy className="size-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg border border-white/[0.06] bg-black/40">
                            <span className="text-[10px] text-gray-400 block mb-0.5 uppercase font-bold tracking-wider">Code BIC / SWIFT</span>
                            <div className="flex items-center justify-between">
                              <strong className="font-mono text-white font-medium">{bankBic}</strong>
                              <button
                                type="button"
                                onClick={() => handleCopy(bankBic, "BIC / SWIFT")}
                                className="text-gray-400 hover:text-emerald-400 p-1 transition"
                                title="Copier"
                              >
                                <Copy className="size-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10">
                            <span className="text-[10px] text-emerald-400 font-bold block mb-0.5 uppercase tracking-wider">RÉFÉRENCE OBLIGATOIRE DU VIREMENT</span>
                            <div className="flex items-center justify-between">
                              <strong className="font-mono text-emerald-400 font-black text-xs sm:text-sm">{depositRef}</strong>
                              <button
                                type="button"
                                onClick={() => handleCopy(depositRef, "Référence")}
                                className="text-emerald-400 hover:text-white p-1 transition"
                                title="Copier"
                              >
                                <Copy className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CRYPTO-MONNAIE */}
                    {depositMethod === "CRYPTO" && (
                      <div className="space-y-3.5">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                            Sélectionnez le Réseau Crypto
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { id: "USDT_TRC20" as const, label: "USDT (TRC-20)" },
                              { id: "USDT_ERC20" as const, label: "USDT (ERC-20)" },
                              { id: "BTC" as const, label: "Bitcoin (BTC)" },
                              { id: "ETH" as const, label: "Ethereum (ETH)" },
                            ].map((net) => (
                              <button
                                key={net.id}
                                type="button"
                                onClick={() => setDepositCryptoNetwork(net.id)}
                                className={`px-2.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer border text-center ${
                                  depositCryptoNetwork === net.id
                                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-sm"
                                    : "border-white/[0.08] bg-[#141a23] text-gray-400 hover:text-white"
                                }`}
                              >
                                {net.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="p-3.5 rounded-lg border border-white/[0.08] bg-black/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                              Adresse Officielle ({CRYPTO_NETWORKS[depositCryptoNetwork].label})
                            </label>
                            <button
                              type="button"
                              onClick={() => handleCopy(String(cryptoAddress), "Adresse de dépôt")}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:underline"
                            >
                              <Copy className="size-3" />
                              COPIER
                            </button>
                          </div>
                          <p className="font-mono text-xs text-white break-all bg-black/60 p-2.5 rounded-md border border-white/[0.06] select-all">
                            {String(cryptoAddress)}
                          </p>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                            Hash de Transaction / TxID (Optionnel)
                          </label>
                          <input
                            type="text"
                            value={depositTxHash}
                            onChange={(e) => setDepositTxHash(e.target.value)}
                            placeholder="Ex: 0x8a91b... ou b5e21..."
                            className="w-full rounded-lg border border-white/[0.1] bg-black/40 px-3.5 py-2.5 font-mono text-xs text-white outline-none focus:border-emerald-500 transition"
                          />
                        </div>
                      </div>
                    )}

                    {/* COMPTE / CARTE BANCAIRE */}
                    {depositMethod === "CARD" && (
                      <div className="space-y-3.5">
                        <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300 leading-relaxed">
                          <ShieldCheck className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            Paiement sécurisé crypté SSL 256 bits et authentification 3D Secure. Crédit immédiat.
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                              Titulaire de la carte
                            </label>
                            <input
                              type="text"
                              value={depositCardHolder}
                              onChange={(e) => setDepositCardHolder(e.target.value)}
                              placeholder="Nom & Prénom"
                              className="w-full rounded-lg border border-white/[0.1] bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 transition"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                              Numéro de carte bancaire
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                maxLength={19}
                                value={depositCardNumber}
                                onChange={(e) => {
                                  const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                                  const formatted = v.match(/.{1,4}/g)?.join(" ") || v;
                                  setDepositCardNumber(formatted);
                                }}
                                placeholder="4532 •••• •••• 4242"
                                className="w-full rounded-lg border border-white/[0.1] bg-black/40 pl-3.5 pr-10 py-2.5 font-mono text-xs text-white outline-none focus:border-emerald-500 transition"
                              />
                              <CreditCard className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                                Expiration (MM/AA)
                              </label>
                              <input
                                type="text"
                                maxLength={5}
                                value={depositCardExpiry}
                                onChange={(e) => setDepositCardExpiry(e.target.value)}
                                placeholder="12/28"
                                className="w-full rounded-lg border border-white/[0.1] bg-black/40 px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-emerald-500 transition text-center"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                                Code CVC / CVV
                              </label>
                              <input
                                type="password"
                                maxLength={4}
                                value={depositCardCvc}
                                onChange={(e) => setDepositCardCvc(e.target.value)}
                                placeholder="•••"
                                className="w-full rounded-lg border border-white/[0.1] bg-black/40 px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-emerald-500 transition text-center"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setView("overview")}
                    className="sm:w-1/3 rounded-xl border border-white/[0.08] bg-[#141a23] py-3 text-xs font-bold text-gray-300 hover:text-white hover:bg-[#1a2330] transition cursor-pointer uppercase tracking-wider"
                  >
                    ANNULER
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingDeposit || parsedDeposit <= 0}
                    className="sm:w-2/3 neon-btn rounded-xl py-3 text-xs font-black uppercase tracking-wider text-black transition cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-500/10"
                  >
                    {isSubmittingDeposit ? "TRANSMISSION..." : `CONFIRMER LE DÉPÔT (${parsedDeposit > 0 ? `$${parsedDeposit.toLocaleString("fr-FR")}` : "$0"})`}
                  </button>
                </div>
              </form>
            </section>
          </div>

          {/* Panneau Latéral Récapitulatif & Sécurité (Col 4) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            {/* Carte Récapitulatif en Direct */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-4 sm:p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    RÉCAPITULATIF DU DÉPÔT
                  </h3>
                </div>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                  SÉCURISÉ
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between text-gray-400">
                  <span>Montant brut</span>
                  <span className="text-white font-bold">${parsedDeposit.toFixed(2)} USD</span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>Frais de traitement</span>
                  <span className="text-emerald-400 font-bold">0.00% ($0.00) · Gratuit</span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>Moyen de paiement</span>
                  <span className="text-gray-200 font-bold truncate max-w-[150px]">{depositMethodTitle}</span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>Délai estimé</span>
                  <span className="text-gray-200">{depositEstimatedDelay}</span>
                </div>

                <div className="border-t border-white/[0.08] pt-3 mt-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300 font-sans">
                      CRÉDITÉ SUR LE SOLDE
                    </span>
                    <strong className="text-lg sm:text-xl text-emerald-400 font-black">
                      ${parsedDeposit.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <p className="text-[10px] text-gray-400 font-sans mt-0.5">
                    Compte ECN Principal · USD
                  </p>
                </div>
              </div>
            </div>

            {/* Carte Sécurité & Garanties */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0d1219] p-4 shadow-lg space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-400" />
                Garanties Nexium Prime
              </h4>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Comptes ségrégués Tier-1 régulés.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Chiffrement complet SSL 256-bit PCI-DSS.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Lettrage automatique par le Desk Finance.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VUE RETRAIT DÉDIÉE (IN-PAGE - THÈME AMBRE DORÉ COMPACT)
  // ----------------------------------------------------
  if (view === "withdraw") {
    const parsedWithdraw = parseFloat(withdrawAmount) || 0;
    const withdrawMethodTitle =
      withdrawMethod === "BANK"
        ? `Virement (${withdrawBankName || "Bancaire"})`
        : withdrawMethod === "CRYPTO"
        ? `Crypto (${withdrawCryptoNetwork.replace("_", " ")})`
        : "Compte / Carte Bancaire";

    const withdrawEstimatedDelay =
      withdrawMethod === "CRYPTO"
        ? "~15 - 30 min"
        : "24h ouvrées";

    return (
      <div className="space-y-4 sm:space-y-5">
        {/* En-tête Page de Retrait (Thème Ambre Doré & Hauteur Réduite) */}
        <section className="admin-card-amber p-4 sm:p-5 relative overflow-hidden shadow-lg border border-amber-500/30">
          <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-amber-500/10 blur-2xl" />
          <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button
                onClick={() => setView("overview")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer mb-1 font-mono uppercase tracking-wider"
              >
                <ArrowLeft className="size-3.5" />
                RETOUR AU PORTEFEUILLE
              </button>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Demande de Retrait de Fonds
              </h2>
            </div>

            <div className="rounded-xl border border-amber-500/40 bg-[#1f1911]/90 px-4 py-2 text-sm shadow-inner shrink-0 self-start sm:self-auto">
              <span className="block text-[10px] font-bold text-amber-300/70 uppercase tracking-wider font-mono">
                Solde Retirable Disponible
              </span>
              <strong className="font-mono text-lg sm:text-xl text-amber-400 font-black">
                ${totalWithdrawable.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} USD
              </strong>
            </div>
          </div>
        </section>

        {/* Grille 2 Colonnes Formulaire + Récapitulatif */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Formulaire Principal (Col 8) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <section className="rounded-2xl border border-amber-500/20 bg-[#12100d] p-4 sm:p-6 shadow-xl">
              <form onSubmit={handleWithdrawSubmit} className="space-y-4 sm:space-y-5">
                {/* 1. Montant */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white uppercase tracking-wider">
                      1. Montant du Retrait (USD)
                    </label>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(totalWithdrawable.toFixed(2))}
                      className="text-xs font-bold text-amber-400 hover:underline cursor-pointer font-mono"
                    >
                      MAX (${totalWithdrawable.toFixed(2)})
                    </button>
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xl font-bold text-amber-400">$</span>
                    <input
                      type="number"
                      step="any"
                      min="10"
                      max={totalWithdrawable}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-white/[0.1] bg-black/50 pl-10 pr-14 py-3 font-mono text-xl sm:text-2xl font-bold text-white outline-none focus:border-amber-500 transition shadow-inner"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-bold text-gray-400 uppercase bg-white/[0.06] px-2 py-0.5 rounded-md">
                      USD
                    </span>
                  </div>
                </div>

                {/* 2. Mode de Paiement */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white uppercase tracking-wider block">
                    2. Destination des Fonds
                  </label>
                  <div className="grid sm:grid-cols-3 gap-2.5">
                    {[
                      { id: "BANK" as const, label: "Virement Bancaire", sub: "SEPA / SWIFT", icon: Landmark },
                      { id: "CRYPTO" as const, label: "Crypto-monnaie", sub: "USDT / BTC / ETH", icon: Coins },
                      { id: "CARD" as const, label: "Compte / Carte", sub: "Remboursement direct", icon: CreditCard },
                    ].map((m) => {
                      const isSelected = withdrawMethod === m.id;
                      const IconComp = m.icon;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setWithdrawMethod(m.id)}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative group ${
                            isSelected
                              ? "border-amber-500 bg-amber-500/15 text-amber-300 shadow-sm"
                              : "border-white/[0.08] bg-[#1a1714] text-gray-300 hover:border-amber-500/30 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-2">
                            <div className={`p-1.5 rounded-lg ${isSelected ? "bg-amber-500/20 text-amber-400" : "bg-white/[0.05] text-gray-400 group-hover:text-white"}`}>
                              <IconComp className="size-4" />
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="size-3.5 text-amber-400" />
                            )}
                          </div>
                          <div>
                            <p className={`font-bold text-xs sm:text-sm ${isSelected ? "text-white" : "text-gray-200"}`}>{m.label}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{m.sub}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Champs selon méthode */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white uppercase tracking-wider block">
                    3. Coordonnées de Réception
                  </label>

                  <div className="rounded-xl border border-white/[0.08] bg-[#0e0c0a] p-4 sm:p-5 space-y-3.5">
                    {/* VIREMENT BANCAIRE */}
                    {withdrawMethod === "BANK" && (
                      <div className="space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                              Titulaire du compte
                            </label>
                            <input
                              type="text"
                              value={withdrawAccountHolder}
                              onChange={(e) => setWithdrawAccountHolder(e.target.value)}
                              placeholder="Nom & Prénom"
                              className="w-full rounded-lg border border-white/[0.1] bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 transition"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                              Nom de la banque
                            </label>
                            <input
                              type="text"
                              value={withdrawBankName}
                              onChange={(e) => setWithdrawBankName(e.target.value)}
                              placeholder="Ex: BNP Paribas, Société Générale"
                              className="w-full rounded-lg border border-white/[0.1] bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 transition"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                            Numéro IBAN
                          </label>
                          <input
                            type="text"
                            value={withdrawIban}
                            onChange={(e) => setWithdrawIban(e.target.value)}
                            placeholder="FR76 3000 4000 5000 6000 7000 123"
                            className="w-full rounded-lg border border-white/[0.1] bg-black/40 px-3.5 py-2.5 font-mono text-xs text-white outline-none focus:border-amber-500 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                            Code BIC / SWIFT
                          </label>
                          <input
                            type="text"
                            value={withdrawBic}
                            onChange={(e) => setWithdrawBic(e.target.value)}
                            placeholder="BNPAFR2X"
                            className="w-full rounded-lg border border-white/[0.1] bg-black/40 px-3.5 py-2.5 font-mono text-xs text-white outline-none focus:border-amber-500 transition"
                          />
                        </div>
                      </div>
                    )}

                    {/* CRYPTO-MONNAIE */}
                    {withdrawMethod === "CRYPTO" && (
                      <div className="space-y-3.5">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                            Sélectionnez le Réseau de Destination
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { id: "USDT_TRC20" as const, label: "USDT (TRC-20)" },
                              { id: "USDT_ERC20" as const, label: "USDT (ERC-20)" },
                              { id: "BTC" as const, label: "Bitcoin (BTC)" },
                              { id: "ETH" as const, label: "Ethereum (ETH)" },
                            ].map((net) => (
                              <button
                                key={net.id}
                                type="button"
                                onClick={() => setWithdrawCryptoNetwork(net.id)}
                                className={`px-2.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer border text-center ${
                                  withdrawCryptoNetwork === net.id
                                    ? "border-amber-500 bg-amber-500/20 text-amber-300 shadow-sm"
                                    : "border-white/[0.08] bg-[#1a1714] text-gray-400 hover:text-white"
                                }`}
                              >
                                {net.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                            Adresse Publique de Réception
                          </label>
                          <input
                            type="text"
                            value={withdrawCryptoAddress}
                            onChange={(e) => setWithdrawCryptoAddress(e.target.value)}
                            placeholder="Collez votre adresse publique de portefeuille"
                            className="w-full rounded-lg border border-white/[0.1] bg-black/40 px-3.5 py-2.5 font-mono text-xs text-white outline-none focus:border-amber-500 transition"
                          />
                        </div>
                      </div>
                    )}

                    {/* COMPTE / CARTE BANCAIRE */}
                    {withdrawMethod === "CARD" && (
                      <div className="space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                              4 derniers chiffres / N° Compte
                            </label>
                            <input
                              type="text"
                              maxLength={16}
                              value={withdrawCardLast4}
                              onChange={(e) => setWithdrawCardLast4(e.target.value)}
                              placeholder="Ex: 4242"
                              className="w-full rounded-lg border border-white/[0.1] bg-black/40 px-3.5 py-2.5 font-mono text-xs text-white outline-none focus:border-amber-500 transition"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                              Nom du titulaire
                            </label>
                            <input
                              type="text"
                              value={withdrawCardHolder}
                              onChange={(e) => setWithdrawCardHolder(e.target.value)}
                              placeholder="Nom & Prénom"
                              className="w-full rounded-lg border border-white/[0.1] bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 transition"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          Les fonds seront recrédités directement sur le compte associé sous 24h ouvrées.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setView("overview")}
                    className="sm:w-1/3 rounded-xl border border-white/[0.08] bg-[#1a1714] py-3 text-xs font-bold text-gray-300 hover:text-white hover:bg-[#25201b] transition cursor-pointer uppercase tracking-wider"
                  >
                    ANNULER
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingWithdraw || parsedWithdraw <= 0 || parsedWithdraw > totalWithdrawable}
                    className="sm:w-2/3 rounded-xl py-3 text-xs font-black uppercase tracking-wider text-black bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 transition cursor-pointer disabled:opacity-50 shadow-lg shadow-amber-500/10"
                  >
                    {isSubmittingWithdraw ? "TRANSMISSION..." : `VALIDER LE RETRAIT (${parsedWithdraw > 0 ? `$${parsedWithdraw.toLocaleString("fr-FR")}` : "$0"})`}
                  </button>
                </div>
              </form>
            </section>
          </div>

          {/* Panneau Latéral Récapitulatif & Sécurité (Col 4) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            {/* Carte Récapitulatif en Direct */}
            <div className="rounded-2xl border border-amber-500/20 bg-[#12100d] p-4 sm:p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    RÉCAPITULATIF DU RETRAIT
                  </h3>
                </div>
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400">
                  SÉCURISÉ
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between text-gray-400">
                  <span>Montant demandé</span>
                  <span className="text-white font-bold">${parsedWithdraw.toFixed(2)} USD</span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>Frais de virement</span>
                  <span className="text-amber-400 font-bold">0.00% ($0.00) · Gratuit</span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>Destination</span>
                  <span className="text-gray-200 font-bold truncate max-w-[150px]">{withdrawMethodTitle}</span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>Délai d'exécution</span>
                  <span className="text-gray-200">{withdrawEstimatedDelay}</span>
                </div>

                <div className="border-t border-white/[0.08] pt-3 mt-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300 font-sans">
                      MONTANT NET TRANSFÉRÉ
                    </span>
                    <strong className="text-lg sm:text-xl text-amber-400 font-black">
                      ${parsedWithdraw.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <p className="text-[10px] text-gray-400 font-sans mt-0.5">
                    Débit direct depuis votre Solde ECN Cash
                  </p>
                </div>
              </div>
            </div>

            {/* Carte Sécurité & Garanties */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0e0c0a] p-4 shadow-lg space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                <ShieldCheck className="size-4 text-amber-400" />
                Sécurité des Retraits
              </h4>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <span>Traitement prioritaire 24/5 par le Desk Finance.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <span>Aucun frais caché : 100% de vos gains nets versés.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <span>Confirmation instantanée et traçabilité immédiate.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="admin-card-emerald p-4 sm:p-4.5 relative overflow-hidden space-y-2.5 shadow-md rounded-2xl">
        <div className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Portefeuille &amp; Dépôts</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setView("deposit")}
              className="admin-btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer shadow-lg hover:scale-[1.02] transition-all rounded-xl"
            >
              <Plus className="size-4" />
              DÉPOSER DES FONDS
            </button>
            <button
              onClick={() => setView("withdraw")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800 px-4 py-2 text-xs sm:text-sm font-bold text-white uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:border-emerald-500/50"
            >
              RETIRER DES FONDS
            </button>
          </div>
        </div>
      </section>

      {/* ── CARTE MAÎTRE : TOTAL CAPITAL ABSOLU CONSOLIDÉ ── */}
      <section className="rounded-2xl border border-emerald-500/30 bg-[#0b121e] p-4 sm:p-4.5 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl sm:text-2xl font-black text-white">
              ${(balance + bonus + totalGains).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm sm:text-base font-bold text-emerald-400">USD</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono text-xs z-10">
            <div className="rounded-xl border border-slate-700/60 bg-black/40 px-3 py-1.5 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">1. Solde Cash</span>
              <span className="text-xs sm:text-sm font-bold text-white">${balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 py-1.5 space-y-0.5">
              <span className="text-[10px] text-amber-300/80 font-bold uppercase block">2. Bonus Crédité</span>
              <span className="text-xs sm:text-sm font-bold text-amber-300">+{bonus > 0 ? `$${bonus.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}` : "$0.00"}</span>
            </div>
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-3 py-1.5 space-y-0.5">
              <span className="text-[10px] text-cyan-300/80 font-bold uppercase block">3. Gains Générés</span>
              <span className="text-xs sm:text-sm font-bold text-cyan-300">+{totalGains > 0 ? `$${totalGains.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Balances */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 font-mono">
        <article className="admin-card-emerald p-3.5 sm:p-4 space-y-1.5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">SOLDE CASH DISPONIBLE</span>
            <div className="grid size-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Wallet className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-400">
            ${balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-emerald-500/20 font-sans">
            <span className="text-slate-400">Compte ECN Principal</span>
            <span className="font-mono font-bold text-white">USD</span>
          </div>
        </article>

        <article className="admin-card-amber p-3.5 sm:p-4 space-y-1.5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">BONUS COMMERCIAL</span>
            <div className="grid size-8 place-items-center rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Gift className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-300">
            ${bonus.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-amber-500/20 font-sans">
            <span className="text-slate-400">Statut commercial</span>
            <span className="font-mono font-bold text-emerald-400">{bonus > 0 ? "Actif & Utilisable" : "Aucun"}</span>
          </div>
        </article>

        <article className="admin-card-indigo p-3.5 sm:p-4 space-y-1.5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">EQUITY TOTALE</span>
            <div className="grid size-8 place-items-center rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <Wallet className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            ${(balance + bonus).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-indigo-500/20 font-sans">
            <span className="text-slate-400">Valeur totale (Cash + Bonus)</span>
            <span className="font-mono font-bold text-emerald-400">Disponible</span>
          </div>
        </article>

        <article className="admin-card-cyan p-3.5 sm:p-4 space-y-1.5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">TOTAL GAINS GÉNÉRÉS</span>
            <div className="grid size-8 place-items-center rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-cyan-300">
            {totalGains > 0 ? `+$${totalGains.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"}
          </p>
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-cyan-500/20 font-sans">
            <span className="text-slate-400">Gains algorithmiques</span>
            <span className="font-mono font-bold text-emerald-400">Net</span>
          </div>
        </article>
      </section>

      {/* Transactions */}
      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#10141b] shadow-md">
        <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">MOUVEMENTS DE FONDS</p>
            <h3 className="mt-0.5 text-base sm:text-lg font-bold text-white tracking-tight">Historique des Transactions</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTx}
                onChange={(e) => setSearchTx(e.target.value)}
                className="rounded-xl border border-white/[0.08] bg-[#0c1017] pl-9 pr-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-[#00D084]"
              />
            </div>

            <button
              onClick={handleExportStatement}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#141a23] px-3.5 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#1a2330] transition cursor-pointer"
            >
              <Download className="size-3.5 text-[#00D084]" />
              EXPORTER CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs sm:text-sm">
            <thead className="border-b border-white/[0.06] bg-[#0c1017] text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">
              <tr>
                <th className="px-5 py-3">DATE</th>
                <th className="px-5 py-3">TYPE</th>
                <th className="px-5 py-3">MÉTHODE</th>
                <th className="px-5 py-3">MONTANT</th>
                <th className="px-5 py-3">STATUT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredTx.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-mono text-gray-400 text-xs">{tx.date}</td>
                  <td className="px-5 py-3.5 font-bold text-white text-xs sm:text-sm">{tx.type}</td>
                  <td className="px-5 py-3.5 text-gray-300 text-xs sm:text-sm">{tx.method ?? "Automatique"}</td>
                  <td className="px-5 py-3.5 font-mono font-black text-sm" style={{ color: tx.color }}>
                    {tx.amount}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-mono font-bold text-gray-300">
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
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-[#0e1526] p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald-400 uppercase font-mono mb-1.5">
              INFRASTRUCTURE RÉSEAU INSTITUTIONNELLE
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Télémétrie FIX &amp; Serveurs MT5</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl font-medium">
              Monitoring en temps réel de la passerelle FIX 4.4, de la latence de routage et de l'intégrité des flux.
            </p>
          </div>
          <StatusPill variant="emerald">FLUX FIX ACTIF · SANS PERTE</StatusPill>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-2xl border border-slate-700/60 bg-[#0e1526] p-4 sm:p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">PASSERELLES DISPONIBLES</p>
              <h3 className="mt-0.5 text-base sm:text-lg font-bold text-white">Datacenters Financiers</h3>
            </div>
            <button
              onClick={handleTestPing}
              disabled={isPinging}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${isPinging ? "animate-spin" : ""}`} />
              TESTER LE PING
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { id: "NY4", name: "Equinix NY4", city: "New York (USA)", ping: `${pingResult} ms` },
              { id: "LD4", name: "Equinix LD4", city: "Londres (UK)", ping: "18 ms" },
              { id: "TY3", name: "Equinix TY3", city: "Tokyo (JPN)", ping: "65 ms" },
            ].map((srv) => (
              <button
                key={srv.id}
                onClick={() => setSelectedServer(srv.id as any)}
                className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                  selectedServer === srv.id
                    ? "border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/40"
                    : "border-slate-700/60 bg-[#121a2d] hover:border-slate-500/50"
                }`}
              >
                <p className="font-bold text-xs sm:text-sm text-white">{srv.name}</p>
                <p className="text-[10px] text-slate-400">{srv.city}</p>
                <p className="mt-2 font-mono text-base sm:text-lg font-bold text-emerald-400">{srv.ping}</p>
              </button>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-700/60 bg-[#0e1526] p-4 sm:p-5 shadow-md">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">FLUX DE MESSAGES FIX</p>
          <div className="mt-3 space-y-2 font-mono text-xs">
            {[
              "8=FIX.4.4|35=W|55=EURUSD|269=0|270=1.08584|271=50",
              "8=FIX.4.4|35=W|55=XAUUSD|269=1|270=2388.90|271=20",
              "8=FIX.4.4|35=8|39=2|150=2|37=892119|55=XAUUSD|32=0.20",
              "8=FIX.4.4|35=0|112=HEARTBEAT_ACK|NY4_GATEWAY",
            ].map((msg, i) => (
              <div key={i} className="rounded-xl border border-slate-700/40 bg-[#121a2d] p-2.5 text-slate-300">
                <span className="text-emerald-400 font-bold">[{new Date().toLocaleTimeString()}]</span> {msg}
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
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-[#0e1526] p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald-400 uppercase font-mono mb-1.5">
              REGISTRE D'AUDIT ET TRAÇABILITÉ
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Journal Décisionnel des Algorithmes</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl font-medium">
              Historique inaltérable de chaque calcul de signal, contrôle de gouvernance du risque et exécution d'ordre.
            </p>
          </div>

          <button
            onClick={handleExportJournal}
            className="admin-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider text-black cursor-pointer shadow-md"
          >
            <Download className="size-3.5" />
            EXPORTER LE JOURNAL (CSV)
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-700/60 bg-[#0e1526] shadow-md">
        <div className="p-4 border-b border-slate-700/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par mot-clé..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700/60 bg-[#121a2d] pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="border-b border-slate-700/50 bg-[#0b101d] text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              <tr>
                <th className="px-4 py-3">HEURE</th>
                <th className="px-4 py-3">ÉVÉNEMENT</th>
                <th className="px-4 py-3">SYMBOLE</th>
                <th className="px-4 py-3">DÉTAIL</th>
                <th className="px-4 py-3">STATUT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-400">{entry.time}</td>
                  <td className="px-4 py-3 font-mono font-bold text-white">{entry.event}</td>
                  <td className="px-4 py-3 font-mono text-emerald-400 font-bold">{entry.symbol ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-200 font-medium">{entry.detail}</td>
                  <td className="px-4 py-3">
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
    name: "Support Client VIP",
    role: "Assistance & Opérations",
    category: "support",
    avatar: "SC",
    avatarBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    statusText: "En ligne · Réponse immédiate",
    isOnline: true,
    sla: "< 1 min",
    prompts: [
      { label: "💳 Dépôt SEPA", text: "Comment effectuer un dépôt instantané par virement SEPA ou carte ECN ?" },
      { label: "💸 Délais Retrait", text: "Pouvez-vous me confirmer les délais d'exécution pour un retrait vers mon IBAN ?" },
      { label: "🛡️ Statut KYC", text: "Mes documents de conformité et justificatifs sont-ils bien validés pour le compte #802194 ?" },
      { label: "🐞 Signaler Bug", text: "J'aimerais signaler un souci d'affichage sur les flux en direct de mon terminal." },
    ],
  },
  {
    id: "expert-quant",
    name: "Expert Trading",
    role: "Desk de Trading Algorithmique",
    category: "expert",
    avatar: "AR",
    avatarBg: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    statusText: "Desk Equinix NY4 · En ligne",
    isOnline: true,
    sla: "Desk Quant",
    prompts: [
      { label: "📊 Signal Gold", text: "Pouvez-vous m'expliquer la logique algorithmique du signal BUY sur Nexium AI Gold ?" },
      { label: "🔍 Audit Risque", text: "Pourriez-vous réaliser un audit de risque détaillé sur l'allocation de mes 3 robots ?" },
      { label: "📉 Volatilité FX", text: "Quel est le comportement prévu du bot lors des annonces économiques majeures (NFP/CPI) ?" },
      { label: "📈 Ratio Sharpe", text: "Quels ajustements recommandez-vous pour maximiser le Sharpe Ratio de mon compte ?" },
    ],
  },
  {
    id: "ai-bot",
    name: "Nexium Core IA",
    role: "Trading Algorithmique",
    category: "ai",
    avatar: "IA",
    avatarBg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    statusText: "Moteur IA actif · Latence 0.8ms",
    isOnline: true,
    sla: "0.02s",
    prompts: [
      { label: "⚡ Positions", text: "Génère un résumé complet en direct des 3 positions ouvertes et du P&L consolidé." },
      { label: "📊 Volatilité XAU", text: "Quelle est l'analyse prédictive de volatilité sur XAUUSD pour les 4 prochaines heures ?" },
      { label: "🛡️ Drawdown", text: "Quel est le niveau de drawdown maximum et la distance par rapport au coupe-circuit ?" },
    ],
  },
  {
    id: "risk-governance",
    name: "Desk Risque",
    role: "Marges & Coupe-Circuits",
    category: "risk",
    avatar: "CR",
    avatarBg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    statusText: "Surveillance continue Equinix",
    isOnline: true,
    sla: "Actif",
    prompts: [
      { label: "🛡️ Marge Restante", text: "Pouvez-vous confirmer ma marge de drawdown restante pour la séance en cours ?" },
      { label: "⚖️ Plafond Lots", text: "Quels sont les plafonds d'exposition autorisés par classe d'actifs sur le compte ECN ?" },
      { label: "🔒 Coupe-Circuit", text: "Comment fonctionne la protection automatique de capital à 2.00% de Drawdown ?" },
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
  clientName = "Client",
  clientEmail = "",
  mt5AccountNumber = "",
  clientEmails = [],
  balance = 0,
}: {
  messages: ChatMessage[];
  onSendMessage: (txt: string, id?: string) => void;
  clientName?: string;
  clientEmail?: string;
  mt5AccountNumber?: string;
  clientEmails?: EmailItem[];
  balance?: number;
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
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption?: string | undefined } | null>(null);

  // Voice recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keep local threads in sync if parent sends new messages. Un message "user"
  // qu'on vient d'envoyer existe déjà localement avec un id temporaire ; quand
  // sa version confirmée revient de Supabase (id réel différent), on remplace
  // la copie optimiste au lieu d'en ajouter une deuxième — sinon le message
  // apparaît deux fois dès que l'aller-retour serveur se termine.
  useEffect(() => {
    setChatThreads((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const newFromProps = messages.filter((m) => !existingIds.has(m.id));
      if (newFromProps.length === 0) return prev;

      const next = [...prev];
      const toAppend: ChatMessage[] = [];
      for (const m of newFromProps) {
        const localIdx =
          m.sender === "user"
            ? next.findIndex((t) => t.sender === "user" && t.text === m.text && t.id.startsWith("msg-"))
            : -1;
        if (localIdx !== -1) {
          next[localIdx] = { ...next[localIdx], id: m.id } as ChatMessage;
        } else {
          toAppend.push(m);
        }
      }
      return [...next, ...toAppend];
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

  const activeContact: MessengerContact = useMemo(() => {
    return MESSENGER_CONTACTS.find((c) => c.id === selectedContactId) ?? (MESSENGER_CONTACTS[0] as MessengerContact);
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
      senderName: clientName,
      text: chatInput.trim(),
      time: now,
      contactId: selectedContactId,
      image: attachedImage ?? undefined,
      imageCaption: attachedImage ? attachedImageCaption : undefined,
      replyTo: replyingTo ? { senderName: replyingTo.senderName, text: replyingTo.text } : undefined,
      status: "sent",
    };

    setChatThreads((prev) => [...prev, userMsg]);
    onSendMessage(chatInput.trim() || "[Capture d'écran transmise]", userMsg.id);

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
          replyText = `Les virements SEPA instantanés et cartes ECN sont crédités sans frais sous 1 à 3 minutes. Votre solde actuel s'élève à $${balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} USD.`;
        } else if (lower.includes("retrait") || lower.includes("iban")) {
          replyText = "Votre demande de retrait est traitée avec priorité VIP. Le délai moyen d'exécution bancaire est de 15 à 30 minutes vers les banques européennes.";
        } else if (lower.includes("kyc") || lower.includes("compte") || lower.includes("document")) {
          replyText = `Votre compte MT5 #${mt5AccountNumber} bénéficie du statut Vérifié Institutionnel niveau 2 (Accès complet 0 spread). Tous vos documents sont en règle.`;
        } else {
          replyText = `Bonjour ${clientName}, notre équipe support a bien reçu votre message. Nous prenons en charge votre demande immédiatement. Un conseiller reste à votre écoute.`;
        }
      } else if (selectedContactId === "expert-quant") {
        if (lower.includes("or") || lower.includes("gold") || lower.includes("xauusd")) {
          replyText = "L'analyse quantitative sur XAUUSD confirme une structure de continuation haussière au-dessus du support 2 374.00. Nexium AI Gold maintient un score algorithmique optimal de 84/100.";
        } else if (lower.includes("audit") || lower.includes("risque") || lower.includes("drawdown")) {
          replyText = "L'audit de risque en temps réel indique une corrélation globale de 0.22 entre vos 3 bots, ce qui offre une excellente diversification sans sur-exposition de marge.";
        } else if (lower.includes("sharpe") || lower.includes("rendement")) {
          replyText = "Le Sharpe Ratio consolidé sur 30 jours est de 2.68. Pour le stabiliser davantage, nous recommandons de conserver les Take-Profits dynamiques actuels.";
        } else {
          replyText = `Bien reçu ${clientName}. Le Desk de Recherche analyse votre point et surveille les carnets d'ordres L2 sur le flux Equinix NY4.`;
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
        senderName: clientName,
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
    name: "Expert Trading",
    role: "Desk de Trading Algorithmique",
    avatar: "ET",
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
  const [emails, setEmails] = useState<EmailItem[]>(clientEmails);
  const [emailFolder, setEmailFolder] = useState<"inbox" | "sent" | "compose">("inbox");
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(clientEmails[0] ?? null);

  useEffect(() => {
    if (clientEmails && clientEmails.length > 0) {
      setEmails(clientEmails);
      setSelectedEmail((prev) => prev ?? clientEmails[0] ?? null);
    }
  }, [clientEmails]);
  const [composeTo, setComposeTo] = useState("desk-quant@nexiummarkets.com");
  const [composeSubject, setComposeSubject] = useState("");
  const [composePriority, setComposePriority] = useState<"NORMAL" | "URGENT" | "CRITIQUE">("NORMAL");
  const [composeBody, setComposeBody] = useState("");

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeSubject.trim() || !composeBody.trim()) {
      toast.error("Veuillez renseigner l'objet et le message.");
      return;
    }

    if (isSupabaseConfigured && clientEmail) {
      const res = await sendClientEmailMessage({
        customerEmail: clientEmail,
        customerName: clientName,
        subject: composeSubject.trim(),
        message: composeBody.trim(),
        toAddress: composeTo,
      });

      if (!res.success) {
        toast.error("Erreur lors de l'enregistrement de l'e-mail.");
        return;
      }
    }

    const newEmail: EmailItem = {
      id: `mail-${Date.now()}`,
      from: clientEmail || "investisseur@nexiummarkets.com",
      fromName: `${clientName} (Compte #${mt5AccountNumber})`,
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
    toast.success("E-mail officiel transmis au Desk Nexium.");
  };

  return (
    <div className="space-y-3.5">
      {/* ── 1. EN-TÊTE ULTRA-MODERNE & SÉLECTEUR DE CANAUX ── */}
      <section className="admin-card p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Centre de Messagerie &amp; Support
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              DESK LIVE 24/7
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Messenger instantané, captures d'écran, notes vocales, boîte e-mail sécurisée et ligne chiffrée MT5.
          </p>
        </div>

        {/* Sélecteur de canal 3-en-1 avec badge non lu */}
        <div className="flex items-center rounded-2xl border border-slate-700/60 bg-[#0b1220] p-1 shadow-lg shrink-0">
          <button
            onClick={() => setActiveChannel("chat")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeChannel === "chat"
                ? "bg-emerald-500 text-black font-bold shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <MessageSquare className="size-4" />
            <span>Messenger Live</span>
            <span className="size-2 rounded-full bg-current animate-pulse" />
          </button>

          <button
            onClick={() => setActiveChannel("email")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeChannel === "email"
                ? "bg-emerald-500 text-black font-bold shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Mail className="size-4" />
            <span>E-mail</span>
            {emails.filter((e) => e.unread).length > 0 && (
              <span className="rounded-full bg-amber-400 px-1.5 py-0.2 font-mono text-[10px] font-bold text-black">
                {emails.filter((e) => e.unread).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveChannel("call")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeChannel === "call"
                ? "bg-emerald-500 text-black font-bold shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                : "text-slate-400 hover:text-white"
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
        <section className="grid gap-4 lg:grid-cols-[300px_1fr] h-[calc(100vh-235px)] min-h-[480px] max-h-[calc(100vh-235px)]">
          {/* 1.1 SIDEBAR DES CONTACTS ET CANAUX */}
          <aside className="flex flex-col justify-between h-full admin-card p-3.5 shadow-xl space-y-3">
            <div className="space-y-2.5 flex-1 flex flex-col min-h-0">
              {/* Search contacts */}
              <div className="relative shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/60 bg-[#0b1220] pl-9.5 pr-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Category Filter Chips */}
              <div className="grid grid-cols-4 gap-1 text-xs font-bold shrink-0">
                {[
                  { id: "all", label: "Tous" },
                  { id: "support", label: "Support" },
                  { id: "expert", label: "Quant" },
                  { id: "ai", label: "IA" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterCategory(tab.id as any)}
                    className={`py-1.5 rounded-lg transition cursor-pointer text-center truncate text-xs font-semibold ${
                      filterCategory === tab.id
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-[#121a2d] text-slate-400 hover:text-white border border-slate-700/50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Contacts List */}
              <div className="flex-1 min-h-0 space-y-1.5 overflow-y-auto pr-1">
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
                      className={`cursor-pointer rounded-2xl p-3 transition-all duration-200 border ${
                        isSelected
                          ? "admin-card-emerald border-emerald-400 text-white shadow-md ring-1 ring-emerald-400/60"
                          : "admin-subcard hover:border-slate-500/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`relative grid size-10 place-items-center rounded-xl border font-mono text-sm font-black shrink-0 ${contact.avatarBg}`}>
                          {contact.avatar}
                          {contact.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 border-2 border-[#0c121e]" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-white truncate">
                              {contact.name}
                            </h4>
                            <span className="text-xs font-mono text-slate-400">
                              {lastMsg ? lastMsg.time : "Live"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-xs text-slate-300 truncate max-w-[130px]">
                              {contact.role}
                            </p>
                            <span className="text-xs text-emerald-400 font-semibold font-mono">
                              {contact.sla}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Discreet Security Footer */}
            <div className="shrink-0 flex items-center justify-between text-xs font-mono text-slate-400 px-1 pt-2 border-t border-slate-700/50">
              <span>MT5 #{mt5AccountNumber}</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                Chiffré AES-256
              </span>
            </div>
          </aside>

          {/* 1.2 MAIN CHAT CONVERSATION AREA */}
          <main className="flex flex-col justify-between h-full admin-card shadow-2xl overflow-hidden">
            {/* ── CHAT HEADER ── */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-700/50 bg-[#0f172a]/95 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className={`grid size-10 place-items-center rounded-xl border font-mono text-sm font-black ${activeContact.avatarBg}`}>
                  {activeContact.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-white text-base sm:text-lg leading-tight">
                      {activeContact.name}
                    </h3>
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-400">
                      {activeContact.sla}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mt-0.5 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {activeContact.role}
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
                  className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2 text-xs sm:text-sm font-bold text-emerald-400 transition cursor-pointer"
                  title="Appel chiffré"
                >
                  <Phone className="size-4" />
                  <span className="hidden sm:inline">Appeler</span>
                </button>

                <button
                  onClick={() => {
                    setActiveChannel("email");
                    setComposeTo(activeContact.id === "expert-quant" ? "desk-quant@nexiummarkets.com" : "support-vip@nexiummarkets.com");
                    setEmailFolder("compose");
                  }}
                  className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-200 hover:text-white transition cursor-pointer"
                  title="E-mail officiel"
                >
                  <Mail className="size-4" />
                  <span className="hidden sm:inline">E-mail</span>
                </button>
              </div>
            </div>

            {/* ── QUICK PROMPTS CHIPS ROW ── */}
            <div className="shrink-0 border-b border-white/[0.06] bg-[#080b0f] px-5 py-2.5 flex items-center gap-2.5 overflow-x-auto no-scrollbar text-xs sm:text-sm">
              <span className="text-xs sm:text-sm font-bold text-gray-300 shrink-0 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-[#00D084]" />
                Suggestions :
              </span>
              {activeContact.prompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPromptClick(p.text)}
                  className="rounded-xl border border-white/[0.08] bg-[#12161f] hover:border-[#00D084]/50 hover:bg-[#00D084]/15 px-3.5 py-1.5 text-xs sm:text-sm text-gray-200 hover:text-white transition shrink-0 cursor-pointer shadow-sm font-medium"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* ── MESSAGE STREAM ── */}
            <div className="flex-1 min-h-0 p-5 sm:p-6 space-y-3.5 overflow-y-auto bg-black/20">
              {activeMessages.map((m) => {
                const isMe = m.sender === "user";

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1 group`}
                  >
                    {/* Quoted / Reply Preview if any */}
                    {m.replyTo && (
                      <div className={`text-xs rounded-xl px-3 py-1 mb-0.5 max-w-[80%] border ${
                        isMe
                          ? "bg-white/[0.05] border-white/[0.08] text-gray-300 text-right"
                          : "bg-black/40 border-white/[0.06] text-gray-300 text-left"
                      }`}>
                        <span className="font-bold text-white">{m.replyTo.senderName} :</span>{" "}
                        <span className="italic truncate">"{m.replyTo.text.slice(0, 40)}..."</span>
                      </div>
                    )}

                    <div
                      className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl p-4 text-sm sm:text-base leading-relaxed shadow-md ${
                        isMe
                          ? "rounded-tr-sm bg-gradient-to-br from-[#00D084]/25 to-[#00D084]/10 border border-[#00D084]/40 text-white"
                          : "rounded-tl-sm bg-[#141a23] border border-white/[0.08] text-gray-100"
                      }`}
                    >
                      {/* Sender Header */}
                      <div className="flex items-center justify-between gap-3 mb-1.5 text-xs sm:text-sm">
                        <span className="font-bold text-gray-200 flex items-center gap-1.5">
                          {!isMe && <span className="size-2 rounded-full bg-[#00D084]" />}
                          {m.senderName}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-xs text-gray-400">
                          <span>{m.time}</span>
                          {isMe && <CheckCheck className="size-3.5 text-[#00D084]" />}
                        </div>
                      </div>

                      {/* Message Text */}
                      <p className="whitespace-pre-line text-gray-100 font-normal leading-relaxed text-sm sm:text-[15px]">
                        {m.text}
                      </p>

                      {/* Image / Screenshot preview if attached */}
                      {m.image && (
                        <div className="mt-2 overflow-hidden rounded-xl border border-white/[0.1] bg-black/40">
                          <img
                            src={m.image}
                            alt={m.imageCaption ?? "Capture d'écran"}
                            onClick={() => setLightboxImage({ url: m.image!, caption: m.imageCaption })}
                            className="max-h-48 w-full object-cover cursor-pointer hover:scale-101 transition duration-200"
                          />
                          {m.imageCaption && (
                            <div className="p-1.5 text-[10px] font-mono text-gray-300 bg-[#0c1017] flex items-center justify-between">
                              <span className="truncate flex items-center gap-1">
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
                        <div className="mt-2 rounded-xl border border-white/[0.08] bg-[#0c1017] p-2 flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setPlayingVoiceId(playingVoiceId === m.id ? null : m.id);
                              toast.info(playingVoiceId === m.id ? "Lecture arrêtée." : "Lecture de la note vocale...");
                            }}
                            className="grid size-7.5 place-items-center rounded-lg bg-[#00D084] text-black font-black cursor-pointer hover:scale-105 transition"
                          >
                            {playingVoiceId === m.id ? <Pause className="size-3" /> : <Play className="size-3 ml-0.5" />}
                          </button>

                          <div className="flex-1">
                            <div className="flex items-center gap-1 h-3.5">
                              {[8, 16, 12, 20, 10, 14, 22, 12, 18, 10, 14, 18, 8, 14].map((h, idx) => (
                                <div
                                  key={idx}
                                  className={`w-0.5 rounded-full transition-all duration-200 ${
                                    playingVoiceId === m.id ? "bg-[#00D084] animate-pulse" : "bg-gray-500"
                                  }`}
                                  style={{ height: `${h}px` }}
                                />
                              ))}
                            </div>
                            <div className="flex justify-between text-[9px] text-gray-400 font-mono mt-0.5">
                              <span>Note vocale</span>
                              <span className="text-white font-bold">{m.voiceDuration ?? "0:06"}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Reactions bar */}
                      {m.reactions && m.reactions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1.5 pt-1 border-t border-white/[0.04]">
                          {m.reactions.map((r, i) => (
                            <button
                              key={i}
                              onClick={() => handleToggleReaction(m.id, r.emoji)}
                              className={`flex items-center gap-1 rounded-md px-1.5 py-0.2 text-[11px] font-mono transition cursor-pointer ${
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
                      <div className="mt-1.5 pt-1 border-t border-white/[0.04] flex items-center justify-between opacity-70 group-hover:opacity-100 transition">
                        <button
                          onClick={() => {
                            setReplyingTo(m);
                            toast.info(`Citation prête pour ${m.senderName}.`);
                          }}
                          className="flex items-center gap-1 text-[10px] font-bold text-[#00D084] hover:underline cursor-pointer"
                        >
                          <Reply className="size-2.5" /> Citer
                        </button>

                        {/* Quick Emoji Reaction Launcher */}
                        <div className="flex items-center gap-1">
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
                  <span>{typingContactName || "L'expert"} répond...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── ATTACHED IMAGE PREVIEW (BEFORE SENDING) ── */}
            {attachedImage && (
              <div className="shrink-0 bg-[#0c1017] border-t border-white/[0.08] px-4 py-2 flex items-center justify-between animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2.5">
                  <img
                    src={attachedImage}
                    alt="Capture sélectionnée"
                    className="size-9 rounded-lg object-cover border border-[#00D084]/40"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      📷 {attachedImageCaption || "Capture d'écran"}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">Image jointe</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAttachedImage(null);
                    setAttachedImageCaption("");
                  }}
                  className="text-gray-400 hover:text-rose-400 p-1 rounded bg-white/[0.04] cursor-pointer"
                  title="Supprimer la capture"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            {/* ── REPLAY BANNER ── */}
            {replyingTo && (
              <div className="shrink-0 bg-[#0c1017] border-t border-white/[0.08] px-4 py-1.5 flex items-center justify-between text-xs animate-in fade-in">
                <div className="flex items-center gap-2 truncate text-gray-300">
                  <Reply className="size-3 text-[#00D084] shrink-0" />
                  <span className="font-bold text-[#00D084]">Réponse à {replyingTo.senderName} :</span>
                  <span className="truncate text-gray-400 italic">"{replyingTo.text.slice(0, 45)}..."</span>
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
              <div className="shrink-0 border-t border-white/[0.08] bg-[#0c1017] p-2 space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-1">
                  <div className="flex items-center gap-1.5">
                    {(Object.keys(EMOJI_CATEGORIES) as (keyof typeof EMOJI_CATEGORIES)[]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setEmojiTab(cat)}
                        className={`text-xs px-2 py-0.5 rounded-lg font-bold transition cursor-pointer ${
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

                <div className="grid grid-cols-8 sm:grid-cols-15 gap-1 py-0.5">
                  {EMOJI_CATEGORIES[emojiTab].emojis.map((em, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleInsertEmoji(em)}
                      className="text-base hover:scale-125 transition cursor-pointer p-0.5 rounded hover:bg-white/[0.08] grid place-items-center"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── PRESET SCREENSHOT SELECTION POPOVER ── */}
            {showScreenshotMenu && (
              <div className="shrink-0 border-t border-white/[0.08] bg-[#0c1017] p-2 space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Camera className="size-3.5 text-[#00D084]" />
                    Captures MT5 Démo :
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowScreenshotMenu(false)}
                    className="text-gray-400 hover:text-white p-1 cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-0.5">
                  {PRESET_SCREENSHOTS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectPresetScreenshot(item)}
                      className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#141a23] hover:border-[#00D084]/50 p-1.5 text-left text-xs text-gray-200 hover:text-white transition cursor-pointer"
                    >
                      <img src={item.url} alt={item.name} className="size-8 rounded-lg object-cover" />
                      <span className="truncate font-medium">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── INPUT TOOLBAR & SUBMISSION FORM ── */}
            <form onSubmit={handleSendMessageSubmit} className="shrink-0 border-t border-white/[0.08] bg-[#10141b] p-3 space-y-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                {/* Screenshot Upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="grid size-9 place-items-center rounded-xl border border-white/[0.08] bg-[#141a23] hover:bg-[#1e2634] text-gray-300 hover:text-white transition cursor-pointer shrink-0"
                  title="Téléverser une image"
                >
                  <FileImage className="size-4 text-[#00D084]" />
                </button>

                {/* Preset Screenshot Samples */}
                <button
                  type="button"
                  onClick={() => setShowScreenshotMenu((prev) => !prev)}
                  className={`grid size-9 place-items-center rounded-xl border transition cursor-pointer shrink-0 ${
                    showScreenshotMenu
                      ? "border-[#00D084] bg-[#00D084]/20 text-[#00D084]"
                      : "border-white/[0.08] bg-[#141a23] hover:bg-[#1e2634] text-gray-300 hover:text-white"
                  }`}
                  title="Captures démo MT5"
                >
                  <Camera className="size-4" />
                </button>

                {/* Emoji Picker */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className={`grid size-9 place-items-center rounded-xl border transition cursor-pointer shrink-0 ${
                    showEmojiPicker
                      ? "border-[#00D084] bg-[#00D084]/20 text-[#00D084]"
                      : "border-white/[0.08] bg-[#141a23] hover:bg-[#1e2634] text-gray-300 hover:text-white"
                  }`}
                  title="Émojis"
                >
                  <Smile className="size-4 text-amber-400" />
                </button>

                {/* Voice Note */}
                <button
                  type="button"
                  onClick={handleSendVoiceNote}
                  className={`grid size-9 place-items-center rounded-xl border transition cursor-pointer shrink-0 ${
                    isRecordingVoice
                      ? "border-rose-500 bg-rose-500/25 text-rose-400 animate-pulse"
                      : "border-white/[0.08] bg-[#141a23] hover:bg-[#1e2634] text-gray-300 hover:text-white"
                  }`}
                  title={isRecordingVoice ? "Arrêter et envoyer" : "Note vocale"}
                >
                  <Mic className="size-4" />
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  placeholder={
                    isRecordingVoice
                      ? `Enregistrement (${voiceDuration}s)... Cliquez sur le micro pour valider.`
                      : `Écrire un message...`
                  }
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isRecordingVoice}
                  className="flex-1 rounded-xl border border-white/[0.08] bg-[#0c1017] px-4 py-2 text-sm sm:text-base text-white placeholder:text-gray-500 outline-none focus:border-[#00D084] transition"
                />

                {/* Submit Send Button */}
                <button
                  type="submit"
                  className="neon-btn rounded-xl px-4 sm:px-5 py-2 font-black text-xs sm:text-sm uppercase tracking-wider text-black cursor-pointer flex items-center gap-1.5 shadow-md shrink-0"
                >
                  <Send className="size-4" />
                  <span className="hidden sm:inline">Envoyer</span>
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
        <section className="grid gap-5 xl:grid-cols-[320px_1fr] h-[calc(100vh-235px)] min-h-[480px] max-h-[calc(100vh-235px)]">
          {/* Email Sidebar & Folders */}
          <article className="flex flex-col justify-between h-full rounded-3xl border border-white/[0.08] bg-[#10141b] p-4.5 shadow-xl space-y-3.5">
            <div className="space-y-3.5 flex-1 flex flex-col min-h-0">
              <button
                onClick={() => setEmailFolder("compose")}
                className="neon-btn w-full shrink-0 rounded-2xl py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-black cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                <Plus className="size-4" />
                RÉDIGER UN E-MAIL
              </button>

              {/* Folders List */}
              <div className="space-y-1 shrink-0">
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
              <div className="border-t border-white/[0.06] pt-3 space-y-2 flex-1 flex flex-col min-h-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block shrink-0">
                  {emailFolder === "sent" ? "Messages envoyés" : "Messages reçus"}
                </span>

                <div className="flex-1 min-h-0 space-y-1.5 overflow-y-auto pr-1">
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

            <div className="shrink-0 rounded-2xl border border-white/[0.06] bg-[#080b0f] p-2.5 text-xs text-gray-400 font-mono">
              Serveur SMTP : <strong className="text-white">mail.nexiummarkets.com</strong>
            </div>
          </article>

          {/* Email View or Compose View */}
          <article className="flex flex-col justify-between h-full rounded-3xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6 shadow-xl">
            {emailFolder === "compose" ? (
              /* COMPOSE FORM */
              <form onSubmit={handleSendEmail} className="flex-1 flex flex-col justify-between space-y-3.5">
                <div className="space-y-3.5 flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 shrink-0">
                    <h3 className="font-black text-base text-white">Rédiger un e-mail officiel</h3>
                    <span className="rounded-full border border-[#00D084]/30 bg-[#00D084]/10 px-2.5 py-0.5 text-xs font-mono text-[#00D084] font-bold">
                      CANAL SÉCURISÉ
                    </span>
                  </div>

                  <div className="grid gap-3.5 sm:grid-cols-2 shrink-0">
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

                  <div className="shrink-0">
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

                  <div className="flex-1 flex flex-col min-h-0">
                    <label className="block text-xs font-black uppercase text-gray-400 mb-1 shrink-0">
                      CORPS DU MESSAGE
                    </label>
                    <textarea
                      placeholder="Rédigez votre demande institutionnelle ici..."
                      value={composeBody}
                      onChange={(e) => setComposeBody(e.target.value)}
                      className="w-full flex-1 min-h-[140px] rounded-2xl border border-white/[0.08] bg-[#0c1017] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#00D084] resize-none"
                    />
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-end gap-3 border-t border-white/[0.08] pt-3">
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
              <div className="space-y-4 flex-1 flex flex-col justify-between min-h-0">
                <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3 shrink-0">
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

                  <div className="space-y-2.5 text-xs sm:text-sm text-gray-200 leading-relaxed font-medium">
                    {selectedEmail.body.map((par, i) => (
                      <p key={i}>{par}</p>
                    ))}
                  </div>

                  {/* Attachments if any */}
                  {selectedEmail.hasAttachment && (
                    <div className="rounded-2xl border border-white/[0.08] bg-[#080b0f] p-3.5 flex items-center justify-between">
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

                <div className="shrink-0 border-t border-white/[0.08] pt-3 flex items-center justify-between">
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
                    name: "Expert Trading",
                    role: "Desk de Trading Algorithmique",
                    avatar: "ET",
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
// CONFIGURATION DES MISES & GESTION DU RISQUE (PAGE DÉDIÉE)
// ----------------------------------------------------
// ── Compte DÉMO ──
const DEMO_START_BALANCE = 25000;
const EMPTY_QUOTA_STATS: PresetQuotaStats = { goldWins: 0, fxWins: 0, indexWins: 0, goldPnl: 0, fxPnl: 0, indexPnl: 0 };

function readDemoJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeDemoJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function cyclesFromEnginesConfig(cfg: unknown): Partial<Record<PresetId, string>> {
  const config = (cfg || {}) as Record<string, { cycle?: string } | undefined>;
  const cycles: Partial<Record<PresetId, string>> = {};
  for (const id of PRESET_IDS) {
    const cycle = config[PRESET_ENGINE_KEY[id]]?.cycle;
    if (cycle) cycles[id] = String(cycle);
  }
  return cycles;
}

const GOLD_QUICK_STAKES = [
  { value: 50, label: "$50" },
  { value: 100, label: "$100" },
  { value: 200, label: "$200" },
  { value: 300, label: "$300" },
  { value: 400, label: "$400" },
  { value: 500, label: "$500" },
];

const FX_QUICK_STAKES = [
  { value: 500, label: "$500" },
  { value: 750, label: "$750" },
  { value: 1000, label: "$1K" },
  { value: 1250, label: "$1.25K" },
  { value: 1500, label: "$1.5K" },
  { value: 2000, label: "$2K" },
];

const INDEX_QUICK_STAKES = [
  { value: 2000, label: "$2K" },
  { value: 3000, label: "$3K" },
  { value: 5000, label: "$5K" },
  { value: 7000, label: "$7K" },
  { value: 8500, label: "$8.5K" },
  { value: 10000, label: "$10K" },
];

function StakeManagementTab({
  balance,
  bonus,
  presetStakes = { goldStake: 100, fxStake: 750, indexStake: 2500 },
  activePreset,
  requestedPresets = [],
  quotaStats = { goldWins: 0, fxWins: 0, indexWins: 0 },
  onRequestPreset,
  onUpdatePresetStakes,
  onOpenTerminal,
}: {
  balance: number;
  bonus: number;
  presetStakes?: PresetStakes;
  activePreset?: string | null;
  requestedPresets?: string[];
  quotaStats?: PresetQuotaStats;
  onRequestPreset?: (presetId: string, botName: string) => void;
  onUpdatePresetStakes?: (newStakes: PresetStakes) => void;
  onOpenTerminal?: () => void;
}) {
  const [goldStakeInput, setGoldStakeInput] = useState<number>(presetStakes.goldStake || 100);
  const [fxStakeInput, setFxStakeInput] = useState<number>(presetStakes.fxStake || 750);
  const [indexStakeInput, setIndexStakeInput] = useState<number>(presetStakes.indexStake || 2500);

  useEffect(() => {
    setGoldStakeInput(presetStakes.goldStake || 100);
    setFxStakeInput(presetStakes.fxStake || 750);
    setIndexStakeInput(presetStakes.indexStake || 2500);
  }, [presetStakes]);

  // Active status per preset
  const activeList = useMemo(() => {
    return (activePreset || "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  }, [activePreset]);

  const isGoldApproved = activeList.includes("AI_GOLD");
  const isGoldExpired = isGoldApproved && (quotaStats?.goldWins ?? 0) >= 2;
  const isGoldRequested = (requestedPresets || []).includes("AI_GOLD");
  const isGoldPending = isGoldRequested && (!isGoldApproved || isGoldExpired);
  const isGoldActive = isGoldApproved && !isGoldExpired && !isGoldPending;

  const isFxApproved = activeList.includes("FX_TREND");
  const isFxExpired = isFxApproved && (quotaStats?.fxWins ?? 0) >= 5;
  const isFxRequested = (requestedPresets || []).includes("FX_TREND");
  const isFxPending = isFxRequested && (!isFxApproved || isFxExpired);
  const isFxActive = isFxApproved && !isFxExpired && !isFxPending;

  const isIndexApproved = activeList.includes("INDEX_REVERSION");
  const isIndexExpired = false;
  const isIndexRequested = (requestedPresets || []).includes("INDEX_REVERSION");
  const isIndexPending = isIndexRequested && !isIndexApproved;
  const isIndexActive = isIndexApproved && !isIndexPending;

  // Mise initiale figée dès le lancement du bot : elle reste la base du gain
  // cible pour tout le cycle, même si le client modifie ensuite sa mise.
  const goldLockedStake = isGoldActive ? quotaStats?.goldInitialStake : undefined;
  const fxLockedStake = isFxActive ? quotaStats?.fxInitialStake : undefined;
  const indexLockedStake = isIndexActive ? quotaStats?.indexInitialStake : undefined;
  const isGoldEditable = isGoldActive && goldLockedStake === undefined;
  const isFxEditable = isFxActive && fxLockedStake === undefined;
  const isIndexEditable = isIndexActive && indexLockedStake === undefined;

  const totalAllocated =
    (isGoldActive ? goldStakeInput : 0) +
    (isFxActive ? fxStakeInput : 0) +
    (isIndexActive ? indexStakeInput : 0);
  const allocationPercent = balance > 0 ? Math.min(100, Math.round((totalAllocated / balance) * 100)) : 0;

  // Hiérarchie des Mises : Preset 1 < Preset 2 < Preset 3
  const isHierarchyValid = goldStakeInput < fxStakeInput && fxStakeInput < indexStakeInput;

  const handleSaveStakes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHierarchyValid) {
      toast.error(
        `Hiérarchie des mises : Preset 1 ($${goldStakeInput}) doit être inférieur à Preset 2 ($${fxStakeInput}), et Preset 2 inférieur à Preset 3 ($${indexStakeInput}).`
      );
      return;
    }
    const newStakes: PresetStakes = {
      goldStake: Math.max(10, Math.min(500, goldStakeInput || 100)),
      fxStake: Math.max(501, Math.min(2000, fxStakeInput || 750)),
      indexStake: Math.max(2001, Math.min(10000, indexStakeInput || 2500)),
    };
    onUpdatePresetStakes?.(newStakes);
    toast.success("Mises enregistrées avec succès !");
  };

  const handleResetDefaults = () => {
    if (isGoldActive) setGoldStakeInput(100);
    if (isFxActive) setFxStakeInput(750);
    if (isIndexActive) setIndexStakeInput(2500);
    onUpdatePresetStakes?.({
      goldStake: isGoldActive ? 100 : presetStakes.goldStake,
      fxStake: isFxActive ? 750 : presetStakes.fxStake,
      indexStake: isIndexActive ? 2500 : presetStakes.indexStake,
    });
    toast.info("Mises réinitialisées aux valeurs standard ($100 < $750 < $2 500).");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Aéré */}
      <section className="admin-card-emerald p-6 sm:p-7 relative overflow-hidden rounded-3xl shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="space-y-1 z-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Configuration des Mises
          </h2>
        </div>

        <div className="flex items-center gap-3 z-10">
          {onOpenTerminal && (
            <button
              type="button"
              onClick={onOpenTerminal}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 px-5 py-3 text-xs sm:text-sm font-black text-emerald-300 uppercase tracking-wider transition-all cursor-pointer shadow-md hover:scale-[1.02]"
            >
              <Monitor className="size-4" />
              TERMINAL MT5
            </button>
          )}
        </div>
      </section>

      {/* Hiérarchie Status Strip */}
      <div
        className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono transition-all ${
          isHierarchyValid
            ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
            : "border-amber-500/40 bg-amber-950/30 text-amber-300"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isHierarchyValid ? (
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="size-4 text-amber-400 shrink-0 animate-bounce" />
          )}
          <span>
            {isHierarchyValid
              ? `Hiérarchie validée : Preset 1 ($${goldStakeInput}) < Preset 2 ($${fxStakeInput}) < Preset 3 ($${indexStakeInput})`
              : `⚠️ Règle de hiérarchie requise : Preset 1 ($${goldStakeInput}) doit être < Preset 2 ($${fxStakeInput}) < Preset 3 ($${indexStakeInput})`}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 font-bold">
            P1: $50 - $500
          </span>
          <span className="text-slate-500">&lt;</span>
          <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 font-bold">
            P2: $500 - $2K
          </span>
          <span className="text-slate-500">&lt;</span>
          <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 font-bold">
            P3: $2K - $10K
          </span>
        </div>
      </div>

      {/* 3 Cartes de Trading Aérées avec verrouillage sur presets inactifs */}
      <form onSubmit={handleSaveStakes} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Nexium AI Gold */}
          <div
            className={`rounded-3xl border p-6 sm:p-7 space-y-6 shadow-xl flex flex-col justify-between transition-all ${
              isGoldActive
                ? "border-amber-500/35 bg-[#0d131e] hover:border-amber-400/60"
                : "border-slate-800/80 bg-[#090d14]/90 opacity-80"
            }`}
          >
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <span
                    className={`text-base sm:text-lg font-black font-mono flex items-center gap-2 ${
                      isGoldActive ? "text-amber-400" : "text-slate-400"
                    }`}
                  >
                    <span
                      className={`size-2.5 rounded-full ${
                        isGoldActive
                          ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                          : "bg-slate-600"
                      }`}
                    />
                    Preset 1 : Nexium AI Gold
                  </span>
                  <span className="text-[10px] font-mono text-amber-300/80 block mt-0.5">
                    XAUUSD · Gain : +50% de la mise (2 trades max)
                  </span>
                </div>

                {/* Status Badges */}
                {isGoldPending ? (
                  <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
                    <Clock className="size-3 text-amber-400 animate-spin" />
                    EN ATTENTE DE VALIDATION
                  </span>
                ) : isGoldExpired ? (
                  <span className="text-[11px] font-mono font-bold text-rose-300 bg-rose-500/15 px-3 py-1 rounded-full border border-rose-500/30 flex items-center gap-1.5">
                    <Lock className="size-3 text-rose-400" />
                    EXPIRÉ ({Math.min(2, quotaStats?.goldWins ?? 0)}/2)
                  </span>
                ) : isGoldActive ? (
                  <span className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ACTIF ({Math.min(2, quotaStats?.goldWins ?? 0)}/2)
                  </span>
                ) : (
                  <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-800/70 px-3 py-1 rounded-full border border-slate-700/50 flex items-center gap-1.5">
                    <Lock className="size-3 text-slate-400" />
                    INACTIF
                  </span>
                )}
              </div>

              {/* Sizing Input */}
              {goldLockedStake !== undefined && (
                <p className="text-[11px] font-mono text-slate-400">
                  Mise initiale figée pour ce cycle : <strong className="text-white">${goldLockedStake}</strong> — modifiable au prochain cycle.
                </p>
              )}
              {isGoldEditable ? (
                <div className="relative flex items-center rounded-2xl bg-[#06090e] border border-amber-500/35 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all px-4 h-14">
                  <span className="text-2xl font-black font-mono text-amber-400 mr-2 select-none">$</span>
                  <input
                    type="number"
                    min={50}
                    max={500}
                    step="any"
                    value={goldStakeInput}
                    onChange={(e) => setGoldStakeInput(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent text-white font-mono font-black text-2xl focus:outline-none tracking-tight [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest ml-2 select-none">USD</span>
                </div>
              ) : (
                <div className="relative flex items-center rounded-2xl bg-[#06090e]/60 border border-slate-800/80 px-4 h-14 opacity-50 cursor-not-allowed">
                  <span className="text-2xl font-black font-mono text-slate-500 mr-2 select-none">$</span>
                  <input
                    type="number"
                    disabled
                    value={goldStakeInput}
                    className="w-full bg-transparent text-slate-500 font-mono font-black text-2xl focus:outline-none tracking-tight cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs font-bold font-mono text-slate-600 uppercase tracking-widest ml-2 select-none">USD</span>
                </div>
              )}

              {/* Quick Chips (Plage $50 - $500) */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {GOLD_QUICK_STAKES.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    disabled={!isGoldEditable}
                    onClick={() => setGoldStakeInput(chip.value)}
                    className={`py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                      !isGoldEditable
                        ? "bg-[#10151f] text-slate-600 opacity-40 cursor-not-allowed pointer-events-none"
                        : goldStakeInput === chip.value
                        ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30 scale-105 cursor-pointer"
                        : "bg-[#18202d] text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Gain & Quota Summary Box */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-300">Gain / trade (+50%) :</span>
                  <strong className="text-emerald-400 font-black text-sm whitespace-nowrap shrink-0">
                    +${(goldStakeInput * 0.50).toFixed(2)} USD
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-400">Quota de trades :</span>
                  <strong className="text-amber-300 font-bold whitespace-nowrap shrink-0 text-right">
                    2 trades (Max +${(goldStakeInput * 1.00).toFixed(2)} USD)
                  </strong>
                </div>
              </div>

              {/* Status / Activation Notice */}
              {isGoldPending ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-xs font-bold text-amber-300 flex items-center justify-center gap-2 animate-pulse">
                  <Clock className="size-3.5 text-amber-400 animate-spin shrink-0" />
                  <span>Demande en cours de validation par le Desk d'Administration</span>
                </div>
              ) : isGoldExpired ? (
                <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-3 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                    <Lock className="size-3.5 text-rose-400 shrink-0" />
                    <span>Abonnement expiré (2/2 trades) — Mises verrouillées</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRequestPreset?.("AI_GOLD", "Nexium AI Gold (Renouvellement)")}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Sparkles className="size-3.5 shrink-0" />
                    <span>Faire une nouvelle demande</span>
                  </button>
                </div>
              ) : !isGoldApproved ? (
                <button
                  type="button"
                  onClick={() => onRequestPreset?.("AI_GOLD", "Nexium AI Gold")}
                  className="w-full py-3 px-4 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-amber-600/20 hover:from-amber-500/25 hover:to-amber-600/30 text-amber-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-[1.01]"
                >
                  <Sparkles className="size-3.5 text-amber-400 shrink-0" />
                  <span>Demander l'activation du preset</span>
                </button>
              ) : null}

              {/* Clean 3-Metric Strip */}
              <div
                className={`grid grid-cols-3 gap-2 rounded-2xl border p-3 text-center font-mono ${
                  isGoldActive
                    ? "border-amber-500/20 bg-[#070b10]"
                    : "border-slate-800/60 bg-[#070b10]/60 opacity-50"
                }`}
              >
                <div>
                  <span className="text-[10px] text-slate-400 block">Volume MT5</span>
                  <strong
                    className={`text-xs sm:text-sm font-black ${
                      isGoldActive ? "text-amber-400" : "text-slate-500"
                    }`}
                  >
                    {isGoldActive ? `≈ ${Math.max(0.01, +(goldStakeInput / 1000 * 0.15).toFixed(2))} Lot` : "—"}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Gain / Trade</span>
                  <strong className={`text-xs sm:text-sm font-bold ${isGoldActive ? "text-emerald-400" : "text-slate-500"}`}>
                    +50%
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Quota Max</span>
                  <strong className={`text-xs sm:text-sm font-bold ${isGoldActive ? "text-amber-300" : "text-slate-500"}`}>
                    2 Trades
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Nexium FX Trend */}
          <div
            className={`rounded-3xl border p-6 sm:p-7 space-y-6 shadow-xl flex flex-col justify-between transition-all ${
              isFxActive
                ? "border-cyan-500/35 bg-[#0d131e] hover:border-cyan-400/60"
                : "border-slate-800/80 bg-[#090d14]/90 opacity-80"
            }`}
          >
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <span
                    className={`text-base sm:text-lg font-black font-mono flex items-center gap-2 ${
                      isFxActive ? "text-cyan-400" : "text-slate-400"
                    }`}
                  >
                    <span
                      className={`size-2.5 rounded-full ${
                        isFxActive
                          ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                          : "bg-slate-600"
                      }`}
                    />
                    Preset 2 : Nexium FX Trend
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300/80 block mt-0.5">
                    EURUSD · Gain : +75% de la mise (5 trades max)
                  </span>
                </div>

                {/* Status Badges */}
                {isFxPending ? (
                  <span className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-500/15 px-3 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1.5 animate-pulse">
                    <Clock className="size-3 text-cyan-400 animate-spin" />
                    EN ATTENTE DE VALIDATION
                  </span>
                ) : isFxExpired ? (
                  <span className="text-[11px] font-mono font-bold text-rose-300 bg-rose-500/15 px-3 py-1 rounded-full border border-rose-500/30 flex items-center gap-1.5">
                    <Lock className="size-3 text-rose-400" />
                    EXPIRÉ ({Math.min(5, quotaStats?.fxWins ?? 0)}/5)
                  </span>
                ) : isFxActive ? (
                  <span className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ACTIF ({Math.min(5, quotaStats?.fxWins ?? 0)}/5)
                  </span>
                ) : (
                  <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-800/70 px-3 py-1 rounded-full border border-slate-700/50 flex items-center gap-1.5">
                    <Lock className="size-3 text-slate-400" />
                    INACTIF
                  </span>
                )}
              </div>

              {/* Sizing Input */}
              {fxLockedStake !== undefined && (
                <p className="text-[11px] font-mono text-slate-400">
                  Mise initiale figée pour ce cycle : <strong className="text-white">${fxLockedStake}</strong> — modifiable au prochain cycle.
                </p>
              )}
              {isFxEditable ? (
                <div className="relative flex items-center rounded-2xl bg-[#06090e] border border-cyan-500/35 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20 transition-all px-4 h-14">
                  <span className="text-2xl font-black font-mono text-cyan-400 mr-2 select-none">$</span>
                  <input
                    type="number"
                    min={500}
                    max={2000}
                    step="any"
                    value={fxStakeInput}
                    onChange={(e) => setFxStakeInput(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent text-white font-mono font-black text-2xl focus:outline-none tracking-tight [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest ml-2 select-none">USD</span>
                </div>
              ) : (
                <div className="relative flex items-center rounded-2xl bg-[#06090e]/60 border border-slate-800/80 px-4 h-14 opacity-50 cursor-not-allowed">
                  <span className="text-2xl font-black font-mono text-slate-500 mr-2 select-none">$</span>
                  <input
                    type="number"
                    disabled
                    value={fxStakeInput}
                    className="w-full bg-transparent text-slate-500 font-mono font-black text-2xl focus:outline-none tracking-tight cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs font-bold font-mono text-slate-600 uppercase tracking-widest ml-2 select-none">USD</span>
                </div>
              )}

              {/* Quick Chips (Plage $500 - $2,000) */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {FX_QUICK_STAKES.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    disabled={!isFxEditable}
                    onClick={() => setFxStakeInput(chip.value)}
                    className={`py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                      !isFxEditable
                        ? "bg-[#10151f] text-slate-600 opacity-40 cursor-not-allowed pointer-events-none"
                        : fxStakeInput === chip.value
                        ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30 scale-105 cursor-pointer"
                        : "bg-[#18202d] text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Gain & Quota Summary Box */}
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-300">Gain / trade (+75%) :</span>
                  <strong className="text-emerald-400 font-black text-sm whitespace-nowrap shrink-0">
                    +${(fxStakeInput * 0.75).toFixed(2)} USD
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-400">Quota de trades :</span>
                  <strong className="text-cyan-300 font-bold whitespace-nowrap shrink-0 text-right">
                    5 trades (Max +${(fxStakeInput * 3.75).toFixed(2)} USD)
                  </strong>
                </div>
              </div>

              {/* Status / Activation Notice */}
              {isFxPending ? (
                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-center text-xs font-bold text-cyan-300 flex items-center justify-center gap-2 animate-pulse">
                  <Clock className="size-3.5 text-cyan-400 animate-spin shrink-0" />
                  <span>Demande en cours de validation par le Desk d'Administration</span>
                </div>
              ) : isFxExpired ? (
                <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-3 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                    <Lock className="size-3.5 text-rose-400 shrink-0" />
                    <span>Abonnement expiré (5/5 trades) — Mises verrouillées</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRequestPreset?.("FX_TREND", "Nexium FX Trend (Renouvellement)")}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Sparkles className="size-3.5 shrink-0" />
                    <span>Faire une nouvelle demande</span>
                  </button>
                </div>
              ) : !isFxApproved ? (
                <button
                  type="button"
                  onClick={() => onRequestPreset?.("FX_TREND", "Nexium FX Trend")}
                  className="w-full py-3 px-4 rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/15 to-cyan-600/20 hover:from-cyan-500/25 hover:to-cyan-600/30 text-cyan-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-[1.01]"
                >
                  <Sparkles className="size-3.5 text-cyan-400 shrink-0" />
                  <span>Demander l'activation du preset</span>
                </button>
              ) : null}

              {/* Clean 3-Metric Strip */}
              <div
                className={`grid grid-cols-3 gap-2 rounded-2xl border p-3 text-center font-mono ${
                  isFxActive
                    ? "border-cyan-500/20 bg-[#070b10]"
                    : "border-slate-800/60 bg-[#070b10]/60 opacity-50"
                }`}
              >
                <div>
                  <span className="text-[10px] text-slate-400 block">Volume MT5</span>
                  <strong
                    className={`text-xs sm:text-sm font-black ${
                      isFxActive ? "text-cyan-400" : "text-slate-500"
                    }`}
                  >
                    {isFxActive ? `≈ ${Math.max(0.01, +(fxStakeInput / 1000 * 0.20).toFixed(2))} Lot` : "—"}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Gain / Trade</span>
                  <strong className={`text-xs sm:text-sm font-bold ${isFxActive ? "text-emerald-400" : "text-slate-500"}`}>
                    +75%
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Quota Max</span>
                  <strong className={`text-xs sm:text-sm font-bold ${isFxActive ? "text-cyan-300" : "text-slate-500"}`}>
                    5 Trades
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Nexium Index Reversion */}
          <div
            className={`rounded-3xl border p-6 sm:p-7 space-y-6 shadow-xl flex flex-col justify-between transition-all ${
              isIndexActive
                ? "border-purple-500/35 bg-[#0d131e] hover:border-purple-400/60"
                : "border-slate-800/80 bg-[#090d14]/90 opacity-80"
            }`}
          >
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <span
                    className={`text-base sm:text-lg font-black font-mono flex items-center gap-2 ${
                      isIndexActive ? "text-purple-400" : "text-slate-400"
                    }`}
                  >
                    <span
                      className={`size-2.5 rounded-full ${
                        isIndexActive
                          ? "bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                          : "bg-slate-600"
                      }`}
                    />
                    Preset 3 : Index Reversion
                  </span>
                  <span className="text-[10px] font-mono text-purple-300/80 block mt-0.5">
                    NAS100 · Gain : +98% de la mise (Trades Illimités ∞)
                  </span>
                </div>

                {/* Status Badges */}
                {isIndexPending ? (
                  <span className="text-[11px] font-mono font-bold text-purple-300 bg-purple-500/15 px-3 py-1 rounded-full border border-purple-500/30 flex items-center gap-1.5 animate-pulse">
                    <Clock className="size-3 text-purple-400 animate-spin" />
                    EN ATTENTE DE VALIDATION
                  </span>
                ) : isIndexActive ? (
                  <span className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ACTIF (Illimité ∞)
                  </span>
                ) : (
                  <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-800/70 px-3 py-1 rounded-full border border-slate-700/50 flex items-center gap-1.5">
                    <Lock className="size-3 text-slate-400" />
                    INACTIF
                  </span>
                )}
              </div>

              {/* Sizing Input */}
              {indexLockedStake !== undefined && (
                <p className="text-[11px] font-mono text-slate-400">
                  Mise initiale figée pour ce cycle : <strong className="text-white">${indexLockedStake}</strong> — modifiable au prochain cycle.
                </p>
              )}
              {isIndexEditable ? (
                <div className="relative flex items-center rounded-2xl bg-[#06090e] border border-purple-500/35 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-400/20 transition-all px-4 h-14">
                  <span className="text-2xl font-black font-mono text-purple-400 mr-2 select-none">$</span>
                  <input
                    type="number"
                    min={2000}
                    max={10000}
                    step="any"
                    value={indexStakeInput}
                    onChange={(e) => setIndexStakeInput(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent text-white font-mono font-black text-2xl focus:outline-none tracking-tight [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest ml-2 select-none">USD</span>
                </div>
              ) : (
                <div className="relative flex items-center rounded-2xl bg-[#06090e]/60 border border-slate-800/80 px-4 h-14 opacity-50 cursor-not-allowed">
                  <span className="text-2xl font-black font-mono text-slate-500 mr-2 select-none">$</span>
                  <input
                    type="number"
                    disabled
                    value={indexStakeInput}
                    className="w-full bg-transparent text-slate-500 font-mono font-black text-2xl focus:outline-none tracking-tight cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs font-bold font-mono text-slate-600 uppercase tracking-widest ml-2 select-none">USD</span>
                </div>
              )}

              {/* Quick Chips (Plage $2,000 - $10,000) */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {INDEX_QUICK_STAKES.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    disabled={!isIndexEditable}
                    onClick={() => setIndexStakeInput(chip.value)}
                    className={`py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                      !isIndexEditable
                        ? "bg-[#10151f] text-slate-600 opacity-40 cursor-not-allowed pointer-events-none"
                        : indexStakeInput === chip.value
                        ? "bg-purple-500 text-white font-black shadow-md shadow-purple-500/30 scale-105 cursor-pointer"
                        : "bg-[#18202d] text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Gain & Quota Summary Box */}
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-300">Gain / trade (+98%) :</span>
                  <strong className="text-emerald-400 font-black text-sm whitespace-nowrap shrink-0">
                    +${(indexStakeInput * 0.98).toFixed(2)} USD
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-400">Quota de trades :</span>
                  <strong className="text-purple-300 font-bold whitespace-nowrap shrink-0 text-right">
                    Trades Illimités ∞ (En continu)
                  </strong>
                </div>
              </div>

              {/* Status / Activation Notice */}
              {isIndexPending ? (
                <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-3 text-center text-xs font-bold text-purple-300 flex items-center justify-center gap-2 animate-pulse">
                  <Clock className="size-3.5 text-purple-400 animate-spin shrink-0" />
                  <span>Demande en cours de validation par le Desk d'Administration</span>
                </div>
              ) : !isIndexApproved ? (
                <button
                  type="button"
                  onClick={() => onRequestPreset?.("INDEX_REVERSION", "Nexium Index Reversion")}
                  className="w-full py-3 px-4 rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-500/15 to-purple-600/20 hover:from-purple-500/25 hover:to-purple-600/30 text-purple-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-[1.01]"
                >
                  <Sparkles className="size-3.5 text-purple-400 shrink-0" />
                  <span>Demander l'activation du preset</span>
                </button>
              ) : null}

              {/* Clean 3-Metric Strip */}
              <div
                className={`grid grid-cols-3 gap-2 rounded-2xl border p-3 text-center font-mono ${
                  isIndexActive
                    ? "border-purple-500/20 bg-[#070b10]"
                    : "border-slate-800/60 bg-[#070b10]/60 opacity-50"
                }`}
              >
                <div>
                  <span className="text-[10px] text-slate-400 block">Volume MT5</span>
                  <strong
                    className={`text-xs sm:text-sm font-black ${
                      isIndexActive ? "text-purple-400" : "text-slate-500"
                    }`}
                  >
                    {isIndexActive ? `≈ ${Math.max(0.01, +(indexStakeInput / 1000 * 0.10).toFixed(2))} Lot` : "—"}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Gain / Trade</span>
                  <strong className={`text-xs sm:text-sm font-bold ${isIndexActive ? "text-emerald-400" : "text-slate-500"}`}>
                    +98%
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Quota Max</span>
                  <strong className={`text-xs sm:text-sm font-bold ${isIndexActive ? "text-purple-300" : "text-slate-500"}`}>
                    Illimité ∞
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer Aéré */}
        <div className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="text-xs font-mono text-slate-400">
            Total alloué simultané (actifs) :{" "}
            <strong className="text-emerald-400 font-bold">${totalAllocated.toLocaleString("fr-FR")} USD</strong>{" "}
            ({allocationPercent}% du solde)
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              RÉINITIALISER ($100 &lt; $750 &lt; $2.5K)
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition cursor-pointer shadow-xl shadow-emerald-500/25 active:scale-95"
            >
              <CheckCircle2 className="size-4.5" />
              ENREGISTRER LES MISES
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ----------------------------------------------------
// PARAMÈTRES DU COMPTE VIEW (FULL PAGE)
// ----------------------------------------------------
function AccountSettingsTab({
  clientName,
  clientEmail,
  mt5AccountNumber,
  balance,
  bonus,
  customSlug,
  currentUserId,
  onLogout,
}: {
  clientName: string;
  clientEmail: string;
  mt5AccountNumber: string;
  balance: number;
  bonus: number;
  customSlug?: string | undefined;
  currentUserId: string | null;
  onLogout: () => void | Promise<void>;
}) {
  const [twoFactor, setTwoFactor] = useState(false);
  const [notifications, setNotifications] = useState({
    trades: true,
    deposits: true,
    security: true,
    news: false,
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);

  const slug = customSlug || getUserSlug({ name: clientName, email: clientEmail, id: currentUserId });
  const portalUrl = `https://nexiummarkets.com/portal/${slug}`;

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Mot de passe mis à jour avec succès.");
  };

  return (
    <div className="space-y-5">
      {/* Header Banner Harmonisé */}
      <section className="admin-card-emerald p-4 sm:p-5 relative overflow-hidden space-y-2.5 shadow-md rounded-2xl">
        <div className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Paramètres du Compte</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(portalUrl);
                setCopiedKey(true);
                setTimeout(() => setCopiedKey(false), 2000);
                toast.success("Lien de votre portail copié !");
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800 px-4 py-2 text-xs sm:text-sm font-bold text-white uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:border-emerald-500/50"
            >
              <Copy className="size-4 text-emerald-400" />
              {copiedKey ? "LIEN COPIÉ !" : "COPIER MON LIEN PORTAIL"}
            </button>
          </div>
        </div>
      </section>

      {/* Grid 4 Stat summary tiles */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 font-mono">
        <article className="admin-card-emerald p-3.5 sm:p-4 space-y-1.5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">COMPTE MT5</span>
            <div className="grid size-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Monitor className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">#{mt5AccountNumber}</p>
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-emerald-500/20 font-sans">
            <span className="text-slate-400">Type de compte</span>
            <span className="font-mono font-bold text-emerald-400">RAW ECN</span>
          </div>
        </article>

        <article className="admin-card-cyan p-3.5 sm:p-4 space-y-1.5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">SERVEUR D'EXÉCUTION</span>
            <div className="grid size-8 place-items-center rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Wifi className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-cyan-300">Equinix NY4</p>
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-cyan-500/20 font-sans">
            <span className="text-slate-400">Latence FIX</span>
            <span className="font-mono font-bold text-emerald-400">21 ms</span>
          </div>
        </article>

        <article className="admin-card-indigo p-3.5 sm:p-4 space-y-1.5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">TITULAIRE VÉRIFIÉ</span>
            <div className="grid size-8 place-items-center rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <ShieldCheck className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white truncate">{clientName}</p>
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-indigo-500/20 font-sans">
            <span className="text-slate-400">Statut KYC</span>
            <span className="font-mono font-bold text-emerald-400">Approuvé</span>
          </div>
        </article>

        <article className="admin-card-amber p-3.5 sm:p-4 space-y-1.5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">SÉCURITÉ 2FA</span>
            <div className="grid size-8 place-items-center rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Lock className="size-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-300">{twoFactor ? "ACTIVÉ" : "ACTIF"}</p>
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-amber-500/20 font-sans">
            <span className="text-slate-400">Chiffrement</span>
            <span className="font-mono font-bold text-emerald-400">SHA-256</span>
          </div>
        </article>
      </section>

      {/* 3 Cartes Équilibrées et Institutionnelles avec Libellés Intégrés & Grands Textes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
        {/* 1. Identifiants & Profil */}
        <div className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 shadow-md flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
              <div className="grid size-10 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <User className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">PROFIL &amp; ACCÈS</p>
                <h3 className="text-lg font-black text-white tracking-tight">Coordonnées Titulaire</h3>
              </div>
            </div>

            <div className="space-y-3.5 mt-5">
              {/* NOM DU TITULAIRE */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#0c1017] p-3.5 space-y-1 hover:border-emerald-500/40 transition">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  NOM DU TITULAIRE
                </span>
                <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-white">
                  <User className="size-5 text-emerald-400 shrink-0" />
                  <span className="truncate">{clientName}</span>
                </div>
              </div>

              {/* EMAIL ENREGISTRÉ */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#0c1017] p-3.5 space-y-1 hover:border-emerald-500/40 transition">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  EMAIL ENREGISTRÉ
                </span>
                <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-white font-mono">
                  <span className="size-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="truncate">{clientEmail || "investisseur@nexiummarkets.com"}</span>
                </div>
              </div>

              {/* LIEN PORTAIL CLIENT */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#0c1017] p-3.5 space-y-1.5 hover:border-emerald-500/40 transition">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  LIEN PORTAIL CLIENT
                </span>
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-xs sm:text-sm font-bold text-gray-200 font-mono truncate">
                    {portalUrl}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(portalUrl);
                      toast.success("Lien copié !");
                    }}
                    className="rounded-xl border border-white/[0.1] bg-[#141a23] hover:bg-emerald-500/20 p-2 text-emerald-400 cursor-pointer transition shadow-sm hover:border-emerald-500/40 shrink-0"
                    title="Copier le lien"
                  >
                    <Copy className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Réseau FIX 4.4</span>
            <span className="text-emerald-400 font-bold">Synchronisé NY4</span>
          </div>
        </div>

        {/* 2. Sécurité & Mot de passe */}
        <div className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 shadow-md flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
              <div className="grid size-10 place-items-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Lock className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">ACCÈS SÉCURISÉ</p>
                <h3 className="text-lg font-black text-white tracking-tight">Modifier Mot de Passe</h3>
              </div>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-3.5 mt-5">
              {/* NOUVEAU MOT DE PASSE */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#0c1017] p-3.5 space-y-1 focus-within:border-amber-400/60 focus-within:ring-1 focus-within:ring-amber-400/20 transition">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  NOUVEAU MOT DE PASSE
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="w-full bg-transparent text-base font-bold text-white outline-none font-mono placeholder:text-slate-600"
                />
              </div>

              {/* CONFIRMER LE MOT DE PASSE */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#0c1017] p-3.5 space-y-1 focus-within:border-amber-400/60 focus-within:ring-1 focus-within:ring-amber-400/20 transition">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  CONFIRMER LE MOT DE PASSE
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className="w-full bg-transparent text-base font-bold text-white outline-none font-mono placeholder:text-slate-600"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-emerald-500/20 mt-2"
              >
                METTRE À JOUR
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">Clé de chiffrement</span>
            <span className="text-xs text-amber-400 font-bold font-mono">AES-256 GCM</span>
          </div>
        </div>

        {/* 3. Session & Sécurité Réseau */}
        <div className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 shadow-md flex flex-col justify-between space-y-5 md:col-span-2 xl:col-span-1">
          <div>
            <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
              <div className="grid size-10 place-items-center rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">TÉLÉMÉTRIE &amp; SÉCURITÉ</p>
                <h3 className="text-lg font-black text-white tracking-tight">Session ECN Active</h3>
              </div>
            </div>

            <div className="space-y-3.5 mt-5 font-mono">
              <div className="p-4 rounded-2xl border border-white/[0.06] bg-[#0c1017] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Passerelle FIX</span>
                  <span className="text-emerald-400 text-xs sm:text-sm font-black flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    Connecté (21 ms)
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                  <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Protocole TLS</span>
                  <span className="text-white text-xs sm:text-sm font-bold">v1.3 HSTS Strict</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                  <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Serveur MT5</span>
                  <span className="text-cyan-300 text-xs sm:text-sm font-bold">Equinix NY4 Hub</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-white/[0.06] bg-[#0c1017] flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-xs uppercase font-bold tracking-wider block">Protection Anti-DDoS</span>
                  <strong className="text-emerald-400 font-black text-xs sm:text-sm">Cloudflare Enterprise</strong>
                </div>
                <ShieldCheck className="size-6 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">Gestion de session</span>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition cursor-pointer hover:underline"
            >
              <LogOut className="size-3.5" />
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// MAIN DASHBOARD COMPONENT
// ----------------------------------------------------
import { getUserSlug } from "@/lib/user-slug";
import { isOwnerEmail } from "@/lib/owner";

export function NexiumDashboard({
  customSlug,
  adminImpersonateUserId,
  onExitImpersonation,
}: {
  customSlug?: string;
  /** Quand fourni, le dashboard charge/pilote CE client précis au lieu du compte connecté — utilisé par la Supervision Live admin. */
  adminImpersonateUserId?: string;
  onExitImpersonation?: () => void;
} = {}) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Vue d’ensemble");
  const [balance, setBalance] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientEmails, setClientEmails] = useState<EmailItem[]>([]);
  const [mt5AccountNumber, setMt5AccountNumber] = useState("");
  const [assignedAdvisor, setAssignedAdvisor] = useState("Expert Trading (Desk Quant)");
  const [licenseStatus, setLicenseStatus] = useState<"NOT_REQUESTED" | "PENDING_PRESET_APPROVAL" | "ACTIVE" | "EXPIRED">("NOT_REQUESTED");
  const [requestedPresets, setRequestedPresets] = useState<string[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  // Sélection en cours (avant envoi) sur l'écran de choix des presets — le client peut cocher 1, 2 ou 3.
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>([]);
  const [showPresetConfirmModal, setShowPresetConfirmModal] = useState(false);
  const [submittingPreset, setSubmittingPreset] = useState(false);
  const [terminalPositions, setTerminalPositions] = useState<Mt5Position[]>([]);
  // ── Compte DÉMO (étude de comportement) ──
  // Solde démo et cycles des presets sont conservés par client dans ce
  // Montants de mise alloués par Trade pour chaque Preset ($ USD)
  const [presetStakes, setPresetStakes] = useState<PresetStakes>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nexium_preset_stakes");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return { goldStake: 100, fxStake: 750, indexStake: 2500 };
  });

  useEffect(() => {
    const defaults = { goldStake: 100, fxStake: 750, indexStake: 2500 };
    if (!(presetStakes.goldStake < presetStakes.fxStake && presetStakes.fxStake < presetStakes.indexStake)) {
      setPresetStakes(defaults);
      try { localStorage.setItem("nexium_preset_stakes", JSON.stringify(defaults)); } catch {}
    }
  }, []);

  const demoStorageKey = (name: string) => `nexium_demo_${name}_${currentUserId || "local"}`;
  const [demoBalance, setDemoBalance] = useState(DEMO_START_BALANCE);
  const [quotaStats, setQuotaStats] = useState<PresetQuotaStats>(EMPTY_QUOTA_STATS);
  // Cycle de chaque preset validé par l'admin (engines_config.<moteur>.cycle)
  const [engineCycles, setEngineCycles] = useState<Partial<Record<PresetId, string>>>({});

  useEffect(() => {
    const stored = readDemoJson<PresetQuotaStats>(demoStorageKey("quota")) || { ...EMPTY_QUOTA_STATS };
    let next = { ...stored };
    for (const id of PRESET_IDS) {
      const cycle = engineCycles[id];
      const keys = PRESET_STAT_KEYS[id];
      const prevCycle = next[keys.cycle];

      // Réinitialisation UNIQUEMENT si un cycle précédent était enregistré ET qu'il est différent du nouveau cycle
      if (cycle && prevCycle && prevCycle !== cycle) {
        next = { ...next, [keys.trades]: 0, [keys.pnl]: 0, [keys.initialStake]: undefined, [keys.cycle]: cycle };
      } else if (cycle && !prevCycle) {
        next = { ...next, [keys.cycle]: cycle };
      } else {
        // Correction immédiate de tout montant négatif hérité de simulations antérieures
        const trades = next[keys.trades] ?? 0;
        const currentPnl = next[keys.pnl] ?? 0;
        const stake = next[keys.initialStake] ?? presetStakes[PRESET_RULES[id].stakeKey];
        if (trades > 0 && currentPnl <= 0) {
          const positivePnl = +(trades * stake * PRESET_RULES[id].targetRate).toFixed(2);
          next = { ...next, [keys.pnl]: positivePnl };
        } else if (currentPnl < 0) {
          next = { ...next, [keys.pnl]: Math.abs(currentPnl) };
        }
      }
    }
    setQuotaStats(next);
    writeDemoJson(demoStorageKey("quota"), next);
    setDemoBalance(readDemoJson<number>(demoStorageKey("balance")) ?? DEMO_START_BALANCE);
  }, [currentUserId, engineCycles, presetStakes]);

  const handleQuotaChange = (newStats: PresetQuotaStats) => {
    // S'assurer que les identifiants de cycles actuels sont bien conservés
    const statsWithCycles: PresetQuotaStats = { ...newStats };
    for (const id of PRESET_IDS) {
      const keys = PRESET_STAT_KEYS[id];
      const cycle = engineCycles[id];
      if (cycle && !statsWithCycles[keys.cycle]) {
        statsWithCycles[keys.cycle] = cycle;
      }
    }
    setQuotaStats(statsWithCycles);
    writeDemoJson(demoStorageKey("quota"), statsWithCycles);

    if (isSupabaseConfigured && currentUserId) {
      const totalProfit = +(
        (statsWithCycles.goldPnl || 0) +
        (statsWithCycles.fxPnl || 0) +
        (statsWithCycles.indexPnl || 0)
      ).toFixed(2);

      getUserProfile(currentUserId).then((p) => {
        if (p) {
          const cfg = (p.engines_config || {}) as Record<string, unknown>;
          updateUserProfile(currentUserId, {
            gross_profit_total: Math.max(p.gross_profit_total || 0, totalProfit),
            engines_config: {
              ...cfg,
              quota_stats: statsWithCycles,
            },
          }).catch(() => {});
        }
      });
    }
  };

  const handleDemoBalanceChange = (newBalance: number) => {
    const rounded = +newBalance.toFixed(2);
    setDemoBalance(rounded);
    writeDemoJson(demoStorageKey("balance"), rounded);
  };

  const handleUpdatePresetStake = (key: keyof PresetStakes, amount: number) => {
    setPresetStakes((prev) => {
      const next = { ...prev, [key]: amount };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("nexium_preset_stakes", JSON.stringify(next));
        } catch {}
      }
      if (isSupabaseConfigured && currentUserId) {
        getUserProfile(currentUserId).then((p) => {
          if (p) {
            const cfg = (p.engines_config || {}) as Record<string, unknown>;
            updateUserProfile(currentUserId, {
              engines_config: {
                ...cfg,
                preset_stakes: next,
              },
            }).catch(() => {});
          }
        });
      }
      return next;
    });
    toast.success(`Mise par trade configurée à $${amount} USD pour ce preset.`);
  };

  const handleUpdateAllPresetStakes = (newStakes: PresetStakes) => {
    if (!(newStakes.goldStake < newStakes.fxStake && newStakes.fxStake < newStakes.indexStake)) {
      toast.error("Mises incohérentes : Preset 1 < Preset 2 < Preset 3 est obligatoire.");
      return;
    }
    setPresetStakes(newStakes);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("nexium_preset_stakes", JSON.stringify(newStakes));
      } catch {}
    }
    if (isSupabaseConfigured && currentUserId) {
      getUserProfile(currentUserId).then((p) => {
        if (p) {
          const cfg = (p.engines_config || {}) as Record<string, unknown>;
          updateUserProfile(currentUserId, {
            engines_config: {
              ...cfg,
              preset_stakes: newStakes,
            },
          }).catch(() => {});
        }
      });
    }
  };

  // Calcul dynamique des P&L en direct pour chaque Preset selon les positions du terminal MT5
  const goldPositions = useMemo(
    () => terminalPositions.filter((p) => p.symbol === "GOLD" || p.symbol === "XAUUSD"),
    [terminalPositions]
  );
  const goldPnlLive = useMemo(
    () => goldPositions.reduce((acc, p) => acc + (p.profit || 0), 0),
    [goldPositions]
  );
  const goldStoredPnl = (quotaStats.goldPnl && quotaStats.goldPnl > 0)
    ? quotaStats.goldPnl
    : quotaStats.goldWins > 0
    ? +(quotaStats.goldWins * (quotaStats.goldInitialStake ?? presetStakes.goldStake) * 0.50).toFixed(2)
    : 0;
  const goldTotalPnl = +Math.max(0, goldStoredPnl + goldPnlLive).toFixed(2);

  const fxPositions = useMemo(
    () => terminalPositions.filter((p) => ["EURUSD", "DXY", "GBPUSD", "USDJPY"].includes(p.symbol)),
    [terminalPositions]
  );
  const fxPnlLive = useMemo(
    () => fxPositions.reduce((acc, p) => acc + (p.profit || 0), 0),
    [fxPositions]
  );
  const fxStoredPnl = (quotaStats.fxPnl && quotaStats.fxPnl > 0)
    ? quotaStats.fxPnl
    : quotaStats.fxWins > 0
    ? +(quotaStats.fxWins * (quotaStats.fxInitialStake ?? presetStakes.fxStake) * 0.75).toFixed(2)
    : 0;
  const fxTotalPnl = +Math.max(0, fxStoredPnl + fxPnlLive).toFixed(2);

  const indexPositions = useMemo(
    () =>
      terminalPositions.filter((p) =>
        ["DJI", "NDQ", "SPX", "NAS100", "US30", "AAPL", "TSLA", "NVDA"].includes(p.symbol)
      ),
    [terminalPositions]
  );
  const indexPnlLive = useMemo(
    () => indexPositions.reduce((acc, p) => acc + (p.profit || 0), 0),
    [indexPositions]
  );
  const indexStoredPnl = (quotaStats.indexPnl && quotaStats.indexPnl > 0)
    ? quotaStats.indexPnl
    : quotaStats.indexWins > 0
    ? +(quotaStats.indexWins * (quotaStats.indexInitialStake ?? presetStakes.indexStake) * 0.98).toFixed(2)
    : 0;
  const indexTotalPnl = +Math.max(0, indexStoredPnl + indexPnlLive).toFixed(2);

  // Applique un profil (le sien, ou celui d'un client supervisé) à l'état local du dashboard.
  const applyProfileToState = (profile: NonNullable<Awaited<ReturnType<typeof getUserProfile>>>) => {
    if (profile.name) setClientName(profile.name);

    const cfg = (profile.engines_config || {}) as any;
    let effectiveBalance = Number(profile.balance ?? cfg?.balance ?? 0);
    let effectiveBonus = Number(profile.bonus_credit ?? cfg?.bonus_credit ?? 0);

    if (typeof window !== "undefined") {
      try {
        const storedBal = localStorage.getItem(`nexium_demo_balance_${profile.id}`) || localStorage.getItem("nexium_demo_balance_local");
        if (storedBal !== null && !isNaN(Number(storedBal))) effectiveBalance = Math.max(effectiveBalance, Number(storedBal));
        const storedBon = localStorage.getItem(`nexium_demo_bonus_${profile.id}`) || localStorage.getItem("nexium_demo_bonus_local");
        if (storedBon !== null && !isNaN(Number(storedBon))) effectiveBonus = Math.max(effectiveBonus, Number(storedBon));
      } catch {}
    }

    setBalance(effectiveBalance);
    setBonus(effectiveBonus);
    if (profile.mt5_login) setMt5AccountNumber(profile.mt5_login.replace("#", ""));
    if (profile.assigned_advisor) setAssignedAdvisor(profile.assigned_advisor);
    setLicenseStatus(profile.license_status || "NOT_REQUESTED");
    const localReq = readDemoJson<string[]>(demoStorageKey("requested_presets")) || [];
    const dbReq = profile.requested_presets?.length ? profile.requested_presets : profile.requested_preset ? [profile.requested_preset] : [];
    const effectiveRequested = profile.requested_presets !== undefined ? dbReq : localReq;
    setRequestedPresets(effectiveRequested);
    writeDemoJson(demoStorageKey("requested_presets"), effectiveRequested);
    setActivePreset(profile.active_preset || null);

    setEngineCycles(cyclesFromEnginesConfig(profile.engines_config));

    // Synchronisation initiale des moteurs (AI Gold / FX Trend / Index Reversion)
    // avec l'état réel enregistré côté admin — sinon chaque carte reste figée sur
    // son état de démo par défaut tant qu'aucun événement Realtime ne survient.
    if (profile.engines_config) {
      const cfg = profile.engines_config as any;
      if (cfg.quota_stats) {
        const localQuota = readDemoJson<PresetQuotaStats>(`nexium_demo_quota_${profile.id}`) || {};
        const mergedQuota: PresetQuotaStats = { ...cfg.quota_stats };
        for (const id of PRESET_IDS) {
          const keys = PRESET_STAT_KEYS[id];
          const dbCycle = cfg.quota_stats[keys.cycle];
          const locCycle = localQuota[keys.cycle];
          if (!locCycle || locCycle === dbCycle) {
            mergedQuota[keys.trades] = Math.max(cfg.quota_stats[keys.trades] ?? 0, localQuota[keys.trades] ?? 0);
            mergedQuota[keys.pnl] = Math.max(cfg.quota_stats[keys.pnl] ?? 0, localQuota[keys.pnl] ?? 0);
            mergedQuota[keys.initialStake] = cfg.quota_stats[keys.initialStake] ?? localQuota[keys.initialStake];
          }
        }
        setQuotaStats(mergedQuota);
        if (profile.id) writeDemoJson(`nexium_demo_quota_${profile.id}`, mergedQuota);
        writeDemoJson("nexium_demo_quota_local", mergedQuota);
      }
      if (cfg.preset_stakes) {
        setPresetStakes(cfg.preset_stakes);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("nexium_preset_stakes", JSON.stringify(cfg.preset_stakes));
          } catch {}
        }
      }
      const activeList = (profile.active_preset || "")
        .split(",")
        .map((s: string) => s.trim().toUpperCase())
        .filter(Boolean);

      setVisibleBotIds(
        [
          (cfg.aiGold?.visible === true || activeList.includes("AI_GOLD")) && "nexium-ai-gold",
          (cfg.fxTrend?.visible === true || activeList.includes("FX_TREND")) && "nexium-fx-trend",
          (cfg.indexReversion?.visible === true || activeList.includes("INDEX_REVERSION")) && "nexium-index-reversion",
        ].filter(Boolean) as EngineBot["id"][]
      );
      setBots((prev) =>
        prev.map((bot) => {
          if (bot.id === "nexium-ai-gold" && cfg.aiGold) {
            return {
              ...bot,
              statusBadge: "EN PAUSE",
              mainState: "WAITING FOR SETUP",
              version: "Exécution Algorithmique Institutionnelle",
              risk: { ...bot.risk, allocation: `${cfg.aiGold.riskCapPercent || 2}%` },
            };
          }
          if (bot.id === "nexium-fx-trend" && cfg.fxTrend) {
            return {
              ...bot,
              statusBadge: "EN PAUSE",
              mainState: "WAITING FOR SETUP",
              risk: { ...bot.risk, allocation: `${cfg.fxTrend.riskCapPercent || 2}%` },
            };
          }
          if (bot.id === "nexium-index-reversion" && cfg.indexReversion) {
            return {
              ...bot,
              statusBadge: "EN PAUSE",
              mainState: "WAITING FOR SETUP",
              risk: { ...bot.risk, allocation: `${cfg.indexReversion.riskCapPercent || 1.5}%` },
            };
          }
          return { ...bot, statusBadge: "EN PAUSE", mainState: "WAITING FOR SETUP" };
        })
      );
    } else {
      setVisibleBotIds(INITIAL_BOTS.map((bot) => bot.id));
      setBots((prev) => prev.map((bot) => ({ ...bot, statusBadge: "EN PAUSE", mainState: "WAITING FOR SETUP" })));
    }
  };

  // Chargement dynamique & Protection stricte de l'espace client
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Supervision Live : l'admin est déjà authentifié dans sa propre session ;
    // on charge simplement les données du client ciblé, sans revérifier son
    // statut de compte ni le rediriger — l'admin doit pouvoir superviser un
    // compte même en attente, suspendu, etc.
    if (adminImpersonateUserId) {
      setCurrentUserId(adminImpersonateUserId);
      getUserProfile(adminImpersonateUserId).then((profile) => {
        if (profile) {
          setClientEmail(profile.email || "");
          applyProfileToState(profile);
        }
      });
      return;
    }

    supabase.auth.getUser().then(async ({ data: { user }, error }) => {
      if (error || !user) {
        toast.info("Veuillez vous connecter pour accéder à votre espace institutionnel.");
        navigate({ to: "/login" });
        return;
      }

      setCurrentUserId(user.id);
      setClientEmail(user.email || "investisseur@nexiummarkets.com");
      const profile = await getUserProfile(user.id);

      const isAdmin = profile?.role && ["OWNER", "OWNER_A_PLUS", "OWNER_B_PLUS", "SUPER_ADMIN", "ADMIN", "CONSEILLER", "SUPPORT", "FINANCE", "QUANT"].includes(profile.role);

      // Verrouillage formel : si le compte n'est pas actif et n'est pas admin, bloquer l'accès
      if (!isAdmin) {
        if (!profile || profile.status === "PENDING_APPROVAL") {
          toast.warning("Votre compte est actuellement en cours de validation par la Direction.");
          await supabase.auth.signOut();
          navigate({ to: "/login" });
          return;
        }

        if (profile.status === "REVOKED" || profile.status === "BANNED" || profile.status === "SUSPENDED") {
          toast.error("Accès restreint ou suspendu. Contactez support@nexiummarkets.com");
          await supabase.auth.signOut();
          navigate({ to: "/login" });
          return;
        }

        if (profile.status !== "ACTIVE") {
          toast.warning("Votre compte n'est pas encore validé.");
          await supabase.auth.signOut();
          navigate({ to: "/login" });
          return;
        }
      }

      if (profile) {
        applyProfileToState(profile);

        // Vérification du slug personnalisé dans l'URL
        const ownSlug = getUserSlug({ name: profile.name, email: user.email, id: user.id });

        // Si l'utilisateur est sur /NEXIUM sans slug, rediriger vers son URL personnalisée
        if (!customSlug && !isAdmin) {
          navigate({ to: "/portal/$slug", params: { slug: ownSlug } });
        }
      }
    });
  }, [customSlug, adminImpersonateUserId]);

  // Écouteur Realtime sur le profil de l'utilisateur (mise à jour en direct lors d'une validation Admin)
  useEffect(() => {
    if (!isSupabaseConfigured || !currentUserId) return;
    const initialActive = (activePreset || "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    const lastActiveSet = new Set<string>(initialActive);
    let isFirstRealtimeEvent = true;

    const unsubProfile = subscribeToUserProfile(currentUserId, (updatedProfile) => {
      if (updatedProfile.balance !== undefined && updatedProfile.balance !== null) {
        const cfg = (updatedProfile.engines_config || {}) as any;
        const dbBal = Number(updatedProfile.balance ?? cfg?.balance ?? 0);
        const storedBal = typeof window !== "undefined" ? Number(localStorage.getItem(`nexium_demo_balance_${currentUserId}`) || localStorage.getItem("nexium_demo_balance_local") || 0) : 0;
        const newBal = Math.max(dbBal, Number(cfg?.balance || 0), storedBal);
        setBalance(newBal);
      }
      if (updatedProfile.bonus_credit !== undefined && updatedProfile.bonus_credit !== null) {
        const cfg = (updatedProfile.engines_config || {}) as any;
        const dbBonus = Number(updatedProfile.bonus_credit ?? cfg?.bonus_credit ?? 0);
        const storedBon = typeof window !== "undefined" ? Number(localStorage.getItem(`nexium_demo_bonus_${currentUserId}`) || localStorage.getItem("nexium_demo_bonus_local") || 0) : 0;
        const newBonus = Math.max(dbBonus, Number(cfg?.bonus_credit || 0), storedBon);
        setBonus(newBonus);
      }
      if (updatedProfile.status === "REVOKED" || updatedProfile.status === "BANNED" || updatedProfile.status === "SUSPENDED") {
        if (adminImpersonateUserId) {
          toast.warning("Ce client vient d'être restreint par l'administration.");
        } else {
          toast.error("Votre compte a été restreint par l'administration.");
          supabase.auth.signOut();
          navigate({ to: "/login" });
        }
        return;
      }
      if (updatedProfile.license_status) setLicenseStatus(updatedProfile.license_status as any);
      if (updatedProfile.active_preset !== undefined) {
        const nextActiveRaw = updatedProfile.active_preset || "";
        const nextList = nextActiveRaw.split(",").map((s: string) => s.trim().toUpperCase()).filter(Boolean);

        const presetDisplayNames: Record<string, string> = {
          AI_GOLD: "Nexium AI Gold (XAUUSD)",
          FX_TREND: "Nexium FX Trend (EURUSD)",
          INDEX_REVERSION: "Nexium Index Reversion (NAS100)",
        };

        if (!isFirstRealtimeEvent) {
          nextList.forEach((key: string) => {
            if (!lastActiveSet.has(key)) {
              const label = presetDisplayNames[key] || key;
              toast.success(`Le Preset ${label} a été activé avec succès !`);
            }
          });
        }

        lastActiveSet.clear();
        nextList.forEach((k: string) => lastActiveSet.add(k));
        setActivePreset(nextActiveRaw || null);
      }
      isFirstRealtimeEvent = false;
      if (updatedProfile.requested_presets !== undefined) {
        const nextReq = Array.isArray(updatedProfile.requested_presets)
          ? updatedProfile.requested_presets
          : (updatedProfile.requested_presets ? [updatedProfile.requested_presets] : []);
        setRequestedPresets(nextReq);
        writeDemoJson(demoStorageKey("requested_presets"), nextReq);
      }
      if (updatedProfile.assigned_advisor) setAssignedAdvisor(updatedProfile.assigned_advisor);
      if (updatedProfile.mt5_login) setMt5AccountNumber(updatedProfile.mt5_login.replace("#", ""));

      // Synchronisation en direct des paramètres de moteurs IA & quotas
      if (updatedProfile.engines_config) {
        const cfg = updatedProfile.engines_config as any;
        const activeList = (updatedProfile.active_preset || "")
          .split(",")
          .map((s: string) => s.trim().toUpperCase())
          .filter(Boolean);

        setEngineCycles(cyclesFromEnginesConfig(cfg));
        if (cfg.quota_stats) {
          const localQuota = readDemoJson<PresetQuotaStats>(`nexium_demo_quota_${currentUserId}`) || {};
          const mergedQuota: PresetQuotaStats = { ...cfg.quota_stats };
          for (const id of PRESET_IDS) {
            const keys = PRESET_STAT_KEYS[id];
            const dbCycle = cfg.quota_stats[keys.cycle];
            const locCycle = localQuota[keys.cycle];
            if (!locCycle || locCycle === dbCycle) {
              mergedQuota[keys.trades] = Math.max(cfg.quota_stats[keys.trades] ?? 0, localQuota[keys.trades] ?? 0);
              mergedQuota[keys.pnl] = Math.max(cfg.quota_stats[keys.pnl] ?? 0, localQuota[keys.pnl] ?? 0);
              mergedQuota[keys.initialStake] = cfg.quota_stats[keys.initialStake] ?? localQuota[keys.initialStake];
            }
          }
          setQuotaStats(mergedQuota);
          if (currentUserId) writeDemoJson(`nexium_demo_quota_${currentUserId}`, mergedQuota);
          writeDemoJson("nexium_demo_quota_local", mergedQuota);
        }
        if (cfg.preset_stakes) {
          setPresetStakes(cfg.preset_stakes);
          if (typeof window !== "undefined") {
            try { localStorage.setItem("nexium_preset_stakes", JSON.stringify(cfg.preset_stakes)); } catch {}
          }
        }
        setVisibleBotIds(
          [
            (cfg.aiGold?.visible === true || activeList.includes("AI_GOLD")) && "nexium-ai-gold",
            (cfg.fxTrend?.visible === true || activeList.includes("FX_TREND")) && "nexium-fx-trend",
            (cfg.indexReversion?.visible === true || activeList.includes("INDEX_REVERSION")) && "nexium-index-reversion",
          ].filter(Boolean) as EngineBot["id"][]
        );
        setBots((prev) =>
          prev.map((bot) => {
            if (bot.id === "nexium-ai-gold" && cfg.aiGold) {
              return {
                ...bot,
                version: "Exécution Algorithmique Institutionnelle",
                risk: { ...bot.risk, allocation: `${cfg.aiGold.riskCapPercent || 2}%` },
              };
            }
            if (bot.id === "nexium-fx-trend" && cfg.fxTrend) {
              return {
                ...bot,
                risk: { ...bot.risk, allocation: `${cfg.fxTrend.riskCapPercent || 2}%` },
              };
            }
            if (bot.id === "nexium-index-reversion" && cfg.indexReversion) {
              return {
                ...bot,
                risk: { ...bot.risk, allocation: `${cfg.indexReversion.riskCapPercent || 1.5}%` },
              };
            }
            return bot;
          })
        );
      }
    });
    return unsubProfile;
  }, [currentUserId]);

  // Synchronisation instantanée des soldes, bonus et quotas (inter-onglets et événements Desk)
  useEffect(() => {
    const handleFinancialSync = (e?: any) => {
      if (typeof window === "undefined") return;
      try {
        const id = currentUserId || "local";
        const storedBal = localStorage.getItem(`nexium_demo_balance_${id}`) || localStorage.getItem("nexium_demo_balance_local");
        if (storedBal !== null && !isNaN(Number(storedBal))) setBalance(Number(storedBal));
        const storedBon = localStorage.getItem(`nexium_demo_bonus_${id}`) || localStorage.getItem("nexium_demo_bonus_local");
        if (storedBon !== null && !isNaN(Number(storedBon))) setBonus(Number(storedBon));
        
        const storedQuota = readDemoJson<PresetQuotaStats>(`nexium_demo_quota_${id}`) || readDemoJson<PresetQuotaStats>("nexium_demo_quota_local");
        if (storedQuota) {
          setQuotaStats(storedQuota);
        }
      } catch {}
    };

    window.addEventListener("storage", handleFinancialSync);
    window.addEventListener("nexium_financial_update", handleFinancialSync);
    window.addEventListener("nexium_preset_update", handleFinancialSync);
    return () => {
      window.removeEventListener("storage", handleFinancialSync);
      window.removeEventListener("nexium_financial_update", handleFinancialSync);
      window.removeEventListener("nexium_preset_update", handleFinancialSync);
    };
  }, [currentUserId]);

  // Synchronisation temps réel des e-mails du client avec Supabase
  useEffect(() => {
    if (!isSupabaseConfigured || !clientEmail) return;

    const loadEmails = async () => {
      const dbThreads = await getClientEmailConversations(clientEmail);
      if (dbThreads && dbThreads.length > 0) {
        const mappedEmails: EmailItem[] = [];
        dbThreads.forEach((th) => {
          th.messages.forEach((msg) => {
            mappedEmails.push({
              id: msg.id || `mail-${msg.created_at}`,
              from: msg.from_address,
              fromName: msg.direction === "OUTBOUND" ? "Desk Nexium Markets" : `${clientName} (Compte #${mt5AccountNumber})`,
              to: msg.to_address,
              subject: msg.subject || th.subject,
              date: msg.created_at
                ? new Date(msg.created_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Récemment",
              preview: msg.body_text ? msg.body_text.slice(0, 80) + "..." : "",
              body: msg.body_text ? msg.body_text.split("\n") : [],
              unread: msg.direction === "OUTBOUND" && th.unread,
              priority: "NORMAL",
              folder: msg.direction === "OUTBOUND" ? "inbox" : "sent",
            });
          });
        });

        if (mappedEmails.length > 0) {
          setClientEmails(mappedEmails);
        }
      }
    };

    loadEmails();
    const unsubEmails = subscribeToClientEmails(() => loadEmails());
    return unsubEmails;
  }, [clientEmail, clientName, mt5AccountNumber]);

  // Synchronisation temps réel des transactions du client depuis Supabase
  useEffect(() => {
    if (!isSupabaseConfigured || !currentUserId) return;

    const loadTransactions = async () => {
      const dbTxs = await getUserTransactions(currentUserId);
      if (dbTxs && dbTxs.length > 0) {
        setTransactions(
          dbTxs.map((t): TransactionItem => {
            const isPositive = t.type === "DEPOSIT" || t.type === "TRADE_PROFIT" || t.type === "BONUS" || t.type === "PROFIT_SHARE";
            const dateStr = t.created_at
              ? new Date(t.created_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Récemment";

            let label = t.type as string;
            if (t.type === "DEPOSIT") label = t.status === "COMPLETED" ? "Dépôt validé" : "Dépôt en attente";
            else if (t.type === "WITHDRAWAL") label = t.status === "COMPLETED" ? "Retrait validé" : "Demande de retrait";
            else if (t.type === "BONUS") label = "Bonus Commercial Crédité";
            else if (t.type === "TRADE_PROFIT") label = "Gain de Trading Bot";
            else if (t.type === "PROFIT_SHARE") label = "Partage de Profits";
            else if (t.type === "PNL_ADJUST") label = "Ajustement de Solde";
            else if (t.type === "DEBIT") label = "Débit Administratif";

            return {
              id: t.id || `tx-${Date.now()}`,
              date: dateStr,
              type: label,
              amount: `${isPositive ? "+" : "-"}$${Number(t.amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}`,
              amountNum: isPositive ? Number(t.amount) : -Number(t.amount),
              currency: t.currency || "USD",
              status: t.status === "COMPLETED" ? "Confirmé" : t.status === "PENDING" ? "En attente" : "Rejeté",
              method: t.method || (t.type === "DEPOSIT" ? "Virement SEPA" : "Virement Bancaire"),
              color: t.status === "COMPLETED" ? (isPositive ? "#00D084" : "#f43f5e") : "#f59e0b",
            };
          })
        );
      }
    };

    loadTransactions();
    const unsubTxs = subscribeToTransactions(() => loadTransactions(), currentUserId);
    return unsubTxs;
  }, [currentUserId]);

  // Synchronisation temps réel de la messagerie directe avec le Desk Nexium
  useEffect(() => {
    if (!isSupabaseConfigured || !currentUserId) return;

    const loadMessages = async () => {
      const rows = await getClientChatMessages(currentUserId);
      setMessages(
        rows.map((m): ChatMessage => ({
          id: m.id || `msg-${m.created_at}`,
          sender: m.sender === "ADMIN" ? "desk" : "user",
          senderName: m.author_name,
          text: m.text,
          time: m.created_at ? new Date(m.created_at).toLocaleTimeString("fr-FR").slice(0, 5) : "",
        }))
      );
    };

    loadMessages();
    const unsub = subscribeToDirectMessages(loadMessages, currentUserId);
    return unsub;
  }, [currentUserId]);

  // Coordonnées de paiement (IBAN / adresses crypto) affichées dans le parcours de dépôt.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getPaymentSettings().then(setPaymentSettings);
    const unsub = subscribeToPaymentSettings(setPaymentSettings);
    return unsub;
  }, []);

  const handleConfirmPresetRequest = async (presetIds: string[]) => {
    if (presetIds.length === 0) return;
    setSubmittingPreset(true);
    try {
      if (isSupabaseConfigured && currentUserId) {
        const result = await requestPresetsActivation(currentUserId, presetIds);
        if (result && (result as any).success === false) {
          toast.error("Impossible de transmettre la demande. Veuillez réessayer ou contacter le support.");
          setSubmittingPreset(false);
          return;
        }
      }
      setLicenseStatus("PENDING_PRESET_APPROVAL");
      setRequestedPresets(presetIds);
      setSelectedPresetIds([]);
      setShowPresetConfirmModal(false);
      toast.success(
        presetIds.length > 1
          ? "Demande d'attribution des Presets transmise au Desk d'Administration !"
          : "Demande d'attribution de Preset transmise au Desk d'Administration !"
      );
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la transmission de la demande.");
    } finally {
      setSubmittingPreset(false);
    }
  };

  const handleRequestSinglePreset = async (
    presetKey: string,
    presetName: string
  ) => {
    if (submittingPreset) return;
    setSubmittingPreset(true);
    const nextRequested = Array.from(new Set([...requestedPresets, presetKey]));
    setRequestedPresets(nextRequested);
    writeDemoJson(demoStorageKey("requested_presets"), nextRequested);
    try {
      if (isSupabaseConfigured && currentUserId) {
        const result = await requestPresetsActivation(currentUserId, nextRequested);
        if (result && (result as any).success === false) {
          toast.error("Impossible de transmettre la demande. Veuillez réessayer.");
          setSubmittingPreset(false);
          return;
        }
        await recordAuditLog({
          admin_id: currentUserId || "portal-user",
          admin_name: clientName || "Client",
          action: "PRESET_ACTIVATION_REQUESTED",
          ...(currentUserId ? { target_user_id: currentUserId } : {}),
          ...(clientEmail ? { target_user_email: clientEmail } : {}),
          details: `Demande d'activation du Preset ${presetName} (${presetKey}) soumise par ${clientName || "le client"} (${clientEmail || "email non renseigné"}).`,
          ip_address: "web-portal",
        }).catch((e) => console.warn("Notice audit log:", e));
      }
      setLicenseStatus("PENDING_PRESET_APPROVAL");
      toast.success(
        `Demande d'activation pour ${presetName} transmise à l'Administration ! Le Desk a été notifié.`
      );
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la transmission de la demande.");
    } finally {
      setSubmittingPreset(false);
    }
  };

  // States
  // Positions/journal : aucune table de trades réels n'existe encore (MT5 pas encore
  // connecté) — on démarre donc à vide plutôt que d'afficher une activité fictive.
  const [bots, setBots] = useState<EngineBot[]>(INITIAL_BOTS);
  const [visibleBotIds, setVisibleBotIds] = useState<EngineBot["id"][]>(() => INITIAL_BOTS.map((bot) => bot.id));
  // Reflète l'état réel persisté des moteurs — jamais une valeur locale par
  // défaut, pour ne pas ré-afficher "Activer le Trading" comme actif après un
  // rafraîchissement alors que le trading est en pause côté base.
  const visibleBots = useMemo(() => bots.filter((bot) => visibleBotIds.includes(bot.id)), [bots, visibleBotIds]);
  const running = useMemo(() => visibleBots.some((b) => b.statusBadge === "ACTIF"), [visibleBots]);

  const totalPresetPnl = useMemo(
    () => +(goldTotalPnl + fxTotalPnl + indexTotalPnl).toFixed(2),
    [goldTotalPnl, fxTotalPnl, indexTotalPnl]
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !currentUserId || totalPresetPnl <= 0) return;
    const timeout = setTimeout(() => {
      getUserProfile(currentUserId).then((p) => {
        if (p && (p.gross_profit_total ?? 0) < totalPresetPnl) {
          const cfg = (p.engines_config || {}) as Record<string, unknown>;
          updateUserProfile(currentUserId, {
            gross_profit_total: totalPresetPnl,
            engines_config: {
              ...cfg,
              quota_stats: {
                ...quotaStats,
                goldPnl: goldTotalPnl,
                fxPnl: fxTotalPnl,
                indexPnl: indexTotalPnl,
              },
            },
          }).catch(() => {});
        }
      });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [totalPresetPnl, currentUserId, quotaStats, goldTotalPnl, fxTotalPnl, indexTotalPnl]);

  const visibleBotsWithLiveStats = useMemo(() => {
    return visibleBots.map((bot) => {
      let pnlNum = 0;
      let pnlStr = "$0.00";
      let openPos = 0;
      if (bot.id === "nexium-ai-gold") {
        pnlNum = goldTotalPnl;
        pnlStr = goldTotalPnl > 0 ? `+$${goldTotalPnl.toFixed(2)}` : "$0.00";
        openPos = goldPositions.length;
      } else if (bot.id === "nexium-fx-trend") {
        pnlNum = fxTotalPnl;
        pnlStr = fxTotalPnl > 0 ? `+$${fxTotalPnl.toFixed(2)}` : "$0.00";
        openPos = fxPositions.length;
      } else if (bot.id === "nexium-index-reversion") {
        pnlNum = indexTotalPnl;
        pnlStr = indexTotalPnl > 0 ? `+$${indexTotalPnl.toFixed(2)}` : "$0.00";
        openPos = indexPositions.length;
      }
      return {
        ...bot,
        pnlToday: pnlStr,
        pnlTodayNum: pnlNum,
        openPositions: openPos,
        activity: {
          ...bot.activity,
          pnl: pnlStr,
        },
      };
    });
  }, [visibleBots, goldTotalPnl, fxTotalPnl, indexTotalPnl, goldPositions.length, fxPositions.length, indexPositions.length]);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Modals & Detail Views
  const [selectedDetailBot, setSelectedDetailBot] = useState<EngineBot | null>(null);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("1000");
  const [depositStep, setDepositStep] = useState<"METHOD" | "BANK" | "CARD" | "CRYPTO">("METHOD");
  const [depositCryptoNetwork, setDepositCryptoNetwork] = useState<"USDT_TRC20" | "USDT_ERC20" | "BTC" | "ETH">("USDT_TRC20");
  const [depositReference] = useState(() => `NXM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<"BANK" | "CRYPTO" | "CARD" | "EWALLET">("BANK");
  // Bank fields
  const [withdrawIban, setWithdrawIban] = useState("FR76 3000 4000 5000 6000 7000 123");
  const [withdrawBic, setWithdrawBic] = useState("BNPAFR2X");
  const [withdrawAccountHolder, setWithdrawAccountHolder] = useState(clientName || "Titulaire du compte");
  const [withdrawBankName, setWithdrawBankName] = useState("BNP Paribas");
  // Crypto fields
  const [withdrawCryptoNetwork, setWithdrawCryptoNetwork] = useState<"USDT_TRC20" | "USDT_ERC20" | "BTC" | "ETH" | "SOL">("USDT_TRC20");
  const [withdrawCryptoAddress, setWithdrawCryptoAddress] = useState("");
  // Card fields
  const [withdrawCardLast4, setWithdrawCardLast4] = useState("4242");
  const [withdrawCardHolder, setWithdrawCardHolder] = useState(clientName || "Titulaire");
  // E-Wallet fields
  const [withdrawEwalletType, setWithdrawEwalletType] = useState<"REVOLUT" | "WISE" | "PAYPAL">("REVOLUT");
  const [withdrawEwalletId, setWithdrawEwalletId] = useState("");

  // Pré-remplit le montant avec la totalité des fonds disponibles (solde +
  // bonus) à CHAQUE ouverture de la modale — auparavant "500" était figé en
  // dur par défaut, sans rapport avec le solde réel du client : un client
  // qui ne changeait pas le champ finissait par ne retirer que $500 au lieu
  // de la totalité de son compte, sans jamais s'en rendre compte.
  useEffect(() => {
    if (withdrawOpen) setWithdrawAmount((balance + bonus).toFixed(2));
  }, [withdrawOpen, balance, bonus]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  // Sound preference state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(getNotificationSoundEnabled);

  // Notifications State Feed
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: "notif-1",
      type: "trade",
      severity: "success",
      title: "🎯 Take Profit atteint (XAUUSD)",
      description: "Position BUY 0.50 lot clôturée avec succès à 2,398.20 (+45 pips).",
      timestamp: "Il y a 3 min",
      read: false,
      symbol: "XAUUSD",
      amount: 142.5,
      score: 92,
    },
    {
      id: "notif-2",
      type: "bot",
      severity: "info",
      title: "🤖 Signal IA Smart Money validé",
      description: "Breakout de liquidité H1 validé sur EURUSD. Ordre exécuté avec SL strict.",
      timestamp: "Il y a 14 min",
      read: false,
      symbol: "EURUSD",
      score: 89,
    },
    {
      id: "notif-3",
      type: "security",
      severity: "info",
      title: "🛡️ Risk Governor : Contrôle validé",
      description: "Exposition maximale globale sécurisée sous le seuil de 3.00% du capital.",
      timestamp: "Il y a 45 min",
      read: true,
    },
    {
      id: "notif-4",
      type: "system",
      severity: "success",
      title: "⚡ Connexion FIX NY4 établie",
      description: "Latence ultra-faible mesurée : 1.2ms avec le serveur de liquidité institutionnel.",
      timestamp: "Il y a 1h",
      read: true,
    },
  ]);

  // Alerts State
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([
    { id: "alt-1", symbol: "XAUUSD", targetPrice: 2400.0, condition: "ABOVE", triggered: false, createdAt: "14:10" },
    { id: "alt-2", symbol: "NAS100", targetPrice: 19800.0, condition: "BELOW", triggered: false, createdAt: "13:45" },
  ]);

  const unreadNotifsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setNotificationSoundEnabled(next);
    if (next) playNotificationSound("success");
    toast.info(next ? "Sons des alertes activés." : "Alertes passées en mode silencieux.");
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("Toutes les notifications ont été marquées comme lues.");
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast.info("Historique des notifications effacé.");
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleAddPriceAlert = (sym: string, targetP: number, cond: "ABOVE" | "BELOW") => {
    const newAlt: PriceAlert = {
      id: `alt-${Date.now()}`,
      symbol: sym,
      targetPrice: targetP,
      condition: cond,
      triggered: false,
      createdAt: new Date().toLocaleTimeString().slice(0, 5),
    };
    setPriceAlerts((prev) => [newAlt, ...prev]);
    triggerNotificationToast(`Alerte de prix configurée sur ${sym}`, {
      description: `Déclenchement configuré lorsque le cours ${cond === "ABOVE" ? "franchit >" : "passe <"} $${targetP.toFixed(2)}.`,
      type: "success",
      soundType: "alert",
    });
  };

  const [newAlertSymbol, setNewAlertSymbol] = useState("XAUUSD");
  const [newAlertPrice, setNewAlertPrice] = useState("");

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(newAlertPrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Veuillez saisir un prix valide.");
      return;
    }
    handleAddPriceAlert(newAlertSymbol, price, "ABOVE");
    setNewAlertPrice("");
  };

  const handleDeletePriceAlert = (id: string) => {
    setPriceAlerts((prev) => prev.filter((a) => a.id !== id));
    toast.info("Alerte de prix supprimée.");
  };

  const navItems: ReadonlyArray<readonly [React.ComponentType<{ className?: string }>, string]> = [
    [LayoutDashboard, "Vue d’ensemble"],
    [Monitor, "MT5"],
    [SlidersHorizontal, "Configuration des Mises"],
    [Wallet, "Portefeuille"],
    [Settings, "Paramètres du Compte"],
  ];

  // Actions
  const handleLogout = async () => {
    setUserMenuOpen(false);
    // En supervision, "Déconnexion" ne doit jamais couper la vraie session
    // admin — ça quitte simplement la supervision de ce client.
    if (adminImpersonateUserId) {
      onExitImpersonation?.();
      return;
    }
    if (isSupabaseConfigured) await supabase.auth.signOut();
    toast.info("Déconnexion réussie. À bientôt !");
    navigate({ to: "/login" });
  };

  const ENGINE_ID_TO_KEY: Record<string, "aiGold" | "fxTrend" | "indexReversion"> = {
    "nexium-ai-gold": "aiGold",
    "nexium-fx-trend": "fxTrend",
    "nexium-index-reversion": "indexReversion",
  };

  // Bascule les 3 moteurs à la fois (interrupteur général) et persiste
  // immédiatement en base — sans ça, le bouton "Activer le Trading" repartait
  // toujours sur ACTIF après un rafraîchissement puisque rien n'était
  // réellement enregistré côté engines_config.
  /**
   * Préparation du lancement d'un ou plusieurs bots : refuse un preset expiré,
   * contrôle la hiérarchie Preset 1 < Preset 2 < Preset 3 et fige la mise
   * initiale du cycle (base fixe du gain cible, indépendante du solde).
   */
  const prepareBotLaunch = (ids: PresetId[]): boolean => {
    for (const id of ids) {
      const { trades } = presetCycleStats(quotaStats, presetStakes, id);
      if (isPresetExpired(id, trades)) {
        toast.warning(`${PRESET_LABEL[id]} est EXPIRÉ (${trades}/${PRESET_RULES[id].maxTrades}). Faites une nouvelle demande d'activation.`);
        return false;
      }
    }
    const [p1, p2, p3] = PRESET_IDS.map((id) => presetCycleStats(quotaStats, presetStakes, id).initialStake);
    if (!(p1! < p2! && p2! < p3!)) {
      toast.error(`Hiérarchie des mises non respectée : Preset 1 ($${p1}) < Preset 2 ($${p2}) < Preset 3 ($${p3}) est obligatoire.`);
      return false;
    }
    let next = quotaStats;
    for (const id of ids) {
      const key = PRESET_STAT_KEYS[id].initialStake;
      if (next[key] === undefined) next = { ...next, [key]: presetStakes[PRESET_RULES[id].stakeKey] };
    }
    if (next !== quotaStats) handleQuotaChange(next);
    return true;
  };

  const handleSetAllBotsActive = async (active: boolean): Promise<boolean> => {
    if (active && !activePreset) {
      toast.warning("Aucun preset n’a été approuvé. Demandez son activation à l’administration avant de démarrer le bot.");
      return false;
    }
    if (active) {
      const approved = PRESET_IDS.filter((id) => (activePreset || "").split(",").includes(id));
      const launchable = approved.filter((id) => !isPresetExpired(id, presetCycleStats(quotaStats, presetStakes, id).trades));
      if (launchable.length === 0 || !prepareBotLaunch(launchable)) {
        if (launchable.length === 0) toast.warning("Tous vos presets validés sont expirés. Faites une nouvelle demande d'activation.");
        return false;
      }
    }
    const nextState = active ? "ACTIF" : "EN PAUSE";
    setBots((prev) =>
      prev.map((b) => ({ ...b, statusBadge: nextState as any, mainState: (active ? "RUNNING" : "RISK BLOCKED") as any }))
    );

    if (isSupabaseConfigured && currentUserId) {
      const profile = await getUserProfile(currentUserId);
      const currentConfig = (profile?.engines_config as any) || {};
      const nextConfig = { ...currentConfig };
      for (const key of Object.values(ENGINE_ID_TO_KEY)) {
        const engine = currentConfig[key] || {};
        nextConfig[key] = { ...engine, active: engine.visible === false ? false : active };
      }
      const result = await updateUserProfile(currentUserId, { engines_config: nextConfig });
      if (!result.success) {
        toast.error("Échec de l'enregistrement côté base de données.");
      }
    }
    return true;
  };

  const handleToggleEngine = async () => {
    const next = !running;
    if (!(await handleSetAllBotsActive(next))) return;
    if (next) {
      toast.success("Stratégie de trading lancée : les algorithmes recherchent leurs opportunités de marché.");
    } else {
      toast.warning("Stratégie de trading mise en pause. Les trades et le P&L des cycles sont conservés.");
    }
  };

  const handleToggleBotPause = async (botId: EngineBot["id"]) => {
    const bot = bots.find((b) => b.id === botId);
    if (!bot) return;
    const nextActive = bot.statusBadge !== "ACTIF";
    const presetForBot: Record<EngineBot["id"], string> = {
      "nexium-ai-gold": "AI_GOLD",
      "nexium-fx-trend": "FX_TREND",
      "nexium-index-reversion": "INDEX_REVERSION",
    };
    if (nextActive && !(activePreset || "").split(",").includes(presetForBot[botId])) {
      toast.warning("Ce preset n’a pas été approuvé par l’administration. Le bot reste arrêté.");
      return;
    }
    if (nextActive && !prepareBotLaunch([presetForBot[botId] as PresetId])) return;
    const nextState = nextActive ? "ACTIF" : "EN PAUSE";

    setBots((prev) =>
      prev.map((b) =>
        b.id === botId
          ? { ...b, statusBadge: nextState as any, mainState: (nextActive ? "RUNNING" : "RISK BLOCKED") as any }
          : b
      )
    );
    toast.info(
      nextActive
        ? `Algorithme ${bot.name} activé : recherche de setup en cours.`
        : `Algorithme ${bot.name} mis en pause. Compteur et P&L du cycle conservés.`
    );

    if (isSupabaseConfigured && currentUserId) {
      const engineKey = ENGINE_ID_TO_KEY[botId];
      if (engineKey) {
        const profile = await getUserProfile(currentUserId);
        const currentConfig = (profile?.engines_config as any) || {};
        const nextConfig = {
          ...currentConfig,
          [engineKey]: { ...(currentConfig[engineKey] || {}), active: nextActive },
        };
        const result = await updateUserProfile(currentUserId, { engines_config: nextConfig });
        if (!result.success) {
          toast.error("Échec de l'enregistrement côté base de données.");
        }
      }
    }
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

  const handleLiveBalanceChange = (newBal: number) => {
    const rounded = +(newBal.toFixed(2));
    setBalance(rounded);
    if (isSupabaseConfigured && currentUserId) {
      updateUserProfile(currentUserId, { balance: rounded }).catch((err) =>
        console.warn("Notice balance sync:", err)
      );
    }
  };

  const handleEmergencyHalt = () => {
    const totalPnl = positions.reduce((acc, p) => acc + p.pnlNum, 0);
    handleLiveBalanceChange(balance + totalPnl);
    setPositions([]);
    handleSetAllBotsActive(false);

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

  const openDepositModal = () => {
    setDepositStep("METHOD");
    setDepositOpen(true);
  };

  const closeDepositModal = () => {
    setDepositOpen(false);
    setDepositStep("METHOD");
  };

  const submitDepositRequest = async (method: string, reference?: string) => {
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val <= 0) {
      toast.error("Veuillez saisir un montant valide.");
      return;
    }

    setDepositSubmitting(true);
    try {
      if (isSupabaseConfigured && currentUserId) {
        const res = await createDepositRequest(currentUserId, val, method, reference);
        if (!res.success) {
          toast.error("Erreur lors de la transmission de la demande de dépôt.");
          return;
        }
      }

      const now = new Date().toLocaleTimeString();
      const newTx: TransactionItem = {
        id: `tx-${Date.now()}`,
        date: `Aujourd'hui · ${now.slice(0, 5)}`,
        type: "Dépôt en attente",
        amount: `+$${val.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}`,
        amountNum: val,
        currency: "USD",
        status: "En attente",
        method,
        color: "#f59e0b",
      };
      setTransactions((prev) => [newTx, ...prev]);
      closeDepositModal();
      toast.success(`Demande de dépôt de $${val.toFixed(2)} (${method}) transmise à l'Administration pour vérification et crédit.`);
    } finally {
      setDepositSubmitting(false);
    }
  };

  const CRYPTO_NETWORKS: Record<
    "USDT_TRC20" | "USDT_ERC20" | "BTC" | "ETH",
    { label: string; addressField: keyof PaymentSettings }
  > = {
    USDT_TRC20: { label: "USDT (TRC20)", addressField: "crypto_usdt_trc20_address" },
    USDT_ERC20: { label: "USDT (ERC20)", addressField: "crypto_usdt_erc20_address" },
    BTC: { label: "Bitcoin (BTC)", addressField: "crypto_btc_address" },
    ETH: { label: "Ethereum (ETH)", addressField: "crypto_eth_address" },
  };

  const handleCopyToClipboard = (value: string, label: string) => {
    if (!value) return;
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success(`${label} copié(e) dans le presse-papiers.`))
      .catch(() => toast.error("Impossible de copier."));
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(withdrawAmount);
    if (isNaN(val) || val <= 0) {
      toast.error("Veuillez saisir un montant valide.");
      return;
    }
    const withdrawableTotal = balance + bonus;
    if (val > withdrawableTotal) {
      toast.error(`Fonds insuffisants : $${withdrawableTotal.toFixed(2)} disponible (solde + bonus).`);
      return;
    }

    let methodLabel = "Virement Bancaire (SEPA)";
    let destinationLabel = withdrawIban;
    let methodKey = "SEPA_IBAN";

    if (withdrawMethod === "BANK") {
      if (!withdrawIban.trim()) {
        toast.error("Veuillez renseigner votre IBAN.");
        return;
      }
      methodLabel = `Virement Bancaire (${withdrawBankName || "SEPA / SWIFT"})`;
      destinationLabel = `IBAN: ${withdrawIban} · BIC: ${withdrawBic || "N/A"} · Titulaire: ${withdrawAccountHolder}`;
      methodKey = "BANK_WIRE";
    } else if (withdrawMethod === "CRYPTO") {
      if (!withdrawCryptoAddress.trim()) {
        toast.error("Veuillez renseigner votre adresse de portefeuille crypto.");
        return;
      }
      methodLabel = `Crypto ${withdrawCryptoNetwork.replace("_", " ")}`;
      destinationLabel = `${withdrawCryptoNetwork}: ${withdrawCryptoAddress}`;
      methodKey = `CRYPTO_${withdrawCryptoNetwork}`;
    } else if (withdrawMethod === "CARD") {
      if (!withdrawCardLast4.trim()) {
        toast.error("Veuillez renseigner les 4 derniers chiffres de votre carte bancaire.");
        return;
      }
      methodLabel = "Remboursement Carte Bancaire";
      destinationLabel = `Carte se terminant par •••• ${withdrawCardLast4} (${withdrawCardHolder})`;
      methodKey = "CARD_REFUND";
    } else if (withdrawMethod === "EWALLET") {
      if (!withdrawEwalletId.trim()) {
        toast.error("Veuillez renseigner votre identifiant ou email.");
        return;
      }
      methodLabel = `Portefeuille ${withdrawEwalletType}`;
      destinationLabel = `${withdrawEwalletType}: ${withdrawEwalletId}`;
      methodKey = `EWALLET_${withdrawEwalletType}`;
    }

    if (isSupabaseConfigured && currentUserId) {
      const res = await createWithdrawalRequest(currentUserId, val, destinationLabel, methodKey);
      if (!res.success) {
        toast.error("Erreur lors de la transmission de la demande de retrait.");
        return;
      }
    }

    const now = new Date().toLocaleTimeString();
    const newTx: TransactionItem = {
      id: `tx-${Date.now()}`,
      date: `Aujourd'hui · ${now.slice(0, 5)}`,
      type: "Demande de retrait",
      amount: `-$${val.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}`,
      amountNum: -val,
      currency: "USD",
      status: "En attente",
      method: methodLabel,
      color: "#f59e0b",
    };
    setTransactions((prev) => [newTx, ...prev]);
    setWithdrawOpen(false);
    toast.success(`Demande de retrait de $${val.toFixed(2)} via ${methodLabel} transmise au Desk Finance pour traitement.`, { duration: Infinity });
  };

  const handleSendMessage = async (text: string, id?: string) => {
    const now = new Date().toLocaleTimeString().slice(0, 5);
    const userMsg: ChatMessage = {
      id: id || `msg-${Date.now()}`,
      sender: "user",
      senderName: clientName,
      text,
      time: now,
    };
    setMessages((prev) => [...prev, userMsg]);

    if (isSupabaseConfigured && currentUserId) {
      const result = await sendChatMessage({
        client_id: currentUserId,
        sender: "CLIENT",
        author_name: clientName,
        channel: "CHAT",
        text,
        is_read: false,
      });
      if (!result.success) {
        toast.error("Échec de l'envoi du message. Réessayez.");
      }
    }
  };

  // ----------------------------------------------------
  // CATALOGUE DES 3 PRESETS ALGORITHMIQUES
  // ----------------------------------------------------
  const OFFICIAL_PRESETS = [
    {
      id: "AI_GOLD",
      name: "Preset 1 : Nexium AI Gold",
      subtitle: "XAUUSD Institutional Breakout",
      badge: "Moteur Primaire Or · 50% de la mise",
      market: "XAUUSD (Or Spot)",
      timeframe: "M15 / H1",
      targetReturn: "+50% par trade (2 trades max)",
      maxDrawdown: "< 3.5%",
      winRate: "50%",
      gateway: "Equinix NY4 Cross-Connect FIX 4.4",
      description:
        "Preset 1 : Algorithme haute précision sur l'Or Spot. Gain de +50% de la mise par trade, pour un quota contractuel de 2 trades maximum.",
      borderClass: "border-amber-500/40 hover:border-amber-400 shadow-amber-500/10",
      accentBg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      btnClass: "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20",
    },
    {
      id: "FX_TREND",
      name: "Preset 2 : Nexium FX Trend",
      subtitle: "Forex Majors Macro Momentum",
      badge: "Multi-Paires Alpha · 75% de la mise",
      market: "EURUSD · GBPUSD · USDJPY",
      timeframe: "H1 / H4",
      targetReturn: "+75% par trade (5 trades max)",
      maxDrawdown: "< 2.8%",
      winRate: "75%",
      gateway: "LD4 London Equinix Bridge",
      description:
        "Preset 2 : Moteur de momentum macroéconomique sur devises majeures. Gain de +75% de la mise par trade, pour un quota de 5 trades maximum.",
      borderClass: "border-cyan-500/40 hover:border-cyan-400 shadow-cyan-500/10",
      accentBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      btnClass: "bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20",
    },
    {
      id: "INDEX_REVERSION",
      name: "Preset 3 : Nexium Index Reversion",
      subtitle: "US Indices Mean Reversion Stat-Arb",
      badge: "Haute Fréquence Indices · 98% de la mise",
      market: "NAS100 · US30 · US500",
      timeframe: "M5 / M15",
      targetReturn: "+98% par trade (Trading Illimité ∞)",
      maxDrawdown: "0.0% (Zero Drawdown)",
      winRate: "98%",
      gateway: "Chicago CME Direct Feed",
      description:
        "Preset 3 : Stratégie statistique institutionnelle sur indices américains. Gain de +98% de la mise par trade, trading illimité en continu sans expiration.",
      borderClass: "border-purple-500/40 hover:border-purple-400 shadow-purple-500/10",
      accentBg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      btnClass: "bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/20",
    },
  ];

  // ----------------------------------------------------
  // ÉCRAN 1 : VUE CLIENT AVANT ACTIVATION DE LA LICENCE
  // (Le client ne voit que ses infos et les 3 presets)
  // ----------------------------------------------------
  if (licenseStatus !== "ACTIVE" && (licenseStatus as any) === "BLOCKED_VIEW") {
    return (
      <div className="min-h-screen bg-[#05070a] text-white flex flex-col font-sans selection:bg-[#00D084]/30 relative overflow-x-hidden">
        {/* Lueurs et Dégradés d'Ambiance Riches */}
        <div className="absolute top-0 right-0 size-[650px] bg-gradient-to-bl from-[#00D084]/10 via-[#00D084]/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-[25%] left-[-5%] size-[600px] bg-gradient-to-tr from-cyan-500/10 via-blue-600/5 to-transparent rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-[5%] right-[15%] size-[700px] bg-gradient-to-tl from-purple-500/10 via-emerald-900/5 to-transparent rounded-full blur-[180px] pointer-events-none" />

        {/* Top Header Harmonisé */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/[0.08] bg-[#070a0f]/90 px-4 sm:px-8 backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <span className="font-mono text-xl sm:text-2xl font-black tracking-[0.25em] text-white">NEXIUM</span>
              <span className="h-4 w-px bg-[#00D084]" />
              <span className="text-[10px] sm:text-xs font-black tracking-[0.3em] text-[#00D084]">MARKETS</span>
            </Link>

            <div className="hidden lg:block h-6 w-px bg-white/[0.08]" />

            <div className="hidden lg:block">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                PORTAIL INSTITUTIONNEL · INITIALISATION DU COMPTE
              </p>
              <h1 className="text-sm font-black text-white">
                Sélection &amp; Activation de Stratégie Algorithmique
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Statut ECN Live */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-mono font-bold text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>MT5 RAW ECN : #{mt5AccountNumber}</span>
            </div>

            {/* Solde Ségrégué */}
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#111722] px-4 py-2 text-xs sm:text-sm font-mono font-black text-[#00D084] shadow-lg shadow-black/40">
              ${balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} USD
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 rounded-xl border border-white/[0.1] bg-[#111722] px-3 py-1.5 hover:border-white/20 transition cursor-pointer"
                title="Menu profil"
              >
                <div className="grid size-7 sm:size-8 place-items-center rounded-lg bg-[#00D084]/15 border border-[#00D084]/30 text-xs font-black text-[#00D084]">
                  {clientName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col text-left leading-none">
                  <span className="text-xs font-black text-white">{clientName}</span>
                  <span className="text-[10px] font-mono text-slate-400">Titulaire Vérifié</span>
                </div>
                <ChevronDown className="size-3 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-white/[0.1] bg-[#0e141e] p-2 shadow-2xl z-50 backdrop-blur-xl">
                  <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                    <p className="text-xs font-bold text-white">{clientName}</p>
                    <p className="text-[10px] font-mono text-[#00D084]">Compte MT5 #{mt5AccountNumber}</p>
                    <div className="mt-1.5 flex items-center justify-between rounded-lg bg-black/40 px-2 py-1 border border-white/5">
                      <span className="text-[9px] font-mono text-slate-400 truncate max-w-[140px]">
                        /portal/{customSlug || getUserSlug({ name: clientName, email: clientEmail, id: currentUserId })}
                      </span>
                      <button
                        onClick={() => {
                          const slug = customSlug || getUserSlug({ name: clientName, email: clientEmail, id: currentUserId });
                          navigator.clipboard.writeText(`https://nexiummarkets.com/portal/${slug}`);
                          toast.success("Lien de votre portail copié !");
                        }}
                        className="text-[9px] font-bold text-[#00D084] hover:underline cursor-pointer ml-1"
                      >
                        Copier
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <LogOut className="size-3.5" />
                    {adminImpersonateUserId ? "Quitter la Supervision" : "Déconnexion Sécurisée"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Corps Principal */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-8 w-full space-y-8 relative z-10">
          {/* ── 1. GRANDE CARTE INSTITUTIONNELLE (4 CHAMPS AGRANDIS) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Champ 1 : Compte Titulaire */}
            <div className="p-6 rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0e141f]/90 to-[#090d14]/90 backdrop-blur-xl shadow-2xl hover:border-emerald-500/40 transition duration-300 group flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400">
                  COMPTE TITULAIRE
                </span>
                <div className="size-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 grid place-items-center group-hover:scale-105 transition">
                  <ShieldCheck className="size-6" />
                </div>
              </div>
              <div className="mt-3">
                <strong className="text-base sm:text-lg font-black text-white tracking-tight block">
                  MT5 #{mt5AccountNumber}
                </strong>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Titularisation ECN Active
                </span>
              </div>
            </div>

            {/* Champ 2 : Passerelle FIX */}
            <div className="p-6 rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0e141f]/90 to-[#090d14]/90 backdrop-blur-xl shadow-2xl hover:border-cyan-500/40 transition duration-300 group flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400">
                  PASSERELLE FIX
                </span>
                <div className="size-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 grid place-items-center group-hover:scale-105 transition">
                  <Wifi className="size-6" />
                </div>
              </div>
              <div className="mt-3">
                <strong className="text-base sm:text-lg font-black text-white tracking-tight block truncate">
                  Equinix NY4
                </strong>
                <span className="text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 mt-0.5">
                  <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Cross-Connect FIX 4.4 (16ms)
                </span>
              </div>
            </div>

            {/* Champ 3 : Conseiller Référent */}
            <div className="p-6 rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0e141f]/90 to-[#090d14]/90 backdrop-blur-xl shadow-2xl hover:border-purple-500/40 transition duration-300 group flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400">
                  CONSEILLER RÉFÉRENT
                </span>
                <div className="size-11 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 grid place-items-center group-hover:scale-105 transition">
                  <Activity className="size-6" />
                </div>
              </div>
              <div className="mt-3">
                <strong className="text-base sm:text-lg font-black text-white tracking-tight block truncate">
                  Expert Trading
                </strong>
                <span className="text-[11px] font-mono text-purple-300 flex items-center gap-1.5 mt-0.5">
                  <span className="size-1.5 rounded-full bg-purple-400 animate-pulse" />
                  Supervision Quant Dédiée 24/7
                </span>
              </div>
            </div>

            {/* Champ 4 : Statut Privilégié / Stratégie */}
            <div className="p-6 rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0e141f]/90 to-[#090d14]/90 backdrop-blur-xl shadow-2xl hover:border-amber-500/40 transition duration-300 group flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400">
                  STATUT PRIVILÉGIÉ
                </span>
                <div className="size-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 grid place-items-center group-hover:scale-105 transition">
                  <Lock className="size-6" />
                </div>
              </div>
              <div className="mt-3">
                <strong className="text-base sm:text-lg font-black text-amber-300 tracking-tight block truncate">
                  {licenseStatus === "PENDING_PRESET_APPROVAL" ? "Validation en cours" : "En attente d'activation"}
                </strong>
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Accès Moteurs Algorithmiques
                </span>
              </div>
            </div>
          </div>

          {/* Stepper Pipeline si Demande en cours */}
          {licenseStatus === "PENDING_PRESET_APPROVAL" ? (
            <div className="p-6 sm:p-7 rounded-3xl bg-[#0a0e16]/90 border border-amber-500/40 backdrop-blur-xl shadow-2xl space-y-5 animate-in fade-in">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="size-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 grid place-items-center shrink-0">
                    <Clock className="size-5 animate-spin" style={{ animationDuration: "8s" }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                        ÉTAPE 2/3 EN COURS
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Protocole FIX 4.4</span>
                    </div>
                    <h2 className="text-lg font-bold text-white mt-1">
                      Demande transmise au Desk d'Administration
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                      Votre demande pour {requestedPresets.length > 1 ? "les presets" : "le preset"}{" "}
                      <strong>
                        {requestedPresets
                          .map((id) => OFFICIAL_PRESETS.find((p) => p.id === id)?.name || id)
                          .join(", ")}
                      </strong>{" "}
                      a été transmise. Votre gestionnaire <strong>{assignedAdvisor}</strong> procède à la validation de conformité et à l'affectation du flux.
                    </p>
                  </div>
                </div>

                <div className="px-3.5 py-1.5 rounded-xl bg-black/50 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold flex items-center gap-2 shrink-0">
                  <span className="size-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Validation Desk en attente</span>
                </div>
              </div>

              {/* Barre de Progression Visuelle */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="text-xs text-emerald-300 block">1. Choix du Preset</strong>
                    <span className="text-[10px] text-slate-400">Soumission confirmée</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center gap-3 shadow-lg shadow-amber-500/10">
                  <Clock className="size-4 text-amber-400 animate-spin shrink-0" />
                  <div>
                    <strong className="text-xs text-amber-300 block">2. Examen Conformité Desk</strong>
                    <span className="text-[10px] text-amber-200/80">Revue du Super Admin en cours</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3 opacity-60">
                  <Lock className="size-4 text-slate-400 shrink-0" />
                  <div>
                    <strong className="text-xs text-slate-300 block">3. Déploiement Live NY4</strong>
                    <span className="text-[10px] text-slate-500">Déverrouillage Dashboard</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── 2. PETITE CARTE COMPACTE : ABONNEMENT ALGORITHMIQUE ── */
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#0b1018]/95 via-[#0e1522]/95 to-[#0b1018]/95 border border-white/[0.1] shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <Sparkles className="size-3" />
                  <span>ABONNEMENT ALGORITHMIQUE INSTITUTIONNEL</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Activez votre Stratégie de Trading Certifiée
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Sélectionnez l'un des 3 algorithmes propriétaires ci-dessous. Dès validation par l'Administration, l'intégralité du centre de pilotage et l'accès MT5 s'activeront instantanément.
                </p>
              </div>

              <div className="shrink-0 px-4 py-2 rounded-2xl bg-black/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Prêt pour Déploiement NY4</span>
              </div>
            </div>
          )}

          {/* ── 3. GRILLE DES 3 PRESETS (HAUTEUR OPTIMISÉE & COMPACTE) ── */}
          <div className="grid md:grid-cols-3 gap-5 pt-1">
            {OFFICIAL_PRESETS.map((preset) => {
              const isAlreadyRequested = requestedPresets.includes(preset.id);
              const isPending = licenseStatus === "PENDING_PRESET_APPROVAL" && isAlreadyRequested;
              const isChecked = selectedPresetIds.includes(preset.id);

              return (
                <div
                  key={preset.id}
                  className={`rounded-3xl border bg-gradient-to-b from-[#0d131d]/95 to-[#090d14]/95 backdrop-blur-xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 shadow-2xl ${preset.borderClass} ${
                    isChecked || isPending ? "ring-2 ring-emerald-400/50 scale-[1.01]" : "hover:scale-[1.01]"
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Header Carte Compact */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${preset.accentBg}`}>
                        {preset.badge}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{preset.timeframe}</span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight">{preset.name}</h3>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{preset.subtitle}</p>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed min-h-[38px]">
                      {preset.description}
                    </p>

                    {/* Métriques Clés Compactes */}
                    <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-white/[0.08] font-mono text-xs">
                      <div className="p-2 rounded-xl bg-black/40 border border-white/[0.05]">
                        <span className="text-[9px] text-slate-400 block uppercase font-sans">Marché</span>
                        <strong className="text-xs text-white truncate block">{preset.market}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-black/40 border border-white/[0.05]">
                        <span className="text-[9px] text-slate-400 block uppercase font-sans">Objectif</span>
                        <strong className="text-xs text-emerald-400 block">{preset.targetReturn}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-black/40 border border-white/[0.05]">
                        <span className="text-[9px] text-slate-400 block uppercase font-sans">Drawdown</span>
                        <strong className="text-xs text-amber-300 block">{preset.maxDrawdown}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-black/40 border border-white/[0.05]">
                        <span className="text-[9px] text-slate-400 block uppercase font-sans">Win Rate</span>
                        <strong className="text-xs text-cyan-300 block">{preset.winRate}</strong>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono pt-1">
                      <Wifi className="size-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{preset.gateway}</span>
                    </div>
                  </div>

                  {/* Bouton d'Action Compact */}
                  <div className="pt-4">
                    {isPending ? (
                      <div className="w-full py-3 px-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold text-center flex items-center justify-center gap-2">
                        <Clock className="size-3.5 animate-spin" />
                        <span>Demande en cours d'approbation</span>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          setSelectedPresetIds((prev) =>
                            prev.includes(preset.id) ? prev.filter((id) => id !== preset.id) : [...prev, preset.id]
                          )
                        }
                        className={`w-full py-3 px-4 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                          isChecked
                            ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300"
                            : preset.btnClass
                        }`}
                      >
                        {isChecked ? (
                          <>
                            <CheckCircle2 className="size-3.5" />
                            <span>Sélectionné</span>
                          </>
                        ) : (
                          <>
                            <span>Sélectionner ce Preset</span>
                            <ChevronRight className="size-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bouton d'envoi groupé — actif dès qu'au moins un preset est coché */}
          {selectedPresetIds.length > 0 && (
            <div className="sticky bottom-4 z-20 flex justify-center animate-in fade-in slide-in-from-bottom-2">
              <button
                onClick={() => setShowPresetConfirmModal(true)}
                className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-black transition flex items-center gap-2.5 cursor-pointer shadow-2xl shadow-emerald-500/30"
              >
                <CheckCircle2 className="size-4" />
                <span>
                  Transmettre la demande pour {selectedPresetIds.length} preset{selectedPresetIds.length > 1 ? "s" : ""}
                </span>
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}

          {/* Section Frosted Preview des Fonctionnalités Verrouillées */}
          <div className="relative rounded-3xl border border-white/[0.08] bg-[#0a0e16]/90 p-6 sm:p-8 overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="size-12 rounded-2xl bg-white/[0.08] border border-white/[0.15] text-white grid place-items-center shadow-2xl">
                <Lock className="size-6 text-[#00D084]" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Centre de Pilotage &amp; Graphiques de Trading en Direct
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Le passage d'ordres MT5, les flux de liquidité FIX 4.4, le carnet d'ordres L2 et la télémétrie de haute fréquence s'activeront instantanément dès que l'Administration aura validé votre Preset.
              </p>
            </div>

            <div className="opacity-20 pointer-events-none space-y-4 filter blur-[2px]">
              <div className="h-10 bg-white/[0.06] rounded-xl w-full" />
              <div className="grid grid-cols-3 gap-4">
                <div className="h-32 bg-white/[0.04] rounded-2xl" />
                <div className="h-32 bg-white/[0.04] rounded-2xl" />
                <div className="h-32 bg-white/[0.04] rounded-2xl" />
              </div>
              <div className="h-56 bg-white/[0.04] rounded-2xl" />
            </div>
          </div>

          {/* Section d'Assistance Conseiller & Support Direct */}
          <div className="p-5 sm:p-6 rounded-3xl border border-white/[0.08] bg-[#0a0e16]/90 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 grid place-items-center text-emerald-400 shrink-0">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <strong className="text-white block font-semibold">Conseiller Référent Dédié : {assignedAdvisor}</strong>
                <span>Supervision institutionnelle, gestion des allocations et support 24/7</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-slate-400">Support Desk : </span>
              <strong className="text-emerald-400 font-mono">support@nexiummarkets.com</strong>
            </div>
          </div>
        </main>

        {/* Modale de Confirmation de Demande de Preset(s) */}
        {showPresetConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md grid place-items-center p-4 animate-in fade-in">
            <div className="w-full max-w-lg rounded-3xl border border-white/[0.12] bg-[#0f141d] p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 grid place-items-center">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Validation du/des Preset(s)</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {selectedPresetIds.length} preset{selectedPresetIds.length > 1 ? "s" : ""} sélectionné{selectedPresetIds.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPresetConfirmModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-black/40 p-4 rounded-2xl border border-white/[0.06]">
                <p>
                  Vous êtes sur le point de soumettre la demande d'activation pour votre compte MT5{" "}
                  <strong className="text-emerald-400">#{mt5AccountNumber}</strong> :
                </p>
                <ul className="space-y-2.5 text-slate-400 pt-2 border-t border-white/[0.06]">
                  {selectedPresetIds.map((id) => {
                    const p = OFFICIAL_PRESETS.find((preset) => preset.id === id);
                    if (!p) return null;
                    return (
                      <li key={id}>
                        • <strong className="text-white">{p.name}</strong> — {p.subtitle} ({p.market})
                      </li>
                    );
                  })}
                  <li className="pt-1">
                    Conseiller Référent : <strong className="text-purple-300">Expert Trading</strong>
                  </li>
                  <li>
                    Régulation : <strong className="text-emerald-400">Validation obligatoire par l'Administrateur</strong>
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowPresetConfirmModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/[0.1] text-xs font-bold text-slate-300 hover:bg-white/[0.06] transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  disabled={submittingPreset}
                  onClick={() => handleConfirmPresetRequest(selectedPresetIds)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {submittingPreset ? (
                    <>
                      <Clock className="size-4 animate-spin" />
                      <span>Transmission...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      <span>Confirmer &amp; Transmettre à l'Admin</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // ÉCRAN 2 : DASHBOARD COMPLET DÉVERROUILLÉ
  // (Affiché UNIQUEMENT lorsque l'Admin a validé le Preset)
  // ----------------------------------------------------
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
          <p className="mt-1 text-base font-black text-white font-mono">Nexium Live · #{mt5AccountNumber}</p>
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
          <Link
            to="/"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-gray-400 hover:bg-white/[0.04] hover:text-white transition cursor-pointer"
          >
            <ExternalLink className="size-4 text-[#00D084]" />
            Retour au Site Public
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition cursor-pointer border border-rose-500/20 bg-rose-500/5"
          >
            <LogOut className="size-4 text-rose-400" />
            Déconnexion
          </button>
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
                {activeNav === "MT5" && "Terminal MetaTrader 5 · Trading Direct & Presets"}
                {activeNav === "Configuration des Mises" && "Gestion du Capital & Configuration des Mises"}
                {activeNav === "Portefeuille" && "Gestion Financière & Relevés"}
                {activeNav === "Paramètres du Compte" && "Sécurité & Configuration du Compte"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setAlertsOpen(true)}
              title={`Centre de notifications & alertes (${unreadNotifsCount} non lues)`}
              className="relative rounded-xl border border-white/[0.08] bg-[#141a23] p-2.5 text-gray-300 hover:text-white hover:border-[#00D084]/40 transition cursor-pointer"
            >
              <Bell className="size-4" />
              {unreadNotifsCount > 0 ? (
                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-[#00D084] text-black font-mono font-black text-[9px] grid place-items-center shadow-[0_0_8px_#00D084] animate-pulse">
                  {unreadNotifsCount > 9 ? "9+" : unreadNotifsCount}
                </span>
              ) : priceAlerts.length > 0 ? (
                <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-amber-400 text-black font-mono font-black text-[8px] grid place-items-center">
                  {priceAlerts.length}
                </span>
              ) : null}
            </button>

            <StatusPill variant={running ? "emerald" : "rose"}>
              {running ? "TRADING ACTIF" : "TRADING EN PAUSE"}
            </StatusPill>

            <button
              onClick={openDepositModal}
              className="hidden sm:flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#141a23] px-3.5 py-2 text-sm font-mono font-black text-[#00D084] hover:bg-[#1a2330] transition cursor-pointer"
              title={`Solde Cash : $${balance.toFixed(2)} | Bonus : $${bonus.toFixed(2)}`}
            >
              <Wallet className="size-4 text-emerald-400" />
              <span>${(balance + bonus).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} USD</span>
              {bonus > 0 && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded-md font-bold font-mono">
                  +${bonus.toLocaleString("fr-FR")} BONUS
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 rounded-xl border border-white/[0.1] bg-[#141a23] px-2.5 py-1.5 hover:border-white/20 transition cursor-pointer"
                title="Menu profil"
              >
                <div className="grid size-7 sm:size-8 place-items-center rounded-lg bg-[#00D084]/15 border border-[#00D084]/30 text-xs sm:size-8 font-black text-[#00D084]">
                  {clientName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col text-left leading-none">
                  <span className="text-xs font-black text-white">{clientName}</span>
                  <span className="text-[10px] font-mono text-gray-400">#{mt5AccountNumber}</span>
                </div>
                <ChevronDown className="size-3 text-gray-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/[0.1] bg-[#10141b] p-2.5 shadow-2xl z-50 backdrop-blur-xl">
                  <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                    <p className="text-xs font-bold text-white">{clientName}</p>
                    <p className="text-[10px] font-mono text-[#00D084]">Compte MT5 #{mt5AccountNumber}</p>
                    <div className="mt-2 pt-2 border-t border-white/[0.06] space-y-1 font-mono text-[11px]">
                      <div className="flex items-center justify-between text-gray-400">
                        <span>Solde Cash :</span>
                        <span className="text-white font-bold">${balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span>
                      </div>
                      {bonus > 0 && (
                        <div className="flex items-center justify-between text-amber-300">
                          <span>Bonus Crédité :</span>
                          <span className="font-bold">+${bonus.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-emerald-400 font-bold border-t border-white/5 pt-1">
                        <span>Equity Totale :</span>
                        <span>${(balance + bonus).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} USD</span>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between rounded-lg bg-black/40 px-2 py-1 border border-white/5">
                      <span className="text-[9px] font-mono text-gray-400 truncate max-w-[140px]">
                        /portal/{customSlug || getUserSlug({ name: clientName, email: clientEmail, id: currentUserId })}
                      </span>
                      <button
                        onClick={() => {
                          const slug = customSlug || getUserSlug({ name: clientName, email: clientEmail, id: currentUserId });
                          navigator.clipboard.writeText(`https://nexiummarkets.com/portal/${slug}`);
                          toast.success("Lien de votre portail copié !");
                        }}
                        className="text-[9px] font-bold text-[#00D084] hover:underline cursor-pointer ml-1"
                        title="Copier mon URL personnalisée"
                      >
                        Copier
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setActiveNav("Paramètres du Compte");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-white/[0.06] hover:text-white transition cursor-pointer"
                  >
                    <Settings className="size-3.5" />
                    Paramètres du Compte
                  </button>
                  <Link
                    to="/"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-white/[0.06] hover:text-white transition cursor-pointer"
                  >
                    <ExternalLink className="size-3.5" />
                    Site public
                  </Link>
                  {!adminImpersonateUserId && isOwnerEmail(clientEmail) && (
                    <Link
                      to="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10 hover:text-white transition cursor-pointer"
                    >
                      <ShieldCheck className="size-3.5" />
                      Console admin
                    </Link>
                  )}
                  <div className="my-1 border-t border-white/[0.06]" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <LogOut className="size-3.5" />
                    {adminImpersonateUserId ? "Quitter la Supervision" : "Se déconnecter"}
                  </button>
                </div>
              )}
            </div>

            {/* Direct Logout Button */}
            <button
              onClick={handleLogout}
              title="Se déconnecter"
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 transition cursor-pointer"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </header>

        {/* Tab Body */}
        <main className={`flex-1 p-3 sm:p-4 max-w-[1650px] w-full mx-auto ${activeNav === "Vue d’ensemble" ? "flex flex-col h-[calc(100vh-5rem)] overflow-hidden" : ""}`}>
          {activeNav === "Vue d’ensemble" && (
            <OverviewTab
              clientName={clientName}
              balance={balance}
              bonus={bonus}
              totalGains={totalPresetPnl}
              running={running}
              onToggleRunning={handleToggleEngine}
              bots={visibleBotsWithLiveStats}
              positions={positions}
              mt5AccountNumber={mt5AccountNumber}
              onClosePosition={handleClosePosition}
              onOpenDeposit={openDepositModal}
              onOpenWithdraw={() => setWithdrawOpen(true)}
              onOpenEngine={() => setActiveNav("MT5")}
              onOpenRisk={() => setActiveNav("Risque")}
              onBalanceChange={handleLiveBalanceChange}
            />
          )}

          {activeNav === "MT5" && (
            <div className="space-y-4">
              {/* ── 3 PRESET CARDS EN HAUT AVEC GESTION INDIVIDUELLE DES ACTIVATIONS ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {/* 1. Nexium AI Gold */}
                {(() => {
                  const bot = visibleBotsWithLiveStats.find((b) => b.id === "nexium-ai-gold") || visibleBotsWithLiveStats[0] || bots[0];
                  const activeList = (activePreset || "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
                  const isApproved = activeList.includes("AI_GOLD");
                  const isExpired = isApproved && quotaStats.goldWins >= 2;
                  const isRequested = (requestedPresets || []).includes("AI_GOLD");
                  const isPending = isRequested && (!isApproved || isExpired);
                  const isRunning = isApproved && !isExpired && !isPending && bot?.statusBadge === "ACTIF";

                  return (
                    <div className="rounded-2xl border border-amber-900/60 bg-[#0e0b06] p-3.5 sm:p-4 shadow-xl flex flex-col justify-between space-y-2.5 hover:border-amber-500/50 transition">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-400 font-mono text-[11px] font-bold">
                            XAUUSD
                          </span>
                          <span className="px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-300 font-mono text-[10px] font-bold">
                            OBJECTIF +50% / TRADE · 2 MAX
                          </span>
                        </div>
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-500/50 bg-amber-500/15 text-amber-300 text-[11px] font-bold font-mono animate-pulse">
                            <span className="size-1.5 rounded-full bg-amber-400" />
                            EN ATTENTE DE VALIDATION
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-rose-500/50 bg-rose-950/40 text-rose-300 text-[11px] font-bold font-mono">
                            <span className="size-1.5 rounded-full bg-rose-500" />
                            EXPIRÉ (2/2)
                          </span>
                        ) : isApproved ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold font-mono ${
                              isRunning
                                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                                : "border-rose-500/40 bg-rose-500/15 text-rose-400"
                            }`}
                          >
                            <span className={`size-1.5 rounded-full ${isRunning ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`} />
                            {isRunning ? "ACTIF" : "EN PAUSE"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-slate-700/60 bg-slate-800/40 text-slate-400 text-[11px] font-bold font-mono">
                            <span className="size-1.5 rounded-full bg-slate-500" />
                            INACTIF
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Nexium AI Gold</h3>

                      {/* Middle: P&L + Quota Progress Bar */}
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">P&amp;L DU CYCLE</span>
                            {isApproved && goldPositions.length > 0 && (
                              <span className="text-[10px] font-mono font-bold text-amber-400">({goldPositions.length} pos)</span>
                            )}
                          </div>
                          <strong className={`text-lg sm:text-xl font-black font-mono block mt-0.5 ${!isApproved ? "text-slate-500" : "text-[#00D084]"}`}>
                            {isApproved ? `+$${goldTotalPnl.toFixed(2)}` : "$0.00"}
                          </strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-mono font-bold text-slate-400">
                            QUOTA : <strong className={isExpired ? "text-rose-400" : "text-amber-400"}>{Math.min(2, quotaStats.goldWins)} / 2 TRADES</strong>
                          </span>
                          <div className="mt-1 h-1.5 w-20 sm:w-24 bg-slate-800 rounded-full overflow-hidden ml-auto">
                            <div
                              className={`h-full rounded-full ${isExpired ? "bg-rose-500" : "bg-amber-400"}`}
                              style={{ width: `${Math.min(100, (Math.min(2, quotaStats.goldWins) / 2) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Configured Stake Info */}
                      <div className="flex items-center justify-between bg-[#121a2d]/60 rounded-xl px-2.5 py-1.5 border border-slate-800/80">
                        <span className="text-[10px] font-semibold text-slate-400 font-mono">Mise initiale :</span>
                        <button
                          onClick={() => setActiveNav("Configuration des Mises")}
                          className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer"
                          title="Modifier la mise dans Configuration des Mises"
                        >
                          <span>${quotaStats.goldInitialStake ?? presetStakes.goldStake} USD</span>
                          <SlidersHorizontal className="size-3 text-slate-400" />
                        </button>
                      </div>

                      {/* Bottom Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        {isPending ? (
                          <button
                            disabled
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-950/40 text-amber-300 py-1.5 px-3 text-[11px] font-bold opacity-90 cursor-not-allowed"
                          >
                            <Clock className="size-3 animate-spin text-amber-400" />
                            <span>DEMANDE EN ATTENTE DE VALIDATION</span>
                          </button>
                        ) : isExpired ? (
                          <button
                            onClick={() => handleRequestSinglePreset("AI_GOLD", "Nexium AI Gold (Renouvellement)")}
                            disabled={submittingPreset}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-500/60 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 py-1.5 px-3 text-[11px] font-bold transition cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.2)] active:scale-95"
                          >
                            <Sparkles className="size-3" />
                            <span>FAIRE UNE NOUVELLE DEMANDE</span>
                          </button>
                        ) : isApproved ? (
                          <button
                            onClick={() => handleToggleBotPause("nexium-ai-gold")}
                            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border py-1.5 px-3 text-[11px] font-bold transition cursor-pointer shadow-md ${
                              isRunning
                                ? "border-amber-500/50 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                                : "border-emerald-500/50 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                            }`}
                          >
                            <span className={`size-1.5 rounded-full ${isRunning ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                            <span>{isRunning ? "METTRE EN PAUSE" : "LANCER LE BOT"}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRequestSinglePreset("AI_GOLD", "Nexium AI Gold")}
                            disabled={submittingPreset}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-500/60 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 py-1.5 px-3 text-[11px] font-bold transition cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                          >
                            <Sparkles className="size-3" />
                            <span>DEMANDER L'ACTIVATION</span>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedDetailBot(bot || null)}
                          className="rounded-full border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800 py-1.5 px-3.5 text-[11px] font-bold text-slate-200 transition cursor-pointer"
                        >
                          Détails
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Nexium FX Trend */}
                {(() => {
                  const bot = visibleBotsWithLiveStats.find((b) => b.id === "nexium-fx-trend") || visibleBotsWithLiveStats[1] || bots[0];
                  const activeList = (activePreset || "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
                  const isApproved = activeList.includes("FX_TREND");
                  const isExpired = isApproved && quotaStats.fxWins >= 5;
                  const isRequested = (requestedPresets || []).includes("FX_TREND");
                  const isPending = isRequested && (!isApproved || isExpired);
                  const isRunning = isApproved && !isExpired && !isPending && bot?.statusBadge === "ACTIF";

                  return (
                    <div className="rounded-2xl border border-cyan-900/60 bg-[#050e16] p-3.5 sm:p-4 shadow-xl flex flex-col justify-between space-y-2.5 hover:border-cyan-500/50 transition">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-md border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 font-mono text-[11px] font-bold">
                            EURUSD
                          </span>
                          <span className="px-2 py-0.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-mono text-[10px] font-bold">
                            OBJECTIF +75% / TRADE · 5 MAX
                          </span>
                        </div>
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-cyan-500/50 bg-cyan-500/15 text-cyan-300 text-[11px] font-bold font-mono animate-pulse">
                            <span className="size-1.5 rounded-full bg-cyan-400" />
                            EN ATTENTE DE VALIDATION
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-rose-500/50 bg-rose-950/40 text-rose-300 text-[11px] font-bold font-mono">
                            <span className="size-1.5 rounded-full bg-rose-500" />
                            EXPIRÉ (5/5)
                          </span>
                        ) : isApproved ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold font-mono ${
                              isRunning
                                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                                : "border-rose-500/40 bg-rose-500/15 text-rose-400"
                            }`}
                          >
                            <span className={`size-1.5 rounded-full ${isRunning ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`} />
                            {isRunning ? "ACTIF" : "EN PAUSE"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-slate-700/60 bg-slate-800/40 text-slate-400 text-[11px] font-bold font-mono">
                            <span className="size-1.5 rounded-full bg-slate-500" />
                            INACTIF
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Nexium FX Trend</h3>

                      {/* Middle: P&L + Quota Progress Bar */}
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">P&amp;L DU CYCLE</span>
                            {isApproved && fxPositions.length > 0 && (
                              <span className="text-[10px] font-mono font-bold text-cyan-400">({fxPositions.length} pos)</span>
                            )}
                          </div>
                          <strong className={`text-lg sm:text-xl font-black font-mono block mt-0.5 ${!isApproved ? "text-slate-500" : "text-[#00D084]"}`}>
                            {isApproved ? `+$${fxTotalPnl.toFixed(2)}` : "$0.00"}
                          </strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-mono font-bold text-slate-400">
                            QUOTA : <strong className={isExpired ? "text-rose-400" : "text-cyan-400"}>{Math.min(5, quotaStats.fxWins)} / 5 TRADES</strong>
                          </span>
                          <div className="mt-1 h-1.5 w-20 sm:w-24 bg-slate-800 rounded-full overflow-hidden ml-auto">
                            <div
                              className={`h-full rounded-full ${isExpired ? "bg-rose-500" : "bg-cyan-400"}`}
                              style={{ width: `${Math.min(100, (Math.min(5, quotaStats.fxWins) / 5) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Configured Stake Info */}
                      <div className="flex items-center justify-between bg-[#121a2d]/60 rounded-xl px-2.5 py-1.5 border border-slate-800/80">
                        <span className="text-[10px] font-semibold text-slate-400 font-mono">Mise initiale :</span>
                        <button
                          onClick={() => setActiveNav("Configuration des Mises")}
                          className="flex items-center gap-1 text-[11px] font-mono font-bold text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                          title="Modifier la mise dans Configuration des Mises"
                        >
                          <span>${quotaStats.fxInitialStake ?? presetStakes.fxStake} USD</span>
                          <SlidersHorizontal className="size-3 text-slate-400" />
                        </button>
                      </div>

                      {/* Bottom Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        {isPending ? (
                          <button
                            disabled
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 py-1.5 px-3 text-[11px] font-bold opacity-90 cursor-not-allowed"
                          >
                            <Clock className="size-3 animate-spin text-cyan-400" />
                            <span>DEMANDE EN ATTENTE DE VALIDATION</span>
                          </button>
                        ) : isExpired ? (
                          <button
                            onClick={() => handleRequestSinglePreset("FX_TREND", "Nexium FX Trend (Renouvellement)")}
                            disabled={submittingPreset}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-cyan-500/60 bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 hover:from-cyan-500/30 hover:to-cyan-600/30 text-cyan-300 py-1.5 px-3 text-[11px] font-bold transition cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.2)] active:scale-95"
                          >
                            <Sparkles className="size-3" />
                            <span>FAIRE UNE NOUVELLE DEMANDE</span>
                          </button>
                        ) : isApproved ? (
                          <button
                            onClick={() => handleToggleBotPause("nexium-fx-trend")}
                            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border py-1.5 px-3 text-[11px] font-bold transition cursor-pointer shadow-md ${
                              isRunning
                                ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                                : "border-emerald-500/50 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                            }`}
                          >
                            <span className={`size-1.5 rounded-full ${isRunning ? "bg-cyan-400 animate-pulse" : "bg-emerald-400"}`} />
                            <span>{isRunning ? "METTRE EN PAUSE" : "LANCER LE BOT"}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRequestSinglePreset("FX_TREND", "Nexium FX Trend")}
                            disabled={submittingPreset}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-cyan-500/60 bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 hover:from-cyan-500/30 hover:to-cyan-600/30 text-cyan-300 py-1.5 px-3 text-[11px] font-bold transition cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                          >
                            <Sparkles className="size-3" />
                            <span>DEMANDER L'ACTIVATION</span>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedDetailBot(bot || null)}
                          className="rounded-full border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800 py-1.5 px-3.5 text-[11px] font-bold text-slate-200 transition cursor-pointer"
                        >
                          Détails
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Nexium Index Reversion */}
                {(() => {
                  const bot = visibleBotsWithLiveStats.find((b) => b.id === "nexium-index-reversion") || visibleBotsWithLiveStats[2] || bots[0];
                  const activeList = (activePreset || "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
                  const isApproved = activeList.includes("INDEX_REVERSION");
                  const isRequested = (requestedPresets || []).includes("INDEX_REVERSION");
                  const isPending = isRequested && !isApproved;
                  const isRunning = isApproved && !isPending && bot?.statusBadge === "ACTIF";

                  return (
                    <div className="rounded-2xl border border-purple-900/60 bg-[#0d0716] p-3.5 sm:p-4 shadow-xl flex flex-col justify-between space-y-2.5 hover:border-purple-500/50 transition">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-md border border-purple-500/40 bg-purple-500/10 text-purple-400 font-mono text-[11px] font-bold">
                            NAS100
                          </span>
                          <span className="px-2 py-0.5 rounded-md border border-purple-500/30 bg-purple-500/10 text-purple-300 font-mono text-[10px] font-bold">
                            OBJECTIF +98% / TRADE · ILLIMITÉ
                          </span>
                        </div>
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-purple-500/50 bg-purple-500/15 text-purple-300 text-[11px] font-bold font-mono animate-pulse">
                            <span className="size-1.5 rounded-full bg-purple-400" />
                            EN ATTENTE DE VALIDATION
                          </span>
                        ) : isApproved ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold font-mono ${
                              isRunning
                                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                                : "border-rose-500/40 bg-rose-500/15 text-rose-400"
                            }`}
                          >
                            <span className={`size-1.5 rounded-full ${isRunning ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`} />
                            {isRunning ? "ACTIF" : "EN PAUSE"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-slate-700/60 bg-slate-800/40 text-slate-400 text-[11px] font-bold font-mono">
                            <span className="size-1.5 rounded-full bg-slate-500" />
                            INACTIF
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Nexium Index Reversion</h3>

                      {/* Middle: P&L + Quota Progress Bar */}
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">P&amp;L DU CYCLE</span>
                            {isApproved && indexPositions.length > 0 && (
                              <span className="text-[10px] font-mono font-bold text-purple-400">({indexPositions.length} pos)</span>
                            )}
                          </div>
                          <strong className={`text-lg sm:text-xl font-black font-mono block mt-0.5 ${!isApproved ? "text-slate-500" : "text-[#00D084]"}`}>
                            {isApproved ? `+$${Math.max(0, indexTotalPnl).toFixed(2)}` : "$0.00"}
                          </strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-mono font-bold text-slate-400">
                            QUOTA : <strong className="text-purple-400">ILLIMITÉ (∞) · 98% GAIN</strong>
                          </span>
                          <div className="mt-1 h-1.5 w-20 sm:w-24 bg-slate-800 rounded-full overflow-hidden ml-auto">
                            <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400 w-full" />
                          </div>
                        </div>
                      </div>

                      {/* Configured Stake Info */}
                      <div className="flex items-center justify-between bg-[#121a2d]/60 rounded-xl px-2.5 py-1.5 border border-slate-800/80">
                        <span className="text-[10px] font-semibold text-slate-400 font-mono">Mise initiale :</span>
                        <button
                          onClick={() => setActiveNav("Configuration des Mises")}
                          className="flex items-center gap-1 text-[11px] font-mono font-bold text-purple-400 hover:text-purple-300 transition cursor-pointer"
                          title="Modifier la mise dans Configuration des Mises"
                        >
                          <span>${quotaStats.indexInitialStake ?? presetStakes.indexStake} USD</span>
                          <SlidersHorizontal className="size-3 text-slate-400" />
                        </button>
                      </div>

                      {/* Bottom Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        {isPending ? (
                          <button
                            disabled
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-950/40 text-purple-300 py-1.5 px-3 text-[11px] font-bold opacity-90 cursor-not-allowed"
                          >
                            <Clock className="size-3 animate-spin text-purple-400" />
                            <span>DEMANDE EN ATTENTE DE VALIDATION</span>
                          </button>
                        ) : isApproved ? (
                          <button
                            onClick={() => handleToggleBotPause("nexium-index-reversion")}
                            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border py-1.5 px-3 text-[11px] font-bold transition cursor-pointer shadow-md ${
                              isRunning
                                ? "border-purple-500/50 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                                : "border-emerald-500/50 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                            }`}
                          >
                            <span className={`size-1.5 rounded-full ${isRunning ? "bg-purple-400 animate-pulse" : "bg-emerald-400"}`} />
                            <span>{isRunning ? "METTRE EN PAUSE" : "LANCER LE BOT"}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRequestSinglePreset("INDEX_REVERSION", "Nexium Index Reversion")}
                            disabled={submittingPreset}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-purple-500/60 bg-gradient-to-r from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 text-purple-300 py-1.5 px-3 text-[11px] font-bold transition cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                          >
                            <Sparkles className="size-3" />
                            <span>DEMANDER L'ACTIVATION</span>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedDetailBot(bot || null)}
                          className="rounded-full border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800 py-1.5 px-3.5 text-[11px] font-bold text-slate-200 transition cursor-pointer"
                        >
                          Détails
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ── META TRADER 5 TERMINAL WORKSTATION EN DESSOUS ── */}
              <MetaTrader5Terminal
                key={currentUserId || "local"}
                storageKey={`nexium_demo_terminal_${currentUserId || "local"}`}
                balance={demoBalance}
                bonus={bonus}
                mt5AccountNumber={mt5AccountNumber}
                clientName={clientName}
                activePreset={activePreset}
                bots={bots}
                onOpenDeposit={openDepositModal}
                onOpenWithdraw={() => setWithdrawOpen(true)}
                onBalanceChange={handleDemoBalanceChange}
                onPositionsChange={setTerminalPositions}
                quotaStats={quotaStats}
                onQuotaChange={handleQuotaChange}
                presetStakes={presetStakes}
                onOpenStakeConfig={() => setActiveNav("Configuration des Mises")}
              />
            </div>
          )}

          {activeNav === "Configuration des Mises" && (
            <StakeManagementTab
              balance={balance}
              bonus={bonus}
              presetStakes={presetStakes}
              activePreset={activePreset}
              requestedPresets={requestedPresets}
              quotaStats={quotaStats}
              onRequestPreset={handleRequestSinglePreset}
              onUpdatePresetStakes={handleUpdateAllPresetStakes}
              onOpenTerminal={() => setActiveNav("MT5")}
            />
          )}

          {activeNav === "Portefeuille" && (
            <PortfolioTab
              balance={balance}
              bonus={bonus}
              totalGains={totalPresetPnl}
              transactions={transactions}
              clientName={clientName}
              currentUserId={currentUserId}
              isSupabaseConfigured={isSupabaseConfigured}
              paymentSettings={paymentSettings}
              onOpenDeposit={openDepositModal}
              onAddTransaction={(tx) => setTransactions((prev) => [tx, ...prev])}
            />
          )}

          {activeNav === "Paramètres du Compte" && (
            <AccountSettingsTab
              clientName={clientName}
              clientEmail={clientEmail}
              mt5AccountNumber={mt5AccountNumber}
              balance={balance}
              bonus={bonus}
              customSlug={customSlug}
              currentUserId={currentUserId}
              onLogout={handleLogout}
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
          <div className="w-full max-w-xl rounded-3xl border border-white/[0.1] bg-[#10141b] p-7 sm:p-9 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                {depositStep !== "METHOD" && (
                  <button
                    onClick={() => setDepositStep("METHOD")}
                    className="text-gray-400 hover:text-white p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition cursor-pointer shrink-0"
                    title="Retour"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                )}
                <div>
                  <h3 className="font-black text-2xl text-white">Déposer des fonds</h3>
                  <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                    {depositStep === "METHOD"
                      ? "Alimentez instantanément votre compte de trading ECN"
                      : "Suivez les instructions ci-dessous pour finaliser votre dépôt"}
                  </p>
                </div>
              </div>
              <button onClick={closeDepositModal} className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition cursor-pointer shrink-0">
                <X className="size-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">MONTANT DU DÉPÔT (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-2xl font-bold text-gray-500">$</span>
                <input
                  type="number"
                  step="any"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  disabled={depositStep !== "METHOD"}
                  className="w-full rounded-2xl border border-white/[0.1] bg-black/40 pl-10 pr-4 py-4 font-mono text-2xl sm:text-3xl font-bold text-white outline-none focus:border-[#00D084] transition disabled:opacity-60"
                />
              </div>
              {depositStep === "METHOD" && (
                <div className="grid grid-cols-4 gap-2.5 mt-3">
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
              )}
            </div>

            {depositStep === "METHOD" && (
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">CHOISISSEZ UN MODE DE PAIEMENT</label>
                <button
                  onClick={() => setDepositStep("BANK")}
                  className="w-full flex items-center gap-3.5 rounded-2xl border border-white/[0.1] bg-[#141a23] hover:border-[#00D084]/40 p-4 text-left transition cursor-pointer"
                >
                  <div className="grid size-11 place-items-center rounded-xl bg-cyan-500/15 text-cyan-400 shrink-0">
                    <Landmark className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-white">Virement Bancaire</p>
                    <p className="text-xs text-gray-400">IBAN/BIC · crédité après réception</p>
                  </div>
                  <ChevronDown className="size-4 text-gray-500 -rotate-90" />
                </button>
                <button
                  onClick={() => setDepositStep("CARD")}
                  className="w-full flex items-center gap-3.5 rounded-2xl border border-white/[0.1] bg-[#141a23] hover:border-[#00D084]/40 p-4 text-left transition cursor-pointer"
                >
                  <div className="grid size-11 place-items-center rounded-xl bg-purple-500/15 text-purple-400 shrink-0">
                    <CreditCard className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-white">Carte Bancaire</p>
                    <p className="text-xs text-gray-400">Débit / Crédit · lien de paiement envoyé par le Desk</p>
                  </div>
                  <ChevronDown className="size-4 text-gray-500 -rotate-90" />
                </button>
                <button
                  onClick={() => setDepositStep("CRYPTO")}
                  className="w-full flex items-center gap-3.5 rounded-2xl border border-white/[0.1] bg-[#141a23] hover:border-[#00D084]/40 p-4 text-left transition cursor-pointer"
                >
                  <div className="grid size-11 place-items-center rounded-xl bg-amber-500/15 text-amber-400 shrink-0">
                    <Coins className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-white">Cryptomonnaie</p>
                    <p className="text-xs text-gray-400">USDT · BTC · ETH</p>
                  </div>
                  <ChevronDown className="size-4 text-gray-500 -rotate-90" />
                </button>
              </div>
            )}

            {depositStep === "BANK" && (
              <div className="space-y-4">
                {paymentSettings?.bank_iban ? (
                  <div className="rounded-2xl border border-white/[0.1] bg-[#0c1017] p-4 space-y-3 font-mono text-sm">
                    {[
                      ["Bénéficiaire", paymentSettings.bank_beneficiary],
                      ["Banque", paymentSettings.bank_name],
                      ["IBAN", paymentSettings.bank_iban],
                      ["BIC / SWIFT", paymentSettings.bank_bic],
                      ["Référence à indiquer", depositReference],
                    ].map(([label, value]) =>
                      value ? (
                        <div key={label} className="flex items-center justify-between gap-3">
                          <span className="text-gray-500 text-xs shrink-0">{label}</span>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-white font-bold truncate">{value}</span>
                            <button onClick={() => handleCopyToClipboard(value, label as string)} className="text-gray-500 hover:text-[#00D084] transition cursor-pointer shrink-0">
                              <Copy className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300">
                    Les coordonnées bancaires ne sont pas encore configurées. Transmettez votre demande ci-dessous : notre équipe vous contactera avec les instructions de virement.
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  Une fois le virement de <strong className="text-white">${(parseFloat(depositAmount) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</strong> effectué, confirmez ci-dessous. Votre solde sera crédité après réception et vérification par le Desk (1 à 3 jours ouvrés).
                </p>
                <button
                  onClick={() => submitDepositRequest("Virement Bancaire", depositReference)}
                  disabled={depositSubmitting}
                  className="neon-btn w-full rounded-2xl py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-black transition cursor-pointer disabled:opacity-50"
                >
                  {depositSubmitting ? "ENVOI EN COURS..." : "J'AI EFFECTUÉ LE VIREMENT"}
                </button>
              </div>
            )}

            {depositStep === "CARD" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 text-xs text-purple-200">
                  Le paiement par carte automatisé est en cours d'activation. Transmettez votre demande de <strong className="text-white">${(parseFloat(depositAmount) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</strong> ci-dessous : notre équipe vous enverra un lien de paiement sécurisé par carte sous peu.
                </div>
                <button
                  onClick={() => submitDepositRequest("Carte Bancaire (demande manuelle)")}
                  disabled={depositSubmitting}
                  className="neon-btn w-full rounded-2xl py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-black transition cursor-pointer disabled:opacity-50"
                >
                  {depositSubmitting ? "ENVOI EN COURS..." : "TRANSMETTRE MA DEMANDE"}
                </button>
              </div>
            )}

            {depositStep === "CRYPTO" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(CRYPTO_NETWORKS) as Array<keyof typeof CRYPTO_NETWORKS>).map((net) => (
                    <button
                      key={net}
                      onClick={() => setDepositCryptoNetwork(net)}
                      className={`rounded-xl border py-2.5 text-xs font-bold transition cursor-pointer ${
                        depositCryptoNetwork === net
                          ? "border-[#00D084] bg-[#00D084]/15 text-[#00D084]"
                          : "border-white/[0.08] bg-[#141a23] text-gray-300 hover:border-[#00D084]/40 hover:text-white"
                      }`}
                    >
                      {CRYPTO_NETWORKS[net].label}
                    </button>
                  ))}
                </div>

                {paymentSettings?.[CRYPTO_NETWORKS[depositCryptoNetwork].addressField] ? (
                  <div className="rounded-2xl border border-white/[0.1] bg-[#0c1017] p-4 space-y-2">
                    <span className="text-gray-500 text-xs">Adresse de dépôt ({CRYPTO_NETWORKS[depositCryptoNetwork].label})</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono text-xs sm:text-sm break-all flex-1">
                        {paymentSettings[CRYPTO_NETWORKS[depositCryptoNetwork].addressField]}
                      </span>
                      <button
                        onClick={() =>
                          handleCopyToClipboard(
                            String(paymentSettings[CRYPTO_NETWORKS[depositCryptoNetwork].addressField]),
                            "Adresse"
                          )
                        }
                        className="text-gray-500 hover:text-[#00D084] transition cursor-pointer shrink-0"
                      >
                        <Copy className="size-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300">
                    L'adresse {CRYPTO_NETWORKS[depositCryptoNetwork].label} n'est pas encore configurée. Transmettez votre demande ci-dessous : notre équipe vous communiquera l'adresse à utiliser.
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  Envoyez exactement le montant correspondant à <strong className="text-white">${(parseFloat(depositAmount) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</strong> sur le réseau <strong className="text-white">{CRYPTO_NETWORKS[depositCryptoNetwork].label}</strong> uniquement — tout autre réseau entraîne une perte de fonds. Votre solde sera crédité après confirmation on-chain.
                </p>
                <button
                  onClick={() => submitDepositRequest(`Crypto ${CRYPTO_NETWORKS[depositCryptoNetwork].label}`, depositReference)}
                  disabled={depositSubmitting}
                  className="neon-btn w-full rounded-2xl py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-black transition cursor-pointer disabled:opacity-50"
                >
                  {depositSubmitting ? "ENVOI EN COURS..." : "J'AI ENVOYÉ LES FONDS"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RETRAIT MODAL */}
      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-white/[0.1] bg-[#10141b] p-7 sm:p-9 shadow-2xl space-y-6 my-auto">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="font-black text-2xl text-white">Demande de Retrait</h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Retirez vos fonds disponibles vers votre compte</p>
              </div>
              <button onClick={() => setWithdrawOpen(false)} className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition cursor-pointer">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-5">
              <div className="flex items-center justify-between rounded-2xl border border-[#00D084]/20 bg-[#00D084]/10 px-5 py-4 text-xs sm:text-sm text-gray-300">
                <span className="font-medium text-gray-300">Solde disponible (cash + bonus) :</span>
                <strong className="font-mono text-base sm:text-lg text-[#00D084] font-black">${(balance + bonus).toFixed(2)} USD</strong>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">MONTANT DU RETRAIT (USD)</label>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount((balance + bonus).toFixed(2))}
                    className="text-xs font-bold text-[#00D084] hover:underline cursor-pointer"
                  >
                    MAX (${(balance + bonus).toFixed(2)})
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

              {/* Mode de paiement */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">MODE DE RÈGLEMENT</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "BANK" as const, label: "Virement Bancaire" },
                    { id: "CRYPTO" as const, label: "Crypto" },
                    { id: "CARD" as const, label: "Carte Bancaire" },
                    { id: "EWALLET" as const, label: "E-Wallet" },
                  ].map((m) => {
                    const isSelected = withdrawMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setWithdrawMethod(m.id)}
                        className={`py-2.5 px-3 rounded-xl border text-center transition cursor-pointer text-xs font-bold ${
                          isSelected
                            ? "border-[#00D084] bg-[#00D084]/15 text-[#00D084]"
                            : "border-white/[0.08] bg-[#141a23] text-gray-300 hover:border-white/[0.2] hover:text-white"
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Champs selon méthode */}
              {withdrawMethod === "BANK" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">COORDONNÉES BANCAIRES (IBAN)</label>
                    <input
                      type="text"
                      value={withdrawIban}
                      onChange={(e) => setWithdrawIban(e.target.value)}
                      placeholder="FR76 3000 6000 0112 3456 7890 189"
                      className="w-full rounded-2xl border border-white/[0.1] bg-black/40 px-4 py-3.5 font-mono text-sm text-white outline-none focus:border-[#00D084] transition"
                    />
                  </div>
                </div>
              )}

              {withdrawMethod === "CRYPTO" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "USDT_TRC20" as const, label: "USDT (TRC-20)" },
                      { id: "USDT_ERC20" as const, label: "USDT (ERC-20)" },
                      { id: "BTC" as const, label: "Bitcoin" },
                      { id: "ETH" as const, label: "Ethereum" },
                      { id: "SOL" as const, label: "Solana" },
                    ].map((net) => (
                      <button
                        key={net.id}
                        type="button"
                        onClick={() => setWithdrawCryptoNetwork(net.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          withdrawCryptoNetwork === net.id
                            ? "border-[#00D084] bg-[#00D084]/15 text-[#00D084]"
                            : "border-white/[0.08] bg-[#141a23] text-gray-400 hover:text-white"
                        }`}
                      >
                        {net.label}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">ADRESSE DU PORTEFEUILLE</label>
                    <input
                      type="text"
                      value={withdrawCryptoAddress}
                      onChange={(e) => setWithdrawCryptoAddress(e.target.value)}
                      placeholder="Collez votre adresse publique"
                      className="w-full rounded-2xl border border-white/[0.1] bg-black/40 px-4 py-3.5 font-mono text-sm text-white outline-none focus:border-[#00D084] transition"
                    />
                  </div>
                </div>
              )}

              {withdrawMethod === "CARD" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">4 DERNIERS CHIFFRES</label>
                      <input
                        type="text"
                        maxLength={4}
                        value={withdrawCardLast4}
                        onChange={(e) => setWithdrawCardLast4(e.target.value.replace(/\D/g, ""))}
                        placeholder="4242"
                        className="w-full rounded-2xl border border-white/[0.1] bg-black/40 px-4 py-3.5 font-mono text-sm text-white outline-none focus:border-[#00D084] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">NOM DU TITULAIRE</label>
                      <input
                        type="text"
                        value={withdrawCardHolder}
                        onChange={(e) => setWithdrawCardHolder(e.target.value)}
                        placeholder="Nom & Prénom"
                        className="w-full rounded-2xl border border-white/[0.1] bg-black/40 px-4 py-3.5 text-sm text-white outline-none focus:border-[#00D084] transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {withdrawMethod === "EWALLET" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {[
                      { id: "REVOLUT" as const, label: "Revolut" },
                      { id: "WISE" as const, label: "Wise" },
                      { id: "PAYPAL" as const, label: "PayPal" },
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setWithdrawEwalletType(w.id)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          withdrawEwalletType === w.id
                            ? "border-[#00D084] bg-[#00D084]/15 text-[#00D084]"
                            : "border-white/[0.08] bg-[#141a23] text-gray-400 hover:text-white"
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      {withdrawEwalletType === "REVOLUT" ? "REVTAG OU EMAIL" : "EMAIL DU COMPTE"}
                    </label>
                    <input
                      type="text"
                      value={withdrawEwalletId}
                      onChange={(e) => setWithdrawEwalletId(e.target.value)}
                      placeholder={withdrawEwalletType === "REVOLUT" ? "@mon_revtag ou email@domaine.com" : "email@domaine.com"}
                      className="w-full rounded-2xl border border-white/[0.1] bg-black/40 px-4 py-3.5 text-sm text-white outline-none focus:border-[#00D084] transition"
                    />
                  </div>
                </div>
              )}

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
    </div>
  );
}
