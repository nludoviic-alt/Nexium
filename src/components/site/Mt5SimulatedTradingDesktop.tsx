import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, TrendingUp, Zap, ShieldCheck, Monitor, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface AssetPill {
  symbol: string;
  name: string;
  bgColor: string;
  textColor: string;
  iconBg: string;
}

interface Mt5SimulatedTradingDesktopProps {
  title: string;
  description: string;
  pills: AssetPill[];
}

export function Mt5SimulatedTradingDesktop({
  title,
  description,
  pills,
}: Mt5SimulatedTradingDesktopProps) {
  // Simulated MT5 Real-time Candlestick Ticks
  const [ticks, setTicks] = useState([
    { height: 40, isGreen: true },
    { height: 55, isGreen: true },
    { height: 30, isGreen: false },
    { height: 70, isGreen: true },
    { height: 45, isGreen: true },
    { height: 60, isGreen: false },
    { height: 80, isGreen: true },
    { height: 52, isGreen: true },
    { height: 88, isGreen: true },
    { height: 64, isGreen: false },
    { height: 72, isGreen: true },
    { height: 95, isGreen: true },
    { height: 78, isGreen: false },
    { height: 85, isGreen: true },
  ]);

  const [livePnl, setLivePnl] = useState(1450.25);
  const [currentPrice, setCurrentPrice] = useState(194.75);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.05, rootMargin: "50px" }
    );
    const el = containerRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  // Smooth 3.2s tick interval for realistic desktop algo trading (only when in view)
  useEffect(() => {
    if (!isInView) return;

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;

      const delta = (Math.random() - 0.44) * 1.4;
      setCurrentPrice((prev) => Number((prev + delta).toFixed(2)));
      setLivePnl((prev) => Number((prev + Math.random() * 12 - 4).toFixed(2)));

      setTicks((prev) => {
        const isGreen = Math.random() > 0.4;
        const newHeight = Math.floor(Math.random() * 55) + 30;
        const next = [...prev.slice(1), { height: newHeight, isGreen }];
        return next;
      });
    }, 3200);

    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <div ref={containerRef} className="w-full py-0 px-4 sm:px-6 md:px-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 items-center lg:grid-cols-12">
          {/* Left Desktop Monitor Mockup Column (7 Cols, order-2 on mobile, lg:order-1 on desktop) */}
          <div className="lg:col-span-7 order-2 lg:order-1 relative flex items-center justify-center">
            {/* Desktop Monitor Outer Shell */}
            <div className="relative z-10 w-full">
              {/* Monitor Screen Frame (Ultra-sleek titanium alloy frame) */}
              <div className="relative rounded-2xl border-[10px] border-[#161d26] bg-[#070b10] p-2.5 shadow-[0_30px_90px_rgba(0,0,0,0.9),0_0_50px_rgba(0,208,132,0.1)] ring-1 ring-white/10">
                {/* Top Camera Dot */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 size-2 rounded-full bg-gray-800 border border-gray-700" />

                {/* Monitor Display Screen */}
                <div className="relative h-[420px] sm:h-[470px] w-full rounded-xl bg-[#04090f] overflow-hidden text-white flex flex-col justify-between border border-gray-800/80 select-none">
                  {/* Top MT5 Window Header Bar */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-[#0b131d]">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <span className="size-3 rounded-full bg-rose-500/80 inline-block" />
                        <span className="size-3 rounded-full bg-amber-500/80 inline-block" />
                        <span className="size-3 rounded-full bg-[#00D084]/80 inline-block" />
                      </div>
                      <span className="text-xs font-black text-white flex items-center gap-2 font-mono ml-2">
                        <Monitor className="size-3.5 text-[#00D084]" /> MetaTrader 5 Terminal — Nexium Markets [NVDA, M1]
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                      <span className="text-[#00D084] font-mono text-[11px]">
                        Server: Equinix NY4 (0.45ms)
                      </span>
                      <Maximize2 className="size-3.5 hover:text-white cursor-pointer" />
                    </div>
                  </div>

                  {/* MT5 Sub-Menu Toolbar */}
                  <div className="flex items-center justify-between px-4 py-1.5 bg-[#070e17] border-b border-gray-800/60 text-[11px] font-semibold text-gray-300">
                    <div className="flex items-center gap-4">
                      <span className="hover:text-white cursor-pointer font-bold">File</span>
                      <span className="hover:text-white cursor-pointer">View</span>
                      <span className="hover:text-white cursor-pointer">Insert</span>
                      <span className="hover:text-white cursor-pointer font-bold text-[#00D084]">
                        Charts
                      </span>
                      <span className="hover:text-white cursor-pointer">Tools</span>
                      <span className="hover:text-white cursor-pointer">Expert Advisors</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-[#00D084]/20 text-[#00D084] px-2 py-0.5 rounded font-black text-[10px]">
                        ● ALGO BOT ACTIVE
                      </span>
                    </div>
                  </div>

                  {/* Main Workstation Screen Layout (Watchlist + Live Chart) */}
                  <div className="flex-1 grid grid-cols-12 bg-[#03070d]">
                    {/* Left Market Watch (3 Cols) */}
                    <div className="col-span-3 border-r border-gray-800/80 bg-[#060c14] p-3 flex flex-col justify-between hidden sm:flex">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          Market Watch
                        </span>

                        {/* NVDA Stock Item */}
                        <div className="rounded-lg bg-[#0c1827] border border-[#00D084]/40 p-2 text-xs">
                          <div className="flex justify-between font-black">
                            <span className="text-white">NVDA</span>
                            <span className="text-[#00D084] font-mono">${currentPrice}</span>
                          </div>
                          <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                            <span>Spread: 0.0</span>
                            <span className="text-[#00D084] font-bold">+2.45% ▲</span>
                          </div>
                        </div>

                        {/* AMZN Stock Item */}
                        <div className="rounded-lg bg-[#07111c] border border-gray-800 p-2 text-xs">
                          <div className="flex justify-between font-extrabold">
                            <span className="text-gray-300">AMZN</span>
                            <span className="text-white font-mono">$188.40</span>
                          </div>
                          <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                            <span>Spread: 0.1</span>
                            <span className="text-[#00D084] font-bold">+1.10% ▲</span>
                          </div>
                        </div>

                        {/* AAPL Stock Item */}
                        <div className="rounded-lg bg-[#07111c] border border-gray-800 p-2 text-xs">
                          <div className="flex justify-between font-extrabold">
                            <span className="text-gray-300">AAPL</span>
                            <span className="text-white font-mono">$224.15</span>
                          </div>
                          <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                            <span>Spread: 0.0</span>
                            <span className="text-[#00D084] font-bold">+0.85% ▲</span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg bg-[#091a10] border border-[#00D084]/30 p-2 text-[10px] text-gray-300 font-semibold">
                        <span className="text-[#00D084] font-extrabold block">✓ FIX API 4.4</span>
                        <span>0.00ms latency to NY4</span>
                      </div>
                    </div>

                    {/* Right Chart Area (9 Cols) */}
                    <div className="col-span-12 sm:col-span-9 relative p-3.5 flex flex-col justify-between bg-gradient-to-b from-[#030910] to-[#05111c]">
                      {/* Floating PnL Live Badge */}
                      <div className="absolute top-3 right-4 z-20 rounded-xl bg-[#06200f] border border-[#00D084]/40 px-3 py-1.5 shadow-lg flex items-center gap-2">
                        <Zap className="size-3.5 text-[#00D084] animate-pulse" />
                        <div className="flex flex-col text-right leading-none">
                          <span className="text-[8px] font-bold text-gray-400 uppercase">
                            Live EA PnL
                          </span>
                          <span className="text-xs font-black text-[#00D084] font-mono mt-0.5">
                            +${livePnl}
                          </span>
                        </div>
                      </div>

                      {/* Chart Grid Lines */}
                      <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none opacity-20">
                        <div className="w-full h-px bg-gray-500" />
                        <div className="w-full h-px bg-gray-500" />
                        <div className="w-full h-px bg-gray-500" />
                        <div className="w-full h-px bg-gray-500" />
                      </div>

                      {/* Active Order Line */}
                      <div className="relative z-10 w-full mt-4 border-t border-dashed border-[#00D084] flex items-center justify-between text-[10px] font-extrabold text-[#00D084] pt-1">
                        <span className="bg-[#00D084]/20 px-2 py-0.5 rounded border border-[#00D084]/50 font-mono text-[9px]">
                          BUY 100 NVDA @ ${(currentPrice - 1.2).toFixed(2)}
                        </span>
                        <span className="text-[#00D084] font-mono text-[9px]">
                          TP: ${(currentPrice + 5.5).toFixed(2)}
                        </span>
                      </div>

                      {/* Real-Time Desktop High-Res Candlesticks */}
                      <div className="relative z-10 flex-1 flex items-end justify-between gap-1.5 pt-4 pb-2 px-1">
                        {ticks.map((t, idx) => (
                          <div
                            key={idx}
                            className="flex-1 flex flex-col items-center justify-end h-full"
                          >
                            {/* Candle Wick */}
                            <div
                              className={`w-0.5 transition-all duration-700 ${t.isGreen ? "bg-[#00D084]" : "bg-rose-500"}`}
                              style={{ height: `${t.height + 12}%` }}
                            />
                            {/* Candle Body */}
                            <div
                              className={`w-full rounded-sm transition-all duration-700 ${
                                t.isGreen
                                  ? "bg-[#00D084] shadow-[0_0_8px_rgba(0,208,132,0.6)]"
                                  : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                              }`}
                              style={{ height: `${t.height}%` }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Bottom Execution Status Overlay */}
                      <div className="relative z-10 rounded-xl bg-[#091724] border border-gray-800 p-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="size-3.5 text-[#00D084]" />
                          <span className="font-extrabold text-white text-[11px]">
                            MT5 EA Algo Engine #12
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[10px]">
                          <span className="text-gray-400">
                            Position: <strong className="text-white">100 Shares</strong>
                          </span>
                          <span className="text-[#00D084] font-bold">STATUS: RUNNING</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Workstation Footer Status Bar */}
                  <div className="h-6 bg-[#070e17] border-t border-gray-800 px-4 flex items-center justify-between text-[9px] text-gray-400 font-mono">
                    <span>Terminal Ready</span>
                    <span>NVDA: $194.75 | AMZN: $188.40 | AAPL: $224.15</span>
                    <span className="text-[#00D084] font-bold">Connected 100%</span>
                  </div>
                </div>
              </div>

              {/* Laptop Keyboard Base */}
              <div className="relative mx-auto w-[85%] h-3.5 rounded-b-2xl bg-gradient-to-b from-[#2a3038] to-[#12161b] shadow-xl flex justify-center">
                <div className="w-20 h-1 rounded-full bg-gray-600 mt-1" />
              </div>
            </div>

            {/* Connecting Wire + Floating Asset Cards */}
            <div className="hidden md:flex flex-col gap-3.5 absolute -left-6 lg:-left-12 top-1/2 -translate-y-1/2 z-20">
              {/* Connector Wire SVG */}
              <svg className="absolute -right-16 top-1/2 -translate-y-1/2 w-16 h-32 pointer-events-none overflow-visible">
                <path
                  d="M0 20 C 35 20, 35 64, 64 64"
                  fill="none"
                  stroke="#00D084"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />
                <path
                  d="M0 108 C 35 108, 35 64, 64 64"
                  fill="none"
                  stroke="#ffc107"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />
              </svg>

              {/* Asset Pills */}
              {pills.map((pill, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3.5 rounded-2xl p-3.5 sm:p-4 shadow-2xl min-w-[180px] transition-transform hover:scale-105 border border-white/10 backdrop-blur-md"
                  style={{ backgroundColor: pill.bgColor, color: pill.textColor }}
                >
                  <div
                    className="flex size-8 sm:size-9 items-center justify-center rounded-full shadow-md text-sm font-black"
                    style={{ backgroundColor: pill.iconBg }}
                  >
                    ✦
                  </div>
                  <span className="text-lg sm:text-xl font-black tracking-wider uppercase">
                    {pill.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Text Content Column (5 Cols, order-1 on mobile, lg:order-2 on desktop) */}
          <div className="lg:col-span-5 order-1 lg:order-2 flex flex-col items-center text-center lg:items-start lg:text-left lg:pl-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#00D084]/30 bg-[#00D084]/10 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-[#00D084] shadow-sm mb-4">
              ROBOTS MT5 · ACTIONS & INDICES
            </span>
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl leading-[1.1]">
              {title}
            </h2>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-gray-300 font-medium max-w-xl mx-auto lg:mx-0">
              {description}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4 w-full sm:w-auto">
              <Button
                asChild
                className="neon-btn rounded-full px-8 py-3.5 text-xs font-black uppercase tracking-wider text-[#021a11] hover:scale-105 transition-all shadow-lg cursor-pointer"
              >
                <Link to="/robots" className="flex items-center gap-2">
                  <span>DÉCOUVRIR LE TERMINAL MT5</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-white/20 bg-white/5 hover:bg-white/10 hover:text-[#00D084] px-8 py-3.5 text-xs font-black uppercase tracking-wider text-white hover:scale-105 transition-all cursor-pointer"
              >
                <Link to="/how-it-works">MODE D'EMPLOI</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
