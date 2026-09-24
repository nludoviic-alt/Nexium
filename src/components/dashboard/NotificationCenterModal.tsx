import { useState, useMemo } from "react";
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
  TrendingUp,
  ShieldAlert,
  Zap,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  AlertCircle,
  Activity,
  SlidersHorizontal,
} from "lucide-react";
import type { AppNotification } from "@/lib/notifications";
import { playNotificationSound } from "@/lib/notifications";

export interface PriceAlertItem {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: "ABOVE" | "BELOW";
  triggered: boolean;
  createdAt: string;
}

interface NotificationCenterModalProps {
  open: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  priceAlerts: PriceAlertItem[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onDeleteNotification: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onAddPriceAlert: (symbol: string, targetPrice: number, condition: "ABOVE" | "BELOW") => void;
  onDeletePriceAlert: (id: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onNavigateToSymbol?: (symbol: string) => void;
}

export function NotificationCenterModal({
  open,
  onClose,
  notifications,
  priceAlerts,
  onMarkAllAsRead,
  onClearAll,
  onDeleteNotification,
  onMarkAsRead,
  onAddPriceAlert,
  onDeletePriceAlert,
  soundEnabled,
  onToggleSound,
  onNavigateToSymbol,
}: NotificationCenterModalProps) {
  const [activeTab, setActiveTab] = useState<"all" | "trades" | "alerts" | "system" | "create">("all");

  // New alert form inputs
  const [symbol, setSymbol] = useState("XAUUSD");
  const [targetPrice, setTargetPrice] = useState("2395.00");
  const [condition, setCondition] = useState<"ABOVE" | "BELOW">("ABOVE");

  // Symbols list with current prices for convenience
  const symbolPrices: Record<string, { price: number; name: string; digits: number }> = {
    XAUUSD: { price: 2388.5, name: "Gold Spot / USD", digits: 2 },
    EURUSD: { price: 1.0865, name: "Euro / US Dollar", digits: 4 },
    NAS100: { price: 19820.0, name: "Nasdaq 100 Index", digits: 2 },
    BTCUSD: { price: 64250.0, name: "Bitcoin / USD", digits: 2 },
    US30: { price: 39120.0, name: "Dow Jones Industrial", digits: 2 },
    ETHUSD: { price: 3450.0, name: "Ethereum / USD", digits: 2 },
  };

  const handleSymbolChange = (newSym: string) => {
    setSymbol(newSym);
    const symData = symbolPrices[newSym];
    if (symData) {
      setTargetPrice((symData.price * (condition === "ABOVE" ? 1.005 : 0.995)).toFixed(symData.digits));
    }
  };

  const applyPriceOffset = (pct: number) => {
    const symData = symbolPrices[symbol];
    if (symData) {
      const p = symData.price * (1 + pct / 100);
      setTargetPrice(p.toFixed(symData.digits));
      if (pct > 0) setCondition("ABOVE");
      else setCondition("BELOW");
    }
  };

  const handleSubmitAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(targetPrice);
    if (isNaN(p) || p <= 0) return;
    onAddPriceAlert(symbol, p, condition);
    playNotificationSound("alert");
    setActiveTab("alerts");
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case "trades":
        return notifications.filter((n) => n.type === "trade" || n.type === "bot");
      case "alerts":
        return notifications.filter((n) => n.type === "alert");
      case "system":
        return notifications.filter((n) => n.type === "system" || n.type === "security");
      case "all":
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-white/[0.12] bg-[#10141b] shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4 bg-[#141a23]/60 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative grid size-9 place-items-center rounded-xl bg-[#00D084]/15 border border-[#00D084]/30 text-[#00D084]">
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 size-3 rounded-full bg-[#00D084] ring-2 ring-[#10141b] animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg sm:text-xl text-white tracking-tight">
                  Centre de Notifications & Alertes
                </h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-[#00D084]/20 border border-[#00D084]/40 px-2 py-0.5 text-[10px] font-mono font-black text-[#00D084]">
                    {unreadCount} NON LUE{unreadCount > 1 ? "S" : ""}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5 mt-0.5">
                <span className="size-1.5 rounded-full bg-[#00D084] animate-pulse" />
                Flux FIX NY4 & Surveillance en Temps Réel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio chime toggle */}
            <button
              onClick={onToggleSound}
              title={soundEnabled ? "Couper le son des alertes" : "Activer le son des alertes"}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                soundEnabled
                  ? "border-[#00D084]/30 bg-[#00D084]/10 text-[#00D084] hover:bg-[#00D084]/20"
                  : "border-white/[0.08] bg-[#141a23] text-gray-400 hover:text-white"
              }`}
            >
              {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-white/[0.08] bg-[#141a23] text-gray-400 hover:text-white hover:border-white/20 transition cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#0c1017] px-6 py-2 overflow-x-auto no-scrollbar gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "all"
                  ? "bg-[#00D084]/15 border border-[#00D084]/40 text-[#00D084] font-bold"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Activity className="size-3.5" />
              <span>Toutes</span>
              <span className="text-[10px] opacity-70">({notifications.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("trades")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "trades"
                  ? "bg-[#00D084]/15 border border-[#00D084]/40 text-[#00D084] font-bold"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Zap className="size-3.5" />
              <span>Trades & IA</span>
              <span className="text-[10px] opacity-70">
                ({notifications.filter((n) => n.type === "trade" || n.type === "bot").length})
              </span>
            </button>

            <button
              onClick={() => setActiveTab("alerts")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "alerts"
                  ? "bg-[#00D084]/15 border border-[#00D084]/40 text-[#00D084] font-bold"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <TrendingUp className="size-3.5" />
              <span>Alertes Prix</span>
              <span className="text-[10px] opacity-70">({priceAlerts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("system")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "system"
                  ? "bg-[#00D084]/15 border border-[#00D084]/40 text-[#00D084] font-bold"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <ShieldAlert className="size-3.5" />
              <span>Système</span>
              <span className="text-[10px] opacity-70">
                ({notifications.filter((n) => n.type === "system" || n.type === "security").length})
              </span>
            </button>

            <button
              onClick={() => setActiveTab("create")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "create"
                  ? "bg-amber-500/15 border border-amber-500/40 text-amber-400 font-bold"
                  : "text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10"
              }`}
            >
              <Plus className="size-3.5" />
              <span>+ Créer Alerte</span>
            </button>
          </div>

          {/* Quick Bulk Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                title="Tout marquer comme lu"
                className="flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-[#00D084] px-2 py-1 rounded-lg hover:bg-white/[0.04] transition cursor-pointer"
              >
                <CheckCheck className="size-3.5" />
                <span className="hidden sm:inline">Tout lire</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                title="Effacer tout l'historique"
                className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-white/[0.04] transition cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                <span className="hidden sm:inline">Effacer</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body / Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "create" ? (
            /* Tab: Create New Price Alert Form */
            <form onSubmit={handleSubmitAlert} className="space-y-5">
              <div className="rounded-2xl border border-white/[0.08] bg-[#141a23]/70 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-[#00D084]" />
                    Configuration de l'alerte temps réel
                  </span>
                  <span className="text-[11px] font-mono text-[#00D084]">
                    Prix actuel : ${symbolPrices[symbol]?.price.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5">ACTIF FINANCIER</label>
                    <select
                      value={symbol}
                      onChange={(e) => handleSymbolChange(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.1] bg-[#0c1017] px-3.5 py-2.5 text-sm text-white font-semibold outline-none focus:border-[#00D084] transition"
                    >
                      {Object.entries(symbolPrices).map(([sym, item]) => (
                        <option key={sym} value={sym}>
                          {sym} — {item.name} (${item.price.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5">CONDITION DE DÉCLENCHEMENT</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCondition("ABOVE")}
                        className={`py-2.5 rounded-xl border text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          condition === "ABOVE"
                            ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                            : "border-white/[0.08] bg-[#0c1017] text-gray-400 hover:text-white"
                        }`}
                      >
                        <ArrowUpRight className="size-3.5" />
                        Franchit {">"} (Hausse)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCondition("BELOW")}
                        className={`py-2.5 rounded-xl border text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          condition === "BELOW"
                            ? "border-rose-500/50 bg-rose-500/20 text-rose-400"
                            : "border-white/[0.08] bg-[#0c1017] text-gray-400 hover:text-white"
                        }`}
                      >
                        <ArrowDownRight className="size-3.5" />
                        Passe {"<"} (Baisse)
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-400">PRIX CIBLE ($ USD)</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => applyPriceOffset(0.5)}
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/[0.05] hover:bg-emerald-500/20 hover:text-emerald-300 text-gray-300 transition"
                      >
                        +0.5%
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPriceOffset(1)}
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/[0.05] hover:bg-emerald-500/20 hover:text-emerald-300 text-gray-300 transition"
                      >
                        +1%
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPriceOffset(-0.5)}
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/[0.05] hover:bg-rose-500/20 hover:text-rose-300 text-gray-300 transition"
                      >
                        -0.5%
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPriceOffset(-1)}
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/[0.05] hover:bg-rose-500/20 hover:text-rose-300 text-gray-300 transition"
                      >
                        -1%
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/[0.1] bg-[#0c1017] px-4 py-2.5 font-mono text-base text-white outline-none focus:border-[#00D084] transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="neon-btn flex-1 rounded-2xl py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-black cursor-pointer shadow-[0_0_20px_rgba(0,208,132,0.3)]"
                >
                  ACTIVER L'ALERTE DE PRIX
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("alerts")}
                  className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-5 py-3.5 text-xs font-bold text-gray-300 hover:text-white transition cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : activeTab === "alerts" ? (
            /* Tab: Price Alerts List */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Alertes Actives ({priceAlerts.length})
                </span>
                <button
                  onClick={() => setActiveTab("create")}
                  className="text-xs font-bold text-[#00D084] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  Ajouter une alerte
                </button>
              </div>

              {priceAlerts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.1] p-8 text-center space-y-3">
                  <TrendingUp className="size-8 text-gray-600 mx-auto" />
                  <p className="text-sm font-medium text-gray-400">Aucune alerte de prix configurée.</p>
                  <button
                    onClick={() => setActiveTab("create")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#00D084]/40 bg-[#00D084]/15 px-4 py-2 text-xs font-bold text-[#00D084] hover:bg-[#00D084]/25 transition cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    Créer ma première alerte
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {priceAlerts.map((alt) => {
                    const current = symbolPrices[alt.symbol]?.price;
                    const diff = current ? ((alt.targetPrice - current) / current) * 100 : null;

                    return (
                      <div
                        key={alt.id}
                        className="group flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#141a23]/80 p-4 transition hover:border-white/20 hover:bg-[#141a23]"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`grid size-9 place-items-center rounded-xl font-mono font-black text-xs ${
                              alt.condition === "ABOVE"
                                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                                : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                            }`}
                          >
                            {alt.condition === "ABOVE" ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">{alt.symbol}</span>
                              <span className="text-xs font-mono font-semibold text-gray-300">
                                {alt.condition === "ABOVE" ? "franchit >" : "passe <"} ${alt.targetPrice.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                              </span>
                              {alt.triggered && (
                                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-mono font-bold text-amber-300 border border-amber-500/40">
                                  DÉCLENCHÉE
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-gray-400">
                              <span>Créée à {alt.createdAt}</span>
                              {diff !== null && (
                                <span className={diff > 0 ? "text-emerald-400" : "text-rose-400"}>
                                  · Écart : {diff > 0 ? "+" : ""}
                                  {diff.toFixed(2)}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {onNavigateToSymbol && (
                            <button
                              onClick={() => {
                                onNavigateToSymbol(alt.symbol);
                                onClose();
                              }}
                              className="text-xs font-bold text-gray-400 hover:text-[#00D084] p-1.5 rounded-lg hover:bg-white/[0.04] transition cursor-pointer"
                              title="Voir le graphique"
                            >
                              <SlidersHorizontal className="size-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onDeletePriceAlert(alt.id)}
                            className="text-gray-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                            title="Supprimer l'alerte"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Notification Feed (All / Trades / System) */
            <div className="space-y-2.5">
              {filteredNotifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.1] p-10 text-center space-y-3">
                  <Bell className="size-8 text-gray-600 mx-auto" />
                  <p className="text-sm font-medium text-gray-400">Aucune notification dans cette catégorie.</p>
                </div>
              ) : (
                filteredNotifications.map((n) => {
                  const severityColors = {
                    success: "border-l-[#00D084] bg-[#141a23]/80 hover:bg-[#171e29]",
                    warning: "border-l-amber-500 bg-[#141a23]/80 hover:bg-[#171e29]",
                    error: "border-l-rose-500 bg-[#141a23]/80 hover:bg-[#171e29]",
                    info: "border-l-sky-500 bg-[#141a23]/80 hover:bg-[#171e29]",
                  }[n.severity];

                  const iconBySeverity = {
                    success: <CheckCheck className="size-4 text-[#00D084]" />,
                    warning: <AlertCircle className="size-4 text-amber-400" />,
                    error: <ShieldAlert className="size-4 text-rose-400" />,
                    info: <Clock className="size-4 text-sky-400" />,
                  }[n.severity];

                  return (
                    <div
                      key={n.id}
                      onClick={() => !n.read && onMarkAsRead(n.id)}
                      className={`group relative flex items-start justify-between rounded-2xl border-l-4 border border-white/[0.08] p-4 transition-all duration-200 cursor-pointer ${severityColors} ${
                        !n.read ? "ring-1 ring-[#00D084]/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)]" : "opacity-80"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="mt-0.5 grid size-8 place-items-center rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0">
                          {iconBySeverity}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white tracking-tight">{n.title}</span>
                            {n.symbol && (
                              <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-mono font-bold text-gray-200">
                                {n.symbol}
                              </span>
                            )}
                            {n.amount !== undefined && (
                              <span
                                className={`text-xs font-mono font-bold ${
                                  n.amount >= 0 ? "text-[#00D084]" : "text-rose-400"
                                }`}
                              >
                                {n.amount >= 0 ? "+" : ""}${n.amount.toFixed(2)}
                              </span>
                            )}
                            {!n.read && (
                              <span className="size-2 rounded-full bg-[#00D084] shadow-[0_0_8px_#00D084]" />
                            )}
                          </div>

                          <p className="text-xs text-gray-300 leading-relaxed">{n.description}</p>

                          <div className="flex items-center gap-2 pt-0.5 text-[10px] font-mono text-gray-400">
                            <span>{n.timestamp}</span>
                            <span>·</span>
                            <span className="uppercase text-gray-400">{n.type}</span>
                            {n.score !== undefined && (
                              <>
                                <span>·</span>
                                <span className="text-[#00D084]">Score IA: {n.score}/100</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNotification(n.id);
                          }}
                          className="p-1 text-gray-500 hover:text-rose-400 rounded hover:bg-rose-500/10 transition cursor-pointer"
                          title="Supprimer la notification"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] bg-[#141a23]/60 px-6 py-3.5 backdrop-blur-xl text-xs font-mono text-gray-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#00D084]" />
            <span>Moteur d'alertes instantanées actif</span>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 font-bold text-gray-200 hover:bg-white/[0.08] transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
