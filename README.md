# Apex Trading Hub

MISSION

Construis une plateforme web SaaS professionnelle complète consacrée aux robots de trading automatisé pour MetaTrader 5. le nom du site est Nexium-markets

Le site doit s'inspirer de l'expérience premium et moderne d'un site tel que :

https://preview.themeforest.net/item/sastik-saas-tech-startup-wordpress-theme/full_screen_preview/64179542?_gl=1*166gssg*_gcl_au*MTkzMzgwNDY0OC4xNzg2NjM5MzQz*_ga*NTUyMzY5MjYyLjE3ODY2MzkzNDM.*_ga_ZKBVC1X78F*czE3ODY2MzkzNDIkbzEkZzAkdDE3ODY2MzkzNDIkajYwJGwwJGgw

le positionnement commercial ;

l'univers trading / technologie / IA ;

la présentation premium ;

les pages de vente d'un robot ;

les appels à l'action ;

le style fintech.

Je veux construire une plateforme beaucoup plus complète avec :

site public ;

authentification ;

espace client ;

gestion des robots ;

connexion MetaTrader 5 ;

gestion des licences ;

statistiques ;

abonnements et paiements ;

support client ;

système de notifications ;

administration complète ;

contrôle total du système par le Super Admin.

La plateforme doit être conçue comme un véritable produit SaaS évolutif et non comme une simple landing page.

1. OBJECTIF DE LA PLATEFORME

La plateforme permet à un utilisateur de :

créer un compte ;

se connecter ;

découvrir différents robots de trading ;

acheter ou souscrire à un robot ;

télécharger ou activer son robot ;

enregistrer son compte MetaTrader ;

associer une licence à un compte MT5 ;

voir si son robot est actif ou arrêté ;

voir les statistiques remontées par MT5 ;

consulter ses positions ;

consulter son historique ;

voir son P&L ;

consulter son drawdown ;

consulter ses gains/pertes ;

consulter son solde et son equity ;

recevoir des notifications ;

gérer son abonnement ;

consulter ses factures ;

ouvrir des tickets de support ;

télécharger les nouvelles versions de ses robots.

L'administrateur doit pouvoir contrôler absolument tous ces éléments depuis son propre dashboard.

2. STACK TECHNIQUE RECOMMANDÉE

Utiliser une architecture moderne, maintenable et scalable.

Frontend

Next.js dernière version stable

TypeScript

React

Tailwind CSS

shadcn/ui

Lucide Icons

TanStack Query

Recharts pour les graphiques

Framer Motion uniquement pour des animations subtiles

Backend principal

Utiliser :

Node.js

TypeScript

NestJS

ou, si l'architecture le justifie :

API Routes / Server Actions Next.js pour certaines fonctions simples ;

NestJS comme API métier principale.

Base de données

PostgreSQL

Prisma ORM

Cache / temps réel

Redis

WebSocket ou Socket.IO

Jobs en arrière-plan

BullMQ + Redis

Utiliser les jobs pour :

synchronisation MT5 ;

emails ;

notifications ;

calculs statistiques ;

expiration des licences ;

renouvellements ;

traitements administratifs.

Stockage fichiers

Prévoir un stockage S3-compatible pour :

fichiers EA ;

fichiers .ex5 ;

documentation ;

captures ;

avatars ;

factures ;

versions de robots.

Paiements

Prévoir Stripe avec :

Checkout ;

abonnements ;

paiements uniques ;

coupons ;

webhooks ;

factures ;

annulation ;

renouvellement ;

échec de paiement.

L'architecture PaymentProvider doit cependant être abstraite afin de pouvoir ajouter plus tard d'autres passerelles.

3. ARCHITECTURE GÉNÉRALE

Créer trois interfaces distinctes.

A. Site public

Route :

/

B. Dashboard utilisateur

Route :

/dashboard/*

C. Administration

Route :

/admin/*

Ne jamais mélanger les autorisations utilisateur et administrateur.

Mettre en place un véritable système RBAC.

4. RÔLES ET PERMISSIONS

Créer au minimum les rôles :

SUPER_ADMIN

Accès absolu à toute la plateforme.

ADMIN

Administration générale avec limitations définies par SUPER_ADMIN.

SUPPORT

Gestion :

utilisateurs ;

tickets ;

documentation ;

problèmes de licences.

Mais pas accès aux paramètres critiques.

FINANCE

Gestion :

commandes ;

paiements ;

remboursements ;

abonnements ;

factures.

CONTENT_MANAGER

Gestion :

pages ;

FAQ ;

témoignages ;

articles ;

contenu marketing.

USER

Client standard.

5. SUPER ADMIN — CONTRÔLE TOTAL

Le SUPER_ADMIN doit pouvoir gérer la plateforme sans avoir besoin d'un développeur pour les opérations courantes.

Créer un dashboard Super Admin très complet.

Menu :

Dashboard

Utilisateurs

Comptes MT5

Robots

Versions

Licences

Abonnements

Commandes

Paiements

Revenus

Coupons

Brokers

Serveurs

Positions

Trades

Statistiques

Notifications

Emails

Tickets

FAQ

Pages

Blog

Témoignages

Logs

Sécurité

API

Paramètres

Maintenance

6. DASHBOARD ADMINISTRATEUR

Afficher en haut :

utilisateurs totaux ;

utilisateurs actifs ;

nouveaux utilisateurs ;

abonnements actifs ;

abonnements expirés ;

licences actives ;

robots actifs ;

comptes MT5 connectés ;

revenus du jour ;

revenus du mois ;

ARR/MRR si abonnement ;

tickets ouverts ;

erreurs critiques.

Ajouter graphiques :

Revenus

7 jours ;

30 jours ;

90 jours ;

1 an.

Utilisateurs

inscriptions ;

actifs ;

désabonnements.

Robots

nombre d'activations ;

utilisateurs par robot ;

robots actifs/inactifs.

Trading

Lorsque les données MT5 sont disponibles :

volume total ;

trades ;

P&L ;

drawdown ;

win rate.

Ne jamais présenter ces informations comme une garantie de rendement futur.

7. GESTION DES UTILISATEURS

Le Super Admin peut :

rechercher un utilisateur ;

filtrer ;

ouvrir sa fiche ;

modifier nom ;

modifier email ;

modifier téléphone ;

modifier pays ;

vérifier email ;

suspendre compte ;

réactiver compte ;

désactiver compte ;

supprimer compte ;

forcer changement mot de passe ;

invalider toutes ses sessions ;

ajouter une note interne ;

ajouter un tag ;

voir ses connexions ;

voir son IP ;

voir ses appareils ;

voir ses paiements ;

voir ses abonnements ;

voir ses licences ;

voir ses robots ;

voir ses comptes MT5 ;

voir ses tickets ;

voir son journal d'activité.

Prévoir également :

Impersonate User

permettant au Super Admin d'ouvrir temporairement le dashboard comme l'utilisateur pour diagnostiquer un problème.

Cette fonction doit être :

fortement sécurisée ;

journalisée ;

réservée au Super Admin ;

clairement signalée visuellement.

8. AUTHENTIFICATION

Implémenter :

inscription email/mot de passe ;

connexion ;

déconnexion ;

email de vérification ;

mot de passe oublié ;

réinitialisation ;

changement de mot de passe ;

sessions sécurisées ;

refresh token sécurisé ;

rate limiting.

Prévoir éventuellement :

Google OAuth ;

Apple OAuth.

Ajouter 2FA/TOTP pour :

administrateurs obligatoire ;

utilisateurs optionnel.

9. CATALOGUE DES ROBOTS

Créer une section :

/robots

Chaque robot doit posséder :

nom ;

slug ;

logo ;

images ;

description courte ;

description complète ;

catégorie ;

version ;

plateforme ;

MT4 / MT5 ;

actifs supportés ;

timeframes ;

niveau de risque ;

type de stratégie ;

prix ;

abonnement ou achat unique ;

période d'essai éventuelle ;

fonctionnalités ;

prérequis ;

documentation ;

changelog ;

statut ;

date publication.

Exemples de catégories :

Forex

Gold

Indices

Crypto

Scalping

Swing

Trend Following

Breakout

Mean Reversion

10. PAGE DÉTAIL D'UN ROBOT

Route :

/robots/[slug]

Créer une page premium comportant :

Hero

Nom du robot

Exemple :

Lio23 AI Gold

Sous-titre :

Automatisation intelligente pour MetaTrader 5

CTA :

Essayer le robot

CTA secondaire :

Voir les fonctionnalités

Ajouter :

prix ;

compatibilité ;

statut ;

dernière version.

11. PRÉSENTATION DES PERFORMANCES

Si des statistiques réelles sont affichées, montrer :

balance ;

equity ;

rendement ;

P&L ;

drawdown ;

nombre de trades ;

win rate ;

profit factor ;

gain moyen ;

perte moyenne ;

historique.

Afficher clairement :

« Les performances passées ne garantissent pas les résultats futurs. Le trading comporte un risque de perte en capital. »

Ne jamais fabriquer de statistiques de trading.

Ne jamais utiliser de faux chiffres dynamiques.

Toutes les données affichées doivent provenir :

de la base de données ;

de MT5 ;

d'un dataset de démonstration explicitement marqué DEMO.

12. GESTION DES VERSIONS DES ROBOTS

Créer :

RobotVersion

Champs :

id

robotId

version

releaseNotes

file

checksum

minimumMTVersion

status

publishedAt

createdAt

Admin peut :

publier version ;

uploader EX5 ;

désactiver version ;

rollback ;

rendre mise à jour obligatoire ;

consulter téléchargements.

13. LICENCES

Le système de licences est essentiel.

Créer :

License

avec :

id

licenseKey

userId

robotId

subscriptionId

mtAccountId

status

maxAccounts

activatedAt

expiresAt

lastValidationAt

createdAt

Status :

ACTIVE

INACTIVE

EXPIRED

SUSPENDED

REVOKED

Chaque licence possède une clé impossible à deviner.

Exemple visuel :

LIO23-XXXX-XXXX-XXXX-XXXX

Mais stocker en base de façon sécurisée.

14. ACTIVATION MT5

Le robot MT5 doit pouvoir envoyer une demande au serveur :

POST /api/v1/licenses/validate

Informations :

licenseKey

robotId

version

accountNumber

broker

server

Réponse :

valid

status

expiresAt

accountAuthorized

latestVersion

updateRequired

Ne jamais exposer les secrets administrateurs dans l'EA.

Ajouter :

signature ;

nonce ;

timestamp ;

rate limiting.

15. GESTION DES COMPTES METATRADER

Dashboard utilisateur :

/dashboard/accounts

L'utilisateur peut ajouter :

plateforme ;

broker ;

serveur ;

numéro de compte ;

nom du compte.

IMPORTANT :

Ne jamais demander ou stocker inutilement le mot de passe principal MT5 dans la base classique.

Si une authentification distante est indispensable, utiliser :

secret manager ;

chiffrement fort ;

credentials isolés ;

rotation ;

audit.

Architecture préférée :

un Bridge sécurisé installé près du terminal MT5.

16. ARCHITECTURE MT5

Créer un service indépendant :

MT5 Bridge

Technologies recommandées :

Python

FastAPI

Architecture :

MetaTrader 5
↓
MT5 Bridge
↓
API sécurisée
↓
Backend SaaS
↓
PostgreSQL
↓
Dashboard

Le navigateur ne doit jamais communiquer directement avec MetaTrader.

17. MT5 BRIDGE

Le Bridge doit pouvoir transmettre :

Account

login ;

broker ;

server ;

balance ;

equity ;

margin ;

free margin ;

currency ;

leverage.

Positions

ticket ;

symbol ;

type ;

lot ;

entry ;

SL ;

TP ;

currentPrice ;

profit ;

swap ;

openTime.

Historique

ticket ;

symbol ;

side ;

volume ;

entryPrice ;

exitPrice ;

SL ;

TP ;

commission ;

swap ;

profit ;

openedAt ;

closedAt.

18. HEARTBEAT DES ROBOTS

Chaque EA installé doit envoyer régulièrement un heartbeat.

Exemple :

POST /api/v1/agents/heartbeat

Avec :

licenseKey ;

account ;

robot ;

version ;

serverTime ;

status.

Permettre au dashboard d'afficher :

🟢 Robot connecté

🟠 Dernière communication il y a X minutes

🔴 Robot hors ligne

Ne pas simplement afficher ACTIVE parce qu'une licence existe.

Il faut distinguer :

Licence active

et

Robot réellement connecté.

19. DASHBOARD UTILISATEUR

Créer :

/dashboard

Interface SaaS moderne.

Sidebar :

Vue générale

Mes robots

Mes comptes

Trading

Positions

Historique

Analytics

Licences

Abonnement

Facturation

Notifications

Support

Documentation

Profil

Sécurité

20. OVERVIEW UTILISATEUR

Afficher :

Portfolio

Balance

Equity

P&L du jour

P&L semaine

P&L mois

Drawdown

Trades ouverts

Robots

Pour chaque robot :

nom ;

compte ;

licence ;

version ;

statut ;

dernière connexion.

21. POSITIONS OUVERTES

Tableau :

Symbol

Type

Volume

Entry

Current price

SL

TP

P&L

Robot

Compte

Durée

Ajouter filtres :

compte ;

robot ;

symbole ;

Buy/Sell.

Temps réel via WebSocket lorsque possible.

22. HISTORIQUE DES TRADES

Afficher :

Date

Robot

Compte

Symbol

Buy/Sell

Volume

Entry

Exit

P&L

Duration

Filtres :

aujourd'hui ;

semaine ;

mois ;

personnalisée ;

robot ;

compte ;

symbole.

Export :

CSV.

23. ANALYTICS

Créer une véritable page analytique.

Afficher :

Performance

Net P&L

Win rate

Profit factor

Expectancy

Average win

Average loss

Risk/Reward

Max drawdown

Recovery factor

Trades

Graphiques

Equity Curve

Balance Curve

P&L par jour

P&L par robot

P&L par symbole

Distribution gagnants/perdants

Statistiques complémentaires

meilleures heures ;

pires heures ;

jours les plus performants ;

jours les moins performants ;

série maximum de gains ;

série maximum de pertes.

Toutes les métriques doivent être calculées à partir de données enregistrées et testées.

24. ABONNEMENTS

Créer différents plans.

Exemple :

STARTER

PRO

ULTIMATE

Admin doit pouvoir modifier :

nom ;

tarif ;

devise ;

durée ;

robots inclus ;

nombre de comptes ;

fonctionnalités ;

essai gratuit ;

statut.

25. FACTURATION

Utilisateur :

/dashboard/billing

Afficher :

abonnement ;

prix ;

prochaine facturation ;

mode de paiement ;

historique ;

factures.

Actions :

changer de plan ;

renouveler ;

annuler ;

mettre à jour carte.

26. ADMIN — ABONNEMENTS

Admin peut :

créer abonnement ;

modifier ;

annuler ;

prolonger ;

offrir abonnement ;

ajouter X jours ;

suspendre ;

réactiver ;

appliquer coupon ;

consulter Stripe ID ;

consulter paiement.

Toutes les modifications doivent apparaître dans AuditLog.

27. COUPONS

Créer :

Coupon

avec :

code ;

type ;

montant ;

pourcentage ;

limite d'utilisation ;

date début ;

expiration ;

robots concernés ;

plans concernés ;

statut.

28. SUPPORT CLIENT

Créer ticketing interne.

Utilisateur :

/dashboard/support

Peut :

ouvrir ticket ;

sélectionner catégorie ;

priorité ;

sujet ;

message ;

pièces jointes ;

répondre ;

fermer.

Admin :

/admin/support

Peut :

répondre ;

assigner ticket ;

changer statut ;

changer priorité ;

ajouter notes internes.

Status :

OPEN

IN_PROGRESS

WAITING_USER

RESOLVED

CLOSED

29. NOTIFICATIONS

Créer Notification Center.

Types :

robot connecté ;

robot hors ligne ;

licence bientôt expirée ;

licence expirée ;

abonnement ;

paiement réussi ;

paiement échoué ;

nouvelle version ;

ticket support ;

sécurité.

Canaux :

dashboard ;

email.

Prévoir architecture extensible :

Telegram ;

WhatsApp ;

push mobile.

30. CENTRE EMAIL ADMIN

Admin doit pouvoir créer :

templates ;

campagnes ;

emails transactionnels.

Templates :

bienvenue ;

vérification ;

reset password ;

achat ;

licence ;

expiration ;

paiement ;

robot offline ;

nouvelle version.

Utiliser un fournisseur comme Resend.

31. CMS ADMINISTRABLE

Je ne veux pas modifier le code pour changer les textes de la page d'accueil.

Créer une gestion CMS pour :

hero ;

CTA ;

fonctionnalités ;

statistiques marketing ;

FAQ ;

témoignages ;

footer ;

coordonnées ;

réseaux sociaux ;

mentions de risque.

32. SITE PUBLIC

Pages obligatoires :

/

/robots

/robots/[slug]

/pricing

/how-it-works

/performance

/about

/faq

/blog

/contact

/login

/register

/forgot-password

/terms

/privacy

/risk-disclosure

33. PAGE D'ACCUEIL

Créer une page extrêmement professionnelle.

Navigation

Logo

Robots

Technologie

Performance

Tarifs

FAQ

Connexion

CTA :

Commencer

HERO

Grand titre possible :

TRADING AUTOMATISÉ.
CONTRÔLE INTELLIGENT.

Sous-titre :

Une plateforme complète pour connecter, gérer et analyser vos robots MetaTrader 5 depuis une seule interface.

CTA :

Découvrir les robots

Deuxième CTA :

Créer un compte

À droite :

Créer un mockup animé du dashboard avec :

Equity

Balance

Performance

robot actif

graphiques.

34. SECTION TECHNOLOGIE

Titre :

Une infrastructure conçue pour l'automatisation

Cartes :

Trading automatisé

Robots conçus pour fonctionner avec MetaTrader 5.

Risk Management

Outils de contrôle et de suivi du risque.

Monitoring

Surveillance de l'activité et des performances.

Analytics

Analyse détaillée des résultats.

Cloud Dashboard

Accès aux informations depuis n'importe quel appareil.

Mises à jour

Gestion centralisée des nouvelles versions.

35. COMMENT ÇA MARCHE

Étape 01

Créer votre compte

Étape 02

Choisir votre robot

Étape 03

Connecter votre compte MT5

Étape 04

Installer et activer la licence

Étape 05

Suivre l'activité depuis le dashboard

36. DESIGN

Je veux une identité :

FINTECH + AI + TRADING + PREMIUM.

Pas de design casino.

Pas d'écran rempli de vert fluo.

Palette recommandée :

Background principal :

#060A12

Background secondaire :

#0B1120

Cards :

#101827

Border :

rgba(255,255,255,0.08)

Texte :

#F8FAFC

Texte secondaire :

#94A3B8

Accent principal possible :

#3B82F6

Accent secondaire :

#06B6D4

Succès :

vert uniquement pour données positives.

Perte :

rouge uniquement pour données négatives.

37. UI

Utiliser :

grands titres ;

cards élégantes ;

beaucoup d'espace ;

bordures discrètes ;

gradients subtils ;

graphiques propres ;

glass effect léger ;

animations lentes ;

nombres tabulaires pour données financières.

Éviter :

gradients excessifs ;

effets gaming ;

néons partout ;

animations agressives.

38. RESPONSIVE

Le produit doit fonctionner parfaitement :

Desktop

Laptop

Tablet

Mobile

Sur téléphone :

sidebar → menu drawer.

Les tableaux doivent avoir :

scroll horizontal ;

cards alternatives si nécessaire.

39. MODÈLE DE DONNÉES

Créer notamment :

User

Role

Permission

UserSession

UserDevice

MTAccount

Broker

Robot

RobotVersion

License

RobotInstance

Heartbeat

Subscription

Plan

Order

Payment

Invoice

Coupon

Position

Trade

DailyStatistic

Notification

SupportTicket

TicketMessage

EmailTemplate

Page

FAQ

Testimonial

BlogPost

APIKey

Webhook

AuditLog

SystemSetting

SecurityEvent

40. AUDIT LOG

Chaque action sensible admin doit créer un AuditLog.

Champs :

adminId

action

resource

resourceId

before

after

ip

userAgent

createdAt

Exemples :

ADMIN_EXTENDED_LICENSE

ADMIN_SUSPENDED_USER

ADMIN_REFUNDED_PAYMENT

ADMIN_CHANGED_ROLE

ADMIN_PUBLISHED_ROBOT

ADMIN_IMPERSONATED_USER

41. SECURITY EVENT

Créer également SecurityEvent :

login failed ;

brute force ;

nouvel appareil ;

reset password ;

changement email ;

changement password ;

2FA disabled ;

API key created ;

activité suspecte.

42. PARAMÈTRES ADMIN

/admin/settings

Sections :

General

Branding

Trading

MT5

Licenses

Payments

Email

Notifications

Security

Maintenance

Legal

43. BRANDING

Admin doit pouvoir modifier :

logo ;

favicon ;

nom plateforme ;

email ;

téléphone ;

adresse ;

couleurs principales ;

liens sociaux.

44. MODE MAINTENANCE

Super Admin doit pouvoir activer :

Maintenance Mode

Avec :

message personnalisé ;

heure estimée facultative ;

whitelist IP admin.

45. FEATURE FLAGS

Créer un système de Feature Flags.

Exemples :

telegramNotifications

liveTradingDashboard

copyTrading

aiAnalysis

mt4Support

referralProgram

maintenanceMode

Permettre au Super Admin d'activer une fonctionnalité sans redéployer le site lorsque cela est techniquement possible.

46. API KEYS

Créer :

/admin/api

Super Admin peut :

créer clé ;

nommer ;

définir permissions ;

révoquer ;

voir dernière utilisation.

Stocker uniquement hash sécurisé de la clé.

47. API

Versionner l'API :

/api/v1/

Exemples :

/auth

/users

/robots

/licenses

/accounts

/positions

/trades

/statistics

/subscriptions

/payments

/notifications

/support

/agents

/admin

48. DOCUMENTATION API

Créer OpenAPI/Swagger pour les endpoints internes autorisés.

Ne jamais exposer les endpoints administrateurs sans authentification.

49. SÉCURITÉ

Implémenter impérativement :

validation backend ;

Zod ou class-validator ;

RBAC ;

CSRF protection lorsque nécessaire ;

XSS protection ;

SQL injection protection ;

rate limiting ;

password hashing Argon2/bcrypt ;

secure cookies ;

httpOnly cookies ;

SameSite ;

HTTPS ;

secrets dans variables environnement ;

chiffrement des données sensibles ;

logs ;

session revocation.

Jamais de secret dans le frontend.

50. RATE LIMITING

Particulièrement pour :

login ;

forgot password ;

inscription ;

license validation ;

heartbeat ;

API publique.

51. WEBHOOKS STRIPE

Implémenter correctement :

checkout.session.completed

customer.subscription.created

customer.subscription.updated

customer.subscription.deleted

invoice.paid

invoice.payment_failed

charge.refunded

Toujours vérifier la signature du webhook.

Utiliser l'idempotence.

52. ÉTATS DE CHARGEMENT

Chaque interface doit avoir :

loading state

empty state

error state

success state

skeleton

toast.

Ne jamais afficher une page blanche pendant les chargements.

53. RECHERCHE ET FILTRES ADMIN

Toutes les grandes tables doivent avoir :

recherche ;

filtres ;

tri ;

pagination ;

export CSV ;

sélection multiple.

54. ACTIONS DE MASSE

Admin peut, avec confirmation :

suspendre plusieurs utilisateurs ;

activer licences ;

désactiver licences ;

envoyer notification ;

exporter utilisateurs.

Les opérations destructives demandent confirmation.

55. DASHBOARD MOBILE

Créer une expérience mobile agréable.

Les KPI deviennent des cards.

Navigation basse facultative :

Home

Robots

Trading

Notifications

Profile

56. SEO

Pour le site public :

metadata ;

OpenGraph ;

sitemap.xml ;

robots.txt ;

canonical ;

schema.org ;

FAQ schema ;

product schema lorsque pertinent.

Dashboard privé :

noindex.

Admin :

noindex.

57. PERFORMANCE

Utiliser :

lazy loading ;

image optimization ;

server components lorsque pertinent ;

code splitting ;

pagination ;

cache Redis ;

indexes PostgreSQL.

58. OBSERVABILITÉ

Prévoir :

logs structurés ;

error tracking ;

health endpoint ;

métriques système.

Créer :

GET /health

Retour :

database

redis

storage

payment provider

MT5 service

version

uptime

sans révéler de secret.

59. DISCLAIMER

Placer une information de risque visible.

Exemple :

« Le trading de produits financiers comporte un risque élevé et peut entraîner la perte de tout ou partie du capital investi. Les performances passées ne garantissent pas les résultats futurs. Les robots et informations proposés sur cette plateforme ne constituent pas une garantie de profit. »

Ne jamais afficher :

« revenus garantis »

« zéro risque »

« gains assurés »

ou toute promesse financière trompeuse.

60. DONNÉES DE DÉMONSTRATION

Créer un seed propre permettant de tester :

1 Super Admin

3 utilisateurs

3 robots

plusieurs licences

plusieurs comptes MT5 fictifs

positions fictives

trades fictifs

abonnements fictifs.

Chaque donnée financière simulée doit être identifiable comme :

DEMO

et ne doit jamais être présentée comme une performance réelle.

61. TESTS

Créer :

tests unitaires ;

tests API ;

tests permissions ;

tests licences ;

tests paiements ;

tests webhook ;

tests authentification ;

tests RBAC.

Tester impérativement qu'un USER ne peut jamais accéder à :

/admin/*

même en appelant directement l'API.

62. STRUCTURE DU PROJET

Créer une architecture claire du type :

apps/

web/

api/

mt5-bridge/

packages/

ui/

database/

types/

config/

utils/

infra/

docker/

docs/

63. DOCKER

Créer :

Dockerfile

docker-compose.yml

avec :

web

api

postgres

redis

worker

mt5-bridge lorsque applicable.

64. ENVIRONNEMENT

Créer :

.env.example

avec uniquement noms de variables.

Exemple :

DATABASE_URL=

REDIS_URL=

JWT_SECRET=

STRIPE_SECRET_KEY=

STRIPE_WEBHOOK_SECRET=

RESEND_API_KEY=

S3_ENDPOINT=

S3_ACCESS_KEY=

S3_SECRET_KEY=

MT5_BRIDGE_SECRET=

Ne jamais mettre de vraies clés dans Git.

65. ADMIN — VUE SYSTÈME

Créer :

/admin/system

Afficher :

API status

Database

Redis

Storage

Workers

MT5 Bridge

Payment Provider

Email Provider

WebSocket

Version frontend

Version backend

Dernier déploiement.

66. KILL SWITCH

Ajouter un mécanisme administratif de sécurité permettant au Super Admin de :

désactiver les validations de nouvelles licences ;

désactiver un robot spécifique ;

empêcher de nouvelles activations ;

suspendre une intégration ;

mettre le système trading en lecture seule.

Toute activation doit nécessiter confirmation et être enregistrée dans AuditLog.

Il ne doit pas permettre de manipuler secrètement les comptes clients ou de contourner leurs propres limites de risque.

67. CONTROL CENTER ADMIN

Créer une page phare :

/admin/control-center

Cette page doit donner au SUPER_ADMIN une vision immédiate de toute la plateforme.

Afficher :

SYSTEM STATUS

Users online

Robots online

MT5 accounts online

Active licenses

Expired licenses

Subscriptions

Open positions reçues

Today's synchronized trades

Revenue

Failed payments

Open support tickets

System alerts

Latest errors

Latest admin actions

Elle doit devenir le véritable centre de commande de la plateforme.

68. DESIGN DU CONTROL CENTER

Présentation sombre premium.

Cards de statut :

Website

API

Database

Redis

MT5 Bridge

Stripe

Email

Storage

Afficher :

Operational

Degraded

Offline

Ajouter :

Refresh

et rafraîchissement automatique raisonnable.

69. NE PAS FAIRE

Ne crée pas uniquement les écrans.

Toutes les fonctions doivent réellement être reliées au backend.

Ne crée pas :

faux boutons ;

filtres décoratifs ;

statistiques hardcodées ;

formulaires qui ne sauvegardent rien ;

pages admin purement visuelles ;

faux WebSockets ;

fausses transactions ;

faux statuts de robot.

Si une fonctionnalité n'est pas encore intégrée :

indiquer explicitement :

NOT_CONFIGURED

ou

DEMO.

70. ORDRE DE DÉVELOPPEMENT

Construire dans cet ordre :

PHASE 1

Architecture + DB + Auth + RBAC

PHASE 2

Design system + Site public

PHASE 3

Dashboard utilisateur

PHASE 4

Super Admin

PHASE 5

Catalogue robots + versions

PHASE 6

Licences

PHASE 7

Paiements + abonnements

PHASE 8

MT5 Bridge

PHASE 9

Trading analytics

PHASE 10

Notifications + support

PHASE 11

CMS

PHASE 12

Audit + sécurité + tests

PHASE 13

Optimisation + production

71. IMPORTANT POUR L'AGENT IA

Avant de coder chaque module :

inspecter la structure existante ;

réutiliser les composants existants ;

vérifier le modèle DB ;

définir API et permissions ;

implémenter backend ;

implémenter frontend ;

connecter frontend/backend ;

gérer loading/error/empty states ;

écrire tests ;

tester permissions ;

documenter le résultat.

Ne jamais créer une deuxième implémentation d'un système déjà existant.

72. CRITÈRE DE FINITION

Une fonctionnalité n'est considérée comme TERMINÉE que lorsque :

UI ✓

API ✓

Database ✓

Permissions ✓

Validation ✓

Error handling ✓

Loading state ✓

Audit si nécessaire ✓

Tests ✓

Responsive ✓

73. OBJECTIF FINAL

Je veux obtenir une véritable plateforme commerciale SaaS dédiée aux robots MetaTrader.

Elle doit combiner :

un site marketing premium

un espace membre

un dashboard de trading

un gestionnaire de licences

un système d'abonnement

une intégration MT5

un centre d'administration complet.

Le Super Admin doit avoir la maîtrise de la plateforme depuis son dashboard tout en respectant la sécurité, la traçabilité, les autorisations utilisateurs et l'intégrité des données.

L'architecture doit être suffisamment modulaire pour ajouter plus tard :

MT4 ;

Deriv ;

cTrader ;

TradingView ;

Telegram ;

applications mobiles ;

IA d'analyse ;

marketplace de robots ;

copy trading ;

programmes d'affiliation.

Commence par produire :

architecture technique ;

arborescence complète ;

schéma Prisma ;

RBAC ;

architecture MT5 ;

routes API ;

wireframe des dashboards ;

plan d'implémentation ;

puis commence le développement.

Ne tente pas de tout générer dans un seul fichier.

Construis chaque module proprement et de façon production-ready.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://algo-apex-suite.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/115ad003-ec80-4c5e-b648-b50313eee54b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
