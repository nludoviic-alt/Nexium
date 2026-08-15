import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { MIN_PASSWORD_LENGTH, passwordIssue } from "@/lib/password";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Réinitialiser le mot de passe — Nexium Markets" },
      {
        name: "description",
        content: "Choisissez un nouveau mot de passe pour votre espace client Nexium Markets.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [linkState, setLinkState] = useState<"checking" | "ready" | "invalid" | "done">("checking");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLinkState("invalid");
      return;
    }

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setLinkState("ready");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setLinkState((current) => (current === "checking" ? "ready" : current));
    });

    const timeout = window.setTimeout(() => {
      setLinkState((current) => (current === "checking" ? "invalid" : current));
    }, 4000);

    return () => {
      subscription.subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const issue = passwordIssue(password);
    if (issue) {
      toast.error(issue);
      return;
    }
    if (password !== confirmPassword) {
      toast.error(language === "fr" ? "Les mots de passe ne correspondent pas." : "Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setLinkState("done");
      toast.success(
        language === "fr"
          ? "Mot de passe mis à jour. Vous pouvez maintenant vous connecter."
          : "Password updated successfully. You can now log in."
      );
      setTimeout(() => navigate({ to: "/login" }), 2000);
    } catch (err: any) {
      toast.error(err.message || (language === "fr" ? "Échec de la mise à jour." : "Update failed."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col justify-between text-gray-900 font-sans">
      <header className="w-full max-w-7xl mx-auto px-6 pt-6 pb-2 flex items-center justify-between">
        <Link to="/" className="flex flex-col leading-none group">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-gray-900 tracking-[0.2em] uppercase font-mono group-hover:text-[#00c853] transition-colors">
              NEXIUM
            </span>
            <span className="h-4 w-px bg-gray-300" />
            <span className="text-xs font-black text-[#00c853] tracking-[0.25em] uppercase">MARKETS</span>
          </div>
        </Link>
      </header>

      <main className="flex-1 py-6 sm:py-10 px-4 flex items-center justify-center">
        <div className="mx-auto w-full max-w-4xl grid lg:grid-cols-12 overflow-hidden rounded-[28px] shadow-2xl border border-gray-200/80 bg-white">
          <div className="lg:col-span-5 bg-gradient-to-b from-[#013818] via-[#002811] to-[#00160a] p-8 lg:p-10 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00ff66]/20 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-white">
                {language === "fr" ? "Nouveau Mot de Passe" : "New Secure Password"}
              </h2>
              <ul className="mt-8 space-y-4 text-sm sm:text-base font-semibold">
                {(language === "fr"
                  ? ["Lien de récupération vérifié", "Chiffrement de bout en bout", "Session précédente révoquée"]
                  : ["Verified recovery token", "End-to-end encryption", "Previous sessions revoked"]
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
          </div>

          <div className="lg:col-span-7 bg-white p-8 lg:p-10 text-gray-900 flex flex-col justify-between">
            <div>
              {linkState === "checking" && (
                <div className="py-10 flex flex-col items-center text-center gap-3">
                  <Loader2 className="size-6 animate-spin text-emerald-600" />
                  <p className="text-sm font-semibold text-gray-600">
                    {language === "fr" ? "Vérification du lien de réinitialisation…" : "Verifying recovery token…"}
                  </p>
                </div>
              )}

              {linkState === "invalid" && (
                <div className="space-y-4 py-6">
                  <div className="size-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-600">
                    <ShieldAlert className="size-7" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                    {language === "fr" ? "Lien invalide ou expiré" : "Invalid or Expired Token"}
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    {language === "fr"
                      ? "Ce lien de réinitialisation n'est plus valide. Demandez-en un nouveau depuis la page mot de passe oublié."
                      : "This password recovery link is no longer valid. Please request a new recovery link."}
                  </p>
                  <Link
                    to="/forgot-password"
                    className="inline-block rounded-xl bg-black hover:bg-neutral-900 text-white font-extrabold py-3 px-6 text-sm tracking-wide transition-all shadow-md"
                  >
                    {language === "fr" ? "Demander un nouveau lien" : "Request a new link"}
                  </Link>
                </div>
              )}

              {linkState === "done" && (
                <div className="space-y-4 py-6">
                  <div className="size-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="size-7" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                    {language === "fr" ? "Mot de passe mis à jour" : "Password Updated"}
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    {language === "fr" ? "Redirection vers la connexion…" : "Redirecting to login portal…"}
                  </p>
                </div>
              )}

              {linkState === "ready" && (
                <>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                    {language === "fr" ? "Choisissez un nouveau mot de passe" : "Choose a New Password"}
                  </h1>
                  <p className="mt-2 text-xs sm:text-sm text-gray-500 font-medium">
                    {language === "fr"
                      ? `Minimum ${MIN_PASSWORD_LENGTH} caractères, avec au moins une lettre et un chiffre.`
                      : `Minimum ${MIN_PASSWORD_LENGTH} characters, including letters and numbers.`}
                  </p>

                  <form className="mt-6 space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-1.5">
                      <label htmlFor="password" className="text-xs sm:text-sm font-extrabold text-gray-800">
                        {language === "fr" ? "Nouveau mot de passe" : "New Password"}
                      </label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="rounded-xl border-gray-300 bg-white px-4 py-3.5 pr-11 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-[#00ff66]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="confirmPassword" className="text-xs sm:text-sm font-extrabold text-gray-800">
                        {language === "fr" ? "Confirmer le mot de passe" : "Confirm Password"}
                      </label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="rounded-xl border-gray-300 bg-white px-4 py-3.5 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-[#00ff66]"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-xl bg-black hover:bg-neutral-900 text-white font-extrabold py-4 text-sm sm:text-base shadow-lg transition-all"
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" />
                          <span>{language === "fr" ? "Mise à jour en cours…" : "Updating password…"}</span>
                        </span>
                      ) : (
                        <span>{language === "fr" ? "Mettre à jour le mot de passe" : "Update Password"}</span>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
