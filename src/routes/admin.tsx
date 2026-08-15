import React, { useState, useMemo } from "react";
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
  Bookmark,
  Bot,
  Calendar,
  Camera,
  Check,
  CheckCheck,
  CheckCircle2,
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
  Laptop,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Maximize2,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Mic,
  MinusCircle,
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
  Trash2,
  TrendingDown,
  TrendingUp,
  Unlock,
  Upload,
  User,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  Video,
  Wallet,
  Wifi,
  X,
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
type KycStatus = "VERIFIED" | "PENDING_REVIEW" | "REJECTED";

interface EngineAssignment {
  active: boolean;
  preset: string;
  maxLot: number;
  minScore: number;
  riskCapPercent: number;
}

interface ClientWithdrawal {
  id: string;
  date: string;
  amount: number;
  method: "SEPA_IBAN" | "USDT_TRC20" | "CRYPTO_BTC" | "ECN_CARD";
  destination: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  processedBy?: string;
  note?: string;
}

interface ClientDeposit {
  id: string;
  date: string;
  amount: number;
  method: "SEPA" | "USDT" | "CARD" | "VIREMENT_BANCAIRE";
  reference: string;
  status: "PENDING" | "CREDITED" | "REJECTED";
  creditedBy?: string;
  note?: string;
}

interface UserTransaction {
  id: string;
  date: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "BONUS" | "PROFIT_SHARE" | "PNL_ADJUST" | "PERF_FEE" | "DEBIT";
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

interface ClientSession {
  id: string;
  device: string;
  ip: string;
  location: string;
  lastActive: string;
  current: boolean;
}

interface CrmNote {
  id: string;
  author: string;
  date: string;
  text: string;
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
  
  kycStatus: KycStatus;
  kycDocuments: {
    idCardName: string;
    proofOfAddressName: string;
    submittedDate: string;
  };
  maxDailyLossPercent: number;
  maxSimultaneousTrades: number;
  riskGuardAutoStop: boolean;
  
  referralCode?: string;
  referrerName?: string;
  assignedAdvisor: string;
  
  sessions: ClientSession[];
  crmNotes: CrmNote[];

  withdrawalRequests: ClientWithdrawal[];
  depositRequests: ClientDeposit[];

  grossProfitTotal: number;
  grossLossTotal: number;
  bestTradePnl: number;
  worstTradePnl: number;
  todayGrossGain: number;
  todayGrossLoss: number;
  todayPnl: number;
  totalNetPnl: number;
  winRatePercent: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  tradesCount: number;
  winningTradesCount: number;
  losingTradesCount: number;
  highWaterMark: number;
  performanceFeeRate: number;
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
    investorPass?: string;
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
  ipWhitelist: string;
  allowedHours: string;
  deskSignature: string;
  assignedAccountsCount: number;
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
  clientId: string;
  sender: "CLIENT" | "ADMIN";
  authorName: string;
  channel: "CHAT" | "EMAIL" | "PHONE_NOTE" | "BROADCAST";
  subject?: string;
  text: string;
  timestamp: string;
  attachment?: {
    type: "IMAGE" | "PDF" | "CSV";
    name: string;
  };
  isRead: boolean;
}

interface CallLog {
  id: string;
  clientId: string;
  clientName: string;
  advisorName: string;
  date: string;
  duration: string;
  outcome: "RÉSOLU" | "RAPPEL_REQUIS" | "EN_ATTENTE";
  notes: string;
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
    
    kycStatus: "VERIFIED",
    kycDocuments: {
      idCardName: "Passeport_Francais_ADupuis.pdf",
      proofOfAddressName: "Facture_EDF_Paris_ADupuis.pdf",
      submittedDate: "2026-01-21",
    },
    maxDailyLossPercent: 3.0,
    maxSimultaneousTrades: 3,
    riskGuardAutoStop: true,
    referralCode: "PRO-PARIS-2026",
    referrerName: "Club Forex Paris",
    assignedAdvisor: "Elena Rostova (Desk Support)",
    
    withdrawalRequests: [
      { id: "w-101", date: "Aujourd'hui à 14:15", amount: 5000, method: "SEPA_IBAN", destination: "FR76 3000 4000 5000 6000 7000 890", status: "PENDING", note: "Retrait des bénéfices du mois de Juillet" },
      { id: "w-102", date: "2026-07-15", amount: 3200, method: "SEPA_IBAN", destination: "FR76 3000 4000 5000 6000 7000 890", status: "APPROVED", processedBy: "Super Admin", note: "Virement SEPA exécuté" },
    ],
    depositRequests: [
      { id: "dep-201", date: "Aujourd'hui à 13:40", amount: 10000, method: "VIREMENT_BANCAIRE", reference: "NEX-DEP-991823", status: "PENDING", note: "Virement reçu sur compte BNP Paribas" },
      { id: "dep-202", date: "2026-01-20", amount: 35200, method: "CARD", reference: "CARD-ECN-11029", status: "CREDITED", creditedBy: "Elena Rostova", note: "Dépôt d'ouverture de compte" },
    ],

    sessions: [
      { id: "s-1", device: "MacBook Pro (Chrome macOS)", ip: "82.65.120.4", location: "Paris, France 🇫🇷", lastActive: "En direct", current: true },
      { id: "s-2", device: "iPhone 15 Pro (Safari iOS)", ip: "82.65.120.4", location: "Paris, France 🇫🇷", lastActive: "Il y a 2h", current: false },
    ],
    crmNotes: [
      { id: "n-1", author: "Elena Rostova", date: "2026-08-10", text: "Client très satisfait des résultats du robot Gold. Préfère les alertes par SMS." },
    ],

    grossProfitTotal: 14850.0,
    grossLossTotal: 3400.0,
    bestTradePnl: 1850.0,
    worstTradePnl: -420.0,
    todayGrossGain: 1450.0,
    todayGrossLoss: -200.0,
    todayPnl: 1250.0,
    totalNetPnl: 11450.0,
    winRatePercent: 78.4,
    profitFactor: 4.36,
    maxDrawdownPercent: 3.8,
    tradesCount: 142,
    winningTradesCount: 111,
    losingTradesCount: 31,
    highWaterMark: 45200.0,
    performanceFeeRate: 20,
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
      investorPass: "InvPepper2026!",
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
    notes: ["Client Pro Trader actif."],
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

    kycStatus: "VERIFIED",
    kycDocuments: {
      idCardName: "ID_Suisse_SBenali.pdf",
      proofOfAddressName: "Banque_Cantonale_Geneve.pdf",
      submittedDate: "2026-04-11",
    },
    maxDailyLossPercent: 2.5,
    maxSimultaneousTrades: 4,
    riskGuardAutoStop: true,
    referralCode: "GENEVA-INST-01",
    referrerName: "Gestion Privée Genève",
    assignedAdvisor: "Dr. Antoine Reynaud (Quant)",

    withdrawalRequests: [
      { id: "w-201", date: "2026-07-20", amount: 15000, method: "SEPA_IBAN", destination: "CH93 0076 2011 6238 5291 1", status: "APPROVED", processedBy: "Super Admin", note: "Virement Banque Cantonale" },
    ],
    depositRequests: [
      { id: "dep-301", date: "2026-04-10", amount: 125000, method: "VIREMENT_BANCAIRE", reference: "BCGE-GEN-9901", status: "CREDITED", creditedBy: "Super Admin", note: "Dépôt initial institutionnel" },
    ],

    sessions: [
      { id: "s-3", device: "iMac 27 (Safari macOS)", ip: "185.142.18.91", location: "Genève, Suisse 🇨🇭", lastActive: "En direct", current: true },
    ],
    crmNotes: [
      { id: "n-3", author: "Dr. Antoine Reynaud", date: "2026-08-05", text: "Compte institutionnel. Volume surveillé par le desk quantitatif." },
    ],

    grossProfitTotal: 42300.0,
    grossLossTotal: 7500.0,
    bestTradePnl: 4800.0,
    worstTradePnl: -850.0,
    todayGrossGain: 4720.0,
    todayGrossLoss: -300.0,
    todayPnl: 4420.0,
    totalNetPnl: 34800.0,
    winRatePercent: 82.1,
    profitFactor: 5.64,
    maxDrawdownPercent: 2.9,
    tradesCount: 310,
    winningTradesCount: 254,
    losingTradesCount: 56,
    highWaterMark: 125000.0,
    performanceFeeRate: 25,
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
      investorPass: "InvIC2026!",
      pingMs: 18,
      status: "ONLINE",
    },
    licenseKey: "NX-INST-8801-9210-TRIO-990",
    licenseExpires: "2027-01-01",
    transactions: [
      { id: "tx-4", date: "2026-08-01", type: "DEPOSIT", amount: 125000, status: "COMPLETED", method: "Virement SEPA Banque Cantonale" },
    ],
    trades: [
      { id: "tr-4", ticket: "991044", symbol: "US30", type: "BUY", lots: 0.5, openPrice: 39850, closePrice: 40120, pnl: 2700.0, openTime: "Aujourd'hui 08:30", closeTime: "Aujourd'hui 12:00", engine: "Nexium Index Reversion", status: "CLOSED" },
    ],
    notes: ["Compte institutionnel haute priorité."],
  },
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
    ipWhitelist: "185.142.18.91, 194.67.12.8",
    allowedHours: "24/7 (Accès Illimité)",
    deskSignature: "Ludovic Moreau — Directeur des Opérations @ Nexium",
    assignedAccountsCount: 240,
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
    id: "adm-2",
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
    ipWhitelist: "185.142.18.99",
    allowedHours: "Lundi-Vendredi 08:00 - 19:00",
    deskSignature: "Elena Rostova — Conseillère Support Clientèle @ Nexium",
    assignedAccountsCount: 180,
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
  {
    id: "adm-3",
    name: "Marc Albarran",
    email: "marc.a@nexiummarkets.com",
    phone: "+41 22 990 12 55",
    role: "FINANCE",
    department: "Gestion Financière",
    status: "ACTIVE",
    twoFactorEnabled: true,
    createdAt: "2026-03-01",
    lastLogin: "Aujourd'hui à 11:20",
    lastIp: "194.67.12.8",
    ipWhitelist: "194.67.12.8",
    allowedHours: "08:00 - 18:00 (Heure Suisse)",
    deskSignature: "Marc Albarran — Responsable Desk Financier @ Nexium",
    assignedAccountsCount: 95,
    permissions: {
      canChatWithClients: true,
      canSendEmails: true,
      canTakePhoneCalls: false,
      canApproveFinances: true,
      canManageEngines: false,
      canAdjustPnl: false,
      canUseKillSwitch: false,
    },
  },
  {
    id: "adm-4",
    name: "Dr. Antoine Reynaud",
    email: "reynaud.quant@nexiummarkets.com",
    phone: "+41 22 990 12 88",
    role: "QUANT",
    department: "Recherche Quantitative",
    status: "ACTIVE",
    twoFactorEnabled: true,
    createdAt: "2025-11-15",
    lastLogin: "Hier à 18:30",
    lastIp: "82.65.120.4",
    ipWhitelist: "82.65.120.4, 185.142.18.91",
    allowedHours: "24/7",
    deskSignature: "Dr. Antoine Reynaud — Lead Quantitative Strategist",
    assignedAccountsCount: 60,
    permissions: {
      canChatWithClients: false,
      canSendEmails: false,
      canTakePhoneCalls: false,
      canApproveFinances: false,
      canManageEngines: true,
      canAdjustPnl: true,
      canUseKillSwitch: true,
    },
  },
];

const INITIAL_GATEWAYS: BrokerGateway[] = [
  { id: "gw-1", broker: "Pepperstone ECN", server: "Pepperstone-Edge02", ip: "194.67.12.8", latencyMs: 14, status: "OPTIMAL", connectedAccounts: 420, ticksPerSec: 184 },
  { id: "gw-2", broker: "IC Markets SC", server: "ICMarketsSC-Live04", ip: "185.142.18.2", latencyMs: 18, status: "OPTIMAL", connectedAccounts: 560, ticksPerSec: 210 },
  { id: "gw-3", broker: "Vantage Raw ECN", server: "VantageFX-Live-01", ip: "104.22.45.19", latencyMs: 22, status: "OPTIMAL", connectedAccounts: 180, ticksPerSec: 145 },
  { id: "gw-4", broker: "FTMO Server Pro", server: "FTMO-Live-US", ip: "172.67.182.90", latencyMs: 38, status: "DEGRADED", connectedAccounts: 90, ticksPerSec: 92 },
];

const INITIAL_ECONOMIC_EVENTS: EconomicEvent[] = [
  { id: "ev-1", time: "14:30", currency: "USD", event: "US Non-Farm Payrolls (NFP)", impact: "HIGH", forecast: "185K", previous: "206K", actionRequired: true },
  { id: "ev-2", time: "16:00", currency: "USD", event: "ISM Services PMI", impact: "HIGH", forecast: "51.4", previous: "48.8", actionRequired: false },
  { id: "ev-3", time: "20:00", currency: "USD", event: "FOMC Meeting Minutes", impact: "HIGH", forecast: "-", previous: "-", actionRequired: true },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: "msg-1", clientId: "usr-101", sender: "CLIENT", authorName: "Alexandre Dupuis", channel: "CHAT", text: "Bonjour, je souhaitais savoir si le robot Gold prendra des positions avant le NFP de 14h30 ?", timestamp: "14:10", isRead: true },
  { id: "msg-2", clientId: "usr-101", sender: "ADMIN", authorName: "Elena Rostova (Desk Support)", channel: "CHAT", text: "Bonjour Alexandre, le système News Guard Macro met automatiquement le robot en pause 15 minutes avant et après l'annonce pour sécuriser votre capital et éviter tout slippage de spread.", timestamp: "14:12", isRead: true },
  { id: "msg-3", clientId: "usr-101", sender: "CLIENT", authorName: "Alexandre Dupuis", channel: "CHAT", text: "Parfait merci ! Et concernant ma demande de retrait de $5,000 USD, vous avez pu la valider ?", timestamp: "14:18", isRead: true },
  { id: "msg-4", clientId: "usr-101", sender: "ADMIN", authorName: "Marc Albarran (Finance Desk)", channel: "CHAT", text: "La demande a été reçue et est en cours d'examen par le service financier. Le virement SEPA sera validé sous peu.", timestamp: "14:20", isRead: true },
  { id: "msg-5", clientId: "usr-102", sender: "CLIENT", authorName: "Sarah Benali", channel: "EMAIL", subject: "Augmentation du plafond de lot sur US30", text: "Bonjour, nous souhaiterions passer le lot max du robot Index Reversion à 1.5 lot sur notre compte institutionnel.", timestamp: "11:45", isRead: false },
];

const INITIAL_CALL_LOGS: CallLog[] = [
  { id: "call-1", clientId: "usr-101", clientName: "Alexandre Dupuis", advisorName: "Elena Rostova", date: "Aujourd'hui à 10:30", duration: "04 min 12 sec", outcome: "RÉSOLU", notes: "Point sur les performances mensuelles de l'algorithme AI Gold (+11.4%). Client satisfait." },
  { id: "call-2", clientId: "usr-102", clientName: "Sarah Benali", advisorName: "Dr. Antoine Reynaud", date: "Hier à 16:15", duration: "12 min 40 sec", outcome: "RÉSOLU", notes: "Revue institutionnelle sur la stratégie Index Reversion et point de latence VPS Genève." },
];

const CANNED_RESPONSES = [
  { title: "🛡️ News Guard NFP / FOMC", text: "Bonjour, conformément à nos règles de gestion du risque, les robots de trading sont automatiquement mis en pause 15 minutes avant et après les annonces macro-économiques majeures afin d'éviter tout décalage de spread." },
  { title: "💳 Procédure de Retrait SEPA", text: "Bonjour, votre demande de retrait a bien été enregistrée par notre desk financier. Le virement vers votre compte bancaire enregistré est exécuté sous un délai standard de 24h ouvrées." },
  { title: "🤖 Optimisation Moteur Gold", text: "Bonjour, le preset Conservateur sur Nexium AI Gold a été calibré avec un stop-loss basé sur l'ATR 1.2 pour préserver votre capital en période de forte volatilité de l'Or." },
  { title: "📄 Confirmation KYC & Pièces", text: "Bonjour, nous vous confirmons la bonne réception et validation de vos pièces justificatives de conformité. Vos plafonds de compte sont désormais débloqués." },
];

/* ========================================================================= */
/* COMPOSANT PRINCIPAL : ADMINISTRATION NEXIUM                               */
/* ========================================================================= */

export function NexiumAdminDashboard() {
  // Navigation
  const [activeSection, setActiveSection] = useState<
    "administrators" | "users" | "user-detail" | "create-user" | "messaging" | "engines" | "finances" | "gateways" | "news-guard" | "perf-fees" | "logs" | "impersonation"
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

  // Messagerie State
  const [messagingTab, setMessagingTab] = useState<"LIVE_CHAT" | "EMAILS" | "VOIP_CALLS" | "BROADCAST">("LIVE_CHAT");
  const [channelFilter, setChannelFilter] = useState<"ALL" | "CHAT" | "EMAIL">("ALL");
  const [messagesList, setMessagesList] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [callLogs, setCallLogs] = useState<CallLog[]>(INITIAL_CALL_LOGS);
  const [chatReplyInput, setChatReplyInput] = useState("");
  const [selectedChannelMode, setSelectedChannelMode] = useState<"CHAT" | "EMAIL">("CHAT");
  const [searchContactQuery, setSearchContactQuery] = useState("");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastAudience, setBroadcastAudience] = useState<"ALL" | "ACTIVE_ONLY" | "GOLD_USERS">("ALL");

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

  // Formulaire Création Admin / Staff
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<AdminSystemRole>("SUPPORT");
  const [newStaffDept, setNewStaffDept] = useState<StaffAdministrator["department"]>("Desk Support & Conseillers");
  const [newStaffIpWhitelist, setNewStaffIpWhitelist] = useState("");
  const [newStaffHours, setNewStaffHours] = useState("Lundi-Vendredi 08:00 - 19:00");
  const [newStaffSignature, setNewStaffSignature] = useState("");
  const [newStaffPermChat, setNewStaffPermChat] = useState(true);
  const [newStaffPermEmail, setNewStaffPermEmail] = useState(true);
  const [newStaffPermPhone, setNewStaffPermPhone] = useState(true);
  const [newStaffPermFinance, setNewStaffPermFinance] = useState(false);
  const [newStaffPermEngines, setNewStaffPermEngines] = useState(false);
  const [newStaffPermPnl, setNewStaffPermPnl] = useState(false);
  const [newStaffPermKillSwitch, setNewStaffPermKillSwitch] = useState(false);

  // Formulaire Création Client
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientCountry, setNewClientCountry] = useState("France 🇫🇷");
  const [newClientDeposit, setNewClientDeposit] = useState("10000");
  const [newClientBonus, setNewClientBonus] = useState("1000");
  const [newClientMt5Login, setNewClientMt5Login] = useState("");
  const [newClientBroker, setNewClientBroker] = useState("Pepperstone ECN");
  const [newClientServer, setNewClientServer] = useState("Pepperstone-Edge02");

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([
    { id: "a-1", timestamp: "14:55:02", admin: "Super Admin", action: "PROFILE_OPENED", targetUser: "Alexandre Dupuis", details: "Consultation du profil client." },
    { id: "a-2", timestamp: "14:50:12", admin: "Elena Rostova", action: "MESSAGE_SENT", targetUser: "Alexandre Dupuis", details: "Réponse sur support direct News Guard." },
  ]);

  // Profil Client Sélectionné
  const activeClient = useMemo(() => {
    return clients.find((c) => c.id === selectedUserId) ?? clients[0];
  }, [clients, selectedUserId]);

  const impersonatedClient = useMemo(() => {
    return clients.find((c) => c.id === impersonatedClientId) ?? null;
  }, [clients, impersonatedClientId]);

  // Messages filtrés pour le client sélectionné
  const activeClientMessages = useMemo(() => {
    return messagesList.filter((m) => m.clientId === activeClient?.id);
  }, [messagesList, activeClient]);

  // Contacts filtrés pour la messagerie
  const filteredContacts = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(searchContactQuery.toLowerCase()) || c.email.toLowerCase().includes(searchContactQuery.toLowerCase()) || c.mt5.login.includes(searchContactQuery);
      return matchSearch;
    });
  }, [clients, searchContactQuery]);

  // États d'édition Client
  const [editName, setEditName] = useState(activeClient?.name || "");
  const [editEmail, setEditEmail] = useState(activeClient?.email || "");
  const [editPhone, setEditPhone] = useState(activeClient?.phone || "");
  const [editCountry, setEditCountry] = useState(activeClient?.country || "");
  const [editStatus, setEditStatus] = useState<AccountStatus>(activeClient?.status || "ACTIVE");
  const [editKycStatus, setEditKycStatus] = useState<KycStatus>(activeClient?.kycStatus || "VERIFIED");
  const [editMaxDailyLoss, setEditMaxDailyLoss] = useState(activeClient?.maxDailyLossPercent || 3.0);
  const [editMaxPositions, setEditMaxPositions] = useState(activeClient?.maxSimultaneousTrades || 3);
  const [editRiskGuardAuto, setEditRiskGuardAuto] = useState(activeClient?.riskGuardAutoStop ?? true);
  const [newCrmNoteText, setNewCrmNoteText] = useState("");
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
  const [mt5InvestorPass, setMt5InvestorPass] = useState(activeClient?.mt5.investorPass || "");

  // Finances Client
  const [creditAmountInput, setCreditAmountInput] = useState("");
  const [creditType, setCreditType] = useState<"DEPOSIT" | "BONUS" | "DEBIT">("DEPOSIT");
  const [creditNote, setCreditNote] = useState("");

  // Ajustement P&L
  const [pnlAdjustAmount, setPnlAdjustAmount] = useState("");
  const [pnlAdjustReason, setPnlAdjustReason] = useState("");
  const [pnlAdjustDirection, setPnlAdjustDirection] = useState<"PROFIT" | "LOSS">("PROFIT");
  const [exactPnlInput, setExactPnlInput] = useState("");

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
    setEditKycStatus(client.kycStatus);
    setEditMaxDailyLoss(client.maxDailyLossPercent);
    setEditMaxPositions(client.maxSimultaneousTrades);
    setEditRiskGuardAuto(client.riskGuardAutoStop);
    setNewPasswordInput("");
    setNewCrmNoteText("");
    setExactPnlInput(client.todayPnl.toString());

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
    setMt5InvestorPass(client.mt5.investorPass || "");

    setActiveSection("user-detail");
  };

  const handleSaveClientProfile = () => {
    if (!activeClient) return;

    setClients((prev) =>
      prev.map((c) => {
        if (c.id === activeClient.id) {
          return {
            ...c,
            name: editName,
            email: editEmail,
            phone: editPhone,
            country: editCountry,
            status: editStatus,
            kycStatus: editKycStatus,
            maxDailyLossPercent: editMaxDailyLoss,
            maxSimultaneousTrades: editMaxPositions,
            riskGuardAutoStop: editRiskGuardAuto,
            tempPassword: newPasswordInput ? newPasswordInput : c.tempPassword,
            engines: {
              aiGold: { ...c.engines.aiGold, active: goldActive, preset: goldPreset, maxLot: goldMaxLot },
              fxTrend: { ...c.engines.fxTrend, active: fxActive, preset: fxPreset, maxLot: fxMaxLot },
              indexReversion: { ...c.engines.indexReversion, active: indexActive, preset: indexPreset, maxLot: indexMaxLot },
            },
            mt5: {
              ...c.mt5,
              login: mt5Login,
              broker: mt5Broker,
              server: mt5Server,
              investorPass: mt5InvestorPass,
            },
          };
        }
        return c;
      })
    );

    addAuditLog("CLIENT_PROFILE_UPDATED", `Profil et paramètres enregistrés pour ${editName}.`, editName);
    toast.success(`Profil, presets et règles enregistrés pour ${editName}.`);
  };

  // Envoi d'un message dans le chat desk
  const handleSendDeskMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatReplyInput.trim() || !activeClient) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      clientId: activeClient.id,
      sender: "ADMIN",
      authorName: `Conseiller Desk (${currentSessionRole})`,
      channel: selectedChannelMode,
      text: chatReplyInput.trim(),
      timestamp: new Date().toLocaleTimeString("fr-FR").slice(0, 5),
      isRead: true,
    };

    setMessagesList((prev) => [...prev, newMsg]);
    addAuditLog("DESK_MESSAGE_SENT", `Message ${selectedChannelMode} transmis à ${activeClient.name}.`, activeClient.name);
    toast.success(`Message transmis à ${activeClient.name} via ${selectedChannelMode}.`);
    setChatReplyInput("");
  };

  // Insertion d'une réponse rapide prédéfinie
  const handleInsertCannedResponse = (text: string) => {
    setChatReplyInput(text);
    toast.info("Modèle inséré dans la zone de réponse.");
  };

  // Envoi d'une diffusion générale (Broadcast)
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject || !broadcastMessage) {
      toast.error("Veuillez remplir l'objet et le corps de l'annonce.");
      return;
    }

    requestConfirmation(
      "Diffuser l'Annonce à Tous les Traders",
      `Êtes-vous certain de vouloir envoyer ce message d'alerte générale (${broadcastAudience}) ? Tous les traders recevront une notification en temps réel.`,
      "Diffuser l'Annonce 📢",
      "WARNING",
      () => {
        addAuditLog("BROADCAST_SENT", `Diffusion générale envoyée : "${broadcastSubject}".`);
        toast.success(`Annonce générale diffusée à l'ensemble des traders connectés.`);
        setBroadcastSubject("");
        setBroadcastMessage("");
      }
    );
  };

  // Création d'un Membre du Staff
  const handleCreateStaffMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) {
      toast.error("Veuillez renseigner au minimum le nom et l'e-mail.");
      return;
    }

    const newStaff: StaffAdministrator = {
      id: `adm-${Date.now()}`,
      name: newStaffName,
      email: newStaffEmail,
      phone: newStaffPhone || "+41 22 000 00 00",
      role: newStaffRole,
      department: newStaffDept,
      status: "ACTIVE",
      twoFactorEnabled: true,
      createdAt: new Date().toISOString().split("T")[0],
      lastLogin: "Jamais connecté",
      lastIp: "-",
      ipWhitelist: newStaffIpWhitelist || "Toutes les adresses IP",
      allowedHours: newStaffHours || "24/7",
      deskSignature: newStaffSignature || `${newStaffName} — @ Nexium Markets`,
      assignedAccountsCount: 0,
      permissions: {
        canChatWithClients: newStaffPermChat,
        canSendEmails: newStaffPermEmail,
        canTakePhoneCalls: newStaffPermPhone,
        canApproveFinances: newStaffPermFinance,
        canManageEngines: newStaffPermEngines,
        canAdjustPnl: newStaffPermPnl,
        canUseKillSwitch: newStaffPermKillSwitch,
      },
    };

    setStaffList((prev) => [newStaff, ...prev]);
    addAuditLog("STAFF_CREATED", `Nouveau membre staff (${newStaffRole}) créé : ${newStaffName}.`);
    toast.success(`Membre du staff ${newStaffName} (${newStaffRole}) créé avec succès.`);
    setNewStaffName("");
    setNewStaffEmail("");
    setNewStaffPhone("");
    setNewStaffIpWhitelist("");
  };

  // Création d'un Client
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientEmail) {
      toast.error("Veuillez renseigner le nom et l'e-mail du client.");
      return;
    }

    const bal = parseFloat(newClientDeposit) || 0;
    const bon = parseFloat(newClientBonus) || 0;

    const newCl: UserProfile = {
      id: `usr-${Date.now()}`,
      name: newClientName,
      email: newClientEmail,
      phone: newClientPhone || "+33 6 00 00 00 00",
      country: newClientCountry,
      status: "ACTIVE",
      createdAt: new Date().toISOString().split("T")[0],
      lastActive: "Nouveau compte",
      ip: "127.0.0.1",
      twoFactorEnabled: false,
      forcePasswordReset: true,
      balance: bal,
      bonusCredit: bon,
      equity: bal + bon,
      kycStatus: "PENDING_REVIEW",
      kycDocuments: {
        idCardName: "Non soumis",
        proofOfAddressName: "Non soumis",
        submittedDate: "-",
      },
      maxDailyLossPercent: 3.0,
      maxSimultaneousTrades: 3,
      riskGuardAutoStop: true,
      assignedAdvisor: "Elena Rostova (Desk Support)",
      sessions: [],
      crmNotes: [],
      withdrawalRequests: [],
      depositRequests: [
        {
          id: `dep-${Date.now()}`,
          date: "Aujourd'hui",
          amount: bal,
          method: "VIREMENT_BANCAIRE",
          reference: `INIT-${Math.floor(100000 + Math.random() * 900000)}`,
          status: "CREDITED",
          creditedBy: `Admin (${currentSessionRole})`,
          note: "Dépôt initial d'ouverture",
        },
      ],
      grossProfitTotal: 0,
      grossLossTotal: 0,
      bestTradePnl: 0,
      worstTradePnl: 0,
      todayGrossGain: 0,
      todayGrossLoss: 0,
      todayPnl: 0,
      totalNetPnl: 0,
      winRatePercent: 0,
      profitFactor: 0,
      maxDrawdownPercent: 0,
      tradesCount: 0,
      winningTradesCount: 0,
      losingTradesCount: 0,
      highWaterMark: bal,
      performanceFeeRate: 20,
      pendingPerfFee: 0,
      engines: {
        aiGold: { active: true, preset: "Conservateur (0.25% risque / SL 1.2 ATR)", maxLot: 0.2, minScore: 82, riskCapPercent: 1.0 },
        fxTrend: { active: false, preset: "Triple EMA Momentum Standard (0.30% risque)", maxLot: 0.5, minScore: 75, riskCapPercent: 1.0 },
        indexReversion: { active: false, preset: "Mean Reversion 15M (US30 / NAS100)", maxLot: 0.25, minScore: 82, riskCapPercent: 1.0 },
      },
      mt5: {
        login: newClientMt5Login || `${Math.floor(100000 + Math.random() * 900000)}`,
        broker: newClientBroker,
        server: newClientServer,
        pingMs: 16,
        status: "ONLINE",
      },
      licenseKey: `NX-PRO-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-INIT`,
      licenseExpires: "2026-12-31",
      transactions: [
        { id: `tx-init-${Date.now()}`, date: new Date().toISOString().split("T")[0], type: "DEPOSIT", amount: bal, status: "COMPLETED", method: "Dépôt initial" },
      ],
      trades: [],
      notes: ["Compte client créé."],
    };

    setClients((prev) => [newCl, ...prev]);
    addAuditLog("CLIENT_CREATED", `Nouveau client créé : ${newClientName}.`, newClientName);
    toast.success(`Client ${newClientName} créé avec succès.`);
    setNewClientName("");
    setNewClientEmail("");
    setActiveSection("users");
  };

  // Validation Retrait
  const handleApproveWithdrawal = (withdrawal: ClientWithdrawal) => {
    requestConfirmation(
      `Valider le Retrait de $${withdrawal.amount.toLocaleString("fr-FR")} USD`,
      `Êtes-vous certain de vouloir approuver ce retrait pour ${activeClient.name} ? Le solde MT5 sera débité de $${withdrawal.amount.toLocaleString("fr-FR")} USD.`,
      "Valider & Débiter les Fonds",
      "WARNING",
      () => {
        setClients((prev) =>
          prev.map((c) => {
            if (c.id === activeClient.id) {
              const newBalance = Math.max(0, c.balance - withdrawal.amount);
              const updatedWithdrawals = c.withdrawalRequests.map((w) =>
                w.id === withdrawal.id ? { ...w, status: "APPROVED" as const, processedBy: `Admin (${currentSessionRole})` } : w
              );

              const newTx: UserTransaction = {
                id: `tx-w-${Date.now()}`,
                date: new Date().toISOString().split("T")[0],
                type: "WITHDRAWAL",
                amount: withdrawal.amount,
                status: "COMPLETED",
                method: withdrawal.method,
                note: `Retrait validé vers ${withdrawal.destination}`,
              };

              return {
                ...c,
                balance: newBalance,
                equity: newBalance + c.bonusCredit,
                withdrawalRequests: updatedWithdrawals,
                transactions: [newTx, ...c.transactions],
              };
            }
            return c;
          })
        );

        addAuditLog("WITHDRAWAL_APPROVED", `Retrait de $${withdrawal.amount} USD validé pour ${activeClient.name}.`, activeClient.name);
        toast.success(`Retrait de $${withdrawal.amount.toLocaleString("fr-FR")} USD validé avec succès.`);
      }
    );
  };

  const handleRejectWithdrawal = (withdrawal: ClientWithdrawal) => {
    requestConfirmation(
      `Rejeter le Retrait de $${withdrawal.amount.toLocaleString("fr-FR")} USD`,
      `Cette demande de retrait pour ${activeClient.name} sera rejetée.`,
      "Rejeter la Demande",
      "CRITICAL",
      () => {
        setClients((prev) =>
          prev.map((c) => {
            if (c.id === activeClient.id) {
              const updatedWithdrawals = c.withdrawalRequests.map((w) =>
                w.id === withdrawal.id ? { ...w, status: "REJECTED" as const, note: "Rejeté par la conformité" } : w
              );
              return { ...c, withdrawalRequests: updatedWithdrawals };
            }
            return c;
          })
        );

        addAuditLog("WITHDRAWAL_REJECTED", `Demande de retrait de $${withdrawal.amount} USD rejetée pour ${activeClient.name}.`, activeClient.name);
        toast.error(`Demande de retrait rejetée.`);
      }
    );
  };

  // Validation Dépôt
  const handleApproveDeposit = (deposit: ClientDeposit) => {
    requestConfirmation(
      `Valider & Créditer le Dépôt de $${deposit.amount.toLocaleString("fr-FR")} USD`,
      `Créditer immédiatement $${deposit.amount.toLocaleString("fr-FR")} USD sur le compte de ${activeClient.name} ?`,
      "Créditer les Fonds",
      "WARNING",
      () => {
        setClients((prev) =>
          prev.map((c) => {
            if (c.id === activeClient.id) {
              const newBalance = c.balance + deposit.amount;
              const updatedDeposits = c.depositRequests.map((d) =>
                d.id === deposit.id ? { ...d, status: "CREDITED" as const, creditedBy: `Admin (${currentSessionRole})` } : d
              );

              const newTx: UserTransaction = {
                id: `tx-d-${Date.now()}`,
                date: new Date().toISOString().split("T")[0],
                type: "DEPOSIT",
                amount: deposit.amount,
                status: "COMPLETED",
                method: deposit.method,
                note: `Dépôt validé (Réf: ${deposit.reference})`,
              };

              return {
                ...c,
                balance: newBalance,
                equity: newBalance + c.bonusCredit,
                depositRequests: updatedDeposits,
                transactions: [newTx, ...c.transactions],
              };
            }
            return c;
          })
        );

        addAuditLog("DEPOSIT_CREDITED", `Dépôt de $${deposit.amount} USD validé et crédité pour ${activeClient.name}.`, activeClient.name);
        toast.success(`Dépôt de $${deposit.amount.toLocaleString("fr-FR")} USD crédité sur le compte.`);
      }
    );
  };

  // Crédit ou Débit Manuel
  const handleCreditOrDebit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(creditAmountInput);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Veuillez saisir un montant valide.");
      return;
    }

    const actionText = creditType === "DEPOSIT" ? "un Dépôt de" : creditType === "BONUS" ? "un Bonus de" : "un Débit forcé de";

    requestConfirmation(
      `Confirmer ${actionText} $${amount.toLocaleString("fr-FR")} USD`,
      `Cette action va impacter le solde du compte de ${activeClient.name}.`,
      "Valider l'Opération",
      "WARNING",
      () => {
        setClients((prev) =>
          prev.map((c) => {
            if (c.id === activeClient.id) {
              let newBalance = c.balance;
              let newBonus = c.bonusCredit;

              if (creditType === "DEPOSIT") newBalance += amount;
              if (creditType === "BONUS") newBonus += amount;
              if (creditType === "DEBIT") newBalance = Math.max(0, newBalance - amount);

              const newTx: UserTransaction = {
                id: `tx-${Date.now()}`,
                date: new Date().toISOString().split("T")[0],
                type: creditType,
                amount,
                status: "COMPLETED",
                method: creditType === "DEPOSIT" ? "Dépôt Réel Desk" : creditType === "BONUS" ? "Bonus Commercial" : "Débit Administratif",
                note: creditNote || "Ajustement Desk",
              };

              return {
                ...c,
                balance: newBalance,
                bonusCredit: newBonus,
                equity: newBalance + newBonus,
                transactions: [newTx, ...c.transactions],
              };
            }
            return c;
          })
        );

        addAuditLog("FINANCIAL_OP", `${actionText} $${amount} USD appliqué à ${activeClient.name}.`, activeClient.name);
        toast.success(`Opération financière effectuée.`);
        setCreditAmountInput("");
        setCreditNote("");
      }
    );
  };

  // Ajustement P&L
  const handleApplyPnlAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(pnlAdjustAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Veuillez saisir un montant valide.");
      return;
    }

    requestConfirmation(
      "Ajustement Financier de P&L",
      `Appliquer ${pnlAdjustDirection === "PROFIT" ? "+ $" : "- $"}${amount.toLocaleString("fr-FR")} USD au compte de ${activeClient.name} ?`,
      "Appliquer l'Ajustement",
      "WARNING",
      () => {
        const signedAmount = pnlAdjustDirection === "PROFIT" ? amount : -amount;
        setClients((prev) =>
          prev.map((c) => {
            if (c.id === activeClient.id) {
              return {
                ...c,
                todayPnl: c.todayPnl + signedAmount,
                totalNetPnl: c.totalNetPnl + signedAmount,
                equity: c.equity + signedAmount,
                balance: c.balance + signedAmount,
              };
            }
            return c;
          })
        );

        addAuditLog("PNL_ADJUSTED", `Ajustement P&L de ${signedAmount > 0 ? "+" : ""}$${signedAmount} USD appliqué à ${activeClient.name}.`, activeClient.name);
        toast.success(`Ajustement P&L appliqué.`);
        setPnlAdjustAmount("");
        setPnlAdjustReason("");
      }
    );
  };

  // Fixer Directement le P&L du Jour
  const handleSetExactTodayPnl = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(exactPnlInput);
    if (isNaN(val)) {
      toast.error("Veuillez saisir une valeur numérique.");
      return;
    }

    requestConfirmation(
      `Fixer le P&L du Jour à ${val >= 0 ? "+$" : "-$"}${Math.abs(val).toLocaleString("fr-FR")} USD`,
      `Cette valeur sera affichée comme résultat officiel pour ${activeClient.name}.`,
      "Fixer le P&L",
      "WARNING",
      () => {
        setClients((prev) =>
          prev.map((c) => (c.id === activeClient.id ? { ...c, todayPnl: val } : c))
        );
        addAuditLog("PNL_OVERRIDE", `P&L du jour fixé à ${val} USD pour ${activeClient.name}.`, activeClient.name);
        toast.success(`P&L du Jour fixé à ${val >= 0 ? "+$" : "-$"}${Math.abs(val).toLocaleString("fr-FR")} USD.`);
      }
    );
  };

  // Gouvernance Rapide
  const handleRevokeClient = () => {
    requestConfirmation(
      `Révoquer les accès de ${activeClient.name}`,
      `Cette action va révoquer la clé de licence MT5 et verrouiller l'accès.`,
      "Révoquer le Compte",
      "CRITICAL",
      () => {
        setClients((prev) => prev.map((c) => (c.id === activeClient.id ? { ...c, status: "REVOKED" } : c)));
        setEditStatus("REVOKED");
        toast.error(`Accès de ${activeClient.name} révoqués.`);
      }
    );
  };

  const handleSuspendClient = () => {
    requestConfirmation(
      `Suspendre le compte de ${activeClient.name}`,
      `Cette action met en pause les 3 moteurs.`,
      "Suspendre le Compte",
      "WARNING",
      () => {
        setClients((prev) => prev.map((c) => (c.id === activeClient.id ? { ...c, status: "SUSPENDED" } : c)));
        setEditStatus("SUSPENDED");
        toast.warning(`Compte de ${activeClient.name} suspendu.`);
      }
    );
  };

  const handleBanClient = () => {
    requestConfirmation(
      `Bannir définitivement ${activeClient.name}`,
      `Cette action bannit le client et coupe toute exécution.`,
      "Bannir Définitivement",
      "CRITICAL",
      () => {
        setClients((prev) => prev.map((c) => (c.id === activeClient.id ? { ...c, status: "BANNED" } : c)));
        setEditStatus("BANNED");
        toast.error(`Client ${activeClient.name} banni.`);
      }
    );
  };

  const handleReactivateClient = () => {
    setClients((prev) => prev.map((c) => (c.id === activeClient.id ? { ...c, status: "ACTIVE" } : c)));
    setEditStatus("ACTIVE");
    toast.success(`Compte de ${activeClient.name} réactivé.`);
  };

  const handleDeleteClient = () => {
    requestConfirmation(
      `Supprimer définitivement le compte de ${activeClient.name}`,
      `Toutes les données de ${activeClient.name} seront supprimées.`,
      "Supprimer Définitivement",
      "CRITICAL",
      () => {
        setClients((prev) => prev.filter((c) => c.id !== activeClient.id));
        toast.error(`Compte ${activeClient.name} supprimé.`);
        setActiveSection("users");
      }
    );
  };

  const handleStartImpersonation = (client: UserProfile) => {
    setImpersonatedClientId(client.id);
    setActiveSection("impersonation");
    toast.success(`Supervision Live activée pour le compte de ${client.name}.`);
  };

  const handleExtendLicense = (months: number) => {
    const newYear = 2026 + (months >= 12 ? 1 : 0);
    const newMonth = months === 1 ? "11" : months === 6 ? "04" : "10";
    const newExp = `${newYear}-${newMonth}-15`;
    setClients((prev) => prev.map((c) => (c.id === activeClient.id ? { ...c, licenseExpires: newExp } : c)));
    toast.success(`Licence prolongée jusqu'au ${newExp}.`);
  };

  const handleGenerateNewLicenseKey = () => {
    const newKey = `NX-PRO-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-DUAL`;
    setClients((prev) => prev.map((c) => (c.id === activeClient.id ? { ...c, licenseKey: newKey } : c)));
    toast.success(`Nouvelle clé de licence générée : ${newKey}`);
  };

  const handleKillAllClientSessions = () => {
    requestConfirmation(
      `Déconnecter toutes les sessions de ${activeClient.name}`,
      `Cette action va invalider tous les jetons d'accès du client.`,
      "Forcer la Déconnexion",
      "WARNING",
      () => {
        setClients((prev) => prev.map((c) => (c.id === activeClient.id ? { ...c, sessions: [] } : c)));
        toast.error(`Toutes les sessions de ${activeClient.name} ont été fermées.`);
      }
    );
  };

  const handleAddCrmNote = () => {
    if (!newCrmNoteText.trim()) return;
    const newNote: CrmNote = {
      id: `note-${Date.now()}`,
      author: `Conseiller (${currentSessionRole})`,
      date: new Date().toISOString().split("T")[0],
      text: newCrmNoteText.trim(),
    };
    setClients((prev) => prev.map((c) => (c.id === activeClient.id ? { ...c, crmNotes: [newNote, ...c.crmNotes] } : c)));
    toast.success("Note confidentielle enregistrée.");
    setNewCrmNoteText("");
  };

  const handleGlobalKillSwitch = () => {
    requestConfirmation(
      "🛑 KILL SWITCH GÉNÉRAL D'URGENCE",
      "Cette action va stopper immédiatement TOUTES les positions ouvertes et mettre en pause l'ensemble des 3 moteurs sur TOUS les comptes clients.",
      "EXÉCUTER LE COUPE-CIRCUIT TOTAL",
      "CRITICAL",
      () => {
        setClients((prev) =>
          prev.map((c) => ({
            ...c,
            status: "SUSPENDED",
            engines: {
              aiGold: { ...c.engines.aiGold, active: false },
              fxTrend: { ...c.engines.fxTrend, active: false },
              indexReversion: { ...c.engines.indexReversion, active: false },
            },
          }))
        );
        addAuditLog("GLOBAL_KILL_SWITCH", "Arrêt d'urgence de tous les robots déclenché.");
        toast.error("🛑 KILL SWITCH DÉCLENCHÉ : Tous les robots sont désormais en pause d'urgence.");
      }
    );
  };

  const totalBalance = useMemo(() => clients.reduce((acc, c) => acc + c.balance, 0), [clients]);
  const totalBonus = useMemo(() => clients.reduce((acc, c) => acc + c.bonusCredit, 0), [clients]);

  return (
    <div className="min-h-screen bg-[#07090e] text-gray-100 font-sans selection:bg-[#00D084]/30 flex flex-col text-base antialiased">
      {/* Modale de Confirmation */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6 animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl border border-white/[0.12] bg-[#10141b] p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-4 border-b border-white/[0.08] pb-5">
              <div className={`grid size-14 place-items-center rounded-2xl ${
                confirmModal.dangerLevel === "CRITICAL" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
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
                  confirmModal.dangerLevel === "CRITICAL" ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-[#00D084] hover:bg-[#00b271] text-black"
                }`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BANDEAU IMPERSONATION */}
      {impersonatedClient && activeSection === "impersonation" && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-black px-8 py-3.5 flex flex-wrap items-center justify-between shadow-2xl font-bold">
          <div className="flex items-center gap-3">
            <span className="size-3.5 rounded-full bg-black animate-ping" />
            <span className="text-base font-black uppercase tracking-wider">
              SUPERVISION LIVE : {impersonatedClient.name} (MT5 #{impersonatedClient.mt5.login})
            </span>
          </div>

          <button
            onClick={() => {
              setImpersonatedClientId(null);
              setActiveSection("users");
              toast.info("Supervision terminée. Retour à l'administration.");
            }}
            className="rounded-xl bg-black text-white px-6 py-2 text-sm font-black uppercase tracking-wider hover:bg-neutral-900 transition cursor-pointer shadow-lg"
          >
            Quitter la Supervision &amp; Retour Admin
          </button>
        </div>
      )}

      {/* TOPBAR */}
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

      {/* CORPS PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 shrink-0 border-r border-white/[0.08] bg-[#0c1017] flex flex-col justify-between p-6 space-y-6 overflow-y-auto">
          <div className="space-y-2">
            <p className="text-xs font-black tracking-widest text-gray-400 uppercase px-4 py-2 font-mono">
              MENU DE GOUVERNANCE
            </p>

            <button
              onClick={() => setActiveSection("users")}
              className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-base font-bold transition-all cursor-pointer ${
                activeSection === "users" || activeSection === "user-detail" || activeSection === "create-user"
                  ? "border border-[#00D084]/40 bg-[#00D084]/15 text-white font-black shadow-[0_0_20px_rgba(0,208,132,0.15)]"
                  : "text-gray-300 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Users className={`size-6 ${activeSection === "users" || activeSection === "user-detail" ? "text-[#00D084]" : "text-gray-400"}`} />
                <span>Comptes Clients &amp; P&amp;L</span>
              </div>
              <span className="text-xs font-mono bg-white/[0.08] px-2 py-0.5 rounded-md text-gray-300 font-bold">{clients.length}</span>
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
              <span className="text-xs font-mono bg-white/[0.08] px-2 py-0.5 rounded-md text-gray-300 font-bold">{staffList.length}</span>
            </button>

            <button
              onClick={() => setActiveSection("messaging")}
              className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-base font-bold transition cursor-pointer ${
                activeSection === "messaging" ? "border border-[#00D084]/40 bg-[#00D084]/15 text-white font-black" : "text-gray-300 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <MessageSquare className="size-6 text-gray-400" />
                <span>Messagerie Multi-Canal</span>
              </div>
              <span className="text-xs font-mono bg-[#00D084]/20 text-[#00D084] px-2 py-0.5 rounded-md font-black">EN DIRECT</span>
            </button>

            <button
              onClick={() => setActiveSection("gateways")}
              className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-base font-bold transition cursor-pointer ${
                activeSection === "gateways" ? "border border-[#00D084]/40 bg-[#00D084]/15 text-white font-black" : "text-gray-300 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Radio className="size-6 text-gray-400" />
                <span>Passerelles MT5 &amp; VPS</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSection("news-guard")}
              className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-base font-bold transition cursor-pointer ${
                activeSection === "news-guard" ? "border border-[#00D084]/40 bg-[#00D084]/15 text-white font-black" : "text-gray-300 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Newspaper className="size-6 text-gray-400" />
                <span>News Guard Macro</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSection("perf-fees")}
              className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-base font-bold transition cursor-pointer ${
                activeSection === "perf-fees" ? "border border-[#00D084]/40 bg-[#00D084]/15 text-white font-black" : "text-gray-300 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Receipt className="size-6 text-gray-400" />
                <span>Performance Fees</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSection("engines")}
              className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-base font-bold transition cursor-pointer ${
                activeSection === "engines" ? "border border-[#00D084]/40 bg-[#00D084]/15 text-white font-black" : "text-gray-300 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Bot className="size-6 text-gray-400" />
                <span>Moteurs &amp; Auto-Trader</span>
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
                <span>Finances &amp; Dépôts</span>
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

        {/* Espace Central */}
        <main className="flex-1 bg-[#07090e] p-8 lg:p-12 overflow-y-auto max-w-[1700px] mx-auto w-full">
          {/* ===================================================================== */}
          {/* 🌟 1. SECTION COMPTES CLIENTS (TABLEAU)                                */}
          {/* ===================================================================== */}
          {activeSection === "users" && (
            <div className="space-y-8 animate-in fade-in duration-150">
              <div className="border-b border-white/[0.08] pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    Gestion des Comptes Clients &amp; P&amp;L
                  </h1>
                  <p className="text-base text-gray-300 mt-1">
                    Supervision complète des clients, cartes de gains/pertes, validation des retraits et dépôts.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveSection("create-user")}
                    className="rounded-2xl bg-[#00D084] hover:bg-[#00b271] px-7 py-3.5 text-sm font-black text-black uppercase tracking-wider transition cursor-pointer shadow-lg flex items-center gap-2"
                  >
                    <Plus className="size-5" />
                    <span>Créer un Client</span>
                  </button>
                </div>
              </div>

              {/* Tableau Clients */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#10141b] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-base font-mono">
                    <thead className="border-b border-white/[0.08] bg-[#0c1017] text-gray-400">
                      <tr>
                        <th className="p-5 font-bold">CLIENT &amp; MT5</th>
                        <th className="p-5 font-bold">STATUT</th>
                        <th className="p-5 font-bold">SOLDE &amp; P&amp;L JOUR</th>
                        <th className="p-5 font-bold">GAIN NET GLOBAL</th>
                        <th className="p-5 font-bold text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {clients.map((c) => (
                        <tr key={c.id} className="hover:bg-[#141a23]/60 transition">
                          <td className="p-5 font-sans">
                            <strong className="text-lg text-white block">{c.name}</strong>
                            <span className="text-sm text-gray-400 font-mono">{c.email}</span>
                            <span className="text-xs text-[#00D084] font-mono block mt-0.5">MT5 #{c.mt5.login} · {c.mt5.broker}</span>
                          </td>

                          <td className="p-5">
                            <span className={`rounded-full px-3.5 py-1 text-xs font-bold block w-fit ${
                              c.status === "ACTIVE"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : c.status === "SUSPENDED"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}>
                              {c.status}
                            </span>
                            <span className="text-xs text-blue-300 font-mono block mt-1">KYC : {c.kycStatus}</span>
                          </td>

                          <td className="p-5 font-mono">
                            <strong className="text-lg text-white block">${c.balance.toLocaleString("fr-FR")} USD</strong>
                            <span className={`text-sm font-bold block ${c.todayPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {c.todayPnl >= 0 ? "+" : ""}${c.todayPnl.toLocaleString("fr-FR")} (Aujourd'hui)
                            </span>
                          </td>

                          <td className="p-5 font-mono">
                            <strong className="text-lg text-emerald-400 block">+${c.totalNetPnl.toLocaleString("fr-FR")} USD</strong>
                            <span className="text-xs text-gray-400">Win Rate: {c.winRatePercent}%</span>
                          </td>

                          <td className="p-5 text-right">
                            <button
                              onClick={() => handleOpenClientProfile(c)}
                              className="rounded-2xl bg-[#00D084] hover:bg-[#00b271] px-5 py-3 text-xs font-black text-black uppercase tracking-wider transition cursor-pointer shadow-md inline-flex items-center gap-1.5"
                            >
                              <span>Ouvrir Fiche Complète</span>
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
          {/* 🌟 2. CRÉATION CLIENT (`create-user`)                                  */}
          {/* ===================================================================== */}
          {activeSection === "create-user" && (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex items-center gap-4 border-b border-white/[0.08] pb-6">
                <button
                  onClick={() => setActiveSection("users")}
                  className="grid size-12 place-items-center rounded-2xl border border-white/[0.08] bg-[#10141b] hover:bg-[#141a23] text-gray-300 hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft className="size-6" />
                </button>
                <div>
                  <h1 className="text-3xl font-black text-white">Créer un Nouveau Compte Client</h1>
                  <p className="text-sm text-gray-400 mt-1">Création de fiche, attribution MT5 et dépôt initial.</p>
                </div>
              </div>

              <form onSubmit={handleCreateClient} className="p-8 rounded-3xl border border-white/[0.08] bg-[#10141b] space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">NOM COMPLET DU CLIENT *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Jean Dupont"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-white outline-none focus:border-[#00D084]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">ADRESSE E-MAIL *</label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: j.dupont@email.com"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-white outline-none focus:border-[#00D084]"
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">TÉLÉPHONE</label>
                    <input
                      type="text"
                      placeholder="+33 6 ..."
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">DÉPÔT INITIAL ($ USD)</label>
                    <input
                      type="number"
                      value={newClientDeposit}
                      onChange={(e) => setNewClientDeposit(e.target.value)}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-white outline-none font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">BONUS COMMERCIAL ($ USD)</label>
                    <input
                      type="number"
                      value={newClientBonus}
                      onChange={(e) => setNewClientBonus(e.target.value)}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-white outline-none font-mono font-bold text-amber-300"
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">LOGIN MT5</label>
                    <input
                      type="text"
                      placeholder="Ex: 550192"
                      value={newClientMt5Login}
                      onChange={(e) => setNewClientMt5Login(e.target.value)}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">BROKER</label>
                    <input
                      type="text"
                      value={newClientBroker}
                      onChange={(e) => setNewClientBroker(e.target.value)}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">SERVEUR BROKER</label>
                    <input
                      type="text"
                      value={newClientServer}
                      onChange={(e) => setNewClientServer(e.target.value)}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-white outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="rounded-2xl bg-[#00D084] hover:bg-[#00b271] px-8 py-4 text-base font-black text-black uppercase tracking-wider transition cursor-pointer shadow-lg"
                >
                  Valider la Création du Client
                </button>
              </form>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 3. FICHE PROFIL CLIENT ENTIÈRE (12 BLOCS CUMULÉS)                  */}
          {/* ===================================================================== */}
          {activeSection === "user-detail" && activeClient && (
            <div className="space-y-10 animate-in fade-in duration-150">
              {/* Header Fiche Client */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-6">
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => setActiveSection("users")}
                    className="grid size-12 place-items-center rounded-2xl border border-white/[0.08] bg-[#10141b] hover:bg-[#141a23] text-gray-300 hover:text-white transition cursor-pointer"
                  >
                    <ArrowLeft className="size-6" />
                  </button>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl sm:text-4xl font-black text-white">{activeClient.name}</h1>
                      <span className={`rounded-full px-3.5 py-1 text-xs font-bold font-mono ${
                        activeClient.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : activeClient.status === "SUSPENDED"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}>
                        {activeClient.status}
                      </span>
                    </div>
                    <p className="text-sm font-mono text-gray-400 mt-1">
                      ID: {activeClient.id} · MT5 #{activeClient.mt5.login} ({activeClient.mt5.broker}) · Conseiller: <strong className="text-[#00D084]">{activeClient.assignedAdvisor}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => handleStartImpersonation(activeClient)}
                    className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-6 py-3 text-sm font-black text-black uppercase tracking-wider transition cursor-pointer shadow-lg flex items-center gap-2"
                  >
                    <UserCheck className="size-5" />
                    <span>Supervision Live</span>
                  </button>

                  <button
                    onClick={handleSaveClientProfile}
                    className="rounded-2xl bg-[#00D084] hover:bg-[#00b271] px-8 py-3 text-sm font-black text-black uppercase tracking-wider transition cursor-pointer shadow-lg flex items-center gap-2"
                  >
                    <Check className="size-5" />
                    Enregistrer les Réglages
                  </button>
                </div>
              </div>

              {/* ── 1. GOUVERNANCE RAPIDE ── */}
              <section className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-6 text-[#00D084]" />
                  <div>
                    <h3 className="font-black text-lg text-white">Gouvernance Rapide du Compte</h3>
                    <p className="text-xs text-gray-400 font-mono">Modifiez l'état opérationnel et l'accès du client en direct.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {activeClient.status !== "ACTIVE" && (
                    <button
                      onClick={handleReactivateClient}
                      className="rounded-2xl bg-emerald-500 hover:bg-emerald-600 px-5 py-2.5 text-xs font-black text-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Unlock className="size-4" />
                      <span>Réactiver le Compte</span>
                    </button>
                  )}

                  {activeClient.status === "ACTIVE" && (
                    <button
                      onClick={handleSuspendClient}
                      className="rounded-2xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-5 py-2.5 text-xs font-bold text-amber-300 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Pause className="size-4" />
                      <span>Suspendre</span>
                    </button>
                  )}

                  {activeClient.status !== "REVOKED" && (
                    <button
                      onClick={handleRevokeClient}
                      className="rounded-2xl border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 px-5 py-2.5 text-xs font-bold text-purple-300 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <MinusCircle className="size-4" />
                      <span>Révoquer</span>
                    </button>
                  )}

                  {activeClient.status !== "BANNED" && (
                    <button
                      onClick={handleBanClient}
                      className="rounded-2xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 px-5 py-2.5 text-xs font-bold text-rose-400 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Ban className="size-4" />
                      <span>Bannir</span>
                    </button>
                  )}

                  <button
                    onClick={handleDeleteClient}
                    className="rounded-2xl border border-rose-900 bg-rose-950/50 hover:bg-rose-900 px-4 py-2.5 text-xs font-bold text-rose-300 transition cursor-pointer flex items-center gap-1.5 ml-auto"
                  >
                    <Trash2 className="size-4" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </section>

              {/* ── 2. CARTES ANALYTIQUES DE GAINS ET DE PERTES ── */}
              <section className="space-y-4">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <BarChart3 className="size-6 text-[#00D084]" />
                  Cartes Analytiques de Gains et de Pertes
                </h2>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 font-mono">
                  <div className="rounded-3xl border border-emerald-500/30 bg-[#10141b] p-6 space-y-3 shadow-xl">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-gray-400 uppercase font-bold">Gains Bruts Cumulés</span>
                      <div className="grid size-9 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400">
                        <TrendingUp className="size-5" />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-emerald-400">
                      +${activeClient.grossProfitTotal.toLocaleString("fr-FR")} USD
                    </p>
                    <div className="flex justify-between text-xs text-gray-400 pt-2 border-t border-white/[0.04]">
                      <span>Trades Gagnants :</span>
                      <strong className="text-white">{activeClient.winningTradesCount} / {activeClient.tradesCount}</strong>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Meilleur Trade :</span>
                      <strong className="text-emerald-400">+${activeClient.bestTradePnl.toLocaleString("fr-FR")} USD</strong>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-rose-500/30 bg-[#10141b] p-6 space-y-3 shadow-xl">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-gray-400 uppercase font-bold">Pertes Brutes Cumulées</span>
                      <div className="grid size-9 place-items-center rounded-xl bg-rose-500/20 text-rose-400">
                        <TrendingDown className="size-5" />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-rose-400">
                      -${activeClient.grossLossTotal.toLocaleString("fr-FR")} USD
                    </p>
                    <div className="flex justify-between text-xs text-gray-400 pt-2 border-t border-white/[0.04]">
                      <span>Trades Perdants :</span>
                      <strong className="text-white">{activeClient.losingTradesCount} / {activeClient.tradesCount}</strong>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Pire Trade :</span>
                      <strong className="text-rose-400">${activeClient.worstTradePnl.toLocaleString("fr-FR")} USD</strong>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 space-y-3 shadow-xl">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-gray-400 uppercase font-bold">P&amp;L du Jour (Net)</span>
                      <div className="grid size-9 place-items-center rounded-xl bg-purple-500/20 text-purple-300">
                        <Scale className="size-5" />
                      </div>
                    </div>
                    <p className={`text-3xl font-black ${activeClient.todayPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {activeClient.todayPnl >= 0 ? "+" : ""}${activeClient.todayPnl.toLocaleString("fr-FR")} USD
                    </p>
                    <div className="flex justify-between text-xs text-gray-400 pt-2 border-t border-white/[0.04]">
                      <span>Gains Jour :</span>
                      <strong className="text-emerald-400">+${activeClient.todayGrossGain.toLocaleString("fr-FR")}</strong>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Pertes Jour :</span>
                      <strong className="text-rose-400">${activeClient.todayGrossLoss.toLocaleString("fr-FR")}</strong>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 space-y-3 shadow-xl">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-gray-400 uppercase font-bold">Profit Factor &amp; Win Rate</span>
                      <div className="grid size-9 place-items-center rounded-xl bg-amber-500/20 text-amber-300">
                        <Award className="size-5" />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-amber-300">
                      {activeClient.profitFactor} <span className="text-sm font-normal text-gray-400 font-mono">Factor</span>
                    </p>
                    <div className="flex justify-between text-xs text-gray-400 pt-2 border-t border-white/[0.04]">
                      <span>Taux de Réussite :</span>
                      <strong className="text-white">{activeClient.winRatePercent}%</strong>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Max Drawdown :</span>
                      <strong className="text-amber-400">{activeClient.maxDrawdownPercent}%</strong>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── 3. HISTORIQUE DES DEMANDES DE RETRAIT & VALIDATION ── */}
              <section className="rounded-3xl border border-amber-500/30 bg-[#10141b] p-8 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-4">
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                      <ArrowUpRight className="size-6 text-amber-400" />
                      Historique des Demandes de Retrait &amp; Validation Desk
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">Examinez et validez les demandes de retraits de fonds de ce client.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-sm">
                    <thead className="border-b border-white/[0.08] bg-[#0c1017] text-gray-400">
                      <tr>
                        <th className="p-4">DATE</th>
                        <th className="p-4">MONTANT ($ USD)</th>
                        <th className="p-4">MÉTHODE &amp; DESTINATION</th>
                        <th className="p-4">STATUT</th>
                        <th className="p-4 text-right">ACTION DE VALIDATION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {activeClient.withdrawalRequests.map((w) => (
                        <tr key={w.id} className="hover:bg-[#141a23]">
                          <td className="p-4 font-bold text-white">{w.date}</td>
                          <td className="p-4 font-black text-lg text-amber-300 font-mono">${w.amount.toLocaleString("fr-FR")} USD</td>
                          <td className="p-4">
                            <span className="font-bold text-white block">{w.method}</span>
                            <span className="text-xs text-gray-400">{w.destination}</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-black ${
                              w.status === "PENDING"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : w.status === "APPROVED"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}>
                              {w.status === "PENDING" ? "EN ATTENTE ⏳" : w.status === "APPROVED" ? "VALIDÉ ✓" : "REJETÉ ✕"}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {w.status === "PENDING" ? (
                              <>
                                <button
                                  onClick={() => handleApproveWithdrawal(w)}
                                  className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-xs font-black text-black uppercase tracking-wider cursor-pointer shadow-md"
                                >
                                  Valider Retrait ✓
                                </button>
                                <button
                                  onClick={() => handleRejectWithdrawal(w)}
                                  className="rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 px-3 py-2 text-xs font-bold text-rose-400 cursor-pointer"
                                >
                                  Rejeter ✕
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 font-mono">
                                {w.processedBy ? `Traité par ${w.processedBy}` : "Traité"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ── 4. HISTORIQUE DES FONDS DÉPOSÉS & VALIDATION / CRÉDIT ── */}
              <section className="rounded-3xl border border-emerald-500/30 bg-[#10141b] p-8 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-4">
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                      <ArrowDownLeft className="size-6 text-emerald-400" />
                      Historique des Fonds Déposés &amp; Validation Crédit
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">Validez les dépôts reçus pour créditer instantanément le compte du client.</p>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-xs text-gray-400 uppercase block">Solde Actuel :</span>
                    <strong className="text-2xl font-black text-emerald-400">${activeClient.balance.toLocaleString("fr-FR")} USD</strong>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-sm">
                    <thead className="border-b border-white/[0.08] bg-[#0c1017] text-gray-400">
                      <tr>
                        <th className="p-4">DATE</th>
                        <th className="p-4">MONTANT DÉPOSÉ ($ USD)</th>
                        <th className="p-4">MÉTHODE &amp; RÉFÉRENCE</th>
                        <th className="p-4">STATUT</th>
                        <th className="p-4 text-right">ACTION DE CRÉDIT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {activeClient.depositRequests.map((d) => (
                        <tr key={d.id} className="hover:bg-[#141a23]">
                          <td className="p-4 font-bold text-white">{d.date}</td>
                          <td className="p-4 font-black text-lg text-emerald-400 font-mono">+${d.amount.toLocaleString("fr-FR")} USD</td>
                          <td className="p-4">
                            <span className="font-bold text-white block">{d.method}</span>
                            <span className="text-xs text-gray-400 font-mono">Réf: {d.reference}</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-black ${
                              d.status === "PENDING"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            }`}>
                              {d.status === "PENDING" ? "EN ATTENTE RÉCEPTION ⏳" : "CRÉDITÉ SUR COMPTE ✓"}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {d.status === "PENDING" ? (
                              <button
                                onClick={() => handleApproveDeposit(d)}
                                className="rounded-xl bg-[#00D084] hover:bg-[#00b271] px-5 py-2 text-xs font-black text-black uppercase tracking-wider cursor-pointer shadow-md"
                              >
                                Valider &amp; Créditer le Compte ✓
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 font-mono">
                                {d.creditedBy ? `Crédité par ${d.creditedBy}` : "Validé"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ── 5. INFORMATIONS PERSONNELLES, ACCÈS & MOT DE PASSE ── */}
              <section className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-8 shadow-xl space-y-6">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <User className="size-6 text-[#00D084]" />
                  Informations Personnelles, Connexion &amp; Sécurité
                </h2>

                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">NOM COMPLET</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-base text-white outline-none focus:border-[#00D084]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">ADRESSE E-MAIL</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-base text-white outline-none focus:border-[#00D084]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">N° TÉLÉPHONE</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-base text-white outline-none focus:border-[#00D084]"
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">PAYS DE RÉSIDENCE</label>
                    <input
                      type="text"
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-base text-white outline-none focus:border-[#00D084]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">MODIFIER MOT DE PASSE</label>
                    <input
                      type="text"
                      placeholder="Nouveau mot de passe client..."
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-base text-white outline-none focus:border-[#00D084]"
                    />
                  </div>

                  <div className="flex flex-col justify-end space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setClients((prev) => prev.map((c) => (c.id === activeClient.id ? { ...c, twoFactorEnabled: false } : c)));
                        toast.success("Double authentification réinitialisée pour ce client.");
                      }}
                      className="rounded-2xl border border-white/[0.08] bg-[#0c1017] hover:bg-[#141a23] p-4 text-xs font-bold text-gray-300 hover:text-white transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Lock className="size-4 text-amber-400" />
                      <span>Réinitialiser 2FA Client</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* ── 6. ATTRIBUTION DES 3 MOTEURS & PRESETS ── */}
              <section className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-8 shadow-xl space-y-6">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <Sliders className="size-6 text-[#00D084]" />
                  Attribution des Moteurs &amp; Stratégies pour {activeClient.name}
                </h2>

                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="rounded-3xl border border-amber-400/30 bg-[#0c1017] p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
                      <h4 className="font-bold text-lg text-white">🥇 Nexium AI Gold</h4>
                      <button
                        type="button"
                        onClick={() => setGoldActive(!goldActive)}
                        className={`rounded-xl px-4 py-1.5 text-xs font-black transition cursor-pointer ${
                          goldActive ? "bg-amber-400 text-black shadow-md" : "bg-[#10141b] text-gray-400 border border-white/[0.08]"
                        }`}
                      >
                        {goldActive ? "ACTIF ✓" : "DÉSACTIVÉ"}
                      </button>
                    </div>

                    <div className="space-y-3 text-sm font-mono">
                      <label className="block text-gray-400 text-xs uppercase font-bold">PRESET ATTRIBUÉ :</label>
                      <select
                        value={goldPreset}
                        onChange={(e) => setGoldPreset(e.target.value)}
                        className="w-full rounded-2xl border border-white/[0.08] bg-[#10141b] p-3 text-white text-sm outline-none focus:border-amber-400"
                      >
                        {GOLD_PRESETS.map((p) => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-gray-400 text-xs font-bold">LOT MAXIMUM :</span>
                        <input
                          type="number"
                          step="0.05"
                          value={goldMaxLot}
                          onChange={(e) => setGoldMaxLot(parseFloat(e.target.value) || 0.1)}
                          className="w-24 rounded-xl border border-white/[0.08] bg-[#10141b] p-2 text-right text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-blue-400/30 bg-[#0c1017] p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
                      <h4 className="font-bold text-lg text-white">📈 Nexium FX Trend</h4>
                      <button
                        type="button"
                        onClick={() => setFxActive(!fxActive)}
                        className={`rounded-xl px-4 py-1.5 text-xs font-black transition cursor-pointer ${
                          fxActive ? "bg-blue-400 text-black shadow-md" : "bg-[#10141b] text-gray-400 border border-white/[0.08]"
                        }`}
                      >
                        {fxActive ? "ACTIF ✓" : "DÉSACTIVÉ"}
                      </button>
                    </div>

                    <div className="space-y-3 text-sm font-mono">
                      <label className="block text-gray-400 text-xs uppercase font-bold">PRESET ATTRIBUÉ :</label>
                      <select
                        value={fxPreset}
                        onChange={(e) => setFxPreset(e.target.value)}
                        className="w-full rounded-2xl border border-white/[0.08] bg-[#10141b] p-3 text-white text-sm outline-none focus:border-blue-400"
                      >
                        {FX_PRESETS.map((p) => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-gray-400 text-xs font-bold">LOT MAXIMUM :</span>
                        <input
                          type="number"
                          step="0.05"
                          value={fxMaxLot}
                          onChange={(e) => setFxMaxLot(parseFloat(e.target.value) || 0.1)}
                          className="w-24 rounded-xl border border-white/[0.08] bg-[#10141b] p-2 text-right text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-purple-400/30 bg-[#0c1017] p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
                      <h4 className="font-bold text-lg text-white">⚡ Index Reversion</h4>
                      <button
                        type="button"
                        onClick={() => setIndexActive(!indexActive)}
                        className={`rounded-xl px-4 py-1.5 text-xs font-black transition cursor-pointer ${
                          indexActive ? "bg-purple-400 text-black shadow-md" : "bg-[#10141b] text-gray-400 border border-white/[0.08]"
                        }`}
                      >
                        {indexActive ? "ACTIF ✓" : "DÉSACTIVÉ"}
                      </button>
                    </div>

                    <div className="space-y-3 text-sm font-mono">
                      <label className="block text-gray-400 text-xs uppercase font-bold">PRESET ATTRIBUÉ :</label>
                      <select
                        value={indexPreset}
                        onChange={(e) => setIndexPreset(e.target.value)}
                        className="w-full rounded-2xl border border-white/[0.08] bg-[#10141b] p-3 text-white text-sm outline-none focus:border-purple-400"
                      >
                        {INDEX_PRESETS.map((p) => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-gray-400 text-xs font-bold">LOT MAXIMUM :</span>
                        <input
                          type="number"
                          step="0.05"
                          value={indexMaxLot}
                          onChange={(e) => setIndexMaxLot(parseFloat(e.target.value) || 0.1)}
                          className="w-24 rounded-xl border border-white/[0.08] bg-[#10141b] p-2 text-right text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── 7. COMPTE MT5 DU CLIENT ── */}
              <section className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-8 shadow-xl space-y-6">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <HardDrive className="size-6 text-[#00D084]" />
                  Paramètres du Compte Broker &amp; Terminal MT5
                </h2>

                <div className="grid gap-6 sm:grid-cols-4 font-mono text-sm">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2">LOGIN MT5</label>
                    <input
                      type="text"
                      value={mt5Login}
                      onChange={(e) => setMt5Login(e.target.value)}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-base text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2">COURTIER (BROKER)</label>
                    <input
                      type="text"
                      value={mt5Broker}
                      onChange={(e) => setMt5Broker(e.target.value)}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-base text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2">SERVEUR BROKER</label>
                    <input
                      type="text"
                      value={mt5Server}
                      onChange={(e) => setMt5Server(e.target.value)}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-base text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2">MOT DE PASSE INVESTISSEUR</label>
                    <input
                      type="text"
                      value={mt5InvestorPass}
                      onChange={(e) => setMt5InvestorPass(e.target.value)}
                      placeholder="Lecture seule MT5..."
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-base text-white outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* ── 8. CRÉDIT / DÉBIT FINANCIER & AJUSTEMENT DU P&L ── */}
              <section className="rounded-3xl border border-[#00D084]/40 bg-[#10141b] p-8 shadow-xl space-y-6">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <Wallet className="size-6 text-[#00D084]" />
                  Gestion Financière &amp; Ajustements P&amp;L du Desk
                </h2>

                <div className="grid gap-8 lg:grid-cols-2">
                  <form onSubmit={handleCreditOrDebit} className="p-6 rounded-3xl border border-white/[0.08] bg-[#0c1017] space-y-4">
                    <h3 className="text-base font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <DollarSign className="size-5 text-[#00D084]" />
                      Opération Directe de Solde
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 font-mono">TYPE D'OPÉRATION</label>
                        <select
                          value={creditType}
                          onChange={(e) => setCreditType(e.target.value as any)}
                          className="w-full rounded-2xl border border-white/[0.08] bg-[#10141b] p-3.5 text-sm text-white font-bold outline-none"
                        >
                          <option value="DEPOSIT">💰 Créditer Dépôt Réel (+)</option>
                          <option value="BONUS">🎁 Attribuer Bonus Commercial (+)</option>
                          <option value="DEBIT">🔻 Débit Forcé (-)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 font-mono">MONTANT ($ USD)</label>
                        <input
                          type="number"
                          placeholder="Ex: 5000"
                          value={creditAmountInput}
                          onChange={(e) => setCreditAmountInput(e.target.value)}
                          className="w-full rounded-2xl border border-white/[0.08] bg-[#10141b] p-3.5 text-base text-white font-mono outline-none focus:border-[#00D084]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 font-mono">MOTIF DE L'OPÉRATION</label>
                      <input
                        type="text"
                        placeholder="Ex: Dépôt virement bancaire #99218"
                        value={creditNote}
                        onChange={(e) => setCreditNote(e.target.value)}
                        className="w-full rounded-2xl border border-white/[0.08] bg-[#10141b] p-3.5 text-sm text-white outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-2xl bg-[#00D084] hover:bg-[#00b271] py-3.5 text-sm font-black text-black uppercase tracking-wider transition cursor-pointer shadow-lg"
                    >
                      Exécuter l'Écriture Financière ($)
                    </button>
                  </form>

                  <form onSubmit={handleApplyPnlAdjustment} className="p-6 rounded-3xl border border-amber-500/30 bg-[#0c1017] space-y-4">
                    <h3 className="text-base font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <Scale className="size-5 text-amber-400" />
                      Ajustement P&amp;L / Pertes ou Gains du Jour
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 font-mono">DIRECTION</label>
                        <select
                          value={pnlAdjustDirection}
                          onChange={(e) => setPnlAdjustDirection(e.target.value as any)}
                          className="w-full rounded-2xl border border-white/[0.08] bg-[#10141b] p-3.5 text-sm text-white font-bold outline-none"
                        >
                          <option value="PROFIT">📈 Ajouter Gain (+)</option>
                          <option value="LOSS">📉 Appliquer Perte (-)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 font-mono">MONTANT ($ USD)</label>
                        <input
                          type="number"
                          placeholder="Ex: 500"
                          value={pnlAdjustAmount}
                          onChange={(e) => setPnlAdjustAmount(e.target.value)}
                          className="w-full rounded-2xl border border-white/[0.08] bg-[#10141b] p-3.5 text-base text-white font-mono outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 font-mono">MOTIF DE L'AJUSTEMENT</label>
                      <input
                        type="text"
                        placeholder="Ex: Slippage MT5 / Compensation Latence"
                        value={pnlAdjustReason}
                        onChange={(e) => setPnlAdjustReason(e.target.value)}
                        className="w-full rounded-2xl border border-white/[0.08] bg-[#10141b] p-3.5 text-sm text-white outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-2xl bg-amber-400 hover:bg-amber-500 py-3.5 text-sm font-black text-black uppercase tracking-wider transition cursor-pointer shadow-lg"
                    >
                      Appliquer l'Ajustement de P&amp;L
                    </button>
                  </form>
                </div>
              </section>

              {/* ── 9. JOURNAL DES TRADES EN TEMPS RÉEL ── */}
              <section className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-8 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-4">
                  <h2 className="text-xl font-black text-white flex items-center gap-3">
                    <History className="size-6 text-[#00D084]" />
                    Journal des Trades en Direct &amp; Fixation P&amp;L du Jour
                  </h2>

                  <form onSubmit={handleSetExactTodayPnl} className="flex items-center gap-3 font-mono">
                    <span className="text-xs text-gray-400 uppercase font-bold">Fixer P&amp;L du Jour ($):</span>
                    <input
                      type="number"
                      placeholder="Ex: 1250"
                      value={exactPnlInput}
                      onChange={(e) => setExactPnlInput(e.target.value)}
                      className="w-28 rounded-xl border border-white/[0.08] bg-[#0c1017] p-2 text-sm text-emerald-400 font-bold outline-none"
                    />
                    <button type="submit" className="rounded-xl bg-[#00D084] hover:bg-[#00b271] px-4 py-2 text-xs font-black text-black uppercase cursor-pointer">
                      Fixer P&amp;L
                    </button>
                  </form>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-sm">
                    <thead className="border-b border-white/[0.08] text-gray-400">
                      <tr>
                        <th className="p-3">TICKET</th>
                        <th className="p-3">SYMBOLE</th>
                        <th className="p-3">SENS</th>
                        <th className="p-3">VOLUME</th>
                        <th className="p-3">PRIX ENTRÉE</th>
                        <th className="p-3">MOTEUR</th>
                        <th className="p-3 text-right">P&amp;L NET</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {activeClient.trades.map((tr) => (
                        <tr key={tr.id} className="hover:bg-[#0c1017]">
                          <td className="p-3 font-bold text-white">#{tr.ticket}</td>
                          <td className="p-3 text-[#00D084] font-bold">{tr.symbol}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${tr.type === "BUY" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                              {tr.type}
                            </span>
                          </td>
                          <td className="p-3 text-gray-200">{tr.lots} lot</td>
                          <td className="p-3 text-gray-300">{tr.openPrice}</td>
                          <td className="p-3 text-xs text-gray-400 font-sans">{tr.engine}</td>
                          <td className="p-3 text-right">
                            <strong className={`font-black ${tr.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {tr.pnl >= 0 ? "+" : ""}${tr.pnl.toLocaleString("fr-FR")} USD
                            </strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ── 10. GESTION DES LICENCES & EXPIRATIONS ── */}
              <section className="rounded-3xl border border-purple-500/30 bg-[#10141b] p-8 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-4">
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                      <Key className="size-6 text-purple-400" />
                      Gestion de la Licence MT5 &amp; Expirations
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">Clé active : <strong className="text-white font-mono">{activeClient.licenseKey}</strong></p>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-xs text-gray-400 uppercase block">Expire le :</span>
                    <strong className="text-lg text-purple-300 font-bold">{activeClient.licenseExpires}</strong>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-mono font-bold text-gray-400 uppercase">Prolonger la licence :</span>
                  <button onClick={() => handleExtendLicense(1)} className="rounded-2xl border border-white/[0.08] bg-[#0c1017] hover:bg-[#141a23] px-4 py-2.5 text-xs font-bold text-white cursor-pointer">+1 Mois</button>
                  <button onClick={() => handleExtendLicense(6)} className="rounded-2xl border border-white/[0.08] bg-[#0c1017] hover:bg-[#141a23] px-4 py-2.5 text-xs font-bold text-white cursor-pointer">+6 Mois</button>
                  <button onClick={() => handleExtendLicense(12)} className="rounded-2xl border border-white/[0.08] bg-[#0c1017] hover:bg-[#141a23] px-4 py-2.5 text-xs font-bold text-white cursor-pointer">+1 An</button>
                  <button onClick={handleGenerateNewLicenseKey} className="rounded-2xl bg-purple-500/20 border border-purple-500/40 hover:bg-purple-500/30 px-5 py-2.5 text-xs font-bold text-purple-300 cursor-pointer ml-auto">
                    Générer Nouvelle Clé MT5 🔑
                  </button>
                </div>
              </section>

              {/* ── 11. CONFORMITÉ KYC & RISK GUARD ── */}
              <section className="rounded-3xl border border-blue-500/30 bg-[#10141b] p-8 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-4">
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                      <FileCheck className="size-6 text-blue-400" />
                      Conformité KYC &amp; Coupe-Circuit Personnalisé
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">Vérification documentaire et plafonds de perte par compte.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={editKycStatus}
                      onChange={(e) => setEditKycStatus(e.target.value as KycStatus)}
                      className="rounded-2xl border border-white/[0.08] bg-[#0c1017] px-5 py-3 text-sm font-bold text-white font-mono outline-none"
                    >
                      <option value="VERIFIED">🟢 VÉRIFIÉ</option>
                      <option value="PENDING_REVIEW">🟡 EN REVUE</option>
                      <option value="REJECTED">🔴 REJETÉ</option>
                    </select>

                    <button
                      onClick={() => {
                        setEditKycStatus("VERIFIED");
                        toast.success("Dossier KYC validé.");
                      }}
                      className="rounded-2xl bg-blue-500 hover:bg-blue-600 px-6 py-3 text-xs font-black text-white uppercase cursor-pointer"
                    >
                      Valider KYC ✓
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-3 text-sm font-mono">
                  <div className="p-5 rounded-2xl bg-[#0c1017] border border-white/[0.06] space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase">MAX DAILY LOSS (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editMaxDailyLoss}
                      onChange={(e) => setEditMaxDailyLoss(parseFloat(e.target.value) || 1.0)}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#10141b] p-3 text-base text-white outline-none"
                    />
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0c1017] border border-white/[0.06] space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase">MAX POSITIONS</label>
                    <input
                      type="number"
                      value={editMaxPositions}
                      onChange={(e) => setEditMaxPositions(parseInt(e.target.value) || 1)}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#10141b] p-3 text-base text-white outline-none"
                    />
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0c1017] border border-white/[0.06] flex flex-col justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase">AUTO-STOP ROBOTS</span>
                    <button
                      type="button"
                      onClick={() => setEditRiskGuardAuto(!editRiskGuardAuto)}
                      className={`rounded-xl py-3 text-xs font-black uppercase cursor-pointer ${
                        editRiskGuardAuto ? "bg-[#00D084] text-black" : "bg-neutral-800 text-gray-400"
                      }`}
                    >
                      {editRiskGuardAuto ? "AUTO-STOP ACTIVÉ ✓" : "DÉSACTIVÉ"}
                    </button>
                  </div>
                </div>
              </section>

              {/* ── 12. SESSIONS ACTIVES & NOTES INTERNES CRM ── */}
              <div className="grid gap-8 lg:grid-cols-2">
                <section className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-8 shadow-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Laptop className="size-5 text-[#00D084]" />
                      Sessions &amp; Appareils
                    </h3>
                    <button onClick={handleKillAllClientSessions} className="text-xs text-rose-400 font-bold hover:underline cursor-pointer">
                      Déconnecter Tout 🚨
                    </button>
                  </div>
                  <div className="space-y-2 font-mono text-xs">
                    {activeClient.sessions.map((s) => (
                      <div key={s.id} className="p-3 rounded-xl bg-[#0c1017] flex justify-between items-center">
                        <div>
                          <strong className="text-white block">{s.device}</strong>
                          <span className="text-gray-400">{s.ip} · {s.location}</span>
                        </div>
                        <span className="text-emerald-400 font-bold">{s.lastActive}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-8 shadow-xl space-y-4">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Bookmark className="size-5 text-amber-400" />
                    Notes Internes &amp; Mémos Confidentiels
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ajouter une note..."
                      value={newCrmNoteText}
                      onChange={(e) => setNewCrmNoteText(e.target.value)}
                      className="flex-1 rounded-xl border border-white/[0.08] bg-[#0c1017] p-2.5 text-sm text-white outline-none"
                    />
                    <button onClick={handleAddCrmNote} className="rounded-xl bg-[#00D084] hover:bg-[#00b271] px-4 py-2.5 text-xs font-black text-black uppercase cursor-pointer">
                      Ajouter
                    </button>
                  </div>
                  <div className="space-y-2 font-mono text-xs max-h-40 overflow-y-auto pr-1">
                    {activeClient.crmNotes.map((n) => (
                      <div key={n.id} className="p-3 rounded-xl bg-[#0c1017] space-y-1">
                        <div className="flex justify-between text-gray-400">
                          <strong className="text-amber-300">{n.author}</strong>
                          <span>{n.date}</span>
                        </div>
                        <p className="text-gray-200 font-sans text-sm">{n.text}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 4. ADMINISTRATION & GOUVERNANCE DU STAFF (`administrators`)       */}
          {/* ===================================================================== */}
          {activeSection === "administrators" && (
            <div className="space-y-10 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    Administration Centrale &amp; Gouvernance Staff
                  </h1>
                  <p className="text-base text-gray-300 mt-1">
                    Gestion des Super Admins, Administrateurs, Conseillers Support, Responsables Financiers et Quants.
                  </p>
                </div>
              </div>

              {/* Formulaire Création Admin / Conseiller */}
              <section className="rounded-3xl border border-[#00D084]/40 bg-[#10141b] p-8 shadow-2xl space-y-6">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <UserPlus className="size-6 text-[#00D084]" />
                  Créer un Nouvel Administrateur / Membre du Staff
                </h2>

                <form onSubmit={handleCreateStaffMember} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">NOM COMPLET *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Jean-Luc Dupont"
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-white outline-none focus:border-[#00D084]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">ADRESSE E-MAIL *</label>
                      <input
                        type="email"
                        required
                        placeholder="Ex: jl.dupont@nexiummarkets.com"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-white outline-none focus:border-[#00D084]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">N° TÉLÉPHONE DESK</label>
                      <input
                        type="text"
                        placeholder="+41 22 ..."
                        value={newStaffPhone}
                        onChange={(e) => setNewStaffPhone(e.target.value)}
                        className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">RÔLE SYSTÈME &amp; HIÉRARCHIE</label>
                      <select
                        value={newStaffRole}
                        onChange={(e) => {
                          const r = e.target.value as AdminSystemRole;
                          setNewStaffRole(r);
                          if (r === "SUPER_ADMIN") {
                            setNewStaffDept("Direction Générale");
                            setNewStaffPermFinance(true);
                            setNewStaffPermEngines(true);
                            setNewStaffPermPnl(true);
                            setNewStaffPermKillSwitch(true);
                          } else if (r === "FINANCE") {
                            setNewStaffDept("Gestion Financière");
                            setNewStaffPermFinance(true);
                          } else if (r === "QUANT") {
                            setNewStaffDept("Recherche Quantitative");
                            setNewStaffPermEngines(true);
                            setNewStaffPermPnl(true);
                          } else if (r === "SUPPORT") {
                            setNewStaffDept("Desk Support & Conseillers");
                          }
                        }}
                        className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-white font-bold font-mono outline-none"
                      >
                        <option value="SUPER_ADMIN">👑 SUPER ADMINISTRATEUR (Pouvoirs Absolus)</option>
                        <option value="ADMIN">🛡️ ADMINISTRATEUR GÉNÉRAL</option>
                        <option value="SUPPORT">🎧 CONSEILLER SUPPORT &amp; RELATION CLIENT</option>
                        <option value="FINANCE">💰 GESTIONNAIRE FINANCIER &amp; TRÉSORERIE</option>
                        <option value="QUANT">📈 ANALYSTE QUANTITATIF &amp; STRATÉGIES</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">DÉPARTEMENT / PÔLE</label>
                      <select
                        value={newStaffDept}
                        onChange={(e) => setNewStaffDept(e.target.value as any)}
                        className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-white font-bold outline-none"
                      >
                        <option value="Direction Générale">Direction Générale</option>
                        <option value="Desk Support & Conseillers">Desk Support &amp; Conseillers</option>
                        <option value="Gestion Financière">Gestion Financière &amp; Trésorerie</option>
                        <option value="Recherche Quantitative">Recherche Quantitative &amp; Algorithmes</option>
                        <option value="Conformité & Risque">Conformité &amp; Risque (Compliance)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">RESTRICTIONS IP (WHITELIST)</label>
                      <input
                        type="text"
                        placeholder="Ex: 185.142.18.91, 194.67.12.8"
                        value={newStaffIpWhitelist}
                        onChange={(e) => setNewStaffIpWhitelist(e.target.value)}
                        className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-white outline-none font-mono text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">SIGNATURE DESK OFFICIELLE</label>
                      <input
                        type="text"
                        placeholder="Ex: Jean-Luc Dupont — Directeur @ Nexium Markets"
                        value={newStaffSignature}
                        onChange={(e) => setNewStaffSignature(e.target.value)}
                        className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-white outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-[#0c1017] border border-white/[0.06] space-y-3">
                    <span className="text-xs font-bold text-gray-400 uppercase font-mono block">PERMISSIONS ET POUVOIRS SPÉCIFIQUES :</span>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <label className="flex items-center gap-3 text-sm text-gray-200 cursor-pointer">
                        <input type="checkbox" checked={newStaffPermChat} onChange={(e) => setNewStaffPermChat(e.target.checked)} className="size-4.5 rounded accent-[#00D084]" />
                        <span>Chat &amp; Support Direct</span>
                      </label>

                      <label className="flex items-center gap-3 text-sm text-gray-200 cursor-pointer">
                        <input type="checkbox" checked={newStaffPermEmail} onChange={(e) => setNewStaffPermEmail(e.target.checked)} className="size-4.5 rounded accent-[#00D084]" />
                        <span>Envoi d'E-mails Desk</span>
                      </label>

                      <label className="flex items-center gap-3 text-sm text-gray-200 cursor-pointer">
                        <input type="checkbox" checked={newStaffPermPhone} onChange={(e) => setNewStaffPermPhone(e.target.checked)} className="size-4.5 rounded accent-[#00D084]" />
                        <span>Appels Téléphoniques VoIP</span>
                      </label>

                      <label className="flex items-center gap-3 text-sm text-gray-200 cursor-pointer">
                        <input type="checkbox" checked={newStaffPermFinance} onChange={(e) => setNewStaffPermFinance(e.target.checked)} className="size-4.5 rounded accent-[#00D084]" />
                        <span>Validation Retraits &amp; Dépôts</span>
                      </label>

                      <label className="flex items-center gap-3 text-sm text-gray-200 cursor-pointer">
                        <input type="checkbox" checked={newStaffPermEngines} onChange={(e) => setNewStaffPermEngines(e.target.checked)} className="size-4.5 rounded accent-[#00D084]" />
                        <span>Paramétrage des Moteurs</span>
                      </label>

                      <label className="flex items-center gap-3 text-sm text-gray-200 cursor-pointer">
                        <input type="checkbox" checked={newStaffPermPnl} onChange={(e) => setNewStaffPermPnl(e.target.checked)} className="size-4.5 rounded accent-[#00D084]" />
                        <span>Ajustement Financier de P&amp;L</span>
                      </label>

                      <label className="flex items-center gap-3 text-sm text-rose-400 font-bold cursor-pointer">
                        <input type="checkbox" checked={newStaffPermKillSwitch} onChange={(e) => setNewStaffPermKillSwitch(e.target.checked)} className="size-4.5 rounded accent-rose-500" />
                        <span>Kill Switch d'Urgence Total</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="rounded-2xl bg-[#00D084] hover:bg-[#00b271] px-8 py-4 text-base font-black text-black uppercase tracking-wider transition cursor-pointer shadow-lg"
                  >
                    Créer le Membre du Staff &amp; Activer les Accès
                  </button>
                </form>
              </section>

              {/* Tableau du Staff */}
              <section className="rounded-3xl border border-white/[0.08] bg-[#10141b] overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/[0.08] flex justify-between items-center">
                  <h3 className="text-xl font-black text-white">Membres Actifs du Staff ({staffList.length})</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-sm">
                    <thead className="border-b border-white/[0.08] bg-[#0c1017] text-gray-400">
                      <tr>
                        <th className="p-5">ADMINISTRATEUR</th>
                        <th className="p-5">RÔLE &amp; PÔLE</th>
                        <th className="p-5">PERMISSIONS</th>
                        <th className="p-5">RESTRICTIONS IP</th>
                        <th className="p-5 text-right">STATUT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {staffList.map((st) => (
                        <tr key={st.id} className="hover:bg-[#141a23]/60 transition">
                          <td className="p-5 font-sans">
                            <strong className="text-base text-white block">{st.name}</strong>
                            <span className="text-xs text-gray-400 font-mono">{st.email}</span>
                            <span className="text-xs text-gray-500 font-mono block">{st.phone}</span>
                          </td>

                          <td className="p-5">
                            <span className={`px-3 py-1 rounded-full text-xs font-black block w-fit ${
                              st.role === "SUPER_ADMIN"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : st.role === "FINANCE"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : st.role === "QUANT"
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}>
                              {st.role.replace("_", " ")}
                            </span>
                            <span className="text-xs text-gray-400 font-sans block mt-1">{st.department}</span>
                          </td>

                          <td className="p-5 font-sans text-xs">
                            <div className="flex flex-wrap gap-1.5 max-w-xs">
                              {st.permissions.canChatWithClients && <span className="px-2 py-0.5 rounded bg-white/[0.06] text-gray-300">Chat</span>}
                              {st.permissions.canApproveFinances && <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">Finances</span>}
                              {st.permissions.canManageEngines && <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">Robots</span>}
                              {st.permissions.canAdjustPnl && <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">P&amp;L</span>}
                              {st.permissions.canUseKillSwitch && <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">Kill Switch</span>}
                            </div>
                          </td>

                          <td className="p-5 text-gray-400 font-mono text-xs">
                            {st.ipWhitelist}
                          </td>

                          <td className="p-5 text-right">
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {st.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 5. MESSAGERIE MULTI-CANAL COMPLÈTE (`messaging`)                    */}
          {/* ===================================================================== */}
          {activeSection === "messaging" && (
            <div className="space-y-6 animate-in fade-in">
              {/* Header Messagerie avec Onglets */}
              <div className="border-b border-white/[0.08] pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                    <MessageSquare className="size-8 text-[#00D084]" />
                    <span>Desk de Messagerie Multi-Canal &amp; Support</span>
                  </h1>
                  <p className="text-base text-gray-300 mt-1">
                    Canaux unifiés : Live Chat MT5, E-mails Officiels, Appels Téléphoniques VoIP &amp; Alertes BroadCast.
                  </p>
                </div>

                {/* Onglets de la messagerie */}
                <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#10141b] p-1.5 font-mono text-sm font-bold">
                  <button
                    onClick={() => setMessagingTab("LIVE_CHAT")}
                    className={`rounded-xl px-4 py-2.5 transition cursor-pointer flex items-center gap-2 ${
                      messagingTab === "LIVE_CHAT" ? "bg-[#00D084] text-black font-black shadow-lg" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <MessageCircle className="size-4" />
                    <span>Chat Direct &amp; WhatsApp</span>
                  </button>

                  <button
                    onClick={() => setMessagingTab("EMAILS")}
                    className={`rounded-xl px-4 py-2.5 transition cursor-pointer flex items-center gap-2 ${
                      messagingTab === "EMAILS" ? "bg-[#00D084] text-black font-black shadow-lg" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Mail className="size-4" />
                    <span>E-mails Desk</span>
                  </button>

                  <button
                    onClick={() => setMessagingTab("VOIP_CALLS")}
                    className={`rounded-xl px-4 py-2.5 transition cursor-pointer flex items-center gap-2 ${
                      messagingTab === "VOIP_CALLS" ? "bg-[#00D084] text-black font-black shadow-lg" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <PhoneCall className="size-4" />
                    <span>Journal d'Appels</span>
                  </button>

                  <button
                    onClick={() => setMessagingTab("BROADCAST")}
                    className={`rounded-xl px-4 py-2.5 transition cursor-pointer flex items-center gap-2 ${
                      messagingTab === "BROADCAST" ? "bg-amber-400 text-black font-black shadow-lg" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Megaphone className="size-4" />
                    <span>Diffusions Flash</span>
                  </button>
                </div>
              </div>

              {/* ── SOUS-VUE 1 : LIVE CHAT & E-MAILS DIRECTS ── */}
              {(messagingTab === "LIVE_CHAT" || messagingTab === "EMAILS") && (
                <div className="grid gap-6 lg:grid-cols-12 h-[750px]">
                  {/* Panneau Gauche : Liste des Discussions Clients (3.5 cols) */}
                  <div className="lg:col-span-4 rounded-3xl border border-white/[0.08] bg-[#10141b] flex flex-col overflow-hidden shadow-2xl">
                    {/* Recherche & Filtre */}
                    <div className="p-4 border-b border-white/[0.08] space-y-3">
                      <div className="relative">
                        <Search className="size-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Rechercher trader, e-mail, MT5..."
                          value={searchContactQuery}
                          onChange={(e) => setSearchContactQuery(e.target.value)}
                          className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-[#00D084]"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setChannelFilter("ALL")}
                          className={`flex-1 rounded-xl py-1.5 text-xs font-bold font-mono transition cursor-pointer ${
                            channelFilter === "ALL" ? "bg-white/[0.12] text-white" : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Tous ({clients.length})
                        </button>
                        <button
                          onClick={() => setChannelFilter("CHAT")}
                          className={`flex-1 rounded-xl py-1.5 text-xs font-bold font-mono transition cursor-pointer ${
                            channelFilter === "CHAT" ? "bg-[#00D084]/20 text-[#00D084]" : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Chat Direct
                        </button>
                        <button
                          onClick={() => setChannelFilter("EMAIL")}
                          className={`flex-1 rounded-xl py-1.5 text-xs font-bold font-mono transition cursor-pointer ${
                            channelFilter === "EMAIL" ? "bg-blue-500/20 text-blue-300" : "text-gray-400 hover:text-white"
                          }`}
                        >
                          E-mails
                        </button>
                      </div>
                    </div>

                    {/* Liste des Traders */}
                    <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
                      {filteredContacts.map((c) => {
                        const lastMsg = messagesList.filter((m) => m.clientId === c.id).slice(-1)[0];
                        const isSelected = c.id === activeClient?.id;

                        return (
                          <div
                            key={c.id}
                            onClick={() => setSelectedUserId(c.id)}
                            className={`p-4 cursor-pointer transition flex items-start gap-3.5 ${
                              isSelected ? "bg-[#00D084]/15 border-l-4 border-l-[#00D084]" : "hover:bg-[#141a23]/60"
                            }`}
                          >
                            <div className="relative shrink-0">
                              <div className="size-11 rounded-2xl bg-gradient-to-br from-[#00D084]/30 to-blue-600/30 border border-white/[0.1] grid place-items-center font-bold text-white text-base">
                                {c.name.charAt(0)}
                              </div>
                              <span className="size-3 rounded-full bg-emerald-400 ring-2 ring-[#10141b] absolute -bottom-0.5 -right-0.5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline mb-0.5">
                                <strong className="text-sm font-bold text-white truncate block">{c.name}</strong>
                                <span className="text-[11px] text-gray-400 font-mono shrink-0">
                                  {lastMsg ? lastMsg.timestamp : "14:00"}
                                </span>
                              </div>

                              <p className="text-xs text-gray-300 truncate mb-1">
                                {lastMsg ? lastMsg.text : "Aucun message récent."}
                              </p>

                              <div className="flex items-center gap-2 text-[10px] font-mono">
                                <span className="text-[#00D084] font-bold">MT5 #{c.mt5.login}</span>
                                <span className="text-gray-500">·</span>
                                <span className="text-gray-400">${c.balance.toLocaleString("fr-FR")} USD</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Panneau Central : Fil de Discussion & Réponse (5.5 cols) */}
                  <div className="lg:col-span-5 rounded-3xl border border-white/[0.08] bg-[#10141b] flex flex-col justify-between overflow-hidden shadow-2xl">
                    {/* Header Discussion */}
                    <div className="p-5 border-b border-white/[0.08] flex justify-between items-center bg-[#0c1017]">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-[#00D084]/20 border border-[#00D084]/30 grid place-items-center font-bold text-[#00D084]">
                          {activeClient?.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-base">{activeClient?.name}</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              EN DIRECT
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 font-mono">{activeClient?.email} · {activeClient?.phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            toast.info(`Appel VoIP en cours vers ${activeClient?.phone}...`);
                          }}
                          className="size-10 rounded-xl border border-white/[0.08] bg-[#10141b] hover:bg-[#141a23] text-emerald-400 grid place-items-center cursor-pointer shadow"
                          title="Lancer Appel Téléphonique VoIP"
                        >
                          <PhoneCall className="size-4.5" />
                        </button>

                        <button
                          onClick={() => handleOpenClientProfile(activeClient)}
                          className="size-10 rounded-xl border border-white/[0.08] bg-[#10141b] hover:bg-[#141a23] text-[#00D084] grid place-items-center cursor-pointer shadow"
                          title="Ouvrir Fiche Complète Profil"
                        >
                          <User className="size-4.5" />
                        </button>
                      </div>
                    </div>

                    {/* Messages Historique */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-4">
                      {activeClientMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 font-mono">
                          <MessageSquare className="size-10 text-gray-600" />
                          <p className="text-sm">Démarrez la conversation avec {activeClient?.name}</p>
                        </div>
                      ) : (
                        activeClientMessages.map((msg) => {
                          const isAdmin = msg.sender === "ADMIN";
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-3xl p-5 shadow-lg space-y-1.5 ${
                                  isAdmin
                                    ? "bg-[#00D084] text-black font-semibold rounded-tr-none"
                                    : "bg-[#0c1017] text-gray-100 border border-white/[0.08] rounded-tl-none"
                                }`}
                              >
                                <div className="flex justify-between items-center gap-4 text-[10px] uppercase font-bold opacity-75 font-mono">
                                  <span>{msg.authorName}</span>
                                  <span>{msg.timestamp}</span>
                                </div>

                                {msg.subject && (
                                  <strong className="block text-xs uppercase font-bold underline">{msg.subject}</strong>
                                )}

                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Réponses Rapides / Modèles (Canned Responses) */}
                    <div className="px-5 py-2.5 bg-[#0c1017] border-t border-white/[0.06] flex items-center gap-2 overflow-x-auto">
                      <span className="text-[10px] font-bold text-gray-400 uppercase font-mono shrink-0">Modèles Rapides :</span>
                      {CANNED_RESPONSES.map((cr, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleInsertCannedResponse(cr.text)}
                          className="rounded-xl border border-white/[0.08] bg-[#10141b] hover:bg-[#141a23] px-3 py-1.5 text-xs text-gray-300 hover:text-white shrink-0 cursor-pointer font-sans"
                        >
                          {cr.title}
                        </button>
                      ))}
                    </div>

                    {/* Formulaire Envoi Message */}
                    <form onSubmit={handleSendDeskMessage} className="p-5 border-t border-white/[0.08] bg-[#0c1017] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedChannelMode("CHAT")}
                            className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                              selectedChannelMode === "CHAT" ? "bg-[#00D084] text-black" : "bg-[#10141b] text-gray-400"
                            }`}
                          >
                            💬 Live Chat
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedChannelMode("EMAIL")}
                            className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                              selectedChannelMode === "EMAIL" ? "bg-blue-500 text-white" : "bg-[#10141b] text-gray-400"
                            }`}
                          >
                            ✉️ E-mail Officiel
                          </button>
                        </div>

                        <span className="text-xs text-gray-400 font-mono">Signé par : {currentSessionRole}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          placeholder={selectedChannelMode === "CHAT" ? "Tapez votre message pour le trader..." : "Rédiger l'e-mail officiel pour le client..."}
                          value={chatReplyInput}
                          onChange={(e) => setChatReplyInput(e.target.value)}
                          className="flex-1 rounded-2xl border border-white/[0.08] bg-[#10141b] p-4 text-sm text-white outline-none focus:border-[#00D084]"
                        />

                        <button
                          type="submit"
                          className="rounded-2xl bg-[#00D084] hover:bg-[#00b271] px-6 py-4 text-sm font-black text-black uppercase tracking-wider transition cursor-pointer shadow-lg flex items-center gap-2 shrink-0"
                        >
                          <Send className="size-4.5" />
                          <span>Envoyer</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Panneau Droit : Fiche Synthétique & Contexte Client (2.5 cols) */}
                  <div className="lg:col-span-3 rounded-3xl border border-white/[0.08] bg-[#10141b] p-6 space-y-6 overflow-y-auto shadow-2xl">
                    <h3 className="text-xs font-black text-gray-400 uppercase font-mono border-b border-white/[0.08] pb-3">
                      CONTEXTE DU TRADER
                    </h3>

                    {/* Données Métriques Directes */}
                    <div className="space-y-4 font-mono text-sm">
                      <div className="p-4 rounded-2xl bg-[#0c1017] border border-white/[0.06] space-y-1">
                        <span className="text-xs text-gray-400 uppercase">SOLDE &amp; EQUITY</span>
                        <strong className="text-xl font-black text-white block">${activeClient?.balance.toLocaleString("fr-FR")} USD</strong>
                        <span className="text-xs text-emerald-400">Equity : ${activeClient?.equity.toLocaleString("fr-FR")} USD</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#0c1017] border border-white/[0.06] space-y-1">
                        <span className="text-xs text-gray-400 uppercase">P&amp;L DU JOUR NET</span>
                        <strong className={`text-xl font-black block ${activeClient?.todayPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {activeClient?.todayPnl >= 0 ? "+" : ""}${activeClient?.todayPnl.toLocaleString("fr-FR")} USD
                        </strong>
                        <span className="text-xs text-gray-400">Total Net : +${activeClient?.totalNetPnl.toLocaleString("fr-FR")}</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#0c1017] border border-white/[0.06] space-y-2">
                        <span className="text-xs text-gray-400 uppercase font-bold">MOTEURS ATTRIBUÉS</span>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-300">AI Gold :</span>
                            <strong className={activeClient?.engines.aiGold.active ? "text-emerald-400" : "text-gray-500"}>
                              {activeClient?.engines.aiGold.active ? "ACTIF ✓" : "OFF"}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">FX Trend :</span>
                            <strong className={activeClient?.engines.fxTrend.active ? "text-emerald-400" : "text-gray-500"}>
                              {activeClient?.engines.fxTrend.active ? "ACTIF ✓" : "OFF"}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Index Reversion :</span>
                            <strong className={activeClient?.engines.indexReversion.active ? "text-emerald-400" : "text-gray-500"}>
                              {activeClient?.engines.indexReversion.active ? "ACTIF ✓" : "OFF"}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Boutons d'Action Rapide Desk */}
                    <div className="space-y-3 pt-2">
                      <button
                        onClick={() => handleOpenClientProfile(activeClient)}
                        className="w-full rounded-2xl bg-[#00D084] hover:bg-[#00b271] py-3 text-xs font-black text-black uppercase tracking-wider cursor-pointer shadow-md"
                      >
                        Voir Fiche Complète →
                      </button>

                      <button
                        onClick={() => handleStartImpersonation(activeClient)}
                        className="w-full rounded-2xl bg-amber-500 hover:bg-amber-600 py-3 text-xs font-black text-black uppercase tracking-wider cursor-pointer shadow-md"
                      >
                        Superviser Live 👁️
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SOUS-VUE 2 : JOURNAL D'APPELS TÉLÉPHONIQUES VOIP ── */}
              {messagingTab === "VOIP_CALLS" && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-8 shadow-xl space-y-6">
                    <div className="flex justify-between items-center border-b border-white/[0.08] pb-4">
                      <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <PhoneCall className="size-5 text-emerald-400" />
                        Historique des Appels Téléphoniques Enregistrés
                      </h3>
                      <button
                        onClick={() => toast.info("Poste VoIP connecté.")}
                        className="rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 text-xs font-bold"
                      >
                        🟢 Ligne VoIP Prête
                      </button>
                    </div>

                    <table className="w-full text-left font-mono text-sm">
                      <thead className="border-b border-white/[0.08] text-gray-400">
                        <tr>
                          <th className="p-4">DATE &amp; HEURE</th>
                          <th className="p-4">CLIENT</th>
                          <th className="p-4">CONSEILLER</th>
                          <th className="p-4">DURÉE</th>
                          <th className="p-4">RÉSULTAT</th>
                          <th className="p-4">RÉSUMÉ DE L'APPEL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {callLogs.map((cl) => (
                          <tr key={cl.id} className="hover:bg-[#141a23]">
                            <td className="p-4 text-white font-bold">{cl.date}</td>
                            <td className="p-4 text-[#00D084] font-sans font-bold">{cl.clientName}</td>
                            <td className="p-4 text-gray-300 font-sans">{cl.advisorName}</td>
                            <td className="p-4 text-gray-400">{cl.duration}</td>
                            <td className="p-4">
                              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                {cl.outcome}
                              </span>
                            </td>
                            <td className="p-4 text-xs text-gray-300 font-sans">{cl.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── SOUS-VUE 3 : DIFFUSION FLASH / BROADCAST GÉNÉRAL ── */}
              {messagingTab === "BROADCAST" && (
                <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
                  <div className="rounded-3xl border border-amber-500/30 bg-[#10141b] p-8 shadow-2xl space-y-6">
                    <div className="border-b border-white/[0.08] pb-4">
                      <h3 className="text-xl font-black text-white flex items-center gap-3">
                        <Megaphone className="size-6 text-amber-400" />
                        Envoyer une Alerte Générale Flash aux Traders
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Diffusez un message instantané à l'ensemble des traders connectés ou à un groupe spécifique.
                      </p>
                    </div>

                    <form onSubmit={handleSendBroadcast} className="space-y-6">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">AUDIENCE CIBLE</label>
                          <select
                            value={broadcastAudience}
                            onChange={(e) => setBroadcastAudience(e.target.value as any)}
                            className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-white font-bold font-mono outline-none"
                          >
                            <option value="ALL">📢 Tous les Utilisateurs Inscrits ({clients.length})</option>
                            <option value="ACTIVE_ONLY">🟢 Uniquement les Comptes Actifs</option>
                            <option value="GOLD_USERS">🥇 Utilisateurs du Robot AI Gold</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">OBJET DE L'ALERTE FLASH *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Volatilité accrue avant décision de taux FED"
                            value={broadcastSubject}
                            onChange={(e) => setBroadcastSubject(e.target.value)}
                            className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-white outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 font-mono">CORPS DU MESSAGE DE DIFFUSION *</label>
                        <textarea
                          rows={5}
                          required
                          placeholder="Rédigez le texte du communiqué à destination des traders..."
                          value={broadcastMessage}
                          onChange={(e) => setBroadcastMessage(e.target.value)}
                          className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 text-white outline-none focus:border-amber-400 text-sm leading-relaxed"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full rounded-2xl bg-amber-400 hover:bg-amber-500 py-4 text-base font-black text-black uppercase tracking-wider transition cursor-pointer shadow-xl flex items-center justify-center gap-2"
                      >
                        <Megaphone className="size-5" />
                        <span>Diffuser Immédiatement à Tous les Traders</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 6. PASSERELLES MT5 & VPS (`gateways`)                               */}
          {/* ===================================================================== */}
          {activeSection === "gateways" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-white/[0.08] pb-4 flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-black text-white">Moniteur des Passerelles MT5 &amp; VPS</h1>
                  <p className="text-sm text-gray-400 mt-1">Supervision de la latence, des flux de ticks et connecteurs courtiers.</p>
                </div>
                <button
                  onClick={() => toast.success("Ping test rafraîchi pour tous les serveurs.")}
                  className="rounded-2xl bg-[#00D084] hover:bg-[#00b271] px-6 py-3 text-xs font-black text-black uppercase cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className="size-4" />
                  <span>Tester Tous les Serveurs</span>
                </button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 font-mono">
                {gateways.map((g) => (
                  <div key={g.id} className="p-8 rounded-3xl bg-[#10141b] border border-white/[0.08] space-y-4 shadow-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-xl text-white block">{g.broker}</strong>
                        <span className="text-xs text-gray-400">{g.server} · IP: {g.ip}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${
                        g.status === "OPTIMAL" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300"
                      }`}>
                        {g.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.04]">
                      <div>
                        <span className="text-xs text-gray-400 uppercase block">Latence Ping</span>
                        <strong className="text-2xl font-black text-emerald-400">{g.latencyMs} ms</strong>
                      </div>

                      <div>
                        <span className="text-xs text-gray-400 uppercase block">Comptes Liés</span>
                        <strong className="text-2xl font-black text-white">{g.connectedAccounts}</strong>
                      </div>

                      <div>
                        <span className="text-xs text-gray-400 uppercase block">Débit Ticks</span>
                        <strong className="text-2xl font-black text-blue-400">{g.ticksPerSec} /s</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 7. NEWS GUARD MACRO (`news-guard`)                                 */}
          {/* ===================================================================== */}
          {activeSection === "news-guard" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-white/[0.08] pb-4 flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-black text-white">News Guard Macro &amp; Filtre Économique</h1>
                  <p className="text-sm text-gray-400 mt-1">Protection contre les décalages de prix et le slippage lors des annonces de banques centrales.</p>
                </div>

                <button
                  onClick={() => {
                    setNewsGuardActive(!newsGuardActive);
                    toast.success(newsGuardActive ? "News Guard désactivé." : "News Guard activé.");
                  }}
                  className={`rounded-2xl px-6 py-3 text-xs font-black uppercase transition cursor-pointer ${
                    newsGuardActive ? "bg-[#00D084] text-black" : "bg-neutral-800 text-gray-400"
                  }`}
                >
                  {newsGuardActive ? "NEWS GUARD : ACTIF ✓" : "DÉSACTIVÉ"}
                </button>
              </div>

              <div className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-8 shadow-xl space-y-6">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Calendar className="size-5 text-amber-400" />
                  Événements Économiques Majeurs du Jour
                </h3>

                <table className="w-full text-left font-mono text-sm">
                  <thead className="border-b border-white/[0.08] text-gray-400">
                    <tr>
                      <th className="p-3">HEURE</th>
                      <th className="p-3">DEVISE</th>
                      <th className="p-3">ÉVÉNEMENT</th>
                      <th className="p-3">IMPACT</th>
                      <th className="p-3">ACTION AUTO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {economicEvents.map((ev) => (
                      <tr key={ev.id}>
                        <td className="p-3 font-bold text-white">{ev.time}</td>
                        <td className="p-3 text-amber-300 font-bold">{ev.currency}</td>
                        <td className="p-3 text-white font-sans font-semibold">{ev.event}</td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            {ev.impact}
                          </span>
                        </td>
                        <td className="p-3 text-emerald-400 font-bold">
                          Pause Robots ±15min
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 8. PERFORMANCE FEES (`perf-fees`)                                 */}
          {/* ===================================================================== */}
          {activeSection === "perf-fees" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-white/[0.08] pb-4">
                <h1 className="text-3xl font-black text-white">Facturation Performance Fees (High-Water Mark)</h1>
                <p className="text-sm text-gray-400 mt-1">Calcul des commissions de surperformance et débits certifiés.</p>
              </div>

              <div className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-8 shadow-xl space-y-6">
                <table className="w-full text-left font-mono text-sm">
                  <thead className="border-b border-white/[0.08] text-gray-400">
                    <tr>
                      <th className="p-4">CLIENT</th>
                      <th className="p-4">HIGH-WATER MARK</th>
                      <th className="p-4">GAIN NET COUVERT</th>
                      <th className="p-4">TAUX (%)</th>
                      <th className="p-4">COMMISSION DUE ($)</th>
                      <th className="p-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {clients.map((c) => (
                      <tr key={c.id}>
                        <td className="p-4 font-sans font-bold text-white">{c.name}</td>
                        <td className="p-4 text-gray-300">${c.highWaterMark.toLocaleString("fr-FR")}</td>
                        <td className="p-4 text-emerald-400 font-bold">+${c.totalNetPnl.toLocaleString("fr-FR")}</td>
                        <td className="p-4 text-gray-300">{c.performanceFeeRate}%</td>
                        <td className="p-4 text-amber-300 font-black text-base">${c.pendingPerfFee.toLocaleString("fr-FR")} USD</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              toast.success(`Frais de performance de $${c.pendingPerfFee} USD prélevés pour ${c.name}.`);
                            }}
                            className="rounded-xl bg-[#00D084] hover:bg-[#00b271] px-4 py-2 text-xs font-black text-black uppercase cursor-pointer"
                          >
                            Prélever Frais ✓
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 9. MOTEURS & AUTO-TRADER GLOBAL (`engines`)                        */}
          {/* ===================================================================== */}
          {activeSection === "engines" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-white/[0.08] pb-4 flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-black text-white">Moteurs Algorithmiques &amp; Kill Switch Global</h1>
                  <p className="text-sm text-gray-400 mt-1">Supervision de l'ensemble des 3 stratégies automatisées.</p>
                </div>

                <button
                  onClick={handleGlobalKillSwitch}
                  className="rounded-2xl bg-rose-600 hover:bg-rose-700 px-7 py-3.5 text-sm font-black text-white uppercase tracking-wider transition cursor-pointer shadow-2xl flex items-center gap-2"
                >
                  <AlertOctagon className="size-5" />
                  <span>KILL SWITCH GÉNÉRAL 🛑</span>
                </button>
              </div>

              <div className="grid gap-6 lg:grid-cols-3 font-mono">
                <div className="p-8 rounded-3xl bg-[#10141b] border border-amber-400/30 space-y-4">
                  <h3 className="text-xl font-bold text-white">🥇 Nexium AI Gold</h3>
                  <p className="text-xs text-gray-400 font-sans">Trading de l'Or (XAUUSD) par reconnaissance de structures institutionnelles.</p>
                  <div className="pt-2 space-y-2 text-sm">
                    <div className="flex justify-between"><span>Comptes Actifs :</span><strong className="text-white">2 / 2</strong></div>
                    <div className="flex justify-between"><span>Win Rate Global :</span><strong className="text-emerald-400">79.2%</strong></div>
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-[#10141b] border border-blue-400/30 space-y-4">
                  <h3 className="text-xl font-bold text-white">📈 Nexium FX Trend</h3>
                  <p className="text-xs text-gray-400 font-sans">Suivi de tendance multi-paires Forex (EURUSD, GBPUSD, USDJPY).</p>
                  <div className="pt-2 space-y-2 text-sm">
                    <div className="flex justify-between"><span>Comptes Actifs :</span><strong className="text-white">2 / 2</strong></div>
                    <div className="flex justify-between"><span>Win Rate Global :</span><strong className="text-emerald-400">76.8%</strong></div>
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-[#10141b] border border-purple-400/30 space-y-4">
                  <h3 className="text-xl font-bold text-white">⚡ Index Reversion</h3>
                  <p className="text-xs text-gray-400 font-sans">Stratégie de retour à la moyenne sur indices américains (US30 / NAS100).</p>
                  <div className="pt-2 space-y-2 text-sm">
                    <div className="flex justify-between"><span>Comptes Actifs :</span><strong className="text-white">1 / 2</strong></div>
                    <div className="flex justify-between"><span>Win Rate Global :</span><strong className="text-emerald-400">82.1%</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 10. FINANCES & DÉPÔTS GLOBAUX (`finances`)                         */}
          {/* ===================================================================== */}
          {activeSection === "finances" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-white/[0.08] pb-4">
                <h1 className="text-3xl font-black text-white">Finances &amp; Trésorerie Globale</h1>
                <p className="text-sm text-gray-400 mt-1">Supervision de l'ensemble des flux financiers de la plateforme.</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-3 font-mono">
                <div className="p-6 rounded-3xl bg-[#10141b] border border-white/[0.08]">
                  <span className="text-xs text-gray-400 uppercase block">Total Actifs sous Gestion (AUM)</span>
                  <strong className="text-3xl font-black text-emerald-400 mt-2 block">${(totalBalance + totalBonus).toLocaleString("fr-FR")} USD</strong>
                </div>

                <div className="p-6 rounded-3xl bg-[#10141b] border border-white/[0.08]">
                  <span className="text-xs text-gray-400 uppercase block">Total Dépôts Réels</span>
                  <strong className="text-3xl font-black text-white mt-2 block">${totalBalance.toLocaleString("fr-FR")} USD</strong>
                </div>

                <div className="p-6 rounded-3xl bg-[#10141b] border border-white/[0.08]">
                  <span className="text-xs text-gray-400 uppercase block">Bonus Commerciaux Actifs</span>
                  <strong className="text-3xl font-black text-amber-300 mt-2 block">+${totalBonus.toLocaleString("fr-FR")} USD</strong>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 11. JOURNAL D'AUDIT SYSTÈME (`logs`)                               */}
          {/* ===================================================================== */}
          {activeSection === "logs" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-white/[0.08] pb-4 flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-black text-white">Journal d'Audit &amp; Traçabilité Système</h1>
                  <p className="text-sm text-gray-400 mt-1">Historique certifié et horodaté de toutes les actions administratives.</p>
                </div>

                <button
                  onClick={() => toast.success("Journal d'audit exporté.")}
                  className="rounded-2xl border border-white/[0.08] bg-[#10141b] hover:bg-[#141a23] px-6 py-3 text-xs font-bold text-white cursor-pointer flex items-center gap-2"
                >
                  <Download className="size-4" />
                  <span>Exporter Logs (.CSV)</span>
                </button>
              </div>

              <div className="rounded-3xl border border-white/[0.08] bg-[#10141b] p-8 shadow-xl">
                <table className="w-full text-left font-mono text-sm">
                  <thead className="border-b border-white/[0.08] text-gray-400">
                    <tr>
                      <th className="p-4">HORODATAGE</th>
                      <th className="p-4">AUTEUR</th>
                      <th className="p-4">ACTION</th>
                      <th className="p-4">UTILISATEUR CIBLE</th>
                      <th className="p-4">DÉTAILS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="p-4 text-gray-400">{log.timestamp}</td>
                        <td className="p-4 text-emerald-400 font-bold">{log.admin}</td>
                        <td className="p-4 text-white font-bold">{log.action}</td>
                        <td className="p-4 text-amber-300">{log.targetUser || "-"}</td>
                        <td className="p-4 text-gray-300 font-sans text-xs">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
