import { useState, useEffect, useMemo } from "react";
import {
  Activity,
  AlertCircle,
  BarChart2,
  Bell,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Crosshair,
  ExternalLink,
  Eye,
  FileText,
  Flame,
  Globe,
  Grid,
  HelpCircle,
  Layers,
  LayoutGrid,
  LineChart,
  Lock,
  Maximize2,
  MessageSquare,
  Minus,
  MoreHorizontal,
  MousePointer,
  Newspaper,
  Pause,
  PenTool,
  Percent,
  Play,
  Plus,
  Radio,
  Redo,
  RotateCcw,
  Search,
  Settings,
  Share2,
  Sliders,
  Smile,
  Square,
  Trash2,
  TrendingDown,
  TrendingUp,
  Type,
  Undo,
  Volume2,
  X,
  Zap,
} from "lucide-react";

export interface TradingViewSuperchartProps {
  initialSymbol?: string;
  isTradingActive?: boolean;
  onToggleTrading?: () => void;
}

interface SymbolData {
  symbol: string;
  name: string;
  category: "FOREX" | "CRYPTO";
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  exchange: string;
  vol: string;
  avgVol: string;
  marketCap: string;
  fdMarketCap: string;
  type: string;
  icon?: string;
}

export function TradingViewSuperchart({
  initialSymbol = "BTCUSD",
  isTradingActive = true,
  onToggleTrading,
}: TradingViewSuperchartProps) {
  // Active Symbol State
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [activeTf, setActiveTf] = useState("1W");
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState<
    "watchlist" | "alerts" | "news" | "data" | "hotlists" | "calendar" | "ideas" | "chat" | "notifications" | "order" | "dom" | "tree" | "help"
  >("watchlist");
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>("USDJPY");

  // Multi-Pane heights and controls
  const [showIndicators, setShowIndicators] = useState(true);
  const [liveTick, setLiveTick] = useState(0);

  // Symbol List matching image
  const watchlist: SymbolData[] = [
    {
      symbol: "USDJPY",
      name: "U.S. Dollar / Japanese Yen",
      category: "FOREX",
      price: 146.247,
      change: 0.716,
      changePercent: 0.49,
      currency: "JPY",
      exchange: "OANDA",
      vol: "128.4K",
      avgVol: "142.0K",
      marketCap: "—",
      fdMarketCap: "—",
      type: "Spot · Forex",
    },
    {
      symbol: "GBPUSD",
      name: "British Pound / U.S. Dollar",
      category: "FOREX",
      price: 1.25857,
      change: -0.00867,
      changePercent: -0.68,
      currency: "USD",
      exchange: "FXCM",
      vol: "89.2K",
      avgVol: "95.4K",
      marketCap: "—",
      fdMarketCap: "—",
      type: "Spot · Forex",
    },
    {
      symbol: "EURUSD",
      name: "Euro / U.S. Dollar",
      category: "FOREX",
      price: 1.07731,
      change: -0.00702,
      changePercent: -0.65,
      currency: "USD",
      exchange: "EBS",
      vol: "310.5K",
      avgVol: "340.2K",
      marketCap: "—",
      fdMarketCap: "—",
      type: "Spot · Forex",
    },
    {
      symbol: "ETHUSD",
      name: "Ethereum / U.S. Dollar",
      category: "CRYPTO",
      price: 1637.7,
      change: 0.6,
      changePercent: 0.04,
      currency: "USD",
      exchange: "BITSTAMP",
      vol: "42.5K",
      avgVol: "55.8K",
      marketCap: "196.82B",
      fdMarketCap: "196.82B",
      type: "Spot · Crypto",
    },
    {
      symbol: "BTCUSDT",
      name: "Bitcoin / TetherUS",
      category: "CRYPTO",
      price: 25982.61,
      change: 113.1,
      changePercent: 0.44,
      currency: "USDT",
      exchange: "BINANCE",
      vol: "18.42K",
      avgVol: "22.10K",
      marketCap: "506.12B",
      fdMarketCap: "545.80B",
      type: "Perpetual · Crypto",
    },
    {
      symbol: "BTCUSD",
      name: "Bitcoin / U.S. Dollar",
      category: "CRYPTO",
      price: 25979.0,
      change: 109.0,
      changePercent: 0.42,
      currency: "USD",
      exchange: "BITSTAMP",
      vol: "619",
      avgVol: "1.641K",
      marketCap: "505.953B",
      fdMarketCap: "545.559B",
      type: "Spot · Crypto",
    },
  ];

  const currentSym = watchlist.find((w) => w.symbol === selectedSymbol) ?? watchlist[5];

  // Continuous live price ticking
  useEffect(() => {
    if (!isTradingActive) return;
    const interval = setInterval(() => {
      setLiveTick((prev) => (prev + 1) % 100);
    }, 1200);
    return () => clearInterval(interval);
  }, [isTradingActive]);

  // Dynamic live price calculation
  const dynamicPrice = useMemo(() => {
    const delta = ((liveTick % 10) - 4.5) * (currentSym.category === "FOREX" ? 0.00015 : 1.8);
    return parseFloat((currentSym.price + delta).toFixed(currentSym.category === "FOREX" ? 5 : 2));
  }, [currentSym, liveTick]);

  // Candlestick Data matching the screenshot layout
  const candleBars = [
    { x: 30, o: 56, c: 50, h: 58, l: 45, up: false },
    { x: 50, o: 50, c: 48, h: 52, l: 46, up: false },
    { x: 70, o: 48, c: 54, h: 56, l: 47, up: true },
    { x: 90, o: 54, c: 44, h: 55, l: 42, up: false },
    { x: 110, o: 44, c: 40, h: 46, l: 38, up: false },
    { x: 130, o: 40, c: 46, h: 48, l: 39, up: true },
    { x: 150, o: 46, c: 42, h: 47, l: 40, up: false },
    { x: 170, o: 42, c: 48, h: 50, l: 41, up: true },
    { x: 190, o: 48, c: 43, h: 49, l: 42, up: false },
    { x: 210, o: 43, c: 38, h: 45, l: 36, up: false },
    { x: 230, o: 38, c: 34, h: 40, l: 32, up: false },
    { x: 250, o: 34, c: 30, h: 36, l: 28, up: false },
    { x: 270, o: 30, c: 24, h: 32, l: 22, up: false },
    { x: 290, o: 24, c: 26, h: 28, l: 22, up: true },
    { x: 310, o: 26, c: 21, h: 27, l: 20, up: false },
    { x: 330, o: 21, c: 23, h: 25, l: 20, up: true },
    { x: 350, o: 23, c: 19, h: 24, l: 18, up: false },
    { x: 370, o: 19, c: 22, h: 24, l: 18, up: true },
    { x: 390, o: 22, c: 21, h: 23, l: 19, up: false },
    { x: 410, o: 21, c: 20, h: 22, l: 18, up: false },
    { x: 430, o: 20, c: 17, h: 21, l: 15, up: false },
    { x: 450, o: 17, c: 23, h: 25, l: 16, up: true },
    { x: 470, o: 23, c: 27, h: 29, l: 22, up: true },
    { x: 490, o: 27, c: 29, h: 31, l: 26, up: true },
    { x: 510, o: 29, c: 26, h: 30, l: 25, up: false },
    { x: 530, o: 26, c: 30, h: 32, l: 25, up: true },
    { x: 550, o: 30, c: 34, h: 36, l: 29, up: true },
    { x: 570, o: 34, c: 32, h: 35, l: 30, up: false },
    { x: 590, o: 32, c: 36, h: 38, l: 31, up: true },
    { x: 610, o: 36, c: 35, h: 37, l: 33, up: false },
    { x: 630, o: 35, c: 34, h: 36, l: 32, up: false },
    { x: 650, o: 34, c: 37, h: 39, l: 33, up: true },
    { x: 670, o: 37, c: 33, h: 38, l: 31, up: false },
    { x: 690, o: 33, c: 36, h: 38, l: 32, up: true },
    { x: 710, o: 36, c: 35, h: 37, l: 34, up: false },
  ];

  // MACD Histogram bars (Middle pane)
  const macdBars = [
    { x: 30, h: 42, up: false },
    { x: 50, h: 38, up: false },
    { x: 70, h: 32, up: false },
    { x: 90, h: 25, up: false },
    { x: 110, h: 18, up: false },
    { x: 130, h: 10, up: false },
    { x: 150, h: -5, up: false },
    { x: 170, h: -15, up: false },
    { x: 190, h: -24, up: false },
    { x: 210, h: -36, up: false },
    { x: 230, h: -48, up: false },
    { x: 250, h: -55, up: false },
    { x: 270, h: -62, up: false },
    { x: 290, h: -58, up: false },
    { x: 310, h: -50, up: false },
    { x: 330, h: -42, up: false },
    { x: 350, h: -35, up: true },
    { x: 370, h: -28, up: true },
    { x: 390, h: -20, up: true },
    { x: 410, h: -12, up: true },
    { x: 430, h: -5, up: true },
    { x: 450, h: 8, up: true },
    { x: 470, h: 18, up: true },
    { x: 490, h: 26, up: true },
    { x: 510, h: 32, up: true },
    { x: 530, h: 36, up: true },
    { x: 550, h: 42, up: true },
    { x: 570, h: 39, up: false },
    { x: 590, h: 35, up: false },
    { x: 610, h: 30, up: false },
    { x: 630, h: 22, up: false },
    { x: 650, h: 28, up: true },
    { x: 670, h: 24, up: false },
    { x: 690, h: 32, up: true },
    { x: 710, h: 29, up: false },
  ];

  return (
    <div className="flex flex-col w-full rounded-xl overflow-hidden border border-[#2a2e39] bg-[#131722] text-[#d1d4dc] font-sans shadow-2xl select-none">
      {/* ── 1. MAC OS BROWSER TAB BAR ── */}
      <div className="flex items-center justify-between bg-[#1e222d] border-b border-[#2a2e39] px-3 py-1.5 text-xs">
        {/* Left Mac Window Traffic Lights & Tab */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="size-3 rounded-full bg-[#ff5f56] border border-[#e0443e] inline-block cursor-pointer hover:opacity-80" />
            <span className="size-3 rounded-full bg-[#ffbd2e] border border-[#dea123] inline-block cursor-pointer hover:opacity-80" />
            <span className="size-3 rounded-full bg-[#27c93f] border border-[#1aab29] inline-block cursor-pointer hover:opacity-80" />
          </div>

          {/* Active Tab */}
          <div className="flex items-center gap-2 rounded-t-md bg-[#131722] border-t border-x border-[#2a2e39] px-3 py-1 text-xs font-semibold text-white">
            <span className="text-amber-400 font-bold">₿</span>
            <span>{currentSym.symbol}</span>
            <span className="text-[#089981] font-mono text-[11px] ml-1">
              {dynamicPrice.toLocaleString()} ▲+{currentSym.changePercent}%
            </span>
            <X className="size-3 text-gray-400 hover:text-white cursor-pointer ml-1" />
          </div>

          <button className="text-gray-400 hover:text-white p-1 rounded cursor-pointer">
            <Plus className="size-3.5" />
          </button>
        </div>

        {/* Right Info */}
        <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-[#089981] animate-pulse" />
            FIX PROTOCOL · NY4 EQUINIX
          </span>
          <span>LATENCE: 11ms</span>
        </div>
      </div>

      {/* ── 2. TOP TRADINGVIEW APPLICATION NAVBAR ── */}
      <div className="flex flex-wrap items-center justify-between bg-[#131722] border-b border-[#2a2e39] px-2 py-1 text-xs gap-1">
        {/* Left Navigation Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* TradingView Icon */}
          <div className="px-2 py-1 font-black text-white bg-[#2962ff] rounded text-xs tracking-tighter">
            TV
          </div>

          {/* Symbol Search Button */}
          <button className="flex items-center gap-1.5 rounded px-2.5 py-1 bg-[#1e222d] hover:bg-[#2a2e39] text-white font-bold transition cursor-pointer">
            <Search className="size-3.5 text-gray-400" />
            <span>{currentSym.symbol}</span>
          </button>

          {/* Compare Symbol */}
          <button className="p-1.5 rounded hover:bg-[#2a2e39] text-gray-400 hover:text-white transition cursor-pointer" title="Comparer">
            <Plus className="size-4" />
          </button>

          <div className="h-4 w-[1px] bg-[#2a2e39]" />

          {/* Timeframe Selector */}
          <div className="flex items-center gap-0.5 font-mono">
            {["1m", "5m", "15m", "1H", "4H", "1D", "1W"].map((tf) => (
              <button
                key={tf}
                onClick={() => setActiveTf(tf)}
                className={`px-2 py-1 rounded text-xs transition cursor-pointer ${
                  activeTf === tf ? "text-[#2962ff] font-black bg-[#1e222d]" : "text-gray-400 hover:text-white hover:bg-[#1e222d]"
                }`}
              >
                {tf}
              </button>
            ))}
            <ChevronDown className="size-3 text-gray-400 cursor-pointer" />
          </div>

          <div className="h-4 w-[1px] bg-[#2a2e39]" />

          {/* Chart Type (Candles) */}
          <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#1e222d] text-gray-300 transition cursor-pointer">
            <BarChart2 className="size-4 text-[#089981]" />
            <ChevronDown className="size-3 text-gray-400" />
          </button>

          {/* Indicators */}
          <button
            onClick={() => setShowIndicators(!showIndicators)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition cursor-pointer ${
              showIndicators ? "text-[#2962ff] bg-[#1e222d] font-bold" : "text-gray-300 hover:bg-[#1e222d]"
            }`}
          >
            <Activity className="size-3.5 text-[#2962ff]" />
            <span>Indicateurs</span>
          </button>

          {/* Layout Grid */}
          <button className="p-1.5 rounded hover:bg-[#1e222d] text-gray-400 hover:text-white cursor-pointer" title="Disposition">
            <Grid className="size-4" />
          </button>

          <div className="h-4 w-[1px] bg-[#2a2e39]" />

          {/* Alerts & Replay */}
          <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#1e222d] text-gray-300 cursor-pointer">
            <Clock className="size-3.5 text-amber-400" />
            <span className="hidden sm:inline">Alerte</span>
          </button>
          <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#1e222d] text-gray-300 cursor-pointer">
            <RotateCcw className="size-3.5 text-sky-400" />
            <span className="hidden sm:inline">Replay</span>
          </button>

          {/* Undo / Redo */}
          <button className="p-1 rounded hover:bg-[#1e222d] text-gray-400 hover:text-white cursor-pointer">
            <Undo className="size-3.5" />
          </button>
          <button className="p-1 rounded hover:bg-[#1e222d] text-gray-400 hover:text-white cursor-pointer">
            <Redo className="size-3.5" />
          </button>
        </div>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-1.5">
          {/* Cloud Save */}
          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-[#1e222d] text-gray-300 font-semibold cursor-pointer">
            <span className="text-[#2962ff] font-bold">Supercharts</span>
            <span className="text-[10px] text-gray-400 font-mono">Sauvegardé ☁</span>
          </button>

          <button className="p-1.5 rounded hover:bg-[#1e222d] text-gray-400 hover:text-white cursor-pointer">
            <Search className="size-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-[#1e222d] text-gray-400 hover:text-white cursor-pointer">
            <Settings className="size-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-[#1e222d] text-gray-400 hover:text-white cursor-pointer">
            <Maximize2 className="size-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-[#1e222d] text-gray-400 hover:text-white cursor-pointer">
            <Camera className="size-4" />
          </button>

          {/* Publish Blue Button */}
          <button className="rounded px-3.5 py-1 bg-[#2962ff] hover:bg-[#1e53e5] text-white font-bold transition cursor-pointer shadow">
            Publier
          </button>
        </div>
      </div>

      {/* ── 3. MAIN WORKSPACE (LEFT DRAW BAR + CENTER MULTI-PANE CHART + RIGHT WATCHLIST & DETAILS + FAR-RIGHT ICON STRIP) ── */}
      <div className="flex w-full min-h-[580px] bg-[#000000] relative">
        {/* 3.1 LEFT DRAWING TOOLBAR (14 tools) */}
        <div className="flex flex-col items-center justify-between w-11 bg-[#131722] border-r border-[#2a2e39] py-2 text-gray-400 z-10 shrink-0">
          <div className="flex flex-col items-center gap-2">
            <button className="p-2 rounded hover:bg-[#1e222d] text-[#2962ff] hover:text-white cursor-pointer" title="Curseur / Réticule">
              <Crosshair className="size-4" />
            </button>
            <button className="p-2 rounded hover:bg-[#1e222d] hover:text-white cursor-pointer" title="Lignes de tendance">
              <TrendingUp className="size-4" />
            </button>
            <button className="p-2 rounded hover:bg-[#1e222d] hover:text-white cursor-pointer" title="Fibonacci / Gann">
              <Percent className="size-4" />
            </button>
            <button className="p-2 rounded hover:bg-[#1e222d] hover:text-white cursor-pointer" title="Formes géométriques / Pinceau">
              <PenTool className="size-4" />
            </button>
            <button className="p-2 rounded hover:bg-[#1e222d] hover:text-white cursor-pointer" title="Outils de texte">
              <Type className="size-4" />
            </button>
            <button className="p-2 rounded hover:bg-[#1e222d] hover:text-white cursor-pointer" title="Figures harmoniques / Vagues">
              <Zap className="size-4" />
            </button>
            <button className="p-2 rounded hover:bg-[#1e222d] hover:text-white cursor-pointer" title="Outils de prévision / Position Long & Short">
              <LineChart className="size-4" />
            </button>
            <button className="p-2 rounded hover:bg-[#1e222d] hover:text-white cursor-pointer" title="Icônes & Smileys">
              <Smile className="size-4" />
            </button>
            <button className="p-2 rounded hover:bg-[#1e222d] hover:text-white cursor-pointer" title="Mesure / Règle">
              <Minus className="size-4" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-2 border-t border-[#2a2e39] pt-2">
            <button className="p-2 rounded hover:bg-[#1e222d] hover:text-white cursor-pointer" title="Aimant">
              <Zap className="size-4 text-sky-400" />
            </button>
            <button className="p-2 rounded hover:bg-[#1e222d] hover:text-white cursor-pointer" title="Verrouiller les dessins">
              <Lock className="size-4" />
            </button>
            <button className="p-2 rounded hover:bg-[#1e222d] hover:text-white cursor-pointer" title="Masquer tous les dessins">
              <Eye className="size-4" />
            </button>
            <button className="p-2 rounded hover:bg-[#1e222d] hover:text-rose-400 cursor-pointer" title="Supprimer les dessins">
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>

        {/* 3.2 CENTER MULTI-PANE CHART CANVAS */}
        <div className="flex-1 flex flex-col justify-between bg-[#000000] relative overflow-hidden">
          {/* Subtle Grid Pattern */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#13172240_1px,transparent_1px),linear-gradient(to_bottom,#13172240_1px,transparent_1px)] bg-[size:40px_30px]" />

          {/* ── TOP CHART OVERLAY HEADER ── */}
          <div className="relative z-10 flex items-center justify-between p-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-white text-sm">
                {currentSym.name} · {activeTf} · {currentSym.exchange}
              </span>
              <span className="font-mono text-xs text-[#f23645]">
                {currentSym.change < 0 ? currentSym.change : `+${currentSym.change}`} ({currentSym.changePercent}%)
              </span>
              <span className="text-gray-400 font-mono text-xs">
                Vol <strong className="text-white">{currentSym.vol}</strong>
              </span>
              <span className="rounded bg-[#1e222d] px-1.5 py-0.5 text-[10px] font-mono text-gray-300 font-bold">
                1
              </span>
            </div>

            {/* Trading On/Off Pill */}
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleTrading}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                  isTradingActive
                    ? "bg-[#089981]/20 text-[#089981] border border-[#089981]/40"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                }`}
              >
                <span className={`size-2 rounded-full ${isTradingActive ? "bg-[#089981] animate-ping" : "bg-rose-500"}`} />
                {isTradingActive ? "SCANNER IA ACTIF" : "SCANNER EN PAUSE"}
              </button>
            </div>
          </div>

          {/* ── PANE 1: CANDLESTICKS + BOLLINGER ENVELOPES ── */}
          <div className="relative z-10 h-[280px] w-full flex">
            {/* SVG Candlestick & Smooth Envelopes Area */}
            <div className="flex-1 h-full relative">
              <svg viewBox="0 0 740 280" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="cloud-glow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2962ff" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#2962ff" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Shaded Band between Upper and Lower Blue Lines */}
                <path
                  d="M 20,40 C 140,55 240,115 360,150 C 480,185 600,165 720,135 L 720,225 C 600,240 480,255 360,230 C 240,195 140,140 20,110 Z"
                  fill="url(#cloud-glow)"
                />

                {/* Upper Band (Blue #2962ff) */}
                <path
                  d="M 20,40 C 140,55 240,115 360,150 C 480,185 600,165 720,135"
                  fill="none"
                  stroke="#2962ff"
                  strokeWidth="2"
                />

                {/* Middle Line / Trend MA (Orange #ff9800) */}
                <path
                  d="M 20,75 C 140,95 240,155 360,190 C 480,220 600,200 720,180"
                  fill="none"
                  stroke="#ff9800"
                  strokeWidth="2"
                />

                {/* Lower Band (Blue #2962ff) */}
                <path
                  d="M 20,110 C 140,140 240,195 360,230 C 480,255 600,240 720,225"
                  fill="none"
                  stroke="#2962ff"
                  strokeWidth="2"
                />

                {/* Active Laser Scan Beam */}
                {isTradingActive && (
                  <g>
                    <line
                      x1={300 + (liveTick % 20) * 18}
                      y1="0"
                      x2={300 + (liveTick % 20) * 18}
                      y2="280"
                      stroke="#089981"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      opacity="0.8"
                    />
                    <circle
                      cx={300 + (liveTick % 20) * 18}
                      cy="175"
                      r="4"
                      fill="#089981"
                      className="animate-ping"
                    />
                  </g>
                )}

                {/* Render Candlesticks */}
                {candleBars.map((c, i) => {
                  const scaleY = (val: number) => 270 - val * 4.2;
                  const high = scaleY(c.h);
                  const low = scaleY(c.l);
                  const open = scaleY(c.o);
                  const close = scaleY(c.c);
                  const color = c.up ? "#089981" : "#f23645";

                  return (
                    <g key={i}>
                      {/* Wick line */}
                      <line x1={c.x} y1={high} x2={c.x} y2={low} stroke={color} strokeWidth="1.5" />
                      {/* Body rectangle */}
                      <rect
                        x={c.x - 5.5}
                        y={Math.min(open, close)}
                        width="11"
                        height={Math.max(Math.abs(close - open), 3)}
                        fill={color}
                        rx="0.5"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Right Price Scale Axis */}
            <div className="w-16 border-l border-[#2a2e39] bg-[#000000] text-[11px] font-mono flex flex-col justify-between py-1 px-1.5 shrink-0 text-gray-400 select-none">
              <span>64000</span>
              <span>60000</span>
              <span>56000</span>
              <span>52000</span>
              <span>48000</span>
              <span>44000</span>
              <span>40000</span>
              <span>36000</span>
              <span>32000</span>

              {/* Active Blue Price Tag */}
              <div className="relative -my-1">
                <span className="bg-[#2962ff] text-white px-1.5 py-0.5 rounded font-black text-[10px] block text-center shadow">
                  28642
                </span>
              </div>

              {/* Light Blue Tag */}
              <div className="relative -my-1">
                <span className="bg-[#38bdf8] text-black px-1.5 py-0.5 rounded font-black text-[10px] block text-center shadow">
                  26038
                </span>
              </div>

              {/* Active Red Current Price with Countdown */}
              <div className="relative -my-1">
                <span className="bg-[#f23645] text-white px-1 py-0.5 rounded font-black text-[10px] block text-center shadow">
                  03:43:12
                </span>
              </div>

              {/* Lower Blue Tag */}
              <div className="relative -my-1">
                <span className="bg-[#2962ff] text-white px-1.5 py-0.5 rounded font-black text-[10px] block text-center shadow">
                  23434
                </span>
              </div>

              <span>20000</span>
              <span>16000</span>
              <span>12000</span>
            </div>
          </div>

          {/* ── PANE 2: MACD / VOLUME OSCILLATOR (HISTOGRAM) ── */}
          <div className="relative z-10 h-28 w-full border-t border-[#2a2e39] flex bg-[#000000]">
            <div className="flex-1 h-full relative">
              <svg viewBox="0 0 740 110" className="w-full h-full" preserveAspectRatio="none">
                {/* Zero line */}
                <line x1="0" y1="55" x2="740" y2="55" stroke="#2a2e39" strokeWidth="1" strokeDasharray="3 3" />

                {/* Histogram Bars */}
                {macdBars.map((b, i) => {
                  const zeroY = 55;
                  const barH = Math.abs(b.h) * 0.75;
                  const y = b.h >= 0 ? zeroY - barH : zeroY;
                  const fill = b.h >= 0 ? (b.up ? "#089981" : "#006653") : (b.up ? "#991b1b" : "#f23645");

                  return (
                    <rect
                      key={i}
                      x={b.x - 5}
                      y={y}
                      width="10"
                      height={Math.max(barH, 2)}
                      fill={fill}
                      rx="0.5"
                    />
                  );
                })}
              </svg>
            </div>

            {/* Pane 2 Right Scale */}
            <div className="w-16 border-l border-[#2a2e39] bg-[#000000] text-[10px] font-mono flex flex-col justify-between py-1 px-1.5 shrink-0 text-gray-400">
              <span>10000</span>
              <span className="bg-[#f23645] text-white px-1 py-0.2 rounded font-bold text-[9px] text-center">
                4971
              </span>
              <span>0</span>
              <span>-10000</span>
              <span>-20000</span>
            </div>
          </div>

          {/* ── PANE 3: RSI / STOCHASTIC SUB-OSCILLATOR ── */}
          <div className="relative z-10 h-20 w-full border-t border-[#2a2e39] flex bg-[#000000]">
            <div className="flex-1 h-full relative">
              <svg viewBox="0 0 740 80" className="w-full h-full" preserveAspectRatio="none">
                {/* Upper 60 dotted line */}
                <line x1="0" y1="25" x2="740" y2="25" stroke="#2962ff" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                {/* Lower 40 dotted line */}
                <line x1="0" y1="55" x2="740" y2="55" stroke="#2962ff" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />

                {/* Shaded Channel */}
                <rect x="0" y="25" width="740" height="30" fill="#2962ff" fillOpacity="0.06" />

                {/* RSI Blue Oscillator Line */}
                <path
                  d="M 20,40 C 80,30 140,20 200,45 C 260,70 320,60 380,35 C 440,15 500,50 560,30 C 620,60 680,45 740,42"
                  fill="none"
                  stroke="#2962ff"
                  strokeWidth="1.8"
                />
              </svg>
            </div>

            {/* Pane 3 Right Scale */}
            <div className="w-16 border-l border-[#2a2e39] bg-[#000000] text-[10px] font-mono flex flex-col justify-between py-1 px-1.5 shrink-0 text-gray-400">
              <span>60.00</span>
              <span className="bg-[#2962ff] text-white px-1 py-0.2 rounded font-bold text-[9px] text-center">
                45.74
              </span>
              <span>40.00</span>
            </div>
          </div>

          {/* ── CHART BOTTOM BAR (TIMEFRAMES & DATES) ── */}
          <div className="relative z-10 flex flex-wrap items-center justify-between border-t border-[#2a2e39] bg-[#131722] px-3 py-1.5 text-xs">
            {/* TV Watermark & Dates */}
            <div className="flex items-center gap-4 text-[11px] font-mono text-gray-400">
              <span className="font-black text-white bg-[#1e222d] px-1 rounded">TV</span>
              <span>2022</span>
              <span>Mar</span>
              <span>May</span>
              <span>Jul</span>
              <span>Sep</span>
              <span>Nov</span>
              <span>2023</span>
              <span>Mar</span>
              <span>May</span>
            </div>

            {/* Quick Period Buttons */}
            <div className="flex items-center gap-1 font-mono text-[11px]">
              {["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "All"].map((p) => (
                <button
                  key={p}
                  className="px-1.5 py-0.5 rounded text-gray-400 hover:text-white hover:bg-[#1e222d] cursor-pointer"
                >
                  {p}
                </button>
              ))}
              <Calendar className="size-3.5 text-gray-400 ml-1 cursor-pointer" />
            </div>

            {/* Timezone & Expand */}
            <div className="flex items-center gap-3 font-mono text-[11px] text-gray-400">
              <span>22:16:47 (UTC+2)</span>
              <button className="p-1 rounded hover:bg-[#1e222d] hover:text-white cursor-pointer">
                <Maximize2 className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3.3 RIGHT SIDE WATCHLIST & INSPECTOR PANEL (310px) */}
        {showRightPanel && (
          <div className="w-[310px] bg-[#131722] border-l border-[#2a2e39] flex flex-col justify-between shrink-0 overflow-y-auto animate-in fade-in duration-200">
            {/* Watchlist Header */}
            <div>
              <div className="flex items-center justify-between p-3 border-b border-[#2a2e39]">
                <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                  <span>Watchlist</span>
                  <ChevronDown className="size-3.5 text-gray-400" />
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <button className="p-1 hover:text-white cursor-pointer"><Plus className="size-4" /></button>
                  <button className="p-1 hover:text-white cursor-pointer"><Clock className="size-4" /></button>
                  <button onClick={() => setShowRightPanel(false)} className="p-1 hover:text-white cursor-pointer" title="Réduire"><X className="size-4" /></button>
                </div>
              </div>

            {/* Columns Header */}
            <div className="grid grid-cols-[110px_1fr_60px_50px] px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-gray-400 border-b border-[#2a2e39]">
              <span>Symbol</span>
              <span className="text-right">Last</span>
              <span className="text-right">Chg</span>
              <span className="text-right">Chg%</span>
            </div>

            {/* FOREX SECTION */}
            <div className="border-b border-[#2a2e39]/60">
              <div className="flex items-center gap-1 px-3 py-1 text-[10px] font-bold text-gray-400 uppercase bg-[#1e222d]/50">
                <ChevronDown className="size-3" />
                <span>FOREX</span>
              </div>

              {watchlist.filter((s) => s.category === "FOREX").map((item) => {
                const isSelected = item.symbol === selectedSymbol;
                const isHovered = item.symbol === hoveredSymbol;
                return (
                  <div
                    key={item.symbol}
                    onClick={() => setSelectedSymbol(item.symbol)}
                    onMouseEnter={() => setHoveredSymbol(item.symbol)}
                    className={`grid grid-cols-[110px_1fr_60px_50px] items-center px-3 py-2 text-xs font-mono transition cursor-pointer ${
                      isSelected
                        ? "bg-[#1e222d] ring-1 ring-[#2962ff] text-white"
                        : "hover:bg-[#1e222d]/60 text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[10px]">🇺🇸🇯🇵</span>
                      <span className="font-bold text-white">{item.symbol}</span>
                      {isHovered && <span className="size-1.5 rounded-full bg-[#089981]" />}
                    </div>
                    <span className="text-right font-bold text-white">{item.price}</span>
                    <span className={`text-right ${item.change >= 0 ? "text-[#089981]" : "text-[#f23645]"}`}>
                      {item.change > 0 ? `+${item.change}` : item.change}
                    </span>
                    <span className={`text-right font-bold ${item.changePercent >= 0 ? "text-[#089981]" : "text-[#f23645]"}`}>
                      {item.changePercent > 0 ? `+${item.changePercent}%` : `${item.changePercent}%`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* CRYPTO SECTION */}
            <div className="border-b border-[#2a2e39]">
              <div className="flex items-center gap-1 px-3 py-1 text-[10px] font-bold text-gray-400 uppercase bg-[#1e222d]/50">
                <ChevronDown className="size-3" />
                <span>CRYPTO</span>
              </div>

              {watchlist.filter((s) => s.category === "CRYPTO").map((item) => {
                const isSelected = item.symbol === selectedSymbol;
                return (
                  <div
                    key={item.symbol}
                    onClick={() => setSelectedSymbol(item.symbol)}
                    className={`grid grid-cols-[110px_1fr_60px_50px] items-center px-3 py-2 text-xs font-mono transition cursor-pointer ${
                      isSelected
                        ? "bg-[#1e222d] border-2 border-[#2962ff] text-white"
                        : "hover:bg-[#1e222d]/60 text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-amber-400 font-bold">₿</span>
                      <span className="font-bold text-white">{item.symbol}</span>
                    </div>
                    <span className={`text-right font-bold ${item.changePercent >= 0 ? "text-[#089981]" : "text-[#f23645]"}`}>
                      {item.price.toLocaleString()}
                    </span>
                    <span className={`text-right ${item.change >= 0 ? "text-[#089981]" : "text-[#f23645]"}`}>
                      {item.change > 0 ? `+${item.change}` : item.change}
                    </span>
                    <span className={`text-right font-bold ${item.changePercent >= 0 ? "text-[#089981]" : "text-[#f23645]"}`}>
                      {item.changePercent > 0 ? `+${item.changePercent}%` : `${item.changePercent}%`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ── SYMBOL INSPECTOR DETAIL CARD ── */}
            <div className="p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-amber-500/20 grid place-items-center text-amber-400 font-black text-sm">
                    ₿
                  </div>
                  <div>
                    <h4 className="font-black text-white text-base leading-tight">{currentSym.symbol}</h4>
                    <p className="text-[10px] text-gray-400">{currentSym.name} · {currentSym.exchange}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <LayoutGrid className="size-4 hover:text-white cursor-pointer" />
                  <MoreHorizontal className="size-4 hover:text-white cursor-pointer" />
                </div>
              </div>

              <div className="text-[10px] text-gray-400 font-mono">
                {currentSym.type}
              </div>

              {/* Big Price Readout */}
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-2xl font-black text-white tracking-tight">
                  {dynamicPrice.toLocaleString()}
                </span>
                <span className="text-xs text-gray-400">{currentSym.currency}</span>
                <span className="text-xs font-bold text-[#089981]">
                  +{currentSym.change} (+{currentSym.changePercent}%)
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#089981]">
                <span className="size-2 rounded-full bg-[#089981] animate-pulse" />
                <span>MARKET OPEN</span>
              </div>

              {/* News Ticker Pill */}
              <div className="flex items-start gap-1.5 rounded bg-[#1e222d] p-2 text-[11px] text-gray-300 leading-snug">
                <Zap className="size-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-purple-400 font-normal">7 hours ago</strong> · Bitcoin Price History Rings Bell as BTC Nears Halving
                </span>
              </div>

              {/* Ideas / Minds tabs */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button className="flex items-center justify-between rounded bg-[#1e222d] px-2.5 py-1.5 text-xs text-gray-300 hover:text-white transition cursor-pointer">
                  <span>💡 Ideas</span>
                  <ChevronRight className="size-3 text-gray-500" />
                </button>
                <button className="flex items-center justify-between rounded bg-[#1e222d] px-2.5 py-1.5 text-xs text-gray-300 hover:text-white transition cursor-pointer">
                  <span>🧠 Minds</span>
                  <ChevronRight className="size-3 text-gray-500" />
                </button>
              </div>

              <button className="w-full text-left text-xs text-gray-400 hover:text-white transition cursor-pointer py-1">
                + Add note
              </button>

              {/* Key Stats Grid */}
              <div className="border-t border-[#2a2e39] pt-2 space-y-1.5 font-mono text-[11px]">
                <div className="text-[10px] font-bold text-gray-400 uppercase font-sans">Key stats</div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-[10px]">VOLUME</span>
                  <span className="text-white font-bold">{currentSym.vol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-[10px]">AVERAGE VOLUME (10)</span>
                  <span className="text-white font-bold">{currentSym.avgVol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-[10px]">MARKET CAP</span>
                  <span className="text-white font-bold">{currentSym.marketCap}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-[10px]">FD MARKET CAP</span>
                  <span className="text-white font-bold">{currentSym.fdMarketCap}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3.4 FAR-RIGHT VERTICAL ACTION STRIP (14 icons) */}
        <div className="flex flex-col items-center justify-between w-11 bg-[#131722] border-l border-[#2a2e39] py-2 text-gray-400 z-10 shrink-0">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => {
                setActiveRightTab("watchlist");
                setShowRightPanel(!showRightPanel);
              }}
              className={`p-2 rounded cursor-pointer transition ${
                showRightPanel && activeRightTab === "watchlist" ? "bg-[#2962ff] text-white shadow" : "hover:bg-[#1e222d] hover:text-white"
              }`}
              title="Watchlist & Détails (Afficher / Masquer)"
            >
              <Layers className="size-4" />
            </button>
            <button
              onClick={() => setActiveRightTab("alerts")}
              className={`p-2 rounded cursor-pointer transition ${
                activeRightTab === "alerts" ? "bg-[#2962ff] text-white" : "hover:bg-[#1e222d] hover:text-white"
              }`}
              title="Alertes"
            >
              <Bell className="size-4" />
            </button>
            <button
              onClick={() => setActiveRightTab("news")}
              className={`p-2 rounded cursor-pointer transition ${
                activeRightTab === "news" ? "bg-[#2962ff] text-white" : "hover:bg-[#1e222d] hover:text-white"
              }`}
              title="Actualités"
            >
              <Newspaper className="size-4" />
            </button>
            <button
              onClick={() => setActiveRightTab("data")}
              className={`p-2 rounded cursor-pointer transition ${
                activeRightTab === "data" ? "bg-[#2962ff] text-white" : "hover:bg-[#1e222d] hover:text-white"
              }`}
              title="Fenêtre de données"
            >
              <FileText className="size-4" />
            </button>
            <button
              onClick={() => setActiveRightTab("hotlists")}
              className={`p-2 rounded cursor-pointer transition ${
                activeRightTab === "hotlists" ? "bg-[#2962ff] text-white" : "hover:bg-[#1e222d] hover:text-white"
              }`}
              title="Hotlists"
            >
              <Flame className="size-4" />
            </button>
            <button
              onClick={() => setActiveRightTab("calendar")}
              className={`p-2 rounded cursor-pointer transition ${
                activeRightTab === "calendar" ? "bg-[#2962ff] text-white" : "hover:bg-[#1e222d] hover:text-white"
              }`}
              title="Calendrier"
            >
              <Calendar className="size-4" />
            </button>
            <button
              onClick={() => setActiveRightTab("ideas")}
              className={`p-2 rounded cursor-pointer transition ${
                activeRightTab === "ideas" ? "bg-[#2962ff] text-white" : "hover:bg-[#1e222d] hover:text-white"
              }`}
              title="Mes Idées"
            >
              <Zap className="size-4" />
            </button>
            <button
              onClick={() => setActiveRightTab("chat")}
              className={`p-2 rounded cursor-pointer transition ${
                activeRightTab === "chat" ? "bg-[#2962ff] text-white" : "hover:bg-[#1e222d] hover:text-white"
              }`}
              title="Chats publics"
            >
              <MessageSquare className="size-4" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-2 border-t border-[#2a2e39] pt-2">
            <button
              onClick={() => setActiveRightTab("notifications")}
              className="p-2 rounded hover:bg-[#1e222d] hover:text-white cursor-pointer"
              title="Notifications"
            >
              <Bell className="size-4" />
            </button>
            <button
              onClick={() => setActiveRightTab("dom")}
              className="p-2 rounded hover:bg-[#1e222d] hover:text-white cursor-pointer"
              title="DOM"
            >
              <BarChart2 className="size-4" />
            </button>
            <button
              onClick={() => setActiveRightTab("help")}
              className="p-2 rounded hover:bg-[#1e222d] hover:text-white cursor-pointer"
              title="Centre d'aide"
            >
              <HelpCircle className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. BOTTOM TRADING / TERMINAL BAR ── */}
      <div className="flex items-center justify-between bg-[#1e222d] border-t border-[#2a2e39] px-3 py-1.5 text-xs text-gray-300">
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1 text-gray-400 hover:text-white cursor-pointer">
            <span>Stock Screener</span>
            <ChevronDown className="size-3" />
          </button>
          <button className="flex items-center gap-1 text-gray-400 hover:text-white cursor-pointer">
            <span>Pine Editor</span>
            <ChevronDown className="size-3" />
          </button>
          <button className="flex items-center gap-1 text-gray-400 hover:text-white cursor-pointer">
            <span>Strategy Tester</span>
            <ChevronDown className="size-3" />
          </button>
          <button className="flex items-center gap-1 text-white font-bold cursor-pointer">
            <span className="size-2 rounded-full bg-[#089981] inline-block mr-1" />
            <span>Paper Trading</span>
            <ChevronDown className="size-3" />
          </button>

          <button className="rounded bg-[#0c1017] border border-[#2a2e39] px-3 py-1 text-xs font-bold text-white hover:bg-[#2a2e39] transition cursor-pointer">
            Trade
          </button>
        </div>

        <div className="flex items-center gap-2 text-gray-400">
          <ChevronDown className="size-3.5 hover:text-white cursor-pointer" />
          <Maximize2 className="size-3.5 hover:text-white cursor-pointer" />
        </div>
      </div>
    </div>
  );
}
