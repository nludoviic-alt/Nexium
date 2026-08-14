import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  DollarSign,
  Briefcase,
  History,
  Menu,
  ChevronDown,
  Maximize2,
  Camera,
  Search,
  Crosshair,
  SlidersHorizontal,
  Layers,
  TrendingUp,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface AssetPill {
  symbol: string;
  name: string;
  bgColor: string;
  textColor: string;
  iconBg: string;
}

interface Mt5SimulatedTradingPhoneProps {
  assetType?: "commodities" | "stocks" | "forex";
  title: string;
  description: string;
  pills: AssetPill[];
  badge?: string;
  connectorRight?: boolean;
  isDarkTheme?: boolean;
}

interface Candle {
  id: number;
  open: number;
  close: number;
  high: number;
  low: number;
}

export function Mt5SimulatedTradingPhone({
  assetType = "commodities",
  title,
  description,
  pills,
  badge,
  connectorRight = true,
  isDarkTheme = true,
}: Mt5SimulatedTradingPhoneProps) {
  // Live trading price telemetry
  const [currentPrice, setCurrentPrice] = useState(28797.56);
  const [openPrice] = useState(28566.51);
  const [highPrice, setHighPrice] = useState(28807.49);
  const [lowPrice, setLowPrice] = useState(28566.51);
  const [livePnl, setLivePnl] = useState(-954.03);
  const [balance] = useState(85374.76);
  const [lotSize, setLotSize] = useState(2.5);
  const [activeTab, setActiveTab] = useState<"Market" | "Positions" | "History" | "Menu">("Market");
  const [selectedRange, setSelectedRange] = useState("1D");
  const [notification, setNotification] = useState<string | null>(null);
  const [tickFlash, setTickFlash] = useState<"up" | "down" | null>(null);

  // Initial historic candles resembling the reference screenshot
  const [candles, setCandles] = useState<Candle[]>([
    { id: 1, open: 29800, close: 29750, high: 29880, low: 29720 },
    { id: 2, open: 29750, close: 29680, high: 29790, low: 29640 },
    { id: 3, open: 29680, close: 29820, high: 29890, low: 29650 },
    { id: 4, open: 29820, close: 29900, high: 29980, low: 29780 },
    { id: 5, open: 29900, close: 29810, high: 29940, low: 29770 },
    { id: 6, open: 29810, close: 29500, high: 29850, low: 29480 },
    { id: 7, open: 29500, close: 29320, high: 29550, low: 29280 },
    { id: 8, open: 29320, close: 28980, high: 29350, low: 28920 },
    { id: 9, open: 28980, close: 29150, high: 29220, low: 28950 },
    { id: 10, open: 29150, close: 29080, high: 29190, low: 29020 },
    { id: 11, open: 29080, close: 29380, high: 29450, low: 29050 },
    { id: 12, open: 29380, close: 30200, high: 30320, low: 29320 },
    { id: 13, open: 30200, close: 30050, high: 30390, low: 29980 },
    { id: 14, open: 30050, close: 30250, high: 30300, low: 30000 },
    { id: 15, open: 30250, close: 29950, high: 30280, low: 29900 },
    { id: 16, open: 29950, close: 29600, high: 30000, low: 29550 },
    { id: 17, open: 29600, close: 29100, high: 29650, low: 29050 },
    { id: 18, open: 29100, close: 28950, high: 29150, low: 28880 },
    { id: 19, open: 28950, close: 28720, high: 28990, low: 28650 },
    { id: 20, open: 28720, close: 28900, high: 29020, low: 28680 },
    { id: 21, open: 28900, close: 28680, high: 28950, low: 28600 },
    { id: 22, open: 28680, close: 28797.56, high: 28850, low: 28650 }, // Live forming candle
  ]);

  // Real-Time Tick Engine (Runs smoothly every 1000ms when tab is active)
  const barTimerRef = useRef(0);

  useEffect(() => {
    const tickInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;

      const isUp = Math.random() > 0.47;
      const tickDelta = (Math.random() * 4.2 + 0.4) * (isUp ? 1 : -1);

      setCurrentPrice((prev) => {
        const nextPrice = Number((prev + tickDelta).toFixed(2));
        
        // Update high/low
        setHighPrice((h) => Math.max(h, nextPrice));
        setLowPrice((l) => Math.min(l, nextPrice));

        // Visual flash indicator
        setTickFlash(isUp ? "up" : "down");
        setTimeout(() => setTickFlash(null), 300);

        return nextPrice;
      });

      // Fluctuate PnL realistically with price movement
      setLivePnl((prev) => Number((prev + tickDelta * 0.85).toFixed(2)));

      // Animate current live candle
      setCandles((prevCandles) => {
        const newCandles = [...prevCandles];
        const lastIdx = newCandles.length - 1;
        const current = newCandles[lastIdx];

        const updatedClose = Number((current.close + tickDelta).toFixed(2));
        const updatedHigh = Math.max(current.high, updatedClose);
        const updatedLow = Math.min(current.low, updatedClose);

        newCandles[lastIdx] = {
          ...current,
          close: updatedClose,
          high: updatedHigh,
          low: updatedLow,
        };

        // Every ~8 ticks (~8s), finalize bar and create a new live candle
        barTimerRef.current += 1;
        if (barTimerRef.current >= 8) {
          barTimerRef.current = 0;
          const nextOpen = updatedClose;
          const nextCandle: Candle = {
            id: Date.now(),
            open: nextOpen,
            close: nextOpen + (Math.random() - 0.48) * 3,
            high: nextOpen + 4,
            low: nextOpen - 4,
          };
          return [...newCandles.slice(1), nextCandle];
        }

        return newCandles;
      });
    }, 1000);

    return () => clearInterval(tickInterval);
  }, []);

  const handleOrder = (type: "BUY" | "SELL") => {
    const priceStr = type === "BUY" ? (currentPrice + 25).toFixed(2) : currentPrice.toFixed(2);
    setNotification(`Ordre ${type} (${lotSize} Lots) exécuté à ${priceStr}`);
    if (type === "BUY") {
      setLivePnl((p) => Number((p + 35.2).toFixed(2)));
    } else {
      setLivePnl((p) => Number((p - 18.4).toFixed(2)));
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const sellPrice = currentPrice.toFixed(2);
  const buyPrice = (currentPrice + 25).toFixed(2);

  const formatPriceParts = (price: string) => {
    const [intPart, decPart] = price.split(".");
    return {
      main: intPart + ".",
      cents: decPart || "00",
    };
  };

  const sellParts = formatPriceParts(sellPrice);
  const buyParts = formatPriceParts(buyPrice);

  // SVG Chart Geometry Calculations
  const chartMin = 28400;
  const chartMax = 30600;
  const chartHeight = 220;
  const chartWidth = 320;

  const getY = (val: number) => {
    const norm = (val - chartMin) / (chartMax - chartMin);
    return chartHeight - norm * (chartHeight - 20) - 10;
  };

  const candleSpacing = chartWidth / candles.length;
  const livePriceY = getY(currentPrice);

  return (
    <div className="w-full py-0 px-4 sm:px-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div
          className={`grid grid-cols-1 gap-10 items-center lg:grid-cols-2 ${
            !connectorRight ? "lg:flex-row-reverse" : ""
          }`}
        >
          {/* Left Text Content Column */}
          <div
            className={`flex flex-col items-start ${!connectorRight ? "lg:order-2" : "lg:order-1"}`}
          >
            {badge && (
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-black uppercase tracking-widest ${
                  isDarkTheme
                    ? "bg-[#00D084]/10 border border-[#00D084]/30 text-[#00D084]"
                    : "bg-[#00D084]/15 border border-[#00D084]/30 text-[#059669]"
                }`}
              >
                {badge}
              </span>
            )}
            <h2
              className={`mt-4 text-4xl font-black tracking-tight sm:text-5xl md:text-6xl leading-[1.1] ${
                isDarkTheme ? "text-white" : "text-gray-900"
              }`}
            >
              {title}
            </h2>
            <p
              className={`mt-6 text-base sm:text-lg leading-relaxed font-medium max-w-xl ${
                isDarkTheme ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {description}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                asChild
                className={`rounded-full px-8 py-3.5 text-xs font-black uppercase tracking-wider shadow-lg cursor-pointer hover:scale-105 transition-all ${
                  isDarkTheme
                    ? "neon-btn text-[#021a11]"
                    : "bg-[#0d141e] hover:bg-black text-white"
                }`}
              >
                <Link to="/robots">
                  <span>{isDarkTheme ? "Ouvrir un Compte Démo" : "DÉCOUVRIR LES STRATÉGIES"}</span>
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className={`rounded-full px-8 py-3.5 text-xs font-black uppercase tracking-wider cursor-pointer hover:scale-105 transition-all ${
                  isDarkTheme
                    ? "border-white/20 bg-white/5 text-white hover:bg-white/10"
                    : "border-gray-300 bg-white hover:bg-gray-100 text-gray-900 shadow-sm"
                }`}
              >
                <Link to="/how-it-works">MODE D'EMPLOI MT5</Link>
              </Button>
            </div>
          </div>

          {/* Right Mobile Phone Showcase Column (Exact Match to User Reference Image) */}
          <div
            className={`relative flex items-center justify-center ${
              !connectorRight ? "lg:order-1" : "lg:order-2"
            }`}
          >
            {/* Phone Outer Container */}
            <div className="relative z-10 w-full max-w-[340px] sm:max-w-[360px]">
              
              {/* Notification Toast */}
              {notification && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-[#00cfb4] text-[#030712] px-4 py-2 text-xs font-black shadow-2xl animate-bounce whitespace-nowrap">
                  {notification}
                </div>
              )}

              {/* iPhone Hardware Outer Frame (Deep Graphite / Titanium) */}
              <div className="relative rounded-[48px] border-[9px] border-[#0f172a] bg-[#030712] p-2.5 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_45px_rgba(0,207,180,0.14)] ring-1 ring-white/10">
                
                {/* Dynamic Island Speaker Notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 h-4 w-22 rounded-full bg-black flex items-center justify-between px-2.5">
                  <span className="size-1.5 rounded-full bg-[#1e293b]" />
                  <span className="size-1.5 rounded-full bg-[#00cfb4]/80 animate-ping" />
                </div>

                {/* Smartphone Screen Inner */}
                <div className="relative h-[580px] w-full rounded-[36px] bg-[#070c14] overflow-hidden text-white flex flex-col justify-between font-sans border border-slate-800/80 select-none">
                  
                  {/* APP TOP BAR : BACK | ACCOUNT ID | BALANCE | P/L */}
                  <div className="pt-7 px-3.5 pb-2.5 bg-[#0d1522] border-b border-slate-800/80 flex items-center justify-between z-30">
                    <div className="flex items-center gap-2">
                      <button className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                        <ArrowLeft className="size-5" />
                      </button>
                      <div className="rounded-lg border border-[#00cfb4]/70 bg-[#00cfb4]/10 px-2.5 py-1 text-[11px] font-mono font-bold text-[#00cfb4] shadow-sm">
                        460151793
                      </div>
                    </div>

                    <div className="flex flex-col items-center leading-none">
                      <span className="text-[9px] text-gray-400 font-medium">Balance</span>
                      <span className="text-xs font-black text-white font-mono mt-0.5">
                        {balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 leading-none">
                      <div className="flex flex-col text-right">
                        <span className="text-[9px] text-gray-400 font-medium">P/L</span>
                        <span
                          className={`text-xs font-black font-mono mt-0.5 transition-colors duration-200 ${
                            livePnl >= 0 ? "text-[#00cfb4]" : "text-[#f43f5e]"
                          }`}
                        >
                          ${livePnl >= 0 ? `+${livePnl.toFixed(2)}` : livePnl.toFixed(2)}
                        </span>
                      </div>
                      <ChevronDown className="size-3 text-gray-400 ml-0.5" />
                    </div>
                  </div>

                  {/* CHART TOOLBAR ICONS */}
                  <div className="px-3 py-1.5 bg-[#070c14] border-b border-slate-800/80 flex items-center justify-between text-gray-400 text-xs">
                    <div className="flex items-center gap-3">
                      <Crosshair className="size-3.5 text-gray-300 hover:text-[#00cfb4] cursor-pointer transition-colors" />
                      <span className="text-[10px] font-mono font-bold text-[#00cfb4] bg-[#00cfb4]/10 px-1 rounded">
                        4h
                      </span>
                      <SlidersHorizontal className="size-3.5 text-gray-300 hover:text-white cursor-pointer" />
                      <span className="text-xs font-mono text-gray-500">/</span>
                      <Layers className="size-3.5 text-gray-300 hover:text-white cursor-pointer" />
                      <TrendingUp className="size-3.5 text-gray-300 hover:text-white cursor-pointer" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Search className="size-3.5 text-gray-300 hover:text-white cursor-pointer" />
                      <Maximize2 className="size-3.5 text-gray-300 hover:text-white cursor-pointer" />
                      <Camera className="size-3.5 text-gray-300 hover:text-white cursor-pointer" />
                    </div>
                  </div>

                  {/* OHLC TELEMETRY VALUES ROW */}
                  <div className="px-3.5 py-1 bg-[#090f19] flex items-center justify-between text-[10px] font-mono text-gray-300 border-b border-slate-800/40">
                    <div>
                      <span className="text-gray-500">O:</span> {openPrice.toFixed(2)}
                    </div>
                    <div>
                      <span className="text-gray-500">H:</span> {highPrice.toFixed(2)}
                    </div>
                    <div>
                      <span className="text-gray-500">L:</span> {lowPrice.toFixed(2)}
                    </div>
                    <div className={`transition-colors duration-200 ${tickFlash === "up" ? "text-[#00cfb4] font-bold" : tickFlash === "down" ? "text-[#f43f5e] font-bold" : "text-white"}`}>
                      <span className="text-gray-500">C:</span> {currentPrice.toFixed(2)}
                    </div>
                  </div>

                  {/* LIVE VECTOR CANDLESTICK CHART AREA */}
                  <div className="relative flex-1 bg-[#060a10] flex flex-col justify-between overflow-hidden">
                    {/* Background Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 select-none">
                      <span className="text-7xl font-black font-mono tracking-widest text-white">
                        BTCUSD
                      </span>
                    </div>

                    {/* SVG Canvas for High-Precision Candlestick Chart */}
                    <div className="relative w-full h-full">
                      <svg
                        className="w-full h-full overflow-visible"
                        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                        preserveAspectRatio="none"
                      >
                        {/* Horizontal Price Grid Lines */}
                        {[30577.9, 30168.3, 29758.7, 29349.1, 28939.5, 28529.9].map((p, i) => {
                          const y = getY(p);
                          return (
                            <g key={i}>
                              <line
                                x1="0"
                                y1={y}
                                x2={chartWidth - 55}
                                y2={y}
                                stroke="#142236"
                                strokeWidth="0.8"
                                strokeDasharray="3 3"
                              />
                              <text
                                x={chartWidth - 50}
                                y={y + 3}
                                fill="#64748b"
                                fontSize="9"
                                fontFamily="monospace"
                              >
                                {p.toFixed(2)}
                              </text>
                            </g>
                          );
                        })}

                        {/* Candlesticks Render */}
                        {candles.map((c, i) => {
                          const x = i * candleSpacing + 8;
                          const isGreen = c.close >= c.open;
                          const color = isGreen ? "#00cfb4" : "#f43f5e";
                          const isLiveCandle = i === candles.length - 1;

                          const yOpen = getY(c.open);
                          const yClose = getY(c.close);
                          const yHigh = getY(c.high);
                          const yLow = getY(c.low);

                          const bodyTop = Math.min(yOpen, yClose);
                          const bodyHeight = Math.max(3, Math.abs(yClose - yOpen));
                          const candleWidth = Math.max(6, candleSpacing * 0.7);

                          return (
                            <g key={c.id || i} className={isLiveCandle ? "animate-pulse" : ""}>
                              {/* Wick Line */}
                              <line
                                x1={x + candleWidth / 2}
                                y1={yHigh}
                                x2={x + candleWidth / 2}
                                y2={yLow}
                                stroke={color}
                                strokeWidth="1.4"
                              />
                              {/* Candle Body */}
                              <rect
                                x={x}
                                y={bodyTop}
                                width={candleWidth}
                                height={bodyHeight}
                                fill={color}
                                rx="1"
                                filter={isLiveCandle ? `drop-shadow(0 0 6px ${color})` : undefined}
                              />
                            </g>
                          );
                        })}

                        {/* Live Bid/Ask Price Horizontal Tracking Line */}
                        <line
                          x1="0"
                          y1={livePriceY}
                          x2={chartWidth - 55}
                          y2={livePriceY}
                          stroke="#00cfb4"
                          strokeWidth="1.2"
                          strokeDasharray="4 3"
                          opacity="0.85"
                        />
                        {/* Flashing dot on live candle */}
                        <circle
                          cx={(candles.length - 1) * candleSpacing + 12}
                          y={livePriceY}
                          r="2.5"
                          fill="#00cfb4"
                          className="animate-ping"
                        />
                      </svg>

                      {/* Right Axis Live Price Badge Pill */}
                      <div
                        className="absolute right-0 z-30 transition-all duration-150"
                        style={{
                          top: `${(livePriceY / chartHeight) * 100}%`,
                          transform: "translateY(-50%)",
                        }}
                      >
                        <div className="rounded-l bg-[#00cfb4] text-[#030712] px-2 py-0.5 text-[10px] font-mono font-black shadow-lg flex items-center">
                          {currentPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Date Scale */}
                    <div className="relative z-10 flex items-center justify-between text-[9px] font-mono text-gray-500 px-3 py-1 border-t border-slate-800/80 pr-14 bg-[#070c14]">
                      <span>16 Apr</span>
                      <span>17 Apr</span>
                      <span>18 Apr</span>
                      <span>19 Apr</span>
                      <span>20 Apr</span>
                    </div>
                  </div>

                  {/* TIMEFRAME SELECTOR BAR */}
                  <div className="px-2 py-1 bg-[#0a111a] border-y border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-gray-400">
                    {["1D", "7D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "All"].map((range) => (
                      <button
                        key={range}
                        onClick={() => setSelectedRange(range)}
                        className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                          selectedRange === range
                            ? "bg-slate-700 text-white font-bold"
                            : "hover:text-white"
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>

                  {/* SYMBOL TITLE & ACTION PILLS */}
                  <div className="px-3.5 py-2 bg-[#0c1420] flex items-center justify-between border-b border-slate-800/40">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-[#f59e0b] flex items-center justify-center text-xs font-black text-black shadow-md">
                        ₿
                      </div>
                      <span className="text-xs font-black text-white font-mono tracking-wide">
                        BTCUSD
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-gray-300">
                        TP/SL
                      </span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-gray-300">
                        Info
                      </span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-gray-300">
                        Pending
                      </span>
                    </div>
                  </div>

                  {/* ONE-CLICK TRADING BUTTONS : SELL | LOT SIZE | BUY */}
                  <div className="px-3 pt-2 pb-1 bg-[#0c1420]">
                    <div className="grid grid-cols-3 gap-2 items-center">
                      {/* SELL BUTTON (Coral / Red) */}
                      <button
                        onClick={() => handleOrder("SELL")}
                        className="rounded-xl bg-[#f43f5e] hover:bg-[#e11d48] active:scale-95 text-white p-2 flex flex-col items-center justify-center shadow-lg transition-transform cursor-pointer"
                      >
                        <span className="text-[10px] font-black tracking-wider uppercase opacity-90">
                          SELL
                        </span>
                        <div className="flex items-baseline font-mono font-black text-xs sm:text-sm">
                          <span>{sellParts.main}</span>
                          <span className="text-base font-black ml-0.5">{sellParts.cents}</span>
                        </div>
                      </button>

                      {/* LOT SIZE CONTROL (Center) */}
                      <div className="rounded-xl bg-[#070c14] border border-slate-700 p-1.5 flex flex-col items-center justify-center">
                        <span className="text-sm font-black font-mono text-white">
                          {lotSize.toFixed(1)}
                        </span>
                        <div className="flex items-center gap-3 mt-1">
                          <button
                            onClick={() => setLotSize((l) => Math.max(0.1, Number((l - 0.5).toFixed(1))))}
                            className="size-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer text-xs font-bold"
                          >
                            -
                          </button>
                          <button
                            onClick={() => setLotSize((l) => Number((l + 0.5).toFixed(1)))}
                            className="size-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* BUY BUTTON (Cyan / Teal) */}
                      <button
                        onClick={() => handleOrder("BUY")}
                        className="rounded-xl bg-[#00cfb4] hover:bg-[#14b8a6] active:scale-95 text-[#030712] p-2 flex flex-col items-center justify-center shadow-lg transition-transform cursor-pointer"
                      >
                        <span className="text-[10px] font-black tracking-wider uppercase opacity-90">
                          BUY
                        </span>
                        <div className="flex items-baseline font-mono font-black text-xs sm:text-sm">
                          <span>{buyParts.main}</span>
                          <span className="text-base font-black ml-0.5">{buyParts.cents}</span>
                        </div>
                      </button>
                    </div>

                    {/* MARGIN / SPREAD / PIP VALUE INFO */}
                    <div className="mt-2 flex items-center justify-between text-[9px] font-mono text-gray-400 px-1">
                      <div className="flex flex-col">
                        <span className="text-gray-500">Margin required</span>
                        <span className="font-bold text-white">720.56</span>
                      </div>
                      <div className="flex flex-col text-center">
                        <span className="text-gray-500">Spread</span>
                        <span className="font-bold text-white">2500.00 POINTS</span>
                        <span className="text-[8px] text-gray-400">62.50</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-gray-500">Pip value</span>
                        <span className="font-bold text-white">0.0250</span>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM MOBILE NAVIGATION BAR */}
                  <div className="px-4 py-2.5 bg-[#070c14] border-t border-slate-800 flex items-center justify-between z-30">
                    <button
                      onClick={() => setActiveTab("Market")}
                      className={`flex flex-col items-center gap-0.5 cursor-pointer ${
                        activeTab === "Market" ? "text-white" : "text-gray-500"
                      }`}
                    >
                      <DollarSign className="size-4" />
                      <span className="text-[9px] font-semibold">Market</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("Positions")}
                      className={`flex flex-col items-center gap-0.5 cursor-pointer ${
                        activeTab === "Positions" ? "text-white" : "text-gray-500"
                      }`}
                    >
                      <Briefcase className="size-4" />
                      <span className="text-[9px] font-semibold">Positions</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("History")}
                      className={`flex flex-col items-center gap-0.5 cursor-pointer ${
                        activeTab === "History" ? "text-white" : "text-gray-500"
                      }`}
                    >
                      <History className="size-4" />
                      <span className="text-[9px] font-semibold">History</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("Menu")}
                      className={`flex flex-col items-center gap-0.5 cursor-pointer ${
                        activeTab === "Menu" ? "text-white" : "text-gray-500"
                      }`}
                    >
                      <Menu className="size-4" />
                      <span className="text-[9px] font-semibold">Menu</span>
                    </button>
                  </div>

                  {/* Home Bar indicator */}
                  <div className="h-4 w-full bg-[#070c14] flex items-center justify-center pb-1">
                    <div className="h-1 w-24 rounded-full bg-gray-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Connecting Wire + Floating Asset Pills (Harmonized with Luxury Dark Theme) */}
            <div className="hidden md:flex flex-col gap-4 absolute -right-10 lg:-right-20 top-1/2 -translate-y-1/2 z-20">
              {/* Connector Wire SVG */}
              <svg className="absolute -left-16 top-1/2 -translate-y-1/2 w-16 h-32 pointer-events-none overflow-visible">
                <path
                  d="M0 64 C 30 64, 30 20, 64 20"
                  fill="none"
                  stroke="#00cfb4"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />
                <path
                  d="M0 64 C 30 64, 30 108, 64 108"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />
              </svg>

              {/* Asset Pills */}
              {pills.map((pill, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3.5 rounded-2xl p-4 sm:p-5 shadow-2xl min-w-[200px] transition-transform hover:scale-105 border border-white/10 backdrop-blur-md"
                  style={{ background: pill.bgColor, color: pill.textColor }}
                >
                  <div
                    className="flex size-9 sm:size-10 items-center justify-center rounded-full shadow-md text-base font-black"
                    style={{ backgroundColor: pill.iconBg }}
                  >
                    ✦
                  </div>
                  <span className="text-xl sm:text-2xl font-black tracking-wider uppercase">
                    {pill.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
