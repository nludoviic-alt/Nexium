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

import { Eye, EyeOff, Globe } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("ludovic@nexium.io");
  const [password, setPassword] = useState("••••••••••••");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Connexion réussie. Bienvenue sur votre Dashboard Nexium.");
    navigate({ to: "/NEXIUM" });
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

        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer hover:text-gray-900 transition-colors">
          <Globe className="size-3.5 text-gray-700" />
          <span>EN ▾</span>
        </div>
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
                Connexion
                <br />
                Espace
                <br />
                Client
              </h2>

              <ul className="mt-8 space-y-4 text-sm sm:text-base font-semibold">
                {[
                  "Télémesure P&L en Temps Réel",
                  "Gestion des Licences Hardware",
                  "Routage de Compte FIX API 4.4",
                  "Support Institutionnel Dédié",
                ].map((item) => (
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
            <div className="relative z-10 mt-10 pt-5 border-t border-[#00ff66]/20">
              <div className="flex items-end gap-2.5 h-24 w-full justify-around opacity-90">
                <div className="w-4 bg-[#00ff66] rounded-sm h-14 relative shadow-[0_0_12px_rgba(0,255,102,0.5)]">
                  <div className="absolute -top-3 left-1.5 w-0.5 h-20 bg-[#00ff66]" />
                </div>
                <div className="w-5 bg-[#00ff66] rounded-sm h-20 relative shadow-[0_0_22px_rgba(0,255,102,0.7)]">
                  <div className="absolute -top-2.5 left-2 w-0.5 h-24 bg-[#00ff66]" />
                </div>
                <div className="w-4 bg-emerald-400 rounded-sm h-10 relative">
                  <div className="absolute -top-2 left-1.5 w-0.5 h-14 bg-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: White Clean Login Form */}
          <div className="lg:col-span-7 bg-white p-8 lg:p-10 text-gray-900 flex flex-col justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Connectez-vous à Votre Compte
              </h1>

              <form
                className="mt-6 space-y-4 sm:space-y-5"
                onSubmit={handleLogin}
              >
                {/* Email Address */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs sm:text-sm font-extrabold text-gray-800"
                  >
                    Adresse E-mail
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Adresse e-mail"
                    className="rounded-xl border-gray-300 bg-white px-4 py-3.5 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-[#00ff66]"
                  />
                </div>

                {/* Password with Eye Toggle */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-xs sm:text-sm font-extrabold text-gray-800"
                    >
                      Mot de Passe
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs sm:text-sm font-bold text-gray-600 hover:text-gray-900 underline"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mot de passe du portail"
                      className="rounded-xl border-gray-300 bg-white px-4 py-3.5 pr-11 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-[#00ff66]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-gray-500 hover:text-gray-800"
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Black Pill Button */}
                <Button
                  type="submit"
                  className="w-full bg-black text-white hover:bg-gray-800 rounded-xl py-4 text-sm font-black uppercase tracking-wider transition-all shadow-lg mt-3 hover:scale-[1.01]"
                >
                  Se Connecter au Portail
                </Button>
              </form>
            </div>

            {/* Bottom Switch Link */}
            <div className="mt-8 pt-4 text-center text-xs sm:text-sm font-semibold text-gray-600 border-t border-gray-100">
              Vous n'avez pas encore de compte ?{" "}
              <Link to="/register" className="font-extrabold text-gray-900 underline">
                Créer un compte
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
