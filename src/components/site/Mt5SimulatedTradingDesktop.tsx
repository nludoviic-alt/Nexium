import React, { useState, useEffect } from "react";
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

  // Smooth 3.2s tick interval for realistic desktop algo trading
  useEffect(() => {
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
  }, []);

  return (
    <div className="w-full py-0 px-4 sm:px-6 md:px-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 items-center lg:grid-cols-12">
          {/* Left Desktop Monitor Mockup Column (7 Cols, lg:order-1) */}
          <div className="lg:col-span-7 lg:order-1 relative flex items-center justify-center">
            {/* Desktop Monitor Outer Shell */}
            <div className="relative z-10 w-full">
              {/* Monitor Screen Frame (Ultra-sleek titanium alloy frame) */}
              <div className="relative rounded-2xl border-[10px] border-[#161d26] bg-[#070b10] p-2.5 shadow-[0_30px_90px_rgba(0,0,0,0.9),0_0_50px_rgba(0,208,132,0.1)] ring-1 ring-white/10">
                {/* Top Camera Dot */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 size-2 rounded-full bg-gray-800 border border-gray-700" />

                {/* Monitor Display Screen */}
                <div className="relative h-[340px] xs:h-[390px] sm:h-[440px] md:h-[470px] w-full rounded-xl bg-[#04090f] overflow-hidden text-white flex flex-col justify-between border border-gray-800/80 select-none">
                  {/* Top MT5 Window Header Bar */}
                  <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 border-b border-gray-800 bg-[#0b131d]">
                    <div className="flex items-center gap-2 sm:gap-3 truncate">
                      <div className="flex gap-1.5 shrink-0">
                        <span className="size-2.5 sm:size-3 rounded-full bg-rose-500/80 inline-block" />
                        <span className="size-2.5 sm:size-3 rounded-full bg-amber-500/80 inline-block" />
                        <span className="size-2.5 sm:size-3 rounded-full bg-[#00D084]/80 inline-block" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-black text-white flex items-center gap-1.5 font-mono truncate ml-1">
                        <Monitor className="size-3 text-[#00D084] shrink-0" /> MT5 [NVDA, M1]
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs font-bold text-gray-400 shrink-0">
                      <span className="text-[#00D084] font-mono text-[9px] sm:text-[11px]">
                        NY4 (0.45ms)
                      </span>
                      <Maximize2 className="size-3 hover:text-white cursor-pointer" />
                    </div>
                  </div>

                  {/* MT5 Sub-Menu Toolbar */}
                  <div className="flex items-center justify-between px-3 sm:px-4 py-1 bg-[#070e17] border-b border-gray-800/60 text-[10px] sm:text-[11px] font-semibold text-gray-300 overflow-x-auto">
                    <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
                      <span className="hover:text-white cursor-pointer font-bold">File</span>
                      <span className="hover:text-white cursor-pointer">View</span>
                      <span className="hover:text-white cursor-pointer font-bold text-[#00D084]">
                        Charts
                      </span>
                      <span className="hover:text-white cursor-pointer">Tools</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="bg-[#00D084]/20 text-[#00D084] px-1.5 py-0.5 rounded font-black text-[9px] sm:text-[10px]">
                        ● ACTIVE
                      </span>
                    </div>
                  </div>

                  {/* Main Workstation Screen Layout (Watchlist + Live Chart) */}
                  <div className="flex-1 grid grid-cols-12 bg-[#03070d]">
                    {/* Left Market Watch (3 Cols) */}
                    <div className="col-span-3 border-r border-gray-800/80 bg-[#060c14] p-3 flex flex-col justify-between hidden md:flex">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          Market Watch
                        </span>

                        {/* NVDA Stock Item */}
                        <div className="rounded-lg bg-[#0c1827] border border-[#00D084]/40 p-2 text-xs">
                          <div className="flex justify-between font-mono font-bold">
                            <span className="text-white">NVDA</span>
                            <span className="text-[#00D084] font-black">+2.45%</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                            <span>B: {currentPrice}</span>
                            <span>A: {currentPrice}</span>
                          </div>
                        </div>

                        {/* AMZN Stock Item */}
                        <div className="rounded-lg bg-gray-900/50 p-2 text-xs border border-gray-800">
                          <div className="flex justify-between font-mono font-bold">
                            <span className="text-white">AMZN</span>
                            <span className="text-sky-400 font-black">+1.18%</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                            <span>B: 188.40</span>
                            <span>A: 188.40</span>
                          </div>
                        </div>

                        {/* AAPL Stock Item */}
                        <div className="rounded-lg bg-gray-900/50 p-2 text-xs border border-gray-800">
                          <div className="flex justify-between font-mono font-bold">
                            <span className="text-white">AAPL</span>
                            <span className="text-gray-400 font-black">+0.42%</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                            <span>B: 224.15</span>
                            <span>A: 224.15</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-800/80 pt-2 text-[10px] font-mono text-gray-400 flex justify-between">
                        <span>P&L:</span>
                        <span className="text-[#00D084] font-bold">+${livePnl.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Right Chart Canvas Area (9 Cols or 12 on mobile) */}
                    <div className="col-span-12 md:col-span-9 p-3 flex flex-col justify-between relative bg-[#04080f]">
                      {/* Top Symbol Legend Bar */}
                      <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono border-b border-gray-800 pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">NVIDIA CORP · M1 · NEXIUM MT5</span>
                          <span className="text-[#00D084] font-bold hidden sm:inline">Spread: 0.0</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Prix:</span>
                          <span className="font-bold text-white">${currentPrice}</span>
                        </div>
                      </div>

                      {/* Vector Candlesticks Simulation */}
                      <div className="relative flex-1 my-2 flex items-end justify-between px-2 gap-1.5 h-36">
                        {/* Shaded Price Channel Background */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                          <div className="border-b border-dashed border-gray-700 w-full" />
                          <div className="border-b border-dashed border-gray-700 w-full" />
                          <div className="border-b border-dashed border-gray-700 w-full" />
                        </div>

                        {ticks.map((tick, index) => (
                          <div key={index} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                            {/* Candle Upper/Lower Wick Line */}
                            <div
                              className={`w-0.5 rounded-full ${
                                tick.isGreen ? "bg-[#00D084]" : "bg-rose-500"
                              }`}
                              style={{ height: `${Math.min(100, tick.height + 18)}%` }}
                            />
                            {/* Candle Real Body */}
                            <div
                              className={`w-full max-w-[12px] rounded-sm absolute bottom-2 transition-all duration-300 ${
                                tick.isGreen
                                  ? "bg-[#00D084] shadow-[0_0_8px_rgba(0,208,132,0.4)]"
                                  : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                              }`}
                              style={{ height: `${tick.height}%` }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Bottom Terminal Order Row */}
                      <div className="flex items-center justify-between border-t border-gray-800 pt-1.5 text-[9px] sm:text-[10px] font-mono">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#00D084]/15 text-[#00D084] px-1.5 py-0.5 rounded font-black">
                            BUY 1.00 NVDA
                          </span>
                          <span className="text-gray-400 hidden sm:inline">TP: $210.00 · SL: $190.00</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Profit:</span>
                          <span className="text-[#00D084] font-black text-xs">+${livePnl.toFixed(2)} USD</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MT5 Bottom Status Footer */}
                  <div className="flex items-center justify-between px-3 sm:px-4 py-1 bg-[#09111b] border-t border-gray-800 text-[9px] sm:text-[10px] font-mono text-gray-400">
                    <span>Terminal Ready</span>
                    <span className="hidden sm:inline">NVDA: $194.75 | AMZN: $188.40 | AAPL: $224.15</span>
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
            <div className="hidden xl:flex flex-col gap-3.5 absolute -left-6 lg:-left-12 top-1/2 -translate-y-1/2 z-20">
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

          {/* Right Text Content Column (5 Cols, lg:order-2) */}
          <div className="lg:col-span-5 lg:order-2 flex flex-col items-start lg:pl-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#00D084]/30 bg-[#00D084]/10 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-[#00D084] shadow-sm mb-3 sm:mb-4">
              ROBOTS MT5 · ACTIONS & INDICES
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
              {title}
            </h2>
            <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg leading-relaxed text-gray-300 font-medium max-w-xl">
              {description}
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <Button
                asChild
                className="neon-btn w-full sm:w-auto rounded-full px-7 sm:px-8 py-3.5 text-xs font-black uppercase tracking-wider text-[#021a11] hover:scale-105 transition-all shadow-lg cursor-pointer justify-center"
              >
                <Link to="/robots" className="flex items-center justify-center gap-2">
                  <span>DÉCOUVRIR LE TERMINAL MT5</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto rounded-full border-white/20 bg-white/5 hover:bg-white/10 px-7 sm:px-8 py-3.5 text-xs font-black uppercase tracking-wider text-white hover:scale-105 transition-all cursor-pointer justify-center"
              >
                <Link to="/how-it-works" className="flex items-center justify-center">MODE D'EMPLOI</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
