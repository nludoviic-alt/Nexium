import React, { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  getLiveChatThreads,
  claimLiveChatThread,
  sendLiveChatMessage,
  resolveLiveChatThread,
  archiveLiveChatThread,
  unarchiveLiveChatThread,
  subscribeToLiveChatUpdates,
  type LiveChatThread,
} from "@/lib/chat-router";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Award,
  Archive,
  ArchiveRestore,
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
  Gift,
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
  approvePresetSelection,
  assignAdvisorToClient,
  getAllClientProfiles,
  getUserProfile,
  updateUserProfile,
  recordAuditLog,
  getAuditLogs,
  getAllStaffProfiles,
  findProfileByEmail,
  deleteProfile,
  getAllTransactions,
  recordTransaction,
  updateTransactionStatus,
  updateClientBalance,
  inviteUser,
  updateUserEmail,
  setUserPassword,
  killUserSessions,
  getCrmNotes,
  addCrmNote,
  getAllDirectClientMessages,
  sendChatMessage,
  subscribeToDirectMessages,
  subscribeToProfiles,
  subscribeToTransactions,
  getAdminEmailConversations,
  getAdminEmailConversationDetail,
  adminReplyEmail,
  adminUpdateEmailStatus,
  adminAddEmailNote,
  subscribeToAdminEmails,
  getAllRolePermissions,
  updateRolePermissions,
  subscribeToRolePermissions,
  type RolePermissions,
  type StaffRole,
  type SupabaseTransaction,
  getPaymentSettings,
  updatePaymentSettings,
  subscribeToPaymentSettings,
  type PaymentSettings,
  getRecentPageViews,
  type PageView,
} from "@/lib/supabase";

import { getAdminSlug } from "@/lib/user-slug";

const NexiumDashboard = lazy(() =>
  import("./-nexium-dashboard").then((m) => ({ default: m.NexiumDashboard }))
);

export const Route = createFileRoute("/composition")({
  component: CompositionAccessGate,
});

const ADMIN_CONSOLE_ROLES: ReadonlyArray<string> = ["OWNER", "OWNER_A_PLUS", "OWNER_B_PLUS", "SUPER_ADMIN", "ADMIN", "CONSEILLER", "SUPPORT", "FINANCE", "QUANT"];

/**
 * Garde d'accès de /composition / /desk/$slug. Le build étant statique,
 * la vérification de session + rôle s'exécute côté client auprès de Supabase.
 */
export function CompositionAccessGate({ customAdminSlug }: { customAdminSlug?: string } = {}) {
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "authorized" | "denied">("checking");
  const [sessionRole, setSessionRole] = useState<AdminSystemRole | null>(null);
  const [isPrimaryOwner, setIsPrimaryOwner] = useState(false);
  const [sessionUser, setSessionUser] = useState<{ id: string; name: string; email: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!isSupabaseConfigured) {
        if (!cancelled) setState("denied");
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (cancelled) return;
      if (userError || !userData.user) {
        setState("denied");
        return;
      }

      const profile = await getUserProfile(userData.user.id);
      if (cancelled) return;

      const role = profile?.role;
      const blockedStatuses = ["REVOKED", "BANNED", "SUSPENDED"];
      if (!profile || !role || !ADMIN_CONSOLE_ROLES.includes(role) || blockedStatuses.includes(profile.status)) {
        setState("denied");
        return;
      }

      setSessionRole(role as AdminSystemRole);
      setIsPrimaryOwner(Boolean(profile.is_primary_owner));
      setSessionUser({ id: userData.user.id, name: profile.name || userData.user.email || "Administrateur", email: profile.email });
      setState("authorized");

      // Si l'administrateur arrive sur /composition générique, le rediriger vers son URL avec son prénom
      const adminSlug = getAdminSlug({ name: profile.name, email: userData.user.email, id: userData.user.id });
      if (!customAdminSlug) {
        navigate({ to: "/desk/$slug", params: { slug: adminSlug } });
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [customAdminSlug]);

  useEffect(() => {
    if (state === "denied") {
      toast.error("Accès refusé — connexion administrateur requise.");
      navigate({ to: "/login" });
    }
  }, [state, navigate]);

  if (state !== "authorized" || !sessionRole || !sessionUser) {
    return (
      <div className="min-h-screen bg-[#080a0e] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
        {/* Lueur d'ambiance d'arrière-plan */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] bg-[#00D084]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[300px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#0c1017]/90 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl shadow-black/80 text-center space-y-7 animate-in fade-in zoom-in-95 duration-300">
          {/* Logo & Emblème */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-3">
              <span className="font-mono text-2xl font-black tracking-[0.25em] text-white">NEXIUM</span>
              <span className="h-5 w-px bg-[#00D084]" />
              <span className="text-xs font-black tracking-[0.3em] text-[#00D084]">MARKETS</span>
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-widest bg-[#00D084]/10 text-[#00D084] border border-[#00D084]/30">
                Desk d'Administration · Supervision Quant
              </span>
            </div>
          </div>

          {/* Radar Central Animé */}
          <div className="relative size-24 mx-auto flex items-center justify-center">
            {/* Anneau rotatif 1 */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#00D084]/40 animate-spin" style={{ animationDuration: "12s" }} />
            {/* Anneau rotatif 2 inverse */}
            <div className="absolute inset-2 rounded-full border border-cyan-500/30 animate-spin" style={{ animationDuration: "8s", animationDirection: "reverse" }} />
            {/* Halo central */}
            <div className="size-14 rounded-2xl bg-gradient-to-br from-[#00D084]/20 to-cyan-500/10 border border-[#00D084]/40 grid place-items-center shadow-lg shadow-[#00D084]/20">
              <ShieldCheck className="size-7 text-[#00D084] animate-pulse" />
            </div>
          </div>

          {/* Statut & Barre de Progression */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#00D084] animate-ping" />
                <span>Initialisation du Desk...</span>
              </span>
              <span className="text-[#00D084] font-bold">Protocole FIX 4.4</span>
            </div>

            {/* Barre de Progression Fluide */}
            <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-[#00D084] via-cyan-400 to-[#00D084] rounded-full w-2/3 animate-pulse" />
            </div>

            {/* Logs de Télémétrie en Direct */}
            <div className="pt-2 text-[11px] font-mono text-slate-400/90 space-y-1 bg-black/40 p-3 rounded-xl border border-white/[0.04] text-left">
              <div className="flex items-center gap-2 truncate text-slate-300">
                <span className="text-[#00D084]">✓</span>
                <span>Liaison chiffrée TLS 1.3 établie</span>
              </div>
              <div className="flex items-center gap-2 truncate text-slate-300">
                <span className="text-[#00D084]">✓</span>
                <span>Authentification du jeton de session</span>
              </div>
              <div className="flex items-center gap-2 truncate text-cyan-300">
                <span className="text-cyan-400 animate-spin">⟳</span>
                <span>Synchronisation de l'infrastructure NY4...</span>
              </div>
            </div>
          </div>

          {/* Footer de Sécurité */}
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Passerelle : Equinix NY4</span>
            <span className="text-emerald-500 font-bold">Latence : 16ms</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <NexiumAdminDashboard
      initialSessionRole={sessionRole}
      isPrimaryOwner={isPrimaryOwner}
      sessionUser={sessionUser}
    />
  );
}

/* ========================================================================= */
/* TYPES & MODÈLES DE DONNÉES                                                */
/* ========================================================================= */

type AdminSystemRole = "OWNER" | "OWNER_A_PLUS" | "OWNER_B_PLUS" | "SUPER_ADMIN" | "ADMIN" | "CONSEILLER" | "SUPPORT" | "FINANCE" | "QUANT";
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
  equity: number;
  bonusCredit: number;
  kycStatus: KycStatus;
  licenseStatus?: "NOT_REQUESTED" | "PENDING_PRESET_APPROVAL" | "ACTIVE" | "EXPIRED";
  requestedPresets?: string[];
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
  /** Vrai uniquement pour le compte Super Owner protégé — verrouillé pour tout le monde, y compris lui-même, depuis cette interface. */
  isPrimaryOwner?: boolean;
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

const CANNED_RESPONSES = [
  { title: "👑 Compte MT5 Activé", text: "Bonjour,\n\nNous vous confirmons l'activation complète de votre compte de trading MetaTrader 5 sur notre infrastructure Equinix NY4. Vos accès au portail client sont désormais opérationnels pour déployer vos premiers algorithmes." },
  { title: "⏳ Confirmation Inscription", text: "Bonjour,\n\nVotre demande d'ouverture de compte a bien été reçue par notre équipe conformité. Votre dossier est en cours de validation et vos accès définitifs vous seront transmis sous 2h ouvrées." },
  { title: "🔑 Réinitialisation Accès", text: "Bonjour,\n\nUn lien sécurisé de réinitialisation de votre mot de passe vient de vous être expédié par e-mail via notre infrastructure Resend. Ce lien chiffré reste valide pendant 15 minutes." },
  { title: "💰 Dépôt MT5 Crédité", text: "Bonjour,\n\nVotre versement a été validé avec succès par notre desk financier. Vos fonds sont immédiatement disponibles sur votre solde MT5 pour vos opérations de trading." },
  { title: "🛡️ News Guard NFP / FOMC", text: "Bonjour,\n\nConformément à nos règles de gestion du risque, les robots de trading sont automatiquement mis en pause 15 minutes avant et après les annonces macro-économiques majeures afin d'éviter tout décalage de spread." },
  { title: "💳 Procédure de Retrait SEPA", text: "Bonjour,\n\nVotre demande de retrait a bien été enregistrée par notre desk financier. Le virement vers votre compte bancaire enregistré est exécuté sous un délai standard de 24h ouvrées." },
  { title: "🤖 Optimisation Moteur Gold", text: "Bonjour,\n\nLe preset Conservateur sur Nexium AI Gold a été calibré avec un stop-loss basé sur l'ATR 1.2 pour préserver votre capital en période de forte volatilité de l'Or." },
  { title: "📄 Confirmation KYC & Pièces", text: "Bonjour,\n\nNous vous confirmons la bonne réception et validation de vos pièces justificatives de conformité. Vos plafonds de compte sont désormais débloqués." },
];
const EMAIL_NAV_ITEMS: { key: EmailConversationFilter; label: string; icon: typeof Inbox; countKey: "inbox" | "mine" | "unassigned" | "inProgress" | "waiting" | "resolved" | "archived" | null }[] = [
  { key: "inbox", label: "Boîte de réception", icon: Inbox, countKey: "inbox" },
  { key: "mine", label: "Mes conversations", icon: User, countKey: "mine" },
  { key: "unassigned", label: "Non assignés", icon: Mail, countKey: "unassigned" },
  { key: "in_progress", label: "En cours", icon: CheckCircle2, countKey: "inProgress" },
  { key: "waiting", label: "En attente", icon: Clock, countKey: "waiting" },
  { key: "resolved", label: "Résolus", icon: Check, countKey: null },
  { key: "archived", label: "Archivés", icon: Archive, countKey: "archived" },
];
function matchesClient(c: UserProfile, q: string) {
  return (
    (c.name || "").toLowerCase().includes(q) ||
    (c.email || "").toLowerCase().includes(q) ||
    String(c.mt5?.login || "").includes(q) ||
    (c.mt5?.broker || "").toLowerCase().includes(q)
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
interface DropdownOption<T> {
  value: T;
  label: string;
  badge?: string;
}

/** Libellé lisible d'un rôle (OWNER_A_PLUS -> "Owner A+", etc.) */
function roleLabel(role: string): string {
  if (role === "OWNER_A_PLUS") return "Owner A+";
  if (role === "OWNER_B_PLUS") return "Owner B+";
  return role.replace(/_/g, " ");
}

const STAFF_ROLE_OPTIONS: DropdownOption<AdminSystemRole>[] = [
  { value: "OWNER", label: "Owner", badge: "Fondateur" },
  { value: "OWNER_A_PLUS", label: "Owner A+", badge: "Co-Fondateur" },
  { value: "OWNER_B_PLUS", label: "Owner B+", badge: "Co-Fondateur" },
  { value: "SUPER_ADMIN", label: "Super Admin", badge: "Direction" },
  { value: "ADMIN", label: "Admin", badge: "Général" },
  { value: "CONSEILLER", label: "Conseiller", badge: "Compte Privé" },
  { value: "SUPPORT", label: "Support", badge: "Relation Client" },
  { value: "FINANCE", label: "Finance", badge: "Trésorerie" },
  { value: "QUANT", label: "Quant", badge: "Stratégies MT5" },
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

const FALLBACK_CLIENT: any = {
  id: "client-preview",
  name: "Client",
  email: "client@nexiummarkets.com",
  phone: "+33 6 00 00 00 00",
  country: "France",
  status: "ACTIVE",
  createdAt: new Date().toISOString(),
  lastActive: "En ligne",
  ip: "127.0.0.1",
  twoFactorEnabled: false,
  forcePasswordReset: false,
  balance: 0,
  bonusCredit: 0,
  kycStatus: "VERIFIED",
  kycDocuments: { idCardName: "", proofOfAddressName: "", submittedDate: "" },
  grossProfitTotal: 0,
  grossLossTotal: 0,
  bestTradePnl: 0,
  worstTradePnl: 0,
  todayGrossGain: 0,
  todayGrossLoss: 0,
  todayPnl: 0,
  totalNetPnl: 0,
  winRatePercent: 0,
  engines: {
    aiGold: { active: true, preset: "AI_GOLD", maxLot: 1.0, minScore: 75, riskCapPercent: 2 },
    fxTrend: { active: true, preset: "FX_TREND", maxLot: 1.5, minScore: 70, riskCapPercent: 2 },
    indexReversion: { active: false, preset: "INDEX_REVERSION", maxLot: 0.5, minScore: 80, riskCapPercent: 1.5 },
  },
  mt5: {
    login: "#NX-000000",
    broker: "Nexium Prime ECN",
    server: "Nexium-NY4-Equinix",
    investorPass: "",
    pingMs: 16,
    status: "ONLINE",
  },
  maxDailyLossPercent: 3.0,
  maxSimultaneousTrades: 3,
  riskGuardAutoStop: true,
  assignedAdvisor: "Expert Trading",
  sessions: [],
  crmNotes: [],
  withdrawalRequests: [],
  depositRequests: [],
  transactions: [],
  trades: [],
  notes: [],
  livePositions: [],
};

/* ========================================================================= */
/* COMPOSANT PRINCIPAL : ADMINISTRATION NEXIUM                               */
/* ========================================================================= */

function NexiumAdminDashboard({
  initialSessionRole,
  isPrimaryOwner,
  sessionUser,
}: {
  initialSessionRole: AdminSystemRole;
  /** Vrai si le compte connecté est LE Super Owner protégé (au plus un seul, imposé côté DB). */
  isPrimaryOwner: boolean;
  sessionUser: { id: string; name: string; email: string };
}) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    navigate({ to: "/login" });
  };

  // Navigation
  const [activeSection, setActiveSection] = useState<
    "administrators" | "users" | "user-detail" | "create-user" | "messaging" | "emails" | "engines" | "finances" | "gateways" | "security" | "news-guard" | "perf-fees" | "logs" | "impersonation" | "access-levels" | "analytics"
  >("users");

  // Rôle Admin Session — dérivé de la session Supabase réelle par CompositionAccessGate,
  // plus jamais codé en dur (auparavant fixé à "SUPER_ADMIN" pour n'importe quel visiteur).
  const [currentSessionRole, setCurrentSessionRole] = useState<AdminSystemRole>(initialSessionRole);

  // Palette de Couleurs Active (Émeraude Institutionnelle & Obsidian par défaut)
  const [adminPalette, setAdminPalette] = useState<"sapphire" | "emerald">("emerald");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Données — plus aucun jeu de données de démonstration : tout démarre vide
  // en attendant le branchement sur les vraies tables Supabase.
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [staffList, setStaffList] = useState<StaffAdministrator[]>([]);
  const [gateways, setGateways] = useState<BrokerGateway[]>([]);
  const [vpnAccounts, setVpnAccounts] = useState<VpnAccount[]>([]);
  const [vpnOnlyAdminAccess, setVpnOnlyAdminAccess] = useState<boolean>(true);
  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>([]);
  const [newsGuardActive, setNewsGuardActive] = useState<boolean>(true);

  // Messagerie State (chat uniquement — les e-mails vivent dans le module "E-mails")
  const [messagingTab, setMessagingTab] = useState<"WEB_QUEUE" | "CLIENTS">("WEB_QUEUE");
  const [webThreads, setWebThreads] = useState<LiveChatThread[]>([]);
  const [showArchivedThreads, setShowArchivedThreads] = useState(false);
  const [selectedWebThreadId, setSelectedWebThreadId] = useState<string | null>(null);
  const [webThreadReplyInput, setWebThreadReplyInput] = useState("");
  const [channelFilter, setChannelFilter] = useState<"ALL" | "CHAT" | "EMAIL">("ALL");
  const [messagesList, setMessagesList] = useState<ChatMessage[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [chatReplyInput, setChatReplyInput] = useState("");
  const [searchContactQuery, setSearchContactQuery] = useState("");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastAudience, setBroadcastAudience] = useState<"ALL" | "ACTIVE_ONLY" | "GOLD_USERS">("ALL");

  // Module E-mails — boîte collaborative unique via email-service
  const [emailFilter, setEmailFilter] = useState<EmailConversationFilter>("inbox");
  const [emailSearch, setEmailSearch] = useState("");
  const [emailConversationsList, setEmailConversationsList] = useState<EmailConversationListItem[]>([]);
  const [emailCounts, setEmailCounts] = useState({ inbox: 0, mine: 0, unassigned: 0, inProgress: 0, waiting: 0, resolved: 0, archived: 0 });
  const [selectedEmailConversationId, setSelectedEmailConversationId] = useState<string | null>(null);
  const [emailConversationDetail, setEmailConversationDetail] = useState<EmailConversationDetail | null>(null);
  const [emailComposerMode, setEmailComposerMode] = useState<"REPLY" | "NOTE">("REPLY");
  const [emailReplyText, setEmailReplyText] = useState("");
  const [emailNoteText, setEmailNoteText] = useState("");
  const [emailPendingAttachments, setEmailPendingAttachments] = useState<{ id: string; filename: string; mimeType: string; size: number }[]>([]);
  const [emailAgentsList, setEmailAgentsList] = useState<EmailAgentSummary[]>([]);
  const [emailListLoading, setEmailListLoading] = useState(false);
  const [emailDetailLoading, setEmailDetailLoading] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailUploadingAttachment, setEmailUploadingAttachment] = useState(false);
  const [emailMobileView, setEmailMobileView] = useState<"list" | "conversation">("list");
  const [emailApiError, setEmailApiError] = useState<string | null>(null);
  const [showComposeEmailModal, setShowComposeEmailModal] = useState(false);
  const [composeEmailTo, setComposeEmailTo] = useState("");
  const [composeEmailSubject, setComposeEmailSubject] = useState("");
  const [composeEmailText, setComposeEmailText] = useState("");
  const [composeEmailSending, setComposeEmailSending] = useState(false);

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
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);

  // Détection des privilèges Super Admin et Conseiller
  const isSuperAdmin =
    currentSessionRole === "SUPER_ADMIN" ||
    currentSessionRole === "OWNER" ||
    currentSessionRole === "OWNER_A_PLUS" ||
    currentSessionRole === "OWNER_B_PLUS";
  const currentStaffMember = useMemo(() => staffList.find((s) => s.role === currentSessionRole), [staffList, currentSessionRole]);
  // Le Super Owner et le rôle Owner (Fondateur) ont accès à "Niveaux d'Accès".
  const canManageAccessLevels = isPrimaryOwner || currentSessionRole === "OWNER";
  const [advisorFilter, setAdvisorFilter] = useState<string>("ALL");

  // Niveaux d'accès par rôle — source de vérité unique pour ce que chaque
  // rôle a le droit de faire (remplace les anciennes cases à cocher
  // individuelles, qui n'avaient aucun effet réel).
  const [rolePermissions, setRolePermissions] = useState<Record<string, RolePermissions>>({});

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const applyRows = (rows: RolePermissions[]) => {
      setRolePermissions(Object.fromEntries(rows.map((r) => [r.role, r])));
    };
    getAllRolePermissions().then(applyRows);
    const unsub = subscribeToRolePermissions(applyRows);
    return unsub;
  }, []);

  const hasPermission = useCallback(
    (key: keyof Omit<RolePermissions, "role">) => {
      if (isPrimaryOwner) return true;
      const perms = rolePermissions[currentSessionRole];
      return perms ? perms[key] : false;
    },
    [rolePermissions, currentSessionRole, isPrimaryOwner]
  );

  // Si la page actuellement affichée vient d'être masquée pour ce rôle (par le
  // Super Owner, en direct ou avant même la connexion), on renvoie vers
  // "Comptes Clients" plutôt que de laisser une page inaccessible affichée.
  useEffect(() => {
    if (isPrimaryOwner) return;
    const hidden = rolePermissions[currentSessionRole]?.hidden_pages || [];
    if (hidden.length === 0) return;
    const sectionPageKey = ["user-detail", "create-user", "impersonation"].includes(activeSection) ? "users" : activeSection;
    if (hidden.includes(sectionPageKey)) {
      const fallback = MANAGEABLE_PAGES.find((p) => !hidden.includes(p.key))?.key as typeof activeSection | undefined;
      setActiveSection(fallback || "logs");
      toast.error("Cette page n'est plus accessible avec votre rôle actuel.");
    }
  }, [rolePermissions, currentSessionRole, isPrimaryOwner, activeSection]);

  // Page "Niveaux d'Accès" — édition du jeu de permissions d'un rôle
  const ALL_STAFF_ROLES: StaffRole[] = ["OWNER", "OWNER_A_PLUS", "OWNER_B_PLUS", "SUPER_ADMIN", "ADMIN", "CONSEILLER", "SUPPORT", "FINANCE", "QUANT"];
  // Pages du menu admin qu'on peut masquer par rôle (hors "access-levels", qui
  // reste de toute façon réservée au Super Owner et au rôle Owner, quoi qu'il arrive).
  const MANAGEABLE_PAGES: { key: string; label: string }[] = [
    { key: "users", label: "Comptes Clients" },
    { key: "administrators", label: "Administration" },
    { key: "messaging", label: "Chat" },
    { key: "emails", label: "E-mails" },
    { key: "gateways", label: "Passerelles MT5 & VPS" },
    { key: "security", label: "Sécurité & Accès VPN" },
    { key: "news-guard", label: "News Guard Macro" },
    { key: "perf-fees", label: "Performance Fees" },
    { key: "engines", label: "Moteurs & Auto-Trader" },
    { key: "finances", label: "Finances & Dépôts" },
    { key: "logs", label: "Journal d'Audit" },
    { key: "analytics", label: "Visiteurs" },
  ];
  const [accessLevelsSelectedRole, setAccessLevelsSelectedRole] = useState<StaffRole>("ADMIN");
  const [draftRolePerms, setDraftRolePerms] = useState<Omit<RolePermissions, "role"> | null>(null);
  const [savingRolePerms, setSavingRolePerms] = useState(false);

  useEffect(() => {
    const current = rolePermissions[accessLevelsSelectedRole];
    if (current) {
      const { role: _role, ...rest } = current;
      setDraftRolePerms({ ...rest, hidden_pages: rest.hidden_pages || [] });
    }
  }, [accessLevelsSelectedRole, rolePermissions]);

  const handleSaveRolePermissions = async () => {
    if (!draftRolePerms) return;
    setSavingRolePerms(true);
    try {
      const result = await updateRolePermissions(accessLevelsSelectedRole, draftRolePerms);
      if (!result.success) {
        toast.error("Échec de l'enregistrement des permissions côté base de données.");
        return;
      }
      setRolePermissions((prev) => ({ ...prev, [accessLevelsSelectedRole]: { role: accessLevelsSelectedRole, ...draftRolePerms } }));
      addAuditLog(
        "ROLE_PERMISSIONS_UPDATED",
        `Niveaux d'accès du rôle ${accessLevelsSelectedRole} mis à jour — appliqué à tous les collaborateurs de ce rôle.`,
        accessLevelsSelectedRole
      );
      toast.success(`Niveaux d'accès enregistrés pour le rôle ${accessLevelsSelectedRole}.`);
    } finally {
      setSavingRolePerms(false);
    }
  };

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
  const activeClient: UserProfile = useMemo(() => {
    return clients.find((c) => c.id === selectedUserId) ?? clients[0] ?? FALLBACK_CLIENT;
  }, [clients, selectedUserId]);

  const impersonatedClient = useMemo(() => {
    return clients.find((c) => c.id === impersonatedClientId) ?? null;
  }, [clients, impersonatedClientId]);

  // Messages chat filtrés pour le client sélectionné (les e-mails vivent dans leur
  // propre module, voir activeSection "emails").
  const activeClientMessages = useMemo(() => {
    return messagesList.filter((m) => m.clientId === activeClient?.id && m.channel === "CHAT");
  }, [messagesList, activeClient]);

  // Fiche staff du collaborateur actuellement connecté — identifiée par son
  // propre id (jamais par rôle seul : deux collaborateurs peuvent partager le
  // même rôle, ex. deux CONSEILLER).
  const myStaffRecord = useMemo(() => staffList.find((s) => s.id === sessionUser.id), [staffList, sessionUser.id]);
  // Signature desk (pseudo) du collaborateur connecté — c'est ce nom qui est
  // montré au client/visiteur dans le chat et les e-mails, jamais son rôle réel.
  const currentDeskSignature = useMemo(
    () => myStaffRecord?.deskSignature || `${sessionUser.name} — @ Nexium Markets`,
    [myStaffRecord, sessionUser.name]
  );

  // Édition du pseudo par son propriétaire, depuis son propre profil — toujours
  // permise (RLS Supabase : auth.uid() = id), contrairement à l'édition de la
  // fiche d'un autre collaborateur qui exige can_manage_staff.
  const [editingMyPseudo, setEditingMyPseudo] = useState(false);
  const [myPseudoDraft, setMyPseudoDraft] = useState("");
  const [savingMyPseudo, setSavingMyPseudo] = useState(false);

  const handleOpenMyPseudoEditor = () => {
    setMyPseudoDraft(currentDeskSignature);
    setEditingMyPseudo(true);
  };

  const handleSaveMyPseudo = async () => {
    const nextSignature = myPseudoDraft.trim();
    if (!nextSignature) {
      toast.error("Le pseudo ne peut pas être vide.");
      return;
    }
    setSavingMyPseudo(true);
    try {
      if (isSupabaseConfigured) {
        const result = await updateUserProfile(sessionUser.id, { desk_signature: nextSignature });
        if (!result.success) {
          toast.error("Échec de l'enregistrement du pseudo côté base de données.");
          return;
        }
      }
      setStaffList((prev) => prev.map((s) => (s.id === sessionUser.id ? { ...s, deskSignature: nextSignature } : s)));
      toast.success("Pseudo mis à jour — c'est ce nom qui apparaît désormais au client dans le chat.");
      setEditingMyPseudo(false);
    } finally {
      setSavingMyPseudo(false);
    }
  };

  // Identifiant email-service du collaborateur connecté — l'id Supabase réel
  // de la session, identique à l'id agent seedé côté email-service (voir
  // email-service/seed_real_agents.mjs). Auparavant cherchait le premier
  // membre du staffList ayant le même rôle : incorrect dès que deux personnes
  // partagent un rôle, et retombait sur un id de démo fictif sinon.
  const currentEmailAgentId = sessionUser.id;

  // Contacts filtrés pour la messagerie
  const filteredContacts = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch =
        (c.name || "").toLowerCase().includes(searchContactQuery.toLowerCase()) ||
        (c.email || "").toLowerCase().includes(searchContactQuery.toLowerCase()) ||
        String(c.mt5?.login || "").includes(searchContactQuery);
      return matchSearch;
    });
  }, [clients, searchContactQuery]);

  // Synchronisation temps réel avec le Routeur Chatbot Web + alertes sur nouveaux fils
  const seenChatThreadIdsRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    getLiveChatThreads().then((threads) => {
      seenChatThreadIdsRef.current = new Set(threads.map((t) => t.id));
      setWebThreads(threads);
    });
    const unsub = subscribeToLiveChatUpdates((threads) => {
      if (seenChatThreadIdsRef.current) {
        const newThreads = threads.filter(
          (t) => t.status === "QUEUE" && !seenChatThreadIdsRef.current!.has(t.id)
        );
        newThreads.forEach((t) => {
          toast.info(
            `💬 Nouvelle demande de chat en direct : ${t.visitorName} (${t.contact}) — ${t.initialQuery.slice(0, 90)}`,
            { duration: 9000 }
          );
        });
      }
      seenChatThreadIdsRef.current = new Set(threads.map((t) => t.id));
      setWebThreads(threads);
    });
    return unsub;
  }, []);

  // Synchronisation temps réel de la messagerie directe Admin ↔ Client
  const refreshDirectMessages = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const rows = await getAllDirectClientMessages();
    setMessagesList(
      rows.map((m): ChatMessage => ({
        id: m.id || `msg-${m.created_at}`,
        clientId: m.client_id,
        sender: m.sender === "ADMIN" ? "ADMIN" : "CLIENT",
        authorName: m.author_name,
        channel: "CHAT",
        text: m.text,
        timestamp: m.created_at ? new Date(m.created_at).toLocaleTimeString("fr-FR").slice(0, 5) : "",
        isRead: m.is_read,
      }))
    );
  }, []);

  useEffect(() => {
    refreshDirectMessages();
    const unsub = subscribeToDirectMessages(refreshDirectMessages);
    return unsub;
  }, [refreshDirectMessages]);

  const activeWebThread = useMemo(() => {
    if (!selectedWebThreadId) return webThreads[0] || null;
    return webThreads.find((t) => t.id === selectedWebThreadId) || webThreads[0] || null;
  }, [webThreads, selectedWebThreadId]);

  const queueCount = useMemo(() => {
    return webThreads.filter((t) => t.status === "QUEUE").length;
  }, [webThreads]);

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
  const [goldActive, setGoldActive] = useState(activeClient?.engines?.aiGold?.active ?? true);
  const [goldPreset, setGoldPreset] = useState(activeClient?.engines?.aiGold?.preset ?? GOLD_PRESETS[0].name);
  const [goldMaxLot, setGoldMaxLot] = useState(activeClient?.engines?.aiGold?.maxLot ?? 0.5);

  const [fxActive, setFxActive] = useState(activeClient?.engines?.fxTrend?.active ?? true);
  const [fxPreset, setFxPreset] = useState(activeClient?.engines?.fxTrend?.preset ?? FX_PRESETS[0].name);
  const [fxMaxLot, setFxMaxLot] = useState(activeClient?.engines?.fxTrend?.maxLot ?? 0.5);

  const [indexActive, setIndexActive] = useState(activeClient?.engines?.indexReversion?.active ?? true);
  const [indexPreset, setIndexPreset] = useState(activeClient?.engines?.indexReversion?.preset ?? INDEX_PRESETS[0].name);
  const [indexMaxLot, setIndexMaxLot] = useState(activeClient?.engines?.indexReversion?.maxLot ?? 0.5);

  // MT5 Client
  const [mt5Login, setMt5Login] = useState(activeClient?.mt5?.login || "");
  const [mt5Broker, setMt5Broker] = useState(activeClient?.mt5?.broker || "");
  const [mt5Server, setMt5Server] = useState(activeClient?.mt5?.server || "");
  const [mt5InvestorPass, setMt5InvestorPass] = useState(activeClient?.mt5?.investorPass || "");

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
      admin: `${sessionUser.name} (${currentSessionRole})`,
      action,
      ...(targetUser ? { targetUser } : {}),
      details,
    };
    setAuditLogs((prev) => [entry, ...prev]);

    if (isSupabaseConfigured) {
      recordAuditLog({
        admin_id: sessionUser.id,
        admin_name: sessionUser.name,
        action,
        ...(targetUser ? { target_user_email: targetUser } : {}),
        details,
      }).catch((err) => console.warn("Notice persistance audit log:", err));
    }
  };

  // Chargement du journal d'audit réel depuis Supabase (réservé OWNER / SUPER_ADMIN)
  useEffect(() => {
    if (!isSupabaseConfigured || (currentSessionRole !== "OWNER" && currentSessionRole !== "SUPER_ADMIN")) return;
    getAuditLogs().then((logs) => {
      setAuditLogs((prev) => [
        ...prev,
        ...logs.map((l): AuditEntry => ({
          id: l.id || `audit-${l.created_at}`,
          timestamp: l.created_at ? new Date(l.created_at).toLocaleTimeString("fr-FR") : "",
          admin: l.admin_name,
          action: l.action,
          ...(l.target_user_email ? { targetUser: l.target_user_email } : {}),
          details: typeof l.details === "string" ? l.details : JSON.stringify(l.details ?? ""),
        })),
      ]);
    });
  }, [currentSessionRole]);

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

    setGoldActive(client.engines?.aiGold?.active ?? true);
    setGoldPreset(client.engines?.aiGold?.preset ?? GOLD_PRESETS[0].name);
    setGoldMaxLot(client.engines?.aiGold?.maxLot ?? 0.5);

    setFxActive(client.engines?.fxTrend?.active ?? true);
    setFxPreset(client.engines?.fxTrend?.preset ?? FX_PRESETS[0].name);
    setFxMaxLot(client.engines?.fxTrend?.maxLot ?? 0.5);

    setIndexActive(client.engines?.indexReversion?.active ?? true);
    setIndexPreset(client.engines?.indexReversion?.preset ?? INDEX_PRESETS[0].name);
    setIndexMaxLot(client.engines?.indexReversion?.maxLot ?? 0.5);

    setMt5Login(client.mt5?.login || "");
    setMt5Broker(client.mt5?.broker || "");
    setMt5Server(client.mt5?.server || "");
    setMt5InvestorPass(client.mt5?.investorPass || "");

    setActiveSection("user-detail");

    if (isSupabaseConfigured) {
      getCrmNotes(client.id).then((notes) => {
        if (notes.length === 0) return;
        setClients((prev) =>
          prev.map((c) =>
            c.id === client.id
              ? {
                  ...c,
                  crmNotes: notes.map((n): CrmNote => ({
                    id: n.id || `note-${n.created_at}`,
                    author: n.author_name,
                    date: (n.created_at ? n.created_at.split("T")[0] : "") ?? "",
                    text: n.text,
                  })),
                }
              : c
          )
        );
      });
    }
  };

  const handleSaveClientProfile = async () => {
    if (!activeClient) return;

    const engines_config = {
      aiGold: { active: goldActive, preset: goldPreset, maxLot: goldMaxLot },
      fxTrend: { active: fxActive, preset: fxPreset, maxLot: fxMaxLot },
      indexReversion: { active: indexActive, preset: indexPreset, maxLot: indexMaxLot },
    };

    if (isSupabaseConfigured) {
      const result = await updateUserProfile(activeClient.id, {
        name: editName,
        phone: editPhone,
        status: editStatus,
        kyc_status: editKycStatus === "PENDING_REVIEW" ? "PENDING" : editKycStatus,
        country: editCountry,
        mt5_login: mt5Login,
        mt5_broker: mt5Broker,
        mt5_server: mt5Server,
        ...(mt5InvestorPass ? { mt5_investor_pass: mt5InvestorPass } : {}),
        max_daily_loss_percent: editMaxDailyLoss,
        max_simultaneous_trades: editMaxPositions,
        risk_guard_auto_stop: editRiskGuardAuto,
        engines_config,
      });
      if (!result.success) {
        toast.error("Échec de l'enregistrement du profil côté base de données.");
        return;
      }

      if (editEmail && editEmail !== activeClient.email) {
        const emailResult = await updateUserEmail(activeClient.id, editEmail);
        if (!emailResult.success) {
          toast.error(emailResult.error || "Échec du changement d'e-mail.");
          return;
        }
      }

      if (newPasswordInput) {
        const passResult = await setUserPassword(activeClient.id, newPasswordInput);
        if (!passResult.success) {
          toast.error(passResult.error || "Échec de la définition du mot de passe.");
          return;
        }
      }
    }

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
            engines: {
              aiGold: { ...(c.engines?.aiGold || {}), active: goldActive, preset: goldPreset, maxLot: goldMaxLot },
              fxTrend: { ...(c.engines?.fxTrend || {}), active: fxActive, preset: fxPreset, maxLot: fxMaxLot },
              indexReversion: { ...(c.engines?.indexReversion || {}), active: indexActive, preset: indexPreset, maxLot: indexMaxLot },
            },
            mt5: {
              ...(c.mt5 || {}),
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

    setNewPasswordInput("");
    addAuditLog("CLIENT_PROFILE_UPDATED", `Profil et paramètres enregistrés pour ${editName}.`, activeClient.email);
    toast.success(`Profil, presets et règles enregistrés pour ${editName}.`);
  };

  // Synchronisation des clients réels depuis Supabase
  const refreshClients = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const supabaseProfiles = await getAllClientProfiles();
    if (!supabaseProfiles || supabaseProfiles.length === 0) return;
    const profileById = new Map(supabaseProfiles.map((p) => [p.id, p]));
    setClients((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));

        // Fusionne les champs "vivants" venus de Supabase (statut, licence, preset...)
        // dans les clients déjà chargés, sans écraser leurs données purement locales
        // (sessions, notes, historique) — sinon une simple synchro Realtime n'a
        // jamais d'effet visible tant que la page n'est pas rechargée entièrement.
        const updatedExisting: UserProfile[] = prev.map((c) => {
          const p = profileById.get(c.id);
          if (!p) return c;
          return {
            ...c,
            status: (p.status as AccountStatus) ?? c.status,
            kycStatus: (p.kyc_status === "VERIFIED" ? "VERIFIED" : "PENDING_REVIEW") as UserProfile["kycStatus"],
            licenseStatus: ((p.license_status as any) || (p.status === "ACTIVE" && p.active_preset ? "ACTIVE" : "NOT_REQUESTED")) as UserProfile["licenseStatus"],
            requestedPresets: p.requested_presets && p.requested_presets.length > 0 ? p.requested_presets : (p.requested_preset ? [p.requested_preset] : []),
            activePreset: p.active_preset,
            balance: p.balance ?? c.balance,
            bonusCredit: p.bonus_credit ?? c.bonusCredit,
            equity: (p.balance ?? c.balance) + (p.bonus_credit ?? c.bonusCredit),
            assignedAdvisor: p.assigned_advisor || c.assignedAdvisor,
          } as UserProfile;
        });

        const newMapped: UserProfile[] = supabaseProfiles
          .filter((p) => !existingIds.has(p.id))
          .map((p) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            phone: p.phone || "",
            country: p.country || "",
            status: p.status as AccountStatus,
            createdAt: p.created_at ? p.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
            lastActive: "Nouveau compte",
            ip: "127.0.0.1",
            twoFactorEnabled: false,
            forcePasswordReset: false,
            balance: p.balance || 0,
            bonusCredit: p.bonus_credit || 0,
            equity: (p.balance || 0) + (p.bonus_credit || 0),
            kycStatus: p.kyc_status === "VERIFIED" ? "VERIFIED" : "PENDING_REVIEW",
            licenseStatus: (p.license_status as any) || (p.status === "ACTIVE" && p.active_preset ? "ACTIVE" : "NOT_REQUESTED"),
            requestedPresets: p.requested_presets && p.requested_presets.length > 0 ? p.requested_presets : (p.requested_preset ? [p.requested_preset] : []),
            activePreset: p.active_preset,
            kycDocuments: {
              idCardName: "En cours d'examen",
              proofOfAddressName: "En cours d'examen",
              submittedDate: "Aujourd'hui",
            },
            maxDailyLossPercent: p.max_daily_loss_percent ?? 3.0,
            maxSimultaneousTrades: p.max_simultaneous_trades ?? 3,
            riskGuardAutoStop: p.risk_guard_auto_stop ?? true,
            assignedAdvisor: p.assigned_advisor || "Expert Trading",
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
            performanceFeeRate: 20,
            pendingPerfFee: 0,
            engines: (p.engines_config as any) || {
              aiGold: { active: true, preset: "EQUINIX_NY4_DIRECT", maxLot: 1.0, minScore: 82, riskCapPercent: 2.0 },
              fxTrend: { active: true, preset: "INSTITUTIONAL_ALPHA", maxLot: 1.0, minScore: 78, riskCapPercent: 2.0 },
              indexReversion: { active: false, preset: "CONSERVATIVE_CORE", maxLot: 0.5, minScore: 85, riskCapPercent: 1.5 },
            },
            mt5: {
              login: p.mt5_login || `#NX-${Math.floor(100000 + Math.random() * 900000)}`,
              broker: p.mt5_broker || "Nexium Prime ECN",
              server: p.mt5_server || "Nexium-NY4-Equinix",
              investorPass: p.mt5_investor_pass || "",
              pingMs: 16,
              status: "ONLINE" as const,
            },
            licenseKey: p.license_key || "",
            licenseExpires: p.license_expires || "",
            tradingHistory: [],
            livePositions: [],
            transactions: [],
            trades: [],
            notes: [],
          }));

        return [...newMapped, ...updatedExisting];
      });
  }, []);

  useEffect(() => {
    refreshClients();
  }, [refreshClients]);

  // Synchronisation du staff réel depuis Supabase (tout profil hors rôle TRADER)
  const staffDepartmentForRole = (role: AdminSystemRole): StaffAdministrator["department"] => {
    if (role === "OWNER" || role === "OWNER_A_PLUS" || role === "OWNER_B_PLUS" || role === "SUPER_ADMIN") return "Direction Générale";
    if (role === "FINANCE") return "Gestion Financière";
    if (role === "QUANT") return "Recherche Quantitative";
    if (role === "CONSEILLER" || role === "SUPPORT") return "Desk Support & Conseillers";
    return "Conformité & Risque";
  };

  const refreshStaffList = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const profiles = await getAllStaffProfiles();
    if (!profiles || profiles.length === 0) return;
    setStaffList(
      profiles.map((p): StaffAdministrator => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone || "-",
        role: p.role as AdminSystemRole,
        isPrimaryOwner: Boolean(p.is_primary_owner),
        department: staffDepartmentForRole(p.role as AdminSystemRole),
        status: p.status as AccountStatus,
        twoFactorEnabled: false,
        createdAt: p.created_at ? p.created_at.split("T")[0] : "",
        lastLogin: "-",
        lastIp: "-",
        ipWhitelist: "Toutes les adresses IP",
        allowedHours: "24/7",
        deskSignature: p.desk_signature || `${p.name} — @ Nexium Markets`,
        assignedAccountsCount: 0,
        assignedTraders: [],
      }))
    );
  }, []);

  useEffect(() => {
    refreshStaffList();
  }, [refreshStaffList]);

  // Abonnement Realtime pour alertes instantanées sur nouvelles inscriptions et demandes de Preset
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const unsub = subscribeToProfiles((payload) => {
      if (payload.eventType === "INSERT") {
        const newClient = payload.new;
        toast.info(
          `🚨 Nouvelle demande d'ouverture de compte reçue : ${newClient?.name || "Client"} (${newClient?.email || ""})`,
          { duration: 9000 }
        );
      } else if (
        payload.eventType === "UPDATE" &&
        payload.new?.license_status === "PENDING_PRESET_APPROVAL" &&
        payload.old?.license_status !== "PENDING_PRESET_APPROVAL"
      ) {
        const client = payload.new;
        const presetsLabel = (client?.requested_presets && client.requested_presets.length > 0
          ? client.requested_presets.join(", ")
          : client?.requested_preset) || "Preset";
        toast.info(
          `⚡ Nouvelle demande d'activation de Preset : ${client?.name || "Client"} (${client?.email || ""}) — ${presetsLabel}`,
          { duration: 9000 }
        );
      }
      refreshClients();
      // Le staff (collègues) vit dans la même table "profiles" — un changement
      // fait par un collègue (pseudo, rôle...) doit apparaître immédiatement
      // dans les autres sessions admin ouvertes, sans attendre un rechargement.
      refreshStaffList();
    });
    return unsub;
  }, [refreshClients, refreshStaffList]);

  // Abonnement Realtime pour alertes instantanées sur dépôts et retraits
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const unsub = subscribeToTransactions((payload) => {
      if (payload.eventType === "INSERT") {
        const tx = payload.new;
        const isDep = tx?.type === "DEPOSIT";
        toast.info(
          `💳 Demande ${isDep ? "de dépôt" : "de retrait"} reçue : $${tx?.amount || 0} (${tx?.method || "Virement"})`,
          { duration: 8000 }
        );
      }
      refreshClients();
      getAllTransactions().then((txs) => txs && setAllTransactions(txs));
    });
    return unsub;
  }, [refreshClients]);

  // Synchronisation des transactions réelles depuis Supabase, fusionnées dans
  // chaque client (retraits/dépôts en attente + historique).
  const [allTransactions, setAllTransactions] = useState<SupabaseTransaction[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [paymentSettingsDraft, setPaymentSettingsDraft] = useState<Partial<PaymentSettings>>({});
  const [savingPaymentSettings, setSavingPaymentSettings] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getPaymentSettings().then((s) => {
      setPaymentSettings(s);
      if (s) setPaymentSettingsDraft(s);
    });
    const unsub = subscribeToPaymentSettings((s) => {
      setPaymentSettings(s);
      setPaymentSettingsDraft((prev) => (Object.keys(prev).length === 0 && s ? s : prev));
    });
    return unsub;
  }, []);

  const handleSavePaymentSettings = async () => {
    setSavingPaymentSettings(true);
    try {
      const result = await updatePaymentSettings(
        {
          bank_beneficiary: paymentSettingsDraft.bank_beneficiary || null,
          bank_iban: paymentSettingsDraft.bank_iban || null,
          bank_bic: paymentSettingsDraft.bank_bic || null,
          bank_name: paymentSettingsDraft.bank_name || null,
          crypto_btc_address: paymentSettingsDraft.crypto_btc_address || null,
          crypto_eth_address: paymentSettingsDraft.crypto_eth_address || null,
          crypto_usdt_trc20_address: paymentSettingsDraft.crypto_usdt_trc20_address || null,
          crypto_usdt_erc20_address: paymentSettingsDraft.crypto_usdt_erc20_address || null,
        },
        sessionUser.name
      );
      if (result.success) {
        toast.success("Coordonnées de paiement mises à jour.");
        addAuditLog("PAYMENT_SETTINGS_UPDATED", "Coordonnées de paiement (IBAN/crypto) modifiées.");
      } else {
        toast.error("Échec de la mise à jour des coordonnées de paiement.");
      }
    } finally {
      setSavingPaymentSettings(false);
    }
  };

  // Suivi des visiteurs (page Visiteurs) — fenêtre glissante rechargée à
  // chaque changement de période, pour ne pas tout charger d'un coup.
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [pageViewsWindow, setPageViewsWindow] = useState<"24h" | "7d" | "30d">("7d");
  const [pageViewsLoading, setPageViewsLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || activeSection !== "analytics") return;
    const hours = pageViewsWindow === "24h" ? 24 : pageViewsWindow === "7d" ? 24 * 7 : 24 * 30;
    const sinceIso = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    setPageViewsLoading(true);
    getRecentPageViews(sinceIso)
      .then(setPageViews)
      .finally(() => setPageViewsLoading(false));
  }, [activeSection, pageViewsWindow]);

  const pageViewStats = useMemo(() => {
    const uniqueSessions = new Set(pageViews.map((v) => v.session_id));
    const byPath = new Map<string, { views: number; sessions: Set<string> }>();
    for (const v of pageViews) {
      const entry = byPath.get(v.path) || { views: 0, sessions: new Set<string>() };
      entry.views += 1;
      entry.sessions.add(v.session_id);
      byPath.set(v.path, entry);
    }
    const topPages = Array.from(byPath.entries())
      .map(([path, { views, sessions }]) => ({ path, views, uniqueVisitors: sessions.size }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);

    return {
      totalViews: pageViews.length,
      uniqueVisitors: uniqueSessions.size,
      topPages,
      topPage: topPages[0]?.path || "—",
    };
  }, [pageViews]);

  const [financeTxSearch, setFinanceTxSearch] = useState("");
  const [financeTxTypeFilter, setFinanceTxTypeFilter] = useState<"ALL" | SupabaseTransaction["type"]>("ALL");
  const [financeTxStatusFilter, setFinanceTxStatusFilter] = useState<"ALL" | SupabaseTransaction["status"]>("ALL");
  const [financeTxMethodFilter, setFinanceTxMethodFilter] = useState("ALL");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getAllTransactions().then((txs) => {
      if (!txs || txs.length === 0) return;
      setAllTransactions(txs);

      setClients((prev) =>
        prev.map((c) => {
          const clientTxs = txs.filter((t) => t.user_id === c.id);
          if (clientTxs.length === 0) return c;

          const withdrawalRequests: ClientWithdrawal[] = clientTxs
            .filter((t) => t.type === "WITHDRAWAL")
            .map((t) => ({
              id: t.id || `tx-${t.created_at}`,
              date: (t.created_at ? t.created_at.split("T")[0] : "") ?? "",
              amount: t.amount,
              method: (t.method as ClientWithdrawal["method"]) || "SEPA_IBAN",
              destination: t.reference_tx || "-",
              status: (t.status === "PENDING" ? "PENDING" : t.status === "COMPLETED" ? "APPROVED" : "REJECTED") as ClientWithdrawal["status"],
            }));

          const depositRequests: ClientDeposit[] = clientTxs
            .filter((t) => t.type === "DEPOSIT")
            .map((t) => ({
              id: t.id || `tx-${t.created_at}`,
              date: (t.created_at ? t.created_at.split("T")[0] : "") ?? "",
              amount: t.amount,
              method: (t.method as ClientDeposit["method"]) || "VIREMENT_BANCAIRE",
              reference: t.reference_tx || "-",
              status: (t.status === "PENDING" ? "PENDING" : t.status === "COMPLETED" ? "CREDITED" : "REJECTED") as ClientDeposit["status"],
            }));

          const transactions: UserTransaction[] = clientTxs.map((t) => ({
            id: t.id || `tx-${t.created_at}`,
            date: (t.created_at ? t.created_at.split("T")[0] : "") ?? "",
            type: t.type as UserTransaction["type"],
            amount: t.amount,
            status: (t.status === "COMPLETED" ? "COMPLETED" : t.status === "PENDING" ? "PENDING" : "REJECTED") as UserTransaction["status"],
            method: t.method || "-",
            note: t.reference_tx ?? "",
          }));

          return { ...c, withdrawalRequests, depositRequests, transactions };
        })
      );
    });
  }, [clients.length > 0]);

  // Validation & Activation d'un compte client par l'Administrateur
  const handleApprovePendingClient = async (client: UserProfile) => {
    const assignedMt5 = client.mt5?.login || `#NX-${Math.floor(100000 + Math.random() * 900000)}`;

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
              ...(c.mt5 || {}),
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

  // Validation & Activation individuelle des Presets de Trading (SOUVERAINETÉ EXCLUSIVE DU SUPER ADMIN)
  // activePresetKeys : la liste des presets (parmi ceux demandés) que le Super Admin choisit d'activer
  // maintenant — le client peut n'en cocher qu'une partie ; le reste reste "Non activé" côté dashboard.
  const handleApproveClientPreset = async (client: UserProfile, activePresetKeys: string[]) => {
    if (!isSuperAdmin) {
      toast.error("Privilège insuffisant : Seul le Super Administrateur / Direction peut valider et activer les Presets.");
      return;
    }

    if (activePresetKeys.length === 0) {
      toast.error("Sélectionnez au moins un preset à activer.");
      return;
    }

    if (isSupabaseConfigured) {
      await approvePresetSelection(client.id, activePresetKeys);
    }

    const presetsLabel = activePresetKeys.join(", ");

    setClients((prev) =>
      prev.map((c) => {
        if (c.id === client.id) {
          return {
            ...c,
            licenseStatus: "ACTIVE",
            activePreset: presetsLabel,
            status: "ACTIVE",
            engines: {
              aiGold: { ...(c.engines?.aiGold || {}), active: activePresetKeys.includes("AI_GOLD") },
              fxTrend: { ...(c.engines?.fxTrend || {}), active: activePresetKeys.includes("FX_TREND") },
              indexReversion: { ...(c.engines?.indexReversion || {}), active: activePresetKeys.includes("INDEX_REVERSION") },
            },
          };
        }
        return c;
      })
    );

    // Envoi de l'e-mail officiel d'activation de la licence via Resend
    sendCustomDeskEmail(
      client.email,
      `Activation de votre Stratégie Algorithmique (${presetsLabel})`,
      `Bonjour ${client.name},\n\nVotre demande d'activation pour le${activePresetKeys.length > 1 ? "s" : ""} Preset${activePresetKeys.length > 1 ? "s" : ""} Algorithmique${activePresetKeys.length > 1 ? "s" : ""} [${presetsLabel}] a été validée par la Direction des Opérations.\n\nVotre Dashboard de Trading en direct (flux Equinix NY4 FIX 4.4) est désormais déverrouillé et opérationnel sur votre compte MT5 #${client.mt5?.login || "—"}.\n\nConnectez-vous dès maintenant pour suivre vos exécutions et vos performances en temps réel : https://nexiummarkets.com/login\n\nBien cordialement,\nLe Desk de Trading Nexium Markets`
    ).catch((err) => console.warn("Resend email error:", err));

    addAuditLog(
      "PRESET_APPROVED",
      `Preset(s) [${presetsLabel}] validé(s) et activé(s) pour ${client.name} (${client.email}) par le Super Admin. Dashboard déverrouillé.`,
      client.name
    );
    toast.success(`Preset(s) [${presetsLabel}] validé(s) ! Le Dashboard de ${client.name} est maintenant accessible.`);
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
  const handleSendDeskMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatReplyInput.trim() || !activeClient) return;

    const authorName = currentDeskSignature;
    const text = chatReplyInput.trim();

    if (isSupabaseConfigured) {
      const result = await sendChatMessage({
        client_id: activeClient.id,
        sender: "ADMIN",
        author_name: authorName,
        channel: "CHAT",
        text,
        is_read: true,
      });
      if (!result.success) {
        toast.error("Échec de l'envoi du message côté base de données.");
        return;
      }
    }

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      clientId: activeClient.id,
      sender: "ADMIN",
      authorName,
      channel: "CHAT",
      text,
      timestamp: new Date().toLocaleTimeString("fr-FR").slice(0, 5),
      isRead: true,
    };

    setMessagesList((prev) => [...prev, newMsg]);
    addAuditLog("DESK_MESSAGE_SENT", `Message transmis à ${activeClient.name}.`, activeClient.email);
    toast.success(`Message transmis à ${activeClient.name}.`);
    setChatReplyInput("");
  };

  // Handlers pour la file d'attente Web (Live Chat Router)
  const handleClaimWebThread = async (threadId: string) => {
    const updated = await claimLiveChatThread(threadId, currentDeskSignature, currentSessionRole);
    if (updated) {
      addAuditLog("LIVE_CHAT_CLAIMED", `Fil prospect #${threadId} pris en charge par ${currentSessionRole}.`);
      toast.success(`Vous avez pris en charge le fil #${threadId} !`);
      setSelectedWebThreadId(threadId);
    }
  };

  const handleSendWebThreadMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webThreadReplyInput.trim() || !activeWebThread) return;

    await sendLiveChatMessage({
      threadId: activeWebThread.id,
      sender: "ADVISOR",
      authorName: currentDeskSignature,
      text: webThreadReplyInput.trim(),
    });

    addAuditLog("LIVE_CHAT_REPLY", `Réponse envoyée au prospect ${activeWebThread.visitorName} (#${activeWebThread.id}).`);
    setWebThreadReplyInput("");
  };

  const handleResolveWebThread = async (threadId: string) => {
    await resolveLiveChatThread(threadId);
    addAuditLog("LIVE_CHAT_RESOLVED", `Fil prospect #${threadId} clôturé.`);
    toast.success("Session de chat clôturée avec succès.");
  };

  const handleArchiveWebThread = async (threadId: string) => {
    await archiveLiveChatThread(threadId);
    addAuditLog("LIVE_CHAT_ARCHIVED", `Fil prospect #${threadId} archivé.`);
    toast.success("Fil de discussion archivé.");
  };

  const handleUnarchiveWebThread = async (threadId: string) => {
    await unarchiveLiveChatThread(threadId);
    addAuditLog("LIVE_CHAT_UNARCHIVED", `Fil prospect #${threadId} restauré.`);
    toast.success("Fil de discussion restauré.");
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
  // Invitation d'un membre du staff : crée son compte de connexion réel via le
  // service backend dédié (clé service_role, jamais côté client) et lui envoie
  // un e-mail pour choisir son propre mot de passe. Il est actif immédiatement
  // après avoir cliqué le lien — aucune étape locale/fictive.
  const handleCreateStaffMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission("can_manage_staff")) {
      toast.error("Privilège insuffisant : votre rôle ne peut pas créer de collaborateurs.");
      return;
    }
    if (!newStaffName || !newStaffEmail) {
      toast.error("Veuillez renseigner au minimum le nom et l'e-mail.");
      return;
    }

    if (["OWNER", "OWNER_A_PLUS", "OWNER_B_PLUS"].includes(newStaffRole) && !isPrimaryOwner) {
      toast.error("Seul le Super Owner peut désigner ou créer ce rôle.");
      return;
    }

    const result = await inviteUser({
      name: newStaffName,
      email: newStaffEmail,
      ...(newStaffPhone ? { phone: newStaffPhone } : {}),
      role: newStaffRole,
    });

    if (!result.success) {
      toast.error(result.error || "Échec de l'invitation du membre du staff.");
      return;
    }

    addAuditLog("STAFF_INVITED", `Invitation envoyée à ${newStaffName} (${newStaffEmail}) — rôle ${newStaffRole}.`, newStaffEmail);
    toast.success(`Invitation envoyée à ${newStaffName}. Il/elle pourra définir son mot de passe via l'e-mail reçu.`);
    refreshStaffList();
    setNewStaffName("");
    setNewStaffEmail("");
    setNewStaffPhone("");
    setNewStaffIpWhitelist("");
    setNewStaffSignature("");
  };

  // Édition d'un Membre du Staff
  const handleOpenEditStaff = (st: StaffAdministrator) => {
    // Le statut de Super Owner ne doit jamais être révélé à quelqu'un d'autre
    // que lui-même — pas même aux autres OWNER. Seul le Super Owner peut
    // ouvrir sa propre fiche ; pour tout autre visiteur, la fiche reste fermée.
    if (st.isPrimaryOwner && !isPrimaryOwner) {
      toast.error("Accès refusé à ce profil.");
      return;
    }
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
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  const handleSaveEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaffMember) return;

    if (!hasPermission("can_manage_staff")) {
      toast.error("Privilège insuffisant : votre rôle ne peut pas modifier les collaborateurs.");
      return;
    }

    // Verrou Super Owner : personne d'autre que lui-même ne peut modifier ce
    // compte (déjà bloqué à l'ouverture de la fiche par handleOpenEditStaff).
    // Le Super Owner peut corriger ses propres nom/téléphone — rôle, statut
    // et champs sensibles restent verrouillés côté base par le trigger
    // Postgres protect_privileged_profile_fields, quoi que ce formulaire envoie.
    if (editingStaffMember.isPrimaryOwner && !isPrimaryOwner) {
      toast.error("Compte Super Owner protégé : non modifiable depuis cette interface.");
      return;
    }

    // Protection Souveraineté : un Owner simple ne peut être modifié que par
    // lui-même, un Owner A+/B+, ou le Super Owner.
    if (
      editingStaffMember.role === "OWNER" &&
      currentSessionRole !== "OWNER" &&
      currentSessionRole !== "OWNER_A_PLUS" &&
      currentSessionRole !== "OWNER_B_PLUS"
    ) {
      toast.error("Action refusée : seul un Owner, un Owner A+/B+ ou le Super Owner peut modifier le compte Fondateur.");
      return;
    }

    if (["OWNER", "OWNER_A_PLUS", "OWNER_B_PLUS"].includes(editStaffRole) && editStaffRole !== editingStaffMember.role && !isPrimaryOwner) {
      toast.error("Seul le Super Owner peut promouvoir un membre du staff à ce rôle.");
      return;
    }

    if (isSupabaseConfigured) {
      const result = await updateUserProfile(editingStaffMember.id, {
        name: editStaffName,
        phone: editStaffPhone,
        role: editStaffRole,
        status: editStaffStatus,
        assigned_advisor: editStaffDept,
        desk_signature: editStaffSignature || null,
      });
      if (!result.success) {
        toast.error("Échec de l'enregistrement — droits insuffisants ou compte protégé côté base de données.");
        return;
      }
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
        };
      })
    );

    addAuditLog("STAFF_UPDATED", `Mise à jour des privilèges et du profil staff : ${editStaffName} (${editStaffRole}).`, editStaffEmail);
    toast.success(`Modifications enregistrées pour ${editStaffName}.`);
    setEditingStaffMember(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  const handleToggleStaffStatus = async (st: StaffAdministrator) => {
    if (st.isPrimaryOwner) {
      toast.error("Compte Super Owner protégé : impossible de le suspendre ou de le révoquer, y compris pour vous-même.");
      return;
    }
    if (st.role === "OWNER") {
      toast.error("Impossible de suspendre ou révoquer le compte Propriétaire (OWNER).");
      return;
    }
    const newStatus: AccountStatus = st.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    if (isSupabaseConfigured) {
      const result = await updateUserProfile(st.id, { status: newStatus });
      if (!result.success) {
        toast.error("Échec de la mise à jour du statut côté base de données.");
        return;
      }
    }

    setStaffList((prev) => prev.map((s) => (s.id === st.id ? { ...s, status: newStatus } : s)));
    addAuditLog("STAFF_STATUS_CHANGE", `Statut du compte staff ${st.name} basculé vers ${newStatus}.`, st.email);
    toast.info(`Statut de ${st.name} mis à jour : ${newStatus}`);
  };

  const handleResetStaff2FA = (st: StaffAdministrator) => {
    if (st.isPrimaryOwner) {
      toast.error("Compte Super Owner protégé : sa double authentification ne peut pas être réinitialisée depuis cette interface.");
      return;
    }
    setStaffList((prev) => prev.map((s) => (s.id === st.id ? { ...s, twoFactorEnabled: false } : s)));
    toast.success(`Double authentification 2FA réinitialisée pour ${st.name}.`);
  };

  const handleDeleteStaffMember = (st: StaffAdministrator) => {
    if (!hasPermission("can_manage_staff")) {
      toast.error("Privilège insuffisant : votre rôle ne peut pas supprimer de collaborateurs.");
      return;
    }
    if (st.isPrimaryOwner) {
      toast.error("Compte Super Owner protégé : suppression impossible, y compris pour vous-même.");
      return;
    }
    // Hiérarchie à 3 paliers (appliquée aussi côté base via la policy
    // profiles_delete) :
    //  - Super Owner : peut supprimer tout le monde.
    //  - Owner A+ / Owner B+ : peuvent supprimer un Owner simple et tous les
    //    rôles en dessous, mais pas se supprimer l'un l'autre.
    //  - Owner / Super Admin : ne peuvent supprimer ni un Owner A+/B+, ni un
    //    autre Owner (comportement historique, inchangé).
    if (!isPrimaryOwner) {
      const callerIsAPlusOrBPlus = currentSessionRole === "OWNER_A_PLUS" || currentSessionRole === "OWNER_B_PLUS";
      const targetIsAPlusOrBPlus = st.role === "OWNER_A_PLUS" || st.role === "OWNER_B_PLUS";
      if (targetIsAPlusOrBPlus) {
        toast.error("Action impossible : seul le Super Owner peut supprimer un compte Owner A+/B+.");
        return;
      }
      if (st.role === "OWNER" && !callerIsAPlusOrBPlus) {
        toast.error("Action impossible : seul le Super Owner ou un Owner A+/B+ peut supprimer un compte Propriétaire (OWNER).");
        return;
      }
    }
    requestConfirmation(
      `Supprimer le membre du staff ${st.name} ?`,
      `Cette action révoquera définitivement tous les accès de ${st.name} (${st.role}) à la plateforme d'administration Nexium.`,
      "Supprimer Définitivement",
      "CRITICAL",
      async () => {
        if (isSupabaseConfigured) {
          const result = await deleteProfile(st.id);
          if (!result.success) {
            toast.error("Échec de la suppression côté base de données.");
            return;
          }
        }
        setStaffList((prev) => prev.filter((s) => s.id !== st.id));
        addAuditLog("STAFF_DELETED", `Compte staff ${st.name} (${st.role}) supprimé.`, st.email);
        toast.success(`Le compte de ${st.name} a été supprimé.`);
      }
    );
  };

  // Création d'un Client
  // Invitation d'un client : crée son compte de connexion réel (auth.users +
  // profiles, rôle TRADER, statut ACTIF immédiat) via le service backend dédié,
  // et lui envoie un e-mail pour choisir son propre mot de passe. Plus aucune
  // fabrication locale — le solde/MT5/courtier se règlent ensuite sur sa fiche.
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientEmail) {
      toast.error("Veuillez renseigner le nom et l'e-mail du client.");
      return;
    }

    const result = await inviteUser({
      name: newClientName,
      email: newClientEmail,
      ...(newClientPhone ? { phone: newClientPhone } : {}),
      role: "TRADER",
    });

    if (!result.success) {
      toast.error(result.error || "Échec de l'invitation du client.");
      return;
    }

    addAuditLog("CLIENT_INVITED", `Invitation envoyée à ${newClientName} (${newClientEmail}).`, newClientEmail);
    toast.success(`Invitation envoyée à ${newClientName}. Il/elle pourra définir son mot de passe via l'e-mail reçu et sera connecté immédiatement.`);
    refreshClients();
    setNewClientName("");
    setNewClientEmail("");
    setNewClientPhone("");
    setActiveSection("users");
  };

  // Validation Retrait
  const handleApproveWithdrawal = (withdrawal: ClientWithdrawal) => {
    if (!hasPermission("can_approve_finances")) {
      toast.error("Privilège insuffisant : votre rôle ne peut pas valider de retraits.");
      return;
    }
    requestConfirmation(
      `Valider le Retrait de $${withdrawal.amount.toLocaleString("fr-FR")} USD`,
      `Êtes-vous certain de vouloir approuver ce retrait pour ${activeClient.name} ? Le solde MT5 sera débité de $${withdrawal.amount.toLocaleString("fr-FR")} USD.`,
      "Valider & Débiter les Fonds",
      "WARNING",
      async () => {
        const newBalance = Math.max(0, activeClient.balance - withdrawal.amount);

        if (isSupabaseConfigured) {
          const [txResult, balResult] = await Promise.all([
            updateTransactionStatus(withdrawal.id, "COMPLETED"),
            updateClientBalance(activeClient.id, newBalance),
          ]);
          if (!txResult.success || !balResult.success) {
            toast.error("Échec de la validation du retrait côté base de données.");
            return;
          }
        }

        setClients((prev) =>
          prev.map((c) => {
            if (c.id === activeClient.id) {
              const updatedWithdrawals = c.withdrawalRequests.map((w) =>
                w.id === withdrawal.id ? { ...w, status: "APPROVED" as const, processedBy: `Admin (${currentSessionRole})` } : w
              );
              return {
                ...c,
                balance: newBalance,
                equity: newBalance + c.bonusCredit,
                withdrawalRequests: updatedWithdrawals,
              };
            }
            return c;
          })
        );

        addAuditLog("WITHDRAWAL_APPROVED", `Retrait de $${withdrawal.amount} USD validé pour ${activeClient.name}.`, activeClient.email);
        toast.success(`Retrait de $${withdrawal.amount.toLocaleString("fr-FR")} USD validé avec succès.`);
      }
    );
  };

  const handleRejectWithdrawal = (withdrawal: ClientWithdrawal) => {
    if (!hasPermission("can_approve_finances")) {
      toast.error("Privilège insuffisant : votre rôle ne peut pas rejeter de retraits.");
      return;
    }
    requestConfirmation(
      `Rejeter le Retrait de $${withdrawal.amount.toLocaleString("fr-FR")} USD`,
      `Cette demande de retrait pour ${activeClient.name} sera rejetée.`,
      "Rejeter la Demande",
      "CRITICAL",
      async () => {
        if (isSupabaseConfigured) {
          const result = await updateTransactionStatus(withdrawal.id, "REJECTED");
          if (!result.success) {
            toast.error("Échec du rejet du retrait côté base de données.");
            return;
          }
        }

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

        addAuditLog("WITHDRAWAL_REJECTED", `Demande de retrait de $${withdrawal.amount} USD rejetée pour ${activeClient.name}.`, activeClient.email);
        toast.error(`Demande de retrait rejetée.`);
      }
    );
  };

  // Validation Dépôt
  const handleApproveDeposit = (deposit: ClientDeposit) => {
    if (!hasPermission("can_approve_finances")) {
      toast.error("Privilège insuffisant : votre rôle ne peut pas créditer de dépôts.");
      return;
    }
    requestConfirmation(
      `Valider & Créditer le Dépôt de $${deposit.amount.toLocaleString("fr-FR")} USD`,
      `Créditer immédiatement $${deposit.amount.toLocaleString("fr-FR")} USD sur le compte de ${activeClient.name} ?`,
      "Créditer les Fonds",
      "WARNING",
      async () => {
        const newBalance = activeClient.balance + deposit.amount;

        if (isSupabaseConfigured) {
          const [txResult, balResult] = await Promise.all([
            updateTransactionStatus(deposit.id, "COMPLETED"),
            updateClientBalance(activeClient.id, newBalance),
          ]);
          if (!txResult.success || !balResult.success) {
            toast.error("Échec de la validation du dépôt côté base de données.");
            return;
          }
        }

        setClients((prev) =>
          prev.map((c) => {
            if (c.id === activeClient.id) {
              const updatedDeposits = c.depositRequests.map((d) =>
                d.id === deposit.id ? { ...d, status: "CREDITED" as const, creditedBy: `Admin (${currentSessionRole})` } : d
              );
              return {
                ...c,
                balance: newBalance,
                equity: newBalance + c.bonusCredit,
                depositRequests: updatedDeposits,
              };
            }
            return c;
          })
        );

        addAuditLog("DEPOSIT_CREDITED", `Dépôt de $${deposit.amount} USD validé et crédité pour ${activeClient.name}.`, activeClient.email);

        // Envoi de la confirmation de dépôt par email via Resend
        sendDepositConfirmedEmail(
          activeClient.email,
          activeClient.name,
          `$${deposit.amount.toLocaleString("fr-FR")} USD`,
          activeClient.mt5?.login || "—"
        ).then((res) => {
          if (res.success) {
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
    if (!hasPermission("can_approve_finances")) {
      toast.error("Privilège insuffisant : votre rôle ne peut pas effectuer d'opérations financières.");
      return;
    }
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
      async () => {
        let newBalance = activeClient.balance;
        let newBonus = activeClient.bonusCredit;

        if (creditType === "DEPOSIT") newBalance += amount;
        if (creditType === "BONUS") newBonus += amount;
        if (creditType === "DEBIT") newBalance = Math.max(0, newBalance - amount);

        const method = creditType === "DEPOSIT" ? "Dépôt Réel Desk" : creditType === "BONUS" ? "Bonus Commercial" : "Débit Administratif";
        let newTxId = `tx-${Date.now()}`;

        if (isSupabaseConfigured) {
          const [txResult, balResult] = await Promise.all([
            recordTransaction({
              user_id: activeClient.id,
              type: creditType,
              amount,
              status: "COMPLETED",
              method,
              ...(creditNote ? { reference_tx: creditNote } : {}),
            }),
            creditType === "BONUS"
              ? updateUserProfile(activeClient.id, { bonus_credit: newBonus })
              : updateClientBalance(activeClient.id, newBalance),
          ]);
          if (!txResult.success || !balResult.success) {
            toast.error("Échec de l'opération financière côté base de données.");
            return;
          }
          if (txResult.data?.id) newTxId = txResult.data.id;
        }

        const newTx: UserTransaction = {
          id: newTxId,
          date: new Date().toISOString().split("T")[0],
          type: creditType,
          amount,
          status: "COMPLETED",
          method,
          note: creditNote || "Ajustement Desk",
        };

        setClients((prev) =>
          prev.map((c) => {
            if (c.id === activeClient.id) {
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

        addAuditLog("FINANCIAL_OP", `${actionText} $${amount} USD appliqué à ${activeClient.name}.`, activeClient.email);
        toast.success(`Opération financière effectuée.`);
        setCreditAmountInput("");
        setCreditNote("");
      }
    );
  };

  // Ajustement P&L
  const handleApplyPnlAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission("can_adjust_pnl")) {
      toast.error("Privilège insuffisant : votre rôle ne peut pas ajuster le P&L.");
      return;
    }
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
      async () => {
        const signedAmount = pnlAdjustDirection === "PROFIT" ? amount : -amount;
        const newBalance = activeClient.balance + signedAmount;

        if (isSupabaseConfigured) {
          const [txResult, balResult] = await Promise.all([
            recordTransaction({
              user_id: activeClient.id,
              type: "PNL_ADJUST",
              amount: Math.abs(signedAmount),
              status: "COMPLETED",
              method: signedAmount >= 0 ? "Ajustement Gain Desk" : "Ajustement Perte Desk",
              ...(pnlAdjustReason ? { reference_tx: pnlAdjustReason } : {}),
            }),
            updateClientBalance(activeClient.id, newBalance),
          ]);
          if (!txResult.success || !balResult.success) {
            toast.error("Échec de l'ajustement P&L côté base de données.");
            return;
          }
        }

        setClients((prev) =>
          prev.map((c) => {
            if (c.id === activeClient.id) {
              return {
                ...c,
                todayPnl: c.todayPnl + signedAmount,
                totalNetPnl: c.totalNetPnl + signedAmount,
                equity: c.equity + signedAmount,
                balance: newBalance,
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
    if (!hasPermission("can_adjust_pnl")) {
      toast.error("Privilège insuffisant : votre rôle ne peut pas ajuster le P&L.");
      return;
    }
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
  const persistClientStatus = async (status: AccountStatus): Promise<boolean> => {
    if (!isSupabaseConfigured) return true;
    const result = await updateUserProfile(activeClient.id, { status });
    if (!result.success) {
      toast.error("Échec de la mise à jour du statut côté base de données.");
      return false;
    }
    return true;
  };

  const handleRevokeClient = () => {
    requestConfirmation(
      `Révoquer les accès de ${activeClient.name}`,
      `Cette action va révoquer la clé de licence MT5 et verrouiller l'accès.`,
      "Révoquer le Compte",
      "CRITICAL",
      async () => {
        if (!(await persistClientStatus("REVOKED"))) return;
        setClients((prev) => prev.map((c) => (c.id === activeClient.id ? { ...c, status: "REVOKED" } : c)));
        setEditStatus("REVOKED");
        addAuditLog("CLIENT_REVOKED", `Accès révoqués pour ${activeClient.name}.`, activeClient.email);
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
      async () => {
        if (!(await persistClientStatus("SUSPENDED"))) return;
        setClients((prev) => prev.map((c) => (c.id === activeClient.id ? { ...c, status: "SUSPENDED" } : c)));
        setEditStatus("SUSPENDED");
        addAuditLog("CLIENT_SUSPENDED", `Compte suspendu pour ${activeClient.name}.`, activeClient.email);
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
      async () => {
        if (!(await persistClientStatus("BANNED"))) return;
        setClients((prev) => prev.map((c) => (c.id === activeClient.id ? { ...c, status: "BANNED" } : c)));
        setEditStatus("BANNED");
        addAuditLog("CLIENT_BANNED", `Client banni : ${activeClient.name}.`, activeClient.email);
        toast.error(`Client ${activeClient.name} banni.`);
      }
    );
  };

  const handleReactivateClient = async () => {
    if (!(await persistClientStatus("ACTIVE"))) return;
    setClients((prev) => prev.map((c) => (c.id === activeClient.id ? { ...c, status: "ACTIVE" } : c)));
    setEditStatus("ACTIVE");
    addAuditLog("CLIENT_REACTIVATED", `Compte réactivé pour ${activeClient.name}.`, activeClient.email);
    toast.success(`Compte de ${activeClient.name} réactivé.`);
  };

  const handleDeleteClient = () => {
    requestConfirmation(
      `Supprimer définitivement le compte de ${activeClient.name}`,
      `Toutes les données de ${activeClient.name} seront supprimées.`,
      "Supprimer Définitivement",
      "CRITICAL",
      async () => {
        if (isSupabaseConfigured) {
          const result = await deleteProfile(activeClient.id);
          if (!result.success) {
            toast.error("Échec de la suppression côté base de données.");
            return;
          }
        }
        const clientName = activeClient.name;
        const clientEmail = activeClient.email;
        setClients((prev) => prev.filter((c) => c.id !== activeClient.id));
        addAuditLog("CLIENT_DELETED", `Compte supprimé : ${clientName}.`, clientEmail);
        toast.error(`Compte ${clientName} supprimé.`);
        setActiveSection("users");
      }
    );
  };

  const handleStartImpersonation = (client: UserProfile) => {
    setImpersonatedClientId(client.id);
    setActiveSection("impersonation");
    toast.success(`Supervision Live activée pour le compte de ${client.name}.`);
  };

  const handleExtendLicense = async (months: number) => {
    const newYear = 2026 + (months >= 12 ? 1 : 0);
    const newMonth = months === 1 ? "11" : months === 6 ? "04" : "10";
    const newExp = `${newYear}-${newMonth}-15`;

    if (isSupabaseConfigured) {
      const result = await updateUserProfile(activeClient.id, { license_expires: newExp });
      if (!result.success) {
        toast.error("Échec de l'enregistrement côté base de données.");
        return;
      }
    }

    setClients((prev) => prev.map((c) => (c.id === activeClient.id ? { ...c, licenseExpires: newExp } : c)));
    addAuditLog("LICENSE_EXTENDED", `Licence prolongée jusqu'au ${newExp} pour ${activeClient.name}.`, activeClient.email);
    toast.success(`Licence prolongée jusqu'au ${newExp}.`);
  };

  const handleGenerateNewLicenseKey = async () => {
    const newKey = `NX-PRO-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-DUAL`;

    if (isSupabaseConfigured) {
      const result = await updateUserProfile(activeClient.id, { license_key: newKey });
      if (!result.success) {
        toast.error("Échec de l'enregistrement côté base de données.");
        return;
      }
    }

    setClients((prev) => prev.map((c) => (c.id === activeClient.id ? { ...c, licenseKey: newKey } : c)));
    addAuditLog("LICENSE_KEY_GENERATED", `Nouvelle clé de licence générée pour ${activeClient.name}.`, activeClient.email);
    toast.success(`Nouvelle clé de licence générée : ${newKey}`);
  };

  const handleKillAllClientSessions = () => {
    requestConfirmation(
      `Déconnecter toutes les sessions de ${activeClient.name}`,
      `Cette action va invalider tous les jetons d'accès du client.`,
      "Forcer la Déconnexion",
      "WARNING",
      async () => {
        if (isSupabaseConfigured) {
          const result = await killUserSessions(activeClient.id);
          if (!result.success) {
            toast.error(result.error || "Échec de la déconnexion forcée.");
            return;
          }
        }
        setClients((prev) => prev.map((c) => (c.id === activeClient.id ? { ...c, sessions: [] } : c)));
        addAuditLog("SESSIONS_KILLED", `Toutes les sessions déconnectées pour ${activeClient.name}.`, activeClient.email);
        toast.error(`Toutes les sessions de ${activeClient.name} ont été fermées.`);
      }
    );
  };

  const handleAddCrmNote = async () => {
    if (!newCrmNoteText.trim() || !activeClient) return;
    const authorName = `${sessionUser.name} (${currentSessionRole})`;
    const text = newCrmNoteText.trim();

    if (isSupabaseConfigured) {
      const result = await addCrmNote(activeClient.id, authorName, text);
      if (!result.success) {
        toast.error("Échec de l'enregistrement de la note côté base de données.");
        return;
      }
    }

    const newNote: CrmNote = {
      id: `note-${Date.now()}`,
      author: authorName,
      date: new Date().toISOString().split("T")[0],
      text,
    };
    setClients((prev) => prev.map((c) => (c.id === activeClient.id ? { ...c, crmNotes: [newNote, ...c.crmNotes] } : c)));
    toast.success("Note confidentielle enregistrée.");
    setNewCrmNoteText("");
  };

  const handleGlobalKillSwitch = () => {
    if (!hasPermission("can_use_kill_switch")) {
      toast.error("Privilège insuffisant : votre rôle n'a pas accès au Kill Switch.");
      return;
    }
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
              aiGold: { ...(c.engines?.aiGold || {}), active: false },
              fxTrend: { ...(c.engines?.fxTrend || {}), active: false },
              indexReversion: { ...(c.engines?.indexReversion || {}), active: false },
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

  // ── Module E-mails : chargement et interactions synchronisés avec Supabase & Resend ─────────
  const emailConfigured = isEmailApiConfigured();

  const refreshEmailCounts = useCallback(async () => {
    if (isSupabaseConfigured) {
      try {
        const all = await getAdminEmailConversations();
        const nonArchived = all.filter((c) => c.status !== "ARCHIVED");
        setEmailCounts({
          inbox: nonArchived.length,
          mine: nonArchived.filter((c) => c.assignedUserId === currentEmailAgentId).length,
          unassigned: nonArchived.filter((c) => !c.assignedUserId).length,
          inProgress: nonArchived.filter((c) => c.status === "EN_COURS").length,
          waiting: nonArchived.filter((c) => c.status === "EN_ATTENTE").length,
          resolved: nonArchived.filter((c) => c.status === "RESOLU").length,
          archived: all.filter((c) => c.status === "ARCHIVED").length,
        });
        return;
      } catch {
        // Fallback
      }
    }

    if (!emailConfigured) {
      setEmailCounts({ inbox: 0, mine: 0, unassigned: 0, inProgress: 0, waiting: 0, resolved: 0, archived: 0 });
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
    setEmailListLoading(true);
    try {
      if (isSupabaseConfigured) {
        let items = await getAdminEmailConversations();

        // Filtre par catégorie
        if (emailFilter === "archived") {
          items = items.filter((c) => c.status === "ARCHIVED");
        } else {
          // Les fils archivés ne remontent jamais dans les autres onglets.
          items = items.filter((c) => c.status !== "ARCHIVED");
          if (emailFilter === "unassigned") {
            items = items.filter((c) => !c.assignedUserId);
          } else if (emailFilter === "mine") {
            items = items.filter((c) => c.assignedUserId === currentEmailAgentId);
          } else if (emailFilter === "in_progress") {
            items = items.filter((c) => c.status === "EN_COURS");
          } else if (emailFilter === "waiting") {
            items = items.filter((c) => c.status === "EN_ATTENTE");
          } else if (emailFilter === "resolved") {
            items = items.filter((c) => c.status === "RESOLU");
          }
        }

        // Filtre par recherche textuelle
        if (emailSearch.trim()) {
          const q = emailSearch.toLowerCase();
          items = items.filter(
            (c) =>
              c.subject.toLowerCase().includes(q) ||
              c.customerEmail.toLowerCase().includes(q) ||
              (c.customerName && c.customerName.toLowerCase().includes(q)) ||
              c.lastMessagePreview.toLowerCase().includes(q)
          );
        }

        setEmailConversationsList(items);
        setEmailApiError(null);
        return;
      }

      if (!emailConfigured) {
        setEmailConversationsList([]);
        return;
      }

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
      setEmailDetailLoading(true);
      try {
        if (isSupabaseConfigured) {
          const detail = await getAdminEmailConversationDetail(conversationId);
          if (detail) {
            setEmailConversationDetail(detail);
            return;
          }
        }

        if (!emailConfigured) {
          setEmailConversationDetail(null);
          return;
        }

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
    const unsub = subscribeToAdminEmails(() => {
      refreshEmailCounts();
      refreshEmailList();
      if (selectedEmailConversationId) refreshEmailDetail(selectedEmailConversationId);
    });
    return unsub;
  }, [refreshEmailCounts, refreshEmailList, refreshEmailDetail, selectedEmailConversationId]);

  useEffect(() => {
    if (activeSection !== "emails") return;
    refreshEmailList();
  }, [activeSection, emailFilter, emailSearch, refreshEmailList]);

  useEffect(() => {
    if (selectedEmailConversationId) {
      refreshEmailDetail(selectedEmailConversationId);
    } else {
      setEmailConversationDetail(null);
    }
  }, [selectedEmailConversationId, refreshEmailDetail]);

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
    if (isSupabaseConfigured) {
      const staffMember = staffList.find((s) => s.id === targetUserId);
      await supabase
        .from("email_conversations")
        .update({
          assigned_agent_id: targetUserId,
          assigned_agent_name: staffMember?.name || "Conseiller",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedEmailConversationId);
      toast.success("Conversation assignée.");
      refreshEmailDetail(selectedEmailConversationId);
      refreshEmailList();
      refreshEmailCounts();
      return;
    }
    if (!emailConfigured) {
      toast.error("Service e-mail non configuré.");
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
    if (isSupabaseConfigured) {
      await adminUpdateEmailStatus(selectedEmailConversationId, status);
      toast.success(`Statut mis à jour : ${status}`);
      refreshEmailDetail(selectedEmailConversationId);
      refreshEmailList();
      refreshEmailCounts();
      return;
    }
    if (!emailConfigured) {
      toast.error("Service e-mail non configuré.");
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

  // Archivage : distinct de handleSetEmailStatus car "ARCHIVED" (Supabase) et
  // "ARCHIVE" (micro-service email-service) ne partagent pas le même référentiel
  // de statuts que les valeurs FR de EmailConversationFilter (EN_COURS, etc.).
  const handleArchiveEmailConversation = async (conversationId: string) => {
    if (isSupabaseConfigured) {
      await adminUpdateEmailStatus(conversationId, "ARCHIVED");
    } else if (emailConfigured) {
      try {
        await emailApi.setStatus(currentEmailAgentId, conversationId, "ARCHIVE");
      } catch {
        toast.error("Impossible d'archiver cette conversation.");
        return;
      }
    }
    toast.success("Conversation archivée.");
    if (selectedEmailConversationId === conversationId) refreshEmailDetail(conversationId);
    refreshEmailList();
    refreshEmailCounts();
  };

  const handleUnarchiveEmailConversation = async (conversationId: string) => {
    if (isSupabaseConfigured) {
      await adminUpdateEmailStatus(conversationId, "RESOLVED");
    } else if (emailConfigured) {
      try {
        await emailApi.setStatus(currentEmailAgentId, conversationId, "RESOLU");
      } catch {
        toast.error("Impossible de restaurer cette conversation.");
        return;
      }
    }
    toast.success("Conversation restaurée.");
    if (selectedEmailConversationId === conversationId) refreshEmailDetail(conversationId);
    refreshEmailList();
    refreshEmailCounts();
  };

  const handleUploadEmailAttachment = async (file: File) => {
    if (!selectedEmailConversationId) return;
    setEmailUploadingAttachment(true);
    try {
      if (!emailConfigured) {
        toast.error("Service e-mail non configuré.");
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
      toast.error("Service e-mail non configuré.");
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
      const targetEmail = emailConversationDetail?.conversation.customerEmail || "client@nexiummarkets.com";
      const subject = `Re: ${emailConversationDetail?.conversation.subject || "Votre demande Nexium Markets"}`;

      if (isSupabaseConfigured) {
        await adminReplyEmail({
          conversationId: selectedEmailConversationId,
          toAddress: targetEmail,
          subject,
          bodyText: emailReplyText.trim(),
          agentName: currentDeskSignature,
        });

        // Envoi optionnel via Resend si clé renseignée
        if (isResendConfigured) {
          await sendCustomDeskEmail(
            targetEmail,
            subject,
            emailReplyText.trim(),
            currentDeskSignature
          ).catch((e) => console.warn("Notice Resend sendCustomDeskEmail:", e));
        }
      } else if (emailConfigured) {
        await emailApi.reply(
          currentEmailAgentId,
          selectedEmailConversationId,
          emailReplyText.trim(),
          emailPendingAttachments.map((a) => a.id)
        );
      }

      addAuditLog("EMAIL_REPLY_SENT", `Réponse e-mail transmise pour le dossier #${selectedEmailConversationId}.`);
      toast.success("E-mail envoyé avec succès au destinataire !");
      setEmailReplyText("");
      setEmailPendingAttachments([]);
      refreshEmailDetail(selectedEmailConversationId);
      refreshEmailList();
      refreshEmailCounts();
    } catch (err) {
      toast.error(err instanceof EmailApiError ? `Échec de l'envoi : ${err.message}` : "Échec de l'envoi de l'e-mail.");
    } finally {
      setEmailSending(false);
    }
  };

  const handleComposeNewEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeEmailTo.trim() || !composeEmailSubject.trim() || !composeEmailText.trim()) {
      toast.error("Destinataire, sujet et message sont requis.");
      return;
    }
    setComposeEmailSending(true);
    try {
      if (isSupabaseConfigured) {
        const convId = `thread-${Date.now().toString().slice(-6)}`;
        await supabase.from("email_conversations").insert([
          {
            id: convId,
            subject: composeEmailSubject.trim(),
            status: "EN_COURS",
            customer_email: composeEmailTo.trim().toLowerCase(),
            customer_name: composeEmailTo.split("@")[0],
            preview: composeEmailText.trim().slice(0, 100),
            unread: false,
          },
        ]);
        await supabase.from("email_messages").insert([
          {
            conversation_id: convId,
            from_address: "support@nexiummarkets.com",
            to_address: composeEmailTo.trim().toLowerCase(),
            subject: composeEmailSubject.trim(),
            body_text: composeEmailText.trim(),
            direction: "OUTBOUND",
          },
        ]);

        if (isResendConfigured) {
          await sendCustomDeskEmail(
            composeEmailTo.trim(),
            composeEmailSubject.trim(),
            composeEmailText.trim(),
            currentDeskSignature
          ).catch((e) => console.warn("Notice Resend sendCustomDeskEmail:", e));
        }
      } else if (emailConfigured) {
        await emailApi.createConversation(
          currentEmailAgentId,
          composeEmailTo.trim(),
          composeEmailSubject.trim(),
          composeEmailText.trim()
        );
      }

      addAuditLog("EMAIL_COMPOSED", `Nouvel e-mail envoyé à ${composeEmailTo.trim()} : ${composeEmailSubject.trim()}.`);
      toast.success(`E-mail envoyé à ${composeEmailTo.trim()}.`);
      setShowComposeEmailModal(false);
      setComposeEmailTo("");
      setComposeEmailSubject("");
      setComposeEmailText("");
      refreshEmailList();
      refreshEmailCounts();
    } catch (err) {
      toast.error(err instanceof EmailApiError ? `Échec de l'envoi : ${err.message}` : "Échec de l'envoi de l'e-mail.");
    } finally {
      setComposeEmailSending(false);
    }
  };

  const handleAddEmailNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmailConversationId || !emailNoteText.trim()) return;
    setEmailSending(true);
    try {
      if (isSupabaseConfigured) {
        await adminAddEmailNote({
          conversationId: selectedEmailConversationId,
          authorName: currentDeskSignature,
          content: emailNoteText.trim(),
        });
        toast.success("Note interne ajoutée.");
        setEmailNoteText("");
        refreshEmailDetail(selectedEmailConversationId);
        return;
      }
      if (!emailConfigured) {
        toast.error("Service e-mail non configuré.");
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
    if (isSupabaseConfigured) {
      await refreshEmailList();
      await refreshEmailCounts();
      toast.success("Actualisation des e-mails terminée.");
      return;
    }
    if (!emailConfigured) {
      toast.error("Service e-mail non configuré.");
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

  // Historique global de toutes les transactions (tous clients confondus),
  // pour la section Finances & Trésorerie — filtrable par statut/type/méthode.
  const financeTransactionMethods = useMemo(() => {
    const set = new Set<string>();
    allTransactions.forEach((t) => t.method && set.add(t.method));
    return Array.from(set).sort();
  }, [allTransactions]);

  const financeTransactionRows = useMemo(() => {
    const q = financeTxSearch.trim().toLowerCase();
    return allTransactions
      .map((t) => {
        const client = clients.find((c) => c.id === t.user_id);
        return { tx: t, clientName: client?.name || "Client inconnu", clientEmail: client?.email || "-" };
      })
      .filter(({ tx, clientName, clientEmail }) => {
        if (financeTxTypeFilter !== "ALL" && tx.type !== financeTxTypeFilter) return false;
        if (financeTxStatusFilter !== "ALL" && tx.status !== financeTxStatusFilter) return false;
        if (financeTxMethodFilter !== "ALL" && tx.method !== financeTxMethodFilter) return false;
        if (q && !clientName.toLowerCase().includes(q) && !clientEmail.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => (b.tx.created_at || "").localeCompare(a.tx.created_at || ""));
  }, [allTransactions, clients, financeTxSearch, financeTxTypeFilter, financeTxStatusFilter, financeTxMethodFilter]);

  const TX_TYPE_LABELS: Record<string, string> = {
    DEPOSIT: "Dépôt",
    WITHDRAWAL: "Retrait",
    PERF_FEE: "Frais de Performance",
    TRADE_PROFIT: "Profit Trading",
    BONUS: "Bonus",
    DEBIT: "Débit",
    PROFIT_SHARE: "Partage de Profit",
    PNL_ADJUST: "Ajustement P&L",
  };
  const TX_STATUS_LABELS: Record<string, string> = {
    COMPLETED: "Complété",
    PENDING: "En attente",
    CANCELLED: "Annulé",
    REJECTED: "Rejeté",
  };

  const handleExportFinanceTransactions = () => {
    const rows: (string | number)[][] = [
      ["Date", "Client", "E-mail", "Type", "Montant (USD)", "Devise", "Méthode", "Statut"],
      ...financeTransactionRows.map(({ tx, clientName, clientEmail }) => [
        tx.created_at || "",
        clientName,
        clientEmail,
        TX_TYPE_LABELS[tx.type] || tx.type,
        tx.amount,
        tx.currency || "USD",
        tx.method || "-",
        TX_STATUS_LABELS[tx.status] || tx.status,
      ]),
    ];
    downloadCsv(`nexium-transactions-${financeTransactionRows.length}.csv`, rows);
    toast.success(`Export CSV généré (${financeTransactionRows.length} transactions).`);
  };

  // Supervision Live : remplace intégralement l'interface admin par le vrai
  // dashboard du client ciblé (mêmes composants, mêmes actions), pour que
  // l'admin puisse voir et agir exactement comme lui depuis son propre espace.
  if (impersonatedClient && activeSection === "impersonation") {
    return (
      <>
        <div className="sticky top-0 z-50 border-b border-amber-500/40 bg-[#1a1206]/95 backdrop-blur-xl text-amber-300 px-6 py-2.5 flex flex-wrap items-center justify-between shadow-[0_0_24px_rgba(245,158,11,0.15)] font-semibold text-sm">
          <div className="flex items-center gap-2.5">
            <span className="size-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="font-bold uppercase tracking-wide">
              SUPERVISION LIVE : {impersonatedClient.name} (MT5 #{impersonatedClient.mt5?.login || "—"})
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

        <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="size-10 animate-spin rounded-full border-2 border-white/10 border-t-[#00D084]" /></div>}>
          <NexiumDashboard
            adminImpersonateUserId={impersonatedClient.id}
            onExitImpersonation={() => {
              setImpersonatedClientId(null);
              setActiveSection("users");
              toast.info("Supervision terminée. Retour à l'administration.");
            }}
          />
        </Suspense>
      </>
    );
  }

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
          {/* Pseudo Desk (Signature) — éditable par son propriétaire, toujours,
              quel que soit son rôle. C'est ce nom qui apparaît au client/visiteur
              dans le chat et les e-mails, jamais le rôle réel du collaborateur. */}
          <div className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-[#121a2d] px-3 py-2">
            {editingMyPseudo ? (
              <>
                <input
                  type="text"
                  value={myPseudoDraft}
                  onChange={(e) => setMyPseudoDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveMyPseudo();
                    if (e.key === "Escape") setEditingMyPseudo(false);
                  }}
                  placeholder="Pseudo affiché au client"
                  className="w-40 bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveMyPseudo}
                  disabled={savingMyPseudo}
                  title="Enregistrer le pseudo"
                  className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingMyPseudo(false)}
                  title="Annuler"
                  className="text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleOpenMyPseudoEditor}
                className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-emerald-300 transition cursor-pointer"
                title="Modifier votre pseudo — c'est ce nom qui est montré au client/visiteur dans le chat, jamais votre rôle réel"
              >
                <PenLine className="size-3" />
                <span className="max-w-[150px] truncate">{currentDeskSignature}</span>
              </button>
            )}
          </div>

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
                <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">{sessionUser.name.split(" ")[0]}</span>
                <span className="size-1.5 rounded-full bg-emerald-400"></span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 block">
                {isPrimaryOwner ? "Super Owner" : roleLabel(currentSessionRole)}
              </span>
            </div>
            <ShieldCheck className="size-4 text-slate-400 group-hover:text-emerald-400 transition-colors ml-1" />
          </button>

          {/* Déconnexion */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-[#121a2d] hover:bg-rose-500/10 hover:border-rose-500/40 px-3.5 py-2 text-sm font-semibold text-slate-300 hover:text-rose-300 transition cursor-pointer shadow-sm"
            title="Se déconnecter"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>

          {/* Lien direct vers le portail client */}
          <Link
            to="/portal"
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
                isActive: activeSection === "users" || activeSection === "user-detail" || activeSection === "create-user",
              },
              {
                key: "administrators",
                label: "Administration",
                icon: ShieldCheck,
                isActive: activeSection === "administrators",
              },
              {
                key: "messaging",
                label: "Chat",
                icon: MessageSquare,
                isActive: activeSection === "messaging",
              },
              {
                key: "emails",
                label: "E-mails",
                icon: Inbox,
                isActive: activeSection === "emails",
              },
              { key: "gateways", label: "Passerelles MT5 & VPS", icon: Radio, isActive: activeSection === "gateways" },
              {
                key: "security",
                label: "Sécurité & Accès VPN",
                icon: Lock,
                isActive: activeSection === "security",
              },
              { key: "news-guard", label: "News Guard Macro", icon: Newspaper, isActive: activeSection === "news-guard" },
              { key: "perf-fees", label: "Performance Fees", icon: Receipt, isActive: activeSection === "perf-fees" },
              { key: "engines", label: "Moteurs & Auto-Trader", icon: Bot, isActive: activeSection === "engines" },
              ...(hasPermission("can_view_treasury")
                ? [
                    {
                      key: "finances",
                      label: "Finances & Dépôts",
                      icon: Wallet,
                      isActive: activeSection === "finances",
                    } as const,
                  ]
                : []),
              ...(canManageAccessLevels
                ? [
                    {
                      key: "access-levels",
                      label: "Niveaux d'Accès",
                      icon: Key,
                      isActive: activeSection === "access-levels",
                    } as const,
                  ]
                : []),
              { key: "logs", label: "Journal d'Audit", icon: Terminal, isActive: activeSection === "logs" },
              { key: "analytics", label: "Visiteurs", icon: Eye, isActive: activeSection === "analytics" },
            ].filter((item) => isPrimaryOwner || !(rolePermissions[currentSessionRole]?.hidden_pages || []).includes(item.key))}
            onSelect={(key) => setActiveSection(key as typeof activeSection)}
          />

          {hasPermission("can_view_treasury") && (
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
          )}
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
                    {isSuperAdmin ? `$${totalBalance.toLocaleString("fr-FR")} USD` : "••••••"}
                  </p>
                  <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                    <span>Bonus accordés :</span>
                    <strong className="text-emerald-300">
                      {isSuperAdmin ? `+$${totalBonus.toLocaleString("fr-FR")}` : "••••••"}
                    </strong>
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
                    {isSuperAdmin
                      ? `+$${clients.reduce((acc, c) => acc + c.totalNetPnl, 0).toLocaleString("fr-FR")} USD`
                      : "••••••"}
                  </p>
                  <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                    <span>Performance moyenne :</span>
                    <strong className="text-amber-400">
                      {isSuperAdmin ? "+14.8%" : "••••••"}
                    </strong>
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
                        <span className="text-xs text-emerald-400 font-mono block mt-0.5">MT5 #{c.mt5?.login || "—"} · {c.mt5?.broker || "—"}</span>
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
                            ? `🎯 PRESET : ${(c.requestedPresets && c.requestedPresets.length > 0 ? c.requestedPresets.join(", ") : "AI_GOLD")}`
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
                            value={c.assignedAdvisor || "Expert Trading"}
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
                        <strong className="text-sm font-bold text-white block font-mono">
                          {isSuperAdmin ? `$${c.balance.toLocaleString("fr-FR")} USD` : "••••••"}
                        </strong>
                        <span className={`text-xs font-semibold block font-mono ${c.todayPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {isSuperAdmin
                            ? `${c.todayPnl >= 0 ? "+" : ""}$${c.todayPnl.toLocaleString("fr-FR")} (Aujourd'hui)`
                            : "••••••"}
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: "pnl",
                    header: "GAIN NET GLOBAL",
                    render: (c: UserProfile) => (
                      <div>
                        <strong className="text-sm font-bold text-emerald-400 block font-mono">
                          {isSuperAdmin ? `+${c.totalNetPnl.toLocaleString("fr-FR")} USD` : "••••••"}
                        </strong>
                        <span className="text-xs text-slate-400 font-mono">
                          Win Rate: {isSuperAdmin ? `${c.winRatePercent}%` : "••••••"}
                        </span>
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
                                onClick={() => handleApproveClientPreset(c, c.requestedPresets || [])}
                                title={`Active ${c.requestedPresets && c.requestedPresets.length > 0 ? c.requestedPresets.join(", ") : "le preset demandé"} — pour n'en activer qu'une partie, utilisez la Fiche client`}
                                className="rounded-xl border border-cyan-400 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black py-1.5 px-3 transition cursor-pointer inline-flex items-center gap-1 shadow-md shadow-cyan-500/20"
                              >
                                <Zap className="size-3.5" />
                                <span>Valider Preset{c.requestedPresets && c.requestedPresets.length > 1 ? "s" : ""} &amp; Déverrouiller</span>
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
                  <h1 className="text-2xl font-bold text-white tracking-tight">Inviter un Nouveau Client</h1>
                  <p className="text-sm text-slate-400 mt-1">Un e-mail lui est envoyé pour choisir son mot de passe et se connecter immédiatement.</p>
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

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">TÉLÉPHONE</label>
                  <input
                    type="text"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full sm:w-1/2 rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/80"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="admin-btn-primary"
                  >
                    Envoyer l'Invitation
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
                      ID: {activeClient.id} · MT5 #{activeClient.mt5?.login || "—"} ({activeClient.mt5?.broker || "—"}) · Conseiller: <strong className="text-emerald-400">{activeClient.assignedAdvisor}</strong>
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

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 font-mono">
                  <div className="admin-card-indigo p-5 space-y-2.5">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-300 uppercase font-semibold">Solde du Compte</span>
                      <div className="grid size-8 place-items-center rounded-lg bg-indigo-500/15 text-indigo-300">
                        <Wallet className="size-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {isSuperAdmin ? `$${activeClient.balance.toLocaleString("fr-FR")} USD` : "••••••"}
                    </p>
                    <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                      <span>Équité (Solde + Bonus) :</span>
                      <strong className="text-white">{isSuperAdmin ? `$${activeClient.equity.toLocaleString("fr-FR")} USD` : "••••••"}</strong>
                    </div>
                  </div>

                  <div className="admin-card-amber p-5 space-y-2.5">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-300 uppercase font-semibold">Bonus Crédité</span>
                      <div className="grid size-8 place-items-center rounded-lg bg-amber-500/15 text-amber-300">
                        <Gift className="size-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-amber-300">
                      {isSuperAdmin ? `$${activeClient.bonusCredit.toLocaleString("fr-FR")} USD` : "••••••"}
                    </p>
                    <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                      <span>Statut :</span>
                      <strong className="text-white">{activeClient.bonusCredit > 0 ? "Bonus actif" : "Aucun bonus"}</strong>
                    </div>
                  </div>

                  <div className="admin-card-emerald p-5 space-y-2.5">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-300 uppercase font-semibold">Gains Bruts Cumulés</span>
                      <div className="grid size-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400">
                        <TrendingUp className="size-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-emerald-400">
                      {isSuperAdmin ? `+$${activeClient.grossProfitTotal.toLocaleString("fr-FR")} USD` : "••••••"}
                    </p>
                    <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                      <span>Trades Gagnants :</span>
                      <strong className="text-white">{activeClient.winningTradesCount} / {activeClient.tradesCount}</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Meilleur Trade :</span>
                      <strong className="text-emerald-400">{isSuperAdmin ? `+$${activeClient.bestTradePnl.toLocaleString("fr-FR")} USD` : "••••••"}</strong>
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
                      {isSuperAdmin ? `-$${activeClient.grossLossTotal.toLocaleString("fr-FR")} USD` : "••••••"}
                    </p>
                    <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                      <span>Trades Perdants :</span>
                      <strong className="text-white">{activeClient.losingTradesCount} / {activeClient.tradesCount}</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Pire Trade :</span>
                      <strong className="text-rose-400">{isSuperAdmin ? `$${activeClient.worstTradePnl.toLocaleString("fr-FR")} USD` : "••••••"}</strong>
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
                      {isSuperAdmin ? `${activeClient.todayPnl >= 0 ? "+" : ""}$${activeClient.todayPnl.toLocaleString("fr-FR")} USD` : "••••••"}
                    </p>
                    <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                      <span>Gains Jour :</span>
                      <strong className="text-emerald-400">{isSuperAdmin ? `+$${activeClient.todayGrossGain.toLocaleString("fr-FR")}` : "••••••"}</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Pertes Jour :</span>
                      <strong className="text-rose-400">{isSuperAdmin ? `$${activeClient.todayGrossLoss.toLocaleString("fr-FR")}` : "••••••"}</strong>
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
                      {isSuperAdmin ? activeClient.profitFactor : "••••"} <span className="text-xs font-normal text-slate-400 font-mono">Factor</span>
                    </p>
                    <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                      <span>Taux de Réussite :</span>
                      <strong className="text-white">{isSuperAdmin ? `${activeClient.winRatePercent}%` : "••••••"}</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Max Drawdown :</span>
                      <strong className="text-amber-400">{isSuperAdmin ? `${activeClient.maxDrawdownPercent}%` : "••••••"}</strong>
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
                          <td className="px-4 py-3.5 font-bold text-amber-300 font-mono">{isSuperAdmin ? `$${w.amount.toLocaleString("fr-FR")} USD` : "••••••"}</td>
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
                              isSuperAdmin ? (
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
                                <span className="text-xs text-slate-400 font-mono">Validation Direction</span>
                              )
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
                    <strong className="text-xl sm:text-2xl font-bold text-emerald-400">{isSuperAdmin ? `$${activeClient.balance.toLocaleString("fr-FR")} USD` : "••••••"}</strong>
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
                          <td className="px-4 py-3.5 font-bold text-emerald-400 font-mono">{isSuperAdmin ? `+$${d.amount.toLocaleString("fr-FR")} USD` : "••••••"}</td>
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
                              isSuperAdmin ? (
                                <button
                                  onClick={() => handleApproveDeposit(d)}
                                  className="admin-btn-primary text-xs sm:text-sm py-1.5 px-3.5 font-bold"
                                >
                                  Valider &amp; Créditer ✓
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 font-mono">Validation Direction</span>
                              )
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
              {isSuperAdmin ? (
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
              ) : (
                <section className="p-6 rounded-2xl border border-slate-700/50 bg-[#0c121e] text-center space-y-2">
                  <div className="size-10 rounded-xl bg-amber-500/10 text-amber-400 grid place-items-center mx-auto">
                    <Lock className="size-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Opérations Financières Restreintes
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Les opérations de crédit/débit et les ajustements de P&amp;L sont réservés exclusivement à la Direction (SUPER_ADMIN et OWNER).
                  </p>
                </section>
              )}

              {/* ── 9. JOURNAL DES TRADES EN TEMPS RÉEL ── */}
              <section className="admin-card-emerald p-6 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-700/50 pb-4">
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                    <History className="size-5 text-emerald-400" />
                    Journal des Trades en Direct &amp; Fixation P&amp;L du Jour
                  </h2>

                  {isSuperAdmin && (
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
                  )}
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
          {/* 🌟 NIVEAUX D'ACCÈS PAR RÔLE (`access-levels`)                         */}
          {/* ===================================================================== */}
          {activeSection === "access-levels" && canManageAccessLevels && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-slate-700/50 pb-5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                  <Key className="size-7 text-emerald-400" />
                  <span>Niveaux d'Accès</span>
                </h1>
                <p className="mt-2 text-sm text-slate-300 max-w-2xl">
                  Définissez une fois pour toutes ce qu'un rôle peut faire. Choisissez un rôle, cochez ses
                  permissions, enregistrez — tous les collaborateurs actuels et futurs de ce rôle héritent
                  automatiquement de ce jeu de permissions, sans exception individuelle.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                {/* Sélecteur de rôle */}
                <div className="space-y-2">
                  {ALL_STAFF_ROLES.map((role) => {
                    const count = staffList.filter((s) => s.role === role).length;
                    return (
                      <button
                        key={role}
                        onClick={() => setAccessLevelsSelectedRole(role)}
                        className={`w-full text-left px-4 py-3.5 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                          accessLevelsSelectedRole === role
                            ? "border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                            : "border-slate-700/60 bg-[#0c121e] hover:border-slate-600"
                        }`}
                      >
                        <span className={`text-sm font-bold ${accessLevelsSelectedRole === role ? "text-emerald-300" : "text-white"}`}>
                          {roleLabel(role)}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {count} {count > 1 ? "personnes" : "personne"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Matrice de permissions du rôle sélectionné */}
                <div className="admin-card-emerald p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-700/50 pb-4">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white uppercase font-mono tracking-wider">
                        Permissions : {roleLabel(accessLevelsSelectedRole)}
                      </h2>
                      <p className="text-xs text-slate-300 mt-1">
                        S'applique instantanément à {staffList.filter((s) => s.role === accessLevelsSelectedRole).length} collaborateur(s) de ce rôle.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={savingRolePerms || !draftRolePerms}
                      onClick={handleSaveRolePermissions}
                      className="admin-btn-primary text-xs sm:text-sm py-2.5 px-5 font-bold disabled:opacity-50"
                    >
                      {savingRolePerms ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  </div>

                  {draftRolePerms && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {(
                        [
                          ["can_chat_with_clients", "Chat Direct Traders", "Répondre aux messages en direct"],
                          ["can_send_emails", "E-mails Desk Officiels", "Envoyer des e-mails officiels"],
                          ["can_take_phone_calls", "Appels Téléphoniques", "Passer des appels directs desk"],
                          ["can_approve_finances", "Validation Retraits & Dépôts", "Créditer les comptes et valider"],
                          ["can_manage_engines", "Paramétrage Moteurs MT5", "Piloter robots & lots max"],
                          ["can_adjust_pnl", "Ajustements P&L Desk", "Corriger gains & pertes journaliers"],
                          ["can_manage_staff", "Gestion & Gouvernance Staff", "Créer et administrer les comptes"],
                          ["can_view_treasury", "Accès Trésorerie & Bilan", "Consulter soldes & marges broker"],
                          ["can_use_kill_switch", "Kill Switch d'Urgence Total", "Pouvoir d'arrêt global immédiat"],
                        ] as [Exclude<keyof Omit<RolePermissions, "role">, "hidden_pages">, string, string][]
                      ).map(([key, label, desc]) => (
                        <div
                          key={key}
                          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition ${
                            key === "can_use_kill_switch"
                              ? "border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50"
                              : "border-slate-700/60 bg-[#0c121e] hover:border-emerald-500/40"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <strong className={`text-xs sm:text-sm font-bold block ${key === "can_use_kill_switch" ? "text-rose-400" : "text-white"}`}>
                              {label}
                            </strong>
                            <span className="text-[11px] text-slate-400 block">{desc}</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={draftRolePerms[key]}
                              onChange={(e) => setDraftRolePerms((prev) => (prev ? { ...prev, [key]: e.target.checked } : prev))}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Pages visibles dans le menu pour ce rôle */}
              <div className="admin-card p-6 sm:p-8 space-y-5">
                <div className="border-b border-slate-700/50 pb-4">
                  <h2 className="text-base sm:text-lg font-bold text-white uppercase font-mono tracking-wider">
                    Pages Visibles : {roleLabel(accessLevelsSelectedRole)}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Décochez une page pour qu'elle disparaisse entièrement du menu de ce rôle — les collaborateurs
                    concernés n'y auront plus du tout accès.
                  </p>
                </div>

                {draftRolePerms && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {MANAGEABLE_PAGES.map(({ key, label }) => {
                      const isVisible = !draftRolePerms.hidden_pages.includes(key);
                      return (
                        <div
                          key={key}
                          className="p-3.5 rounded-2xl border border-slate-700/60 bg-[#0c121e] hover:border-emerald-500/40 flex items-center justify-between gap-3 transition"
                        >
                          <strong className={`text-xs sm:text-sm font-bold ${isVisible ? "text-white" : "text-slate-500"}`}>
                            {label}
                          </strong>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={isVisible}
                              onChange={(e) =>
                                setDraftRolePerms((prev) => {
                                  if (!prev) return prev;
                                  const nextHidden = e.target.checked
                                    ? prev.hidden_pages.filter((k) => k !== key)
                                    : [...prev.hidden_pages, key];
                                  return { ...prev, hidden_pages: nextHidden };
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                        {currentSessionRole === "OWNER" ? "👑 OWNER (Maître)" : roleLabel(currentSessionRole)}
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
                        Inviter un Nouveau Membre du Staff
                      </h2>
                      <span className="text-xs font-mono font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
                        Attribution Sécurisée
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-400">
                      Un e-mail lui est envoyé immédiatement pour choisir son mot de passe — il/elle est actif dès qu'il l'a fait.
                    </p>

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

                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">NIVEAU D'ACCÈS</label>
                        <AdminDropdown
                          value={newStaffRole}
                          onChange={(r) => setNewStaffRole(r)}
                          options={STAFF_ROLE_OPTIONS}
                        />
                      </div>

                      <button
                        type="submit"
                        className="admin-btn-primary py-3 text-sm font-bold"
                      >
                        Envoyer l'Invitation
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
                                {st.role === "OWNER" ? "👑 OWNER" : roleLabel(st.role)}
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
                              {rolePermissions[st.role]?.can_chat_with_clients && <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/50 text-slate-300 text-[11px]">Chat</span>}
                              {rolePermissions[st.role]?.can_approve_finances && <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">Finances</span>}
                              {rolePermissions[st.role]?.can_manage_engines && <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold">Robots</span>}
                              {rolePermissions[st.role]?.can_adjust_pnl && <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">P&amp;L</span>}
                              {rolePermissions[st.role]?.can_manage_staff && <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-semibold">Staff</span>}
                              {rolePermissions[st.role]?.can_use_kill_switch && <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-semibold">Kill Switch</span>}
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
                            {editingStaffMember.role === "OWNER" ? "👑 OWNER (Propriétaire)" : roleLabel(editingStaffMember.role)}
                          </AdminBadge>
                          <AdminBadge variant={editStaffStatus === "ACTIVE" ? "emerald" : "amber"}>
                            {editStaffStatus}
                          </AdminBadge>
                          {editingStaffMember.isPrimaryOwner && (
                            <AdminBadge variant="amber" dot={true}>
                              🔒 Super Owner protégé
                            </AdminBadge>
                          )}
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
                                disabled={
                                  editingStaffMember.isPrimaryOwner ||
                                  (editingStaffMember.role === "OWNER" && currentSessionRole !== "OWNER")
                                }
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

                    {/* Section 3 : Permissions du rôle (lecture seule — gérées par rôle) */}
                    <div className="admin-card-emerald p-6 sm:p-8 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-700/50 pb-4">
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2.5">
                            <Sliders className="size-5 text-emerald-400" />
                            <span>3. Permissions du rôle {editStaffRole}</span>
                          </h3>
                          <p className="text-xs text-slate-300 mt-1">
                            Les permissions sont désormais définies par rôle, pas par individu — tout collaborateur {editStaffRole} a exactement les mêmes.
                          </p>
                        </div>
                        {canManageAccessLevels && (
                          <button
                            type="button"
                            onClick={() => setActiveSection("access-levels")}
                            className="admin-btn-secondary text-xs whitespace-nowrap"
                          >
                            Modifier dans Niveaux d'Accès
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {[
                          ["can_chat_with_clients", "Chat"],
                          ["can_send_emails", "E-mails"],
                          ["can_take_phone_calls", "Téléphone"],
                          ["can_approve_finances", "Finances"],
                          ["can_manage_engines", "Robots"],
                          ["can_adjust_pnl", "P&L"],
                          ["can_manage_staff", "Staff"],
                          ["can_view_treasury", "Trésorerie"],
                          ["can_use_kill_switch", "Kill Switch"],
                        ].map(([key, label]) => {
                          const granted = Boolean(rolePermissions[editStaffRole]?.[key as keyof RolePermissions]);
                          return (
                            <span
                              key={key}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                                granted
                                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                  : "bg-slate-800/60 text-slate-500 border-slate-700/50 line-through"
                              }`}
                            >
                              {label}
                            </span>
                          );
                        })}
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
                          disabled={editingStaffMember.isPrimaryOwner}
                          onClick={() => handleResetStaff2FA(editingStaffMember)}
                          className="rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-500/10 px-4 py-2.5 text-xs sm:text-sm font-bold text-amber-300 transition cursor-pointer flex items-center gap-2 w-fit"
                        >
                          <Key className="size-4" />
                          <span>Réinitialiser 2FA Collaborateur</span>
                        </button>
                      </div>

                      {editingStaffMember.isPrimaryOwner ? (
                        <p className="text-xs text-amber-300/80 pt-2 flex items-center gap-2">
                          <ShieldCheck className="size-4 shrink-0" />
                          Compte Super Owner protégé : suspension, révocation et suppression indisponibles depuis cette interface, y compris pour vous-même.
                        </p>
                      ) : editingStaffMember.role !== "OWNER" ? (
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
                      ) : isPrimaryOwner ? (
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          <p className="text-xs text-amber-300/80 flex items-center gap-2">
                            <ShieldCheck className="size-4 shrink-0" />
                            Compte OWNER : seule la suppression définitive est autorisée, réservée au Super Owner.
                          </p>
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
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
                    <MessageCircle className="size-6 text-emerald-400" />
                    <span>Chat &amp; Desk Opérateur</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Routeur de chat, file d&apos;attente des prospects du site et assistance clients MT5.
                  </p>
                </div>

                {/* Sub-tab switcher */}
                <div className="flex items-center gap-1.5 bg-[#090d16] p-1.5 rounded-2xl border border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setMessagingTab("WEB_QUEUE")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      messagingTab === "WEB_QUEUE"
                        ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Flame className="size-3.5" />
                    <span>File d&apos;attente Web</span>
                    {queueCount > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        messagingTab === "WEB_QUEUE" ? "bg-black text-emerald-400" : "bg-amber-500 text-black animate-pulse"
                      }`}>
                        {queueCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMessagingTab("CLIENTS")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      messagingTab === "CLIENTS"
                        ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <User className="size-3.5" />
                    <span>Traders MT5 ({clients.length})</span>
                  </button>
                </div>
              </div>

              {/* ── CORPS PRINCIPAL : Selon l'onglet actif ── */}
              {messagingTab === "WEB_QUEUE" ? (
                /* ================= FILE D'ATTENTE PROSPECTS DU SITE ================= */
                <div className="grid gap-5 lg:grid-cols-12" style={{ height: "calc(100vh - 240px)", minHeight: "600px" }}>
                  {/* Colonne gauche : Liste des fils du routeur */}
                  <div className="lg:col-span-4 flex flex-col rounded-2xl border border-slate-700/50 bg-gradient-to-b from-[#0f172a]/95 to-[#0b1120]/98 overflow-hidden shadow-xl">
                    <div className="p-3.5 border-b border-slate-700/40 bg-[#0f1626]/80 flex items-center justify-between text-xs font-mono shrink-0">
                      <span className="text-slate-400 font-bold uppercase">Fils Entrants Chatbot</span>
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => setShowArchivedThreads((v) => !v)}
                          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold uppercase transition cursor-pointer ${
                            showArchivedThreads
                              ? "bg-slate-700 text-white"
                              : "bg-transparent text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          <Archive className="size-3" />
                          Archives ({webThreads.filter((t) => t.status === "ARCHIVED").length})
                        </button>
                        <span className="text-emerald-400 font-bold">
                          {webThreads.filter((t) => (showArchivedThreads ? t.status === "ARCHIVED" : t.status !== "ARCHIVED")).length} Total
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
                      {webThreads.filter((t) => (showArchivedThreads ? t.status === "ARCHIVED" : t.status !== "ARCHIVED")).length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">
                          {showArchivedThreads ? "Aucun fil archivé." : "Aucun prospect en attente actuellement."}
                        </div>
                      ) : (
                        webThreads
                          .filter((t) => (showArchivedThreads ? t.status === "ARCHIVED" : t.status !== "ARCHIVED"))
                          .map((th) => {
                          const isSelected = activeWebThread?.id === th.id;
                          const isQueue = th.status === "QUEUE";
                          const isActive = th.status === "ACTIVE";
                          const lastMsg = th.messages[th.messages.length - 1];

                          return (
                            <button
                              key={th.id}
                              onClick={() => setSelectedWebThreadId(th.id)}
                              className={`w-full text-left p-4 transition flex items-start gap-3.5 cursor-pointer ${
                                isSelected
                                  ? "bg-emerald-600/12 border-l-[3px] border-l-emerald-500"
                                  : "hover:bg-slate-800/40 border-l-[3px] border-l-transparent"
                              }`}
                            >
                              <div className="relative shrink-0">
                                <div className={`size-11 rounded-xl grid place-items-center font-bold text-base ${
                                  isQueue
                                    ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 animate-pulse"
                                    : isActive
                                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                                    : "bg-slate-700/60 border border-slate-600/50 text-slate-400"
                                }`}>
                                  {th.visitorName.charAt(0)}
                                </div>
                                <span className={`size-2.5 rounded-full ring-2 ring-[#0f1626] absolute -bottom-0.5 -right-0.5 ${
                                  isQueue ? "bg-amber-400 animate-ping" : isActive ? "bg-emerald-400" : "bg-slate-500"
                                }`} />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <strong className={`text-sm font-bold truncate ${isSelected ? "text-white" : "text-slate-100"}`}>
                                    {th.visitorName}
                                  </strong>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {lastMsg?.timestamp || "—"}
                                  </span>
                                </div>

                                <p className="text-xs text-slate-400 truncate mb-2">
                                  {lastMsg ? lastMsg.text : th.initialQuery}
                                </p>

                                <div className="flex items-center gap-2">
                                  {isQueue && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                                      ⏳ EN FILE D&apos;ATTENTE
                                    </span>
                                  )}
                                  {isActive && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                      🟢 Pris par {th.assignedAdvisor}
                                    </span>
                                  )}
                                  {th.status === "RESOLVED" && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                      ✓ Résolu
                                    </span>
                                  )}
                                  {th.status === "ARCHIVED" && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-500 border border-slate-700">
                                      📦 Archivé
                                    </span>
                                  )}
                                  <span className="text-[10px] uppercase font-mono text-slate-500 ml-auto">
                                    {th.language}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Colonne droite : Chat en direct avec le prospect */}
                  <div className="lg:col-span-8 flex flex-col rounded-2xl border border-slate-700/50 bg-gradient-to-b from-[#0f172a]/95 to-[#0b1120]/98 overflow-hidden shadow-xl">
                    {activeWebThread ? (
                      <>
                        {/* En-tête fil web */}
                        <div className="p-4 border-b border-slate-700/40 bg-[#0f1626]/80 flex flex-wrap justify-between items-center gap-3 shrink-0">
                          <div className="flex items-center gap-3.5">
                            <div className="size-11 rounded-xl bg-emerald-600/20 border border-emerald-500/30 grid place-items-center font-bold text-emerald-300 text-base shrink-0">
                              {activeWebThread.visitorName.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2.5 mb-0.5">
                                <h3 className="text-base font-bold text-white">{activeWebThread.visitorName}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  activeWebThread.status === "QUEUE"
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : activeWebThread.status === "ARCHIVED"
                                    ? "bg-slate-800 text-slate-400 border border-slate-700"
                                    : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                                }`}>
                                  {activeWebThread.status === "QUEUE"
                                    ? "⏳ EN ATTENTE DE CONSEILLER"
                                    : activeWebThread.status === "ARCHIVED"
                                    ? "📦 ARCHIVÉ"
                                    : "● SESSION EN DIRECT"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 font-mono">
                                Contact : <strong className="text-slate-200">{activeWebThread.contact}</strong> · Langue : {activeWebThread.language.toUpperCase()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {activeWebThread.status === "QUEUE" ? (
                              <button
                                onClick={() => handleClaimWebThread(activeWebThread.id)}
                                className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition cursor-pointer"
                              >
                                <UserCheck className="size-4" />
                                <span>Prendre en charge ce prospect ➔</span>
                              </button>
                            ) : (
                              activeWebThread.status === "ACTIVE" && (
                                <button
                                  onClick={() => handleResolveWebThread(activeWebThread.id)}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 transition cursor-pointer"
                                >
                                  Clôturer la session
                                </button>
                              )
                            )}
                            {activeWebThread.status === "ARCHIVED" ? (
                              <button
                                onClick={() => handleUnarchiveWebThread(activeWebThread.id)}
                                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 cursor-pointer transition"
                              >
                                <ArchiveRestore className="size-3.5" />
                                Restaurer
                              </button>
                            ) : (
                              activeWebThread.status === "RESOLVED" && (
                                <button
                                  onClick={() => handleArchiveWebThread(activeWebThread.id)}
                                  className="flex items-center gap-1.5 rounded-lg border border-slate-600/50 bg-[#0c121e] hover:bg-slate-700/40 px-3 py-1.5 text-xs font-semibold text-slate-300 cursor-pointer transition"
                                >
                                  <Archive className="size-3.5" />
                                  Archiver
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        {/* Fil de discussion */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                          {activeWebThread.messages.map((m) => {
                            if (m.sender === "SYSTEM") {
                              return (
                                <div key={m.id} className="text-center my-2">
                                  <span className="inline-block bg-slate-800/90 text-slate-400 text-xs font-mono px-3.5 py-1 rounded-full border border-slate-700">
                                    {m.text} · {m.timestamp}
                                  </span>
                                </div>
                              );
                            }

                            const isAdvisor = m.sender === "ADVISOR";
                            return (
                              <div key={m.id} className={`flex ${isAdvisor ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-3 space-y-1.5 ${
                                  isAdvisor
                                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-50 rounded-tr-none"
                                    : "bg-[#0c121e] text-slate-200 border border-slate-700/50 rounded-tl-none"
                                }`}>
                                  <div className={`flex justify-between gap-4 text-xs font-mono ${isAdvisor ? "opacity-70" : "text-slate-500"}`}>
                                    <span>{m.authorName}</span>
                                    <span>{m.timestamp}</span>
                                  </div>
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Modèles de réponse */}
                        <div className="px-4 py-2.5 border-t border-slate-800/60 bg-[#0c121e]/60 flex items-center gap-2 overflow-x-auto shrink-0">
                          <span className="text-xs font-semibold text-slate-500 uppercase font-mono shrink-0">Modèles :</span>
                          {CANNED_RESPONSES.map((cr, idx) => (
                            <button
                              key={idx}
                              onClick={() => setWebThreadReplyInput(cr.text)}
                              className="rounded-lg border border-slate-700/50 bg-[#131c30] hover:bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white shrink-0 cursor-pointer transition"
                            >
                              {cr.title}
                            </button>
                          ))}
                        </div>

                        {/* Zone de saisie */}
                        <form onSubmit={handleSendWebThreadMessage} className="p-4 border-t border-slate-700/40 bg-[#0f1626]/80 space-y-3 shrink-0">
                          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                            <span>Canal : <strong className="text-emerald-400">Routeur Chatbot Public</strong></span>
                            <span>Signé par : {currentSessionRole}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              placeholder={
                                activeWebThread.status === "QUEUE"
                                  ? "Prenez d'abord en charge ce fil pour répondre..."
                                  : "Écrire une réponse au visiteur du site..."
                              }
                              aria-label="Zone de saisie du message"
                              disabled={activeWebThread.status === "QUEUE"}
                              value={webThreadReplyInput}
                              onChange={(e) => setWebThreadReplyInput(e.target.value)}
                              className="flex-1 rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 disabled:opacity-50 transition"
                            />
                            <button
                              type="submit"
                              disabled={activeWebThread.status === "QUEUE" || !webThreadReplyInput.trim()}
                              className="admin-btn-primary py-3 px-5 text-sm font-bold shrink-0 flex items-center gap-2 disabled:opacity-40"
                            >
                              <Send className="size-4" />
                              <span>Envoyer au Visiteur</span>
                            </button>
                          </div>
                        </form>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-8 text-slate-500 text-center">
                        <MessageCircle className="size-12 mb-3 text-slate-700" />
                        <p className="text-base font-bold text-slate-400">Sélectionnez un fil de la file d&apos;attente</p>
                        <p className="text-xs text-slate-600 mt-1">Les prospects écrivant sur le site apparaîtront ici en temps réel.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ================= CONTACTS TRADERS MT5 ================= */
                <div className="grid gap-5 lg:grid-cols-12" style={{ height: "calc(100vh - 240px)", minHeight: "600px" }}>
                  {/* ── COLONNE GAUCHE : Contacts ── */}
                  <div className="lg:col-span-4 flex flex-col rounded-2xl border border-slate-700/50 bg-gradient-to-b from-[#0f172a]/95 to-[#0b1120]/98 overflow-hidden shadow-xl">
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
                                  <span className="text-emerald-400 font-semibold">MT5 #{c.mt5?.login || "—"}</span>
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

                  {/* ── COLONNE DROITE : Conversation Trader ── */}
                  <div className="lg:col-span-8 flex flex-col rounded-2xl border border-slate-700/50 bg-gradient-to-b from-[#0f172a]/95 to-[#0b1120]/98 overflow-hidden shadow-xl">
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
                        })
                      )}
                    </div>

                    <div className="px-4 py-2.5 border-t border-slate-800/60 bg-[#0c121e]/60 flex items-center gap-2 overflow-x-auto shrink-0">
                      <span className="text-xs font-semibold text-slate-500 uppercase font-mono shrink-0">Modèles :</span>
                      {CANNED_RESPONSES.map((cr, idx) => (
                        <button key={idx} onClick={() => handleInsertCannedResponse(cr)}
                          className="rounded-lg border border-slate-700/50 bg-[#131c30] hover:bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white shrink-0 cursor-pointer transition">
                          {cr.title}
                        </button>
                      ))}
                    </div>

                    <form onSubmit={handleSendDeskMessage} className="p-4 border-t border-slate-700/40 bg-[#0f1626]/80 space-y-3 shrink-0">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                        <span>Canal : <strong className="text-slate-300">Live Chat MT5</strong></span>
                        <span>Signé par : {currentSessionRole}</span>
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
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 E-MAILS (`emails`) — réplique exacte de Messagerie adaptée aux e-mails */}
          {/* ===================================================================== */}
          {activeSection === "emails" && (
            <div className="space-y-6 animate-in fade-in">

              {/* ── HEADER ── */}
              <div className="border-b border-slate-700/50 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
                    <Mail className="size-6 text-emerald-400" />
                    <span>E-mails Institutionnels</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Gestion des communications officielles et notifications transactionnelles des clients.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowComposeEmailModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer"
                  >
                    <PenLine className="size-4" />
                    <span>Nouveau Message</span>
                  </button>
                  <Link
                    to="/email-preview"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition shadow-sm"
                  >
                    <Sparkles className="size-4 text-emerald-400" />
                    <span>Studio Templates 680px</span>
                  </Link>
                </div>
              </div>

              {showComposeEmailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowComposeEmailModal(false)}>
                  <form
                    onSubmit={handleComposeNewEmail}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg rounded-2xl border border-slate-700/60 bg-[#0f172a] p-6 space-y-5 shadow-2xl"
                  >
                    <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
                      <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                        <PenLine className="size-5 text-emerald-400" />
                        Nouveau Message
                      </h2>
                      <button
                        type="button"
                        onClick={() => setShowComposeEmailModal(false)}
                        className="text-slate-400 hover:text-white transition cursor-pointer"
                        aria-label="Fermer"
                      >
                        ✕
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">DESTINATAIRE *</label>
                      <input
                        type="email"
                        required
                        value={composeEmailTo}
                        onChange={(e) => setComposeEmailTo(e.target.value)}
                        placeholder="nom@exemple.com"
                        className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/80"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">SUJET *</label>
                      <input
                        type="text"
                        required
                        value={composeEmailSubject}
                        onChange={(e) => setComposeEmailSubject(e.target.value)}
                        className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/80"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">MESSAGE *</label>
                      <textarea
                        required
                        rows={6}
                        value={composeEmailText}
                        onChange={(e) => setComposeEmailText(e.target.value)}
                        className="w-full rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/80 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowComposeEmailModal(false)}
                        className="px-4 py-2 rounded-xl border border-slate-700/60 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={composeEmailSending}
                        className="admin-btn-primary text-xs py-2.5 px-5 disabled:opacity-60"
                      >
                        {composeEmailSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                        <span>{composeEmailSending ? "Envoi…" : "Envoyer"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

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
                      {(emailConversationDetail?.conversation.status as string) === "ARCHIVED" || emailConversationDetail?.conversation.status === "ARCHIVE" ? (
                        <button
                          onClick={() => selectedEmailConversationId && handleUnarchiveEmailConversation(selectedEmailConversationId)}
                          className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 cursor-pointer transition"
                          title="Restaurer cette conversation"
                        >
                          <ArchiveRestore className="size-3.5" />
                          Restaurer
                        </button>
                      ) : (
                        <>
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
                          <button
                            onClick={() => selectedEmailConversationId && handleArchiveEmailConversation(selectedEmailConversationId)}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-600/50 bg-[#0c121e] hover:bg-slate-700/40 px-3 py-1.5 text-xs font-semibold text-slate-300 cursor-pointer transition"
                            title="Archiver cette conversation"
                          >
                            <Archive className="size-3.5" />
                            Archiver
                          </button>
                        </>
                      )}
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
                            {roleLabel(v.role)}
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

                {hasPermission("can_use_kill_switch") && (
                  <button
                    onClick={handleGlobalKillSwitch}
                    className="rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2.5 text-xs font-bold text-white uppercase tracking-wider transition cursor-pointer shadow-lg flex items-center gap-2"
                  >
                    <AlertOctagon className="size-4" />
                    <span>KILL SWITCH GÉNÉRAL 🛑</span>
                  </button>
                )}
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
            !hasPermission("can_view_treasury") ? (
              <div className="p-8 rounded-2xl border border-slate-700/50 bg-[#0c121e] text-center space-y-3 animate-in fade-in">
                <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-400 grid place-items-center mx-auto">
                  <Lock className="size-6" />
                </div>
                <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
                  Accès Restreint — Trésorerie &amp; Finances
                </h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Cette section contenant les actifs globaux sous gestion (AUM), les liquidités et les flux de trésorerie est réservée exclusivement au Super Administrateur et au Fondateur (OWNER).
                </p>
              </div>
            ) : (
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

              {/* ── Historique global de toutes les transactions (tous clients) ── */}
              <section className="admin-card-emerald p-6 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-700/50 pb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                      <History className="size-5 text-emerald-400" />
                      Historique Complet des Transactions
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1">
                      Tous les dépôts, retraits et ajustements de tous les clients — {financeTransactionRows.length} résultat(s).
                    </p>
                  </div>
                  <button
                    onClick={handleExportFinanceTransactions}
                    disabled={financeTransactionRows.length === 0}
                    className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed px-3.5 py-2 text-xs font-bold text-emerald-300 cursor-pointer transition"
                  >
                    <Download className="size-3.5" />
                    Exporter en CSV
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={financeTxSearch}
                      onChange={(e) => setFinanceTxSearch(e.target.value)}
                      placeholder="Rechercher un client..."
                      className="admin-select-field !pl-9 w-full !text-xs"
                    />
                  </div>
                  <select
                    value={financeTxTypeFilter}
                    onChange={(e) => setFinanceTxTypeFilter(e.target.value as any)}
                    className="admin-select-field !text-xs"
                  >
                    <option value="ALL">Tous les types</option>
                    {Object.entries(TX_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                  <select
                    value={financeTxStatusFilter}
                    onChange={(e) => setFinanceTxStatusFilter(e.target.value as any)}
                    className="admin-select-field !text-xs"
                  >
                    <option value="ALL">Tous les statuts</option>
                    {Object.entries(TX_STATUS_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                  <select
                    value={financeTxMethodFilter}
                    onChange={(e) => setFinanceTxMethodFilter(e.target.value)}
                    className="admin-select-field !text-xs"
                  >
                    <option value="ALL">Toutes les méthodes</option>
                    {financeTransactionMethods.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-[#0c121e]">
                  <table className="w-full text-left font-mono text-sm">
                    <thead className="border-b border-slate-700/50 bg-[#0f1626]/90 text-slate-300 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5">Date</th>
                        <th className="px-4 py-3.5">Client</th>
                        <th className="px-4 py-3.5">Type</th>
                        <th className="px-4 py-3.5">Montant</th>
                        <th className="px-4 py-3.5">Méthode</th>
                        <th className="px-4 py-3.5">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {financeTransactionRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm font-sans">
                            Aucune transaction ne correspond à ces filtres.
                          </td>
                        </tr>
                      ) : (
                        financeTransactionRows.map(({ tx, clientName, clientEmail }) => {
                          const isPositive = tx.type === "DEPOSIT" || tx.type === "TRADE_PROFIT" || tx.type === "BONUS" || tx.type === "PROFIT_SHARE";
                          return (
                            <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="px-4 py-3 text-slate-300 text-xs">
                                {tx.created_at ? new Date(tx.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-"}
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-semibold text-white block">{clientName}</span>
                                <span className="text-[11px] text-slate-500">{clientEmail}</span>
                              </td>
                              <td className="px-4 py-3 text-slate-200 text-xs">{TX_TYPE_LABELS[tx.type] || tx.type}</td>
                              <td className={`px-4 py-3 font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                                {isPositive ? "+" : "-"}${Math.abs(tx.amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-slate-300 text-xs">{tx.method || "-"}</td>
                              <td className="px-4 py-3">
                                <AdminBadge
                                  variant={tx.status === "COMPLETED" ? "emerald" : tx.status === "PENDING" ? "amber" : "rose"}
                                  dot={false}
                                >
                                  {TX_STATUS_LABELS[tx.status] || tx.status}
                                </AdminBadge>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ── Coordonnées de paiement affichées au client lors d'un dépôt ── */}
              <section className="admin-card-cyan p-6 sm:p-7 space-y-5">
                <div className="border-b border-slate-700/50 pb-4">
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                    <CreditCard className="size-5 text-cyan-400" />
                    Coordonnées de Paiement
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Ces informations sont affichées aux clients lorsqu'ils effectuent un dépôt. Laissez un champ vide s'il n'est pas encore configuré — le client verra "Non configuré" plutôt qu'une fausse donnée.
                  </p>
                </div>

                {!hasPermission("can_approve_finances") ? (
                  <p className="text-xs text-slate-400 font-mono">Lecture seule — la modification est réservée à la Direction et au Desk Finance.</p>
                ) : null}

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Virement Bancaire</h3>
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Bénéficiaire</label>
                        <input
                          type="text"
                          value={paymentSettingsDraft.bank_beneficiary || ""}
                          onChange={(e) => setPaymentSettingsDraft((p) => ({ ...p, bank_beneficiary: e.target.value }))}
                          disabled={!hasPermission("can_approve_finances")}
                          placeholder="Nexium Markets Ltd"
                          className="admin-select-field w-full !text-xs disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Nom de la banque</label>
                        <input
                          type="text"
                          value={paymentSettingsDraft.bank_name || ""}
                          onChange={(e) => setPaymentSettingsDraft((p) => ({ ...p, bank_name: e.target.value }))}
                          disabled={!hasPermission("can_approve_finances")}
                          className="admin-select-field w-full !text-xs disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">IBAN</label>
                        <input
                          type="text"
                          value={paymentSettingsDraft.bank_iban || ""}
                          onChange={(e) => setPaymentSettingsDraft((p) => ({ ...p, bank_iban: e.target.value }))}
                          disabled={!hasPermission("can_approve_finances")}
                          placeholder="FRxx xxxx xxxx xxxx xxxx xxxx xxx"
                          className="admin-select-field w-full !text-xs font-mono disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">BIC / SWIFT</label>
                        <input
                          type="text"
                          value={paymentSettingsDraft.bank_bic || ""}
                          onChange={(e) => setPaymentSettingsDraft((p) => ({ ...p, bank_bic: e.target.value }))}
                          disabled={!hasPermission("can_approve_finances")}
                          className="admin-select-field w-full !text-xs font-mono disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Adresses Crypto</h3>
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">USDT (Réseau TRC20)</label>
                        <input
                          type="text"
                          value={paymentSettingsDraft.crypto_usdt_trc20_address || ""}
                          onChange={(e) => setPaymentSettingsDraft((p) => ({ ...p, crypto_usdt_trc20_address: e.target.value }))}
                          disabled={!hasPermission("can_approve_finances")}
                          placeholder="T..."
                          className="admin-select-field w-full !text-xs font-mono disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">USDT (Réseau ERC20)</label>
                        <input
                          type="text"
                          value={paymentSettingsDraft.crypto_usdt_erc20_address || ""}
                          onChange={(e) => setPaymentSettingsDraft((p) => ({ ...p, crypto_usdt_erc20_address: e.target.value }))}
                          disabled={!hasPermission("can_approve_finances")}
                          placeholder="0x..."
                          className="admin-select-field w-full !text-xs font-mono disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Bitcoin (BTC)</label>
                        <input
                          type="text"
                          value={paymentSettingsDraft.crypto_btc_address || ""}
                          onChange={(e) => setPaymentSettingsDraft((p) => ({ ...p, crypto_btc_address: e.target.value }))}
                          disabled={!hasPermission("can_approve_finances")}
                          placeholder="bc1..."
                          className="admin-select-field w-full !text-xs font-mono disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Ethereum (ETH)</label>
                        <input
                          type="text"
                          value={paymentSettingsDraft.crypto_eth_address || ""}
                          onChange={(e) => setPaymentSettingsDraft((p) => ({ ...p, crypto_eth_address: e.target.value }))}
                          disabled={!hasPermission("can_approve_finances")}
                          placeholder="0x..."
                          className="admin-select-field w-full !text-xs font-mono disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {hasPermission("can_approve_finances") && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-700/40">
                    {paymentSettings?.updated_at && (
                      <span className="text-[11px] text-slate-500 font-mono">
                        Dernière modification : {new Date(paymentSettings.updated_at).toLocaleString("fr-FR")}
                        {paymentSettings.updated_by ? ` par ${paymentSettings.updated_by}` : ""}
                      </span>
                    )}
                    <button
                      onClick={handleSavePaymentSettings}
                      disabled={savingPaymentSettings}
                      className="admin-btn-primary text-xs font-bold py-2 px-5 ml-auto disabled:opacity-50"
                    >
                      {savingPaymentSettings ? "Enregistrement..." : "Enregistrer les Coordonnées"}
                    </button>
                  </div>
                )}
              </section>
            </div>
            )
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

          {/* ===================================================================== */}
          {/* 🌟 12. SUIVI DES VISITEURS (`analytics`)                              */}
          {/* ===================================================================== */}
          {activeSection === "analytics" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-700/50 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Eye className="size-7 text-emerald-400" />
                    <span>Visiteurs</span>
                  </h1>
                  <p className="mt-1 text-xs text-slate-400">
                    Fréquentation du site public et de l'application — uniquement les visiteurs ayant accepté les cookies de mesure d'audience.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-[#0c121e] p-1">
                  {(["24h", "7d", "30d"] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => setPageViewsWindow(w)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        pageViewsWindow === w ? "bg-emerald-500 text-black" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {w === "24h" ? "24 heures" : w === "7d" ? "7 jours" : "30 jours"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-3 font-mono">
                <div className="admin-card-emerald p-5 space-y-2">
                  <span className="text-xs text-slate-300 uppercase font-semibold font-sans">Pages Vues</span>
                  <p className="text-2xl font-bold text-emerald-400">{pageViewStats.totalViews.toLocaleString("fr-FR")}</p>
                </div>
                <div className="admin-card-cyan p-5 space-y-2">
                  <span className="text-xs text-slate-300 uppercase font-semibold font-sans">Visiteurs Uniques</span>
                  <p className="text-2xl font-bold text-cyan-300">{pageViewStats.uniqueVisitors.toLocaleString("fr-FR")}</p>
                </div>
                <div className="admin-card-amber p-5 space-y-2">
                  <span className="text-xs text-slate-300 uppercase font-semibold font-sans">Page la Plus Visitée</span>
                  <p className="text-lg font-bold text-amber-300 truncate" title={pageViewStats.topPage}>{pageViewStats.topPage}</p>
                </div>
              </div>

              <section className="admin-card p-6 sm:p-7 space-y-4">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                  <BarChart3 className="size-5 text-emerald-400" />
                  Pages les Plus Visitées
                </h2>
                <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-[#0c121e]">
                  <table className="w-full text-left font-mono text-sm">
                    <thead className="border-b border-slate-700/50 bg-[#0f1626]/90 text-slate-300 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Page</th>
                        <th className="px-4 py-3">Vues</th>
                        <th className="px-4 py-3">Visiteurs Uniques</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {pageViewsLoading ? (
                        <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500 text-sm font-sans">Chargement...</td></tr>
                      ) : pageViewStats.topPages.length === 0 ? (
                        <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500 text-sm font-sans">Aucune visite enregistrée sur cette période.</td></tr>
                      ) : (
                        pageViewStats.topPages.map((p) => (
                          <tr key={p.path} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-2.5 text-white font-semibold">{p.path}</td>
                            <td className="px-4 py-2.5 text-emerald-400">{p.views}</td>
                            <td className="px-4 py-2.5 text-slate-300">{p.uniqueVisitors}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="admin-card p-6 sm:p-7 space-y-4">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                  <History className="size-5 text-emerald-400" />
                  Activité Récente
                </h2>
                <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-[#0c121e] max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left font-mono text-sm">
                    <thead className="border-b border-slate-700/50 bg-[#0f1626]/90 text-slate-300 text-xs font-bold uppercase tracking-wider sticky top-0">
                      <tr>
                        <th className="px-4 py-3">Horodatage</th>
                        <th className="px-4 py-3">Page</th>
                        <th className="px-4 py-3">Provenance</th>
                        <th className="px-4 py-3">Session</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {pageViews.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-sm font-sans">Aucune visite enregistrée sur cette période.</td></tr>
                      ) : (
                        pageViews.slice(0, 300).map((v) => (
                          <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-2 text-slate-400 text-xs">
                              {new Date(v.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="px-4 py-2 text-white text-xs">{v.path}</td>
                            <td className="px-4 py-2 text-slate-400 text-xs truncate max-w-[200px]">{v.referrer || "Direct"}</td>
                            <td className="px-4 py-2 text-slate-500 text-[11px]">{v.session_id.slice(0, 8)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
