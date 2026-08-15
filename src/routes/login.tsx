import { Link, createFileRoute } from "@tanstack/react-router";

import { NotConfigured, PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — Nexium-markets" },
      {
        name: "description",
        content: "Connectez-vous à votre espace client Nexium-markets pour gérer vos robots MT5.",
      },
      { property: "og:title", content: "Connexion — Nexium-markets" },
      { property: "og:description", content: "Accès à l'espace client Nexium-markets." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

import { Eye, EyeOff, Globe, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured, getUserProfile } from "@/lib/supabase";
import { getUserSlug, getAdminSlug } from "@/lib/user-slug";
import { LanguageSelector } from "@/components/site/LanguageSelector";
import { useLanguage } from "@/context/LanguageContext";

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(language === "fr" ? "Veuillez saisir votre e-mail et mot de passe." : "Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      // 1. Authentification Supabase si configuré
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast.error(`Erreur de connexion : ${error.message}`);
          setLoading(false);
          return;
        }

        if (data.user) {
          const profile = await getUserProfile(data.user.id);

          // Vérification du rôle Administrateur
          if (profile?.role && ["OWNER", "SUPER_ADMIN", "ADMIN", "CONSEILLER", "SUPPORT", "FINANCE", "QUANT"].includes(profile.role)) {
            const adminSlug = getAdminSlug({ name: profile.name, email: data.user.email, id: data.user.id });
            toast.success(`Connexion Desk confirmée. Bienvenue, ${profile.name || data.user.email} !`);
            navigate({ to: "/desk/$slug", params: { slug: adminSlug } });
            return;
          }

          // Vérification du statut d'approbation pour les investisseurs / traders
          if (profile?.status === "PENDING_APPROVAL") {
            toast.warning(
              "Votre compte est actuellement en cours de validation par un administrateur. Vous recevrez un e-mail dès son activation."
            );
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }

          if (profile?.status === "REVOKED" || profile?.status === "BANNED" || profile?.status === "SUSPENDED") {
            toast.error("Votre compte est restreint ou suspendu. Contactez support@nexiummarkets.com");
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }

          const userSlug = getUserSlug({ name: profile?.name, email: data.user.email, id: data.user.id });
          toast.success(`Connexion réussie. Bienvenue, ${profile?.name || data.user.email} !`);
          navigate({ to: "/portal/$slug", params: { slug: userSlug } });
          return;
        }
      }

      // Supabase non configuré : aucune identité ne peut être vérifiée, donc
      // aucun accès n'est accordé (l'ancien comportement connectait n'importe
      // qui automatiquement, y compris en admin si l'e-mail contenait "admin").
      toast.error("Service d'authentification indisponible. Contactez le support.");
    } catch (err: any) {
      toast.error(err.message || "Impossible de se connecter.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col justify-between text-gray-900 font-sans">
      {/* Top Header: Just Logo on Left & Language on Right */}
      <header className="w-full max-w-7xl mx-auto px-6 pt-6 pb-2 flex items-center justify-between">
        <Link to="/" className="flex flex-col leading-none group">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-gray-900 tracking-[0.2em] uppercase font-mono group-hover:text-[#00c853] transition-colors">
              NEXIUM
            </span>
            <span className="h-4 w-px bg-gray-300" />
            <span className="text-xs font-black text-[#00c853] tracking-[0.25em] uppercase">
              MARKETS
            </span>
          </div>
        </Link>

        {/* Interactive Language Switcher */}
        <LanguageSelector variant="segmented" />
      </header>

      {/* Main Form Center Content */}
      <main className="flex-1 py-6 sm:py-10 px-4 flex items-center justify-center">
        {/* Unified 100% Height-Matched Card Frame */}
        <div className="mx-auto w-full max-w-4xl grid lg:grid-cols-12 overflow-hidden rounded-[28px] shadow-2xl border border-gray-200/80 bg-white">
          {/* Left Column: Emerald Green Brand Poster */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#013818] via-[#002811] to-[#00160a] p-8 lg:p-10 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Background Decorative Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00ff66]/20 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-white">
                {language === "fr" ? (
                  <>
                    Espace
                    <br />
                    Client
                  </>
                ) : (
                  <>
                    Client
                    <br />
                    Portal
                  </>
                )}
              </h2>

              <ul className="mt-6 space-y-3.5 text-sm sm:text-base font-semibold">
                {(language === "fr"
                  ? [
                      "P&L en temps réel",
                      "Gestion des licences",
                      "Routage FIX API 4.4",
                      "Support 24/7",
                    ]
                  : [
                      "Real-time P&L",
                      "License management",
                      "FIX API 4.4 routing",
                      "24/7 Support",
                    ]
                ).map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#00ff66] text-black font-black text-xs shadow-[0_0_12px_rgba(0,255,102,0.6)]">
                      ✓
                    </span>
                    <span className="text-gray-100">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom Candlesticks Graphic Mockup */}
            <div className="relative z-10 mt-8 pt-4 border-t border-[#00ff66]/20">
              <div className="flex items-end gap-2.5 h-20 w-full justify-around opacity-90">
                <div className="w-4 bg-[#00ff66] rounded-sm h-12 relative shadow-[0_0_12px_rgba(0,255,102,0.5)]">
                  <div className="absolute -top-3 left-1.5 w-0.5 h-16 bg-[#00ff66]" />
                </div>
                <div className="w-5 bg-[#00ff66] rounded-sm h-16 relative shadow-[0_0_22px_rgba(0,255,102,0.7)]">
                  <div className="absolute -top-2.5 left-2 w-0.5 h-20 bg-[#00ff66]" />
                </div>
                <div className="w-4 bg-emerald-400 rounded-sm h-8 relative">
                  <div className="absolute -top-2 left-1.5 w-0.5 h-12 bg-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: White Clean Login Form */}
          <div className="lg:col-span-7 bg-white p-8 lg:p-10 text-gray-900 flex flex-col justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {language === "fr" ? "Connexion" : "Login"}
              </h1>

              <form
                className="mt-6 space-y-4"
                onSubmit={handleLogin}
              >
                {/* Email Address */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs sm:text-sm font-extrabold text-gray-800"
                  >
                    {language === "fr" ? "E-mail" : "Email"}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@exemple.com"
                    className="rounded-xl border-gray-300 bg-white px-4 py-3 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-[#00ff66]"
                  />
                </div>

                {/* Password with Eye Toggle */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-xs sm:text-sm font-extrabold text-gray-800"
                    >
                      {language === "fr" ? "Mot de passe" : "Password"}
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs sm:text-sm font-bold text-gray-600 hover:text-gray-900 underline"
                    >
                      {language === "fr" ? "Mot de passe oublié ?" : "Forgot password?"}
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="rounded-xl border-gray-300 bg-white px-4 py-3 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-[#00ff66]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Black Pill Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 rounded-xl bg-black hover:bg-neutral-900 text-white font-extrabold py-5 text-sm tracking-wide transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="size-4 animate-spin text-emerald-400" />}
                  <span>
                    {loading
                      ? language === "fr"
                        ? "Connexion en cours..."
                        : "Signing in..."
                      : language === "fr"
                      ? "Se connecter"
                      : "Sign in"}
                  </span>
                </Button>
              </form>
            </div>

            {/* Bottom Switch Link */}
            <div className="mt-8 pt-4 text-center text-xs sm:text-sm font-semibold text-gray-600 border-t border-gray-100 flex justify-between items-center">
              <Link to="/register" className="font-extrabold text-gray-900 underline hover:text-[#00c853]">
                {language === "fr" ? "Créer un compte" : "Create account"}
              </Link>
              <Link to="/" className="text-gray-500 hover:text-gray-900">
                {language === "fr" ? "← Retour à l'accueil" : "← Back to Home"}
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full py-4 text-center text-xs font-medium text-gray-400">
        © {new Date().getFullYear()} Nexium Markets. Tous droits réservés.
      </footer>
    </div>
  );
}
