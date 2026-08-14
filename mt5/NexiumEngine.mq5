//+------------------------------------------------------------------+
//| NexiumEngine.mq5                                                |
//| Example modular MT5 execution engine. It is not investment      |
//| advice and does not guarantee performance or profit.            |
//+------------------------------------------------------------------+
#property strict
#property version   "0.1.0"

#include <Trade/Trade.mqh>

input group "Execution"
input ulong            InpMagicNumber       = 26081401;
input ENUM_TIMEFRAMES  InpSignalTimeframe   = PERIOD_M15;
input ENUM_TIMEFRAMES  InpTrendTimeframe    = PERIOD_H1;
input double           InpRiskPerTradePct   = 0.50;
input double           InpMaxDailyLossPct   = 2.00;
input double           InpMaxSpreadPoints   = 25.0;
input int              InpMinSetupScore     = 70;
input int              InpMaxOpenPositions  = 1;
input double           InpStopAtrMultiple   = 1.80;
input double           InpRewardRisk        = 2.00;

input group "SaaS telemetry"
input bool             InpEnableTelemetry   = false;
input string           InpTelemetryEndpoint = "";
input string           InpTelemetryToken    = "";

enum MarketRegime { REGIME_UNKNOWN, REGIME_TREND_UP, REGIME_TREND_DOWN, REGIME_RANGE };

struct TradePlan {
  bool           valid;
  ENUM_ORDER_TYPE type;
  int            score;
  double         entry;
  double         stopLoss;
  double         takeProfit;
  double         volume;
  string         reason;
};

CTrade trade;
int hFastMA = INVALID_HANDLE, hSlowMA = INVALID_HANDLE, hADX = INVALID_HANDLE;
int hATR = INVALID_HANDLE, hRSI = INVALID_HANDLE;
datetime lastSignalBar = 0;

bool ReadValue(const int handle, const int buffer, double &value) {
  double values[];
  ArraySetAsSeries(values, true);
  if(CopyBuffer(handle, buffer, 1, 1, values) != 1) return false;
  value = values[0];
  return true;
}

void LogDecision(const string eventName, const string detail) {
  string message = StringFormat("NEXIUM|%s|%s|%s", eventName, _Symbol, detail);
  Print(message);
  if(!InpEnableTelemetry || InpTelemetryEndpoint == "") return;

  string body = StringFormat("{\"event\":\"%s\",\"symbol\":\"%s\",\"detail\":\"%s\",\"time\":%I64d}",
                             eventName, _Symbol, detail, TimeCurrent());
  string headers = "Content-Type: application/json\r\n";
  if(InpTelemetryToken != "") headers += "Authorization: Bearer " + InpTelemetryToken + "\r\n";
  char data[], response[]; string responseHeaders;
  StringToCharArray(body, data, 0, WHOLE_ARRAY, CP_UTF8);
  int status = WebRequest("POST", InpTelemetryEndpoint, headers, 3000, data, response, responseHeaders);
  if(status == -1) PrintFormat("NEXIUM|TELEMETRY_ERROR|%d", GetLastError());
}

bool IsNewSignalBar() {
  datetime barTime = iTime(_Symbol, InpSignalTimeframe, 0);
  if(barTime == 0 || barTime == lastSignalBar) return false;
  lastSignalBar = barTime;
  return true;
}

MarketRegime DetectRegime() {
  double fast, slow, adx;
  if(!ReadValue(hFastMA, 0, fast) || !ReadValue(hSlowMA, 0, slow) || !ReadValue(hADX, 0, adx)) return REGIME_UNKNOWN;
  if(adx < 20.0) return REGIME_RANGE;
  return fast > slow ? REGIME_TREND_UP : REGIME_TREND_DOWN;
}

double CurrentDailyLossPct() {
  datetime dayStart = StringToTime(TimeToString(TimeCurrent(), TIME_DATE));
  if(!HistorySelect(dayStart, TimeCurrent())) return 0.0;
  double pnl = 0.0;
  for(int i = HistoryDealsTotal() - 1; i >= 0; --i) {
    ulong ticket = HistoryDealGetTicket(i);
    if(ticket == 0 || HistoryDealGetString(ticket, DEAL_SYMBOL) != _Symbol) continue;
    pnl += HistoryDealGetDouble(ticket, DEAL_PROFIT) + HistoryDealGetDouble(ticket, DEAL_SWAP) + HistoryDealGetDouble(ticket, DEAL_COMMISSION);
  }
  double balance = AccountInfoDouble(ACCOUNT_BALANCE);
  return balance > 0.0 && pnl < 0.0 ? (-pnl / balance) * 100.0 : 0.0;
}

bool PassesSafetyFilters(string &reason) {
  MqlTick tick;
  if(!SymbolInfoTick(_Symbol, tick)) { reason = "tick unavailable"; return false; }
  double spreadPoints = (tick.ask - tick.bid) / _Point;
  if(spreadPoints > InpMaxSpreadPoints) { reason = "spread limit"; return false; }
  if(CurrentDailyLossPct() >= InpMaxDailyLossPct) { reason = "daily loss guard"; return false; }

  int openPositions = 0;
  for(int i = PositionsTotal() - 1; i >= 0; --i) {
    ulong ticket = PositionGetTicket(i);
    if(ticket > 0 && PositionGetString(POSITION_SYMBOL) == _Symbol && PositionGetInteger(POSITION_MAGIC) == (long)InpMagicNumber) openPositions++;
  }
  if(openPositions >= InpMaxOpenPositions) { reason = "position limit"; return false; }
  return true;
}

double NormalizeVolume(double rawVolume) {
  double min = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
  double max = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
  double step = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
  if(step <= 0.0) return 0.0;
  double volume = MathFloor(rawVolume / step) * step;
  return NormalizeDouble(MathMax(min, MathMin(max, volume)), 2);
}

double CalculateVolume(const double entry, const double stopLoss) {
  double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
  double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
  double riskMoney = AccountInfoDouble(ACCOUNT_EQUITY) * InpRiskPerTradePct / 100.0;
  double distance = MathAbs(entry - stopLoss);
  if(tickSize <= 0.0 || tickValue <= 0.0 || distance <= 0.0) return 0.0;
  return NormalizeVolume(riskMoney / ((distance / tickSize) * tickValue));
}

TradePlan BuildTradePlan() {
  TradePlan plan = { false, ORDER_TYPE_BUY, 0, 0, 0, 0, 0, "" };
  string safetyReason;
  if(!PassesSafetyFilters(safetyReason)) { plan.reason = safetyReason; return plan; }

  MarketRegime regime = DetectRegime();
  double rsi, atr; MqlTick tick;
  if(regime == REGIME_UNKNOWN || !ReadValue(hRSI, 0, rsi) || !ReadValue(hATR, 0, atr) || !SymbolInfoTick(_Symbol, tick)) {
    plan.reason = "indicators unavailable"; return plan;
  }

  bool buySetup = regime == REGIME_TREND_UP && rsi >= 52.0 && rsi <= 68.0;
  bool sellSetup = regime == REGIME_TREND_DOWN && rsi >= 32.0 && rsi <= 48.0;
  if(!buySetup && !sellSetup) { plan.reason = "no setup"; return plan; }

  plan.type = buySetup ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
  plan.score = 55 + (regime == REGIME_RANGE ? 0 : 20) + (rsi >= 40.0 && rsi <= 60.0 ? 10 : 0);
  if(plan.score < InpMinSetupScore) { plan.reason = "score below threshold"; return plan; }
  plan.entry = buySetup ? tick.ask : tick.bid;
  double stopDistance = atr * InpStopAtrMultiple;
  plan.stopLoss = buySetup ? plan.entry - stopDistance : plan.entry + stopDistance;
  plan.takeProfit = buySetup ? plan.entry + stopDistance * InpRewardRisk : plan.entry - stopDistance * InpRewardRisk;
  plan.volume = CalculateVolume(plan.entry, plan.stopLoss);
  plan.valid = plan.volume > 0.0;
  plan.reason = plan.valid ? StringFormat("regime=%d score=%d", regime, plan.score) : "volume unavailable";
  return plan;
}

bool ExecutePlan(const TradePlan &plan) {
  string comment = StringFormat("Nexium score=%d", plan.score);
  bool sent = plan.type == ORDER_TYPE_BUY
    ? trade.Buy(plan.volume, _Symbol, 0.0, plan.stopLoss, plan.takeProfit, comment)
    : trade.Sell(plan.volume, _Symbol, 0.0, plan.stopLoss, plan.takeProfit, comment);
  if(!sent) { LogDecision("ORDER_REJECTED", trade.ResultRetcodeDescription()); return false; }
  LogDecision("ORDER_FILLED", StringFormat("retcode=%d; %s", trade.ResultRetcode(), plan.reason));
  return true;
}

void ManageOpenPositions() {
  double atr;
  if(!ReadValue(hATR, 0, atr)) return;
  for(int i = PositionsTotal() - 1; i >= 0; --i) {
    ulong ticket = PositionGetTicket(i);
    if(ticket == 0 || PositionGetString(POSITION_SYMBOL) != _Symbol || PositionGetInteger(POSITION_MAGIC) != (long)InpMagicNumber) continue;
    long type = PositionGetInteger(POSITION_TYPE);
    double openPrice = PositionGetDouble(POSITION_PRICE_OPEN), stopLoss = PositionGetDouble(POSITION_SL);
    MqlTick tick; if(!SymbolInfoTick(_Symbol, tick)) continue;
    double marketPrice = type == POSITION_TYPE_BUY ? tick.bid : tick.ask;
    double profitDistance = type == POSITION_TYPE_BUY ? marketPrice - openPrice : openPrice - marketPrice;
    if(profitDistance < atr) continue;
    double breakeven = type == POSITION_TYPE_BUY ? openPrice + 2 * _Point : openPrice - 2 * _Point;
    bool improvesStop = type == POSITION_TYPE_BUY ? (stopLoss == 0.0 || breakeven > stopLoss) : (stopLoss == 0.0 || breakeven < stopLoss);
    if(improvesStop && trade.PositionModify(ticket, breakeven, PositionGetDouble(POSITION_TP))) LogDecision("POSITION_MANAGED", "breakeven applied");
  }
}

int OnInit() {
  trade.SetExpertMagicNumber(InpMagicNumber);
  hFastMA = iMA(_Symbol, InpTrendTimeframe, 20, 0, MODE_EMA, PRICE_CLOSE);
  hSlowMA = iMA(_Symbol, InpTrendTimeframe, 50, 0, MODE_EMA, PRICE_CLOSE);
  hADX = iADX(_Symbol, InpTrendTimeframe, 14);
  hATR = iATR(_Symbol, InpSignalTimeframe, 14);
  hRSI = iRSI(_Symbol, InpSignalTimeframe, 14, PRICE_CLOSE);
  if(hFastMA == INVALID_HANDLE || hSlowMA == INVALID_HANDLE || hADX == INVALID_HANDLE || hATR == INVALID_HANDLE || hRSI == INVALID_HANDLE) return INIT_FAILED;
  LogDecision("ENGINE_STARTED", "modular execution engine initialized");
  return INIT_SUCCEEDED;
}

void OnDeinit(const int reason) {
  IndicatorRelease(hFastMA); IndicatorRelease(hSlowMA); IndicatorRelease(hADX); IndicatorRelease(hATR); IndicatorRelease(hRSI);
  LogDecision("ENGINE_STOPPED", IntegerToString(reason));
}

void OnTick() {
  ManageOpenPositions();
  if(!IsNewSignalBar()) return;
  TradePlan plan = BuildTradePlan();
  if(!plan.valid) { LogDecision("SETUP_SKIPPED", plan.reason); return; }
  ExecutePlan(plan);
}
