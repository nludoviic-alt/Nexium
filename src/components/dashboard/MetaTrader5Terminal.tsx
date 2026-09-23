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
} from "lucide-react";
import { toast } from "sonner";

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
  comment?: string;
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
  dateLabel: string;
  monthLabel?: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isUp: boolean;
  event?: "D" | "E" | "lightning";
}

function generateAaplRealisticCandles(): CandleBar[] {
  const dataPoints: { o: number; h: number; l: number; c: number; v: number; m?: string; d: string; ev?: "D" | "E" | "lightning" }[] = [
    // Dec
    { o: 250, h: 255, l: 247, c: 253, v: 22, m: "Dec", d: "Dec 01" },
    { o: 253, h: 258, l: 251, c: 257, v: 28, d: "Dec 05" },
    { o: 257, h: 260, l: 252, c: 254, v: 31, d: "Dec 09" },
    { o: 254, h: 256, l: 246, c: 248, v: 38, d: "Dec 12" },
    { o: 248, h: 252, l: 244, c: 246, v: 25, d: "Dec 16" },
    { o: 246, h: 250, l: 242, c: 244, v: 34, d: "Dec 20" },
    { o: 244, h: 249, l: 241, c: 248, v: 19, d: "Dec 24" },
    { o: 248, h: 255, l: 246, c: 253, v: 23, d: "Dec 29" },
    // Jan
    { o: 253, h: 262, l: 251, c: 260, v: 42, m: "Mon 05 Jan '26", d: "Jan 05", ev: "E" },
    { o: 260, h: 268, l: 258, c: 266, v: 36, d: "Jan 10" },
    { o: 266, h: 271, l: 263, c: 269, v: 29, d: "Jan 15" },
    { o: 269, h: 272, l: 264, c: 267, v: 33, d: "Jan 20" },
    { o: 267, h: 268, l: 259, c: 261, v: 30, d: "Jan 26" },
    // Feb
    { o: 261, h: 264, l: 255, c: 257, v: 27, m: "Feb", d: "Feb 02", ev: "D" },
    { o: 257, h: 259, l: 248, c: 250, v: 39, d: "Feb 08" },
    { o: 250, h: 253, l: 245, c: 246, v: 44, d: "Feb 14" },
    { o: 246, h: 254, l: 243, c: 252, v: 31, d: "Feb 20" },
    { o: 252, h: 258, l: 250, c: 256, v: 28, d: "Feb 26" },
    // Mar
    { o: 256, h: 265, l: 254, c: 263, v: 33, m: "Mar", d: "Mar 03" },
    { o: 263, h: 270, l: 261, c: 268, v: 37, d: "Mar 09" },
    { o: 268, h: 273, l: 265, c: 266, v: 30, d: "Mar 15" },
    { o: 266, h: 268, l: 258, c: 260, v: 35, d: "Mar 21" },
    { o: 260, h: 264, l: 255, c: 258, v: 29, d: "Mar 27" },
    // Apr
    { o: 258, h: 263, l: 252, c: 254, v: 32, m: "Apr", d: "Apr 02" },
    { o: 254, h: 259, l: 249, c: 251, v: 26, d: "Apr 08" },
    { o: 251, h: 260, l: 248, c: 258, v: 34, d: "Apr 14" },
    { o: 258, h: 266, l: 256, c: 264, v: 40, d: "Apr 20" },
    { o: 264, h: 272, l: 262, c: 270, v: 48, d: "Apr 26" },
    // May
    { o: 270, h: 278, l: 268, c: 275, v: 52, m: "May", d: "May 02", ev: "E" },
    { o: 275, h: 285, l: 273, c: 283, v: 58, d: "May 08", ev: "D" },
    { o: 283, h: 294, l: 281, c: 291, v: 62, d: "May 14" },
    { o: 291, h: 301, l: 288, c: 298, v: 65, d: "May 20" },
    { o: 298, h: 307, l: 295, c: 304, v: 59, d: "May 27" },
    // Jun
    { o: 304, h: 312, l: 301, c: 309, v: 68, m: "Jun", d: "Jun 02" },
    { o: 309, h: 318, l: 306, c: 315, v: 74, d: "Jun 08" },
    { o: 315, h: 317, l: 305, c: 308, v: 51, d: "Jun 14" },
    { o: 308, h: 311, l: 299, c: 302, v: 47, d: "Jun 20" },
    { o: 302, h: 305, l: 292, c: 295, v: 63, d: "Jun 26" },
    // Jul
    { o: 295, h: 300, l: 288, c: 291, v: 54, m: "Jul", d: "Jul 02" },
    { o: 291, h: 296, l: 284, c: 286, v: 71, d: "Jul 08" },
    { o: 286, h: 302, l: 285, c: 299, v: 92, d: "Jul 14" },
    { o: 299, h: 315, l: 297, c: 312, v: 88, d: "Jul 20" },
    { o: 312, h: 326, l: 310, c: 322, v: 79, d: "Jul 26" },
    // Aug
    { o: 322, h: 336, l: 319, c: 332, v: 84, m: "Aug", d: "Aug 02", ev: "E" },
    { o: 332, h: 342, l: 328, c: 338, v: 96, d: "Aug 08", ev: "D" },
    { o: 338, h: 341, l: 324, c: 327, v: 67, d: "Aug 14" },
    { o: 327, h: 331, l: 318, c: 321, v: 58, d: "Aug 20" },
    { o: 321, h: 325, l: 312, c: 316, v: 53, d: "Aug 26" },
    // Sep
    { o: 316, h: 324, l: 314, c: 322, v: 61, m: "Sep", d: "Sep 02" },
    { o: 322, h: 331, l: 320, c: 329, v: 69, d: "Sep 08" },
    { o: 329, h: 337, l: 326, c: 334, v: 75, d: "Sep 15" },
    { o: 334, h: 341, l: 330, c: 337, v: 82, d: "Sep 22", ev: "lightning" },
    { o: 337, h: 344, l: 333, c: 340, v: 89, d: "Sep 28" },
    // Oct (Current live)
    { o: 340, h: 343, l: 336, c: 338.44, v: 45.65, m: "Oct", d: "Oct 04" },
  ];

  return dataPoints.map((dp) => ({
    dateLabel: dp.d,
    monthLabel: dp.m,
    open: dp.o,
    high: dp.h,
    low: dp.l,
    close: dp.c,
    volume: dp.v * 1000000,
    isUp: dp.c >= dp.o,
    event: dp.ev,
  }));
}

function generateGenericCandles(basePrice: number, count = 52): CandleBar[] {
  const scale = basePrice / 338.43;
  return generateAaplRealisticCandles().map((c) => ({
    ...c,
    open: +(c.open * scale).toFixed(2),
    high: +(c.high * scale).toFixed(2),
    low: +(c.low * scale).toFixed(2),
    close: +(c.close * scale).toFixed(2),
  }));
}

// ----------------------------------------------------
// MAIN TRADINGVIEW WORKSTATION COMPONENT (DARK THEME & COMPACT SIDEBAR)
// ----------------------------------------------------
export function MetaTrader5Terminal({
  balance = 10000,
  bonus = 0,
  mt5AccountNumber = "892041",
  clientName = "Client Nexium",
  onOpenDeposit,
  onOpenWithdraw,
  onBalanceChange,
}: {
  balance?: number;
  bonus?: number;
  mt5AccountNumber?: string;
  clientName?: string;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onBalanceChange?: (newBalance: number) => void;
}) {
  // Selected Symbol (Default AAPL)
  const defaultSymbol = WATCHLIST_SYMBOLS.find((s) => s.symbol === "AAPL") || WATCHLIST_SYMBOLS[0];
  const [selectedSymbol, setSelectedSymbol] = useState<WatchlistSymbol>(defaultSymbol);
  const [watchlist, setWatchlist] = useState<WatchlistSymbol[]>(WATCHLIST_SYMBOLS);
  const [timeframe, setTimeframe] = useState<string>("1D");
  const [lotSize, setLotSize] = useState<string>("0.06");
  const [candles, setCandles] = useState<CandleBar[]>(() =>
    generateAaplRealisticCandles()
  );

  // Crosshair & Hover state
  const [hoveredCandle, setHoveredCandle] = useState<CandleBar | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const chartSvgRef = useRef<SVGSVGElement | null>(null);

  // Active Tool state
  const [activeDrawTool, setActiveDrawTool] = useState<string>("crosshair");
  const [activeRightTab, setActiveRightTab] = useState<string>("watchlist");
  const [showIndicators, setShowIndicators] = useState(false);
  const [clockTime, setClockTime] = useState<string>("15:04:17 UTC");

  // Account Manager / Positions state
  const [positions, setPositions] = useState<Mt5Position[]>([
    {
      ticket: 8901241,
      time: "14:22:10",
      type: "BUY",
      lots: 0.10,
      symbol: "AAPL",
      openPrice: 334.20,
      currentPrice: 338.43,
      sl: 326.00,
      tp: 350.00,
      commission: -1.20,
      swap: 0.00,
      profit: 42.30,
      comment: "Algorithme Nexium AI Gold",
    },
  ]);

  const [bottomTab, setBottomTab] = useState<"positions" | "history" | "orders" | "journal">("positions");
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

  // Sync candles when symbol changes
  useEffect(() => {
    if (selectedSymbol.symbol === "AAPL") {
      setCandles(generateAaplRealisticCandles());
    } else {
      setCandles(generateGenericCandles(selectedSymbol.last));
    }
  }, [selectedSymbol.symbol]);

  // Real-time tick engine
  useEffect(() => {
    const interval = setInterval(() => {
      setWatchlist((prev) =>
        prev.map((item) => {
          const delta = (Math.random() - 0.49) * (item.last * 0.0004);
          const nextLast = +(item.last + delta).toFixed(item.digits);
          const nextChg = +(item.chg + delta).toFixed(item.digits);
          const nextChgPct = +((nextChg / (item.last - nextChg)) * 100).toFixed(2);
          return {
            ...item,
            last: nextLast,
            chg: nextChg,
            chgPct: nextChgPct,
          };
        })
      );

      // Update current chart candle
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const lastCandle = prev[prev.length - 1];
        const delta = (Math.random() - 0.49) * 0.25;
        const nextClose = +(lastCandle.close + delta).toFixed(2);
        const nextHigh = Math.max(lastCandle.high, nextClose);
        const nextLow = Math.min(lastCandle.low, nextClose);

        const updated = [...prev];
        updated[updated.length - 1] = {
          ...lastCandle,
          close: nextClose,
          high: nextHigh,
          low: nextLow,
          isUp: nextClose >= lastCandle.open,
        };
        return updated;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [selectedSymbol]);

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

  // One-Click BUY/SELL execution
  const handleExecuteOrder = (type: "BUY" | "SELL") => {
    const lots = parseFloat(lotSize) || 0.06;
    const price = selectedSymbol.last;
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
      comment: "Ordre Marché 1-Click",
    };

    setPositions((prev) => [newPos, ...prev]);
    playTradeAudio();
    toast.success(
      `Ordre ${type} ${lots} lot(s) exécuté avec succès sur ${selectedSymbol.symbol} à $${selectedSymbol.last} !`
    );
  };

  const handleClosePosition = (ticket: number) => {
    const pos = positions.find((p) => p.ticket === ticket);
    if (!pos) return;
    setPositions((prev) => prev.filter((p) => p.ticket !== ticket));
    if (onBalanceChange) {
      onBalanceChange(balance + pos.profit);
    }
    toast.info(`Position #${ticket} clôturée avec un P&L de ${pos.profit >= 0 ? "+" : ""}$${pos.profit.toFixed(2)} USD.`);
  };

  // Fixed Chart Dimensions & Scale
  const chartWidth = 1000;
  const chartHeight = 490;
  const paddingRight = 68;
  const paddingBottom = 40;
  const paddingTop = 25;

  const minPrice = 235;
  const maxPrice = 355;
  const maxVolume = 120000000;

  const getY = (price: number) => {
    const range = maxPrice - minPrice || 1;
    return (
      paddingTop +
      (1 - (price - minPrice) / range) * (chartHeight - paddingTop - paddingBottom)
    );
  };

  const getVolY = (vol: number) => {
    const maxH = 95;
    return chartHeight - paddingBottom - (vol / (maxVolume || 1)) * maxH;
  };

  const candleSpacing = (chartWidth - paddingRight - 35) / Math.max(candles.length, 1);

  // Active hover candle info
  const activeCandle = hoveredCandle || (candles.length > 0 ? candles[candles.length - 1] : null);

  const totalOpenProfit = useMemo(
    () => positions.reduce((acc, p) => acc + p.profit, 0),
    [positions]
  );

  return (
    <div className="flex flex-col bg-[#131722] border border-[#2a2e39] rounded-2xl shadow-2xl overflow-hidden font-sans select-none text-[#d1d4dc] antialiased">
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
          {[
            { id: "crosshair", icon: Crosshair, title: "Curseur Réticule (Crosshair)" },
            { id: "trendline", icon: PenTool, title: "Lignes de tendance & Rayons" },
            { id: "fibonacci", icon: Layers, title: "Fibonacci & Outils de Gann" },
            { id: "brush", icon: Edit3, title: "Pinceau & Formes géométriques" },
            { id: "text", icon: Type, title: "Outil Texte & Annotations" },
            { id: "patterns", icon: Activity, title: "Figures chartistes & Harmoniques" },
            { id: "prediction", icon: TrendingUp, title: "Position Longue / Courte & R:R" },
            { id: "icons", icon: Sparkles, title: "Icônes & Émojis" },
            { id: "ruler", icon: Maximize, title: "Règle de mesure" },
            { id: "zoom", icon: Search, title: "Zoom avant" },
            { id: "magnet", icon: Zap, title: "Mode Aimant" },
            { id: "lock_draw", icon: Lock, title: "Verrouiller le mode dessin" },
            { id: "lock_all", icon: Lock, title: "Verrouiller tous les outils de dessin" },
            { id: "hide", icon: Eye, title: "Masquer tous les dessins" },
            { id: "trash", icon: Trash2, title: "Supprimer les dessins" },
          ].map((tool) => {
            const Icon = tool.icon;
            const isActive = activeDrawTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveDrawTool(tool.id);
                  if (tool.id === "trash") toast.info("Graphique réinitialisé.");
                }}
                title={tool.title}
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  isActive
                    ? "bg-[#2962ff]/20 text-[#2962ff]"
                    : "hover:bg-[#2a2e39] hover:text-white"
                }`}
              >
                <Icon className="size-4" />
              </button>
            );
          })}
        </div>

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

            {/* ONE-CLICK TRADING ORDER BUTTONS (DARK THEME) */}
            <div className="flex items-center gap-1 bg-[#1e222d] p-0.5 rounded-lg border border-[#2a2e39] shadow-md w-fit">
              {/* SELL BOX */}
              <button
                onClick={() => handleExecuteOrder("SELL")}
                className="flex flex-col items-center justify-center bg-[#362128] hover:bg-[#4a242e] border border-[#f23645]/50 rounded-md px-2.5 py-0.5 text-[#f23645] transition cursor-pointer active:scale-95 min-w-[58px]"
              >
                <span className="text-[11px] font-bold font-mono tracking-tight leading-tight">
                  338.41
                </span>
                <span className="text-[8px] font-black uppercase tracking-wider">SELL</span>
              </button>

              {/* LOT SIZE INPUT */}
              <div className="px-1 py-0.5">
                <input
                  type="text"
                  value={lotSize}
                  onChange={(e) => setLotSize(e.target.value)}
                  className="w-11 text-center text-xs font-mono font-bold border border-[#363a45] rounded bg-[#131722] py-0.5 text-white focus:outline-none focus:border-[#2962ff]"
                  title="Taille du lot"
                />
              </div>

              {/* BUY BOX */}
              <button
                onClick={() => handleExecuteOrder("BUY")}
                className="flex flex-col items-center justify-center bg-[#172d54] hover:bg-[#1f3b70] border border-[#2962ff]/50 rounded-md px-2.5 py-0.5 text-[#2962ff] transition cursor-pointer active:scale-95 min-w-[58px]"
              >
                <span className="text-[11px] font-bold font-mono tracking-tight leading-tight">
                  338.47
                </span>
                <span className="text-[8px] font-black uppercase tracking-wider">BUY</span>
              </button>
            </div>

            {/* Volume Label */}
            <div className="flex items-center gap-1 text-[10px] font-mono text-[#787b86]">
              <span>Vol</span>
              <strong className="text-[#f23645]">45.65 M</strong>
              <ChevronDown className="size-2.5 text-[#787b86]" />
            </div>
          </div>

          {/* SVG CANDLESTICK & VOLUME CHART (DARK THEME) */}
          <div className="flex-1 w-full h-full relative cursor-crosshair">
            <svg
              ref={chartSvgRef}
              className="w-full h-full"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
              onMouseMove={(e) => {
                if (!chartSvgRef.current) return;
                const rect = chartSvgRef.current.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * chartWidth;
                const y = ((e.clientY - rect.top) / rect.height) * chartHeight;
                setMousePos({ x, y });

                const index = Math.floor((x - 20) / candleSpacing);
                if (index >= 0 && index < candles.length) {
                  setHoveredCandle(candles[index]);
                }
              }}
              onMouseLeave={() => {
                setMousePos(null);
                setHoveredCandle(null);
              }}
            >
              {/* Subtle Dark Grid Lines */}
              {[350, 340, 330, 320, 310, 300, 290, 280, 270, 260, 250, 240].map((price) => {
                const y = getY(price);
                return (
                  <line
                    key={`grid-y-${price}`}
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

              {/* Live Price Line (Red dashed line across chart at 338.44) */}
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
              {[350, 340, 330, 320, 310, 300, 290, 280, 270, 260, 250, 240].map((price) => {
                const y = getY(price);
                return (
                  <text
                    key={`price-label-${price}`}
                    x={chartWidth - paddingRight + 5}
                    y={y + 3.5}
                    fill="#787b86"
                    fontSize="9.5"
                    fontFamily="monospace"
                  >
                    {price.toFixed(2)}
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

      {/* ── 5. BOTTOM ACCOUNT MANAGER / POSITIONS PANEL (DARK) ── */}
      <div className="border-t border-[#2a2e39] bg-[#131722]">
        {/* Panel Top Header Tab */}
        <div className="flex items-center justify-between px-3 py-1 bg-[#131722] border-b border-[#2a2e39] text-xs font-semibold text-[#787b86]">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsBottomOpen(!isBottomOpen)}
              className="px-3 py-1 rounded-t-md bg-[#1e222d] text-white font-bold text-xs border border-b-0 border-[#2a2e39] shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>Account Manager</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-[#787b86]">Solde: <strong className="text-white">${balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</strong></span>
              <span className="text-[#787b86]">P&amp;L: <strong className={totalOpenProfit >= 0 ? "text-[#089981]" : "text-[#f23645]"}>
                {totalOpenProfit >= 0 ? "+" : ""}${totalOpenProfit.toFixed(2)} USD
              </strong></span>
            </div>

            <div className="flex items-center gap-1 text-[#787b86]">
              <button
                onClick={() => setIsBottomOpen(!isBottomOpen)}
                className="p-1 hover:bg-[#2a2e39] rounded hover:text-white cursor-pointer"
                title="Minimiser"
              >
                <Minimize2 className="size-3.5" />
              </button>
              <button
                className="p-1 hover:bg-[#2a2e39] rounded hover:text-white cursor-pointer"
                title="Agrandir"
              >
                <Maximize2 className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Positions Table Content */}
        {isBottomOpen && (
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
                      Aucune position ouverte actuellement. Utilisez le panneau 1-Click SELL / BUY pour passer un ordre instantané.
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
                          title="Clôturer la position"
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
      </div>
    </div>
  );
}
