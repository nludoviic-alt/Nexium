import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminPanel, AdminBadge, AdminToggle, AdminDataTable, AdminStatTile, AdminSidebarNav, AdminDropdown, useTableQuery, downloadCsv } from "@/components/admin";
import {
  emailApi,
  isEmailApiConfigured,
  EmailApiError,
  type EmailConversationFilter,
  type EmailConversationListItem,
  type EmailConversationDetail,
  type EmailAgentSummary,
} from "@/lib/emailApi";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRightLeft,
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
  Loader2,
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
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  PenLine,
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
  StickyNote,
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
import {
  sendWelcomeEmail,
  sendDepositConfirmedEmail,
  sendCustomDeskEmail,
  isResendConfigured,
} from "@/lib/resend";
import {
  supabase,
  isSupabaseConfigured,
  approveClientAccount,
  rejectClientAccount,
  approvePresetActivation,
  assignAdvisorToClient,
  getAllClientProfiles,
} from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  component: NexiumAdminDashboard,
});

/* ========================================================================= */
/* TYPES & MODÈLES DE DONNÉES                                                */
/* ========================================================================= */

type AdminSystemRole = "OWNER" | "SUPER_ADMIN" | "ADMIN" | "CONSEILLER" | "SUPPORT" | "FINANCE" | "QUANT";
type AccountStatus = "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "REVOKED" | "BANNED";
type KycStatus = "VERIFIED" | "PENDING_REVIEW" | "REJECTED" | "NOT_SUBMITTED";

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
  kycStatus: KycStatus;
  licenseStatus?: "NOT_REQUESTED" | "PENDING_PRESET_APPROVAL" | "ACTIVE" | "EXPIRED";
  requestedPreset?: string;
  activePreset?: string;
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
  assignedTraders?: string[];
  permissions: {
    canChatWithClients: boolean;
    canSendEmails: boolean;
    canTakePhoneCalls: boolean;
    canApproveFinances: boolean;
    canManageEngines: boolean;
    canAdjustPnl: boolean;
    canUseKillSwitch: boolean;
    canManageStaff?: boolean;
    canViewTreasury?: boolean;
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
  testing?: boolean;
}

interface VpnAccount {
  id: string;
  peerName: string;
  assignedTo: string;
  role: AdminSystemRole;
  device: string;
  status: "ONLINE" | "OFFLINE" | "DISABLED";
  vpnIp: string;
  publicIp: string;
  location: string;
  lastHandshake: string;
  dataTransferred: string;
  twoFactorEnabled: boolean;
  createdAt: string;
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
    id: "adm-owner",
    name: "Marc-Aurèle V.",
    email: "owner@nexiummarkets.com",
    phone: "+41 22 819 00 01",
    role: "OWNER",
    department: "Direction Générale",
    status: "ACTIVE",
    twoFactorEnabled: true,
    createdAt: "2025-01-01",
    lastLogin: "En ligne maintenant",
    lastIp: "185.142.18.1 (Genève, CH)",
    ipWhitelist: "Toutes les adresses IP (Accès Maître)",
    allowedHours: "24/7 (Souveraineté Absolue)",
    deskSignature: "Marc-Aurèle V. — Fondateur & Propriétaire @ Nexium Markets",
    assignedAccountsCount: 520,
    assignedTraders: ["Alexandre Dupuis", "Sophie Laurent", "Elena Rostova", "Club Forex Paris"],
    permissions: {
      canChatWithClients: true,
      canSendEmails: true,
      canTakePhoneCalls: true,
      canApproveFinances: true,
      canManageEngines: true,
      canAdjustPnl: true,
      canUseKillSwitch: true,
      canManageStaff: true,
      canViewTreasury: true,
    },
  },
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
    deskSignature: "Ludovic Moreau — Super Administrateur & COO @ Nexium",
    assignedAccountsCount: 240,
    assignedTraders: ["Alexandre Dupuis", "Marc Albarran"],
    permissions: {
      canChatWithClients: true,
      canSendEmails: true,
      canTakePhoneCalls: true,
      canApproveFinances: true,
      canManageEngines: true,
      canAdjustPnl: true,
      canUseKillSwitch: true,
      canManageStaff: true,
      canViewTreasury: true,
    },
  },
  {
    id: "adm-conseiller-1",
    name: "Julien Cassel",
    email: "julien.c@nexiummarkets.com",
    phone: "+41 22 990 12 77",
    role: "CONSEILLER",
    department: "Desk Support & Conseillers",
    status: "ACTIVE",
    twoFactorEnabled: true,
    createdAt: "2026-01-15",
    lastLogin: "Aujourd'hui à 15:10",
    lastIp: "185.142.18.45 (Genève, CH)",
    ipWhitelist: "185.142.18.45, 185.142.18.99",
    allowedHours: "Lundi-Samedi 08:00 - 20:00",
    deskSignature: "Julien Cassel — Conseiller Privé & Gestionnaire de Portefeuilles @ Nexium",
    assignedAccountsCount: 75,
    assignedTraders: ["Alexandre Dupuis", "David Benhamou"],
    permissions: {
      canChatWithClients: true,
      canSendEmails: true,
      canTakePhoneCalls: true,
      canApproveFinances: false,
      canManageEngines: true,
      canAdjustPnl: false,
      canUseKillSwitch: false,
      canManageStaff: false,
      canViewTreasury: false,
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
    assignedTraders: ["Alexandre Dupuis"],
    permissions: {
      canChatWithClients: true,
      canSendEmails: true,
      canTakePhoneCalls: true,
      canApproveFinances: false,
      canManageEngines: false,
      canAdjustPnl: false,
      canUseKillSwitch: false,
      canManageStaff: false,
      canViewTreasury: false,
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
    assignedTraders: [],
    permissions: {
      canChatWithClients: true,
      canSendEmails: true,
      canTakePhoneCalls: false,
      canApproveFinances: true,
      canManageEngines: false,
      canAdjustPnl: true,
      canUseKillSwitch: false,
      canManageStaff: false,
      canViewTreasury: true,
    },
  },
  {
    id: "adm-quant-1",
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
    assignedTraders: [],
    permissions: {
      canChatWithClients: false,
      canSendEmails: false,
      canTakePhoneCalls: false,
      canApproveFinances: false,
      canManageEngines: true,
      canAdjustPnl: true,
      canUseKillSwitch: true,
      canManageStaff: false,
      canViewTreasury: false,
    },
  },
];

const INITIAL_GATEWAYS: BrokerGateway[] = [
  { id: "gw-1", broker: "Pepperstone ECN", server: "Pepperstone-Edge02", ip: "194.67.12.8", latencyMs: 14, status: "OPTIMAL", connectedAccounts: 420, ticksPerSec: 184 },
  { id: "gw-2", broker: "IC Markets SC", server: "ICMarketsSC-Live04", ip: "185.142.18.2", latencyMs: 18, status: "OPTIMAL", connectedAccounts: 560, ticksPerSec: 210 },
  { id: "gw-3", broker: "Vantage Raw ECN", server: "VantageFX-Live-01", ip: "104.22.45.19", latencyMs: 22, status: "OPTIMAL", connectedAccounts: 180, ticksPerSec: 145 },
  { id: "gw-4", broker: "FTMO Server Pro", server: "FTMO-Live-US", ip: "172.67.182.90", latencyMs: 38, status: "DEGRADED", connectedAccounts: 90, ticksPerSec: 92 },
];

const INITIAL_VPN_ACCOUNTS: VpnAccount[] = [
  { id: "vpn-1", peerName: "owner-macbook", assignedTo: "Marc-Aurèle V.", role: "OWNER", device: "MacBook Pro 16\" — Genève HQ", status: "ONLINE", vpnIp: "10.8.0.2", publicIp: "185.142.18.1", location: "Genève, CH", lastHandshake: "Il y a 18 sec", dataTransferred: "2.4 GB", twoFactorEnabled: true, createdAt: "2025-01-01" },
  { id: "vpn-2", peerName: "ludovic-macbook", assignedTo: "Ludovic Moreau", role: "SUPER_ADMIN", device: "MacBook Pro 14\" — Genève HQ", status: "ONLINE", vpnIp: "10.8.0.3", publicIp: "185.142.18.91", location: "Genève, CH", lastHandshake: "Il y a 42 sec", dataTransferred: "3.1 GB", twoFactorEnabled: true, createdAt: "2025-10-01" },
  { id: "vpn-3", peerName: "julien-laptop", assignedTo: "Julien Cassel", role: "CONSEILLER", device: "ThinkPad X1 — Home Office", status: "ONLINE", vpnIp: "10.8.0.4", publicIp: "84.226.11.40", location: "Lausanne, CH", lastHandshake: "Il y a 1 min", dataTransferred: "980 MB", twoFactorEnabled: true, createdAt: "2026-01-15" },
  { id: "vpn-4", peerName: "elena-laptop", assignedTo: "Elena Rostova", role: "SUPPORT", device: "MacBook Air — Desk Support", status: "ONLINE", vpnIp: "10.8.0.5", publicIp: "5.180.44.12", location: "Zürich, CH", lastHandshake: "Il y a 25 sec", dataTransferred: "1.2 GB", twoFactorEnabled: true, createdAt: "2026-02-01" },
  { id: "vpn-5", peerName: "marc-albarran-pc", assignedTo: "Marc Albarran", role: "FINANCE", device: "Dell XPS — Desk Financier", status: "OFFLINE", vpnIp: "10.8.0.6", publicIp: "82.66.14.203", location: "Paris, FR", lastHandshake: "Il y a 3h", dataTransferred: "645 MB", twoFactorEnabled: true, createdAt: "2026-01-20" },
  { id: "vpn-6", peerName: "antoine-workstation", assignedTo: "Dr. Antoine Reynaud", role: "QUANT", device: "Workstation Linux — Lab Quant", status: "OFFLINE", vpnIp: "10.8.0.7", publicIp: "146.70.22.18", location: "Bruxelles, BE", lastHandshake: "Il y a 1 jour", dataTransferred: "5.8 GB", twoFactorEnabled: true, createdAt: "2026-02-10" },
  { id: "vpn-7", peerName: "camille-laptop", assignedTo: "Camille Fontaine", role: "CONSEILLER", device: "MacBook Air — Home Office", status: "ONLINE", vpnIp: "10.8.0.8", publicIp: "90.12.44.78", location: "Annecy, FR", lastHandshake: "Il y a 55 sec", dataTransferred: "412 MB", twoFactorEnabled: true, createdAt: "2026-03-01" },
  { id: "vpn-8", peerName: "yanis-laptop", assignedTo: "Yanis Belkacem", role: "SUPPORT", device: "ThinkPad T14 — Shift de Nuit", status: "OFFLINE", vpnIp: "10.8.0.9", publicIp: "197.230.12.4", location: "Casablanca, MA", lastHandshake: "Il y a 6h", dataTransferred: "220 MB", twoFactorEnabled: false, createdAt: "2026-03-12" },
  { id: "vpn-9", peerName: "nadia-laptop", assignedTo: "Nadia Cherif", role: "SUPPORT", device: "MacBook Air — Desk Support", status: "OFFLINE", vpnIp: "10.8.0.10", publicIp: "197.230.9.51", location: "Casablanca, MA", lastHandshake: "Il y a 8h", dataTransferred: "310 MB", twoFactorEnabled: true, createdAt: "2026-03-12" },
  { id: "vpn-10", peerName: "thomas-devops", assignedTo: "Thomas Girard", role: "SUPER_ADMIN", device: "Linux Desktop — Infra & DevOps", status: "ONLINE", vpnIp: "10.8.0.11", publicIp: "51.15.88.202", location: "Paris, FR", lastHandshake: "Il y a 8 sec", dataTransferred: "7.2 GB", twoFactorEnabled: true, createdAt: "2025-11-05" },
  { id: "vpn-11", peerName: "sophie-pc", assignedTo: "Sophie Bernard", role: "FINANCE", device: "Dell Latitude — Desk Financier", status: "OFFLINE", vpnIp: "10.8.0.12", publicIp: "82.66.19.87", location: "Paris, FR", lastHandshake: "Il y a 2 jours", dataTransferred: "180 MB", twoFactorEnabled: true, createdAt: "2026-04-01" },
  { id: "vpn-12", peerName: "karim-workstation", assignedTo: "Karim Haddad", role: "QUANT", device: "Workstation Linux — Lab Quant", status: "OFFLINE", vpnIp: "10.8.0.13", publicIp: "197.230.15.9", location: "Casablanca, MA", lastHandshake: "Il y a 4h", dataTransferred: "3.4 GB", twoFactorEnabled: true, createdAt: "2026-04-15" },
  { id: "vpn-13", peerName: "lucas-devlaptop", assignedTo: "Lucas Meunier", role: "ADMIN", device: "MacBook Pro — Équipe Produit", status: "ONLINE", vpnIp: "10.8.0.14", publicIp: "90.15.66.21", location: "Lyon, FR", lastHandshake: "Il y a 1 min", dataTransferred: "1.9 GB", twoFactorEnabled: true, createdAt: "2026-05-02" },
  { id: "vpn-14", peerName: "chloe-laptop", assignedTo: "Chloé Dubois", role: "CONSEILLER", device: "MacBook Air — Home Office", status: "OFFLINE", vpnIp: "10.8.0.15", publicIp: "88.174.22.10", location: "Genève, CH", lastHandshake: "Il y a 45 min", dataTransferred: "560 MB", twoFactorEnabled: true, createdAt: "2026-05-10" },
  { id: "vpn-15", peerName: "rachid-laptop", assignedTo: "Rachid Amrani", role: "SUPPORT", device: "ThinkPad T14 — Shift de Nuit", status: "OFFLINE", vpnIp: "10.8.0.16", publicIp: "197.230.9.88", location: "Casablanca, MA", lastHandshake: "Il y a 10h", dataTransferred: "290 MB", twoFactorEnabled: false, createdAt: "2026-05-20" },
  { id: "vpn-16", peerName: "emma-pc", assignedTo: "Emma Vogel", role: "FINANCE", device: "Dell XPS — Desk Financier", status: "OFFLINE", vpnIp: "10.8.0.17", publicIp: "82.66.31.44", location: "Paris, FR", lastHandshake: "Il y a 5 jours", dataTransferred: "95 MB", twoFactorEnabled: true, createdAt: "2026-06-01" },
  { id: "vpn-17", peerName: "david-workstation", assignedTo: "David Cohen", role: "QUANT", device: "Workstation Linux — Lab Quant", status: "OFFLINE", vpnIp: "10.8.0.18", publicIp: "146.70.30.5", location: "Bruxelles, BE", lastHandshake: "Il y a 30 min", dataTransferred: "2.1 GB", twoFactorEnabled: true, createdAt: "2026-06-15" },
  { id: "vpn-18", peerName: "lea-laptop", assignedTo: "Léa Petit", role: "CONSEILLER", device: "MacBook Air — Home Office", status: "ONLINE", vpnIp: "10.8.0.19", publicIp: "90.18.77.62", location: "Annecy, FR", lastHandshake: "Il y a 33 sec", dataTransferred: "340 MB", twoFactorEnabled: true, createdAt: "2026-06-20" },
  { id: "vpn-19", peerName: "hugo-devlaptop", assignedTo: "Hugo Lambert", role: "ADMIN", device: "MacBook Pro — Équipe Produit", status: "DISABLED", vpnIp: "10.8.0.20", publicIp: "90.20.14.33", location: "Lyon, FR", lastHandshake: "Il y a 12 jours", dataTransferred: "1.1 GB", twoFactorEnabled: true, createdAt: "2026-02-20" },
  { id: "vpn-20", peerName: "ines-laptop", assignedTo: "Inès Roux", role: "SUPPORT", device: "MacBook Air — Ancien Poste", status: "DISABLED", vpnIp: "10.8.0.21", publicIp: "88.174.9.5", location: "Genève, CH", lastHandshake: "Il y a 41 jours", dataTransferred: "18 MB", twoFactorEnabled: false, createdAt: "2025-12-01" },
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
  { id: "msg-email-1", clientId: "usr-101", sender: "CLIENT", authorName: "Alexandre Dupuis", channel: "EMAIL", subject: "Demande d'attestation fiscale de trading 2026", text: "Bonjour l'équipe Nexium,\n\nPourriez-vous me transmettre l'attestation fiscale annuelle récapitulant mes plus-values nettes réalisées sur mon compte MT5 #992140 ?\n\nBien cordialement,\nAlexandre Dupuis", timestamp: "09:20", isRead: true },
  { id: "msg-email-2", clientId: "usr-101", sender: "ADMIN", authorName: "Desk Financier @ Nexium", channel: "EMAIL", subject: "Re: Demande d'attestation fiscale de trading 2026", text: "Bonjour Alexandre,\n\nVotre attestation fiscale certifiée pour l'exercice 2026 est disponible en pièce jointe avec le détail mensuel de vos gains nets (+$11,450 USD).\n\nRestant à votre entière disposition,\nLe Desk Financier", timestamp: "10:15", isRead: true },
  { id: "msg-5", clientId: "usr-102", sender: "CLIENT", authorName: "Sarah Benali", channel: "EMAIL", subject: "Augmentation du plafond de lot sur US30", text: "Bonjour,\n\nNous souhaiterions passer le lot max du robot Index Reversion à 1.5 lot sur notre compte institutionnel.\n\nMerci d'avance pour votre retour.", timestamp: "11:45", isRead: false },
  { id: "msg-6", clientId: "usr-102", sender: "ADMIN", authorName: "Dr. Antoine Reynaud (Quant)", channel: "EMAIL", subject: "Re: Augmentation du plafond de lot sur US30", text: "Bonjour Sarah,\n\nL'ajustement du lot max à 1.5 lot a été appliqué sur votre compte MT5 #993201. La marge requise reste sous le seuil de 2.9% de drawdown maximum autorisé.\n\nCordialement,\nDr. Antoine Reynaud", timestamp: "12:00", isRead: true },
];

const INITIAL_CALL_LOGS: CallLog[] = [
  { id: "call-1", clientId: "usr-101", clientName: "Alexandre Dupuis", advisorName: "Elena Rostova", date: "Aujourd'hui à 10:30", duration: "04 min 12 sec", outcome: "RÉSOLU", notes: "Point sur les performances mensuelles de l'algorithme AI Gold (+11.4%). Client satisfait." },
  { id: "call-2", clientId: "usr-102", clientName: "Sarah Benali", advisorName: "Dr. Antoine Reynaud", date: "Hier à 16:15", duration: "12 min 40 sec", outcome: "RÉSOLU", notes: "Revue institutionnelle sur la stratégie Index Reversion et point de latence VPS Genève." },
];

const CANNED_RESPONSES = [
  { title: "🛡️ News Guard NFP / FOMC", text: "Bonjour,\n\nConformément à nos règles de gestion du risque, les robots de trading sont automatiquement mis en pause 15 minutes avant et après les annonces macro-économiques majeures afin d'éviter tout décalage de spread." },
  { title: "💳 Procédure de Retrait SEPA", text: "Bonjour,\n\nVotre demande de retrait a bien été enregistrée par notre desk financier. Le virement vers votre compte bancaire enregistré est exécuté sous un délai standard de 24h ouvrées." },
  { title: "🤖 Optimisation Moteur Gold", text: "Bonjour,\n\nLe preset Conservateur sur Nexium AI Gold a été calibré avec un stop-loss basé sur l'ATR 1.2 pour préserver votre capital en période de forte volatilité de l'Or." },
  { title: "📄 Confirmation KYC & Pièces", text: "Bonjour,\n\nNous vous confirmons la bonne réception et validation de vos pièces justificatives de conformité. Vos plafonds de compte sont désormais débloqués." },
];

const EMAIL_STATUS_META: Record<"NON_ASSIGNE" | "EN_COURS" | "EN_ATTENTE" | "RESOLU", { label: string; variant: "amber" | "emerald" | "rose" | "slate" }> = {
  NON_ASSIGNE: { label: "Non assigné", variant: "rose" },
  EN_COURS: { label: "En cours", variant: "emerald" },
  EN_ATTENTE: { label: "En attente", variant: "amber" },
  RESOLU: { label: "Résolu", variant: "slate" },
};

const EMAIL_NAV_ITEMS: { key: EmailConversationFilter; label: string; icon: typeof Inbox; countKey: "inbox" | "mine" | "unassigned" | "inProgress" | "waiting" | "resolved" | null }[] = [
  { key: "inbox", label: "Boîte de réception", icon: Inbox, countKey: "inbox" },
  { key: "mine", label: "Mes conversations", icon: User, countKey: "mine" },
  { key: "unassigned", label: "Non assignés", icon: Mail, countKey: "unassigned" },
  { key: "in_progress", label: "En cours", icon: CheckCircle2, countKey: "inProgress" },
  { key: "waiting", label: "En attente", icon: Clock, countKey: "waiting" },
  { key: "resolved", label: "Résolus", icon: Check, countKey: null },
];

function matchesClient(c: UserProfile, q: string) {
  return (
    c.name.toLowerCase().includes(q) ||
    c.email.toLowerCase().includes(q) ||
    String(c.mt5.login).includes(q) ||
    c.mt5.broker.toLowerCase().includes(q)
  );
}

function matchesStaff(s: StaffAdministrator, q: string) {
  return (
    s.name.toLowerCase().includes(q) ||
    s.email.toLowerCase().includes(q) ||
    s.department.toLowerCase().includes(q) ||
    s.role.toLowerCase().includes(q)
  );
}

function matchesVpnAccount(v: VpnAccount, q: string) {
  return (
    v.assignedTo.toLowerCase().includes(q) ||
    v.peerName.toLowerCase().includes(q) ||
    v.device.toLowerCase().includes(q) ||
    v.role.toLowerCase().includes(q) ||
    v.vpnIp.includes(q) ||
    v.location.toLowerCase().includes(q)
  );
}

function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatEmailTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function matchesAuditEntry(l: AuditEntry, q: string) {
  return (
    l.admin.toLowerCase().includes(q) ||
    l.action.toLowerCase().includes(q) ||
    (l.targetUser ?? "").toLowerCase().includes(q) ||
    l.details.toLowerCase().includes(q)
  );
}

const STAFF_ROLE_OPTIONS: DropdownOption<AdminSystemRole>[] = [
  { value: "OWNER", label: "Owner (Propriétaire / Fondateur)" },
  { value: "SUPER_ADMIN", label: "Super Administrateur (Gouvernance & Direction)" },
  { value: "ADMIN", label: "Administrateur Général" },
  { value: "CONSEILLER", label: "Conseiller Privé & Chargé de Compte" },
  { value: "SUPPORT", label: "Conseiller Support & Relation Client" },
  { value: "FINANCE", label: "Gestionnaire Financier & Trésorerie" },
  { value: "QUANT", label: "Analyste Quantitatif & Stratégies MT5" },
];

const STAFF_DEPT_OPTIONS: DropdownOption<any>[] = [
  { value: "Direction Générale", label: "Direction Générale" },
  { value: "Desk Support & Conseillers", label: "Desk Support & Conseillers" },
  { value: "Gestion Financière", label: "Gestion Financière & Trésorerie" },
  { value: "Recherche Quantitative", label: "Recherche Quantitative & Algorithmes" },
  { value: "Conformité & Risque", label: "Conformité & Risque (Compliance)" },
];

const KYC_STATUS_OPTIONS: DropdownOption<KycStatus>[] = [
  { value: "VERIFIED", label: "Vérifié (Conforme)" },
  { value: "PENDING_REVIEW", label: "En attente de revue" },
  { value: "REJECTED", label: "Non conforme / Rejeté" },
];

const BROADCAST_AUDIENCE_OPTIONS: DropdownOption<"ALL" | "ACTIVE_ONLY" | "GOLD_USERS">[] = [
  { value: "ALL", label: "Tous les utilisateurs inscrits" },
  { value: "ACTIVE_ONLY", label: "Comptes actifs uniquement" },
  { value: "GOLD_USERS", label: "Utilisateurs du robot AI Gold" },
];

/* ========================================================================= */
/* DONNÉES DE DÉMONSTRATION E-MAILS (SIMULATION VISUELLE RICHE)              */
/* ========================================================================= */

const DEMO_EMAIL_CONVERSATIONS: EmailConversationListItem[] = [
  {
    id: "conv-demo-1",
    subject: "Demande de validation KYC & Relevé MT5 #802194",
    customerName: "Ludovic M.",
    customerEmail: "ludovic.m@investisseur-nexium.com",
    status: "EN_COURS",
    assignedUserId: "agent-1",
    assignedAgentName: "Dr. Antoine R.",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    lastMessagePreview: "Bonjour, pourriez-vous vérifier si mon justificatif de domicile et mon KYC sont bien validés pour mon compte ECN ?",
    attachmentCount: 1,
    unread: true,
  },
  {
    id: "conv-demo-2",
    subject: "Ajustement du Take Profit sur l'algorithme Nexium AI Gold",
    customerName: "Marc Delacroix",
    customerEmail: "marc.delacroix@quant-fund.ch",
    status: "EN_ATTENTE",
    assignedUserId: null,
    assignedAgentName: null,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
    lastMessagePreview: "J'aimerais passer mon ratio R:R de 1:2.0 à 1:3.0 sur les sessions de Londres. Quelle est la volatilité recommandée ?",
    attachmentCount: 0,
    unread: true,
  },
  {
    id: "conv-demo-3",
    subject: "Confirmation du dépôt SEPA 50,000 € · Crédit Immédiat",
    customerName: "Sophie Benali",
    customerEmail: "sophie.b@geneva-capital.com",
    status: "RESOLU",
    assignedUserId: "agent-1",
    assignedAgentName: "Elena V.",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
    lastMessagePreview: "Le virement SEPA instantané de 50 000 EUR a bien été crédité sur la balance de votre compte #802194.",
    attachmentCount: 2,
    unread: false,
  },
  {
    id: "conv-demo-4",
    subject: "Question technique : Latence du pont FIX Equinix NY4 (11ms)",
    customerName: "Alexandre Moreau",
    customerEmail: "alex.moreau@trading-pro.fr",
    status: "EN_COURS",
    assignedUserId: "agent-1",
    assignedAgentName: "Dr. Antoine R.",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    lastMessagePreview: "Pouvez-vous confirmer que la passerelle L2 utilise bien le cross-connect fibre optique sur le datacentre NY4 ?",
    attachmentCount: 0,
    unread: false,
  },
  {
    id: "conv-demo-5",
    subject: "Rapport mensuel de performance & Performance Fees (Q3)",
    customerName: "David Steinberg",
    customerEmail: "d.steinberg@nyse-algo.com",
    status: "RESOLU",
    assignedUserId: "agent-1",
    assignedAgentName: "Dr. Antoine R.",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
    lastMessagePreview: "Ci-joint l'audit comptable et le relevé des commissions de performance sous le principe High-Water Mark.",
    attachmentCount: 1,
    unread: false,
  },
];

const DEMO_EMAIL_DETAILS_MAP: Record<string, EmailConversationDetail> = {
  "conv-demo-1": {
    conversation: {
      ...DEMO_EMAIL_CONVERSATIONS[0],
      accountId: "acc-1",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    },
    messages: [
      {
        id: "msg-1",
        conversationId: "conv-demo-1",
        messageId: "m-1",
        direction: "INBOUND",
        fromEmail: "ludovic.m@investisseur-nexium.com",
        fromName: "Ludovic M.",
        toEmail: "support-vip@nexiummarkets.com",
        subject: "Demande de validation KYC & Relevé MT5 #802194",
        bodyHtml: null,
        bodyText: "Bonjour l'équipe Nexium,\n\nJe viens de déposer mon justificatif de domicile récent et ma pièce d'identité pour le compte ECN #802194. Pourriez-vous me confirmer que mon dossier est bien complet pour débloquer les plafonds de retraits SEPA ?\n\nMerci d'avance pour votre réactivité.\n\nBien cordialement,\nLudovic M.",
        sentByUserId: null,
        sendStatus: null,
        receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      },
      {
        id: "msg-2",
        conversationId: "conv-demo-1",
        messageId: "m-2",
        direction: "OUTBOUND",
        fromEmail: "support-vip@nexiummarkets.com",
        fromName: "Elena V. (Support VIP)",
        toEmail: "ludovic.m@investisseur-nexium.com",
        subject: "Re: Demande de validation KYC & Relevé MT5 #802194",
        bodyHtml: null,
        bodyText: "Bonjour Monsieur M.,\n\nNous vous confirmons la bonne réception de vos justificatifs. Votre compte ECN #802194 est désormais certifié au Niveau 3 (Tier Institutional).\n\nVos limites de dépôts et de retraits sont entièrement débloquées avec exécution prioritaire sous 2 heures ouvrées.\n\nRestant à votre entière disposition,\nElena V. — Nexium Desk Support",
        sentByUserId: "agent-1",
        sendStatus: "SENT",
        receivedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
    ],
    notes: [
      {
        id: "note-1",
        conversationId: "conv-demo-1",
        userId: "agent-1",
        authorName: "Elena V.",
        content: "Client VIP Tier Institutional validé. Traitement prioritaire accordé sur les flux SEPA et pont MT5.",
        createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      },
    ],
    attachments: [
      {
        id: "att-1",
        messageId: "msg-1",
        filename: "justificatif_domicile_2026.pdf",
        mimeType: "application/pdf",
        size: 1024 * 420,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      },
    ],
  },
  "conv-demo-2": {
    conversation: {
      ...DEMO_EMAIL_CONVERSATIONS[1],
      accountId: "acc-2",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
    },
    messages: [
      {
        id: "msg-201",
        conversationId: "conv-demo-2",
        messageId: "m-201",
        direction: "INBOUND",
        fromEmail: "marc.delacroix@quant-fund.ch",
        fromName: "Marc Delacroix",
        toEmail: "desk-quant@nexiummarkets.com",
        subject: "Ajustement du Take Profit sur l'algorithme Nexium AI Gold",
        bodyHtml: null,
        bodyText: "Bonjour Antoine,\n\nSur la paire XAUUSD, nous observons de fortes extensions de range lors des sessions de Londres (08h00 - 11h00 GMT). Pensez-vous qu'un R:R de 1:3.0 avec Trailing Stop dynamique à 15 pips soit optimal par rapport au backtest de l'algorithme ?\n\nMerci,\nMarc",
        sentByUserId: null,
        sendStatus: null,
        receivedAt: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
      },
    ],
    notes: [],
    attachments: [],
  },
  "conv-demo-3": {
    conversation: {
      ...DEMO_EMAIL_CONVERSATIONS[2],
      accountId: "acc-3",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
    },
    messages: [
      {
        id: "msg-301",
        conversationId: "conv-demo-3",
        messageId: "m-301",
        direction: "INBOUND",
        fromEmail: "sophie.b@geneva-capital.com",
        fromName: "Sophie Benali",
        toEmail: "finance@nexiummarkets.com",
        subject: "Confirmation du dépôt SEPA 50,000 € · Crédit Immédiat",
        bodyHtml: null,
        bodyText: "Bonjour,\n\nVeuillez trouver ci-joint l'ordre de virement SEPA instantané de 50 000,00 EUR émis ce matin depuis notre compte UBS Geneva.\n\nMerci de bien vouloir créditer le sous-compte MT5 #802194 dès réception.\n\nCordialement,\nSophie Benali",
        sentByUserId: null,
        sendStatus: null,
        receivedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
      {
        id: "msg-302",
        conversationId: "conv-demo-3",
        messageId: "m-302",
        direction: "OUTBOUND",
        fromEmail: "finance@nexiummarkets.com",
        fromName: "Desk Trésorerie Nexium",
        toEmail: "sophie.b@geneva-capital.com",
        subject: "Re: Confirmation du dépôt SEPA 50,000 € · Crédit Immédiat",
        bodyHtml: null,
        bodyText: "Chère Madame Benali,\n\nNous vous confirmons la bonne réception des fonds. La somme de 50 000,00 EUR a été créditée avec succès sur votre compte de trading MT5 #802194.\n\nLe solde disponible est immédiatement utilisable par vos algorithmes.\n\nCordialement,\nLe Desk Trésorerie",
        sentByUserId: "agent-finance",
        sendStatus: "SENT",
        receivedAt: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
      },
    ],
    notes: [
      {
        id: "note-301",
        conversationId: "conv-demo-3",
        userId: "agent-finance",
        authorName: "Trésorerie",
        content: "Dépôt validé et rapproché avec succès sur le compte séquestre ECN.",
        createdAt: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
      },
    ],
    attachments: [
      {
        id: "att-301",
        messageId: "msg-301",
        filename: "preuve_virement_ubs_50k.pdf",
        mimeType: "application/pdf",
        size: 1024 * 580,
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
    ],
  },
  "conv-demo-4": {
    conversation: {
      ...DEMO_EMAIL_CONVERSATIONS[3],
      accountId: "acc-4",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    },
    messages: [
      {
        id: "msg-401",
        conversationId: "conv-demo-4",
        messageId: "m-401",
        direction: "INBOUND",
        fromEmail: "alex.moreau@trading-pro.fr",
        fromName: "Alexandre Moreau",
        toEmail: "support-vip@nexiummarkets.com",
        subject: "Question technique : Latence du pont FIX Equinix NY4 (11ms)",
        bodyHtml: null,
        bodyText: "Bonjour,\n\nJ'ai déployé un bot sur EURUSD et je constate des exécutions quasi instantanées. Pouvez-vous me confirmer les specs de votre connecteur FIX L2 ?\n\nBien à vous,\nAlexandre",
        sentByUserId: null,
        sendStatus: null,
        receivedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      },
    ],
    notes: [],
    attachments: [],
  },
  "conv-demo-5": {
    conversation: {
      ...DEMO_EMAIL_CONVERSATIONS[4],
      accountId: "acc-5",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
    },
    messages: [
      {
        id: "msg-501",
        conversationId: "conv-demo-5",
        messageId: "m-501",
        direction: "INBOUND",
        fromEmail: "d.steinberg@nyse-algo.com",
        fromName: "David Steinberg",
        toEmail: "finance@nexiummarkets.com",
        subject: "Rapport mensuel de performance & Performance Fees (Q3)",
        bodyHtml: null,
        bodyText: "Bonjour,\n\nPourriez-vous me transmettre l'attestation de performance certifiée pour la clôture trimestrielle de notre fonds ?\n\nMerci,\nDavid",
        sentByUserId: null,
        sendStatus: null,
        receivedAt: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
      },
    ],
    notes: [],
    attachments: [],
  },
};

const DEMO_EMAIL_AGENTS: EmailAgentSummary[] = [
  { id: "agent-1", name: "Dr. Antoine R.", email: "desk-quant@nexiummarkets.com", role: "Recherche Quantitative", availability: "DISPONIBLE", canTransfer: true, activeConversations: 2 },
  { id: "agent-2", name: "Elena V.", email: "support-vip@nexiummarkets.com", role: "Support Client VIP", availability: "DISPONIBLE", canTransfer: true, activeConversations: 1 },
  { id: "agent-3", name: "Marc T.", email: "finance@nexiummarkets.com", role: "Trésorerie & Marges", availability: "DISPONIBLE", canTransfer: true, activeConversations: 2 },
];

/* ========================================================================= */
/* COMPOSANT PRINCIPAL : ADMINISTRATION NEXIUM                               */
/* ========================================================================= */

function NexiumAdminDashboard() {
  // Navigation
  const [activeSection, setActiveSection] = useState<
    "administrators" | "users" | "user-detail" | "create-user" | "messaging" | "emails" | "engines" | "finances" | "gateways" | "security" | "news-guard" | "perf-fees" | "logs" | "impersonation"
  >("users");

  // Rôle Admin Session
  const [currentSessionRole, setCurrentSessionRole] = useState<AdminSystemRole>("SUPER_ADMIN");

  // Palette de Couleurs Active (Émeraude Institutionnelle & Obsidian par défaut)
  const [adminPalette, setAdminPalette] = useState<"sapphire" | "emerald">("emerald");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Données
  const [clients, setClients] = useState<UserProfile[]>(INITIAL_CLIENTS);
  const [selectedUserId, setSelectedUserId] = useState<string>("usr-101");
  const [staffList, setStaffList] = useState<StaffAdministrator[]>(INITIAL_STAFF);
  const [gateways, setGateways] = useState<BrokerGateway[]>(INITIAL_GATEWAYS);
  const [vpnAccounts, setVpnAccounts] = useState<VpnAccount[]>(INITIAL_VPN_ACCOUNTS);
  const [vpnOnlyAdminAccess, setVpnOnlyAdminAccess] = useState<boolean>(true);
  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>(INITIAL_ECONOMIC_EVENTS);
  const [newsGuardActive, setNewsGuardActive] = useState<boolean>(true);

  // Messagerie State (chat uniquement — les e-mails vivent dans le module "E-mails")
  const [channelFilter, setChannelFilter] = useState<"ALL" | "CHAT" | "EMAIL">("ALL");
  const [messagesList, setMessagesList] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [callLogs, setCallLogs] = useState<CallLog[]>(INITIAL_CALL_LOGS);
  const [chatReplyInput, setChatReplyInput] = useState("");
  const [searchContactQuery, setSearchContactQuery] = useState("");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastAudience, setBroadcastAudience] = useState<"ALL" | "ACTIVE_ONLY" | "GOLD_USERS">("ALL");

  // Module E-mails — boîte collaborative unique via email-service (avec données de démonstration interactives)
  const [emailFilter, setEmailFilter] = useState<EmailConversationFilter>("inbox");
  const [emailSearch, setEmailSearch] = useState("");
  const [emailConversationsList, setEmailConversationsList] = useState<EmailConversationListItem[]>(DEMO_EMAIL_CONVERSATIONS);
  const [emailCounts, setEmailCounts] = useState({ inbox: 5, mine: 2, unassigned: 1, inProgress: 2, waiting: 1, resolved: 2 });
  const [selectedEmailConversationId, setSelectedEmailConversationId] = useState<string | null>("conv-demo-1");
  const [emailConversationDetail, setEmailConversationDetail] = useState<EmailConversationDetail | null>(DEMO_EMAIL_DETAILS_MAP["conv-demo-1"] ?? null);
  const [emailComposerMode, setEmailComposerMode] = useState<"REPLY" | "NOTE">("REPLY");
  const [emailReplyText, setEmailReplyText] = useState("");
  const [emailNoteText, setEmailNoteText] = useState("");
  const [emailPendingAttachments, setEmailPendingAttachments] = useState<{ id: string; filename: string; mimeType: string; size: number }[]>([]);
  const [emailAgentsList, setEmailAgentsList] = useState<EmailAgentSummary[]>(DEMO_EMAIL_AGENTS);
  const [emailListLoading, setEmailListLoading] = useState(false);
  const [emailDetailLoading, setEmailDetailLoading] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailUploadingAttachment, setEmailUploadingAttachment] = useState(false);
  const [emailMobileView, setEmailMobileView] = useState<"list" | "conversation">("list");
  const [emailApiError, setEmailApiError] = useState<string | null>(null);

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
  const [newStaffRole, setNewStaffRole] = useState<AdminSystemRole>("CONSEILLER");
  const [newStaffDept, setNewStaffDept] = useState<StaffAdministrator["department"]>("Desk Support & Conseillers");
  const [newStaffIpWhitelist, setNewStaffIpWhitelist] = useState("");
  const [newStaffHours, setNewStaffHours] = useState("");
  const [newStaffSignature, setNewStaffSignature] = useState("");
  const [newStaffPermChat, setNewStaffPermChat] = useState(true);
  const [newStaffPermEmail, setNewStaffPermEmail] = useState(true);
  const [newStaffPermPhone, setNewStaffPermPhone] = useState(true);
  const [newStaffPermFinance, setNewStaffPermFinance] = useState(false);
  const [newStaffPermEngines, setNewStaffPermEngines] = useState(false);
  const [newStaffPermPnl, setNewStaffPermPnl] = useState(false);
  const [newStaffPermKillSwitch, setNewStaffPermKillSwitch] = useState(false);
  const [newStaffPermManageStaff, setNewStaffPermManageStaff] = useState(false);
  const [newStaffPermViewTreasury, setNewStaffPermViewTreasury] = useState(false);

  // Édition & Gestion Approfondie d'un Membre du Staff / Conseiller / Super Admin
  const [editingStaffMember, setEditingStaffMember] = useState<StaffAdministrator | null>(null);
  const [editStaffName, setEditStaffName] = useState("");
  const [editStaffEmail, setEditStaffEmail] = useState("");
  const [editStaffPhone, setEditStaffPhone] = useState("");
  const [editStaffRole, setEditStaffRole] = useState<AdminSystemRole>("CONSEILLER");
  const [editStaffDept, setEditStaffDept] = useState<StaffAdministrator["department"]>("Desk Support & Conseillers");
  const [editStaffStatus, setEditStaffStatus] = useState<AccountStatus>("ACTIVE");
  const [editStaffIpWhitelist, setEditStaffIpWhitelist] = useState("");
  const [editStaffHours, setEditStaffHours] = useState("");
  const [editStaffSignature, setEditStaffSignature] = useState("");
  const [editStaffAssignedCount, setEditStaffAssignedCount] = useState<number>(0);
  const [editStaffPermChat, setEditStaffPermChat] = useState(true);
  const [editStaffPermEmail, setEditStaffPermEmail] = useState(true);
  const [editStaffPermPhone, setEditStaffPermPhone] = useState(true);
  const [editStaffPermFinance, setEditStaffPermFinance] = useState(false);
  const [editStaffPermEngines, setEditStaffPermEngines] = useState(false);
  const [editStaffPermPnl, setEditStaffPermPnl] = useState(false);
  const [editStaffPermKillSwitch, setEditStaffPermKillSwitch] = useState(false);
  const [editStaffPermManageStaff, setEditStaffPermManageStaff] = useState(false);
  const [editStaffPermViewTreasury, setEditStaffPermViewTreasury] = useState(false);

  // Formulaire Création Client
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientCountry, setNewClientCountry] = useState("");
  const [newClientDeposit, setNewClientDeposit] = useState("");
  const [newClientBonus, setNewClientBonus] = useState("");
  const [newClientMt5Login, setNewClientMt5Login] = useState("");
  const [newClientBroker, setNewClientBroker] = useState("");
  const [newClientServer, setNewClientServer] = useState("");

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([
    { id: "a-1", timestamp: "14:55:02", admin: "Super Admin", action: "PROFILE_OPENED", targetUser: "Alexandre Dupuis", details: "Consultation du profil client." },
    { id: "a-2", timestamp: "14:50:12", admin: "Elena Rostova", action: "MESSAGE_SENT", targetUser: "Alexandre Dupuis", details: "Réponse sur support direct News Guard." },
  ]);

  // Détection des privilèges Super Admin et Conseiller
  const isSuperAdmin = currentSessionRole === "SUPER_ADMIN" || currentSessionRole === "OWNER";
  const currentStaffMember = useMemo(() => staffList.find((s) => s.role === currentSessionRole), [staffList, currentSessionRole]);
  const [advisorFilter, setAdvisorFilter] = useState<string>("ALL");

  // Filtrage des clients : les conseillers ne voient que leur portefeuille assigné
  const visibleClients = useMemo(() => {
    if (!isSuperAdmin && currentStaffMember) {
      return clients.filter((c) =>
        c.assignedAdvisor?.toLowerCase().includes(currentStaffMember.name.toLowerCase())
      );
    }
    if (advisorFilter !== "ALL") {
      return clients.filter((c) => c.assignedAdvisor === advisorFilter);
    }
    return clients;
  }, [clients, isSuperAdmin, currentStaffMember, advisorFilter]);

  // Tableaux : recherche & pagination
  const clientsTable = useTableQuery(visibleClients, matchesClient);
  const staffTable = useTableQuery(staffList, matchesStaff);
  const auditLogsTable = useTableQuery(auditLogs, matchesAuditEntry);
  const feesTable = useTableQuery(clients, matchesClient);
  const vpnTable = useTableQuery(vpnAccounts, matchesVpnAccount);

  // Profil Client Sélectionné
  const activeClient = useMemo(() => {
    return clients.find((c) => c.id === selectedUserId) ?? clients[0];
  }, [clients, selectedUserId]);

  const impersonatedClient = useMemo(() => {
    return clients.find((c) => c.id === impersonatedClientId) ?? null;
  }, [clients, impersonatedClientId]);

  // Messages chat filtrés pour le client sélectionné (les e-mails vivent dans leur
  // propre module, voir activeSection "emails").
  const activeClientMessages = useMemo(() => {
    return messagesList.filter((m) => m.clientId === activeClient?.id && m.channel === "CHAT");
  }, [messagesList, activeClient]);

  // Signature desk automatique du collaborateur actuellement connecté
  const currentDeskSignature = useMemo(() => {
    const staffMember = staffList.find((s) => s.role === currentSessionRole);
    return staffMember?.deskSignature ?? `Conseiller Desk (${currentSessionRole}) — Nexium Markets`;
  }, [staffList, currentSessionRole]);

  // Identifiant email-service du collaborateur connecté — même id que staffList (voir
  // email-service/src/db/seed.ts), le temps qu'une vraie session serveur existe.
  const currentEmailAgentId = useMemo(() => {
    return staffList.find((s) => s.role === currentSessionRole)?.id ?? "adm-owner";
  }, [staffList, currentSessionRole]);

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

  // Synchronisation des clients réels depuis Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getAllClientProfiles().then((supabaseProfiles) => {
      if (!supabaseProfiles || supabaseProfiles.length === 0) return;
      setClients((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newMapped: UserProfile[] = supabaseProfiles
          .filter((p) => !existingIds.has(p.id))
          .map((p) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            phone: p.phone || "+33 6 00 00 00 00",
            country: "France 🇫🇷",
            status: p.status as AccountStatus,
            createdAt: p.created_at ? p.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
            lastActive: "Nouveau compte",
            ip: "127.0.0.1",
            twoFactorEnabled: false,
            forcePasswordReset: false,
            balance: p.balance || 0,
            bonusCredit: 0,
            equity: p.balance || 0,
            kycStatus: p.kyc_status === "VERIFIED" ? "VERIFIED" : "PENDING_REVIEW",
            licenseStatus: (p.license_status as any) || (p.status === "ACTIVE" && p.active_preset ? "ACTIVE" : "NOT_REQUESTED"),
            requestedPreset: p.requested_preset,
            activePreset: p.active_preset,
            kycDocuments: {
              idCardName: "En cours d'examen",
              proofOfAddressName: "En cours d'examen",
              submittedDate: "Aujourd'hui",
            },
            maxDailyLossPercent: 3.5,
            maxSimultaneousTrades: 3,
            riskGuardAutoStop: true,
            assignedAdvisor: p.assigned_advisor || "Dr. Antoine R.",
            sessions: [],
            crmNotes: [],
            withdrawalRequests: [],
            depositRequests: [],
            grossProfitTotal: p.gross_profit_total || 0,
            grossLossTotal: p.gross_loss_total || 0,
            bestTradePnl: 0,
            worstTradePnl: 0,
            todayGrossGain: 0,
            todayGrossLoss: 0,
            todayPnl: 0,
            totalNetPnl: (p.gross_profit_total || 0) - (p.gross_loss_total || 0),
            winRatePercent: 68.4,
            profitFactor: 2.14,
            maxDrawdownPercent: 3.8,
            tradesCount: 0,
            winningTradesCount: 0,
            losingTradesCount: 0,
            highWaterMark: p.balance || 0,
            lastFundingDate: "Nouveau compte",
            engines: {
              aiGold: { active: true, preset: "EQUINIX_NY4_DIRECT", maxLot: 1.0, minScore: 82, riskCapPercent: 2.0 },
              fxTrend: { active: true, preset: "INSTITUTIONAL_ALPHA", maxLot: 1.0, minScore: 78, riskCapPercent: 2.0 },
              indexReversion: { active: false, preset: "CONSERVATIVE_CORE", maxLot: 0.5, minScore: 85, riskCapPercent: 1.5 },
            },
            mt5: {
              login: p.mt5_login || `#NX-${Math.floor(100000 + Math.random() * 900000)}`,
              broker: p.mt5_broker || "Nexium Prime ECN",
              server: "Nexium-NY4-Equinix",
            },
            tradingHistory: [],
            livePositions: [],
          }));

        return [...newMapped, ...prev];
      });
    });
  }, []);

  // Validation & Activation d'un compte client par l'Administrateur
  const handleApprovePendingClient = async (client: UserProfile) => {
    const assignedMt5 = client.mt5.login || `#NX-${Math.floor(100000 + Math.random() * 900000)}`;

    // 1. Mise à jour Supabase
    if (isSupabaseConfigured) {
      await approveClientAccount(client.id, assignedMt5);
    }

    // 2. Mise à jour de l'état local
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === client.id) {
          return {
            ...c,
            status: "ACTIVE",
            kycStatus: "VERIFIED",
            mt5: {
              ...c.mt5,
              login: assignedMt5,
            },
          };
        }
        return c;
      })
    );

    // 3. Envoi e-mail officiel de bienvenue & d'activation avec Resend
    sendWelcomeEmail(client.email, client.name, assignedMt5).catch((err) =>
      console.warn("Resend activation error:", err)
    );

    // 4. Audit Log
    addAuditLog("CLIENT_APPROVED", `Compte de ${client.name} (${client.email}) validé et activé par la Direction.`, client.name);
    toast.success(`Le compte de ${client.name} est maintenant ACTIF. E-mail officiel d'activation envoyé !`);
  };

  // Rejet d'un compte client
  const handleRejectPendingClient = async (client: UserProfile) => {
    if (isSupabaseConfigured) {
      await rejectClientAccount(client.id);
    }

    setClients((prev) =>
      prev.map((c) => (c.id === client.id ? { ...c, status: "REVOKED", kycStatus: "REJECTED" } : c))
    );

    addAuditLog("CLIENT_REJECTED", `Demande de compte de ${client.name} (${client.email}) refusée.`, client.name);
    toast.error(`La demande de compte de ${client.name} a été refusée.`);
  };

  // Validation & Activation d'un Preset de Trading (SOUVERAINETÉ EXCLUSIVE DU SUPER ADMIN)
  const handleApproveClientPreset = async (client: UserProfile, presetKey?: string) => {
    if (!isSuperAdmin) {
      toast.error("Privilège insuffisant : Seul le Super Administrateur / Direction peut valider et activer les Presets.");
      return;
    }

    const finalPreset = presetKey || client.requestedPreset || "AI_GOLD";

    if (isSupabaseConfigured) {
      await approvePresetActivation(client.id, finalPreset);
    }

    setClients((prev) =>
      prev.map((c) => {
        if (c.id === client.id) {
          return {
            ...c,
            licenseStatus: "ACTIVE",
            activePreset: finalPreset,
            status: "ACTIVE",
          };
        }
        return c;
      })
    );

    // Envoi de l'e-mail officiel d'activation de la licence via Resend
    sendCustomDeskEmail(
      client.email,
      `Activation de votre Stratégie Algorithmique (${finalPreset})`,
      `Bonjour ${client.name},\n\nVotre demande d'activation pour le Preset Algorithmique [${finalPreset}] a été validée par la Direction des Opérations.\n\nVotre Dashboard de Trading en direct (flux Equinix NY4 FIX 4.4) est désormais déverrouillé et opérationnel sur votre compte MT5 #${client.mt5.login}.\n\nConnectez-vous dès maintenant pour suivre vos exécutions et vos performances en temps réel : https://nexiummarkets.com/login\n\nBien cordialement,\nLe Desk de Trading Nexium Markets`
    ).catch((err) => console.warn("Resend email error:", err));

    addAuditLog(
      "PRESET_APPROVED",
      `Preset [${finalPreset}] validé et activé pour ${client.name} (${client.email}) par le Super Admin. Dashboard déverrouillé.`,
      client.name
    );
    toast.success(`Preset [${finalPreset}] validé ! Le Dashboard de ${client.name} est maintenant totalement accessible.`);
  };

  // Attribution d'un client à un Administrateur / Conseiller Dédié
  const handleAssignAdvisor = async (client: UserProfile, newAdvisor: string) => {
    if (!isSuperAdmin) {
      toast.error("Seul le Super Administrateur peut réassigner les portefeuilles clients.");
      return;
    }

    if (isSupabaseConfigured) {
      await assignAdvisorToClient(client.id, newAdvisor);
    }

    setClients((prev) =>
      prev.map((c) => (c.id === client.id ? { ...c, assignedAdvisor: newAdvisor } : c))
    );

    addAuditLog(
      "ADVISOR_ASSIGNED",
      `Client ${client.name} (${client.email}) assigné au Conseiller ${newAdvisor}.`,
      client.name
    );
    toast.success(`Le client ${client.name} est désormais assigné à ${newAdvisor}.`);
  };

  // Envoi d'un message dans le chat desk
  // Messagerie = chat uniquement (les e-mails vivent dans leur propre module, voir
  // activeSection "emails" — boîte OVH séparée, gérée par email-service).
  const handleSendDeskMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatReplyInput.trim() || !activeClient) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      clientId: activeClient.id,
      sender: "ADMIN",
      authorName: `Conseiller Desk (${currentSessionRole})`,
      channel: "CHAT",
      text: chatReplyInput.trim(),
      timestamp: new Date().toLocaleTimeString("fr-FR").slice(0, 5),
      isRead: true,
    };

    setMessagesList((prev) => [...prev, newMsg]);
    addAuditLog("DESK_MESSAGE_SENT", `Message transmis à ${activeClient.name}.`, activeClient.name);
    toast.success(`Message transmis à ${activeClient.name}.`);
    setChatReplyInput("");
  };

  // Insertion d'une réponse rapide prédéfinie
  const handleInsertCannedResponse = (cr: { title: string; text: string }) => {
    setChatReplyInput(cr.text);
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

  // Création d'un Membre du Staff / Conseiller / Admin
  const handleCreateStaffMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) {
      toast.error("Veuillez renseigner au minimum le nom et l'e-mail.");
      return;
    }

    if (newStaffRole === "OWNER" && currentSessionRole !== "OWNER") {
      toast.error("Seul le Fondateur actuel peut désigner ou créer un rôle OWNER.");
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
      assignedTraders: [],
      permissions: {
        canChatWithClients: newStaffPermChat,
        canSendEmails: newStaffPermEmail,
        canTakePhoneCalls: newStaffPermPhone,
        canApproveFinances: newStaffPermFinance,
        canManageEngines: newStaffPermEngines,
        canAdjustPnl: newStaffPermPnl,
        canUseKillSwitch: newStaffPermKillSwitch,
        canManageStaff: newStaffPermManageStaff || newStaffRole === "OWNER" || newStaffRole === "SUPER_ADMIN",
        canViewTreasury: newStaffPermViewTreasury || newStaffRole === "OWNER" || newStaffRole === "SUPER_ADMIN" || newStaffRole === "FINANCE",
      },
    };

    setStaffList((prev) => [newStaff, ...prev]);
    addAuditLog("STAFF_CREATED", `Nouveau membre staff (${newStaffRole}) créé : ${newStaffName}.`);

    // Synchronisation avec Supabase Profiles & Resend
    if (isSupabaseConfigured) {
      supabase
        .from("profiles")
        .upsert({
          id: crypto.randomUUID ? crypto.randomUUID() : undefined,
          email: newStaff.email,
          name: newStaff.name,
          phone: newStaff.phone,
          role: newStaff.role,
          status: "ACTIVE",
          assigned_advisor: newStaff.department,
        })
        .then(
          () => console.log(`Staff ${newStaff.name} synchronisé dans Supabase.`),
          (err: any) => console.warn("Supabase staff sync error:", err)
        );
    }

    // Envoi de l'e-mail officiel de nomination / invitation
    sendCustomDeskEmail(
      newStaff.email,
      `Accréditation & Accès Desk Nexium Markets — Rôle ${newStaffRole}`,
      `Bonjour ${newStaffName},\n\nVotre compte collaborateur a été créé avec succès sur le Desk Central de Nexium Markets.\n\nRôle attribué : ${newStaffRole}\nDépartement : ${newStaffDept}\nStatut : Opérationnel & Sécurisé 2FA\n\nVous pouvez vous connecter dès à présent sur https://nexiummarkets.com/login avec votre adresse e-mail professionnelle.`
    ).catch((err) => console.warn("Resend staff invitation error:", err));

    toast.success(`Membre du staff ${newStaffName} (${newStaffRole}) créé avec succès.`);
    setNewStaffName("");
    setNewStaffEmail("");
    setNewStaffPhone("");
    setNewStaffIpWhitelist("");
    setNewStaffSignature("");
  };

  // Édition d'un Membre du Staff
  const handleOpenEditStaff = (st: StaffAdministrator) => {
    setEditingStaffMember(st);
    setEditStaffName(st.name);
    setEditStaffEmail(st.email);
    setEditStaffPhone(st.phone);
    setEditStaffRole(st.role);
    setEditStaffDept(st.department);
    setEditStaffStatus(st.status);
    setEditStaffIpWhitelist(st.ipWhitelist);
    setEditStaffHours(st.allowedHours);
    setEditStaffSignature(st.deskSignature);
    setEditStaffAssignedCount(st.assignedAccountsCount);
    setEditStaffPermChat(st.permissions.canChatWithClients);
    setEditStaffPermEmail(st.permissions.canSendEmails);
    setEditStaffPermPhone(st.permissions.canTakePhoneCalls);
    setEditStaffPermFinance(st.permissions.canApproveFinances);
    setEditStaffPermEngines(st.permissions.canManageEngines);
    setEditStaffPermPnl(st.permissions.canAdjustPnl);
    setEditStaffPermKillSwitch(st.permissions.canUseKillSwitch);
    setEditStaffPermManageStaff(st.permissions.canManageStaff ?? (st.role === "OWNER" || st.role === "SUPER_ADMIN"));
    setEditStaffPermViewTreasury(st.permissions.canViewTreasury ?? (st.role === "OWNER" || st.role === "SUPER_ADMIN" || st.role === "FINANCE"));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  const handleSaveEditStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaffMember) return;

    // Protection Souveraineté : Seul le OWNER peut modifier un compte OWNER
    if (editingStaffMember.role === "OWNER" && currentSessionRole !== "OWNER") {
      toast.error("Action refusée : Seul le Propriétaire (OWNER) peut modifier le compte Fondateur.");
      return;
    }

    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id !== editingStaffMember.id) return s;
        return {
          ...s,
          name: editStaffName,
          email: editStaffEmail,
          phone: editStaffPhone,
          role: editStaffRole,
          department: editStaffDept,
          status: editStaffStatus,
          ipWhitelist: editStaffIpWhitelist || "Toutes les adresses IP",
          allowedHours: editStaffHours || "24/7",
          deskSignature: editStaffSignature || `${editStaffName} — @ Nexium Markets`,
          assignedAccountsCount: editStaffAssignedCount,
          permissions: {
            canChatWithClients: editStaffPermChat,
            canSendEmails: editStaffPermEmail,
            canTakePhoneCalls: editStaffPermPhone,
            canApproveFinances: editStaffPermFinance,
            canManageEngines: editStaffPermEngines,
            canAdjustPnl: editStaffPermPnl,
            canUseKillSwitch: editStaffPermKillSwitch,
            canManageStaff: editStaffPermManageStaff || editStaffRole === "OWNER" || editStaffRole === "SUPER_ADMIN",
            canViewTreasury: editStaffPermViewTreasury || editStaffRole === "OWNER" || editStaffRole === "SUPER_ADMIN" || editStaffRole === "FINANCE",
          },
        };
      })
    );

    addAuditLog("STAFF_UPDATED", `Mise à jour des privilèges et du profil staff : ${editStaffName} (${editStaffRole}).`);
    toast.success(`Modifications enregistrées pour ${editStaffName}.`);
    setEditingStaffMember(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  const handleToggleStaffStatus = (st: StaffAdministrator) => {
    if (st.role === "OWNER") {
      toast.error("Impossible de suspendre ou révoquer le compte Propriétaire (OWNER).");
      return;
    }
    const newStatus: AccountStatus = st.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setStaffList((prev) => prev.map((s) => (s.id === st.id ? { ...s, status: newStatus } : s)));
    addAuditLog("STAFF_STATUS_CHANGE", `Statut du compte staff ${st.name} basculé vers ${newStatus}.`);
    toast.info(`Statut de ${st.name} mis à jour : ${newStatus}`);
  };

  const handleResetStaff2FA = (st: StaffAdministrator) => {
    setStaffList((prev) => prev.map((s) => (s.id === st.id ? { ...s, twoFactorEnabled: false } : s)));
    toast.success(`Double authentification 2FA réinitialisée pour ${st.name}.`);
  };

  const handleDeleteStaffMember = (st: StaffAdministrator) => {
    if (st.role === "OWNER") {
      toast.error("Action impossible : Le compte Propriétaire (OWNER) ne peut être supprimé.");
      return;
    }
    openConfirmModal(
      `Supprimer le membre du staff ${st.name} ?`,
      `Cette action révoquera définitivement tous les accès de ${st.name} (${st.role}) à la plateforme d'administration Nexium.`,
      "Supprimer Définitivement",
      "CRITICAL",
      () => {
        setStaffList((prev) => prev.filter((s) => s.id !== st.id));
        addAuditLog("STAFF_DELETED", `Compte staff ${st.name} (${st.role}) supprimé.`);
        toast.success(`Le compte de ${st.name} a été supprimé.`);
      }
    );
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
      country: newClientCountry || "France 🇫🇷",
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
        broker: newClientBroker || "Pepperstone ECN",
        server: newClientServer || "Pepperstone-Edge02",
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
    
    // Envoi de l'e-mail de bienvenue via Resend
    sendWelcomeEmail(newCl.email, newCl.name, newCl.mt5.login)
      .then((res) => {
        if (res.success && !res.simulated) {
          toast.success(`E-mail officiel de bienvenue expédié à ${newCl.email} via Resend.`);
        }
      })
      .catch((err) => console.warn("Resend welcome email warning:", err));

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
        
        // Envoi de la confirmation de dépôt par email via Resend
        sendDepositConfirmedEmail(
          activeClient.email,
          activeClient.name,
          `$${deposit.amount.toLocaleString("fr-FR")} USD`,
          activeClient.mt5.login
        ).then((res) => {
          if (res.success && !res.simulated) {
            toast.success(`E-mail de confirmation de dépôt expédié à ${activeClient.email} via Resend.`);
          }
        }).catch((err) => console.warn("Resend deposit email warning:", err));

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

  const handleTestAllServers = async () => {
    setGateways((prev) => prev.map((g) => ({ ...g, testing: true })));
    toast.info("Ping en cours sur toutes les passerelles...");

    await Promise.all(
      gateways.map(async (g) => {
        const delay = 600 + Math.random() * 1400;
        await new Promise((resolve) => setTimeout(resolve, delay));
        const newLatency = Math.round(8 + Math.random() * 60);
        const newStatus: BrokerGateway["status"] =
          newLatency > 50 ? "DEGRADED" : Math.random() < 0.05 ? "OFFLINE" : "OPTIMAL";
        setGateways((prev) =>
          prev.map((row) =>
            row.id === g.id ? { ...row, latencyMs: newLatency, status: newStatus, testing: false } : row
          )
        );
      })
    );

    addAuditLog("GATEWAY_LATENCY_TEST", "Test de latence exécuté sur toutes les passerelles MT5.");
    toast.success("Test de latence terminé sur toutes les passerelles.");
  };

  // Activer / désactiver un accès VPN WireGuard (via wg-easy)
  const handleToggleVpnAccount = (v: VpnAccount) => {
    const nextStatus: VpnAccount["status"] = v.status === "DISABLED" ? "OFFLINE" : "DISABLED";
    setVpnAccounts((prev) => prev.map((row) => (row.id === v.id ? { ...row, status: nextStatus, lastHandshake: "À l'instant" } : row)));
    addAuditLog(
      nextStatus === "DISABLED" ? "VPN_ACCESS_DISABLED" : "VPN_ACCESS_ENABLED",
      `Accès VPN "${v.peerName}" ${nextStatus === "DISABLED" ? "désactivé" : "réactivé"} pour ${v.assignedTo}.`,
      v.assignedTo
    );
    toast[nextStatus === "DISABLED" ? "error" : "success"](
      nextStatus === "DISABLED"
        ? `Accès VPN révoqué pour ${v.assignedTo}. Le tunnel WireGuard est immédiatement coupé.`
        : `Accès VPN réactivé pour ${v.assignedTo}.`
    );
  };

  // ── Module E-mails : chargement et interactions avec fallback de simulation ─────────
  const emailConfigured = isEmailApiConfigured();

  const refreshEmailCounts = useCallback(async () => {
    if (!emailConfigured) {
      setEmailCounts({ inbox: 5, mine: 2, unassigned: 1, inProgress: 2, waiting: 1, resolved: 2 });
      return;
    }
    try {
      const counts = await emailApi.getCounts(currentEmailAgentId);
      setEmailCounts(counts);
    } catch {
      // Erreur silencieuse
    }
  }, [emailConfigured, currentEmailAgentId]);

  const refreshEmailList = useCallback(async () => {
    if (!emailConfigured) {
      let filtered = [...DEMO_EMAIL_CONVERSATIONS];
      if (emailFilter === "mine") {
        filtered = filtered.filter((c) => c.assignedUserId === "agent-1");
      } else if (emailFilter === "unassigned") {
        filtered = filtered.filter((c) => !c.assignedUserId);
      } else if (emailFilter === "in_progress") {
        filtered = filtered.filter((c) => c.status === "EN_COURS");
      } else if (emailFilter === "waiting") {
        filtered = filtered.filter((c) => c.status === "EN_ATTENTE");
      } else if (emailFilter === "resolved") {
        filtered = filtered.filter((c) => c.status === "RESOLU");
      }
      if (emailSearch.trim()) {
        const q = emailSearch.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.subject.toLowerCase().includes(q) ||
            (c.customerName && c.customerName.toLowerCase().includes(q)) ||
            c.customerEmail.toLowerCase().includes(q)
        );
      }
      setEmailConversationsList(filtered);
      return;
    }

    setEmailListLoading(true);
    try {
      const { items } = await emailApi.listConversations(currentEmailAgentId, emailFilter, emailSearch);
      setEmailConversationsList(items);
      setEmailApiError(null);
    } catch (err) {
      setEmailApiError(err instanceof EmailApiError ? err.message : "Impossible de charger les conversations.");
    } finally {
      setEmailListLoading(false);
    }
  }, [emailConfigured, currentEmailAgentId, emailFilter, emailSearch]);

  const refreshEmailDetail = useCallback(
    async (conversationId: string) => {
      if (!emailConfigured) {
        const mockDetail = DEMO_EMAIL_DETAILS_MAP[conversationId];
        if (mockDetail) {
          setEmailConversationDetail(mockDetail);
        }
        return;
      }

      setEmailDetailLoading(true);
      try {
        const detail = await emailApi.getConversation(currentEmailAgentId, conversationId);
        setEmailConversationDetail(detail);
      } catch {
        toast.error("Impossible de charger cette conversation.");
      } finally {
        setEmailDetailLoading(false);
      }
    },
    [emailConfigured, currentEmailAgentId]
  );

  useEffect(() => {
    refreshEmailCounts();
    if (emailConfigured) {
      emailApi
        .listAgents(currentEmailAgentId)
        .then((r) => setEmailAgentsList(r.agents))
        .catch(() => {});
      const interval = setInterval(refreshEmailCounts, 20_000);
      return () => clearInterval(interval);
    } else {
      setEmailAgentsList(DEMO_EMAIL_AGENTS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailConfigured, currentEmailAgentId]);

  useEffect(() => {
    if (activeSection !== "emails") return;
    refreshEmailList();
    if (emailConfigured) {
      const interval = setInterval(refreshEmailList, 15_000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailConfigured, activeSection, emailFilter, emailSearch]);

  useEffect(() => {
    if (selectedEmailConversationId) {
      refreshEmailDetail(selectedEmailConversationId);
    } else {
      setEmailConversationDetail(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmailConversationId]);

  const handleSelectEmailConversation = (id: string) => {
    setSelectedEmailConversationId(id);
    setEmailComposerMode("REPLY");
    setEmailReplyText("");
    setEmailNoteText("");
    setEmailPendingAttachments([]);
    setEmailMobileView("conversation");
  };

  const handleAssignEmailConversation = async (targetUserId: string) => {
    if (!selectedEmailConversationId || !targetUserId) return;
    if (!emailConfigured) {
      const agent = DEMO_EMAIL_AGENTS.find((a) => a.id === targetUserId);
      toast.success(`Conversation assignée à ${agent?.name ?? "l'agent"}.`);
      if (emailConversationDetail) {
        setEmailConversationDetail({
          ...emailConversationDetail,
          conversation: {
            ...emailConversationDetail.conversation,
            assignedUserId: targetUserId,
            assignedAgentName: agent?.name ?? null,
          },
        });
      }
      return;
    }
    try {
      if (targetUserId === currentEmailAgentId) {
        await emailApi.claim(currentEmailAgentId, selectedEmailConversationId);
        toast.success("Conversation assignée.");
      } else {
        await emailApi.transfer(currentEmailAgentId, selectedEmailConversationId, targetUserId);
        toast.success("Conversation transférée.");
      }
      refreshEmailDetail(selectedEmailConversationId);
      refreshEmailList();
      refreshEmailCounts();
    } catch (err) {
      toast.error(err instanceof EmailApiError && err.code === "already_assigned" ? "Cette conversation est déjà prise en charge." : "Action impossible.");
    }
  };

  const handleSetEmailStatus = async (status: EmailConversationDetail["conversation"]["status"]) => {
    if (!selectedEmailConversationId) return;
    if (!emailConfigured) {
      toast.success(`Statut mis à jour : ${EMAIL_STATUS_META[status].label}`);
      if (emailConversationDetail) {
        setEmailConversationDetail({
          ...emailConversationDetail,
          conversation: {
            ...emailConversationDetail.conversation,
            status,
          },
        });
      }
      return;
    }
    try {
      await emailApi.setStatus(currentEmailAgentId, selectedEmailConversationId, status);
      refreshEmailDetail(selectedEmailConversationId);
      refreshEmailList();
      refreshEmailCounts();
    } catch {
      toast.error("Impossible de changer le statut.");
    }
  };

  const handleUploadEmailAttachment = async (file: File) => {
    if (!selectedEmailConversationId) return;
    setEmailUploadingAttachment(true);
    try {
      if (!emailConfigured) {
        const mockAtt = {
          id: `att-local-${Date.now()}`,
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
        };
        setEmailPendingAttachments((prev) => [...prev, mockAtt]);
        toast.success(`Pièce jointe ajoutée : ${file.name}`);
        return;
      }
      const uploaded = await emailApi.uploadAttachment(currentEmailAgentId, selectedEmailConversationId, file);
      setEmailPendingAttachments((prev) => [...prev, uploaded]);
    } catch (err) {
      toast.error(err instanceof EmailApiError ? err.message : "Pièce jointe refusée.");
    } finally {
      setEmailUploadingAttachment(false);
    }
  };

  const handleDownloadEmailAttachment = async (attachmentId: string, filename: string) => {
    if (!emailConfigured) {
      toast.info(`Téléchargement de la pièce jointe : ${filename}`);
      return;
    }
    try {
      await emailApi.downloadAttachment(currentEmailAgentId, attachmentId, filename);
    } catch {
      toast.error("Téléchargement impossible.");
    }
  };

  const handleSendEmailReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmailConversationId || !emailReplyText.trim()) return;
    setEmailSending(true);
    try {
      if (!emailConfigured) {
        const newMsg: EmailMessage = {
          id: `msg-rep-${Date.now()}`,
          conversationId: selectedEmailConversationId,
          messageId: `m-${Date.now()}`,
          direction: "OUTBOUND",
          fromEmail: "support-vip@nexiummarkets.com",
          fromName: "Vous (Desk Nexium)",
          toEmail: emailConversationDetail?.conversation.customerEmail ?? "client@nexium.com",
          subject: `Re: ${emailConversationDetail?.conversation.subject ?? "Message"}`,
          bodyHtml: null,
          bodyText: emailReplyText.trim(),
          sentByUserId: currentEmailAgentId,
          sendStatus: "SENT",
          receivedAt: new Date().toISOString(),
        };

        if (emailConversationDetail) {
          setEmailConversationDetail({
            ...emailConversationDetail,
            messages: [...emailConversationDetail.messages, newMsg],
          });
        }

        // Expédition réelle via Resend
        sendCustomDeskEmail(
          emailConversationDetail?.conversation.customerEmail ?? "client@nexium.com",
          `Re: ${emailConversationDetail?.conversation.subject ?? "Message Officiel Nexium Markets"}`,
          emailReplyText.trim()
        ).then((res) => {
          if (res.success && !res.simulated) {
            toast.success(`E-mail expédié avec succès via Resend.`);
          }
        }).catch((err) => console.warn("Resend email reply warning:", err));

        toast.success("E-mail officiel envoyé au client.");
        setEmailReplyText("");
        setEmailPendingAttachments([]);
        return;
      }

      await emailApi.reply(
        currentEmailAgentId,
        selectedEmailConversationId,
        emailReplyText.trim(),
        emailPendingAttachments.map((a) => a.id)
      );
      toast.success("E-mail envoyé.");
      setEmailReplyText("");
      setEmailPendingAttachments([]);
      refreshEmailDetail(selectedEmailConversationId);
      refreshEmailList();
    } catch (err) {
      toast.error(err instanceof EmailApiError ? `Échec de l'envoi : ${err.message}` : "Échec de l'envoi de l'e-mail.");
    } finally {
      setEmailSending(false);
    }
  };

  const handleAddEmailNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmailConversationId || !emailNoteText.trim()) return;
    setEmailSending(true);
    try {
      if (!emailConfigured) {
        const newNote: EmailNote = {
          id: `note-${Date.now()}`,
          conversationId: selectedEmailConversationId,
          userId: currentEmailAgentId,
          authorName: "Vous (Agent)",
          content: emailNoteText.trim(),
          createdAt: new Date().toISOString(),
        };

        if (emailConversationDetail) {
          setEmailConversationDetail({
            ...emailConversationDetail,
            notes: [...emailConversationDetail.notes, newNote],
          });
        }
        toast.success("Note interne ajoutée au dossier.");
        setEmailNoteText("");
        return;
      }

      await emailApi.addNote(currentEmailAgentId, selectedEmailConversationId, emailNoteText.trim());
      toast.success("Note interne ajoutée.");
      setEmailNoteText("");
      refreshEmailDetail(selectedEmailConversationId);
    } catch {
      toast.error("Impossible d'ajouter la note.");
    } finally {
      setEmailSending(false);
    }
  };

  const handleTriggerEmailSync = async () => {
    if (!emailConfigured) {
      toast.success("Synchronisation effectuée : 5 conversations à jour.");
      refreshEmailList();
      return;
    }
    try {
      const result = await emailApi.triggerSync(currentEmailAgentId);
      if ("error" in result) {
        toast.error(result.error === "ovh_not_configured" ? "Configuration OVH non renseignée." : "Échec de la synchro.");
        return;
      }
      toast.success(`Synchro terminée : ${result.imported} nouveau(x) message(s).`);
      refreshEmailList();
      refreshEmailCounts();
    } catch {
      toast.error("Échec de la synchro.");
    }
  };

  // Fusionne messages et notes internes en une seule chronologie (§4/§9).
  const emailTimeline = useMemo(() => {
    if (!emailConversationDetail) return [];
    const msgs = emailConversationDetail.messages.map((m) => ({ kind: "message" as const, at: m.receivedAt, message: m }));
    const notes = emailConversationDetail.notes.map((n) => ({ kind: "note" as const, at: n.createdAt, note: n }));
    return [...msgs, ...notes].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [emailConversationDetail]);

  const handleExportAuditLogs = () => {
    const rows: (string | number)[][] = [
      ["Horodatage", "Auteur", "Action", "Utilisateur Cible", "Détails"],
      ...auditLogs.map((log) => [log.timestamp, log.admin, log.action, log.targetUser ?? "-", log.details]),
    ];
    downloadCsv(`nexium-admin-journal-audit-${auditLogs.length}.csv`, rows);
    toast.success(`Journal d'audit exporté (${auditLogs.length} entrées).`);
  };

  const totalBalance = useMemo(() => clients.reduce((acc, c) => acc + c.balance, 0), [clients]);
  const totalBonus = useMemo(() => clients.reduce((acc, c) => acc + c.bonusCredit, 0), [clients]);

  return (
    <div className={`min-h-screen bg-[#0a0e17] text-slate-100 font-sans selection:bg-emerald-500/30 flex flex-col antialiased palette-${adminPalette}`}>
      {/* Modale de Confirmation */}
      {confirmModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-in fade-in"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-700/60 bg-[#121a2d] p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3.5 border-b border-slate-700/50 pb-4">
              <div className={`grid size-12 place-items-center rounded-xl ${
                confirmModal.dangerLevel === "CRITICAL" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}>
                <AlertTriangle className="size-6" />
              </div>
              <div>
                <h3 id="confirm-modal-title" className="text-xl font-bold text-white tracking-tight">{confirmModal.title}</h3>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">Confirmation Requise</span>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{confirmModal.description}</p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/50">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="admin-btn-secondary"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={confirmModal.dangerLevel === "CRITICAL" ? "rounded-xl px-5 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg cursor-pointer" : "admin-btn-primary"}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BANDEAU IMPERSONATION */}
      {impersonatedClient && activeSection === "impersonation" && (
        <div className="sticky top-0 z-50 border-b border-amber-500/40 bg-[#1a1206]/95 backdrop-blur-xl text-amber-300 px-6 py-2.5 flex flex-wrap items-center justify-between shadow-[0_0_24px_rgba(245,158,11,0.15)] font-semibold text-sm">
          <div className="flex items-center gap-2.5">
            <span className="size-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="font-bold uppercase tracking-wide">
              SUPERVISION LIVE : {impersonatedClient.name} (MT5 #{impersonatedClient.mt5.login})
            </span>
          </div>

          <button
            onClick={() => {
              setImpersonatedClientId(null);
              setActiveSection("users");
              toast.info("Supervision terminée. Retour à l'administration.");
            }}
            className="rounded-lg border border-amber-500/40 bg-[#0c121e] hover:bg-amber-500/20 text-amber-300 px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
          >
            Quitter la Supervision &amp; Retour Admin
          </button>
        </div>
      )}

      {/* TOPBAR */}
      <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-between border-b border-slate-700/50 bg-[#0d1322]/95 px-6 lg:px-8 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="grid size-9 shrink-0 place-items-center rounded-xl border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer transition"
            title={sidebarCollapsed ? "Afficher le menu" : "Masquer le menu"}
            aria-label={sidebarCollapsed ? "Afficher le menu" : "Masquer le menu"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="size-4.5" /> : <PanelLeftClose className="size-4.5" />}
          </button>
          <Link to="/" className="group flex flex-col justify-center leading-tight cursor-pointer">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-2xl font-black tracking-[0.2em] text-white uppercase group-hover:text-emerald-400 transition-colors">
                NEXIUM
              </span>
              <span className="h-4 w-0.5 bg-gradient-to-b from-emerald-400 to-transparent" />
              <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                ADMIN
              </span>
            </div>
            <span className="mt-0.5 font-sans text-[10px] font-bold tracking-[0.25em] text-slate-400 uppercase">
              OPERATIONS &amp; GOVERNANCE CENTER
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3.5">
          {/* Badge Session Administrateur Authentifié */}
          <button
            type="button"
            onClick={() => setActiveSection("administrators")}
            className="flex items-center gap-2.5 rounded-xl border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800/90 px-3.5 py-2 transition cursor-pointer shadow-sm group"
            title="Gérer les collaborateurs et les niveaux d'accès"
          >
            <div className="size-7 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 grid place-items-center font-bold text-xs">
              👑
            </div>
            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">Ludovic M.</span>
                <span className="size-1.5 rounded-full bg-emerald-400"></span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 block">Propriétaire (Owner)</span>
            </div>
            <ShieldCheck className="size-4 text-slate-400 group-hover:text-emerald-400 transition-colors ml-1" />
          </button>

          {/* Lien direct vers le portail client */}
          <Link
            to="/NEXIUM"
            className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-300 hover:text-white transition cursor-pointer shadow-sm"
            title="Accéder à l'interface de trading vue par les clients"
          >
            <Eye className="size-4 text-emerald-400" />
            <span className="hidden sm:inline">Portail Client</span>
          </Link>
        </div>
      </header>

      {/* CORPS PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`shrink-0 border-r border-slate-800/80 bg-[#0c121e]/95 flex flex-col justify-between overflow-y-auto transition-all duration-200 ${
            sidebarCollapsed ? "w-0 p-0 border-r-0 opacity-0 pointer-events-none overflow-hidden" : "w-72 lg:w-80 p-5 space-y-5 opacity-100"
          }`}
        >
          <AdminSidebarNav
            items={[
              {
                key: "users",
                label: "Comptes Clients",
                icon: Users,
                badge: clients.length,
                isActive: activeSection === "users" || activeSection === "user-detail" || activeSection === "create-user",
              },
              {
                key: "administrators",
                label: "Administration",
                icon: ShieldCheck,
                badge: staffList.length,
                isActive: activeSection === "administrators",
              },
              {
                key: "messaging",
                label: "Messagerie",
                icon: MessageSquare,
                badge: "EN DIRECT",
                badgeTone: "brand",
                isActive: activeSection === "messaging",
              },
              {
                key: "emails",
                label: "E-mails",
                icon: Inbox,
                isActive: activeSection === "emails",
                ...(emailCounts.inbox ? { badge: emailCounts.inbox } : {}),
              },
              { key: "gateways", label: "Passerelles MT5 & VPS", icon: Radio, isActive: activeSection === "gateways" },
              {
                key: "security",
                label: "Sécurité & Accès VPN",
                icon: Lock,
                badge: vpnAccounts.filter((v) => v.status === "ONLINE").length,
                badgeTone: "brand",
                isActive: activeSection === "security",
              },
              { key: "news-guard", label: "News Guard Macro", icon: Newspaper, isActive: activeSection === "news-guard" },
              { key: "perf-fees", label: "Performance Fees", icon: Receipt, isActive: activeSection === "perf-fees" },
              { key: "engines", label: "Moteurs & Auto-Trader", icon: Bot, isActive: activeSection === "engines" },
              { key: "finances", label: "Finances & Dépôts", icon: Wallet, isActive: activeSection === "finances" },
              { key: "logs", label: "Journal d'Audit", icon: Terminal, isActive: activeSection === "logs" },
            ]}
            onSelect={(key) => setActiveSection(key as typeof activeSection)}
          />

          <AdminPanel padding="p-4" className="text-xs font-mono space-y-2.5 text-slate-300 shadow-md">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Total Dépôts :</span>
              <strong className="text-emerald-400 font-bold text-sm">${totalBalance.toLocaleString("fr-FR")} USD</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Bonus Accordés :</span>
              <strong className="text-amber-300 font-bold text-sm">+${totalBonus.toLocaleString("fr-FR")} USD</strong>
            </div>
          </AdminPanel>
        </aside>

        {/* Espace Central */}
        <main className="flex-1 bg-[#0a0e17] p-6 lg:p-8 overflow-y-auto max-w-[1700px] mx-auto w-full">
          {/* ===================================================================== */}
          {/* 🌟 1. SECTION COMPTES CLIENTS (TABLEAU)                                */}
          {/* ===================================================================== */}
          {activeSection === "users" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-slate-700/50 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Users className="size-7 text-emerald-400" />
                    <span>Comptes Clients</span>
                  </h1>
                  {!isSuperAdmin && currentStaffMember && (
                    <p className="text-xs text-slate-400 mt-1">
                      Vue restreinte : Portefeuille dédié de <strong className="text-emerald-400">{currentStaffMember.name}</strong> ({visibleClients.length} clients)
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Sélecteur de Portefeuille Conseiller pour le Super Admin */}
                  {isSuperAdmin && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium">Portefeuille :</span>
                      <select
                        value={advisorFilter}
                        onChange={(e) => setAdvisorFilter(e.target.value)}
                        className="rounded-xl border border-white/[0.12] bg-[#141a23] text-xs font-bold text-emerald-400 px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="ALL">Tous les Conseillers ({clients.length} Clients)</option>
                        {staffList.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} ({clients.filter((c) => c.assignedAdvisor?.includes(s.name)).length})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    onClick={() => setActiveSection("create-user")}
                    className="admin-btn-primary"
                  >
                    <Plus className="size-4" />
                    <span>Créer un Client</span>
                  </button>
                </div>
              </div>

              {/* ── CARTES SYNTHÈSE MULTI-ACCENTS (HARMONIE PROFIL) ── */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 font-mono">
                <div className="admin-card-emerald p-5 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-300 uppercase font-semibold font-sans">Capitaux Sous Gestion</span>
                    <div className="grid size-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400">
                      <Wallet className="size-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">
                    ${totalBalance.toLocaleString("fr-FR")} USD
                  </p>
                  <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                    <span>Bonus accordés :</span>
                    <strong className="text-emerald-300">+${totalBonus.toLocaleString("fr-FR")}</strong>
                  </div>
                </div>

                <div className="admin-card-cyan p-5 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-300 uppercase font-semibold font-sans">Traders Actifs MT5</span>
                    <div className="grid size-8 place-items-center rounded-lg bg-cyan-500/15 text-cyan-400">
                      <Users className="size-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-cyan-300">
                    {clients.filter((c) => c.status === "ACTIVE").length} <span className="text-xs font-normal text-slate-400">/ {clients.length}</span>
                  </p>
                  <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                    <span>Passerelle :</span>
                    <strong className="text-cyan-400">ECN NY4 FIX</strong>
                  </div>
                </div>

                <div className="admin-card-amber p-5 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-300 uppercase font-semibold font-sans">P&amp;L Consolidé (Net)</span>
                    <div className="grid size-8 place-items-center rounded-lg bg-amber-500/15 text-amber-300">
                      <TrendingUp className="size-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-amber-300">
                    +${clients.reduce((acc, c) => acc + c.totalNetPnl, 0).toLocaleString("fr-FR")} USD
                  </p>
                  <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                    <span>Performance moyenne :</span>
                    <strong className="text-amber-400">+14.8%</strong>
                  </div>
                </div>

                <div className="admin-card-purple p-5 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-300 uppercase font-semibold font-sans">Moteurs Algorithmiques</span>
                    <div className="grid size-8 place-items-center rounded-lg bg-purple-500/15 text-purple-400">
                      <Bot className="size-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-purple-300">
                    3 Moteurs IA
                  </p>
                  <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                    <span>Gold / FX / Index :</span>
                    <strong className="text-purple-300">100% Opérationnels</strong>
                  </div>
                </div>
              </div>

              {/* ── BANNIÈRE COMPTES EN ATTENTE DE VALIDATION ── */}
              {clients.some((c) => c.status === "PENDING_APPROVAL") && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-amber-500/20 text-amber-400 grid place-items-center shrink-0">
                      <ShieldCheck className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-amber-300">
                        {clients.filter((c) => c.status === "PENDING_APPROVAL").length} Compte(s) en Attente d'Approbation Réglementaire
                      </h3>
                      <p className="text-xs text-slate-300">
                        Les investisseurs ci-dessous ont créé leur compte et attendent votre validation pour accéder à leur Dashboard MT5.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── BANNIÈRE DEMANDES DE PRESET EN ATTENTE ── */}
              {clients.some((c) => c.licenseStatus === "PENDING_PRESET_APPROVAL") && (
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-cyan-500/20 text-cyan-400 grid place-items-center shrink-0">
                      <Zap className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-cyan-300">
                        {clients.filter((c) => c.licenseStatus === "PENDING_PRESET_APPROVAL").length} Demande(s) d'Activation de Preset Algorithmique
                      </h3>
                      <p className="text-xs text-slate-300">
                        {isSuperAdmin
                          ? "Des clients ont validé leur sélection de stratégie. Validez leur abonnement ci-dessous pour déverrouiller leur Dashboard."
                          : "Des clients ont validé leur sélection de stratégie. Validation réservée au Super Administrateur."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tableau Clients */}
              <AdminDataTable
                columns={[
                  {
                    key: "client",
                    header: "CLIENT & MT5",
                    render: (c: UserProfile) => (
                      <div className="font-sans">
                        <strong className="text-sm font-semibold text-white block">{c.name}</strong>
                        <span className="text-xs text-slate-400 font-mono">{c.email}</span>
                        <span className="text-xs text-emerald-400 font-mono block mt-0.5">MT5 #{c.mt5.login} · {c.mt5.broker}</span>
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    header: "STATUT & LICENCE",
                    render: (c: UserProfile) => (
                      <div className="space-y-1">
                        <AdminBadge
                          variant={
                            c.status === "PENDING_APPROVAL"
                              ? "amber"
                              : c.licenseStatus === "PENDING_PRESET_APPROVAL"
                              ? "cyan"
                              : c.status === "ACTIVE"
                              ? "emerald"
                              : c.status === "SUSPENDED"
                              ? "amber"
                              : "rose"
                          }
                          dot={false}
                        >
                          {c.status === "PENDING_APPROVAL"
                            ? "⏳ COMPTE EN ATTENTE"
                            : c.licenseStatus === "PENDING_PRESET_APPROVAL"
                            ? `🎯 PRESET : ${c.requestedPreset || "AI_GOLD"}`
                            : c.status}
                        </AdminBadge>
                        <span className="text-[11px] text-indigo-300 font-mono block">
                          KYC : {c.kycStatus} {c.activePreset ? `· ${c.activePreset}` : ""}
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: "advisor",
                    header: "CONSEILLER DÉDIÉ",
                    render: (c: UserProfile) => (
                      <div>
                        {isSuperAdmin ? (
                          <select
                            value={c.assignedAdvisor || "Dr. Antoine R."}
                            onChange={(e) => handleAssignAdvisor(c, e.target.value)}
                            className="text-xs font-semibold rounded-lg bg-black/40 border border-slate-700 text-slate-200 px-2 py-1 focus:border-emerald-500 focus:outline-none cursor-pointer"
                          >
                            {staffList.map((s) => (
                              <option key={s.id} value={s.name}>
                                {s.name} ({s.role})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs font-medium text-slate-300 bg-white/[0.06] px-2.5 py-1 rounded-lg border border-white/[0.08]">
                            {c.assignedAdvisor || "Non assigné"}
                          </span>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: "balance",
                    header: "SOLDE & P&L JOUR",
                    render: (c: UserProfile) => (
                      <div>
                        <strong className="text-sm font-bold text-white block font-mono">${c.balance.toLocaleString("fr-FR")} USD</strong>
                        <span className={`text-xs font-semibold block font-mono ${c.todayPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {c.todayPnl >= 0 ? "+" : ""}${c.todayPnl.toLocaleString("fr-FR")} (Aujourd'hui)
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: "pnl",
                    header: "GAIN NET GLOBAL",
                    render: (c: UserProfile) => (
                      <div>
                        <strong className="text-sm font-bold text-emerald-400 block font-mono">+${c.totalNetPnl.toLocaleString("fr-FR")} USD</strong>
                        <span className="text-xs text-slate-400 font-mono">Win Rate: {c.winRatePercent}%</span>
                      </div>
                    ),
                  },
                  {
                    key: "action",
                    header: "ACTION",
                    align: "right",
                    render: (c: UserProfile) => (
                      <div className="flex items-center justify-end gap-2">
                        {c.status === "PENDING_APPROVAL" ? (
                          <>
                            <button
                              onClick={() => handleApprovePendingClient(c)}
                              className="rounded-xl border border-emerald-500 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black py-1.5 px-3 transition cursor-pointer inline-flex items-center gap-1 shadow-sm"
                            >
                              <CheckCircle2 className="size-3.5" />
                              <span>Valider Compte</span>
                            </button>
                            <button
                              onClick={() => handleRejectPendingClient(c)}
                              className="rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold py-1.5 px-2.5 transition cursor-pointer"
                            >
                              Refuser
                            </button>
                          </>
                        ) : c.licenseStatus === "PENDING_PRESET_APPROVAL" ? (
                          <>
                            {isSuperAdmin ? (
                              <button
                                onClick={() => handleApproveClientPreset(c, c.requestedPreset)}
                                className="rounded-xl border border-cyan-400 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black py-1.5 px-3 transition cursor-pointer inline-flex items-center gap-1 shadow-md shadow-cyan-500/20"
                              >
                                <Zap className="size-3.5" />
                                <span>Valider Preset &amp; Déverrouiller</span>
                              </button>
                            ) : (
                              <span className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-[11px] font-bold py-1.5 px-2.5 inline-flex items-center gap-1">
                                🔒 Attente Super Admin
                              </span>
                            )}
                            <button
                              onClick={() => handleOpenClientProfile(c)}
                              className="rounded-xl border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-bold py-1.5 px-2.5 transition cursor-pointer"
                            >
                              Fiche
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleOpenClientProfile(c)}
                            className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold py-1.5 px-3.5 transition cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <span>Ouvrir Fiche</span>
                            <ChevronRight className="size-3.5" />
                          </button>
                        )}
                      </div>
                    ),
                  },
                ]}
                rows={clientsTable.pageRows}
                keyFor={(c) => c.id}
                totalCount={clientsTable.filtered.length}
                emptyMessage="Aucun client ne correspond à cette recherche."
                searchValue={clientsTable.query}
                onSearchChange={clientsTable.setQuery}
                searchPlaceholder="Rechercher un client par nom, e-mail ou identifiant MT5..."
                searchAriaLabel="Rechercher un client"
                page={clientsTable.page}
                totalPages={clientsTable.totalPages}
                onPageChange={clientsTable.setPage}
              />
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 2. CRÉATION CLIENT (`create-user`)                                  */}
          {/* ===================================================================== */}
          {activeSection === "create-user" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center gap-4 border-b border-slate-700/50 pb-5">
                <button
                  onClick={() => setActiveSection("users")}
                  aria-label="Retour à la liste des clients"
                  className="grid size-10 place-items-center rounded-xl border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft className="size-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Créer un Nouveau Compte Client</h1>
                  <p className="text-sm text-slate-400 mt-1">Création de fiche, attribution MT5 et dépôt initial.</p>
                </div>
              </div>

              <form onSubmit={handleCreateClient} className="admin-card p-6 sm:p-8 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">NOM COMPLET DU CLIENT *</label>
                    <input
                      type="text"
                      required
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">ADRESSE E-MAIL *</label>
                    <input
                      type="email"
                      required
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">TÉLÉPHONE</label>
                    <input
                      type="text"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/80"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">DÉPÔT INITIAL ($ USD)</label>
                    <input
                      type="number"
                      value={newClientDeposit}
                      onChange={(e) => setNewClientDeposit(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm text-white outline-none font-mono font-bold focus:border-emerald-500/80"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">BONUS COMMERCIAL ($ USD)</label>
                    <input
                      type="number"
                      value={newClientBonus}
                      onChange={(e) => setNewClientBonus(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm text-amber-300 outline-none font-mono font-bold focus:border-amber-400/80"
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">LOGIN MT5</label>
                    <input
                      type="text"
                      value={newClientMt5Login}
                      onChange={(e) => setNewClientMt5Login(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm text-white outline-none font-mono focus:border-emerald-500/80"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">BROKER</label>
                    <input
                      type="text"
                      value={newClientBroker}
                      onChange={(e) => setNewClientBroker(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/80"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">SERVEUR BROKER</label>
                    <input
                      type="text"
                      value={newClientServer}
                      onChange={(e) => setNewClientServer(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/80"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="admin-btn-primary"
                  >
                    Valider la Création du Client
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 3. FICHE PROFIL CLIENT ENTIÈRE (12 BLOCS CUMULÉS)                  */}
          {/* ===================================================================== */}
          {activeSection === "user-detail" && activeClient && (
            <div className="space-y-8 animate-in fade-in duration-150">
              {/* Header Fiche Client */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-700/50 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveSection("users")}
                    aria-label="Retour à la liste des clients"
                    className="grid size-10 place-items-center rounded-xl border border-slate-700/60 bg-[#121a2d] hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <ArrowLeft className="size-5" />
                  </button>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{activeClient.name}</h1>
                      <AdminBadge
                        variant={
                          activeClient.status === "ACTIVE"
                            ? "emerald"
                            : activeClient.status === "SUSPENDED"
                            ? "amber"
                            : "rose"
                        }
                        dot={false}
                      >
                        {activeClient.status}
                      </AdminBadge>
                    </div>
                    <p className="text-xs font-mono text-slate-400 mt-1">
                      ID: {activeClient.id} · MT5 #{activeClient.mt5.login} ({activeClient.mt5.broker}) · Conseiller: <strong className="text-emerald-400">{activeClient.assignedAdvisor}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => handleStartImpersonation(activeClient)}
                    className="rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 px-4 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow flex items-center gap-2"
                  >
                    <UserCheck className="size-4" />
                    <span>Supervision Live</span>
                  </button>

                  <button
                    onClick={handleSaveClientProfile}
                    className="admin-btn-primary text-xs py-2 px-4"
                  >
                    <Check className="size-4" />
                    <span>Enregistrer Réglages</span>
                  </button>
                </div>
              </div>

              {/* ── 1. GOUVERNANCE RAPIDE ── */}
              <section className="admin-card-emerald p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-5 text-emerald-400" />
                  <div>
                    <h3 className="font-semibold text-sm text-white">Gouvernance Rapide du Compte</h3>
                    <p className="text-xs text-slate-300 font-mono">Modifiez l'état opérationnel et l'accès du client en direct.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {activeClient.status !== "ACTIVE" && (
                    <button
                      onClick={handleReactivateClient}
                      className="admin-btn-primary text-xs py-1.5 px-3"
                    >
                      <Unlock className="size-3.5" />
                      <span>Réactiver</span>
                    </button>
                  )}

                  {activeClient.status === "ACTIVE" && (
                    <button
                      onClick={handleSuspendClient}
                      className="rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-3 py-1.5 text-xs font-semibold text-amber-300 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Pause className="size-3.5" />
                      <span>Suspendre</span>
                    </button>
                  )}

                  {activeClient.status !== "REVOKED" && (
                    <button
                      onClick={handleRevokeClient}
                      className="rounded-xl border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 px-3 py-1.5 text-xs font-semibold text-purple-300 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <MinusCircle className="size-3.5" />
                      <span>Révoquer</span>
                    </button>
                  )}

                  {activeClient.status !== "BANNED" && (
                    <button
                      onClick={handleBanClient}
                      className="rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 px-3 py-1.5 text-xs font-semibold text-rose-400 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Ban className="size-3.5" />
                      <span>Bannir</span>
                    </button>
                  )}

                  <button
                    onClick={handleDeleteClient}
                    className="rounded-xl border border-rose-900/80 bg-rose-950/40 hover:bg-rose-900/60 px-3 py-1.5 text-xs font-semibold text-rose-300 transition cursor-pointer flex items-center gap-1.5 ml-auto"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </section>

              {/* ── 2. CARTES ANALYTIQUES DE GAINS ET DE PERTES ── */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2.5">
                  <BarChart3 className="size-5 text-emerald-400" />
                  Cartes Analytiques de Gains et de Pertes
                </h2>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 font-mono">
                  <div className="admin-card-emerald p-5 space-y-2.5">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-300 uppercase font-semibold">Gains Bruts Cumulés</span>
                      <div className="grid size-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400">
                        <TrendingUp className="size-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-emerald-400">
                      +${activeClient.grossProfitTotal.toLocaleString("fr-FR")} USD
                    </p>
                    <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                      <span>Trades Gagnants :</span>
                      <strong className="text-white">{activeClient.winningTradesCount} / {activeClient.tradesCount}</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Meilleur Trade :</span>
                      <strong className="text-emerald-400">+${activeClient.bestTradePnl.toLocaleString("fr-FR")} USD</strong>
                    </div>
                  </div>

                  <div className="admin-card p-5 space-y-2.5 border-rose-500/30 bg-gradient-to-b from-[#261217]/95 to-[#17090d]/98">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-300 uppercase font-semibold">Pertes Brutes Cumulées</span>
                      <div className="grid size-8 place-items-center rounded-lg bg-rose-500/15 text-rose-400">
                        <TrendingDown className="size-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-rose-400">
                      -${activeClient.grossLossTotal.toLocaleString("fr-FR")} USD
                    </p>
                    <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                      <span>Trades Perdants :</span>
                      <strong className="text-white">{activeClient.losingTradesCount} / {activeClient.tradesCount}</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Pire Trade :</span>
                      <strong className="text-rose-400">${activeClient.worstTradePnl.toLocaleString("fr-FR")} USD</strong>
                    </div>
                  </div>

                  <div className="admin-card-indigo p-5 space-y-2.5">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-300 uppercase font-semibold">P&amp;L du Jour (Net)</span>
                      <div className="grid size-8 place-items-center rounded-lg bg-indigo-500/15 text-indigo-300">
                        <Scale className="size-4" />
                      </div>
                    </div>
                    <p className={`text-2xl font-bold ${activeClient.todayPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {activeClient.todayPnl >= 0 ? "+" : ""}${activeClient.todayPnl.toLocaleString("fr-FR")} USD
                    </p>
                    <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                      <span>Gains Jour :</span>
                      <strong className="text-emerald-400">+${activeClient.todayGrossGain.toLocaleString("fr-FR")}</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Pertes Jour :</span>
                      <strong className="text-rose-400">${activeClient.todayGrossLoss.toLocaleString("fr-FR")}</strong>
                    </div>
                  </div>

                  <div className="admin-card-amber p-5 space-y-2.5">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-300 uppercase font-semibold">Profit Factor &amp; Win Rate</span>
                      <div className="grid size-8 place-items-center rounded-lg bg-amber-500/15 text-amber-300">
                        <Award className="size-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-amber-300">
                      {activeClient.profitFactor} <span className="text-xs font-normal text-slate-400 font-mono">Factor</span>
                    </p>
                    <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                      <span>Taux de Réussite :</span>
                      <strong className="text-white">{activeClient.winRatePercent}%</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Max Drawdown :</span>
                      <strong className="text-amber-400">{activeClient.maxDrawdownPercent}%</strong>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── 3. HISTORIQUE DES DEMANDES DE RETRAIT & VALIDATION ── */}
              <section className="admin-card-amber p-6 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-700/50 pb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                      <ArrowUpRight className="size-5 text-amber-400" />
                      Historique des Demandes de Retrait &amp; Validation Desk
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1">Examinez et validez les demandes de retraits de fonds de ce client.</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-[#0c121e]">
                  <table className="w-full text-left font-mono text-sm sm:text-[15px]">
                    <thead className="border-b border-slate-700/50 bg-[#0f1626]/90 text-slate-300 text-xs sm:text-sm font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5">DATE</th>
                        <th className="px-4 py-3.5">MONTANT ($ USD)</th>
                        <th className="px-4 py-3.5">MÉTHODE &amp; DESTINATION</th>
                        <th className="px-4 py-3.5">STATUT</th>
                        <th className="px-4 py-3.5 text-right">ACTION DE VALIDATION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {activeClient.withdrawalRequests.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3.5 font-semibold text-white">{w.date}</td>
                          <td className="px-4 py-3.5 font-bold text-amber-300 font-mono">${w.amount.toLocaleString("fr-FR")} USD</td>
                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-white block">{w.method}</span>
                            <span className="text-xs text-slate-400">{w.destination}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <AdminBadge
                              variant={
                                w.status === "PENDING"
                                  ? "amber"
                                  : w.status === "APPROVED"
                                  ? "emerald"
                                  : "rose"
                              }
                              dot={false}
                            >
                              {w.status === "PENDING" ? "EN ATTENTE ⏳" : w.status === "APPROVED" ? "VALIDÉ ✓" : "REJETÉ ✕"}
                            </AdminBadge>
                          </td>
                          <td className="px-4 py-3.5 text-right space-x-2">
                            {w.status === "PENDING" ? (
                              <>
                                <button
                                  onClick={() => handleApproveWithdrawal(w)}
                                  className="admin-btn-primary text-xs sm:text-sm py-1.5 px-3.5 font-bold"
                                >
                                  Valider ✓
                                </button>
                                <button
                                  onClick={() => handleRejectWithdrawal(w)}
                                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-rose-400 cursor-pointer transition"
                                >
                                  Rejeter ✕
                                </button>
                              </>
                            ) : (
                              <span className="text-xs sm:text-sm text-slate-400 font-mono">
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
              <section className="admin-card-emerald p-6 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-700/50 pb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                      <ArrowDownLeft className="size-5 text-emerald-400" />
                      Historique des Fonds Déposés &amp; Validation Crédit
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1">Validez les dépôts reçus pour créditer instantanément le compte du client.</p>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-xs sm:text-sm text-slate-300 uppercase block">Solde Actuel :</span>
                    <strong className="text-xl sm:text-2xl font-bold text-emerald-400">${activeClient.balance.toLocaleString("fr-FR")} USD</strong>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-[#0c121e]">
                  <table className="w-full text-left font-mono text-sm sm:text-[15px]">
                    <thead className="border-b border-slate-700/50 bg-[#0f1626]/90 text-slate-300 text-xs sm:text-sm font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5">DATE</th>
                        <th className="px-4 py-3.5">MONTANT DÉPOSÉ ($ USD)</th>
                        <th className="px-4 py-3.5">MÉTHODE &amp; RÉFÉRENCE</th>
                        <th className="px-4 py-3.5">STATUT</th>
                        <th className="px-4 py-3.5 text-right">ACTION DE CRÉDIT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {activeClient.depositRequests.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3.5 font-semibold text-white">{d.date}</td>
                          <td className="px-4 py-3.5 font-bold text-emerald-400 font-mono">+${d.amount.toLocaleString("fr-FR")} USD</td>
                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-white block">{d.method}</span>
                            <span className="text-xs text-slate-400 font-mono">Réf: {d.reference}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <AdminBadge variant={d.status === "PENDING" ? "amber" : "emerald"} dot={false}>
                              {d.status === "PENDING" ? "EN ATTENTE ⏳" : "CRÉDITÉ ✓"}
                            </AdminBadge>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {d.status === "PENDING" ? (
                              <button
                                onClick={() => handleApproveDeposit(d)}
                                className="admin-btn-primary text-xs sm:text-sm py-1.5 px-3.5 font-bold"
                              >
                                Valider &amp; Créditer ✓
                              </button>
                            ) : (
                              <span className="text-xs sm:text-sm text-slate-400 font-mono">
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
              <section className="admin-card-indigo p-6 sm:p-7 space-y-5">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                  <User className="size-5 text-indigo-400" />
                  Informations Personnelles, Connexion &amp; Sécurité
                </h2>

                <div className="grid gap-5 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">NOM COMPLET</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm sm:text-base text-white outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">ADRESSE E-MAIL</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm sm:text-base text-white outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">N° TÉLÉPHONE</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm sm:text-base text-white outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-3 pt-2">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">PAYS DE RÉSIDENCE</label>
                    <input
                      type="text"
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm sm:text-base text-white outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">MODIFIER MOT DE PASSE</label>
                    <input
                      type="text"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm sm:text-base text-white outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setClients((prev) => prev.map((c) => (c.id === activeClient.id ? { ...c, twoFactorEnabled: false } : c)));
                        toast.success("Double authentification réinitialisée pour ce client.");
                      }}
                      className="admin-btn-secondary py-2.5 text-sm font-semibold"
                    >
                      <Lock className="size-4 text-amber-400" />
                      <span>Réinitialiser 2FA</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* ── 6. ATTRIBUTION DES 3 MOTEURS & PRESETS ── */}
              <section className="admin-card-purple p-6 sm:p-7 space-y-5">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                  <Sliders className="size-5 text-purple-400" />
                  Attribution des Moteurs &amp; Stratégies pour {activeClient.name}
                </h2>

                <div className="grid gap-5 lg:grid-cols-3">
                  <div className="admin-subcard p-5 space-y-3.5 border-amber-500/25">
                    <div className="flex justify-between items-center border-b border-slate-700/40 pb-2.5">
                      <h4 className="font-bold text-base text-white">Nexium AI Gold</h4>
                      <button
                        type="button"
                        onClick={() => setGoldActive(!goldActive)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                          goldActive ? "bg-amber-400 text-slate-950 shadow-sm font-extrabold" : "bg-slate-800 text-slate-400 border border-slate-700/50"
                        }`}
                      >
                        {goldActive ? "ACTIF" : "DÉSACTIVÉ"}
                      </button>
                    </div>

                    <div className="space-y-3 text-xs sm:text-sm font-mono">
                      <div>
                        <label className="block text-slate-400 mb-1.5 uppercase font-bold text-xs">PRESET ATTRIBUÉ :</label>
                        <AdminDropdown
                          value={goldPreset}
                          onChange={setGoldPreset}
                          options={GOLD_PRESETS.map((p) => ({ value: p.name, label: p.name }))}
                        />
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-400 font-bold text-xs uppercase">LOT MAXIMUM :</span>
                        <input
                          type="number"
                          step="0.05"
                          value={goldMaxLot}
                          onChange={(e) => setGoldMaxLot(parseFloat(e.target.value) || 0.1)}
                          className="w-24 rounded-lg border border-slate-700/60 bg-[#0c121e] p-2 text-right text-white font-bold text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="admin-subcard p-5 space-y-3.5 border-indigo-500/25">
                    <div className="flex justify-between items-center border-b border-slate-700/40 pb-2.5">
                      <h4 className="font-bold text-base text-white">Nexium FX Trend</h4>
                      <button
                        type="button"
                        onClick={() => setFxActive(!fxActive)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                          fxActive ? "bg-indigo-400 text-slate-950 shadow-sm font-extrabold" : "bg-slate-800 text-slate-400 border border-slate-700/50"
                        }`}
                      >
                        {fxActive ? "ACTIF" : "DÉSACTIVÉ"}
                      </button>
                    </div>

                    <div className="space-y-3 text-xs sm:text-sm font-mono">
                      <div>
                        <label className="block text-slate-400 mb-1.5 uppercase font-bold text-xs">PRESET ATTRIBUÉ :</label>
                        <AdminDropdown
                          value={fxPreset}
                          onChange={setFxPreset}
                          options={FX_PRESETS.map((p) => ({ value: p.name, label: p.name }))}
                        />
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-400 font-bold text-xs uppercase">LOT MAXIMUM :</span>
                        <input
                          type="number"
                          step="0.05"
                          value={fxMaxLot}
                          onChange={(e) => setFxMaxLot(parseFloat(e.target.value) || 0.1)}
                          className="w-24 rounded-lg border border-slate-700/60 bg-[#0c121e] p-2 text-right text-white font-bold text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="admin-subcard p-5 space-y-3.5 border-purple-500/25">
                    <div className="flex justify-between items-center border-b border-slate-700/40 pb-2.5">
                      <h4 className="font-bold text-base text-white">Index Reversion</h4>
                      <button
                        type="button"
                        onClick={() => setIndexActive(!indexActive)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                          indexActive ? "bg-purple-400 text-slate-950 shadow-sm font-extrabold" : "bg-slate-800 text-slate-400 border border-slate-700/50"
                        }`}
                      >
                        {indexActive ? "ACTIF" : "DÉSACTIVÉ"}
                      </button>
                    </div>

                    <div className="space-y-3 text-xs sm:text-sm font-mono">
                      <div>
                        <label className="block text-slate-400 mb-1.5 uppercase font-bold text-xs">PRESET ATTRIBUÉ :</label>
                        <AdminDropdown
                          value={indexPreset}
                          onChange={setIndexPreset}
                          options={INDEX_PRESETS.map((p) => ({ value: p.name, label: p.name }))}
                        />
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-400 font-bold text-xs uppercase">LOT MAXIMUM :</span>
                        <input
                          type="number"
                          step="0.05"
                          value={indexMaxLot}
                          onChange={(e) => setIndexMaxLot(parseFloat(e.target.value) || 0.1)}
                          className="w-24 rounded-lg border border-slate-700/60 bg-[#0c121e] p-2 text-right text-white font-bold text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── 7. COMPTE MT5 DU CLIENT ── */}
              <section className="admin-card-cyan p-6 sm:p-7 space-y-5">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                  <HardDrive className="size-5 text-cyan-400" />
                  Paramètres du Compte Broker &amp; Terminal MT5
                </h2>

                <div className="grid gap-5 sm:grid-cols-4 font-mono text-sm">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5 uppercase tracking-wider">LOGIN MT5</label>
                    <input
                      type="text"
                      value={mt5Login}
                      onChange={(e) => setMt5Login(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm sm:text-base text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5 uppercase tracking-wider">COURTIER (BROKER)</label>
                    <input
                      type="text"
                      value={mt5Broker}
                      onChange={(e) => setMt5Broker(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm sm:text-base text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5 uppercase tracking-wider">SERVEUR BROKER</label>
                    <input
                      type="text"
                      value={mt5Server}
                      onChange={(e) => setMt5Server(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm sm:text-base text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5 uppercase tracking-wider">MOT DE PASSE INVESTISSEUR</label>
                    <input
                      type="text"
                      value={mt5InvestorPass}
                      onChange={(e) => setMt5InvestorPass(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm sm:text-base text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </section>

              {/* ── 8. CRÉDIT / DÉBIT FINANCIER & AJUSTEMENT DU P&L ── */}
              <section className="admin-card-amber p-6 sm:p-7 space-y-6">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5 border-b border-slate-700/50 pb-4">
                  <Wallet className="size-5 text-amber-400" />
                  Gestion Financière &amp; Ajustements P&amp;L du Desk
                </h2>

                <div className="grid gap-6 lg:grid-cols-2">
                  <form onSubmit={handleCreditOrDebit} className="p-5 sm:p-6 rounded-2xl border border-slate-700/50 bg-[#0c121e] space-y-4">
                    <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <DollarSign className="size-4.5 text-amber-400" />
                      Opération Directe de Solde
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-400 mb-1 font-mono uppercase">TYPE D'OPÉRATION</label>
                        <AdminDropdown
                          value={creditType}
                          onChange={setCreditType}
                          options={[
                            { value: "DEPOSIT", label: "Créditer Dépôt Réel (+)" },
                            { value: "BONUS", label: "Attribuer Bonus (+)" },
                            { value: "DEBIT", label: "Débit Forcé (-)" },
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-400 mb-1 font-mono uppercase">MONTANT ($ USD)</label>
                        <input
                          type="number"
                          value={creditAmountInput}
                          onChange={(e) => setCreditAmountInput(e.target.value)}
                          className="w-full rounded-xl border border-slate-700/60 bg-[#121a2d] p-3 text-sm sm:text-base text-white font-mono font-bold outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-400 mb-1 font-mono uppercase">MOTIF DE L'OPÉRATION</label>
                      <input
                        type="text"
                        value={creditNote}
                        onChange={(e) => setCreditNote(e.target.value)}
                        className="w-full rounded-xl border border-slate-700/60 bg-[#121a2d] p-3 text-xs sm:text-sm text-white outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full admin-btn-primary py-3 text-sm font-bold"
                    >
                      Exécuter l'Écriture Financière ($)
                    </button>
                  </form>

                  <form onSubmit={handleApplyPnlAdjustment} className="p-5 sm:p-6 rounded-2xl border border-amber-500/30 bg-[#0c121e] space-y-4">
                    <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <Scale className="size-4.5 text-amber-400" />
                      Ajustement P&amp;L / Pertes ou Gains du Jour
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-400 mb-1 font-mono uppercase">DIRECTION</label>
                        <AdminDropdown
                          value={pnlAdjustDirection}
                          onChange={setPnlAdjustDirection}
                          options={[
                            { value: "PROFIT", label: "Ajouter Gain (+)" },
                            { value: "LOSS", label: "Appliquer Perte (-)" },
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-400 mb-1 font-mono uppercase">MONTANT ($ USD)</label>
                        <input
                          type="number"
                          value={pnlAdjustAmount}
                          onChange={(e) => setPnlAdjustAmount(e.target.value)}
                          className="w-full rounded-xl border border-slate-700/60 bg-[#121a2d] p-3 text-sm sm:text-base text-white font-mono font-bold outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-400 mb-1 font-mono uppercase">MOTIF DE L'AJUSTEMENT</label>
                      <input
                        type="text"
                        value={pnlAdjustReason}
                        onChange={(e) => setPnlAdjustReason(e.target.value)}
                        className="w-full rounded-xl border border-slate-700/60 bg-[#121a2d] p-3 text-xs sm:text-sm text-white outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-amber-400 hover:bg-amber-500 py-3 text-sm font-bold text-slate-950 uppercase tracking-wider transition cursor-pointer shadow-md"
                    >
                      Appliquer l'Ajustement de P&amp;L
                    </button>
                  </form>
                </div>
              </section>

              {/* ── 9. JOURNAL DES TRADES EN TEMPS RÉEL ── */}
              <section className="admin-card-emerald p-6 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-700/50 pb-4">
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                    <History className="size-5 text-emerald-400" />
                    Journal des Trades en Direct &amp; Fixation P&amp;L du Jour
                  </h2>

                  <form onSubmit={handleSetExactTodayPnl} className="flex items-center gap-2.5 font-mono">
                    <span className="text-xs sm:text-sm text-slate-400 uppercase font-bold">Fixer P&amp;L ($):</span>
                    <input
                      type="number"
                      value={exactPnlInput}
                      onChange={(e) => setExactPnlInput(e.target.value)}
                      className="w-28 rounded-lg border border-slate-700/60 bg-[#0c121e] px-2.5 py-1.5 text-xs sm:text-sm text-emerald-400 font-bold outline-none"
                    />
                    <button type="submit" className="admin-btn-primary text-xs py-1.5 px-3.5 font-bold">
                      Fixer
                    </button>
                  </form>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-[#0c121e]">
                  <table className="w-full text-left font-mono text-sm sm:text-[15px]">
                    <thead className="border-b border-slate-700/50 bg-[#0f1626]/90 text-slate-300 text-xs sm:text-sm font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5">TICKET</th>
                        <th className="px-4 py-3.5">SYMBOLE</th>
                        <th className="px-4 py-3.5">SENS</th>
                        <th className="px-4 py-3.5">VOLUME</th>
                        <th className="px-4 py-3.5">PRIX ENTRÉE</th>
                        <th className="px-4 py-3.5">MOTEUR</th>
                        <th className="px-4 py-3.5 text-right">P&amp;L NET</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {activeClient.trades.map((tr) => (
                        <tr key={tr.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3.5 font-semibold text-white">#{tr.ticket}</td>
                          <td className="px-4 py-3.5 text-emerald-400 font-bold">{tr.symbol}</td>
                          <td className="px-4 py-3.5">
                            <AdminBadge variant={tr.type === "BUY" ? "emerald" : "rose"} dot={false}>
                              {tr.type}
                            </AdminBadge>
                          </td>
                          <td className="px-4 py-3.5 text-slate-200">{tr.lots} lot</td>
                          <td className="px-4 py-3.5 text-slate-300">{tr.openPrice}</td>
                          <td className="px-4 py-3.5 text-xs sm:text-sm text-slate-300 font-sans">{tr.engine}</td>
                          <td className="px-4 py-3.5 text-right">
                            <strong className={`font-bold ${tr.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
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
              <section className="admin-card-purple p-6 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-700/50 pb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                      <Key className="size-5 text-purple-400" />
                      Gestion de la Licence MT5 &amp; Expirations
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">Clé active : <strong className="text-white font-mono text-sm sm:text-base">{activeClient.licenseKey}</strong></p>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-xs sm:text-sm text-slate-400 uppercase block">Expire le :</span>
                    <strong className="text-sm sm:text-base text-purple-300 font-bold">{activeClient.licenseExpires}</strong>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs sm:text-sm font-mono font-bold text-slate-300 uppercase">Prolonger la licence :</span>
                  <button onClick={() => handleExtendLicense(1)} className="admin-btn-secondary text-xs sm:text-sm py-2 px-3.5">+1 Mois</button>
                  <button onClick={() => handleExtendLicense(6)} className="admin-btn-secondary text-xs sm:text-sm py-2 px-3.5">+6 Mois</button>
                  <button onClick={() => handleExtendLicense(12)} className="admin-btn-secondary text-xs sm:text-sm py-2 px-3.5">+1 An</button>
                  <button onClick={handleGenerateNewLicenseKey} className="rounded-xl bg-purple-500/20 border border-purple-500/40 hover:bg-purple-500/30 px-4 py-2 text-xs sm:text-sm font-semibold text-purple-300 cursor-pointer ml-auto transition">
                    Générer Nouvelle Clé MT5 🔑
                  </button>
                </div>
              </section>

              {/* ── 11. CONFORMITÉ KYC & RISK GUARD ── */}
              <section className="admin-card-indigo p-6 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-700/50 pb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                      <FileCheck className="size-5 text-indigo-400" />
                      Conformité KYC &amp; Coupe-Circuit Personnalisé
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">Vérification documentaire et plafonds de perte par compte.</p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <AdminDropdown
                      value={editKycStatus}
                      onChange={setEditKycStatus}
                      options={KYC_STATUS_OPTIONS}
                      className="min-w-[180px]"
                    />

                    <button
                      onClick={() => {
                        setEditKycStatus("VERIFIED");
                        toast.success("Dossier KYC validé.");
                      }}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-white uppercase cursor-pointer transition shadow-sm shrink-0"
                    >
                      Valider KYC ✓
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 text-xs sm:text-sm font-mono">
                  <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-700/40 space-y-1.5">
                    <label className="block font-bold text-slate-300 uppercase text-xs">MAX DAILY LOSS (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editMaxDailyLoss}
                      onChange={(e) => setEditMaxDailyLoss(parseFloat(e.target.value) || 1.0)}
                      className="w-full rounded-lg border border-slate-700/60 bg-[#121a2d] p-2.5 text-sm sm:text-base text-white outline-none"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-700/40 space-y-1.5">
                    <label className="block font-bold text-slate-300 uppercase text-xs">MAX POSITIONS</label>
                    <input
                      type="number"
                      value={editMaxPositions}
                      onChange={(e) => setEditMaxPositions(parseInt(e.target.value) || 1)}
                      className="w-full rounded-lg border border-slate-700/60 bg-[#121a2d] p-2.5 text-sm sm:text-base text-white outline-none"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-700/40 flex flex-col justify-between">
                    <span className="font-bold text-slate-300 uppercase text-xs">AUTO-STOP ROBOTS</span>
                    <button
                      type="button"
                      onClick={() => setEditRiskGuardAuto(!editRiskGuardAuto)}
                      className={`rounded-lg py-2.5 text-xs sm:text-sm font-bold uppercase cursor-pointer transition ${
                        editRiskGuardAuto ? "bg-emerald-500 text-slate-950 font-extrabold" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {editRiskGuardAuto ? "AUTO-STOP ACTIVÉ ✓" : "DÉSACTIVÉ"}
                    </button>
                  </div>
                </div>
              </section>

              {/* ── 12. SESSIONS ACTIVES & NOTES INTERNES CRM ── */}
              <div className="grid gap-6 lg:grid-cols-2">
                <section className="admin-card-cyan p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <Laptop className="size-4.5 text-cyan-400" />
                      Sessions &amp; Appareils
                    </h3>
                    <button onClick={handleKillAllClientSessions} className="text-xs sm:text-sm text-rose-400 font-bold hover:underline cursor-pointer">
                      Déconnecter Tout 🚨
                    </button>
                  </div>
                  <div className="space-y-2 font-mono text-xs sm:text-sm">
                    {activeClient.sessions.map((s) => (
                      <div key={s.id} className="p-3.5 rounded-xl bg-[#0c121e] flex justify-between items-center border border-slate-800/60">
                        <div>
                          <strong className="text-white block text-sm font-semibold">{s.device}</strong>
                          <span className="text-slate-400 text-xs">{s.ip} · {s.location}</span>
                        </div>
                        <span className="text-cyan-400 font-semibold">{s.lastActive}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="admin-card-amber p-6 space-y-4">
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Bookmark className="size-4.5 text-amber-400" />
                    Notes Internes &amp; Mémos Confidentiels
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCrmNoteText}
                      onChange={(e) => setNewCrmNoteText(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-700/60 bg-[#0c121e] px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none"
                    />
                    <button onClick={handleAddCrmNote} className="admin-btn-primary text-xs sm:text-sm py-2 px-4 font-bold">
                      Ajouter
                    </button>
                  </div>
                  <div className="space-y-2.5 font-mono text-xs sm:text-sm max-h-48 overflow-y-auto pr-1">
                    {activeClient.crmNotes.map((n) => (
                      <div key={n.id} className="p-3.5 rounded-xl bg-[#0c121e] space-y-1.5 border border-slate-800/60">
                        <div className="flex justify-between text-slate-400">
                          <strong className="text-amber-300 font-bold">{n.author}</strong>
                          <span className="text-xs">{n.date}</span>
                        </div>
                        <p className="text-slate-200 font-sans text-xs sm:text-sm leading-relaxed">{n.text}</p>
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
            <div className="space-y-8 animate-in fade-in">
              {!editingStaffMember ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-700/50 pb-5">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <ShieldCheck className="size-7 text-purple-400" />
                        <span>Administration</span>
                      </h1>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Votre session :</span>
                      <AdminBadge
                        variant={currentSessionRole === "OWNER" ? "amber" : currentSessionRole === "SUPER_ADMIN" ? "purple" : "emerald"}
                        dot={true}
                      >
                        {currentSessionRole === "OWNER" ? "👑 OWNER (Maître)" : currentSessionRole.replace("_", " ")}
                      </AdminBadge>
                    </div>
                  </div>

                  {/* ── 1. STATISTIQUES & HIÉRARCHIE DU STAFF ── */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 font-mono">
                    <div className="admin-card-purple p-5 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-slate-300 uppercase font-bold">Effectif Total Staff</span>
                        <Users className="size-5 text-purple-400" />
                      </div>
                      <p className="text-3xl font-bold text-white">{staffList.length} <span className="text-xs font-normal text-purple-300">collaborateurs</span></p>
                      <p className="text-xs text-slate-300 font-sans">Comptes d'administration actifs</p>
                    </div>

                    <div className="admin-card-amber p-5 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-slate-300 uppercase font-bold">Direction &amp; Propriétaire</span>
                        <ShieldCheck className="size-5 text-amber-400" />
                      </div>
                      <p className="text-3xl font-bold text-amber-300">
                        {staffList.filter((s) => s.role === "OWNER" || s.role === "SUPER_ADMIN").length}{" "}
                        <span className="text-xs font-normal text-amber-400 font-mono">dirigeants</span>
                      </p>
                      <p className="text-xs text-slate-300 font-sans">1 Owner &amp; Super Admins</p>
                    </div>

                    <div className="admin-card-cyan p-5 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-slate-300 uppercase font-bold">Conseillers &amp; Support</span>
                        <Headphones className="size-5 text-cyan-400" />
                      </div>
                      <p className="text-3xl font-bold text-cyan-300">
                        {staffList.filter((s) => s.role === "CONSEILLER" || s.role === "SUPPORT").length}{" "}
                        <span className="text-xs font-normal text-cyan-400 font-mono">chargés</span>
                      </p>
                      <p className="text-xs text-slate-300 font-sans">Relation &amp; suivi client en continu</p>
                    </div>

                    <div className="admin-card-emerald p-5 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-slate-300 uppercase font-bold">Finance &amp; Recherche Quant</span>
                        <Sliders className="size-5 text-emerald-400" />
                      </div>
                      <p className="text-3xl font-bold text-emerald-400">
                        {staffList.filter((s) => s.role === "FINANCE" || s.role === "QUANT").length}{" "}
                        <span className="text-xs font-normal text-emerald-300 font-mono">experts</span>
                      </p>
                      <p className="text-xs text-slate-300 font-sans">P&amp;L, trésorerie et algorithmes MT5</p>
                    </div>
                  </div>

                  {/* ── 2. FORMULAIRE DE CRÉATION D'ADMINISTRATEUR / CONSEILLER ── */}
                  <section className="admin-card-emerald p-6 sm:p-8 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
                      <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                        <UserPlus className="size-5 text-emerald-400" />
                        Créer un Nouvel Administrateur / Conseiller / Cadre
                      </h2>
                      <span className="text-xs font-mono font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
                        Attribution Sécurisée
                      </span>
                    </div>

                    <form onSubmit={handleCreateStaffMember} className="space-y-5">
                      <div className="grid gap-5 sm:grid-cols-3">
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">NOM COMPLET *</label>
                          <input
                            type="text"
                            required
                            value={newStaffName}
                            onChange={(e) => setNewStaffName(e.target.value)}
                            className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm sm:text-base text-white outline-none focus:border-indigo-400"
                          />
                        </div>

                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">ADRESSE E-MAIL PROFESSIONNELLE *</label>
                          <input
                            type="email"
                            required
                            value={newStaffEmail}
                            onChange={(e) => setNewStaffEmail(e.target.value)}
                            className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm sm:text-base text-white outline-none focus:border-indigo-400"
                          />
                        </div>

                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">N° TÉLÉPHONE DIRECT DESK</label>
                          <input
                            type="text"
                            value={newStaffPhone}
                            onChange={(e) => setNewStaffPhone(e.target.value)}
                            className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm sm:text-base text-white outline-none focus:border-indigo-400"
                          />
                        </div>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">RÔLE SYSTÈME &amp; RANG HIÉRARCHIQUE</label>
                          <AdminDropdown
                            value={newStaffRole}
                            onChange={(r) => {
                              setNewStaffRole(r);
                              if (r === "OWNER" || r === "SUPER_ADMIN") {
                                setNewStaffDept("Direction Générale");
                                setNewStaffPermFinance(true);
                                setNewStaffPermEngines(true);
                                setNewStaffPermPnl(true);
                                setNewStaffPermKillSwitch(true);
                                setNewStaffPermManageStaff(true);
                                setNewStaffPermViewTreasury(true);
                              } else if (r === "CONSEILLER") {
                                setNewStaffDept("Desk Support & Conseillers");
                                setNewStaffPermEngines(true);
                                setNewStaffPermFinance(false);
                                setNewStaffPermPnl(false);
                              } else if (r === "FINANCE") {
                                setNewStaffDept("Gestion Financière");
                                setNewStaffPermFinance(true);
                                setNewStaffPermViewTreasury(true);
                              } else if (r === "QUANT") {
                                setNewStaffDept("Recherche Quantitative");
                                setNewStaffPermEngines(true);
                                setNewStaffPermPnl(true);
                              } else if (r === "SUPPORT") {
                                setNewStaffDept("Desk Support & Conseillers");
                              }
                            }}
                            options={STAFF_ROLE_OPTIONS}
                          />
                        </div>

                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">DÉPARTEMENT / PÔLE OPÉRATIONNEL</label>
                          <AdminDropdown
                            value={newStaffDept}
                            onChange={(d) => setNewStaffDept(d as any)}
                            options={STAFF_DEPT_OPTIONS}
                          />
                        </div>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">RESTRICTIONS IP (WHITELIST)</label>
                          <input
                            type="text"
                            value={newStaffIpWhitelist}
                            onChange={(e) => setNewStaffIpWhitelist(e.target.value)}
                            className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm sm:text-base text-white outline-none font-mono focus:border-indigo-400"
                          />
                        </div>

                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">SIGNATURE DESK OFFICIELLE</label>
                          <input
                            type="text"
                            value={newStaffSignature}
                            onChange={(e) => setNewStaffSignature(e.target.value)}
                            className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm sm:text-base text-white outline-none focus:border-indigo-400"
                          />
                        </div>
                      </div>

                      <div className="p-5 rounded-xl bg-[#0c121e] border border-slate-700/40 space-y-3.5">
                        <span className="text-xs sm:text-sm font-bold text-slate-300 uppercase font-mono block">MATRICE DES PERMISSIONS &amp; POUVOIRS :</span>
                        <div className="grid gap-3.5 sm:grid-cols-3">
                          <label className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 cursor-pointer">
                            <input type="checkbox" checked={newStaffPermChat} onChange={(e) => setNewStaffPermChat(e.target.checked)} className="size-4 rounded accent-indigo-500" />
                            <span>Chat &amp; Support Direct</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 cursor-pointer">
                            <input type="checkbox" checked={newStaffPermEmail} onChange={(e) => setNewStaffPermEmail(e.target.checked)} className="size-4 rounded accent-indigo-500" />
                            <span>Envoi d'E-mails Desk</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 cursor-pointer">
                            <input type="checkbox" checked={newStaffPermPhone} onChange={(e) => setNewStaffPermPhone(e.target.checked)} className="size-4 rounded accent-indigo-500" />
                            <span>Appels Téléphoniques VoIP</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 cursor-pointer">
                            <input type="checkbox" checked={newStaffPermFinance} onChange={(e) => setNewStaffPermFinance(e.target.checked)} className="size-4 rounded accent-indigo-500" />
                            <span>Validation Retraits &amp; Dépôts</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 cursor-pointer">
                            <input type="checkbox" checked={newStaffPermEngines} onChange={(e) => setNewStaffPermEngines(e.target.checked)} className="size-4 rounded accent-indigo-500" />
                            <span>Paramétrage des Moteurs MT5</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 cursor-pointer">
                            <input type="checkbox" checked={newStaffPermPnl} onChange={(e) => setNewStaffPermPnl(e.target.checked)} className="size-4 rounded accent-indigo-500" />
                            <span>Ajustement Financier de P&amp;L</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 cursor-pointer">
                            <input type="checkbox" checked={newStaffPermManageStaff} onChange={(e) => setNewStaffPermManageStaff(e.target.checked)} className="size-4 rounded accent-indigo-500" />
                            <span>Gouvernance &amp; Gestion Staff</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 cursor-pointer">
                            <input type="checkbox" checked={newStaffPermViewTreasury} onChange={(e) => setNewStaffPermViewTreasury(e.target.checked)} className="size-4 rounded accent-indigo-500" />
                            <span>Accès Trésorerie &amp; Bilan</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs sm:text-sm text-rose-400 font-bold cursor-pointer">
                            <input type="checkbox" checked={newStaffPermKillSwitch} onChange={(e) => setNewStaffPermKillSwitch(e.target.checked)} className="size-4 rounded accent-rose-500" />
                            <span>Kill Switch d'Urgence Total</span>
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="admin-btn-primary py-3 text-sm font-bold"
                      >
                        Créer le Membre du Staff &amp; Activer les Accès
                      </button>
                    </form>
                  </section>

                  {/* ── 3. TABLEAU DES MEMBRES ACTIFS DU STAFF & ACTIONS DE GESTION ── */}
                  <section className="admin-card-emerald p-6 sm:p-8 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-700/50 pb-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                          <Users className="size-5 text-emerald-400" />
                          Membres Actifs du Staff &amp; Conseillers ({staffList.length})
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 mt-1">
                          Contrôlez les accès, éditez les privilèges, réinitialisez le 2FA ou réaffectez les portefeuilles clients.
                        </p>
                      </div>
                    </div>

                    <AdminDataTable
                      columns={[
                        {
                          key: "admin",
                          header: "MEMBRE DU STAFF",
                          render: (st: StaffAdministrator) => (
                            <div className="font-sans space-y-1">
                              <div className="flex items-center gap-2">
                                <strong className="text-sm sm:text-base font-bold text-white block">{st.name}</strong>
                                {st.role === "OWNER" && (
                                  <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-mono shadow-sm">
                                    OWNER
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                                <span>{st.lastLogin}</span>
                              </span>
                            </div>
                          ),
                        },
                        {
                          key: "role",
                          header: "RÔLE & DÉPARTEMENT",
                          render: (st: StaffAdministrator) => (
                            <div>
                              <AdminBadge
                                variant={
                                  st.role === "OWNER"
                                    ? "amber"
                                    : st.role === "SUPER_ADMIN"
                                    ? "purple"
                                    : st.role === "CONSEILLER"
                                    ? "sky"
                                    : st.role === "FINANCE"
                                    ? "emerald"
                                    : st.role === "QUANT"
                                    ? "sky"
                                    : "indigo"
                                }
                                dot={false}
                              >
                                {st.role === "OWNER" ? "👑 OWNER" : st.role.replace("_", " ")}
                              </AdminBadge>
                              <span className="text-xs sm:text-sm text-slate-300 font-sans block mt-1">{st.department}</span>
                            </div>
                          ),
                        },
                        {
                          key: "accounts",
                          header: "PORTEFEUILLE",
                          render: (st: StaffAdministrator) => (
                            <div className="font-mono text-xs sm:text-sm">
                              <strong className="text-emerald-400 font-bold text-base">{st.assignedAccountsCount}</strong>
                              <span className="text-slate-400"> comptes</span>
                            </div>
                          ),
                        },
                        {
                          key: "permissions",
                          header: "PERMISSIONS ACTIVÉES",
                          render: (st: StaffAdministrator) => (
                            <div className="flex flex-wrap gap-1.5 max-w-xs font-sans text-xs">
                              {st.permissions.canChatWithClients && <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/50 text-slate-300 text-[11px]">Chat</span>}
                              {st.permissions.canApproveFinances && <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">Finances</span>}
                              {st.permissions.canManageEngines && <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold">Robots</span>}
                              {st.permissions.canAdjustPnl && <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">P&amp;L</span>}
                              {st.permissions.canManageStaff && <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-semibold">Staff</span>}
                              {st.permissions.canUseKillSwitch && <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-semibold">Kill Switch</span>}
                            </div>
                          ),
                        },
                        {
                          key: "status",
                          header: "STATUT",
                          render: (st: StaffAdministrator) => (
                            <div>
                              <AdminBadge variant={st.status === "ACTIVE" ? "emerald" : st.status === "SUSPENDED" ? "amber" : "rose"} dot={false}>
                                {st.status}
                              </AdminBadge>
                              <span className="text-[11px] text-slate-400 font-mono block mt-1">{st.twoFactorEnabled ? "2FA Actif ✓" : "2FA Inactif"}</span>
                            </div>
                          ),
                        },
                        {
                          key: "actions",
                          header: "ACTIONS DE GOUVERNANCE",
                          align: "right",
                          render: (st: StaffAdministrator) => (
                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => handleOpenEditStaff(st)}
                                className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs sm:text-sm font-bold py-2 px-4 transition cursor-pointer flex items-center gap-2"
                                title="Gérer les accès, rôle, statut et privilèges"
                              >
                                <Settings className="size-4" />
                                <span>Gérer</span>
                              </button>
                            </div>
                          ),
                        },
                      ]}
                      rows={staffTable.pageRows}
                      keyFor={(st) => st.id}
                      totalCount={staffTable.filtered.length}
                      emptyMessage="Aucun membre du staff ne correspond à cette recherche."
                      searchValue={staffTable.query}
                      onSearchChange={staffTable.setQuery}
                      searchPlaceholder="Rechercher un membre du staff par nom, e-mail, rôle ou pôle..."
                      searchAriaLabel="Rechercher un membre du staff"
                      page={staffTable.page}
                      totalPages={staffTable.totalPages}
                      onPageChange={staffTable.setPage}
                    />
                  </section>
                </>
              ) : (
                /* ── DÉDIÉ : FICHE COMPLÈTE & GOUVERNANCE DU MEMBRE DU STAFF (PLEINE PAGE ULTRA USER-FRIENDLY) ── */
                <div className="space-y-7 animate-in fade-in">
                  {/* Top Bar Navigation & Bouton Retour */}
                  <div className="space-y-4 border-b border-slate-700/60 pb-5">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStaffMember(null);
                          if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" });
                        }}
                        className="hover:text-emerald-400 transition underline cursor-pointer"
                      >
                        Gouvernance Staff
                      </button>
                      <span>/</span>
                      <span className="text-slate-200 font-bold">{editingStaffMember.name}</span>
                      <span>/</span>
                      <span className="text-emerald-400">Fiche de Gestion Détaillée</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStaffMember(null);
                          if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" });
                        }}
                        className="inline-flex items-center gap-2.5 rounded-xl border border-slate-700/70 bg-[#0c121e] hover:bg-slate-800/80 px-4 py-2.5 text-sm font-bold text-slate-200 transition cursor-pointer shadow-sm w-fit"
                      >
                        <ArrowLeft className="size-4 text-emerald-400" />
                        <span>← Revenir à la liste du Staff &amp; Conseillers</span>
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStaffMember(null);
                            if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" });
                          }}
                          className="admin-btn-secondary py-2.5 px-5 text-xs sm:text-sm font-semibold"
                        >
                          Annuler &amp; Revenir
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleSaveEditStaff(e as any)}
                          className="admin-btn-primary py-2.5 px-6 text-xs sm:text-sm font-bold flex items-center gap-2"
                        >
                          <CheckCircle2 className="size-4" />
                          <span>Enregistrer les Modifications</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Hero Profil Collaborateur */}
                  <div className="p-6 sm:p-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-[#0c121e] via-[#121a2d] to-[#0c121e] shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="relative grid size-16 sm:size-20 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-inner font-bold text-2xl">
                        {editingStaffMember.name.charAt(0)}
                        <span className="absolute bottom-1 right-1 size-4 rounded-full bg-emerald-400 border-2 border-[#121a2d] shadow-sm"></span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            {editingStaffMember.name}
                          </h2>
                          <AdminBadge
                            variant={
                              editingStaffMember.role === "OWNER"
                                ? "amber"
                                : editingStaffMember.role === "SUPER_ADMIN"
                                ? "purple"
                                : editingStaffMember.role === "CONSEILLER"
                                ? "sky"
                                : "emerald"
                            }
                            dot={true}
                          >
                            {editingStaffMember.role === "OWNER" ? "👑 OWNER (Propriétaire)" : editingStaffMember.role.replace("_", " ")}
                          </AdminBadge>
                          <AdminBadge variant={editStaffStatus === "ACTIVE" ? "emerald" : "amber"}>
                            {editStaffStatus}
                          </AdminBadge>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 mt-1.5 font-mono">
                          ID : <strong className="text-white">{editingStaffMember.id}</strong> · Département : <strong className="text-emerald-300">{editingStaffMember.department}</strong> · Statut : <span className="text-emerald-400 font-semibold">{editingStaffMember.lastLogin}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
                      <div className="p-3 rounded-xl bg-[#0c121e] border border-slate-800 text-center min-w-[110px]">
                        <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Portefeuille</span>
                        <strong className="text-emerald-400 text-base font-bold">{editStaffAssignedCount}</strong> comptes
                      </div>
                      <div className="p-3 rounded-xl bg-[#0c121e] border border-slate-800 text-center min-w-[110px]">
                        <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Sécurité 2FA</span>
                        <strong className={editingStaffMember.twoFactorEnabled ? "text-emerald-400" : "text-amber-400"}>
                          {editingStaffMember.twoFactorEnabled ? "Actif ✓" : "Inactif"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSaveEditStaff} className="space-y-8">
                    {/* Grille Section 1 & 2 */}
                    <div className="grid gap-7 lg:grid-cols-2">
                      {/* Section 1 : Identité & Signature Desk */}
                      <div className="admin-card-emerald p-6 sm:p-8 space-y-5">
                        <h3 className="text-sm sm:text-base font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2.5 border-b border-slate-700/50 pb-3">
                          <User className="size-5 text-emerald-400" />
                          <span>1. Identité &amp; Coordonnées Professionnelles</span>
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">NOM COMPLET</label>
                            <input
                              type="text"
                              value={editStaffName}
                              onChange={(e) => setEditStaffName(e.target.value)}
                              className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                            />
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">ADRESSE E-MAIL PROFESSIONNELLE</label>
                              <input
                                type="email"
                                value={editStaffEmail}
                                onChange={(e) => setEditStaffEmail(e.target.value)}
                                className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">N° TÉLÉPHONE DIRECT DESK</label>
                              <input
                                type="text"
                                value={editStaffPhone}
                                onChange={(e) => setEditStaffPhone(e.target.value)}
                                className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">SIGNATURE DESK OFFICIELLE</label>
                            <input
                              type="text"
                              value={editStaffSignature}
                              onChange={(e) => setEditStaffSignature(e.target.value)}
                              className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 2 : Hiérarchie, Affectation & Réseau */}
                      <div className="admin-card-purple p-6 sm:p-8 space-y-5">
                        <h3 className="text-sm sm:text-base font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2.5 border-b border-slate-700/50 pb-3">
                          <ShieldCheck className="size-5 text-purple-400" />
                          <span>2. Hiérarchie, Rôle Système &amp; Sécurité Réseau</span>
                        </h3>

                        <div className="space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">RÔLE SYSTÈME</label>
                              <AdminDropdown
                                value={editStaffRole}
                                disabled={editingStaffMember.role === "OWNER" && currentSessionRole !== "OWNER"}
                                onChange={(r) => setEditStaffRole(r)}
                                options={STAFF_ROLE_OPTIONS}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">DÉPARTEMENT / PÔLE</label>
                              <AdminDropdown
                                value={editStaffDept}
                                onChange={(d) => setEditStaffDept(d as any)}
                                options={STAFF_DEPT_OPTIONS}
                              />
                            </div>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">COMPTES ATTRIBUÉS</label>
                              <input
                                type="number"
                                value={editStaffAssignedCount}
                                onChange={(e) => setEditStaffAssignedCount(parseInt(e.target.value) || 0)}
                                className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-3 text-sm text-white outline-none font-mono focus:border-purple-400"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">HORAIRES D'ACCÈS</label>
                              <input
                                type="text"
                                value={editStaffHours}
                                onChange={(e) => setEditStaffHours(e.target.value)}
                                className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-3 text-sm text-white outline-none font-mono focus:border-purple-400"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">RESTRICTIONS IP (WHITELIST)</label>
                            <input
                              type="text"
                              value={editStaffIpWhitelist}
                              onChange={(e) => setEditStaffIpWhitelist(e.target.value)}
                              className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-3 text-sm text-white outline-none font-mono focus:border-purple-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3 : Matrice Visuelle & Intuitive des Permissions */}
                    <div className="admin-card-emerald p-6 sm:p-8 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-700/50 pb-4">
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2.5">
                            <Sliders className="size-5 text-emerald-400" />
                            <span>3. Matrice Granulaire des Permissions &amp; Pouvoirs MT5</span>
                          </h3>
                          <p className="text-xs text-slate-300 mt-1">
                            Activez ou désactivez les privilèges opérationnels attribués à ce collaborateur.
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Chat */}
                        <div className="p-4 rounded-2xl border border-slate-700/60 bg-[#0c121e] flex items-center justify-between gap-3 hover:border-emerald-500/40 transition">
                          <div className="space-y-0.5">
                            <strong className="text-xs sm:text-sm font-bold text-white block">Chat Direct Traders</strong>
                            <span className="text-[11px] text-slate-400 block">Répondre aux messages en direct</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" checked={editStaffPermChat} onChange={(e) => setEditStaffPermChat(e.target.checked)} className="sr-only peer" />
                            <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                        </div>

                        {/* Email */}
                        <div className="p-4 rounded-2xl border border-slate-700/60 bg-[#0c121e] flex items-center justify-between gap-3 hover:border-emerald-500/40 transition">
                          <div className="space-y-0.5">
                            <strong className="text-xs sm:text-sm font-bold text-white block">E-mails Desk Officiels</strong>
                            <span className="text-[11px] text-slate-400 block">Envoyer des e-mails officiels</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" checked={editStaffPermEmail} onChange={(e) => setEditStaffPermEmail(e.target.checked)} className="sr-only peer" />
                            <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                        </div>

                        {/* Phone VoIP */}
                        <div className="p-4 rounded-2xl border border-slate-700/60 bg-[#0c121e] flex items-center justify-between gap-3 hover:border-emerald-500/40 transition">
                          <div className="space-y-0.5">
                            <strong className="text-xs sm:text-sm font-bold text-white block">Appels Téléphoniques VoIP</strong>
                            <span className="text-[11px] text-slate-400 block">Passer des appels directs desk</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" checked={editStaffPermPhone} onChange={(e) => setEditStaffPermPhone(e.target.checked)} className="sr-only peer" />
                            <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                        </div>

                        {/* Validation Retraits / Dépôts */}
                        <div className="p-4 rounded-2xl border border-slate-700/60 bg-[#0c121e] flex items-center justify-between gap-3 hover:border-emerald-500/40 transition">
                          <div className="space-y-0.5">
                            <strong className="text-xs sm:text-sm font-bold text-white block">Validation Retraits &amp; Dépôts</strong>
                            <span className="text-[11px] text-slate-400 block">Créditer les comptes et valider</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" checked={editStaffPermFinance} onChange={(e) => setEditStaffPermFinance(e.target.checked)} className="sr-only peer" />
                            <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                        </div>

                        {/* Moteurs MT5 */}
                        <div className="p-4 rounded-2xl border border-slate-700/60 bg-[#0c121e] flex items-center justify-between gap-3 hover:border-indigo-500/40 transition">
                          <div className="space-y-0.5">
                            <strong className="text-xs sm:text-sm font-bold text-white block">Paramétrage Moteurs MT5</strong>
                            <span className="text-[11px] text-slate-400 block">Piloter robots &amp; lots max</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" checked={editStaffPermEngines} onChange={(e) => setEditStaffPermEngines(e.target.checked)} className="sr-only peer" />
                            <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                          </label>
                        </div>

                        {/* P&L */}
                        <div className="p-4 rounded-2xl border border-slate-700/60 bg-[#0c121e] flex items-center justify-between gap-3 hover:border-amber-500/40 transition">
                          <div className="space-y-0.5">
                            <strong className="text-xs sm:text-sm font-bold text-white block">Ajustements P&amp;L Desk</strong>
                            <span className="text-[11px] text-slate-400 block">Corriger gains &amp; pertes journaliers</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" checked={editStaffPermPnl} onChange={(e) => setEditStaffPermPnl(e.target.checked)} className="sr-only peer" />
                            <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
                          </label>
                        </div>

                        {/* Gestion Staff */}
                        <div className="p-4 rounded-2xl border border-slate-700/60 bg-[#0c121e] flex items-center justify-between gap-3 hover:border-purple-500/40 transition">
                          <div className="space-y-0.5">
                            <strong className="text-xs sm:text-sm font-bold text-white block">Gestion &amp; Gouvernance Staff</strong>
                            <span className="text-[11px] text-slate-400 block">Créer et administrer les comptes</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" checked={editStaffPermManageStaff} onChange={(e) => setEditStaffPermManageStaff(e.target.checked)} className="sr-only peer" />
                            <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                          </label>
                        </div>

                        {/* Trésorerie */}
                        <div className="p-4 rounded-2xl border border-slate-700/60 bg-[#0c121e] flex items-center justify-between gap-3 hover:border-cyan-500/40 transition">
                          <div className="space-y-0.5">
                            <strong className="text-xs sm:text-sm font-bold text-white block">Accès Trésorerie &amp; Bilan</strong>
                            <span className="text-[11px] text-slate-400 block">Consulter soldes &amp; marges broker</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" checked={editStaffPermViewTreasury} onChange={(e) => setEditStaffPermViewTreasury(e.target.checked)} className="sr-only peer" />
                            <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-400"></div>
                          </label>
                        </div>

                        {/* Kill Switch */}
                        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 flex items-center justify-between gap-3 hover:border-rose-500/50 transition">
                          <div className="space-y-0.5">
                            <strong className="text-xs sm:text-sm font-bold text-rose-400 block flex items-center gap-1.5">
                              <AlertTriangle className="size-3.5" />
                              <span>Kill Switch d'Urgence Total</span>
                            </strong>
                            <span className="text-[11px] text-rose-300/80 block">Pouvoir d'arrêt global immédiat</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" checked={editStaffPermKillSwitch} onChange={(e) => setEditStaffPermKillSwitch(e.target.checked)} className="sr-only peer" />
                            <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Section 4 : Zone de Gouvernance Critique (Suspendre, Révoquer, 2FA, Supprimer) */}
                    <div className="p-6 sm:p-8 rounded-3xl border border-rose-500/30 bg-[#0c121e] space-y-5 shadow-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
                        <div>
                          <h4 className="text-sm sm:text-base font-bold text-rose-400 uppercase font-mono tracking-wider flex items-center gap-2">
                            <AlertTriangle className="size-5" />
                            <span>4. Gouvernance Avancée &amp; Actions Critiques de Sécurité</span>
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">
                            Statut actuel : <strong className="text-white font-mono">{editStaffStatus}</strong> · Double authentification : <strong className="text-emerald-400 font-mono">{editingStaffMember.twoFactorEnabled ? "2FA Actif" : "Inactif"}</strong>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleResetStaff2FA(editingStaffMember)}
                          className="rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2.5 text-xs sm:text-sm font-bold text-amber-300 transition cursor-pointer flex items-center gap-2 w-fit"
                        >
                          <Key className="size-4" />
                          <span>Réinitialiser 2FA Collaborateur</span>
                        </button>
                      </div>

                      {editingStaffMember.role !== "OWNER" ? (
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          {editStaffStatus === "ACTIVE" ? (
                            <button
                              type="button"
                              onClick={() => {
                                setEditStaffStatus("SUSPENDED");
                                handleToggleStaffStatus(editingStaffMember);
                              }}
                              className="rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-4 py-2.5 text-xs sm:text-sm font-bold text-amber-300 transition cursor-pointer flex items-center gap-2"
                            >
                              <Pause className="size-4" />
                              <span>Suspendre le Compte</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditStaffStatus("ACTIVE");
                                handleToggleStaffStatus(editingStaffMember);
                              }}
                              className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-300 transition cursor-pointer flex items-center gap-2"
                            >
                              <Unlock className="size-4" />
                              <span>Réactiver le Compte</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setEditStaffStatus("REVOKED");
                              setStaffList((prev) => prev.map((s) => (s.id === editingStaffMember.id ? { ...s, status: "REVOKED" } : s)));
                              addAuditLog("STAFF_REVOKED", `Accès révoqués pour ${editingStaffMember.name}.`);
                              toast.error(`Accès révoqués pour ${editingStaffMember.name}.`);
                            }}
                            className="rounded-xl border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 px-4 py-2.5 text-xs sm:text-sm font-bold text-purple-300 transition cursor-pointer flex items-center gap-2"
                          >
                            <MinusCircle className="size-4" />
                            <span>Révoquer Tous les Droits</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingStaffMember(null);
                              handleDeleteStaffMember(editingStaffMember);
                            }}
                            className="rounded-xl border border-rose-600 bg-rose-600/20 hover:bg-rose-600/30 px-5 py-2.5 text-xs sm:text-sm font-bold text-rose-400 transition cursor-pointer flex items-center gap-2 ml-auto"
                          >
                            <Trash2 className="size-4" />
                            <span>Supprimer Définitivement</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-mono flex items-center gap-2.5">
                          <ShieldCheck className="size-5 shrink-0" />
                          <span>👑 Compte Fondateur &amp; Propriétaire Souverain : Ce compte ne peut pas être suspendu, révoqué ou supprimé par la console.</span>
                        </div>
                      )}

                      {/* Bottom Action Footer */}
                      <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-700/60">
                        <button
                          type="button"
                          onClick={() => setEditingStaffMember(null)}
                          className="admin-btn-secondary py-3 px-6 text-sm font-semibold"
                        >
                          Annuler &amp; Revenir
                        </button>

                        <button
                          type="submit"
                          className="admin-btn-primary py-3 px-8 text-sm font-bold flex items-center gap-2"
                        >
                          <CheckCircle2 className="size-4" />
                          <span>Enregistrer les Modifications du Staff</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 5. MESSAGERIE (`messaging`)                                        */}
          {/* ===================================================================== */}
          {activeSection === "messaging" && (
            <div className="space-y-6 animate-in fade-in">

              {/* ── HEADER ── */}
              <div className="border-b border-slate-700/50 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  <MessageCircle className="size-6 text-emerald-400" />
                  <span>Messagerie</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Chat direct avec les clients. Pour la boîte e-mail partagée, voir <strong className="text-slate-300">E-mails</strong> dans le menu.
                </p>
              </div>

              {/* ── CORPS PRINCIPAL : liste contacts + panneau conversation ── */}
              <div className="grid gap-5 lg:grid-cols-12" style={{ height: "calc(100vh - 240px)", minHeight: "600px" }}>

                {/* ── COLONNE GAUCHE : Contacts ── */}
                <div className="lg:col-span-4 flex flex-col rounded-2xl border border-slate-700/50 bg-gradient-to-b from-[#0f172a]/95 to-[#0b1120]/98 overflow-hidden shadow-xl">

                  {/* Recherche */}
                  <div className="p-4 border-b border-slate-700/40 bg-[#0f1626]/80 shrink-0">
                    <div className="relative">
                      <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Rechercher un trader…"
                        aria-label="Rechercher un contact"
                        value={searchContactQuery}
                        onChange={(e) => setSearchContactQuery(e.target.value)}
                        className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>

                  {/* Liste */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
                    {filteredContacts.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm">Aucun contact trouvé.</div>
                    ) : (
                      filteredContacts.map((c) => {
                        const lastMsg = messagesList.filter((m) => m.clientId === c.id && m.channel === "CHAT").slice(-1)[0];
                        const isSelected = c.id === activeClient?.id;
                        const unread = messagesList.filter((m) => m.clientId === c.id && !m.isRead).length;

                        return (
                          <button
                            key={c.id}
                            onClick={() => setSelectedUserId(c.id)}
                            className={`w-full text-left p-4 transition flex items-start gap-3.5 cursor-pointer ${
                              isSelected
                                ? "bg-emerald-600/12 border-l-[3px] border-l-emerald-500"
                                : "hover:bg-slate-800/40 border-l-[3px] border-l-transparent"
                            }`}
                          >
                            {/* Avatar */}
                            <div className="relative shrink-0">
                              <div className={`size-11 rounded-xl grid place-items-center font-bold text-base ${
                                isSelected
                                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-200"
                                  : "bg-slate-700/60 border border-slate-600/50 text-slate-300"
                              }`}>
                                {c.name.charAt(0)}
                              </div>
                              <span className="size-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0f1626] absolute -bottom-0.5 -right-0.5" />
                            </div>

                            {/* Infos */}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1">
                                <strong className={`text-sm font-bold truncate ${isSelected ? "text-white" : "text-slate-100"}`}>{c.name}</strong>
                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  {unread > 0 && (
                                    <span className="size-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold grid place-items-center">{unread}</span>
                                  )}
                                  <span className="text-xs text-slate-500 font-mono">{lastMsg?.timestamp ?? "—"}</span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-400 truncate mb-1.5">
                                {lastMsg ? (lastMsg.subject ?? lastMsg.text) : "Aucun message récent."}
                              </p>
                              <div className="flex items-center gap-2 text-xs font-mono">
                                <span className="text-emerald-400 font-semibold">MT5 #{c.mt5.login}</span>
                                <span className="text-slate-600">·</span>
                                <span className="text-slate-400">${c.balance.toLocaleString("fr-FR")}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* ── COLONNE DROITE : Conversation ── */}
                <div className="lg:col-span-8 flex flex-col rounded-2xl border border-slate-700/50 bg-gradient-to-b from-[#0f172a]/95 to-[#0b1120]/98 overflow-hidden shadow-xl">

                  {/* En-tête contact */}
                  <div className="p-4 border-b border-slate-700/40 bg-[#0f1626]/80 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3.5">
                      <div className="size-11 rounded-xl bg-emerald-600/20 border border-emerald-500/30 grid place-items-center font-bold text-emerald-300 text-base shrink-0">
                        {activeClient?.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 mb-0.5">
                          <h3 className="text-base font-bold text-white">{activeClient?.name}</h3>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                            ● EN DIRECT
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">{activeClient?.email} · {activeClient?.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toast.info(`Appel en cours vers ${activeClient?.phone}…`)}
                        className="size-9 rounded-xl border border-slate-700/60 bg-[#0c121e] hover:bg-slate-800 text-slate-300 hover:text-emerald-300 grid place-items-center cursor-pointer transition"
                        title="Appeler"
                      >
                        <PhoneCall className="size-4" />
                      </button>
                      <button
                        onClick={() => handleOpenClientProfile(activeClient)}
                        className="size-9 rounded-xl border border-slate-700/60 bg-[#0c121e] hover:bg-slate-800 text-slate-300 hover:text-white grid place-items-center cursor-pointer transition"
                        title="Voir fiche client"
                      >
                        <User className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Fil de messages */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {activeClientMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500">
                        <MessageCircle className="size-10 text-slate-700" />
                        <p className="text-sm font-medium">Commencez la conversation avec {activeClient?.name}</p>
                      </div>
                    ) : (
                      activeClientMessages.map((msg) => {
                        const isAdmin = msg.sender === "ADMIN";
                        return (
                          <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-3 space-y-1.5 ${
                              isAdmin
                                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-50 rounded-tr-none"
                                : "bg-[#0c121e] text-slate-200 border border-slate-700/50 rounded-tl-none"
                            }`}>
                              <div className={`flex justify-between gap-4 text-xs font-mono ${isAdmin ? "opacity-70" : "text-slate-500"}`}>
                                <span>{msg.authorName}</span><span>{msg.timestamp}</span>
                              </div>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                          </div>
                        );
                      }))}
                    </div>

                  <div className="px-4 py-2.5 border-t border-slate-800/60 bg-[#0c121e]/60 flex items-center gap-2 overflow-x-auto shrink-0">
                    <span className="text-xs font-semibold text-slate-500 uppercase font-mono shrink-0">Modeles :</span>
                    {CANNED_RESPONSES.map((cr, idx) => (
                      <button key={idx} onClick={() => handleInsertCannedResponse(cr)}
                        className="rounded-lg border border-slate-700/50 bg-[#131c30] hover:bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white shrink-0 cursor-pointer transition">
                        {cr.title}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSendDeskMessage} className="p-4 border-t border-slate-700/40 bg-[#0f1626]/80 space-y-3 shrink-0">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                      <span>Canal : <strong className="text-slate-300">Live Chat</strong></span>
                      <span>Signe par : {currentSessionRole}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input type="text"
                        placeholder="Envoyer un message..."
                        aria-label="Zone de saisie du message"
                        value={chatReplyInput}
                        onChange={(e) => setChatReplyInput(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 transition"
                      />
                      <button type="submit" className="admin-btn-primary py-3 px-5 text-sm font-bold shrink-0 flex items-center gap-2">
                        <Send className="size-4" />
                        <span>Envoyer</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 E-MAILS (`emails`) — réplique exacte de Messagerie adaptée aux e-mails */}
          {/* ===================================================================== */}
          {activeSection === "emails" && (
            <div className="space-y-6 animate-in fade-in">

              {/* ── HEADER ── */}
              <div className="border-b border-slate-700/50 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  <Mail className="size-6 text-emerald-400" />
                  <span>E-mails</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Boîte e-mail partagée. Pour le chat direct avec les clients, voir <strong className="text-slate-300">Messagerie</strong> dans le menu.
                </p>
              </div>

              {/* Onglets de filtrage des e-mails */}
              <div className="flex items-center gap-1 rounded-xl border border-slate-700/60 bg-[#121a2d] p-1 overflow-x-auto shrink-0 w-fit max-w-full">
                {EMAIL_NAV_ITEMS.map((item) => {
                  const count = item.countKey ? emailCounts[item.countKey] : undefined;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setEmailFilter(item.key)}
                      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer shrink-0 whitespace-nowrap ${
                        emailFilter === item.key
                          ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <span>{item.label}</span>
                      {count !== undefined && count > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-200 font-bold">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ── CORPS PRINCIPAL : liste emails + panneau conversation (COPIE CONFORME DE MESSAGERIE) ── */}
              <div className="grid gap-5 lg:grid-cols-12" style={{ height: "calc(100vh - 310px)", minHeight: "540px" }}>

                {/* ── COLONNE GAUCHE : E-mails (Nom du client uniquement) ── */}
                <div className="lg:col-span-4 flex flex-col rounded-2xl border border-slate-700/50 bg-gradient-to-b from-[#0f172a]/95 to-[#0b1120]/98 overflow-hidden shadow-xl">

                  {/* Recherche */}
                  <div className="p-4 border-b border-slate-700/40 bg-[#0f1626]/80 shrink-0">
                    <div className="relative">
                      <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Rechercher un client…"
                        aria-label="Rechercher un e-mail"
                        value={emailSearch}
                        onChange={(e) => setEmailSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>

                  {/* Liste */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
                    {emailConversationsList.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm">Aucun e-mail trouvé.</div>
                    ) : (
                      emailConversationsList.map((c) => {
                        const isSelected = c.id === selectedEmailConversationId;
                        const initial = (c.customerName || c.customerEmail).charAt(0).toUpperCase();

                        return (
                          <button
                            key={c.id}
                            onClick={() => handleSelectEmailConversation(c.id)}
                            className={`w-full text-left p-4 transition flex items-center gap-3.5 cursor-pointer ${
                              isSelected
                                ? "bg-emerald-600/12 border-l-[3px] border-l-emerald-500"
                                : "hover:bg-slate-800/40 border-l-[3px] border-l-transparent"
                            }`}
                          >
                            {/* Avatar */}
                            <div className="relative shrink-0">
                              <div className={`size-11 rounded-xl grid place-items-center font-bold text-base ${
                                isSelected
                                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-200"
                                  : "bg-slate-700/60 border border-slate-600/50 text-slate-300"
                              }`}>
                                {initial}
                              </div>
                              {c.unread && <span className="size-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0f1626] absolute -bottom-0.5 -right-0.5" />}
                            </div>

                            {/* Nom du client uniquement */}
                            <div className="flex-1 min-w-0 flex items-center justify-between">
                              <strong className={`text-sm font-bold truncate ${isSelected ? "text-white" : "text-slate-100"}`}>
                                {c.customerName || c.customerEmail}
                              </strong>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                {c.unread && (
                                  <span className="size-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold grid place-items-center">1</span>
                                )}
                                <span className="text-xs text-slate-500 font-mono">{formatEmailTimestamp(c.lastMessageAt)}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* ── COLONNE DROITE : Conversation ── */}
                <div className="lg:col-span-8 flex flex-col rounded-2xl border border-slate-700/50 bg-gradient-to-b from-[#0f172a]/95 to-[#0b1120]/98 overflow-hidden shadow-xl">

                  {/* En-tête contact */}
                  <div className="p-4 border-b border-slate-700/40 bg-[#0f1626]/80 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3.5">
                      <div className="size-11 rounded-xl bg-emerald-600/20 border border-emerald-500/30 grid place-items-center font-bold text-emerald-300 text-base shrink-0">
                        {(emailConversationDetail?.conversation.customerName || emailConversationDetail?.conversation.customerEmail || "N").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 mb-0.5">
                          <h3 className="text-base font-bold text-white">
                            {emailConversationDetail?.conversation.customerName || emailConversationDetail?.conversation.customerEmail}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-mono">
                            ● {emailConversationDetail?.conversation.status === "RESOLU" ? "RÉSOLU" : emailConversationDetail?.conversation.status === "EN_ATTENTE" ? "EN ATTENTE" : "EN COURS"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">
                          {emailConversationDetail?.conversation.customerEmail} · {emailConversationDetail?.conversation.subject}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={emailConversationDetail?.conversation.status ?? "EN_COURS"}
                        onChange={(e) => handleSetEmailStatus(e.target.value as any)}
                        className="admin-select-field !py-1.5 !px-2 !text-xs w-[110px]"
                        aria-label="Statut du dossier e-mail"
                      >
                        <option value="EN_COURS">En cours</option>
                        <option value="EN_ATTENTE">En attente</option>
                        <option value="RESOLU">Résolu</option>
                      </select>
                    </div>
                  </div>

                  {/* Fil de messages */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {!emailConversationDetail || emailTimeline.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500">
                        <Mail className="size-10 text-slate-700" />
                        <p className="text-sm font-medium">Sélectionnez un e-mail pour afficher la conversation</p>
                      </div>
                    ) : (
                      emailTimeline.map((entry) => {
                        if (entry.kind === "note") {
                          return (
                            <div key={entry.note.id} className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1">
                              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wide">
                                <StickyNote className="size-3.5" />
                                Note interne
                                <span className="text-amber-400/70 font-normal normal-case ml-auto font-mono">
                                  {entry.note.authorName ?? "—"} • {formatEmailTimestamp(entry.note.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-amber-100/90 whitespace-pre-wrap">{entry.note.content}</p>
                            </div>
                          );
                        }

                        const msg = entry.message;
                        const isAdmin = msg.direction === "OUTBOUND";
                        return (
                          <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-3 space-y-1.5 ${
                              isAdmin
                                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-50 rounded-tr-none"
                                : "bg-[#0c121e] text-slate-200 border border-slate-700/50 rounded-tl-none"
                            }`}>
                              <div className={`flex justify-between gap-4 text-xs font-mono ${isAdmin ? "opacity-70" : "text-slate-500"}`}>
                                <span>{isAdmin ? "Vous (Desk Nexium)" : msg.fromName || msg.fromEmail}</span>
                                <span>{formatEmailTimestamp(msg.receivedAt)}</span>
                              </div>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.bodyText}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Modèles prédéfinis d'e-mails (comme CANNED_RESPONSES de Messagerie) */}
                  <div className="px-4 py-2.5 border-t border-slate-800/60 bg-[#0c121e]/60 flex items-center gap-2 overflow-x-auto shrink-0">
                    <span className="text-xs font-semibold text-slate-500 uppercase font-mono shrink-0">Modèles :</span>
                    {[
                      { title: "Validation KYC", text: "Bonjour,\n\nVotre dossier de conformité a été vérifié et validé par notre service Compliance. Votre compte est désormais pleinement opérationnel sans restriction.\n\nCordialement,\nNexium Compliance" },
                      { title: "Dépôt Confirmé", text: "Bonjour,\n\nNous vous confirmons la bonne réception de vos fonds et le crédit immédiat sur votre compte MT5.\n\nCordialement,\nDesk Trésorerie" },
                      { title: "Latence & Serveur", text: "Bonjour,\n\nNos serveurs sont connectés en direct fibre optique au datacentre Equinix NY4 avec une latence moyenne de 11ms sur nos ponts ECN FIX.\n\nCordialement,\nSupport Technique" },
                      { title: "Rapport Performance", text: "Bonjour,\n\nVeuillez trouver ci-joint votre relevé mensuel de performance avec le détail des exécutions et du high-water mark.\n\nCordialement,\nRecherche Quantitative" },
                    ].map((cr, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEmailReplyText(cr.text)}
                        className="rounded-lg border border-slate-700/50 bg-[#131c30] hover:bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white shrink-0 cursor-pointer transition"
                      >
                        {cr.title}
                      </button>
                    ))}
                  </div>

                  {/* Formulaire d'envoi d'e-mail */}
                  <form onSubmit={handleSendEmailReply} className="p-4 border-t border-slate-700/40 bg-[#0f1626]/80 space-y-3 shrink-0">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                      <span>Canal : <strong className="text-slate-300">E-mail Officiel (mail.nexiummarkets.com)</strong></span>
                      <span>Signé par : {currentSessionRole}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Rédiger une réponse e-mail au client..."
                        aria-label="Zone de saisie de l'e-mail"
                        value={emailReplyText}
                        onChange={(e) => setEmailReplyText(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 transition"
                      />
                      <button
                        type="submit"
                        disabled={!emailReplyText.trim() || emailSending}
                        className="admin-btn-primary py-3 px-5 text-sm font-bold shrink-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Send className="size-4" />
                        <span>Envoyer</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 6. PASSERELLES MT5 & VPS (`gateways`)                               */}
          {/* ===================================================================== */}
          {activeSection === "gateways" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-700/50 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Radio className="size-7 text-emerald-400" />
                    <span>Passerelles MT5 &amp; VPS</span>
                  </h1>
                </div>
                <button
                  onClick={handleTestAllServers}
                  disabled={gateways.some((g) => g.testing)}
                  className="admin-btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`size-3.5 ${gateways.some((g) => g.testing) ? "animate-spin" : ""}`} />
                  <span>Tester Tous les Serveurs</span>
                </button>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 font-mono">
                {gateways.map((g) => (
                  <AdminPanel key={g.id} className={`space-y-4 transition-opacity ${g.testing ? "opacity-60" : ""}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-lg font-bold text-white block">{g.broker}</strong>
                        <span className="text-xs text-slate-400">{g.server} · IP: {g.ip}</span>
                      </div>
                      {g.testing ? (
                        <AdminBadge variant="sky">Test en cours…</AdminBadge>
                      ) : (
                        <AdminBadge variant={g.status === "OPTIMAL" ? "emerald" : g.status === "DEGRADED" ? "amber" : "rose"}>
                          {g.status}
                        </AdminBadge>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-700/40">
                      <div>
                        <span className="text-xs text-slate-400 uppercase font-semibold block">Latence Ping</span>
                        <strong className="text-xl font-bold text-emerald-400">{g.latencyMs} ms</strong>
                      </div>

                      <div>
                        <span className="text-xs text-slate-400 uppercase font-semibold block">Comptes Liés</span>
                        <strong className="text-xl font-bold text-white">{g.connectedAccounts}</strong>
                      </div>

                      <div>
                        <span className="text-xs text-slate-400 uppercase font-semibold block">Débit Ticks</span>
                        <strong className="text-xl font-bold text-emerald-400">{g.ticksPerSec} /s</strong>
                      </div>
                    </div>
                  </AdminPanel>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 SÉCURITÉ & ACCÈS VPN (`security`)                                  */}
          {/* ===================================================================== */}
          {activeSection === "security" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-700/50 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Lock className="size-7 text-emerald-400" />
                    <span>Sécurité &amp; Accès VPN</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                    WireGuard + wg-easy — la console d'administration est exclusivement accessible depuis le tunnel VPN privé.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 shrink-0 w-fit">
                  <span className="relative flex size-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-2.5 bg-emerald-400"></span>
                  </span>
                  <span className="text-xs font-bold text-emerald-300 font-mono uppercase tracking-wider">Passerelle WireGuard Active</span>
                </div>
              </div>

              {/* Architecture */}
              <AdminPanel className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="size-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 grid place-items-center shrink-0">
                  <ShieldCheck className="size-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-white">Architecture : WireGuard + wg-easy</h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                    {vpnAccounts.length} comptes VPN individuels, console d'administration inaccessible hors tunnel, authentification à deux facteurs sur chaque compte. Auto-hébergé sur le VPS existant — coût logiciel : $0.
                  </p>
                </div>
                <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 shrink-0 w-fit">
                  wg-easy (open-source)
                </span>
              </AdminPanel>

              {/* Stats */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <AdminStatTile
                  label="Comptes VPN"
                  value={vpnAccounts.length}
                  tone="neutral"
                  sub={<><Users className="size-3.5" /> 20 accès individuels max</>}
                />
                <AdminStatTile
                  label="En Ligne Maintenant"
                  value={vpnAccounts.filter((v) => v.status === "ONLINE").length}
                  tone="positive"
                  sub={<><Wifi className="size-3.5" /> Connectés au tunnel</>}
                />
                <AdminStatTile
                  label="2FA Activé"
                  value={`${vpnAccounts.filter((v) => v.twoFactorEnabled).length}/${vpnAccounts.length}`}
                  tone={vpnAccounts.every((v) => v.twoFactorEnabled) ? "positive" : "warning"}
                  sub={<><Lock className="size-3.5" /> Comptes protégés</>}
                />
                <AdminStatTile
                  label="Accès Désactivés"
                  value={vpnAccounts.filter((v) => v.status === "DISABLED").length}
                  tone="negative"
                  sub={<><Ban className="size-3.5" /> Révoqués manuellement</>}
                />
              </div>

              {/* Enforcement du VPN sur la console admin */}
              <AdminPanel className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ShieldAlert className={`size-5 shrink-0 ${vpnOnlyAdminAccess ? "text-emerald-400" : "text-rose-400"}`} />
                  <div>
                    <h3 className="text-sm font-bold text-white">Console Admin Restreinte au VPN</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {vpnOnlyAdminAccess
                        ? "Toute tentative de connexion à /admin hors tunnel WireGuard est bloquée par le pare-feu du VPS."
                        : "⚠️ Mode dégradé : la console reste joignable hors VPN."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-mono font-bold uppercase ${vpnOnlyAdminAccess ? "text-emerald-400" : "text-rose-400"}`}>
                    {vpnOnlyAdminAccess ? "Actif" : "Désactivé"}
                  </span>
                  <AdminToggle
                    checked={vpnOnlyAdminAccess}
                    label="Restreindre la console admin au VPN"
                    onChange={(next) => {
                      setVpnOnlyAdminAccess(next);
                      addAuditLog(
                        next ? "VPN_ENFORCEMENT_ENABLED" : "VPN_ENFORCEMENT_DISABLED",
                        next ? "Restriction VPN de la console admin réactivée." : "Restriction VPN de la console admin désactivée."
                      );
                      toast[next ? "success" : "error"](
                        next ? "Console admin de nouveau restreinte au VPN." : "Attention : console admin accessible hors VPN."
                      );
                    }}
                  />
                </div>
              </AdminPanel>

              {/* Comptes VPN */}
              <AdminDataTable
                columns={[
                  {
                    key: "collaborateur",
                    header: "COLLABORATEUR & POSTE",
                    render: (v: VpnAccount) => (
                      <div className="font-sans">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-semibold text-white">{v.assignedTo}</strong>
                          <AdminBadge
                            variant={
                              v.role === "OWNER"
                                ? "amber"
                                : v.role === "SUPER_ADMIN"
                                ? "purple"
                                : v.role === "CONSEILLER"
                                ? "sky"
                                : "emerald"
                            }
                          >
                            {v.role.replace("_", " ")}
                          </AdminBadge>
                        </div>
                        <span className="text-xs text-slate-400 block mt-0.5">{v.device}</span>
                        <span className="text-xs text-slate-500 font-mono block">peer: {v.peerName}</span>
                      </div>
                    ),
                  },
                  {
                    key: "statut",
                    header: "STATUT",
                    render: (v: VpnAccount) => (
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span
                          className={`size-2.5 rounded-full shrink-0 ${
                            v.status === "ONLINE" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : v.status === "DISABLED" ? "bg-slate-600" : "bg-amber-400/70"
                          }`}
                        />
                        <div>
                          <strong className={`block font-semibold ${v.status === "ONLINE" ? "text-emerald-400" : v.status === "DISABLED" ? "text-slate-500" : "text-slate-300"}`}>
                            {v.status === "ONLINE" ? "En ligne" : v.status === "DISABLED" ? "Désactivé" : "Hors ligne"}
                          </strong>
                          <span className="text-slate-500">{v.status === "ONLINE" ? "Depuis le début de session" : v.lastHandshake}</span>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "reseau",
                    header: "ADRESSE VPN & PUBLIQUE",
                    render: (v: VpnAccount) => (
                      <div className="font-mono text-xs">
                        <span className="text-white font-semibold block">{v.vpnIp}</span>
                        <span className="text-slate-400 block">{v.publicIp} · {v.location}</span>
                      </div>
                    ),
                  },
                  {
                    key: "2fa",
                    header: "2FA",
                    render: (v: VpnAccount) => (
                      <AdminBadge variant={v.twoFactorEnabled ? "emerald" : "rose"} dot={false}>
                        {v.twoFactorEnabled ? "Actif ✓" : "Inactif"}
                      </AdminBadge>
                    ),
                  },
                  {
                    key: "data",
                    header: "DONNÉES ÉCHANGÉES",
                    render: (v: VpnAccount) => <span className="font-mono text-xs text-slate-300">{v.dataTransferred}</span>,
                  },
                  {
                    key: "action",
                    header: "ACTION",
                    align: "right",
                    render: (v: VpnAccount) => (
                      <button
                        onClick={() => handleToggleVpnAccount(v)}
                        className={
                          v.status === "DISABLED"
                            ? "rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold py-1.5 px-3.5 transition cursor-pointer inline-flex items-center gap-1.5"
                            : "rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold py-1.5 px-3.5 transition cursor-pointer inline-flex items-center gap-1.5"
                        }
                      >
                        {v.status === "DISABLED" ? <Unlock className="size-3.5" /> : <Ban className="size-3.5" />}
                        <span>{v.status === "DISABLED" ? "Réactiver" : "Désactiver"}</span>
                      </button>
                    ),
                  },
                ]}
                rows={vpnTable.pageRows}
                keyFor={(v) => v.id}
                totalCount={vpnTable.filtered.length}
                emptyMessage="Aucun compte VPN ne correspond à cette recherche."
                searchValue={vpnTable.query}
                onSearchChange={vpnTable.setQuery}
                searchPlaceholder="Rechercher un collaborateur, un poste, un rôle ou une IP..."
                searchAriaLabel="Rechercher un compte VPN"
                page={vpnTable.page}
                totalPages={vpnTable.totalPages}
                onPageChange={vpnTable.setPage}
              />
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 7. NEWS GUARD MACRO (`news-guard`)                                 */}
          {/* ===================================================================== */}
          {activeSection === "news-guard" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-700/50 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Newspaper className="size-7 text-blue-400" />
                    <span>News Guard Macro</span>
                  </h1>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-700/60 bg-[#121a2d] px-4 py-2.5">
                  <span className="text-xs font-semibold text-slate-300">
                    {newsGuardActive ? "News Guard actif" : "News Guard désactivé"}
                  </span>
                  <AdminToggle
                    checked={newsGuardActive}
                    label="Activer ou désactiver le News Guard"
                    onChange={(next) => {
                      setNewsGuardActive(next);
                      toast.success(next ? "News Guard activé." : "News Guard désactivé.");
                    }}
                  />
                </div>
              </div>

              <AdminPanel className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="size-4.5 text-amber-400" />
                  Événements Économiques Majeurs du Jour
                </h3>

                <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-[#0c121e]">
                  <table className="w-full text-left font-mono text-sm">
                    <thead className="border-b border-slate-700/50 bg-[#0f1626]/90 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">HEURE</th>
                        <th className="px-4 py-3">DEVISE</th>
                        <th className="px-4 py-3">ÉVÉNEMENT</th>
                        <th className="px-4 py-3">IMPACT</th>
                        <th className="px-4 py-3">ACTION AUTO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {economicEvents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-sans text-xs">
                            Aucun événement économique majeur aujourd'hui.
                          </td>
                        </tr>
                      ) : (
                        economicEvents.map((ev) => (
                          <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3 text-white font-semibold">{ev.time}</td>
                            <td className="px-4 py-3 text-amber-400 font-semibold">{ev.currency}</td>
                            <td className="px-4 py-3 text-white font-sans text-xs font-medium">{ev.event}</td>
                            <td className="px-4 py-3">
                              <AdminBadge variant="rose" dot={false}>
                                {ev.impact}
                              </AdminBadge>
                            </td>
                            <td className="px-4 py-3 text-emerald-400 font-semibold text-xs">
                              Pause Robots ±15min
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </AdminPanel>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 8. PERFORMANCE FEES (`perf-fees`)                                 */}
          {/* ===================================================================== */}
          {activeSection === "perf-fees" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-700/50 pb-5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                  <Receipt className="size-7 text-blue-400" />
                  <span>Performance Fees</span>
                </h1>
              </div>

              <AdminDataTable
                columns={[
                  { key: "client", header: "CLIENT", render: (c: UserProfile) => <span className="font-sans font-semibold text-white text-sm">{c.name}</span> },
                  {
                    key: "hwm",
                    header: "HIGH-WATER MARK",
                    render: (c: UserProfile) => <span className="text-slate-300 font-mono">${c.highWaterMark.toLocaleString("fr-FR")}</span>,
                  },
                  {
                    key: "pnl",
                    header: "GAIN NET COUVERT",
                    render: (c: UserProfile) => <span className="text-emerald-400 font-semibold font-mono">+{c.totalNetPnl.toLocaleString("fr-FR")} $</span>,
                  },
                  { key: "rate", header: "TAUX (%)", render: (c: UserProfile) => <span className="text-slate-300 font-mono">{c.performanceFeeRate}%</span> },
                  {
                    key: "due",
                    header: "COMMISSION DUE ($)",
                    render: (c: UserProfile) => <span className="text-amber-400 font-bold font-mono text-sm">${c.pendingPerfFee.toLocaleString("fr-FR")} USD</span>,
                  },
                  {
                    key: "action",
                    header: "ACTION",
                    align: "right",
                    render: (c: UserProfile) => (
                      <button
                        onClick={() => {
                          toast.success(`Frais de performance de $${c.pendingPerfFee} USD prélevés pour ${c.name}.`);
                        }}
                        className="rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 py-1.5 px-3 text-xs font-bold transition cursor-pointer"
                      >
                        Prélever Frais ✓
                      </button>
                    ),
                  },
                ]}
                rows={feesTable.pageRows}
                keyFor={(c) => c.id}
                totalCount={feesTable.filtered.length}
                emptyMessage="Aucun client ne correspond à cette recherche."
                searchValue={feesTable.query}
                onSearchChange={feesTable.setQuery}
                searchPlaceholder="Rechercher un client..."
                searchAriaLabel="Rechercher un client pour les frais de performance"
                page={feesTable.page}
                totalPages={feesTable.totalPages}
                onPageChange={feesTable.setPage}
              />
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 9. MOTEURS ALGORITHMIQUES & AUTO-TRADER (`engines`)                */}
          {/* ===================================================================== */}
          {activeSection === "engines" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-700/50 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Bot className="size-7 text-amber-400" />
                    <span>Moteurs Algorithmiques &amp; IA</span>
                  </h1>
                </div>

                <button
                  onClick={handleGlobalKillSwitch}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2.5 text-xs font-bold text-white uppercase tracking-wider transition cursor-pointer shadow-lg flex items-center gap-2"
                >
                  <AlertOctagon className="size-4" />
                  <span>KILL SWITCH GÉNÉRAL 🛑</span>
                </button>
              </div>

              <div className="grid gap-5 lg:grid-cols-3 font-mono">
                <div className="admin-card-amber p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] uppercase font-bold text-amber-400/90 font-mono tracking-wider">Spot Gold Engine</span>
                      <h3 className="text-lg font-bold text-white mt-0.5">Nexium AI Gold</h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">ACTIF</span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">Trading de l'Or (XAUUSD) par reconnaissance de structures institutionnelles et micro-breakouts.</p>
                  <div className="pt-3 space-y-2 text-xs border-t border-slate-700/40">
                    <div className="flex justify-between"><span className="text-slate-400 font-sans">Comptes Actifs :</span><strong className="text-white">2 / 2</strong></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-sans">Win Rate Global :</span><strong className="text-emerald-400 font-bold">79.2%</strong></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-sans">P&amp;L Cumulé :</span><strong className="text-amber-300 font-bold">+$18,450.00</strong></div>
                  </div>
                </div>

                <div className="admin-card-cyan p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] uppercase font-bold text-cyan-400/90 font-mono tracking-wider">Forex Trend Engine</span>
                      <h3 className="text-lg font-bold text-white mt-0.5">Nexium FX Trend</h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">ACTIF</span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">Suivi de tendance multi-paires Forex (EURUSD, GBPUSD, USDJPY) avec filtre de corrélation.</p>
                  <div className="pt-3 space-y-2 text-xs border-t border-slate-700/40">
                    <div className="flex justify-between"><span className="text-slate-400 font-sans">Comptes Actifs :</span><strong className="text-white">2 / 2</strong></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-sans">Win Rate Global :</span><strong className="text-emerald-400 font-bold">76.8%</strong></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-sans">P&amp;L Cumulé :</span><strong className="text-cyan-300 font-bold">+$12,890.00</strong></div>
                  </div>
                </div>

                <div className="admin-card-purple p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] uppercase font-bold text-purple-400/90 font-mono tracking-wider">US Index Quant</span>
                      <h3 className="text-lg font-bold text-white mt-0.5">Index Reversion</h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">ACTIF</span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">Stratégie de retour à la moyenne sur indices américains (US30 / NAS100) en session US.</p>
                  <div className="pt-3 space-y-2 text-xs border-t border-slate-700/40">
                    <div className="flex justify-between"><span className="text-slate-400 font-sans">Comptes Actifs :</span><strong className="text-white">1 / 2</strong></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-sans">Win Rate Global :</span><strong className="text-emerald-400 font-bold">82.1%</strong></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-sans">P&amp;L Cumulé :</span><strong className="text-purple-300 font-bold">+$9,210.00</strong></div>
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
              <div className="border-b border-slate-700/50 pb-5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                  <Wallet className="size-7 text-emerald-400" />
                  <span>Finances &amp; Trésorerie</span>
                </h1>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 font-mono">
                <div className="admin-card-emerald p-5 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-300 uppercase font-semibold font-sans">Actifs sous Gestion (AUM)</span>
                    <div className="grid size-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400">
                      <Wallet className="size-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">
                    ${(totalBalance + totalBonus).toLocaleString("fr-FR")} USD
                  </p>
                  <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                    <span>Dépôts + Bonus :</span>
                    <strong className="text-emerald-300">100% Collatéralisé</strong>
                  </div>
                </div>

                <div className="admin-card-cyan p-5 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-300 uppercase font-semibold font-sans">Dépôts Réels MT5</span>
                    <div className="grid size-8 place-items-center rounded-lg bg-cyan-500/15 text-cyan-400">
                      <TrendingUp className="size-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-cyan-300">
                    ${totalBalance.toLocaleString("fr-FR")} USD
                  </p>
                  <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                    <span>Liquidités :</span>
                    <strong className="text-cyan-400">Disponibles</strong>
                  </div>
                </div>

                <div className="admin-card-amber p-5 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-300 uppercase font-semibold font-sans">Bonus Commerciaux</span>
                    <div className="grid size-8 place-items-center rounded-lg bg-amber-500/15 text-amber-300">
                      <Award className="size-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-amber-300">
                    +${totalBonus.toLocaleString("fr-FR")} USD
                  </p>
                  <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                    <span>Effet de levier :</span>
                    <strong className="text-amber-400">1:500 ECN</strong>
                  </div>
                </div>

                <div className="admin-card-purple p-5 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-300 uppercase font-semibold font-sans">Commissions &amp; Perf Fees</span>
                    <div className="grid size-8 place-items-center rounded-lg bg-purple-500/15 text-purple-300">
                      <Receipt className="size-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-purple-300">
                    ${Math.round(totalBalance * 0.025).toLocaleString("fr-FR")} USD
                  </p>
                  <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                    <span>High-Water Mark :</span>
                    <strong className="text-purple-300">Actif</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 11. JOURNAL D'AUDIT SYSTÈME (`logs`)                               */}
          {/* ===================================================================== */}
          {activeSection === "logs" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-700/50 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Terminal className="size-7 text-emerald-400" />
                    <span>Journal d'Audit</span>
                  </h1>
                </div>

                <button
                  onClick={handleExportAuditLogs}
                  disabled={auditLogs.length === 0}
                  className="admin-btn-secondary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download className="size-3.5" />
                  <span>Exporter Logs (.CSV)</span>
                </button>
              </div>

              <AdminDataTable
                columns={[
                  { key: "ts", header: "HORODATAGE", render: (log: AuditEntry) => <span className="text-slate-400 font-mono text-xs">{log.timestamp}</span> },
                  { key: "admin", header: "AUTEUR", render: (log: AuditEntry) => <span className="text-emerald-400 font-semibold text-xs">{log.admin}</span> },
                  { key: "action", header: "ACTION", render: (log: AuditEntry) => <span className="text-white font-semibold text-xs">{log.action}</span> },
                  {
                    key: "target",
                    header: "UTILISATEUR CIBLE",
                    render: (log: AuditEntry) => <span className="text-amber-400 font-mono text-xs">{log.targetUser || "-"}</span>,
                  },
                  {
                    key: "details",
                    header: "DÉTAILS",
                    render: (log: AuditEntry) => <span className="text-slate-300 font-sans text-xs">{log.details}</span>,
                  },
                ]}
                rows={auditLogsTable.pageRows}
                keyFor={(log) => log.id}
                totalCount={auditLogsTable.filtered.length}
                emptyMessage="Aucune entrée dans le journal d'audit."
                searchValue={auditLogsTable.query}
                onSearchChange={auditLogsTable.setQuery}
                searchPlaceholder="Rechercher une action, un auteur, une cible..."
                searchAriaLabel="Rechercher dans le journal d'audit"
                page={auditLogsTable.page}
                totalPages={auditLogsTable.totalPages}
                onPageChange={auditLogsTable.setPage}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
