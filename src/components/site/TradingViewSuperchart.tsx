import { useState, useEffect, useMemo, useRef } from "react";
import {
  TrendingUp,
  Activity,
  Sparkles,
  Play,
  Pause,
} from "lucide-react";

export interface TradingViewSuperchartProps {
  initialSymbol?: string;
  isTradingActive?: boolean;
  onToggleTrading?: () => void;
}

interface Candle {
  id: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  up: boolean;
  time: string;
}

interface AISignal {
  id: number;
  candleIndex: number;
  type: "BUY" | "SELL";
  score: number;
  price: number;
  tp: number;
  sl: number;
}

export function TradingViewSuperchart({
  initialSymbol = "XAUUSD",
  isTradingActive = true,
  onToggleTrading,
}: TradingViewSuperchartProps) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState<"1m" | "5m" | "15m" | "1H" | "4H" | "1D">("1H");
  const [showEMA, setShowEMA] = useState(true);
  const [showSignals, setShowSignals] = useState(true);
  const [showVolume, setShowVolume] = useState(true);

  // Sync symbol when initialSymbol prop changes
  useEffect(() => {
    if (initialSymbol) {
      setSymbol(initialSymbol);
    }
  }, [initialSymbol]);

  // Symbol display metadata
  const symbolMeta = useMemo(() => {
    const sym = symbol.toUpperCase();
    if (sym.includes("XAU") || sym.includes("GOLD")) {
      return {
        name: "Or / U.S. Dollar",
        pair: "XAUUSD",
        basePrice: 2388.50,
        pipDecimals: 2,
        prefix: "$",
        change: "+14.30",
        changePct: "+0.61%",
        category: "MÉTAUX",
      };
    } else if (sym.includes("EUR")) {
      return {
        name: "Euro / U.S. Dollar",
        pair: "EURUSD",
        basePrice: 1.08580,
        pipDecimals: 5,
        prefix: "",
        change: "+0.00340",
        changePct: "+0.31%",
        category: "FOREX",
      };
    } else if (sym.includes("NAS") || sym.includes("US100")) {
      return {
        name: "Nasdaq 100 Index",
        pair: "NAS100",
        basePrice: 18450.20,
        pipDecimals: 2,
        prefix: "$",
        change: "+112.50",
        changePct: "+0.61%",
        category: "INDICES",
      };
    } else if (sym.includes("BTC")) {
      return {
        name: "Bitcoin / U.S. Dollar",
        pair: "BTCUSD",
        basePrice: 61420.00,
        pipDecimals: 2,
        prefix: "$",
        change: "+840.00",
        changePct: "+1.38%",
        category: "CRYPTO",
      };
    }
    return {
      name: `${sym} / Spot Market`,
      pair: sym,
      basePrice: 100.00,
      pipDecimals: 2,
      prefix: "$",
      change: "+0.85",
      changePct: "+0.85%",
      category: "ACTIF",
    };
  }, [symbol]);

  // Active Candlestick Stream State
  const [candles, setCandles] = useState<Candle[]>([]);
  const [signals, setSignals] = useState<AISignal[]>([]);
  const [currentLivePrice, setCurrentLivePrice] = useState<string>(symbolMeta.basePrice.toFixed(symbolMeta.pipDecimals));
  const candleCountRef = useRef(34);

  // Initialize initial history bars
  useEffect(() => {
    const list: Candle[] = [];
    let price = symbolMeta.basePrice * 0.992;
    const count = 34;

    for (let i = 0; i < count; i++) {
      const isUp = (i % 3 !== 0) || i > 22;
      const move = (Math.sin(i * 0.45) * 1.6 + (i * 0.15)) * (symbolMeta.pipDecimals === 5 ? 0.00035 : 1.4);
      const open = price;
      const close = isUp ? open + Math.abs(move) + (symbolMeta.pipDecimals === 5 ? 0.0001 : 0.4) : open - Math.abs(move) - (symbolMeta.pipDecimals === 5 ? 0.0001 : 0.4);
      const high = Math.max(open, close) + Math.random() * (symbolMeta.pipDecimals === 5 ? 0.0002 : 0.9);
      const low = Math.min(open, close) - Math.random() * (symbolMeta.pipDecimals === 5 ? 0.0002 : 0.9);
      const vol = Math.floor(1200 + Math.random() * 2400);

      price = close;
      list.push({
        id: i,
        open,
        close,
        high,
        low,
        volume: vol,
        up: close >= open,
        time: `${12 + Math.floor(i / 2)}:${(i % 2) * 30 || "00"}`,
      });
    }

    setCandles(list);
    candleCountRef.current = count;
    setCurrentLivePrice(list[list.length - 1].close.toFixed(symbolMeta.pipDecimals));

    // Initial AI Signal
    setSignals([
      {
        id: 1,
        candleIndex: 26,
        type: "BUY",
        score: 94,
        price: list[26].close,
        tp: list[26].close * 1.012,
        sl: list[26].close * 0.994,
      },
    ]);
  }, [symbolMeta]);

  // LIVE REAL-TIME CONTINUOUS CANDLESTICK STREAMING & SCROLLING ENGINE
  useEffect(() => {
    if (!isTradingActive) return;

    // 1. Tick generator (every 500ms updates current rightmost bar)
    const tickInterval = setInterval(() => {
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const lastIdx = prev.length - 1;
        const last = prev[lastIdx];

        const tickVariation = (Math.random() - 0.48) * (symbolMeta.pipDecimals === 5 ? 0.00015 : 0.65);
        const newClose = parseFloat((last.close + tickVariation).toFixed(symbolMeta.pipDecimals));
        const newHigh = Math.max(last.high, newClose);
        const newLow = Math.min(last.low, newClose);
        const newVolume = last.volume + Math.floor(Math.random() * 45);

        setCurrentLivePrice(newClose.toFixed(symbolMeta.pipDecimals));

        const updated = [...prev];
        updated[lastIdx] = {
          ...last,
          close: newClose,
          high: newHigh,
          low: newLow,
          volume: newVolume,
          up: newClose >= last.open,
        };
        return updated;
      });
    }, 500);

    // 2. New Candle Scroll Generator (Every 3.2 seconds, spawns a new bar and shifts chart left)
    const newBarInterval = setInterval(() => {
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];

        // Shift existing candles left (remove oldest)
        const nextId = ++candleCountRef.current;
        const isUp = Math.random() > 0.42;
        const open = last.close;
        const move = (Math.random() * 0.9 + 0.2) * (symbolMeta.pipDecimals === 5 ? 0.0003 : 1.2);
        const close = isUp ? open + move : open - move;
        const high = Math.max(open, close) + Math.random() * (symbolMeta.pipDecimals === 5 ? 0.00015 : 0.7);
        const low = Math.min(open, close) - Math.random() * (symbolMeta.pipDecimals === 5 ? 0.00015 : 0.7);

        const newCandle: Candle = {
          id: nextId,
          open,
          close,
          high,
          low,
          volume: Math.floor(800 + Math.random() * 1800),
          up: isUp,
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        };

        // Randomly generate new AI signal when momentum is high
        if (Math.random() > 0.78) {
          setSignals((prevSig) => [
            ...prevSig.slice(-2),
            {
              id: Date.now(),
              candleIndex: 33, // right edge
              type: isUp ? "BUY" : "SELL",
              score: Math.floor(85 + Math.random() * 12),
              price: close,
              tp: close * (isUp ? 1.008 : 0.992),
              sl: close * (isUp ? 0.994 : 1.006),
            },
          ]);
        }

        // Keep last 34 candles for smooth scrolling window
        return [...prev.slice(1), newCandle];
      });
    }, 3200);

    return () => {
      clearInterval(tickInterval);
      clearInterval(newBarInterval);
    };
  }, [isTradingActive, symbolMeta]);

  // Dynamic Scale Range calculation
  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (candles.length === 0) return { minPrice: 100, maxPrice: 200, priceRange: 100 };
    let min = Infinity;
    let max = -Infinity;
    candles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    });
    const padding = (max - min) * 0.08 || (symbolMeta.pipDecimals === 5 ? 0.0005 : 1);
    return {
      minPrice: min - padding,
      maxPrice: max + padding,
      priceRange: (max + padding) - (min - padding),
    };
  }, [candles, symbolMeta]);

  const getY = (val: number) => {
    return 260 - ((val - minPrice) / (priceRange || 1)) * 210;
  };

  // EMA generator
  const ema20Path = useMemo(() => {
    if (candles.length === 0) return "";
    const points = candles.map((c, i) => {
      const avg = (c.open + c.close + c.high + c.low) / 4;
      const x = 20 + i * 27;
      const y = getY(avg);
      return `${x},${y}`;
    });
    return `M ${points.join(" L ")}`;
  }, [candles, minPrice, priceRange]);

  const ema50Path = useMemo(() => {
    if (candles.length === 0) return "";
    const points = candles.map((c, i) => {
      const avg = (c.open + c.close) / 2;
      const x = 20 + i * 27;
      const y = getY(avg - (symbolMeta.pipDecimals === 5 ? 0.00015 : 0.6));
      return `${x},${y}`;
    });
    return `M ${points.join(" L ")}`;
  }, [candles, minPrice, priceRange, symbolMeta]);

  const lastY = getY(parseFloat(currentLivePrice));

  return (
    <div className="flex flex-col w-full rounded-2xl overflow-hidden admin-card border border-slate-700/60 bg-[#0c1220] shadow-2xl">
      {/* ── 1. HEADER DU GRAPHIQUE ÉPURÉ & PROFESSIONNEL ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/50 bg-[#0f172a]/95 px-4 py-3">
        {/* Symbole & Prix en Direct avec Pulse */}
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 font-bold text-emerald-400 font-mono shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            {symbolMeta.pair.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white tracking-tight font-sans">
                {symbolMeta.pair}
              </h3>
              <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 font-bold">
                {symbolMeta.category}
              </span>
              <span className="hidden sm:inline text-xs text-slate-400 font-medium truncate max-w-[140px]">
                {symbolMeta.name}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 font-mono">
              <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                {symbolMeta.prefix}{currentLivePrice}
              </span>
              <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                <TrendingUp className="size-3 mr-1" />
                {symbolMeta.changePct}
              </span>
            </div>
          </div>
        </div>

        {/* Contrôles (Unités de Temps, Indicateurs & Live Status) */}
        <div className="flex items-center gap-2">
          {/* Timeframe Selector */}
          <div className="flex items-center rounded-xl border border-slate-700/60 bg-[#0b1220] p-0.5 text-xs font-mono">
            {(["1m", "5m", "15m", "1H", "4H", "1D"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`rounded-lg px-2.5 py-1 font-bold transition cursor-pointer ${
                  timeframe === tf
                    ? "bg-emerald-500 text-black shadow font-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Indicators Toggle */}
          <button
            onClick={() => setShowEMA(!showEMA)}
            className={`hidden md:flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold font-mono transition cursor-pointer ${
              showEMA
                ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300"
                : "border-slate-700/60 bg-[#0b1220] text-slate-400 hover:text-white"
            }`}
            title="Moyennes Mobiles Exponentielles"
          >
            <Activity className="size-3.5" />
            <span>EMA 20/50</span>
          </button>

          {/* Signaux IA Toggle */}
          <button
            onClick={() => setShowSignals(!showSignals)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold font-mono transition cursor-pointer ${
              showSignals
                ? "border-amber-500/40 bg-amber-500/15 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                : "border-slate-700/60 bg-[#0b1220] text-slate-400 hover:text-white"
            }`}
            title="Afficher les points d'entrée et de sortie calculés par l'IA"
          >
            <Sparkles className="size-3.5 text-amber-400" />
            <span className="hidden sm:inline">Signaux IA</span>
          </button>
        </div>
      </div>

      {/* ── 2. SURFACE DU GRAPHIQUE EN BOUGIES (DÉFILEMENT EN TEMPS RÉEL) ── */}
      <div className="relative w-full h-[360px] sm:h-[400px] bg-[#070b14] select-none overflow-hidden">
        {/* Grille d'arrière-plan */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_2rem]" />

        {/* Live Streaming Badge */}
        <div className="absolute top-3 left-4 z-10 flex items-center gap-2 text-[11px] font-mono">
          {isTradingActive ? (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-emerald-400 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
              FLUX DIRECT NY4 (DÉFILEMENT ACTIF)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 text-rose-300 font-bold">
              <Pause className="size-3" />
              SCANNER EN PAUSE
            </span>
          )}
          <span className="hidden sm:inline text-slate-400">• Latence: 11ms</span>
          <span className="hidden sm:inline text-slate-400">• FIX L2 Feed</span>
        </div>

        {/* SVG Streaming Engine */}
        <svg
          viewBox="0 0 960 340"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Lignes Horizontales de Prix */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => {
            const priceLevel = (minPrice + priceRange * (1 - ratio)).toFixed(symbolMeta.pipDecimals);
            const y = 30 + ratio * 240;
            return (
              <g key={i}>
                <line
                  x1="0"
                  y1={y}
                  x2="890"
                  y2={y}
                  stroke="#334155"
                  strokeWidth="0.6"
                  strokeDasharray="4 4"
                  strokeOpacity="0.4"
                />
                <text
                  x="898"
                  y={y + 3}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="start"
                >
                  {priceLevel}
                </text>
              </g>
            );
          })}

          {/* Volume Sub-Pane */}
          {showVolume &&
            candles.map((c, i) => {
              const barHeight = Math.min((c.volume / 4000) * 45, 45);
              const x = 20 + i * 27;
              const y = 310 - barHeight;
              return (
                <rect
                  key={`vol-${c.id}`}
                  x={x - 4.5}
                  y={y}
                  width="9"
                  height={barHeight}
                  fill={c.up ? "#10b981" : "#f43f5e"}
                  opacity="0.3"
                  rx="1"
                />
              );
            })}

          {/* EMA Curves */}
          {showEMA && (
            <>
              <path
                d={ema20Path}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.6"
                strokeOpacity="0.85"
              />
              <path
                d={ema50Path}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.6"
                strokeOpacity="0.75"
              />
            </>
          )}

          {/* Streaming Candlesticks */}
          {candles.map((c, i) => {
            const x = 20 + i * 27;
            const yOpen = getY(c.open);
            const yClose = getY(c.close);
            const yHigh = getY(c.high);
            const yLow = getY(c.low);
            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(Math.abs(yClose - yOpen), 2.5);
            const isBullish = c.up;
            const color = isBullish ? "#10b981" : "#f43f5e";
            const isLast = i === candles.length - 1;

            return (
              <g key={`candle-${c.id}`}>
                {/* Mèche */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={color}
                  strokeWidth={isLast ? "1.8" : "1.4"}
                  strokeLinecap="round"
                />
                {/* Corps de la bougie */}
                <rect
                  x={x - 5.5}
                  y={bodyTop}
                  width="11"
                  height={bodyHeight}
                  fill={color}
                  rx="1.5"
                  className={isLast && isTradingActive ? "animate-pulse" : ""}
                />
              </g>
            );
          })}

          {/* Signaux Algorithmiques IA Dynamiques */}
          {showSignals &&
            signals.map((sig) => {
              const x = 20 + sig.candleIndex * 27;
              const y = getY(sig.price) - 24;
              const isBuy = sig.type === "BUY";
              return (
                <g key={`sig-${sig.id}`} transform={`translate(${x}, ${y})`}>
                  <circle r="12" fill={isBuy ? "#10b981" : "#f43f5e"} fillOpacity="0.25" className="animate-ping" />
                  <rect
                    x="-42"
                    y="-22"
                    width="84"
                    height="20"
                    rx="5"
                    fill={isBuy ? "#064e3b" : "#4c0519"}
                    stroke={isBuy ? "#10b981" : "#f43f5e"}
                    strokeWidth="1.2"
                  />
                  <text
                    x="0"
                    y="-8"
                    fill={isBuy ? "#a7f3d0" : "#fecdd3"}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                    textAnchor="middle"
                  >
                    {isBuy ? `▲ ACHAT IA ${sig.score}%` : `▼ VENTE IA ${sig.score}%`}
                  </text>
                  <line
                    x1="0"
                    y1="-2"
                    x2="0"
                    y2="24"
                    stroke={isBuy ? "#10b981" : "#f43f5e"}
                    strokeWidth="1.4"
                    strokeDasharray="3 3"
                  />
                </g>
              );
            })}

          {/* Ligne Horizontale du Prix en Direct & Badge Interactif */}
          <line
            x1="0"
            y1={lastY}
            x2="890"
            y2={lastY}
            stroke="#10b981"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          {/* Badge de Prix Live sur l'axe droit */}
          <rect
            x="885"
            y={lastY - 11}
            width="75"
            height="22"
            rx="4"
            fill="#10b981"
          />
          <text
            x="922"
            y={lastY + 4}
            fill="#022c22"
            fontSize="10.5"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="middle"
          >
            {currentLivePrice}
          </text>
        </svg>
      </div>

      {/* ── 3. BANDEAU INFÉRIEUR MINIMALISTE ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/50 bg-[#0f172a]/95 px-4 py-2.5 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${isTradingActive ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`} />
            <span className="text-slate-300 font-bold">
              {isTradingActive ? "Flux Streaming Défilant Actif" : "Moteur en Pause"}
            </span>
          </div>
          <span className="text-slate-500">|</span>
          <span>Tick Rate : <strong className="text-emerald-400">500ms</strong></span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline">Vitesse Exécution : <strong className="text-emerald-400">11ms FIX</strong></span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400">Serveur MT5 Equinix NY4</span>
        </div>
      </div>
    </div>
  );
}
