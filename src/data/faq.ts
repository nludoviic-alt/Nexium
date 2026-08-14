export type FaqEntry = {
  id: number;
  category: "security" | "licensing" | "vps" | "billing";
  q: string;
  a: string;
  tag: string;
};

export const faqs: FaqEntry[] = [
  {
    id: 1,
    category: "security",
    q: "Ai-je besoin de fournir le mot de passe de mon compte MetaTrader ?",
    a: "Absolument pas. Seuls le nom du broker, le serveur MT5, le numéro de compte et le nom du titulaire sont enregistrés. Le mot de passe principal du terminal n'est jamais demandé ni stocké sur nos serveurs.",
    tag: "Sécurité",
  },
  {
    id: 2,
    category: "licensing",
    q: "Comment fonctionne la licence d'un robot EA ?",
    a: "Chaque licence génère une clé de chiffrement unique liée à vos comptes MetaTrader 5 autorisés. Lors de l'initialisation dans MT5, le robot valide sa signature numérique en temps réel auprès de notre serveur de vérification.",
    tag: "Licence",
  },
  {
    id: 3,
    category: "licensing",
    q: "Comment savoir si mon robot fonctionne réellement en direct ?",
    a: "Le robot transmet un signal de présence (heartbeat telemetry) toutes les 60 secondes. Votre dashboard distingue la licence active de l'exécution réelle et affiche l'horodatage exact de la dernière communication.",
    tag: "Monitoring",
  },
  {
    id: 4,
    category: "security",
    q: "Les performances affichées sont-elles garanties ?",
    a: "Non. Le trading sur devises, indices et matières premières comporte un risque élevé de perte en capital. Les performances passées d'un robot ou d'un backtest ne garantissent aucunement les résultats futurs.",
    tag: "Avertissement",
  },
  {
    id: 5,
    category: "vps",
    q: "Un serveur virtuel (VPS) est-il obligatoire ?",
    a: "Un VPS est fortement recommandé. Pour exécuter vos algorithmes 24h/24 sans interruption de connexion internet ni coupure de courant, le terminal MetaTrader 5 doit rester allumé en permanence.",
    tag: "Infrastructure",
  },
  {
    id: 6,
    category: "billing",
    q: "Puis-je changer de plan ou annuler mon abonnement à tout moment ?",
    a: "Oui, vous bénéficiez d'une liberté totale sans engagement. Vous pouvez mettre à jour ou résilier votre licence directement depuis la section Facturation de votre espace client.",
    tag: "Facturation",
  },
  {
    id: 7,
    category: "vps",
    q: "Quel est le temps de latence recommandé pour le serveur VPS ?",
    a: "Pour maximiser la vitesse d'exécution et réduire le slippage, nous recommandons un VPS hébergé dans les mêmes datacenters que votre broker (ex: Equinix LD4 Londres ou NY4 New York avec une latence < 5ms).",
    tag: "Performance",
  },
  {
    id: 8,
    category: "licensing",
    q: "Puis-je installer le même robot sur plusieurs comptes MT5 ?",
    a: "Le nombre de comptes simultanés dépend de votre niveau de licence (ex: Plan Pro = jusqu'à 3 comptes MT5, Plan Institutional = jusqu'à 10 comptes). Vous gérez vos liaisons en 1 clic depuis votre espace client.",
    tag: "Multi-Comptes",
  },
];
