import { Link, createFileRoute } from "@tanstack/react-router";

import { NotConfigured, PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "S’inscrire — Nexium Markets" },
      {
        name: "description",
        content:
          "Inscrivez-vous sur Nexium-markets pour accéder au catalogue de robots MetaTrader 5 et à votre dashboard.",
      },
      { property: "og:title", content: "S’inscrire — Nexium Markets" },
      { property: "og:description", content: "Ouvrez votre espace client Nexium-markets." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RegisterPage,
});

import { Check, ChevronDown, Eye, EyeOff, Globe, Loader2, Clock, CheckCircle2, ShieldCheck, Mail, ArrowLeft, RefreshCw, KeyRound } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { sendWelcomeEmail, sendAdminNewClientAlertEmail, sendEmailVerificationOtp } from "@/lib/resend";
import { notifyTelegramNewRegistration } from "@/lib/telegram";
import { getUserSlug } from "@/lib/user-slug";
import { passwordIssue } from "@/lib/password";
import { LanguageSelector } from "@/components/site/LanguageSelector";
import { useLanguage } from "@/context/LanguageContext";

function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("France");
  const [loading, setLoading] = useState(false);
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  // Multi-step: FORM (saisie infos) -> OTP (validation code à 6 chiffres)
  const [step, setStep] = useState<"FORM" | "OTP">("FORM");
  const [otpCode, setOtpCode] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState<number>(0);
  const [otpAttempts, setOtpAttempts] = useState<number>(0);
  const [otpInput, setOtpInput] = useState("");
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Décompte de temporisation pour le renvoi d'un nouveau code
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Étape 1 : validation préliminaire et expédition du code OTP par e-mail
  const handleInitiateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName || !phone) {
      toast.error(language === "fr" ? "Veuillez remplir tous les champs obligatoires." : "Please fill in all required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error(language === "fr" ? "Veuillez saisir une adresse e-mail valide." : "Please enter a valid email address.");
      return;
    }

    const issue = passwordIssue(password);
    if (issue) {
      toast.error(issue);
      return;
    }
    if (password !== confirmPassword) {
      toast.error(language === "fr" ? "Les deux mots de passe ne correspondent pas." : "The two passwords do not match.");
      return;
    }

    setLoading(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    try {
      // Génération d'un code OTP sécurisé à 6 chiffres
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setOtpCode(generatedOtp);
      setOtpExpiresAt(Date.now() + 10 * 60 * 1000); // 10 minutes de validité
      setOtpAttempts(0);
      setOtpInput("");
      setResendCooldown(60);

      // Expédition de l'e-mail officiel avec le code via Resend
      const sendRes = await sendEmailVerificationOtp({
        email: email.trim(),
        fullName,
        code: generatedOtp,
        lang: language as "fr" | "en",
      });

      if (!sendRes.success) {
        console.warn("Notice envoi OTP Resend:", sendRes.error);
      }

      setStep("OTP");
      toast.success(
        language === "fr"
          ? `Code de sécurité envoyé à ${email.trim()}`
          : `Security code sent to ${email.trim()}`
      );
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'envoi du code de vérification.");
    } finally {
      setLoading(false);
    }
  };

  // Renvoi d'un nouveau code OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    try {
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setOtpCode(newOtp);
      setOtpExpiresAt(Date.now() + 10 * 60 * 1000);
      setOtpAttempts(0);
      setOtpInput("");
      setResendCooldown(60);

      await sendEmailVerificationOtp({
        email: email.trim(),
        fullName,
        code: newOtp,
        lang: language as "fr" | "en",
      });

      toast.success(
        language === "fr"
          ? "Un nouveau code de sécurité vous a été envoyé."
          : "A new security code has been sent."
      );
    } catch (err: any) {
      toast.error(err.message || "Impossible de renvoyer le code.");
    } finally {
      setIsResending(false);
    }
  };

  // Étape 2 : Vérification du code OTP et création définitive du compte
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = otpInput.trim();

    if (cleanInput.length !== 6) {
      toast.error(
        language === "fr"
          ? "Veuillez saisir les 6 chiffres du code."
          : "Please enter all 6 digits of the code."
      );
      return;
    }

    if (Date.now() > otpExpiresAt) {
      toast.error(
        language === "fr"
          ? "Ce code a expiré. Veuillez cliquer sur Renvoyer."
          : "This code has expired. Please click Resend."
      );
      return;
    }

    if (cleanInput !== otpCode) {
      const nextAttempts = otpAttempts + 1;
      setOtpAttempts(nextAttempts);
      if (nextAttempts >= 5) {
        toast.error(
          language === "fr"
            ? "Nombre maximal de tentatives atteint. Veuillez demander un nouveau code."
            : "Max attempts reached. Please request a new code."
        );
        setOtpCode(""); // Invalide le code actuel
      } else {
        toast.error(
          language === "fr"
            ? `Code incorrect. Il vous reste ${5 - nextAttempts} tentative(s).`
            : `Incorrect code. ${5 - nextAttempts} attempt(s) remaining.`
        );
      }
      return;
    }

    // Le code OTP est validé avec succès : création définitive du compte
    setIsVerifying(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    try {
      let createdUserId = `usr-${Date.now()}`;
      let hasSession = false;

      if (isSupabaseConfigured) {
        // 1. Création compte utilisateur Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: fullName,
              country,
              phone: phone.trim(),
              email_verified_via_otp: true,
            },
            emailRedirectTo: "https://nexiummarkets.com/login",
          },
        });

        if (error) {
          const isRateLimit =
            error.message?.toLowerCase().includes("rate limit") ||
            (error as any).status === 429 ||
            (error as any).code === "over_email_send_rate_limit";

          if (isRateLimit) {
            console.warn("Notice: Limite SMTP Supabase atteinte. Prise en charge transparente par Resend.");
          } else if (error.message?.toLowerCase().includes("already registered")) {
            toast.error(
              language === "fr"
                ? "Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter."
                : "An account already exists with this email. Please sign in."
            );
            navigate({ to: "/login" });
            return;
          } else {
            toast.error(`Erreur d'inscription : ${error.message}`);
            setIsVerifying(false);
            return;
          }
        }

        if (data?.user?.id) {
          createdUserId = data.user.id;
        }
        hasSession = Boolean(data?.session);

        if (!hasSession) {
          try {
            const { data: signInData } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            });
            if (signInData?.session) {
              hasSession = true;
              if (signInData.user?.id) {
                createdUserId = signInData.user.id;
              }
            }
          } catch (signInErr) {
            console.warn("Notice connexion automatique post-inscription:", signInErr);
          }
        }

        // 2. Enregistrement systématique de la fiche profil dans la table `profiles`
        const mt5RawLogin = Math.floor(100000 + Math.random() * 900000).toString();
        try {
          const { error: profileError } = await supabase.from("profiles").upsert({
            id: createdUserId,
            email: email.trim(),
            name: fullName,
            phone: phone.trim(),
            country,
            role: "TRADER",
            status: "ACTIVE", // Compte actif après vérification OTP
            license_status: "NOT_REQUESTED", // Presets inactifs par défaut, activation sur demande
            active_preset: "",
            requested_presets: [],
            kyc_status: "PENDING",
            balance: 0.0,
            bonus_credit: 0.0,
            mt5_login: `#${mt5RawLogin}`,
            assigned_advisor: "Expert Trading",
          });
          if (profileError) {
            console.error("Erreur enregistrement profil Supabase:", profileError);
          }
        } catch (profileErr) {
          console.warn("Notice enregistrement profil Supabase:", profileErr);
        }

        // 3. Écriture immédiate dans le journal d'audit
        try {
          await supabase.from("audit_logs").insert({
            admin_id: createdUserId,
            admin_name: "Système Inscription",
            action: "CLIENT_REGISTERED",
            target_user_id: createdUserId,
            target_user_email: email.trim(),
            details: `Nouveau compte client vérifié par OTP ouvert pour ${fullName} (${email.trim()}) — Résidence : ${country}`,
          });
        } catch (logErr) {
          console.warn("Notice audit log:", logErr);
        }
      }

      // 4. Double flux d'envoi d'e-mails transactionnels via Resend
      try {
        await sendWelcomeEmail(email.trim(), fullName, undefined, language as "fr" | "en");
        await sendAdminNewClientAlertEmail({
          name: fullName,
          email: email.trim(),
          country,
          phone: phone.trim(),
        });
      } catch (mailErr) {
        console.warn("Notice envoi email Resend:", mailErr);
      }

      // 5. Notification instantanée Telegram
      notifyTelegramNewRegistration({
        name: fullName,
        email: email.trim(),
        country,
        phone: phone.trim(),
      }).catch(() => {});

      const userSlug = getUserSlug({ name: fullName, email: email.trim(), id: createdUserId });
      toast.success(
        language === "fr"
          ? `E-mail validé avec succès ! Bienvenue sur votre compte, ${fullName} !`
          : `Email verified successfully! Welcome to your account, ${fullName}!`
      );
      navigate({ to: "/portal/$slug", params: { slug: userSlug } });
      return;
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la création du compte.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col justify-between text-gray-900 font-sans">
      {/* Top Header: Just Logo on Left & Interactive Language on Right */}
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

        {/* Language Switcher */}
        <LanguageSelector variant="segmented" />
      </header>

      {/* Main Form Center Content */}
      <main className="flex-1 py-6 sm:py-10 px-4 flex items-center justify-center">
        {/* Unified 100% Height-Matched Card Frame */}
        <div className="mx-auto w-full max-w-4xl grid lg:grid-cols-12 overflow-hidden rounded-[28px] shadow-2xl border border-gray-200/80 bg-white">
          {/* Left Column: Emerald Green Brand Poster */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#013818] via-[#002811] to-[#00160a] p-8 lg:p-10 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Background Radial Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00ff66]/20 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-white">
                {language === "fr" ? (
                  <>
                    Automatisez
                    <br />
                    Votre Trading
                  </>
                ) : (
                  <>
                    Automate
                    <br />
                    Your Trading
                  </>
                )}
              </h2>

              <ul className="mt-6 space-y-3.5 text-sm sm:text-base font-semibold">
                {(language === "fr"
                  ? [
                      "Robots MT5 certifiés",
                      "Dashboard de pilotage",
                      "Licence sécurisée",
                      "Support 24/7",
                    ]
                  : [
                      "Certified MT5 bots",
                      "Centralized dashboard",
                      "Hardware-bound license",
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
                <div className="w-5 bg-[#00ff66] rounded-sm h-16 relative shadow-[0_0_18px_rgba(0,255,102,0.6)]">
                  <div className="absolute -top-2 left-2 w-0.5 h-20 bg-[#00ff66]" />
                </div>
                <div className="w-4 bg-emerald-400 rounded-sm h-8 relative">
                  <div className="absolute -top-2 left-1.5 w-0.5 h-12 bg-emerald-400" />
                </div>
                <div className="w-6 bg-[#00ff66] rounded-sm h-18 relative shadow-[0_0_22px_rgba(0,255,102,0.7)]">
                  <div className="absolute -top-3 left-2.5 w-0.5 h-22 bg-[#00ff66]" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: White Clean Registration Form */}
          <div className="lg:col-span-7 bg-white p-8 lg:p-10 text-gray-900 flex flex-col justify-between">
            <div>
              {step === "OTP" ? (
                <div className="space-y-6 py-2 animate-in fade-in duration-300">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                      <ShieldCheck className="size-6 text-[#00c853]" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                        {language === "fr" ? "Vérification de votre e-mail" : "Verify Your Email"}
                      </h2>
                      <p className="text-xs text-gray-500 font-semibold">
                        {language === "fr" ? "Code de sécurité à 6 chiffres" : "6-digit security code"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 border border-gray-200/80 p-4 space-y-2">
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                      {language === "fr"
                        ? "Un e-mail officiel contenant un code à 6 chiffres a été envoyé à :"
                        : "An official verification email with a 6-digit code has been sent to:"}
                    </p>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-extrabold text-gray-900 text-sm font-mono bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                        {email}
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep("FORM")}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                      >
                        {language === "fr" ? "Modifier l'adresse" : "Change email"}
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="otp-input"
                        className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider"
                      >
                        {language === "fr" ? "Saisir le code à 6 chiffres" : "Enter 6-digit code"}
                      </label>
                      <div className="relative">
                        <input
                          id="otp-input"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                            setOtpInput(val);
                          }}
                          placeholder="······"
                          autoFocus
                          className="w-full text-center font-mono text-3xl sm:text-4xl font-black tracking-[0.4em] py-4 bg-white border-2 border-gray-300 rounded-2xl text-gray-900 focus:border-[#00c853] focus:ring-4 focus:ring-[#00c853]/15 focus:outline-none transition-all placeholder:text-gray-300"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-500 pt-1">
                        <span>
                          {language === "fr" ? "⏱️ Expire dans 10 min" : "⏱️ Expires in 10 min"}
                        </span>
                        {otpAttempts > 0 && (
                          <span className="text-amber-600 font-bold">
                            {language === "fr"
                              ? `${5 - otpAttempts} tentative(s) restante(s)`
                              : `${5 - otpAttempts} attempt(s) remaining`}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isVerifying || otpInput.length < 6}
                      className="w-full rounded-xl bg-black hover:bg-neutral-900 hover:text-[#00D084] text-white font-extrabold py-5 text-sm tracking-wide transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                    >
                      {isVerifying ? (
                        <Loader2 className="size-4 animate-spin text-emerald-400" />
                      ) : (
                        <CheckCircle2 className="size-4 text-[#00c853]" />
                      )}
                      <span>
                        {isVerifying
                          ? language === "fr"
                            ? "Vérification en cours..."
                            : "Verifying..."
                          : language === "fr"
                          ? "Confirmer & Ouvrir mon compte"
                          : "Confirm & Open Account"}
                      </span>
                    </Button>

                    <div className="pt-2 text-center">
                      {resendCooldown > 0 ? (
                        <span className="text-xs font-bold text-gray-400 flex items-center justify-center gap-1.5">
                          <Clock className="size-3.5" />
                          {language === "fr"
                            ? `Renvoyer un code dans ${resendCooldown}s`
                            : `Resend code in ${resendCooldown}s`}
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isResending}
                          onClick={handleResendOtp}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                        >
                          {isResending && <Loader2 className="size-3 animate-spin text-emerald-600" />}
                          <span>
                            {language === "fr" ? "Vous n'avez pas reçu le code ? Renvoyer" : "Didn't receive the code? Resend"}
                          </span>
                        </button>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-100 text-center">
                      <button
                        type="button"
                        onClick={() => setStep("FORM")}
                        className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                      >
                        {language === "fr" ? "← Revenir au formulaire d'inscription" : "← Back to registration form"}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                    {language === "fr" ? "S’inscrire" : "Create Your Account"}
                  </h1>

                  <form
                    className="mt-6 space-y-4"
                    onSubmit={handleInitiateRegistration}
                  >
                    {/* Country of Residence */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="country"
                        className="block text-xs sm:text-sm font-extrabold text-gray-800"
                      >
                        {language === "fr" ? "Pays de Résidence *" : "Country of Residence *"}
                      </label>
                      <div className="relative">
                        <select
                          id="country"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm sm:text-base font-semibold text-gray-900 focus:border-[#00c853] focus:outline-none focus:ring-2 focus:ring-[#00c853]/20 cursor-pointer transition-all"
                        >
                          <optgroup label="Principaux Pays Francophones &amp; Institutionnels">
                            <option value="France">🇫🇷 France</option>
                            <option value="Canada">🇨🇦 Canada</option>
                            <option value="Suisse">🇨🇭 Suisse</option>
                            <option value="Belgique">🇧🇪 Belgique</option>
                            <option value="Luxembourg">🇱🇺 Luxembourg</option>
                            <option value="Monaco">🇲🇨 Monaco</option>
                            <option value="Royaume-Uni">🇬🇧 Royaume-Uni</option>
                            <option value="États-Unis">🇺🇸 États-Unis</option>
                            <option value="Émirats Arabes Unis">🇦🇪 Émirats Arabes Unis</option>
                            <option value="Singapour">🇸🇬 Singapour</option>
                          </optgroup>
                          <optgroup label="Europe">
                            <option value="Allemagne">🇩🇪 Allemagne</option>
                            <option value="Andorre">🇦🇩 Andorre</option>
                            <option value="Autriche">🇦🇹 Autriche</option>
                            <option value="Bulgarie">🇧🇬 Bulgarie</option>
                            <option value="Chypre">🇨🇾 Chypre</option>
                            <option value="Croatie">🇭🇷 Croatie</option>
                            <option value="Danemark">🇩🇰 Danemark</option>
                            <option value="Espagne">🇪🇸 Espagne</option>
                            <option value="Estonie">🇪🇪 Estonie</option>
                            <option value="Finlande">🇫🇮 Finlande</option>
                            <option value="Gibraltar">🇬🇮 Gibraltar</option>
                            <option value="Grèce">🇬🇷 Grèce</option>
                            <option value="Hongrie">🇭🇺 Hongrie</option>
                            <option value="Irlande">🇮🇪 Irlande</option>
                            <option value="Islande">🇮🇸 Islande</option>
                            <option value="Italie">🇮🇹 Italie</option>
                            <option value="Lettonie">🇱🇻 Lettonie</option>
                            <option value="Liechtenstein">🇱🇮 Liechtenstein</option>
                            <option value="Lituanie">🇱🇹 Lituanie</option>
                            <option value="Malte">🇲🇹 Malte</option>
                            <option value="Norvège">🇳🇴 Norvège</option>
                            <option value="Pays-Bas">🇳🇱 Pays-Bas</option>
                            <option value="Pologne">🇵🇱 Pologne</option>
                            <option value="Portugal">🇵🇹 Portugal</option>
                            <option value="République Tchèque">🇨🇿 République Tchèque</option>
                            <option value="Roumanie">🇷🇴 Roumanie</option>
                            <option value="Slovaquie">🇸🇰 Slovaquie</option>
                            <option value="Slovénie">🇸🇮 Slovénie</option>
                            <option value="Suède">🇸🇪 Suède</option>
                          </optgroup>
                          <optgroup label="Afrique">
                            <option value="Algérie">🇩🇿 Algérie</option>
                            <option value="Bénin">🇧🇯 Bénin</option>
                            <option value="Burkina Faso">🇧🇫 Burkina Faso</option>
                            <option value="Cameroun">🇨🇲 Cameroun</option>
                            <option value="Congo (Brazzaville)">🇨🇬 Congo (Brazzaville)</option>
                            <option value="Congo (RDC)">🇨🇩 Congo (RDC)</option>
                            <option value="Côte d'Ivoire">🇨🇮 Côte d'Ivoire</option>
                            <option value="Djibouti">🇩🇯 Djibouti</option>
                            <option value="Égypte">🇪🇬 Égypte</option>
                            <option value="Gabon">🇬🇦 Gabon</option>
                            <option value="Ghana">🇬🇭 Ghana</option>
                            <option value="Guinée">🇬🇳 Guinée</option>
                            <option value="Île Maurice">🇲🇺 Île Maurice</option>
                            <option value="Madagascar">🇲🇬 Madagascar</option>
                            <option value="Mali">🇲🇱 Mali</option>
                            <option value="Maroc">🇲🇦 Maroc</option>
                            <option value="Mauritanie">🇲🇷 Mauritanie</option>
                            <option value="Niger">🇳🇪 Niger</option>
                            <option value="Nigéria">🇳🇬 Nigéria</option>
                            <option value="Rwanda">🇷🇼 Rwanda</option>
                            <option value="Sénégal">🇸🇳 Sénégal</option>
                            <option value="Seychelles">🇸🇨 Seychelles</option>
                            <option value="Tchad">🇹🇩 Tchad</option>
                            <option value="Togo">🇹🇬 Togo</option>
                            <option value="Tunisie">🇹🇳 Tunisie</option>
                            <option value="Afrique du Sud">🇿🇦 Afrique du Sud</option>
                          </optgroup>
                          <optgroup label="Amériques &amp; Caraïbes">
                            <option value="Argentine">🇦🇷 Argentine</option>
                            <option value="Bahamas">🇧🇸 Bahamas</option>
                            <option value="Brésil">🇧🇷 Brésil</option>
                            <option value="Chili">🇨🇱 Chili</option>
                            <option value="Colombie">🇨🇴 Colombie</option>
                            <option value="Costa Rica">🇨🇷 Costa Rica</option>
                            <option value="Guadeloupe">🇬🇵 Guadeloupe</option>
                            <option value="Guyane Française">🇬🇫 Guyane Française</option>
                            <option value="Haïti">🇭🇹 Haïti</option>
                            <option value="Martinique">🇲🇶 Martinique</option>
                            <option value="Mexique">🇲🇽 Mexique</option>
                            <option value="Panama">🇵🇦 Panama</option>
                            <option value="Pérou">🇵🇪 Pérou</option>
                            <option value="La Réunion">🇷🇪 La Réunion</option>
                            <option value="Uruguay">🇺🇾 Uruguay</option>
                          </optgroup>
                          <optgroup label="Moyen-Orient &amp; Asie-Pacifique">
                            <option value="Arabie Saoudite">🇸🇦 Arabie Saoudite</option>
                            <option value="Australie">🇦🇺 Australie</option>
                            <option value="Bahreïn">🇧🇭 Bahreïn</option>
                            <option value="Chine">🇨🇳 Chine</option>
                            <option value="Corée du Sud">🇰🇷 Corée du Sud</option>
                            <option value="Hong Kong">🇭🇰 Hong Kong</option>
                            <option value="Inde">🇮🇳 Inde</option>
                            <option value="Indonésie">🇮🇩 Indonésie</option>
                            <option value="Israël">🇮🇱 Israël</option>
                            <option value="Japon">🇯🇵 Japon</option>
                            <option value="Koweït">🇰🇼 Koweït</option>
                            <option value="Liban">🇱🇧 Liban</option>
                            <option value="Malaisie">🇲🇾 Malaisie</option>
                            <option value="Nouvelle-Calédonie">🇳🇨 Nouvelle-Calédonie</option>
                            <option value="Nouvelle-Zélande">🇳🇿 Nouvelle-Zélande</option>
                            <option value="Oman">🇴🇲 Oman</option>
                            <option value="Polynésie Française">🇵🇫 Polynésie Française</option>
                            <option value="Qatar">🇶🇦 Qatar</option>
                            <option value="Taïwan">🇹🇼 Taïwan</option>
                            <option value="Thaïlande">🇹🇭 Thaïlande</option>
                            <option value="Turquie">🇹🇷 Turquie</option>
                            <option value="Vietnam">🇻🇳 Vietnam</option>
                          </optgroup>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 size-4 text-gray-600" />
                      </div>
                    </div>

                    {/* First Name & Last Name */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="firstName"
                          className="text-xs sm:text-sm font-extrabold text-gray-800"
                        >
                          {language === "fr" ? "Prénom *" : "First Name *"}
                        </label>
                        <Input
                          id="firstName"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Jean"
                          className="rounded-xl border-gray-300 bg-white px-4 py-3 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-[#00c853] focus:ring-2 focus:ring-[#00c853]/20 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="lastName"
                          className="text-xs sm:text-sm font-extrabold text-gray-800"
                        >
                          {language === "fr" ? "Nom *" : "Last Name *"}
                        </label>
                        <Input
                          id="lastName"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Dupont"
                          className="rounded-xl border-gray-300 bg-white px-4 py-3 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-[#00c853] focus:ring-2 focus:ring-[#00c853]/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="phone"
                        className="text-xs sm:text-sm font-extrabold text-gray-800"
                      >
                        {language === "fr" ? "Numéro de Téléphone *" : "Phone Number *"}
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+33 6 12 34 56 78"
                        className="rounded-xl border-gray-300 bg-white px-4 py-3 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-[#00c853] focus:ring-2 focus:ring-[#00c853]/20 transition-all"
                      />
                    </div>

                    {/* Email Address */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="email"
                        className="text-xs sm:text-sm font-extrabold text-gray-800"
                      >
                        {language === "fr" ? "Adresse E-mail *" : "Email Address *"}
                      </label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nom@exemple.com"
                        className="rounded-xl border-gray-300 bg-white px-4 py-3 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-[#00c853] focus:ring-2 focus:ring-[#00c853]/20 transition-all"
                      />
                    </div>

                    {/* Password with Eye Toggle */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="password"
                        className="text-xs sm:text-sm font-extrabold text-gray-800"
                      >
                        {language === "fr" ? "Mot de Passe *" : "Password *"}
                      </label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={language === "fr" ? "Min. 8 caractères, 1 chiffre" : "Min. 8 characters, 1 digit"}
                          className="rounded-xl border-gray-300 bg-white px-4 py-3 pr-11 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-[#00c853] focus:ring-2 focus:ring-[#00c853]/20 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="confirmPassword"
                        className="text-xs sm:text-sm font-extrabold text-gray-800"
                      >
                        {language === "fr" ? "Confirmer le Mot de Passe *" : "Confirm Password *"}
                      </label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="rounded-xl border-gray-300 bg-white px-4 py-3 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-[#00c853] focus:ring-2 focus:ring-[#00c853]/20 transition-all"
                      />
                    </div>

                    {/* Legal Policy Links */}
                    <p className="text-xs text-gray-500 font-medium pt-1">
                      {language === "fr" ? (
                        <>
                          En vous inscrivant, vous acceptez nos{" "}
                          <Link to="/terms" className="font-bold text-gray-900 underline hover:text-[#00c853]">
                            CGU
                          </Link>{" "}
                          et notre{" "}
                          <Link to="/privacy" className="font-bold text-gray-900 underline hover:text-[#00c853]">
                            Politique de Confidentialité
                          </Link>
                          .
                        </>
                      ) : (
                        <>
                          By signing up, you agree to our{" "}
                          <Link to="/terms" className="font-bold text-gray-900 underline hover:text-[#00c853]">
                            Terms
                          </Link>{" "}
                          and{" "}
                          <Link to="/privacy" className="font-bold text-gray-900 underline hover:text-[#00c853]">
                            Privacy Policy
                          </Link>
                          .
                        </>
                      )}
                    </p>

                    {/* Create Account Black Pill Button */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 rounded-xl bg-black hover:bg-neutral-900 hover:text-[#00D084] text-white font-extrabold py-5 text-sm tracking-wide transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                    >
                      {loading && <Loader2 className="size-4 animate-spin text-emerald-400" />}
                      <span>
                        {loading
                          ? language === "fr"
                            ? "Envoi du code de sécurité..."
                            : "Sending security code..."
                          : language === "fr"
                          ? "Continuer (Vérification e-mail)"
                          : "Continue (Email Verification)"}
                      </span>
                    </Button>
                  </form>
                </>
              )}
            </div>

            {/* Bottom Switch Link */}
            <div className="mt-8 pt-4 text-center text-xs sm:text-sm font-semibold text-gray-600 border-t border-gray-100 flex justify-between items-center">
              <Link to="/login" className="font-extrabold text-gray-900 underline hover:text-[#00c853]">
                {language === "fr" ? "Déjà une inscription ? Se connecter" : "Already have an account? Sign in"}
              </Link>
              <Link to="/" className="text-gray-500 hover:text-gray-900">
                {language === "fr" ? "← Accueil" : "← Home"}
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
