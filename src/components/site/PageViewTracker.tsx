import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { isSupabaseConfigured, recordPageView, supabase } from "@/lib/supabase";

const SESSION_KEY = "nexium_visitor_session_id";
const COOKIE_STORAGE_KEY = "nexium_cookie_consent_v1";

function getOrCreateSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

function hasAnalyticsConsent(): boolean {
  try {
    const saved = localStorage.getItem(COOKIE_STORAGE_KEY);
    if (!saved) return false;
    const parsed = JSON.parse(saved);
    return parsed?.telemetry === true;
  } catch {
    return false;
  }
}

/**
 * Enregistre une visite par changement de page — jamais pour la console
 * admin elle-même (bruit inutile), et seulement si le visiteur a accepté
 * les cookies de mesure d'audience (bannière RGPD existante).
 */
export function PageViewTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (pathname.startsWith("/composition")) return;
    if (!hasAnalyticsConsent()) return;
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }) as any);

      recordPageView({
        session_id: getOrCreateSessionId(),
        path: pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        language: navigator.language,
        user_id: user?.id || null,
      }).catch(() => {});
    })();
  }, [pathname]);

  return null;
}
