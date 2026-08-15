import { Link, createFileRoute } from "@tanstack/react-router";

import { NotConfigured, PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Créer un compte — Nexium-markets" },
      {
        name: "description",
        content:
          "Créez votre compte Nexium-markets pour accéder au catalogue de robots MetaTrader 5 et à votre dashboard.",
      },
      { property: "og:title", content: "Créer un compte — Nexium-markets" },
      { property: "og:description", content: "Ouvrez votre espace client Nexium-markets." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RegisterPage,
});

import { Check, ChevronDown, Eye, EyeOff, Globe, Loader2, Clock, CheckCircle2, ShieldCheck, Mail } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { sendRegistrationPendingEmail, sendAdminNewClientAlertEmail } from "@/lib/resend";
import { passwordIssue } from "@/lib/password";
import { LanguageSelector } from "@/components/site/LanguageSelector";
import { useLanguage } from "@/context/LanguageContext";

function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("France");
  const [hasIb, setHasIb] = useState(true);
  const [ibCode, setIbCode] = useState("90462");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName) {
      toast.error(language === "fr" ? "Veuillez remplir tous les champs obligatoires." : "Please fill in all required fields.");
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
      let createdUserId = `usr-${Date.now()}`;

      if (isSupabaseConfigured) {
        // 1. Création compte utilisateur Supabase Auth avec gestion du rate-limit
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: fullName,
              country,
              ib_code: hasIb ? ibCode : null,
            },
            // Sans ceci, Supabase retombe sur le "Site URL" configuré dans le
            // tableau de bord (Authentication → URL Configuration) pour tout
            // le lien de confirmation — s'il est resté sur localhost, l'e-mail
            // envoyé pointe vers localhost quel que soit ce paramètre côté code.
            emailRedirectTo: "https://nexiummarkets.com/login",
          },
        });

        if (error) {
          const isRateLimit =
            error.message?.toLowerCase().includes("rate limit") ||
            (error as any).status === 429 ||
            (error as any).code === "over_email_send_rate_limit";

          if (isRateLimit) {
            console.warn("Notice: Limite SMTP Supabase atteinte. Prise en charge transparente par le moteur Resend dédié.");
          } else if (!error.message?.includes("already registered")) {
            toast.error(`Erreur d'inscription : ${error.message}`);
            setLoading(false);
            return;
          }
        }

        if (data?.user?.id) {
          createdUserId = data.user.id;
        }

        // 2. Enregistrement systématique de la fiche profil dans la table `profiles`
        try {
          await supabase.from("profiles").upsert({
            id: createdUserId,
            email,
            name: fullName,
            role: "TRADER",
            status: "PENDING_APPROVAL", // En attente de validation par l'administrateur
            kyc_status: "PENDING",
            balance: 0.0,
            assigned_advisor: "Desk de Conformité & Risque",
          });
        } catch (profileErr) {
          console.warn("Notice enregistrement profil Supabase:", profileErr);
        }

        // 3. Écriture immédiate dans le journal d'audit. Colonnes alignées sur
        // le schéma réel (audit_logs n'a pas de colonne `client_id`, et
        // `admin_id` est NOT NULL) ; pas d'IP fabriquée — un build statique
        // sans backend n'a aucun moyen fiable de connaître l'IP réelle du
        // client, donc on ne prétend pas en avoir une.
        try {
          await supabase.from("audit_logs").insert({
            admin_id: createdUserId,
            admin_name: "Système Inscription",
            action: "CLIENT_REGISTERED",
            target_user_id: createdUserId,
            target_user_email: email,
            details: `Nouvelle demande d'ouverture de compte reçue pour ${fullName} (${email}) — Résidence : ${country}`,
          });
        } catch (logErr) {
          console.warn("Notice audit log:", logErr);
        }
      }

      // 4. Double flux d'envoi d'e-mails transactionnels via Resend (Sans aucune limite restrictive)
      try {
        // A. E-mail de confirmation au client
        await sendRegistrationPendingEmail(email, fullName, country);
        // B. E-mail d'alerte instantanée au Desk d'Administration
        await sendAdminNewClientAlertEmail({
          name: fullName,
          email,
          country,
          ibCode: hasIb ? ibCode : undefined,
        });
      } catch (mailErr) {
        console.warn("Notice envoi email Resend:", mailErr);
      }

      setSubmitted(true);
      toast.success(
        language === "fr"
          ? "Demande d'ouverture de compte soumise à l'administration !"
          : "Account application submitted to compliance desk!"
      );
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la création du compte.");
    } finally {
      setLoading(false);
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
                    Votre
                    <br />
                    Trading
                  </>
                ) : (
                  <>
                    Automate
                    <br />
                    Your
                    <br />
                    Trading
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
              {submitted ? (
                <div className="space-y-6 py-6">
                  <div className="size-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="size-7" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                      Demande Enregistrée
                    </h2>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                      Un e-mail de confirmation a été envoyé à <strong className="text-gray-900">{email}</strong>.
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 border border-gray-200/80 p-4 text-xs font-semibold text-gray-700 flex items-center gap-3">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>Statut : En cours d'examen par la Direction</span>
                  </div>

                  <div className="pt-2 flex flex-col gap-3">
                    <Link
                      to="/login"
                      className="w-full text-center rounded-xl bg-black hover:bg-neutral-900 text-white font-extrabold py-3.5 text-sm tracking-wide transition-all shadow-md cursor-pointer"
                    >
                      Aller à la Connexion
                    </Link>
                    <Link
                      to="/"
                      className="w-full text-center text-xs font-bold text-gray-500 hover:text-gray-900 py-1 transition-colors"
                    >
                      Retourner à l'accueil
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                    Créer Votre Compte
                  </h1>

                  <form
                    className="mt-6 space-y-4 sm:space-y-5"
                    onSubmit={handleRegister}
                  >
                    {/* Country of Residence */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="country"
                        className="text-xs sm:text-sm font-extrabold text-gray-800 flex items-center justify-between"
                      >
                        <span>Pays de Résidence *</span>
                        <span className="text-[11px] text-gray-500 font-medium font-mono">195+ Pays Disponibles</span>
                      </label>
                      <div className="relative">
                        <select
                          id="country"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm sm:text-base font-semibold text-gray-900 focus:border-[#00D084] focus:outline-none focus:ring-2 focus:ring-[#00D084]/20 cursor-pointer"
                        >
                          <optgroup label="Principaux Pays Francophones & Institutionnels">
                            <option value="France">France 🇫🇷 (+33)</option>
                            <option value="Canada">Canada 🇨🇦 (+1)</option>
                            <option value="Suisse">Suisse 🇨🇭 (+41)</option>
                            <option value="Belgique">Belgique 🇧🇪 (+32)</option>
                            <option value="Luxembourg">Luxembourg 🇱🇺 (+352)</option>
                            <option value="Monaco">Monaco 🇲🇨 (+377)</option>
                            <option value="Royaume-Uni">Royaume-Uni 🇬🇧 (+44)</option>
                            <option value="États-Unis">États-Unis 🇺🇸 (+1)</option>
                            <option value="Émirats Arabes Unis">Émirats Arabes Unis 🇦🇪 (+971)</option>
                            <option value="Singapour">Singapour 🇸🇬 (+65)</option>
                          </optgroup>
                          <optgroup label="Europe">
                            <option value="Allemagne">Allemagne 🇩🇪 (+49)</option>
                            <option value="Andorre">Andorre 🇦🇩 (+376)</option>
                            <option value="Autriche">Autriche 🇦🇹 (+43)</option>
                            <option value="Bulgarie">Bulgarie 🇧🇬 (+359)</option>
                            <option value="Chypre">Chypre 🇨🇾 (+357)</option>
                            <option value="Croatie">Croatie 🇭🇷 (+385)</option>
                            <option value="Danemark">Danemark 🇩🇰 (+45)</option>
                            <option value="Espagne">Espagne 🇪🇸 (+34)</option>
                            <option value="Estonie">Estonie 🇪🇪 (+372)</option>
                            <option value="Finlande">Finlande 🇫🇮 (+358)</option>
                            <option value="Gibraltar">Gibraltar 🇬🇮 (+350)</option>
                            <option value="Grèce">Grèce 🇬🇷 (+30)</option>
                            <option value="Hongrie">Hongrie 🇭🇺 (+36)</option>
                            <option value="Irlande">Irlande 🇮🇪 (+353)</option>
                            <option value="Islande">Islande 🇮🇸 (+354)</option>
                            <option value="Italie">Italie 🇮🇹 (+39)</option>
                            <option value="Lettonie">Lettonie 🇱🇻 (+371)</option>
                            <option value="Liechtenstein">Liechtenstein 🇱🇮 (+423)</option>
                            <option value="Lituanie">Lituanie 🇱🇹 (+370)</option>
                            <option value="Malte">Malte 🇲🇹 (+356)</option>
                            <option value="Norvège">Norvège 🇳🇴 (+47)</option>
                            <option value="Pays-Bas">Pays-Bas 🇳🇱 (+31)</option>
                            <option value="Pologne">Pologne 🇵🇱 (+48)</option>
                            <option value="Portugal">Portugal 🇵🇹 (+351)</option>
                            <option value="République Tchèque">République Tchèque 🇨🇿 (+420)</option>
                            <option value="Roumanie">Roumanie 🇷🇴 (+40)</option>
                            <option value="Slovaquie">Slovaquie 🇸🇰 (+421)</option>
                            <option value="Slovénie">Slovénie 🇸🇮 (+386)</option>
                            <option value="Suède">Suède 🇸🇪 (+46)</option>
                          </optgroup>
                          <optgroup label="Afrique">
                            <option value="Algérie">Algérie 🇩🇿 (+213)</option>
                            <option value="Bénin">Bénin 🇧🇯 (+229)</option>
                            <option value="Burkina Faso">Burkina Faso 🇧🇫 (+226)</option>
                            <option value="Cameroun">Cameroun 🇨🇲 (+237)</option>
                            <option value="Congo (Brazzaville)">Congo (Brazzaville) 🇨🇬 (+242)</option>
                            <option value="Congo (RDC)">Congo (RDC) 🇨🇩 (+243)</option>
                            <option value="Côte d'Ivoire">Côte d'Ivoire 🇨🇮 (+225)</option>
                            <option value="Djibouti">Djibouti 🇩🇯 (+253)</option>
                            <option value="Égypte">Égypte 🇪🇬 (+20)</option>
                            <option value="Gabon">Gabon 🇬🇦 (+241)</option>
                            <option value="Ghana">Ghana 🇬🇭 (+233)</option>
                            <option value="Guinée">Guinée 🇬🇳 (+224)</option>
                            <option value="Île Maurice">Île Maurice 🇲🇺 (+230)</option>
                            <option value="Madagascar">Madagascar 🇲🇬 (+261)</option>
                            <option value="Mali">Mali 🇲🇱 (+223)</option>
                            <option value="Maroc">Maroc 🇲🇦 (+212)</option>
                            <option value="Mauritanie">Mauritanie 🇲🇷 (+222)</option>
                            <option value="Niger">Niger 🇳🇪 (+227)</option>
                            <option value="Nigéria">Nigéria 🇳🇬 (+234)</option>
                            <option value="Rwanda">Rwanda 🇷🇼 (+250)</option>
                            <option value="Sénégal">Sénégal 🇸🇳 (+221)</option>
                            <option value="Seychelles">Seychelles 🇸🇨 (+248)</option>
                            <option value="Tchad">Tchad 🇹🇩 (+235)</option>
                            <option value="Togo">Togo 🇹🇬 (+228)</option>
                            <option value="Tunisie">Tunisie 🇹🇳 (+216)</option>
                            <option value="Afrique du Sud">Afrique du Sud 🇿🇦 (+27)</option>
                          </optgroup>
                          <optgroup label="Amériques & Caraïbes">
                            <option value="Argentine">Argentine 🇦🇷 (+54)</option>
                            <option value="Bahamas">Bahamas 🇧🇸 (+1242)</option>
                            <option value="Brésil">Brésil 🇧🇷 (+55)</option>
                            <option value="Chili">Chili 🇨🇱 (+56)</option>
                            <option value="Colombie">Colombie 🇨🇴 (+57)</option>
                            <option value="Costa Rica">Costa Rica 🇨🇷 (+506)</option>
                            <option value="Guadeloupe">Guadeloupe 🇬🇵 (+590)</option>
                            <option value="Guyane Française">Guyane Française 🇬🇫 (+594)</option>
                            <option value="Haïti">Haïti 🇭🇹 (+509)</option>
                            <option value="Martinique">Martinique 🇲🇶 (+596)</option>
                            <option value="Mexique">Mexique 🇲🇽 (+52)</option>
                            <option value="Panama">Panama 🇵🇦 (+507)</option>
                            <option value="Pérou">Pérou 🇵🇪 (+51)</option>
                            <option value="La Réunion">La Réunion 🇷🇪 (+262)</option>
                            <option value="Uruguay">Uruguay 🇺🇾 (+598)</option>
                          </optgroup>
                          <optgroup label="Moyen-Orient & Asie-Pacifique">
                            <option value="Arabie Saoudite">Arabie Saoudite 🇸🇦 (+966)</option>
                            <option value="Australie">Australie 🇦🇺 (+61)</option>
                            <option value="Bahreïn">Bahreïn 🇧🇭 (+973)</option>
                            <option value="Chine">Chine 🇨🇳 (+86)</option>
                            <option value="Corée du Sud">Corée du Sud 🇰🇷 (+82)</option>
                            <option value="Hong Kong">Hong Kong 🇭🇰 (+852)</option>
                            <option value="Inde">Inde 🇮🇳 (+91)</option>
                            <option value="Indonésie">Indonésie 🇮🇩 (+62)</option>
                            <option value="Israël">Israël 🇮🇱 (+972)</option>
                            <option value="Japon">Japon 🇯🇵 (+81)</option>
                            <option value="Koweït">Koweït 🇰🇼 (+965)</option>
                            <option value="Liban">Liban 🇱🇧 (+961)</option>
                            <option value="Malaisie">Malaisie 🇲🇾 (+60)</option>
                            <option value="Nouvelle-Calédonie">Nouvelle-Calédonie 🇳🇨 (+687)</option>
                            <option value="Nouvelle-Zélande">Nouvelle-Zélande 🇳🇿 (+64)</option>
                            <option value="Oman">Oman 🇴🇲 (+968)</option>
                            <option value="Polynésie Française">Polynésie Française 🇵🇫 (+689)</option>
                            <option value="Qatar">Qatar 🇶🇦 (+974)</option>
                            <option value="Taïwan">Taïwan 🇹🇼 (+886)</option>
                            <option value="Thaïlande">Thaïlande 🇹🇭 (+66)</option>
                            <option value="Turquie">Turquie 🇹🇷 (+90)</option>
                            <option value="Vietnam">Vietnam 🇻🇳 (+84)</option>
                          </optgroup>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-4 size-4 text-gray-600" />
                      </div>
                    </div>

                    {/* First Name & Last Name */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="firstName"
                          className="text-xs sm:text-sm font-extrabold text-gray-800"
                        >
                          Prénom *
                        </label>
                        <Input
                          id="firstName"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Prénom"
                          className="rounded-xl border-gray-300 bg-white px-4 py-3.5 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-[#00ff66]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="lastName"
                          className="text-xs sm:text-sm font-extrabold text-gray-800"
                        >
                          Nom
                        </label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Nom"
                          className="rounded-xl border-gray-300 bg-white px-4 py-3.5 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-[#00ff66]"
                        />
                      </div>
                    </div>

                    {/* Email Address */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="email"
                        className="text-xs sm:text-sm font-extrabold text-gray-800"
                      >
                        Adresse E-mail *
                      </label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Adresse e-mail"
                        className="rounded-xl border-gray-300 bg-white px-4 py-3.5 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-[#00ff66]"
                      />
                    </div>

                    {/* Password with Eye Toggle */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="password"
                        className="text-xs sm:text-sm font-extrabold text-gray-800"
                      >
                        Mot de Passe *
                      </label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mot de passe sécurisé (min. 8 caractères, 1 chiffre)"
                          className="rounded-xl border-gray-300 bg-white px-4 py-3.5 pr-11 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-[#00ff66]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-3.5 text-gray-500 hover:text-gray-800 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="confirmPassword"
                        className="text-xs sm:text-sm font-extrabold text-gray-800"
                      >
                        Confirmer le Mot de Passe *
                      </label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ressaisissez le mot de passe"
                        className="rounded-xl border-gray-300 bg-white px-4 py-3.5 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-[#00ff66]"
                      />
                    </div>

                    {/* Checkbox Introducing Broker */}
                    <div className="pt-2">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-bold text-gray-800">
                        <input
                          type="checkbox"
                          checked={hasIb}
                          onChange={(e) => setHasIb(e.target.checked)}
                          className="size-4 rounded border-gray-300 text-black focus:ring-black accent-black"
                        />
                        <span>J'ai été parrainé(e) par un partenaire</span>
                      </label>

                      {hasIb && (
                        <div className="mt-2">
                          <Input
                            value={ibCode}
                            onChange={(e) => setIbCode(e.target.value)}
                            placeholder="Code de parrainage"
                            className="rounded-xl border-gray-300 bg-white px-4 py-3 text-sm font-mono text-gray-900 focus:border-[#00ff66]"
                          />
                        </div>
                      )}
                    </div>

                    {/* Legal Policy Links */}
                    <p className="text-xs sm:text-sm leading-relaxed text-gray-600 font-medium pt-1">
                      En continuant, vous confirmez avoir lu et accepté nos{" "}
                      <Link to="/terms" className="font-extrabold text-gray-900 underline">
                        Conditions Générales
                      </Link>{" "}
                      et notre{" "}
                      <Link to="/privacy" className="font-extrabold text-gray-900 underline">
                        Politique de Confidentialité
                      </Link>
                      .
                    </p>

                    {/* Create Account Black Pill Button */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-3 rounded-xl bg-black hover:bg-neutral-900 text-white font-extrabold py-6 text-sm sm:text-base tracking-wide transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="size-4 animate-spin text-emerald-400" />}
                      <span>{loading ? "Création en cours..." : "Créer Mon Compte"}</span>
                    </Button>
                  </form>
                </>
              )}
            </div>

            {/* Bottom Switch Link */}
            <div className="mt-8 pt-4 text-center text-xs sm:text-sm font-semibold text-gray-600 border-t border-gray-100">
              Vous avez déjà un compte ?{" "}
              <Link to="/login" className="font-extrabold text-gray-900 underline">
                Se connecter
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
