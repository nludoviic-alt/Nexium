/**
 * DEMO catalogue data. Every financial figure below is a demonstration dataset,
 * explicitly flagged DEMO, and must never be presented as real performance.
 * This module is a placeholder until the database module (Phase 1 backend) lands.
 */

export type RobotCategory =
  | "Forex"
  | "Gold"
  | "Indices"
  | "Crypto"
  | "Scalping"
  | "Swing"
  | "Trend Following"
  | "Breakout"
  | "Mean Reversion";

export type Robot = {
  slug: string;
  name: string;
  tagline: string;
  shortDescription: string;
  longDescription: string;
  categories: RobotCategory[];
  platform: "MT5" | "MT4";
  version: string;
  publishedAt: string;
  assets: string[];
  timeframes: string[];
  riskLevel: "Faible" | "Modéré" | "Élevé";
  strategy: string;
  priceMonthly: number;
  priceLifetime: number | null;
  trialDays: number;
  status: "PUBLISHED" | "BETA";
  features: string[];
  requirements: string[];
  changelog: { version: string; date: string; notes: string }[];
  /** DEMO metrics — dataset de démonstration, pas une performance réelle. */
  demoStats: {
    trades: number;
    winRate: number;
    profitFactor: number;
    maxDrawdown: number;
    avgWin: number;
    avgLoss: number;
  };
};

export const robots: Robot[] = [
  {
    slug: "nexium-ai-gold",
    name: "Nexium AI Gold",
    tagline: "Automatisation intelligente pour MetaTrader 5",
    shortDescription:
      "Robot spécialisé XAUUSD combinant filtrage de volatilité et gestion de risque dynamique.",
    longDescription:
      "Nexium AI Gold est un Expert Advisor MetaTrader 5 conçu pour le trading de l'or. Il analyse la volatilité intraday, filtre les périodes de spread élevé et applique une gestion de position adaptative. Le robot est piloté depuis le dashboard Nexium-markets : licence, version, statut de connexion et statistiques remontées par le terminal.",
    categories: ["Gold", "Scalping"],
    platform: "MT5",
    version: "2.4.1",
    publishedAt: "2026-05-18",
    assets: ["XAUUSD", "XAUEUR"],
    timeframes: ["M5", "M15", "H1"],
    riskLevel: "Élevé",
    strategy: "Breakout de volatilité avec filtre de session",
    priceMonthly: 89,
    priceLifetime: 1290,
    trialDays: 14,
    status: "PUBLISHED",
    features: [
      "Filtre de spread et de session",
      "Stop loss et take profit dynamiques",
      "Limite de perte journalière paramétrable",
      "Heartbeat vers le dashboard",
      "Mises à jour centralisées",
    ],
    requirements: [
      "MetaTrader 5 build 4000 ou supérieur",
      "Compte avec spread XAUUSD compétitif",
      "VPS recommandé pour un fonctionnement continu",
    ],
    changelog: [
      {
        version: "2.4.1",
        date: "2026-05-18",
        notes: "Filtre de news amélioré, correction du calcul de lot.",
      },
      { version: "2.3.0", date: "2026-03-02", notes: "Ajout de la limite de perte journalière." },
    ],
    demoStats: {
      trades: 412,
      winRate: 61.4,
      profitFactor: 1.42,
      maxDrawdown: 18.3,
      avgWin: 143.2,
      avgLoss: -96.8,
    },
  },
  {
    slug: "nexium-fx-trend",
    name: "Nexium FX Trend",
    tagline: "Suivi de tendance multi-paires pour MetaTrader 5",
    shortDescription:
      "Stratégie de suivi de tendance sur majeures, avec sizing progressif et sorties partielles.",
    longDescription:
      "Nexium FX Trend suit les tendances de moyen terme sur les paires majeures. Il combine confirmation multi-timeframe et sorties partielles pour lisser la courbe d'equity. Toutes les positions et l'historique sont synchronisés dans votre espace client.",
    categories: ["Forex", "Trend Following", "Swing"],
    platform: "MT5",
    version: "1.9.0",
    publishedAt: "2026-04-06",
    assets: ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD"],
    timeframes: ["H1", "H4", "D1"],
    riskLevel: "Modéré",
    strategy: "Suivi de tendance multi-timeframe",
    priceMonthly: 69,
    priceLifetime: 990,
    trialDays: 14,
    status: "PUBLISHED",
    features: [
      "Confirmation multi-timeframe",
      "Sorties partielles automatiques",
      "Trailing stop configurable",
      "Journalisation complète des trades",
    ],
    requirements: [
      "MetaTrader 5 build 4000 ou supérieur",
      "Compte hedging",
      "Capital minimum recommandé : 1 000 unités de devise",
    ],
    changelog: [
      { version: "1.9.0", date: "2026-04-06", notes: "Nouveau module de trailing stop." },
      { version: "1.7.2", date: "2026-01-21", notes: "Optimisation de la détection de tendance." },
    ],
    demoStats: {
      trades: 268,
      winRate: 48.9,
      profitFactor: 1.61,
      maxDrawdown: 12.7,
      avgWin: 288.4,
      avgLoss: -132.1,
    },
  },
  {
    slug: "nexium-index-reversion",
    name: "Nexium Index Reversion",
    tagline: "Retour à la moyenne sur indices, encadré par le risque",
    shortDescription:
      "Robot mean reversion sur indices US et européens avec plafond d'exposition strict.",
    longDescription:
      "Nexium Index Reversion identifie les excès de court terme sur les indices et cherche un retour vers la moyenne. Le plafond d'exposition et la limite de positions simultanées sont paramétrables, et l'ensemble de l'activité est visible en temps quasi réel dans le dashboard.",
    categories: ["Indices", "Mean Reversion"],
    platform: "MT5",
    version: "1.2.3",
    publishedAt: "2026-06-11",
    assets: ["US500", "NAS100", "GER40"],
    timeframes: ["M15", "H1"],
    riskLevel: "Modéré",
    strategy: "Mean reversion avec plafond d'exposition",
    priceMonthly: 79,
    priceLifetime: null,
    trialDays: 7,
    status: "BETA",
    features: [
      "Plafond d'exposition global",
      "Nombre de positions simultanées limité",
      "Filtre horaire par indice",
      "Alertes dashboard et email",
    ],
    requirements: [
      "MetaTrader 5 build 4000 ou supérieur",
      "Broker proposant les CFD indices",
      "VPS fortement recommandé",
    ],
    changelog: [
      { version: "1.2.3", date: "2026-06-11", notes: "Correction du filtre horaire GER40." },
      { version: "1.0.0", date: "2026-05-02", notes: "Première version bêta." },
    ],
    demoStats: {
      trades: 191,
      winRate: 66.5,
      profitFactor: 1.28,
      maxDrawdown: 15.9,
      avgWin: 98.7,
      avgLoss: -121.4,
    },
  },
  {
    slug: "nexium-crypto-pulse",
    name: "Nexium Crypto Pulse",
    tagline: "Algorithme Momentum High-Volatility pour Crypto CFDs",
    shortDescription:
      "Robot spécialisé BTCUSD et ETHUSD exploitant les cassures de volatilité 24/7.",
    longDescription:
      "Nexium Crypto Pulse capture la volatilité continue du marché des cryptomonnaies 24h/24 et 7j/7. Utilisant un filtre de momentum adaptatif, il sécurise automatiquement les plus-values via un trailing stop dynamique.",
    categories: ["Crypto", "Scalping"],
    platform: "MT5",
    version: "1.5.0",
    publishedAt: "2026-06-25",
    assets: ["BTCUSD", "ETHUSD", "SOLUSD"],
    timeframes: ["M1", "M5"],
    riskLevel: "Élevé",
    strategy: "Breakout de volatilité 24/7 avec Trailing Stop",
    priceMonthly: 99,
    priceLifetime: 1490,
    trialDays: 7,
    status: "PUBLISHED",
    features: [
      "Exécution 24/7 sans interruption de week-end",
      "Protection contre le slippage nocturne",
      "Filtre de momentum RSI / ATR combiné",
      "Gestion de capital au pourcent exact",
    ],
    requirements: [
      "MetaTrader 5 avec CFD Crypto activés",
      "Spread compétitif sur BTCUSD",
      "VPS colocalisé recommandé",
    ],
    changelog: [
      {
        version: "1.5.0",
        date: "2026-06-25",
        notes: "Support de SOLUSD et amélioration du Trailing Stop.",
      },
    ],
    demoStats: {
      trades: 520,
      winRate: 68.2,
      profitFactor: 1.55,
      maxDrawdown: 14.1,
      avgWin: 210.5,
      avgLoss: -115.0,
    },
  },
  {
    slug: "nexium-ultra-scalper",
    name: "Nexium Ultra Scalper",
    tagline: "Scalping Ultra-Rapide FIX API à Faible Latence",
    shortDescription:
      "Expert Advisor haute fréquence conçu pour le micro-scalping sur majeures Forex.",
    longDescription:
      "Conçu spécifiquement pour les comptes ECN Raw Spread, Nexium Ultra Scalper vise des mouvements de micro-pips en s'appuyant sur l'infrastructure Equinix NY4 à latence inférieure à 15ms.",
    categories: ["Forex", "Scalping"],
    platform: "MT5",
    version: "3.1.0",
    publishedAt: "2026-07-01",
    assets: ["EURUSD", "GBPUSD"],
    timeframes: ["M1"],
    riskLevel: "Modéré",
    strategy: "Micro-scalping haute fréquence FIX API",
    priceMonthly: 119,
    priceLifetime: 1690,
    trialDays: 7,
    status: "PUBLISHED",
    features: [
      "Latence d'exécution ultra-courte <15ms",
      "Clôture automatique d'urgence sous spread élevé",
      "Gestion d'exposition en micro-lots",
      "Synchronisation instantanée avec le dashboard",
    ],
    requirements: [
      "Compte ECN Raw Spread obligatoire",
      "MetaTrader 5 build 4000+",
      "VPS Equinix NY4 impératif",
    ],
    changelog: [
      {
        version: "3.1.0",
        date: "2026-07-01",
        notes: "Optimisation majeure du moteur d'exécution FIX.",
      },
    ],
    demoStats: {
      trades: 890,
      winRate: 74.8,
      profitFactor: 1.78,
      maxDrawdown: 9.4,
      avgWin: 45.2,
      avgLoss: -28.1,
    },
  },
];

export function getRobot(slug: string) {
  return robots.find((r) => r.slug === slug);
}

export const RISK_DISCLAIMER =
  "Le trading de produits financiers comporte un risque élevé et peut entraîner la perte de tout ou partie du capital investi. Les performances passées ne garantissent pas les résultats futurs. Les robots et informations proposés sur cette plateforme ne constituent pas une garantie de profit.";
