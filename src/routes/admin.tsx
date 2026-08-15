import React, { useState, useMemo, useRef, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Award,
  Ban,
  BarChart3,
  Bell,
  BellRing,
  Bookmark,
  Bot,
  Calendar,
  Camera,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Coins,
  Cpu,
  CreditCard,
  Database,
  DollarSign,
  Download,
  Edit3,
  Eye,
  FileCheck,
  FileImage,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  Globe,
  HardDrive,
  Headphones,
  History,
  Image as ImageIcon,
  Inbox,
  Key,
  KeyRound,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Maximize2,
  MessageCircle,
  MessageSquare,
  Mic,
  MoreVertical,
  Newspaper,
  Paperclip,
  Pause,
  Percent,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  PhoneOff,
  Play,
  Plus,
  Power,
  Printer,
  Radio,
  Receipt,
  RefreshCw,
  RotateCcw,
  Scale,
  Search,
  Send,
  Server,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Smile,
  Sparkles,
  Star,
  Terminal,
  Timer,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  User,
  UserCheck,
  UserCog,
  UserMinus,
  UserPlus,
  UserX,
  Users,
  Video,
  Wallet,
  Wifi,
  WifiOff,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: NexiumAdminDashboard,
});

/* ========================================================================= */
/* TYPES & MODÈLES DE DONNÉES                                                */
/* ========================================================================= */

type AdminSystemRole = "SUPER_ADMIN" | "ADMIN" | "SUPPORT" | "FINANCE" | "QUANT";
type AccountStatus = "ACTIVE" | "SUSPENDED" | "REVOKED" | "BANNED";

interface EngineAssignment {
  active: boolean;
  preset: string;
  maxLot: number;
  minScore: number;
  riskCapPercent: number;
}

interface UserTransaction {
  id: string;
  date: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "BONUS" | "PROFIT_SHARE" | "PNL_ADJUST" | "PERF_FEE";
  amount: number;
  status: "COMPLETED" | "PENDING" | "REJECTED";
  method: string;
  note?: string;
}

interface ClientTrade {
  id: string;
  ticket: string;
  symbol: string;
  type: "BUY" | "SELL";
  lots: number;
  openPrice: number;
  closePrice?: number;
  pnl: number;
  openTime: string;
  closeTime?: string;
  engine: "Nexium AI Gold" | "Nexium FX Trend" | "Nexium Index Reversion" | "Ajustement Admin";
  status: "OPEN" | "CLOSED";
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  status: AccountStatus;
  createdAt: string;
  lastActive: string;
  ip: string;
  tempPassword?: string;
  twoFactorEnabled: boolean;
  forcePasswordReset: boolean;
  balance: number;
  bonusCredit: number;
  equity: number;
  // Métriques de Trading & P&L
  todayPnl: number;
  totalNetPnl: number;
  winRatePercent: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  tradesCount: number;
  highWaterMark: number;
  performanceFeeRate: number; // ex: 20%
  pendingPerfFee: number;
  engines: {
    aiGold: EngineAssignment;
    fxTrend: EngineAssignment;
    indexReversion: EngineAssignment;
  };
  mt5: {
    login: string;
    broker: string;
    server: string;
    pingMs: number;
    status: "ONLINE" | "DEGRADED" | "OFFLINE";
  };
  licenseKey: string;
  licenseExpires: string;
  transactions: UserTransaction[];
  trades: ClientTrade[];
  notes: string[];
}

interface StaffAdministrator {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminSystemRole;
  department: "Direction Générale" | "Desk Support & Conseillers" | "Recherche Quantitative" | "Gestion Financière" | "Conformité & Risque";
  status: AccountStatus;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLogin: string;
  lastIp: string;
  permissions: {
    canChatWithClients: boolean;
    canSendEmails: boolean;
    canTakePhoneCalls: boolean;
    canApproveFinances: boolean;
    canManageEngines: boolean;
    canAdjustPnl: boolean;
    canUseKillSwitch: boolean;
  };
}

interface AdminNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: "ESCALATION" | "SECURITY" | "FINANCE" | "ENGINE" | "INFO";
  read: boolean;
  actionRequired?: boolean;
  requestedBy?: string;
  targetUser?: string;
  payload?: {
    actionType: "PNL_ADJUST" | "WITHDRAWAL" | "KILL_SWITCH" | "ENGINE_CHANGE" | "BAN_USER";
    data: any;
  };
}

interface ConfirmationModalState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  dangerLevel: "INFO" | "WARNING" | "CRITICAL";
  onConfirm: () => void;
}

interface EconomicEvent {
  id: string;
  time: string;
  currency: string;
  event: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  forecast: string;
  previous: string;
  actionRequired: boolean;
}

interface BrokerGateway {
  id: string;
  broker: string;
  server: string;
  ip: string;
  latencyMs: number;
  status: "OPTIMAL" | "DEGRADED" | "OFFLINE";
  connectedAccounts: number;
  ticksPerSec: number;
}

interface ChatMessage {
  id: string;
  sender: "CLIENT" | "ADMIN";
  authorName: string;
  channel: "CHAT" | "EMAIL" | "PHONE_NOTE";
  text: string;
  timestamp: string;
  status: "SENT" | "DELIVERED" | "READ";
}

interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  method: "SEPA_IBAN" | "USDT_TRC20" | "CRYPTO_BTC" | "ECN_CARD";
  destination: string;
  date: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  mt5Login: string;
}

interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  method: "SEPA" | "USDT" | "CARD";
  reference: string;
  date: string;
  status: "PENDING" | "CREDITED" | "REJECTED";
  mt5Login: string;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  admin: string;
  action: string;
  targetUser?: string;
  details: string;
}

/* ========================================================================= */
/* PRESETS DE TRADING DISPONIBLES                                            */
/* ========================================================================= */

const GOLD_PRESETS = [
  { id: "gold-conservative", name: "Conservateur (0.25% risque / SL 1.2 ATR)", maxLot: 0.2, minScore: 82 },
  { id: "gold-balanced", name: "Équilibré (0.50% risque / SL 1.5 ATR)", maxLot: 0.5, minScore: 78 },
  { id: "gold-aggressive", name: "Agressif (1.00% risque / SL 2.0 ATR)", maxLot: 1.0, minScore: 74 },
  { id: "gold-propfirm", name: "PropFirm Safe (Max Drawdown 0.30%)", maxLot: 0.3, minScore: 84 },
];

const FX_PRESETS = [
  { id: "fx-momentum", name: "Triple EMA Momentum Standard (0.30% risque)", maxLot: 0.5, minScore: 75 },
  { id: "fx-london", name: "London Breakout Scalp (0.25% risque)", maxLot: 0.4, minScore: 80 },
  { id: "fx-swing", name: "Swing Multi-Paires 4H (0.50% risque)", maxLot: 1.0, minScore: 76 },
  { id: "fx-low-dd", name: "Ultra-Low Drawdown ECN (0.20% risque)", maxLot: 0.3, minScore: 82 },
];

const INDEX_PRESETS = [
  { id: "idx-mean-rev", name: "Mean Reversion 15M (US30 / NAS100)", maxLot: 0.3, minScore: 82 },
  { id: "idx-nyse-vol", name: "Volatilité Open NYSE (0.40% risque)", maxLot: 0.5, minScore: 80 },
  { id: "idx-range", name: "Range Consolidation SPX (0.25% risque)", maxLot: 0.25, minScore: 85 },
];

/* ========================================================================= */
/* DONNÉES INITIALES                                                         */
/* ========================================================================= */

const INITIAL_CLIENTS: UserProfile[] = [
  {
    id: "usr-101",
    name: "Alexandre Dupuis",
    email: "a.dupuis@pro-capital.fr",
    phone: "+33 6 42 19 88 01",
    country: "France 🇫🇷",
    status: "ACTIVE",
    createdAt: "2026-01-20",
    lastActive: "En ligne",
    ip: "82.65.120.4 (Paris, FR)",
    twoFactorEnabled: true,
    forcePasswordReset: false,
    balance: 45200.0,
    bonusCredit: 2500.0,
    equity: 48950.0,
    todayPnl: 1250.0,
    totalNetPnl: 11450.0,
    winRatePercent: 78.4,
    profitFactor: 2.35,
    maxDrawdownPercent: 3.8,
    tradesCount: 142,
    highWaterMark: 45200.0,
    performanceFeeRate: 20, // 20%
    pendingPerfFee: 2290.0,
    engines: {
      aiGold: { active: true, preset: "Équilibré (0.50% risque / SL 1.5 ATR)", maxLot: 0.4, minScore: 78, riskCapPercent: 2.0 },
      fxTrend: { active: true, preset: "London Breakout Scalp (0.25% risque)", maxLot: 0.4, minScore: 80, riskCapPercent: 1.0 },
      indexReversion: { active: false, preset: "Mean Reversion 15M (US30 / NAS100)", maxLot: 0.2, minScore: 82, riskCapPercent: 2.0 },
    },
    mt5: {
      login: "549102",
      broker: "Pepperstone ECN",
      server: "Pepperstone-Edge02",
      pingMs: 14,
      status: "ONLINE",
    },
    licenseKey: "NX-PRO-5491-0211-DUAL-290",
    licenseExpires: "2026-10-15",
    transactions: [
      { id: "tx-1", date: "2026-07-28", type: "DEPOSIT", amount: 45200, status: "COMPLETED", method: "Carte Bancaire ECN" },
      { id: "tx-2", date: "2026-07-28", type: "BONUS", amount: 2500, status: "COMPLETED", method: "Bonus Bienvenue Pro" },
    ],
    trades: [
      { id: "tr-1", ticket: "889101", symbol: "XAUUSD", type: "BUY", lots: 0.35, openPrice: 2412.5, closePrice: 2421.8, pnl: 651.0, openTime: "Aujourd'hui 09:15", closeTime: "Aujourd'hui 11:20", engine: "Nexium AI Gold", status: "CLOSED" },
      { id: "tr-2", ticket: "889102", symbol: "EURUSD", type: "SELL", lots: 0.4, openPrice: 1.0882, closePrice: 1.0845, pnl: 296.0, openTime: "Aujourd'hui 10:05", closeTime: "Aujourd'hui 13:45", engine: "Nexium FX Trend", status: "CLOSED" },
      { id: "tr-3", ticket: "889103", symbol: "XAUUSD", type: "BUY", lots: 0.3, openPrice: 2419.0, pnl: 303.0, openTime: "Aujourd'hui 14:10", engine: "Nexium AI Gold", status: "OPEN" },
    ],
    notes: ["Client Pro Trader actif.", "Préférence pour le trading Gold en session de Londres."],
  },
  {
    id: "usr-102",
    name: "Sarah Benali",
    email: "sarah.benali@geneva-capital.ch",
    phone: "+41 22 780 11 99",
    country: "Suisse 🇨🇭",
    status: "ACTIVE",
    createdAt: "2026-04-10",
    lastActive: "En ligne",
    ip: "185.142.18.91 (Genève, CH)",
    twoFactorEnabled: true,
    forcePasswordReset: false,
    balance: 125000.0,
    bonusCredit: 10000.0,
    equity: 139420.0,
    todayPnl: 4420.0,
    totalNetPnl: 34800.0,
    winRatePercent: 82.1,
    profitFactor: 2.85,
    maxDrawdownPercent: 2.9,
    tradesCount: 310,
    highWaterMark: 125000.0,
    performanceFeeRate: 25, // 25%
    pendingPerfFee: 8700.0,
    engines: {
      aiGold: { active: true, preset: "PropFirm Safe (Max Drawdown 0.30%)", maxLot: 0.8, minScore: 84, riskCapPercent: 1.5 },
      fxTrend: { active: true, preset: "Triple EMA Momentum Standard (0.30% risque)", maxLot: 1.0, minScore: 75, riskCapPercent: 1.5 },
      indexReversion: { active: true, preset: "Mean Reversion 15M (US30 / NAS100)", maxLot: 0.5, minScore: 82, riskCapPercent: 2.0 },
    },
    mt5: {
      login: "880192",
      broker: "IC Markets SC",
      server: "ICMarketsSC-Live04",
      pingMs: 18,
      status: "ONLINE",
    },
    licenseKey: "NX-INST-8801-9210-TRIO-990",
    licenseExpires: "2027-01-01",
    transactions: [
      { id: "tx-4", date: "2026-08-01", type: "DEPOSIT", amount: 125000, status: "COMPLETED", method: "Virement SEPA Banque Cantonale" },
      { id: "tx-5", date: "2026-08-01", type: "BONUS", amount: 10000, status: "COMPLETED", method: "Bonus Institutional Desk" },
    ],
    trades: [
      { id: "tr-4", ticket: "991044", symbol: "US30", type: "BUY", lots: 0.5, openPrice: 39850, closePrice: 40120, pnl: 2700.0, openTime: "Aujourd'hui 08:30", closeTime: "Aujourd'hui 12:00", engine: "Nexium Index Reversion", status: "CLOSED" },
    ],
    notes: ["Compte institutionnel haute priorité."],
  },
];

const INITIAL_GATEWAYS: BrokerGateway[] = [
  { id: "gw-1", broker: "Pepperstone ECN", server: "Pepperstone-Edge02", ip: "194.67.12.8", latencyMs: 14, status: "OPTIMAL", connectedAccounts: 420, ticksPerSec: 184 },
  { id: "gw-2", broker: "IC Markets SC", server: "ICMarketsSC-Live04", ip: "185.142.18.2", latencyMs: 18, status: "OPTIMAL", connectedAccounts: 560, ticksPerSec: 210 },
  { id: "gw-3", broker: "Tickmill Ltd", server: "Tickmill-Live01", ip: "91.204.88.19", latencyMs: 26, status: "DEGRADED", connectedAccounts: 180, ticksPerSec: 92 },
  { id: "gw-4", broker: "Exness Pro", server: "Exness-Real05", ip: "82.65.10.12", latencyMs: 12, status: "OPTIMAL", connectedAccounts: 310, ticksPerSec: 195 },
];

const INITIAL_ECONOMIC_EVENTS: EconomicEvent[] = [
  { id: "ev-1", time: "14:30", currency: "USD", event: "US Non-Farm Payrolls (NFP)", impact: "HIGH", forecast: "185K", previous: "206K", actionRequired: true },
  { id: "ev-2", time: "15:45", currency: "USD", event: "US Services PMI Flash", impact: "MEDIUM", forecast: "54.8", previous: "55.3", actionRequired: false },
  { id: "ev-3", time: "19:00", currency: "USD", event: "FOMC Rate Decision & Press Conference", impact: "HIGH", forecast: "5.25%", previous: "5.25%", actionRequired: true },
];

const INITIAL_STAFF: StaffAdministrator[] = [
  {
    id: "adm-1",
    name: "Ludovic Moreau",
    email: "ludovic.moreau@trading-fund.ch",
    phone: "+41 22 819 44 20",
    role: "SUPER_ADMIN",
    department: "Direction Générale",
    status: "ACTIVE",
    twoFactorEnabled: true,
    createdAt: "2025-10-01",
    lastLogin: "Aujourd'hui à 14:45",
    lastIp: "185.142.18.91 (Genève, CH)",
    permissions: {
      canChatWithClients: true,
      canSendEmails: true,
      canTakePhoneCalls: true,
      canApproveFinances: true,
      canManageEngines: true,
      canAdjustPnl: true,
      canUseKillSwitch: true,
    },
  },
  {
    id: "adm-3",
    name: "Elena Rostova",
    email: "elena.r@nexiummarkets.com",
    phone: "+41 22 990 12 34",
    role: "SUPPORT",
    department: "Desk Support & Conseillers",
    status: "ACTIVE",
    twoFactorEnabled: true,
    createdAt: "2026-02-10",
    lastLogin: "Aujourd'hui à 14:50",
    lastIp: "185.142.18.99 (Genève, CH)",
    permissions: {
      canChatWithClients: true,
      canSendEmails: true,
      canTakePhoneCalls: true,
      canApproveFinances: false,
      canManageEngines: false,
      canAdjustPnl: false,
      canUseKillSwitch: false,
    },
  },
];

const INITIAL_NOTIFICATIONS: AdminNotification[] = [
  {
    id: "notif-1",
    timestamp: "14:52",
    title: "Demande d'Escalade de Privilège",
    message: "Elena Rostova (Support) demande l'approbation d'un ajustement P&L de +$500.00 USD pour Alexandre Dupuis.",
    type: "ESCALATION",
    read: false,
    actionRequired: true,
    requestedBy: "Elena Rostova (Support)",
    targetUser: "Alexandre Dupuis",
    payload: {
      actionType: "PNL_ADJUST",
      data: { userId: "usr-101", amount: 500, direction: "PROFIT", reason: "Compensation Latence VPS" },
    },
  },
];

const INITIAL_CONVERSATIONS: Record<string, ChatMessage[]> = {
  "usr-101": [
    {
      id: "msg-1",
      sender: "CLIENT",
      authorName: "Alexandre Dupuis",
      channel: "CHAT",
      text: "Bonjour l'équipe Nexium, pouvez-vous m'ajuster le preset AI Gold en mode Conservateur sur mon compte IC Markets ?",
      timestamp: "14:20",
      status: "READ",
    },
    {
      id: "msg-2",
      sender: "ADMIN",
      authorName: "Elena Rostova (Desk Support)",
      channel: "CHAT",
      text: "Bonjour Alexandre, c'est bien noté. Le robot applique désormais ce profil pour la session US.",
      timestamp: "14:23",
      status: "READ",
    },
  ],
};

/* ========================================================================= */
/* COMPOSANT PRINCIPAL : ADMINISTRATION NEXIUM                               */
/* ========================================================================= */

export function NexiumAdminDashboard() {
  // Navigation
  const [activeSection, setActiveSection] = useState<
    "administrators" | "users" | "user-detail" | "create-user" | "messaging" | "engines" | "finances" | "gateways" | "news-guard" | "perf-fees" | "analytics" | "logs" | "settings" | "impersonation"
  >("users");

  // Rôle Admin Session
  const [currentSessionRole, setCurrentSessionRole] = useState<AdminSystemRole>("SUPER_ADMIN");

  // Données
  const [clients, setClients] = useState<UserProfile[]>(INITIAL_CLIENTS);
  const [selectedUserId, setSelectedUserId] = useState<string>("usr-101");
  const [staffList, setStaffList] = useState<StaffAdministrator[]>(INITIAL_STAFF);
  const [gateways, setGateways] = useState<BrokerGateway[]>(INITIAL_GATEWAYS);
  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>(INITIAL_ECONOMIC_EVENTS);
  const [newsGuardActive, setNewsGuardActive] = useState<boolean>(true);
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>(INITIAL_CONVERSATIONS);
  const [notifications, setNotifications] = useState<AdminNotification[]>(INITIAL_NOTIFICATIONS);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Modale de Confirmation
  const [confirmModal, setConfirmModal] = useState<ConfirmationModalState>({
    isOpen: false,
    title: "",
    description: "",
    confirmLabel: "Confirmer",
    dangerLevel: "WARNING",
    onConfirm: () => {},
  });

  // Client sous Impersonation
  const [impersonatedClientId, setImpersonatedClientId] = useState<string | null>(null);

  // Recherche & Filtres
  const [clientQuery, setClientQuery] = useState("");
  const [clientStatusFilter, setClientStatusFilter] = useState("ALL");
  const [staffQuery, setStaffQuery] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState("ALL");

  // Messagerie Interactive
  const [activeChatUserId, setActiveChatUserId] = useState<string>("usr-101");
  const [messageInput, setMessageInput] = useState("");
  const [chatChannel, setChatChannel] = useState<"CHAT" | "EMAIL" | "PHONE_NOTE">("CHAT");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Profil Client Sélectionné
  const activeClient = useMemo(() => {
    return clients.find((c) => c.id === selectedUserId) ?? clients[0];
  }, [clients, selectedUserId]);

  const activeChatClient = useMemo(() => {
    return clients.find((c) => c.id === activeChatUserId) ?? clients[0];
  }, [clients, activeChatUserId]);

  const impersonatedClient = useMemo(() => {
    return clients.find((c) => c.id === impersonatedClientId) ?? null;
  }, [clients, impersonatedClientId]);

  // Droits de la session actuelle
  const currentAdminPermissions = useMemo(() => {
    if (currentSessionRole === "SUPER_ADMIN") {
      return {
        canChatWithClients: true,
        canSendEmails: true,
        canTakePhoneCalls: true,
        canApproveFinances: true,
        canManageEngines: true,
        canAdjustPnl: true,
        canUseKillSwitch: true,
      };
    }
    if (currentSessionRole === "SUPPORT") {
      return {
        canChatWithClients: true,
        canSendEmails: true,
        canTakePhoneCalls: true,
        canApproveFinances: false,
        canManageEngines: false,
        canAdjustPnl: false,
        canUseKillSwitch: false,
      };
    }
    return {
      canChatWithClients: true,
      canSendEmails: true,
      canTakePhoneCalls: true,
      canApproveFinances: true,
      canManageEngines: true,
      canAdjustPnl: true,
      canUseKillSwitch: false,
    };
  }, [currentSessionRole]);

  // États d'édition Client
  const [editName, setEditName] = useState(activeClient?.name || "");
  const [editEmail, setEditEmail] = useState(activeClient?.email || "");
  const [editPhone, setEditPhone] = useState(activeClient?.phone || "");
  const [editCountry, setEditCountry] = useState(activeClient?.country || "");
  const [editStatus, setEditStatus] = useState<AccountStatus>(activeClient?.status || "ACTIVE");
  const [newPasswordInput, setNewPasswordInput] = useState("");

  // Presets Client
  const [goldActive, setGoldActive] = useState(activeClient?.engines.aiGold.active ?? true);
  const [goldPreset, setGoldPreset] = useState(activeClient?.engines.aiGold.preset ?? GOLD_PRESETS[0].name);
  const [goldMaxLot, setGoldMaxLot] = useState(activeClient?.engines.aiGold.maxLot ?? 0.5);

  const [fxActive, setFxActive] = useState(activeClient?.engines.fxTrend.active ?? true);
  const [fxPreset, setFxPreset] = useState(activeClient?.engines.fxTrend.preset ?? FX_PRESETS[0].name);
  const [fxMaxLot, setFxMaxLot] = useState(activeClient?.engines.fxTrend.maxLot ?? 0.5);

  const [indexActive, setIndexActive] = useState(activeClient?.engines.indexReversion.active ?? true);
  const [indexPreset, setIndexPreset] = useState(activeClient?.engines.indexReversion.preset ?? INDEX_PRESETS[0].name);
  const [indexMaxLot, setIndexMaxLot] = useState(activeClient?.engines.indexReversion.maxLot ?? 0.5);

  // MT5 Client
  const [mt5Login, setMt5Login] = useState(activeClient?.mt5.login || "");
  const [mt5Broker, setMt5Broker] = useState(activeClient?.mt5.broker || "");
  const [mt5Server, setMt5Server] = useState(activeClient?.mt5.server || "");

  // Finances Client
  const [creditAmountInput, setCreditAmountInput] = useState("");
  const [creditType, setCreditType] = useState<"DEPOSIT" | "BONUS">("DEPOSIT");
  const [creditNote, setCreditNote] = useState("");

  // Ajustement P&L
  const [pnlAdjustAmount, setPnlAdjustAmount] = useState("");
  const [pnlAdjustReason, setPnlAdjustReason] = useState("");
  const [pnlAdjustDirection, setPnlAdjustDirection] = useState<"PROFIT" | "LOSS">("PROFIT");
  const [customTodayPnlInput, setCustomTodayPnlInput] = useState("");

  // Retraits & Dépôts
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([
    { id: "w-101", userId: "usr-101", userName: "Alexandre Dupuis", userEmail: "a.dupuis@pro-capital.fr", amount: 5000, method: "SEPA_IBAN", destination: "FR76 3000 4000 5000 6000 7000 890", date: "Aujourd'hui à 14:15", status: "PENDING", mt5Login: "549102" },
  ]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([
    { id: "dep-201", userId: "usr-101", userName: "Alexandre Dupuis", userEmail: "a.dupuis@pro-capital.fr", amount: 10000, method: "SEPA", reference: "NEX-DEP-991823", date: "Aujourd'hui à 13:40", status: "PENDING", mt5Login: "549102" },
  ]);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([
    { id: "a-1", timestamp: "14:55:02", admin: "Super Admin", action: "MESSAGE_SENT", targetUser: "Alexandre Dupuis", details: "Réponse envoyée au client via le desk support." },
  ]);

  const addAuditLog = (action: string, details: string, targetUser?: string) => {
    const entry: AuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("fr-FR"),
      admin: `Admin (${currentSessionRole})`,
      action,
      targetUser,
      details,
    };
    setAuditLogs((prev) => [entry, ...prev]);
  };

  // Helper pour demander confirmation avant action
  const requestConfirmation = (
    title: string,
    description: string,
    confirmLabel: string,
    dangerLevel: "INFO" | "WARNING" | "CRITICAL",
    action: () => void
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      description,
      confirmLabel,
      dangerLevel,
      onConfirm: () => {
        action();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleOpenClientProfile = (client: UserProfile) => {
    setSelectedUserId(client.id);
    setEditName(client.name);
    setEditEmail(client.email);
    setEditPhone(client.phone);
    setEditCountry(client.country);
    setEditStatus(client.status);
    setNewPasswordInput("");

    setGoldActive(client.engines.aiGold.active);
    setGoldPreset(client.engines.aiGold.preset);
    setGoldMaxLot(client.engines.aiGold.maxLot);

    setFxActive(client.engines.fxTrend.active);
    setFxPreset(client.engines.fxTrend.preset);
    setFxMaxLot(client.engines.fxTrend.maxLot);

    setIndexActive(client.engines.indexReversion.active);
    setIndexPreset(client.engines.indexReversion.preset);
    setIndexMaxLot(client.engines.indexReversion.maxLot);

    setMt5Login(client.mt5.login);
    setMt5Broker(client.mt5.broker);
    setMt5Server(client.mt5.server);

    setCustomTodayPnlInput(client.todayPnl.toString());
    setActiveSection("user-detail");
  };

  // 📄 EXPORT RELEVÉ FISCAL / TRADING (CSV & PDF SIMULÉ)
  const handleExportClientReport = (client: UserProfile, format: "CSV" | "PDF") => {
    const rows = [
      ["Date", "Ticket", "Symbole", "Sens", "Lots", "Prix Entree", "P&L Net ($)", "Robot Executant"],
      ...client.trades.map((t) => [
        t.openTime,
        t.ticket,
        t.symbol,
        t.type,
        t.lots.toString(),
        t.openPrice.toString(),
        t.pnl.toString(),
        t.engine,
      ]),
    ];

    if (format === "CSV") {
      const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Releve_Nexium_${client.name.replace(/\s+/g, "_")}_MT5_${client.mt5.login}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addAuditLog("REPORT_EXPORTED_CSV", `Relevé CSV téléchargé pour ${client.name}.`, client.name);
      toast.success(`Relevé CSV généré pour ${client.name}.`);
    } else {
      addAuditLog("REPORT_EXPORTED_PDF", `Attestation Fiscale & Relevé PDF généré pour ${client.name}.`, client.name);
      toast.success(`Attestation Fiscale & Relevé Officiel générés pour ${client.name}.`);
      window.print();
    }
  };

  // 💰 GESTIONNAIRE DE PERFORMANCE FEES (DÉBIT COMMISSION)
  const handleCollectPerformanceFee = (client: UserProfile) => {
    if (client.pendingPerfFee <= 0) {
      toast.info("Aucune commission de performance en attente.");
      return;
    }

    requestConfirmation(
      `Facturer la Performance Fee de $${client.pendingPerfFee.toLocaleString("fr-FR")} USD`,
      `Cette opération va débiter $${client.pendingPerfFee.toLocaleString("fr-FR")} USD du compte MT5 #${client.mt5.login} de ${client.name} au titre du partage de profits (${client.performanceFeeRate}% du High-Water Mark).`,
      "Prélever la Commission",
      "WARNING",
      () => {
        const feeAmount = client.pendingPerfFee;
        setClients((prev) =>
          prev.map((c) => {
            if (c.id === client.id) {
              const newBalance = Math.max(0, c.balance - feeAmount);
              const newTx: UserTransaction = {
                id: `tx-fee-${Date.now()}`,
                date: new Date().toISOString().split("T")[0],
                type: "PERF_FEE",
                amount: feeAmount,
                status: "COMPLETED",
                method: `Performance Fee (${c.performanceFeeRate}%)`,
                note: `Facture Proforma #FEE-${Math.floor(1000 + Math.random() * 9000)}`,
              };

              return {
                ...c,
                balance: newBalance,
                equity: newBalance + c.bonusCredit,
                pendingPerfFee: 0,
                highWaterMark: c.balance,
                transactions: [newTx, ...c.transactions],
              };
            }
            return c;
          })
        );

        addAuditLog("PERF_FEE_COLLECTED", `Commission de $${feeAmount} USD débitée pour ${client.name}.`, client.name);
        toast.success(`Performance Fee de $${feeAmount.toLocaleString("fr-FR")} USD prélevée avec succès.`);
      }
    );
  };

  // 📡 RECONNEXION FORCÉE DE PASSERELLE MT5
  const handlePingReconnection = (gateway: BrokerGateway) => {
    toast.loading(`Reconnexion au serveur ${gateway.server}...`);
    setTimeout(() => {
      setGateways((prev) =>
        prev.map((g) => (g.id === gateway.id ? { ...g, latencyMs: Math.floor(10 + Math.random() * 8), status: "OPTIMAL" } : g))
      );
      toast.dismiss();
      toast.success(`Passerelle ${gateway.server} reconnectée avec succès.`);
      addAuditLog("GATEWAY_RECONNECTED", `Passerelle ${gateway.server} reconnectée.`);
    }, 800);
  };

  const unreadNotifsCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const totalBalance = useMemo(() => clients.reduce((acc, c) => acc + c.balance, 0), [clients]);
  const totalBonus = useMemo(() => clients.reduce((acc, c) => acc + c.bonusCredit, 0), [clients]);
  const totalPendingFees = useMemo(() => clients.reduce((acc, c) => acc + c.pendingPerfFee, 0), [clients]);

  return (
    <div className="min-h-screen bg-[#07090e] text-gray-100 font-sans selection:bg-[#00D084]/30 flex flex-col text-base antialiased">
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODALE DE CONFIRMATION SÉCURISÉE DES ACTIONS IMPORTANTES                  */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6 animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl border border-white/[0.12] bg-[#10141b] p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-4 border-b border-white/[0.08] pb-5">
              <div className={`grid size-14 place-items-center rounded-2xl ${
                confirmModal.dangerLevel === "CRITICAL"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}>
                <AlertTriangle className="size-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">{confirmModal.title}</h3>
                <span className="text-xs font-mono text-gray-400 uppercase tracking-wider font-bold">Confirmation Requise</span>
              </div>
            </div>

            <p className="text-base text-gray-200 leading-relaxed">{confirmModal.description}</p>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="rounded-2xl border border-white/[0.08] bg-[#0c1017] hover:bg-[#141a23] px-6 py-3.5 text-base font-bold text-gray-300 hover:text-white cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`rounded-2xl px-8 py-3.5 text-base font-black uppercase tracking-wider cursor-pointer shadow-xl ${
                  confirmModal.dangerLevel === "CRITICAL"
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-[#00D084] hover:bg-[#00b271] text-black"
                }`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* TOPBAR : HAUTE LISIBILITÉ & CENTRE DE NOTIFICATIONS                       */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex h-24 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0c1017]/95 px-8 lg:px-10 backdrop-blur-2xl shadow-xl">
        <div className="flex items-center gap-8">
          <Link to="/" className="group flex flex-col justify-center leading-tight cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="font-mono text-3xl font-black tracking-[0.22em] text-white uppercase group-hover:text-[#00D084] transition-colors">
                NEXIUM
              </span>
              <span className="h-6 w-0.5 bg-gradient-to-b from-[#00D084] to-transparent" />
              <span className="text-sm font-extrabold tracking-[0.3em] text-[#00D084] uppercase bg-[#00D084]/10 border border-[#00D084]/30 px-2.5 py-0.5 rounded-lg">
                ADMIN
              </span>
            </div>
            <span className="mt-1 font-sans text-xs font-extrabold tracking-[0.35em] text-gray-400 uppercase">
              OPERATIONS &amp; GOVERNANCE CENTER
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-5">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-3.5 rounded-2xl border border-white/[0.08] bg-[#121722] hover:bg-[#1a2232] text-gray-200 hover:text-white transition cursor-pointer"
            >
              <Bell className="size-6 text-[#00D084]" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 grid size-6 place-items-center rounded-full bg-amber-400 text-xs font-black text-black ring-4 ring-[#0c1017] animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#121722] p-2">
            <span className="text-sm font-bold text-gray-400 px-3 font-mono hidden lg:inline">Rôle :</span>
            {(["SUPER_ADMIN", "ADMIN", "SUPPORT", "FINANCE", "QUANT"] as AdminSystemRole[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setCurrentSessionRole(r);
                  toast.info(`Privilèges basculés sur : ${r}`);
                }}
                className={`rounded-xl px-4 py-2 text-sm font-black font-mono transition cursor-pointer ${
                  currentSessionRole === r
                    ? "bg-[#00D084] text-black shadow-[0_0_20px_rgba(0,208,132,0.35)]"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {r.replace("_", " ")}
              </button>
            ))}
          </div>

          <Link
            to="/NEXIUM"
            className="flex items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-[#121722] hover:bg-[#1a2232] px-5 py-3 text-base font-bold text-gray-200 hover:text-white transition cursor-pointer shadow-md"
          >
            <Eye className="size-5 text-[#00D084]" />
            <span>Tableau Client</span>
          </Link>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* CORPS PRINCIPAL : SIDEBAR + ESPACE CENTRAL                                */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Élargie */}
        <aside className="w-80 shrink-0 border-r border-white/[0.08] bg-[#0c1017] flex flex-col justify-between p-6 space-y-6 overflow-y-auto">
          <div className="space-y-2">
            <p className="text-xs font-black tracking-widest text-gray-400 uppercase px-4 py-2 font-mono">
              MENU DE GOUVERNANCE
            </p>

            <button
              onClick={() => setActiveSection("users")}
              className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-base font-bold transition-all cursor-pointer ${
                activeSection === "users" || activeSection === "user-detail"
                  ? "border border-[#00D084]/40 bg-[#00D084]/15 text-white font-black shadow-[0_0_20px_rgba(0,208,132,0.15)]"
                  : "text-gray-300 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Users className={`size-6 ${activeSection === "users" ? "text-[#00D084]" : "text-gray-400"}`} />
                <span>Comptes Clients &amp; P&amp;L</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSection("messaging")}
              className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-base font-bold transition-all cursor-pointer ${
                activeSection === "messaging"
                  ? "border border-[#00D084]/40 bg-[#00D084]/15 text-white font-black"
                  : "text-gray-300 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <MessageSquare className="size-6 text-gray-400" />
                <span>Messagerie &amp; Desk</span>
              </div>
            </button>

            {/* 🌟 NOUVEAU : Moniteur de Latence Passerelles MT5 */}
            <button
              onClick={() => setActiveSection("gateways")}
              className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-base font-bold transition-all cursor-pointer ${
                activeSection === "gateways"
                  ? "border border-[#00D084]/40 bg-[#00D084]/15 text-white font-black"
                  : "text-gray-300 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Radio className={`size-6 ${activeSection === "gateways" ? "text-[#00D084]" : "text-gray-400"}`} />
                <span>Passerelles &amp; Ping MT5</span>
              </div>
              <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
            </button>

            {/* 🌟 NOUVEAU : Filtre de News Macro (News Guard) */}
            <button
              onClick={() => setActiveSection("news-guard")}
              className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-base font-bold transition-all cursor-pointer ${
                activeSection === "news-guard"
                  ? "border border-[#00D084]/40 bg-[#00D084]/15 text-white font-black"
                  : "text-gray-300 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Newspaper className={`size-6 ${activeSection === "news-guard" ? "text-[#00D084]" : "text-gray-400"}`} />
                <span>News Guard (Macro)</span>
              </div>
              <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-xs text-amber-300 font-mono font-bold">LIVE</span>
            </button>

            {/* 🌟 NOUVEAU : Gestionnaire de Performance Fees */}
            <button
              onClick={() => setActiveSection("perf-fees")}
              className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-base font-bold transition-all cursor-pointer ${
                activeSection === "perf-fees"
                  ? "border border-[#00D084]/40 bg-[#00D084]/15 text-white font-black"
                  : "text-gray-300 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Receipt className={`size-6 ${activeSection === "perf-fees" ? "text-[#00D084]" : "text-gray-400"}`} />
                <span>Performance Fees</span>
              </div>
              <span className="rounded-lg bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-xs font-mono font-bold">
                ${totalPendingFees.toLocaleString("fr-FR")}
              </span>
            </button>

            <button
              onClick={() => setActiveSection("engines")}
              className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-base font-bold transition cursor-pointer ${
                activeSection === "engines" ? "border border-[#00D084]/40 bg-[#00D084]/15 text-white font-black" : "text-gray-300 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Bot className="size-6 text-gray-400" />
                <span>Moteurs &amp; Robots</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSection("finances")}
              className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-base font-bold transition cursor-pointer ${
                activeSection === "finances" ? "border border-[#00D084]/40 bg-[#00D084]/15 text-white font-black" : "text-gray-300 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Wallet className="size-6 text-gray-400" />
                <span>Finances &amp; Retraits</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSection("administrators")}
              className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-base font-bold transition cursor-pointer ${
                activeSection === "administrators" ? "border border-[#00D084]/40 bg-[#00D084]/15 text-white font-black" : "text-gray-300 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <ShieldCheck className="size-6 text-gray-400" />
                <span>Administration &amp; Staff</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSection("logs")}
              className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-base font-bold transition cursor-pointer ${
                activeSection === "logs" ? "border border-[#00D084]/40 bg-[#00D084]/15 text-white font-black" : "text-gray-300 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Terminal className="size-6 text-gray-400" />
                <span>Journal d'Audit</span>
              </div>
            </button>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-5 text-sm font-mono space-y-3 text-gray-300 shadow-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Dépôts :</span>
              <strong className="text-emerald-400 font-black text-lg">${totalBalance.toLocaleString("fr-FR")} USD</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Bonus Accordés :</span>
              <strong className="text-amber-300 font-black text-lg">+${totalBonus.toLocaleString("fr-FR")} USD</strong>
            </div>
          </div>
        </aside>

        {/* Espace Central de Travail Aéré */}
        <main className="flex-1 bg-[#07090e] p-8 lg:p-12 overflow-y-auto max-w-[1700px] mx-auto w-full">
          {/* ===================================================================== */}
          {/* 🌟 1. NOUVEAU MODULE : MONITEUR DE PASSERELLES & PING SERVEUR MT5     */}
          {/* ===================================================================== */}
          {activeSection === "gateways" && (
            <div className="space-y-8 animate-in fade-in duration-150">
              <div className="border-b border-white/[0.08] pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    Passerelles Serveurs &amp; Latence MT5 / VPS
                  </h1>
                  <p className="text-base text-gray-300 mt-1">
                    Supervisez en direct la santé des ponts TCP/IP vers les courtiers ECN et relancez les flux de cotation instantanément.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 font-mono">
                {gateways.map((gw) => (
                  <div key={gw.id} className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 space-y-5 shadow-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-white">{gw.broker}</h3>
                        <span className="text-xs text-gray-400">{gw.server}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        gw.status === "OPTIMAL" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-300"
                      }`}>
                        {gw.status}
                      </span>
                    </div>

                    <div className="space-y-2 bg-[#0c1017] p-4 rounded-2xl text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Latence Ping :</span>
                        <strong className="text-emerald-400 font-bold">{gw.latencyMs} ms</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Flux Ticks/sec :</span>
                        <strong className="text-white">{gw.ticksPerSec} ticks</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Comptes Liés :</span>
                        <strong className="text-gray-200">{gw.connectedAccounts}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePingReconnection(gw)}
                      className="w-full rounded-2xl bg-[#00D084]/15 hover:bg-[#00D084]/25 border border-[#00D084]/40 py-3 text-xs font-black text-[#00D084] uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="size-4" />
                      <span>Reconnexion Forcée</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 2. NOUVEAU MODULE : NEWS GUARD & CALENDRIER ÉCONOMIQUE MACRO        */}
          {/* ===================================================================== */}
          {activeSection === "news-guard" && (
            <div className="space-y-8 animate-in fade-in duration-150">
              <div className="border-b border-white/[0.08] pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    Filtre de News Macroéconomiques (News Guard)
                  </h1>
                  <p className="text-base text-gray-300 mt-1">
                    Protection algorithmique automatique contre la haute volatilité lors des annonces majeures (NFP, CPI, Décisions FED).
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-gray-300 font-mono">Protection Globale :</span>
                  <button
                    onClick={() => {
                      setNewsGuardActive(!newsGuardActive);
                      toast.info(`News Guard ${!newsGuardActive ? "ACTIVÉ" : "DÉSACTIVÉ"}`);
                    }}
                    className={`rounded-2xl px-6 py-3 text-sm font-black uppercase tracking-wider transition cursor-pointer shadow-lg ${
                      newsGuardActive ? "bg-[#00D084] text-black" : "bg-neutral-800 text-gray-400"
                    }`}
                  >
                    {newsGuardActive ? "News Guard ACTIF ✓" : "DÉSACTIVÉ"}
                  </button>
                </div>
              </div>

              {/* Tableau du Calendrier Macro */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#10141b] overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
                  <h3 className="text-xl font-black text-white flex items-center gap-3">
                    <Calendar className="size-6 text-[#00D084]" />
                    Événements Majeurs Aujourd'hui (Session US &amp; EU)
                  </h3>
                  <span className="text-xs font-mono text-gray-400">Pause automatique 15 min avant / après</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-base font-mono">
                    <thead className="border-b border-white/[0.08] bg-[#0c1017] text-gray-400">
                      <tr>
                        <th className="p-5 font-bold">HEURE</th>
                        <th className="p-5 font-bold">DEVISE</th>
                        <th className="p-5 font-bold">ÉVÉNEMENT MACRO</th>
                        <th className="p-5 font-bold">IMPACT</th>
                        <th className="p-5 font-bold">PRÉVISION</th>
                        <th className="p-5 font-bold text-right">ACTION ROBOTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {economicEvents.map((ev) => (
                        <tr key={ev.id} className="hover:bg-[#141a23]/60 transition">
                          <td className="p-5 font-bold text-white">{ev.time}</td>
                          <td className="p-5 text-[#00D084] font-bold">{ev.currency}</td>
                          <td className="p-5 font-sans font-bold text-gray-100">{ev.event}</td>
                          <td className="p-5">
                            <span className={`px-3 py-1 rounded-full text-xs font-black ${
                              ev.impact === "HIGH" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-amber-500/20 text-amber-300"
                            }`}>
                              {ev.impact}
                            </span>
                          </td>
                          <td className="p-5 text-gray-300">{ev.forecast} (Préc: {ev.previous})</td>
                          <td className="p-5 text-right">
                            <span className="rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 px-3.5 py-1.5 text-xs font-bold">
                              Mise en Pause Auto ⏱️
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 3. NOUVEAU MODULE : GESTIONNAIRE DE PERFORMANCE FEES (PARTAGE GAINS) */}
          {/* ===================================================================== */}
          {activeSection === "perf-fees" && (
            <div className="space-y-8 animate-in fade-in duration-150">
              <div className="border-b border-white/[0.08] pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    Facturation &amp; Partage de Profits (Performance Fees)
                  </h1>
                  <p className="text-base text-gray-300 mt-1">
                    Calcul automatique de la commission de surperformance basée sur le High-Water Mark et facturation en un clic.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-3 font-mono">
                  <span className="text-xs text-gray-400 uppercase block font-bold">Total Commissions à Prélever :</span>
                  <strong className="text-2xl font-black text-emerald-400">${totalPendingFees.toLocaleString("fr-FR")} USD</strong>
                </div>
              </div>

              {/* Tableau Performance Fees */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#10141b] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-base font-mono">
                    <thead className="border-b border-white/[0.08] bg-[#0c1017] text-gray-400">
                      <tr>
                        <th className="p-5 font-bold">CLIENT &amp; MT5</th>
                        <th className="p-5 font-bold">SOLDE ACTUEL</th>
                        <th className="p-5 font-bold">GAIN NET GLOBAL</th>
                        <th className="p-5 font-bold">TAUX COMMISSION</th>
                        <th className="p-5 font-bold">MONTANT DÛ</th>
                        <th className="p-5 font-bold text-right">ACTION FACTURATION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {clients.map((c) => (
                        <tr key={c.id} className="hover:bg-[#141a23]/60 transition">
                          <td className="p-5 font-sans">
                            <strong className="text-lg text-white block">{c.name}</strong>
                            <span className="text-xs text-[#00D084] font-mono">MT5 #{c.mt5.login} · {c.mt5.broker}</span>
                          </td>

                          <td className="p-5 text-white font-bold">${c.balance.toLocaleString("fr-FR")} USD</td>
                          <td className="p-5 text-emerald-400 font-bold">+${c.totalNetPnl.toLocaleString("fr-FR")} USD</td>
                          <td className="p-5 text-amber-300 font-bold">{c.performanceFeeRate}%</td>

                          <td className="p-5">
                            <strong className="text-xl font-black text-emerald-400 font-mono">
                              ${c.pendingPerfFee.toLocaleString("fr-FR")} USD
                            </strong>
                          </td>

                          <td className="p-5 text-right">
                            {c.pendingPerfFee > 0 ? (
                              <button
                                onClick={() => handleCollectPerformanceFee(c)}
                                className="rounded-2xl bg-gradient-to-r from-emerald-400 to-[#00D084] hover:from-[#00D084] hover:to-emerald-600 px-6 py-3 text-xs font-black text-black uppercase tracking-wider cursor-pointer shadow-lg"
                              >
                                Prélever Fee ($)
                              </button>
                            ) : (
                              <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-4 py-1.5 text-xs font-bold">
                                ✓ À JOUR
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 4. SECTION COMPTES CLIENTS & EXPORT EN 1 CLIC (CSV / PDF)          */}
          {/* ===================================================================== */}
          {activeSection === "users" && (
            <div className="space-y-8 animate-in fade-in duration-150">
              <div className="border-b border-white/[0.08] pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    Gestion des Comptes Clients &amp; P&amp;L
                  </h1>
                  <p className="text-base text-gray-300 mt-1">
                    Supervisez les portefeuilles, téléchargez les relevés fiscaux et prenez le contrôle en direct des algorithmes.
                  </p>
                </div>
              </div>

              {/* Tableau Clients */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#10141b] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-base font-mono">
                    <thead className="border-b border-white/[0.08] bg-[#0c1017] text-gray-400">
                      <tr>
                        <th className="p-5 font-bold">CLIENT</th>
                        <th className="p-5 font-bold">STATUT</th>
                        <th className="p-5 font-bold">SOLDE &amp; P&amp;L JOUR</th>
                        <th className="p-5 font-bold">GAIN NET GLOBAL</th>
                        <th className="p-5 font-bold text-right">EXPORTS &amp; ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {clients.map((c) => (
                        <tr key={c.id} className="hover:bg-[#141a23]/60 transition">
                          <td className="p-5 font-sans">
                            <p className="font-black text-lg text-white">{c.name}</p>
                            <p className="text-sm text-gray-400 font-mono">{c.email}</p>
                          </td>

                          <td className="p-5">
                            <span className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
                              c.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400"
                            }`}>
                              {c.status}
                            </span>
                          </td>

                          <td className="p-5 font-mono">
                            <span className="font-black text-lg text-white block">
                              ${c.balance.toLocaleString("fr-FR")} USD
                            </span>
                            <span className={`text-sm font-bold block mt-0.5 ${c.todayPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {c.todayPnl >= 0 ? "+" : ""}${c.todayPnl.toLocaleString("fr-FR")} (Aujourd'hui)
                            </span>
                          </td>

                          <td className="p-5 font-mono">
                            <span className="font-bold text-emerald-400 text-lg">
                              +${c.totalNetPnl.toLocaleString("fr-FR")} USD
                            </span>
                          </td>

                          <td className="p-5 text-right space-x-2">
                            {/* Bouton Export CSV */}
                            <button
                              onClick={() => handleExportClientReport(c, "CSV")}
                              className="rounded-2xl border border-white/[0.08] bg-[#0c1017] hover:border-white/[0.2] px-3.5 py-2.5 text-xs font-bold text-gray-300 hover:text-white transition cursor-pointer inline-flex items-center gap-1.5"
                              title="Télécharger Relevé CSV"
                            >
                              <FileSpreadsheet className="size-4 text-emerald-400" />
                              <span>CSV</span>
                            </button>

                            {/* Bouton Attestation PDF */}
                            <button
                              onClick={() => handleExportClientReport(c, "PDF")}
                              className="rounded-2xl border border-white/[0.08] bg-[#0c1017] hover:border-white/[0.2] px-3.5 py-2.5 text-xs font-bold text-gray-300 hover:text-white transition cursor-pointer inline-flex items-center gap-1.5"
                              title="Générer Attestation PDF"
                            >
                              <Printer className="size-4 text-blue-400" />
                              <span>PDF</span>
                            </button>

                            <button
                              onClick={() => handleOpenClientProfile(c)}
                              className="rounded-2xl bg-[#00D084] hover:bg-[#00b271] px-4 py-2.5 text-xs font-black text-black uppercase tracking-wider transition cursor-pointer inline-flex items-center gap-1.5 shadow-md"
                            >
                              <span>Gérer Profil</span>
                              <ChevronRight className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 5. FICHE PROFIL CLIENT                                             */}
          {/* ===================================================================== */}
          {activeSection === "user-detail" && activeClient && (
            <div className="space-y-10 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-6">
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => setActiveSection("users")}
                    className="grid size-12 place-items-center rounded-2xl border border-white/[0.08] bg-[#10141b] hover:bg-[#141a23] text-gray-300 hover:text-white transition cursor-pointer"
                  >
                    <ArrowLeft className="size-6" />
                  </button>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white">{activeClient.name}</h1>
                    <p className="text-sm font-mono text-gray-400 mt-1">MT5 #{activeClient.mt5.login} · {activeClient.mt5.broker}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleExportClientReport(activeClient, "CSV")}
                    className="rounded-2xl border border-white/[0.08] bg-[#10141b] hover:bg-[#141a23] px-5 py-3 text-sm font-bold text-gray-200 hover:text-white transition cursor-pointer flex items-center gap-2"
                  >
                    <Download className="size-4.5 text-[#00D084]" />
                    <span>Exporter CSV</span>
                  </button>

                  <button
                    onClick={() => handleExportClientReport(activeClient, "PDF")}
                    className="rounded-2xl border border-white/[0.08] bg-[#10141b] hover:bg-[#141a23] px-5 py-3 text-sm font-bold text-gray-200 hover:text-white transition cursor-pointer flex items-center gap-2"
                  >
                    <Printer className="size-4.5 text-blue-400" />
                    <span>Imprimer Attestation</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 6. MESSAGERIE, FINANCES, ADMINS, LOGS                              */}
          {/* ===================================================================== */}
          {activeSection === "messaging" && (
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-white">Centre de Messagerie</h2>
              <p className="text-gray-300">Desk de support multi-canal actif.</p>
            </div>
          )}

          {activeSection === "finances" && (
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-white">Finances &amp; Dépôts</h2>
              <p className="text-gray-300">Validation des flux financiers.</p>
            </div>
          )}

          {activeSection === "administrators" && (
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-white">Administration Centrale</h2>
              <p className="text-gray-300">Gestion de l'équipe et des accès.</p>
            </div>
          )}

          {activeSection === "logs" && (
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-white">Journal d'Audit Système</h2>
              <p className="text-gray-300">Traçabilité certifiée de chaque opération.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
