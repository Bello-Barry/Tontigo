# 🤖 AGENT PROMPT — TONTIGO v2.0
## Application de Tontine Digitale, Matching & Épargne Bloquée
### Congo Brazzaville · Production Ready · Full-Stack Next.js 15

---

> **INSTRUCTIONS POUR L'AGENT**
> Tu es un ingénieur full-stack senior spécialisé Next.js/Supabase.
> Construis l'intégralité de l'application Likelemba en suivant ce document **dans l'ordre exact**.
> Chaque étape doit être complète avant de passer à la suivante.
> Ne suppose rien. Chaque fichier, chaque fonction, chaque composant est spécifié ici.
> Si une information manque dans une étape, relis les étapes précédentes — elle s'y trouve.

---

## 📋 TABLE DES MATIÈRES

1. [Contexte & Vision produit](#1-contexte--vision-produit)
2. [Stack & Dépendances](#2-stack--dépendances)
3. [Structure complète du projet](#3-structure-complète-du-projet)
4. [Variables d'environnement](#4-variables-denvironnement)
5. [Types TypeScript globaux](#5-types-typescript-globaux)
6. [Schéma Supabase complet](#6-schéma-supabase-complet)
7. [Configuration Supabase client/server](#7-configuration-supabase-clientserver)
8. [Middleware de protection](#8-middleware-de-protection)
9. [Stores Zustand](#9-stores-zustand)
10. [Schémas de validation Zod](#10-schémas-de-validation-zod)
11. [Utilitaires métier](#11-utilitaires-métier)
12. [Server Actions — Auth](#12-server-actions--auth)
13. [Server Actions — Tontine](#13-server-actions--tontine)
14. [Server Actions — Commissions & Revenus](#14-server-actions--commissions--revenus)
15. [Server Actions — Matching](#15-server-actions--matching)
16. [Server Actions — Épargne](#16-server-actions--épargne)
17. [Server Actions — Paiements Mobile](#17-server-actions--paiements-mobile)
18. [Webhooks & Cron Jobs](#18-webhooks--cron-jobs)
19. [Design System](#19-design-system)
20. [Composants UI — Auth](#20-composants-ui--auth)
21. [Composants UI — Shared](#21-composants-ui--shared)
22. [Composants UI — Tontine](#22-composants-ui--tontine)
23. [Composants UI — Épargne](#23-composants-ui--épargne)
24. [Composants UI — Paiement](#24-composants-ui--paiement)
25. [Pages — Auth & Onboarding](#25-pages--auth--onboarding)
26. [Pages — Dashboard](#26-pages--dashboard)
27. [Pages — Tontine](#27-pages--tontine)
28. [Pages — Matching](#28-pages--matching)
29. [Pages — Épargne](#29-pages--épargne)
30. [Pages — Profil & Transactions](#30-pages--profil--transactions)
31. [Page — Admin Fondateur](#31-page--admin-fondateur)
32. [Realtime Supabase](#32-realtime-supabase)
33. [Génération PDF](#33-génération-pdf)
34. [Ordre de développement](#34-ordre-de-développement)
35. [Règles absolues](#35-règles-absolues)

---

## 1. CONTEXTE & VISION PRODUIT

**Likelemba** est une application web de tontine digitale destinée au Congo Brazzaville et à l'Afrique centrale.

### Ce qu'est une tontine
Un groupe de personnes cotise régulièrement une somme fixe. À chaque cycle, la totalité de la cagnotte est versée à un seul membre, selon un ordre défini. Le cycle se répète jusqu'à ce que chaque membre ait reçu sa cagnotte.

### Les 3 modules de Likelemba

**Module 1 — Tontine entre amis**
Groupes privés par lien d'invitation. Les membres se connaissent.

**Module 2 — Tontine par matching**
L'algorithme met en relation des inconnus partageant les mêmes critères (montant, fréquence, score de confiance). C'est l'innovation principale.

**Module 3 — Épargne bloquée**
Coffres personnels ou de groupe. L'argent est déposé librement mais **ne peut pas être retiré avant la date fixée à la création**. Cette règle est absolue et inviolable.

### Modèle économique (à implémenter dans le code)

| Source de revenu | Taux | Déclencheur |
|---|---|---|
| Commission versement | 1,5% | À chaque payout versé à un membre |
| Frais matching | 500 FCFA | À chaque jonction d'un groupe via matching |
| Abonnement Pro | 2 500 FCFA/mois | Accès illimité aux groupes et matching prioritaire |
| Commission épargne retrait | 0,5% | Au retrait d'un coffre débloqué |

Toutes les commissions sont **prélevées automatiquement** via les Server Actions et enregistrées dans la table `platform_revenues`.

---

## 2. STACK & DÉPENDANCES

### Installation dans cet ordre exact

```bash
# 1. Créer le projet
npx create-next-app@latest tontigo --typescript --tailwind --app --src-dir=false --import-alias="@/*"
cd tontigo

# 2. shadcn/ui
npx shadcn@latest init
# Choisir: Default style, Slate base color, CSS variables: yes
npx shadcn@latest add button card input label badge dialog sheet tabs progress avatar separator skeleton switch select textarea

# 3. Supabase
npm install @supabase/ssr @supabase/supabase-js

# 4. Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# 5. State management
npm install zustand

# 6. Notifications UI
npm install react-toastify

# 7. Icônes (déjà inclus avec shadcn mais forcer la version)
npm install lucide-react

# 8. PDF
npm install jspdf jspdf-autotable

# 9. Dates
npm install date-fns

# 10. Utilitaires
npm install clsx tailwind-merge class-variance-authority
```

### `package.json` — scripts à ajouter
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 3. STRUCTURE COMPLÈTE DU PROJET

Crée exactement cette arborescence :

```
tontigo/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── onboarding/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── tontine/
│   │   │   ├── page.tsx
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   ├── rejoindre/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── cotisations/
│   │   │       │   └── page.tsx
│   │   │       └── membres/
│   │   │           └── page.tsx
│   │   ├── matching/
│   │   │   └── page.tsx
│   │   ├── epargne/
│   │   │   ├── page.tsx
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── paiements/
│   │   │   └── page.tsx
│   │   ├── profil/
│   │   │   └── page.tsx
│   │   └── admin/
│   │       └── page.tsx
│   ├── api/
│   │   ├── webhooks/
│   │   │   ├── mtn/
│   │   │   │   └── route.ts
│   │   │   └── airtel/
│   │   │       └── route.ts
│   │   └── cron/
│   │       ├── amendes/
│   │       │   └── route.ts
│   │       ├── rappels/
│   │       │   └── route.ts
│   │       └── epargne-unlock/
│   │           └── route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                        # shadcn/ui (auto-généré)
│   ├── auth/
│   │   ├── PhoneForm.tsx
│   │   ├── OtpForm.tsx
│   │   └── OnboardingForm.tsx
│   ├── shared/
│   │   ├── Sidebar.tsx
│   │   ├── MobileNav.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── TrustScoreBadge.tsx
│   │   ├── UserBadge.tsx
│   │   ├── EmptyState.tsx
│   │   └── LoadingSpinner.tsx
│   ├── tontine/
│   │   ├── GroupCard.tsx
│   │   ├── CreateGroupForm.tsx
│   │   ├── JoinGroupForm.tsx
│   │   ├── MemberRow.tsx
│   │   ├── TourTimeline.tsx
│   │   ├── CotisationCard.tsx
│   │   ├── PenaltyBadge.tsx
│   │   ├── SolidarityPoolCard.tsx
│   │   └── GroupStatusBadge.tsx
│   ├── matching/
│   │   ├── MatchingFilters.tsx
│   │   ├── MatchCard.tsx
│   │   └── MatchingBanner.tsx
│   ├── epargne/
│   │   ├── VaultCard.tsx
│   │   ├── CreateVaultForm.tsx
│   │   ├── VaultProgressBar.tsx
│   │   └── VaultCountdown.tsx
│   └── paiement/
│       ├── PaymentModal.tsx
│       ├── WalletSelector.tsx
│       └── TransactionRow.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── service.ts
│   ├── validations/
│   │   ├── auth.schema.ts
│   │   ├── tontine.schema.ts
│   │   ├── matching.schema.ts
│   │   └── epargne.schema.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── tontineStore.ts
│   │   └── epargneStore.ts
│   ├── actions/
│   │   ├── auth.actions.ts
│   │   ├── tontine.actions.ts
│   │   ├── commission.actions.ts
│   │   ├── matching.actions.ts
│   │   ├── epargne.actions.ts
│   │   └── paiement.actions.ts
│   ├── utils/
│   │   ├── penalty.ts
│   │   ├── trust-score.ts
│   │   ├── guarantee.ts
│   │   ├── commission.ts
│   │   ├── matching.ts
│   │   └── format.ts
│   └── types/
│       └── index.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── middleware.ts
├── vercel.json
└── next.config.ts
```

---

## 4. VARIABLES D'ENVIRONNEMENT

Crée `.env.local` à la racine :

```env
# ─── Supabase ───────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ─── MTN Mobile Money Congo Brazzaville ─────────────────────
MTN_MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
MTN_MOMO_API_KEY=your_mtn_api_key
MTN_MOMO_SUBSCRIPTION_KEY=your_primary_subscription_key
MTN_MOMO_ENV=sandbox
# En production : MTN_MOMO_ENV=mtncongo

# ─── Airtel Money Congo ──────────────────────────────────────
AIRTEL_BASE_URL=https://openapi.airtel.africa
AIRTEL_CLIENT_ID=your_airtel_client_id
AIRTEL_CLIENT_SECRET=your_airtel_client_secret
AIRTEL_COUNTRY=CG
AIRTEL_CURRENCY=XAF

# ─── Sécurité ────────────────────────────────────────────────
CRON_SECRET=genere_une_chaine_aleatoire_longue_ici
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─── Likelemba Business Config ─────────────────────────────────
# Taux de commission sur chaque versement (1.5%)
COMMISSION_PAYOUT_RATE=0.015
# Frais fixes de matching par utilisateur en FCFA
COMMISSION_MATCHING_FEE=500
# Commission au retrait d'épargne (0.5%)
COMMISSION_SAVINGS_RATE=0.005
# Abonnement Pro mensuel en FCFA
PRO_SUBSCRIPTION_PRICE=2500
# Wallet de réception des commissions (numéro MTN du fondateur)
FOUNDER_WALLET_MTN=242XXXXXXXXX
```

---

## 5. TYPES TYPESCRIPT GLOBAUX

Crée `lib/types/index.ts` avec exactement ce contenu :

```typescript
// ─── Enums ────────────────────────────────────────────────────
export type UserStatus = 'actif' | 'suspendu' | 'banni'
export type UserBadge = 'nouveau' | 'fiable' | 'expert' | 'fraudeur'
export type GroupStatus = 'en_attente' | 'actif' | 'suspendu' | 'termine'
export type OrderType = 'tirage_au_sort' | 'encheres' | 'manuel'
export type FrequencyType = 'quotidien' | 'hebdomadaire' | 'mensuel'
export type MembershipStatus = 'actif' | 'suspect' | 'elimine' | 'fugitif'
export type ContributionStatus = 'en_attente' | 'paye' | 'retard' | 'penalise'
export type PayoutStatus = 'en_attente' | 'verse' | 'echoue'
export type DisputeStatus = 'ouvert' | 'en_cours' | 'resolu' | 'rejete'
export type VaultStatus = 'actif' | 'debloque' | 'termine'
export type TransactionType =
  | 'cotisation'
  | 'versement'
  | 'amende'
  | 'garantie'
  | 'epargne'
  | 'retrait_epargne'
  | 'solidarite'
  | 'commission'
  | 'matching_fee'
  | 'abonnement'
export type RevenueType = 'commission_payout' | 'matching_fee' | 'subscription' | 'savings_withdrawal'
export type WalletType = 'mtn' | 'airtel'
export type SubscriptionPlan = 'free' | 'pro'

// ─── Entités principales ──────────────────────────────────────
export interface UserProfile {
  id: string
  phone: string
  full_name: string
  avatar_url: string | null
  trust_score: number
  status: UserStatus
  badge: UserBadge
  wallet_mtn: string | null
  wallet_airtel: string | null
  total_groups_completed: number
  total_groups_failed: number
  is_banned: boolean
  banned_until: string | null
  subscription_plan: SubscriptionPlan
  subscription_expires_at: string | null
  created_at: string
  updated_at: string
}

export interface TontineGroup {
  id: string
  name: string
  description: string | null
  creator_id: string
  amount: number
  frequency: FrequencyType
  max_members: number
  current_members: number
  penalty_rate: number
  solidarity_rate: number
  order_type: OrderType
  status: GroupStatus
  current_turn: number
  invite_code: string
  is_public: boolean
  min_trust_score: number
  requires_guarantee: boolean
  started_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
  // Relations jointes
  creator?: UserProfile
  memberships?: Membership[]
}

export interface Membership {
  id: string
  group_id: string
  user_id: string
  turn_position: number
  guarantee_amount: number
  guarantee_paid: boolean
  total_paid: number
  total_penalties: number
  has_received_payout: boolean
  payout_received_at: string | null
  status: MembershipStatus
  joined_at: string
  // Relations jointes
  user?: UserProfile
  group?: TontineGroup
  contributions?: Contribution[]
}

export interface Contribution {
  id: string
  membership_id: string
  group_id: string
  amount: number
  due_date: string
  paid_at: string | null
  days_late: number
  penalty_amount: number
  status: ContributionStatus
  payment_reference: string | null
  created_at: string
  // Relations jointes
  membership?: Membership
}

export interface Payout {
  id: string
  group_id: string
  recipient_id: string
  membership_id: string
  amount: number
  commission_amount: number
  net_amount: number
  turn_number: number
  status: PayoutStatus
  payment_reference: string | null
  paid_at: string | null
  created_at: string
}

export interface SolidarityPool {
  id: string
  group_id: string
  balance: number
  total_contributed: number
  total_used: number
  updated_at: string
}

export interface SavingsVault {
  id: string
  user_id: string
  name: string
  description: string | null
  target_amount: number | null
  current_balance: number
  unlock_date: string
  frequency: FrequencyType | null
  auto_amount: number | null
  status: VaultStatus
  unlocked_at: string | null
  wallet_destination: string | null
  created_at: string
}

export interface SavingsContribution {
  id: string
  vault_id: string
  user_id: string
  amount: number
  payment_reference: string | null
  paid_at: string
}

export interface Transaction {
  id: string
  user_id: string
  reference_id: string | null
  type: TransactionType
  amount: number
  description: string | null
  wallet_used: string | null
  external_reference: string | null
  status: string
  created_at: string
}

export interface PlatformRevenue {
  id: string
  type: RevenueType
  amount: number
  source_id: string | null
  source_type: string | null
  description: string | null
  created_at: string
}

export interface MatchingProfile {
  group_id: string
  group_name: string
  amount: number
  frequency: FrequencyType
  current_members: number
  max_members: number
  min_trust_score: number
  creator_trust_score: number
  match_score: number
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  type: string
  reference_id: string | null
  is_read: boolean
  created_at: string
}

export interface Dispute {
  id: string
  group_id: string
  reported_by: string
  member_reported: string
  reason: string
  evidence: string | null
  status: DisputeStatus
  resolution: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

// ─── Réponses Server Actions ──────────────────────────────────
export interface ActionResult<T = void> {
  data?: T
  error?: string
  success?: boolean
}

// ─── Filtres Matching ─────────────────────────────────────────
export interface MatchingFilters {
  amount_min: number
  amount_max: number
  frequency?: FrequencyType
  min_trust_score: number
}
```

---

## 6. SCHÉMA SUPABASE COMPLET

Crée `supabase/migrations/001_initial_schema.sql` :

```sql
-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TYPES ENUM
-- ============================================================
CREATE TYPE user_status      AS ENUM ('actif', 'suspendu', 'banni');
CREATE TYPE user_badge       AS ENUM ('nouveau', 'fiable', 'expert', 'fraudeur');
CREATE TYPE group_status     AS ENUM ('en_attente', 'actif', 'suspendu', 'termine');
CREATE TYPE order_type       AS ENUM ('tirage_au_sort', 'encheres', 'manuel');
CREATE TYPE frequency_type   AS ENUM ('quotidien', 'hebdomadaire', 'mensuel');
CREATE TYPE membership_status AS ENUM ('actif', 'suspect', 'elimine', 'fugitif');
CREATE TYPE contribution_status AS ENUM ('en_attente', 'paye', 'retard', 'penalise');
CREATE TYPE payout_status    AS ENUM ('en_attente', 'verse', 'echoue');
CREATE TYPE dispute_status   AS ENUM ('ouvert', 'en_cours', 'resolu', 'rejete');
CREATE TYPE vault_status     AS ENUM ('actif', 'debloque', 'termine');
CREATE TYPE subscription_plan AS ENUM ('free', 'pro');
CREATE TYPE transaction_type AS ENUM (
  'cotisation', 'versement', 'amende', 'garantie',
  'epargne', 'retrait_epargne', 'solidarite',
  'commission', 'matching_fee', 'abonnement'
);
CREATE TYPE revenue_type AS ENUM (
  'commission_payout', 'matching_fee', 'subscription', 'savings_withdrawal'
);

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE public.users (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone                   TEXT UNIQUE NOT NULL,
  full_name               TEXT NOT NULL DEFAULT 'Utilisateur',
  avatar_url              TEXT,
  trust_score             INTEGER DEFAULT 50 CHECK (trust_score BETWEEN 0 AND 100),
  status                  user_status DEFAULT 'actif',
  badge                   user_badge DEFAULT 'nouveau',
  wallet_mtn              TEXT,
  wallet_airtel           TEXT,
  total_groups_completed  INTEGER DEFAULT 0,
  total_groups_failed     INTEGER DEFAULT 0,
  is_banned               BOOLEAN DEFAULT FALSE,
  banned_until            TIMESTAMPTZ,
  subscription_plan       subscription_plan DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: tontine_groups
-- ============================================================
CREATE TABLE public.tontine_groups (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  description      TEXT,
  creator_id       UUID NOT NULL REFERENCES public.users(id),
  amount           NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  frequency        frequency_type NOT NULL,
  max_members      INTEGER NOT NULL CHECK (max_members BETWEEN 2 AND 50),
  current_members  INTEGER DEFAULT 0,
  penalty_rate     NUMERIC(5,2) NOT NULL CHECK (penalty_rate BETWEEN 0.5 AND 20),
  solidarity_rate  NUMERIC(5,2) DEFAULT 2.0,
  order_type       order_type DEFAULT 'tirage_au_sort',
  status           group_status DEFAULT 'en_attente',
  current_turn     INTEGER DEFAULT 1,
  invite_code      TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  is_public        BOOLEAN DEFAULT FALSE,
  min_trust_score  INTEGER DEFAULT 30,
  requires_guarantee BOOLEAN DEFAULT TRUE,
  started_at       TIMESTAMPTZ,
  ends_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: memberships
-- ============================================================
CREATE TABLE public.memberships (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id             UUID NOT NULL REFERENCES public.tontine_groups(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES public.users(id),
  turn_position        INTEGER NOT NULL,
  guarantee_amount     NUMERIC(12,2) DEFAULT 0,
  guarantee_paid       BOOLEAN DEFAULT FALSE,
  total_paid           NUMERIC(12,2) DEFAULT 0,
  total_penalties      NUMERIC(12,2) DEFAULT 0,
  has_received_payout  BOOLEAN DEFAULT FALSE,
  payout_received_at   TIMESTAMPTZ,
  status               membership_status DEFAULT 'actif',
  joined_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id),
  UNIQUE(group_id, turn_position)
);

-- ============================================================
-- TABLE: contributions
-- ============================================================
CREATE TABLE public.contributions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membership_id     UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  group_id          UUID NOT NULL REFERENCES public.tontine_groups(id),
  amount            NUMERIC(12,2) NOT NULL,
  due_date          DATE NOT NULL,
  paid_at           TIMESTAMPTZ,
  days_late         INTEGER DEFAULT 0,
  penalty_amount    NUMERIC(12,2) DEFAULT 0,
  status            contribution_status DEFAULT 'en_attente',
  payment_reference TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: payouts
-- ============================================================
CREATE TABLE public.payouts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id            UUID NOT NULL REFERENCES public.tontine_groups(id),
  recipient_id        UUID NOT NULL REFERENCES public.users(id),
  membership_id       UUID NOT NULL REFERENCES public.memberships(id),
  amount              NUMERIC(12,2) NOT NULL,   -- montant brut (cotisations × membres)
  commission_amount   NUMERIC(12,2) DEFAULT 0,  -- 1.5% prélevé par Likelemba
  net_amount          NUMERIC(12,2) NOT NULL,   -- montant reçu par le membre
  turn_number         INTEGER NOT NULL,
  status              payout_status DEFAULT 'en_attente',
  payment_reference   TEXT,
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: solidarity_pool
-- ============================================================
CREATE TABLE public.solidarity_pool (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id          UUID UNIQUE NOT NULL REFERENCES public.tontine_groups(id) ON DELETE CASCADE,
  balance           NUMERIC(12,2) DEFAULT 0,
  total_contributed NUMERIC(12,2) DEFAULT 0,
  total_used        NUMERIC(12,2) DEFAULT 0,
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: savings_vaults (coffres épargne personnelle)
-- ============================================================
CREATE TABLE public.savings_vaults (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.users(id),
  name                TEXT NOT NULL,
  description         TEXT,
  target_amount       NUMERIC(12,2),
  current_balance     NUMERIC(12,2) DEFAULT 0,
  unlock_date         DATE NOT NULL,
  frequency           frequency_type,
  auto_amount         NUMERIC(12,2),
  status              vault_status DEFAULT 'actif',
  unlocked_at         TIMESTAMPTZ,
  wallet_destination  TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: savings_contributions
-- ============================================================
CREATE TABLE public.savings_contributions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id          UUID NOT NULL REFERENCES public.savings_vaults(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.users(id),
  amount            NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_reference TEXT,
  paid_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: group_vaults (coffres épargne de groupe)
-- ============================================================
CREATE TABLE public.group_vaults (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT,
  creator_id      UUID NOT NULL REFERENCES public.users(id),
  target_amount   NUMERIC(12,2),
  current_balance NUMERIC(12,2) DEFAULT 0,
  unlock_date     DATE NOT NULL,
  status          vault_status DEFAULT 'actif',
  invite_code     TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: group_vault_members
-- ============================================================
CREATE TABLE public.group_vault_members (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id          UUID NOT NULL REFERENCES public.group_vaults(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.users(id),
  total_contributed NUMERIC(12,2) DEFAULT 0,
  joined_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vault_id, user_id)
);

-- ============================================================
-- TABLE: transactions (journal complet)
-- ============================================================
CREATE TABLE public.transactions (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES public.users(id),
  reference_id       UUID,
  type               transaction_type NOT NULL,
  amount             NUMERIC(12,2) NOT NULL,
  description        TEXT,
  wallet_used        TEXT,
  external_reference TEXT,
  status             TEXT DEFAULT 'success',
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: platform_revenues (revenus Likelemba)
-- ============================================================
CREATE TABLE public.platform_revenues (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type         revenue_type NOT NULL,
  amount       NUMERIC(12,2) NOT NULL,
  source_id    UUID,
  source_type  TEXT,
  description  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: matching_requests (file de matching)
-- ============================================================
CREATE TABLE public.matching_requests (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.users(id),
  amount_min       NUMERIC(12,2) NOT NULL,
  amount_max       NUMERIC(12,2) NOT NULL,
  frequency        frequency_type NOT NULL,
  min_trust_score  INTEGER DEFAULT 50,
  matched_group_id UUID REFERENCES public.tontine_groups(id),
  fee_paid         BOOLEAN DEFAULT FALSE,
  status           TEXT DEFAULT 'en_attente', -- en_attente | matche | expire
  expires_at       TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: disputes
-- ============================================================
CREATE TABLE public.disputes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id        UUID NOT NULL REFERENCES public.tontine_groups(id),
  reported_by     UUID NOT NULL REFERENCES public.users(id),
  member_reported UUID NOT NULL REFERENCES public.users(id),
  reason          TEXT NOT NULL,
  evidence        TEXT,
  status          dispute_status DEFAULT 'ouvert',
  resolution      TEXT,
  resolved_by     UUID REFERENCES public.users(id),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE public.notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id),
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  type         TEXT NOT NULL,
  reference_id UUID,
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: phone_blacklist
-- ============================================================
CREATE TABLE public.phone_blacklist (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone          TEXT UNIQUE NOT NULL,
  reason         TEXT,
  blacklisted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FONCTIONS UTILITAIRES
-- ============================================================

-- Calcul de la garantie proportionnelle au rang
CREATE OR REPLACE FUNCTION public.calculate_guarantee(
  p_turn_position INTEGER,
  p_max_members   INTEGER,
  p_amount        NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  IF p_max_members <= 1 THEN RETURN 0; END IF;
  -- Position 1 (premier à recevoir) = garantie maximale (montant × nb_membres)
  -- Dernière position = garantie nulle
  RETURN ROUND(
    p_amount * p_max_members *
    ((p_max_members - p_turn_position)::NUMERIC / (p_max_members - 1)::NUMERIC),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- Mise à jour du score de confiance
CREATE OR REPLACE FUNCTION public.update_trust_score(
  p_user_id UUID,
  p_delta   INTEGER
) RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET trust_score = GREATEST(0, LEAST(100, trust_score + p_delta)),
      updated_at  = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Incrémenter le pool de solidarité
CREATE OR REPLACE FUNCTION public.increment_solidarity_pool(
  p_group_id UUID,
  p_amount   NUMERIC
) RETURNS void AS $$
BEGIN
  UPDATE public.solidarity_pool
  SET balance           = balance + p_amount,
      total_contributed = total_contributed + p_amount,
      updated_at        = NOW()
  WHERE group_id = p_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Appliquer les amendes quotidiennes (appelé par cron)
CREATE OR REPLACE FUNCTION public.apply_daily_penalties()
RETURNS void AS $$
DECLARE
  v_contrib  RECORD;
  v_penalty  NUMERIC;
  v_group    RECORD;
  v_member   RECORD;
BEGIN
  FOR v_contrib IN
    SELECT c.id, c.membership_id, c.group_id, c.amount, c.due_date,
           c.penalty_amount, m.user_id, m.total_paid, m.total_penalties
    FROM public.contributions c
    JOIN public.memberships m ON c.membership_id = m.id
    WHERE c.due_date < CURRENT_DATE
      AND c.status IN ('en_attente', 'retard')
      AND m.status = 'actif'
  LOOP
    SELECT penalty_rate INTO v_group FROM public.tontine_groups WHERE id = v_contrib.group_id;
    v_penalty := ROUND(v_contrib.amount * (v_group.penalty_rate / 100), 0);

    UPDATE public.contributions
    SET days_late      = (CURRENT_DATE - due_date),
        penalty_amount = penalty_amount + v_penalty,
        status         = 'retard'
    WHERE id = v_contrib.id;

    UPDATE public.memberships
    SET total_penalties = total_penalties + v_penalty
    WHERE id = v_contrib.membership_id;

    -- Vérifier élimination automatique
    SELECT total_paid, total_penalties INTO v_member
    FROM public.memberships WHERE id = v_contrib.membership_id;

    IF v_member.total_penalties >= v_member.total_paid AND v_member.total_paid > 0 THEN
      UPDATE public.memberships SET status = 'elimine' WHERE id = v_contrib.membership_id;

      PERFORM public.update_trust_score(v_contrib.user_id, -20);

      UPDATE public.users
      SET total_groups_failed = total_groups_failed + 1
      WHERE id = v_contrib.user_id;

      -- Notifier les autres membres
      INSERT INTO public.notifications (user_id, title, body, type, reference_id)
      SELECT m.user_id,
             'Membre éliminé',
             'Un membre a été éliminé pour amendes cumulées dépassant ses versements.',
             'elimination',
             v_contrib.group_id
      FROM public.memberships m
      WHERE m.group_id = v_contrib.group_id AND m.status = 'actif' AND m.user_id != v_contrib.user_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Débloquer les coffres épargne à maturité
CREATE OR REPLACE FUNCTION public.unlock_matured_vaults()
RETURNS void AS $$
BEGIN
  UPDATE public.savings_vaults
  SET status      = 'debloque',
      unlocked_at = NOW()
  WHERE unlock_date <= CURRENT_DATE
    AND status = 'actif'
    AND current_balance > 0;

  INSERT INTO public.notifications (user_id, title, body, type, reference_id)
  SELECT sv.user_id,
         '🎉 Ton coffre est débloqué !',
         'Ton épargne est disponible pour le retrait.',
         'vault_unlocked',
         sv.id
  FROM public.savings_vaults sv
  WHERE sv.status = 'debloque'
    AND sv.unlocked_at >= NOW() - INTERVAL '2 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Saisir la garantie d'un fugitif et redistribuer
CREATE OR REPLACE FUNCTION public.seize_guarantee_and_redistribute(
  p_group_id         UUID,
  p_fugitive_user_id UUID,
  p_guarantee_amount NUMERIC
) RETURNS void AS $$
DECLARE
  v_pool_balance   NUMERIC;
  v_shortfall      NUMERIC;
  v_active_members INTEGER;
  v_per_member     NUMERIC;
BEGIN
  -- Ajouter la garantie au pool de solidarité
  PERFORM public.increment_solidarity_pool(p_group_id, p_guarantee_amount);

  SELECT balance INTO v_pool_balance
  FROM public.solidarity_pool WHERE group_id = p_group_id;

  -- Si le pool couvre les pertes, on s'arrête là
  -- Sinon, calculer le manque à combler par les membres restants
  v_shortfall := 0; -- calculer selon la logique métier réelle
  IF v_shortfall > 0 THEN
    SELECT COUNT(*) INTO v_active_members
    FROM public.memberships
    WHERE group_id = p_group_id AND status = 'actif';

    IF v_active_members > 0 THEN
      v_per_member := ROUND(v_shortfall / v_active_members, 0);
      -- Créer des notifications de dette pour chaque membre
      INSERT INTO public.notifications (user_id, title, body, type, reference_id)
      SELECT m.user_id,
             'Compensation requise',
             format('Suite à une fuite, %s FCFA seront déduits de votre prochaine cotisation.', v_per_member),
             'shortfall_compensation',
             p_group_id
      FROM public.memberships m
      WHERE m.group_id = p_group_id AND m.status = 'actif';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGER: créer le profil utilisateur après inscription
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, phone, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: mettre à jour le badge selon le score
CREATE OR REPLACE FUNCTION public.update_user_badge()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_banned THEN
    NEW.badge := 'fraudeur';
  ELSIF NEW.trust_score >= 80 THEN
    NEW.badge := 'expert';
  ELSIF NEW.trust_score >= 60 THEN
    NEW.badge := 'fiable';
  ELSE
    NEW.badge := 'nouveau';
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_badge_on_score_change
  BEFORE UPDATE OF trust_score, is_banned ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_user_badge();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tontine_groups     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solidarity_pool    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_vaults     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_vaults       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_vault_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_revenues  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matching_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_blacklist    ENABLE ROW LEVEL SECURITY;

-- USERS
CREATE POLICY "Profils publics visibles"   ON public.users FOR SELECT USING (true);
CREATE POLICY "Modifier son profil"        ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Créer son profil"           ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- TONTINE GROUPS
CREATE POLICY "Groupes visibles par tous"  ON public.tontine_groups FOR SELECT USING (true);
CREATE POLICY "Créer un groupe"            ON public.tontine_groups FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Modifier son groupe"        ON public.tontine_groups FOR UPDATE USING (auth.uid() = creator_id);

-- MEMBERSHIPS: visibles aux membres du même groupe
CREATE POLICY "Voir les membres de ses groupes" ON public.memberships FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.memberships m2 WHERE m2.group_id = memberships.group_id));
CREATE POLICY "Rejoindre un groupe"        ON public.memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Modifier son membership"    ON public.memberships FOR UPDATE USING (auth.uid() = user_id);

-- CONTRIBUTIONS
CREATE POLICY "Voir cotisations de ses groupes" ON public.contributions FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.memberships WHERE group_id = contributions.group_id));

-- PAYOUTS
CREATE POLICY "Voir ses versements"        ON public.payouts FOR SELECT
  USING (auth.uid() = recipient_id OR auth.uid() IN (
    SELECT user_id FROM public.memberships WHERE group_id = payouts.group_id
  ));

-- SOLIDARITY POOL
CREATE POLICY "Voir le pool de ses groupes" ON public.solidarity_pool FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.memberships WHERE group_id = solidarity_pool.group_id));

-- SAVINGS VAULTS
CREATE POLICY "Voir ses coffres"           ON public.savings_vaults FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Créer un coffre"            ON public.savings_vaults FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Modifier son coffre"        ON public.savings_vaults FOR UPDATE USING (auth.uid() = user_id);

-- SAVINGS CONTRIBUTIONS
CREATE POLICY "Voir ses versements épargne" ON public.savings_contributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Faire un versement épargne"  ON public.savings_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- GROUP VAULTS
CREATE POLICY "Voir coffres de groupe"     ON public.group_vaults FOR SELECT USING (true);
CREATE POLICY "Créer coffre de groupe"     ON public.group_vaults FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- GROUP VAULT MEMBERS
CREATE POLICY "Voir membres coffre groupe" ON public.group_vault_members FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.group_vault_members gvm2 WHERE gvm2.vault_id = group_vault_members.vault_id));
CREATE POLICY "Rejoindre coffre groupe"    ON public.group_vault_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- TRANSACTIONS
CREATE POLICY "Voir ses transactions"      ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- PLATFORM REVENUES: uniquement service role
CREATE POLICY "Aucun accès client revenus" ON public.platform_revenues FOR SELECT USING (false);

-- MATCHING REQUESTS
CREATE POLICY "Voir sa demande matching"   ON public.matching_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Créer demande matching"     ON public.matching_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Modifier sa demande"        ON public.matching_requests FOR UPDATE USING (auth.uid() = user_id);

-- DISPUTES
CREATE POLICY "Voir litiges de ses groupes" ON public.disputes FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.memberships WHERE group_id = disputes.group_id));
CREATE POLICY "Signaler un membre"          ON public.disputes FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- NOTIFICATIONS
CREATE POLICY "Voir ses notifications"     ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Marquer comme lue"          ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- PHONE BLACKLIST
CREATE POLICY "Voir la blacklist"          ON public.phone_blacklist FOR SELECT USING (true);
```

---

## 7. CONFIGURATION SUPABASE CLIENT/SERVER

### `lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

### `lib/supabase/server.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

### `lib/supabase/service.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

// Client service role — UNIQUEMENT dans Server Actions et Cron Jobs
// Ne jamais exposer côté client
export const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

---

## 8. MIDDLEWARE DE PROTECTION

### `middleware.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register', '/onboarding']
const AUTH_ROUTES   = ['/login', '/register']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const isPublicRoute = PUBLIC_ROUTES.some(r => pathname.startsWith(r))
  const isAuthRoute   = AUTH_ROUTES.some(r => pathname.startsWith(r))
  const isApiRoute    = pathname.startsWith('/api/')

  // Laisser passer les webhooks et crons
  if (isApiRoute) return supabaseResponse

  // Rediriger vers login si non authentifié
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Rediriger vers dashboard si déjà connecté
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

---

## 9. STORES ZUSTAND

### `lib/stores/authStore.ts`
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile } from '@/lib/types'

interface AuthStore {
  user: UserProfile | null
  setUser: (user: UserProfile | null) => void
  updateTrustScore: (score: number) => void
  updateSubscription: (plan: 'free' | 'pro', expiresAt: string | null) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      updateTrustScore: (score) =>
        set((state) => ({
          user: state.user ? { ...state.user, trust_score: score } : null,
        })),
      updateSubscription: (plan, expiresAt) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, subscription_plan: plan, subscription_expires_at: expiresAt }
            : null,
        })),
      clearUser: () => set({ user: null }),
    }),
    { name: 'tontigo-auth' }
  )
)
```

### `lib/stores/tontineStore.ts`
```typescript
import { create } from 'zustand'
import type { TontineGroup, Membership } from '@/lib/types'

interface TontineStore {
  activeGroup: TontineGroup | null
  groups: TontineGroup[]
  myMemberships: Membership[]
  setActiveGroup: (group: TontineGroup | null) => void
  setGroups: (groups: TontineGroup[]) => void
  setMyMemberships: (memberships: Membership[]) => void
  updateGroupStatus: (groupId: string, status: TontineGroup['status']) => void
}

export const useTontineStore = create<TontineStore>((set) => ({
  activeGroup: null,
  groups: [],
  myMemberships: [],
  setActiveGroup: (group) => set({ activeGroup: group }),
  setGroups: (groups) => set({ groups }),
  setMyMemberships: (memberships) => set({ myMemberships: memberships }),
  updateGroupStatus: (groupId, status) =>
    set((state) => ({
      groups: state.groups.map(g => g.id === groupId ? { ...g, status } : g),
    })),
}))
```

### `lib/stores/epargneStore.ts`
```typescript
import { create } from 'zustand'
import type { SavingsVault } from '@/lib/types'

interface EpargneStore {
  vaults: SavingsVault[]
  activeVault: SavingsVault | null
  setVaults: (vaults: SavingsVault[]) => void
  setActiveVault: (vault: SavingsVault | null) => void
  updateVaultBalance: (vaultId: string, newBalance: number) => void
}

export const useEpargneStore = create<EpargneStore>((set) => ({
  vaults: [],
  activeVault: null,
  setVaults: (vaults) => set({ vaults }),
  setActiveVault: (vault) => set({ activeVault: vault }),
  updateVaultBalance: (vaultId, newBalance) =>
    set((state) => ({
      vaults: state.vaults.map(v =>
        v.id === vaultId ? { ...v, current_balance: newBalance } : v
      ),
    })),
}))
```

---

## 10. SCHÉMAS DE VALIDATION ZOD

### `lib/validations/auth.schema.ts`
```typescript
import { z } from 'zod'

export const phoneSchema = z.object({
  phone: z
    .string()
    .min(9, 'Numéro invalide')
    .regex(/^(\+?242)?[0-9]{9}$/, 'Format: +242XXXXXXXXX ou 9 chiffres'),
})

export const otpSchema = z.object({
  token: z.string().length(6, 'Le code doit contenir 6 chiffres').regex(/^\d+$/, 'Chiffres uniquement'),
})

export const onboardingSchema = z.object({
  full_name: z.string().min(2, 'Nom trop court').max(60),
  wallet_mtn: z.string().regex(/^(\+?242)?[0-9]{9}$/).optional().or(z.literal('')),
  wallet_airtel: z.string().regex(/^(\+?242)?[0-9]{9}$/).optional().or(z.literal('')),
})

export type PhoneInput      = z.infer<typeof phoneSchema>
export type OtpInput        = z.infer<typeof otpSchema>
export type OnboardingInput = z.infer<typeof onboardingSchema>
```

### `lib/validations/tontine.schema.ts`
```typescript
import { z } from 'zod'

export const createGroupSchema = z.object({
  name:               z.string().min(3, 'Minimum 3 caractères').max(50),
  description:        z.string().max(200).optional(),
  amount:             z.number().min(1000, 'Minimum 1 000 FCFA').max(10_000_000),
  frequency:          z.enum(['quotidien', 'hebdomadaire', 'mensuel']),
  max_members:        z.number().int().min(2).max(50),
  penalty_rate:       z.number().min(0.5).max(20),
  order_type:         z.enum(['tirage_au_sort', 'encheres', 'manuel']),
  is_public:          z.boolean().default(false),
  min_trust_score:    z.number().int().min(0).max(100).default(30),
  requires_guarantee: z.boolean().default(true),
})

export const joinGroupSchema = z.object({
  invite_code: z.string().length(8, 'Code d\'invitation invalide (8 caractères)'),
})

export const disputeSchema = z.object({
  member_reported: z.string().uuid(),
  reason:          z.string().min(10, 'Décrivez le problème (min 10 caractères)').max(500),
  evidence:        z.string().max(500).optional(),
})

export type CreateGroupInput = z.infer<typeof createGroupSchema>
export type JoinGroupInput   = z.infer<typeof joinGroupSchema>
export type DisputeInput     = z.infer<typeof disputeSchema>
```

### `lib/validations/matching.schema.ts`
```typescript
import { z } from 'zod'

export const matchingFilterSchema = z.object({
  amount_min:      z.number().min(1000),
  amount_max:      z.number().min(1000),
  frequency:       z.enum(['quotidien', 'hebdomadaire', 'mensuel']),
  min_trust_score: z.number().int().min(0).max(100).default(50),
}).refine(d => d.amount_max >= d.amount_min, {
  message: 'Le montant maximum doit être supérieur au minimum',
  path: ['amount_max'],
})

export type MatchingFilterInput = z.infer<typeof matchingFilterSchema>
```

### `lib/validations/epargne.schema.ts`
```typescript
import { z } from 'zod'
import { addDays, isAfter } from 'date-fns'

export const createVaultSchema = z.object({
  name:               z.string().min(2).max(50),
  description:        z.string().max(200).optional(),
  target_amount:      z.number().min(0).optional(),
  unlock_date:        z.string().refine(
    (date) => isAfter(new Date(date), addDays(new Date(), 29)),
    'La date doit être au moins 30 jours dans le futur'
  ),
  frequency:          z.enum(['quotidien', 'hebdomadaire', 'mensuel']).optional(),
  auto_amount:        z.number().min(0).optional(),
  wallet_destination: z.string().optional(),
})

export const depositVaultSchema = z.object({
  amount:      z.number().min(500, 'Minimum 500 FCFA'),
  wallet_type: z.enum(['mtn', 'airtel']),
})

export type CreateVaultInput  = z.infer<typeof createVaultSchema>
export type DepositVaultInput = z.infer<typeof depositVaultSchema>
```

---

## 11. UTILITAIRES MÉTIER

### `lib/utils/penalty.ts`
```typescript
export function calculateDailyPenalty(amount: number, penaltyRate: number): number {
  return Math.round(amount * (penaltyRate / 100))
}

export function calculateTotalPenalties(
  amount: number,
  penaltyRate: number,
  daysLate: number
): number {
  return calculateDailyPenalty(amount, penaltyRate) * daysLate
}

export function shouldEliminate(totalPaid: number, totalPenalties: number): boolean {
  return totalPaid > 0 && totalPenalties >= totalPaid
}

export type PenaltyLevel = 'none' | 'warning' | 'critical'
export function getPenaltyLevel(daysLate: number): PenaltyLevel {
  if (daysLate === 0) return 'none'
  if (daysLate <= 3) return 'warning'
  return 'critical'
}
```

### `lib/utils/guarantee.ts`
```typescript
export function calculateGuarantee(
  turnPosition: number,
  maxMembers: number,
  amount: number
): number {
  if (maxMembers <= 1) return 0
  const ratio = (maxMembers - turnPosition) / (maxMembers - 1)
  return Math.round(amount * maxMembers * ratio)
}

export function getGuaranteeLabel(turnPosition: number, maxMembers: number): string {
  const ratio = (maxMembers - turnPosition) / (maxMembers - 1)
  if (ratio >= 0.8) return 'Très élevée'
  if (ratio >= 0.5) return 'Élevée'
  if (ratio >= 0.2) return 'Modérée'
  return 'Faible'
}
```

### `lib/utils/commission.ts`
```typescript
// Toutes les constantes de commission — synchronisées avec .env
export const COMMISSION_RATES = {
  payout:           parseFloat(process.env.COMMISSION_PAYOUT_RATE  || '0.015'),  // 1.5%
  matchingFee:      parseFloat(process.env.COMMISSION_MATCHING_FEE  || '500'),   // 500 FCFA fixe
  savingsWithdraw:  parseFloat(process.env.COMMISSION_SAVINGS_RATE  || '0.005'), // 0.5%
  proSubscription:  parseFloat(process.env.PRO_SUBSCRIPTION_PRICE   || '2500'),  // 2500 FCFA/mois
} as const

export function calculatePayoutCommission(grossAmount: number): {
  commission: number
  netAmount: number
} {
  const commission = Math.round(grossAmount * COMMISSION_RATES.payout)
  return {
    commission,
    netAmount: grossAmount - commission,
  }
}

export function calculateSavingsCommission(withdrawAmount: number): {
  commission: number
  netAmount: number
} {
  const commission = Math.round(withdrawAmount * COMMISSION_RATES.savingsWithdraw)
  return {
    commission,
    netAmount: withdrawAmount - commission,
  }
}

export function getMatchingFee(): number {
  return COMMISSION_RATES.matchingFee
}
```

### `lib/utils/trust-score.ts`
```typescript
export type TrustEvent =
  | 'on_time_payment'
  | 'late_payment'
  | 'elimination'
  | 'group_completed'
  | 'dispute_filed_against'
  | 'fugitive'

export function getTrustScoreDelta(event: TrustEvent, daysLate?: number): number {
  switch (event) {
    case 'on_time_payment':        return +2
    case 'late_payment':           return daysLate ? -Math.min(daysLate * 2, 15) : -5
    case 'elimination':            return -20
    case 'group_completed':        return +10
    case 'dispute_filed_against':  return -15
    case 'fugitive':               return -50
    default:                       return 0
  }
}

export function getTrustScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

export function getTrustScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500/20 border-emerald-500/30'
  if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30'
  if (score >= 40) return 'bg-orange-500/20 border-orange-500/30'
  return 'bg-red-500/20 border-red-500/30'
}

export function getTrustScoreLabel(score: number): string {
  if (score >= 80) return 'Expert'
  if (score >= 60) return 'Fiable'
  if (score >= 40) return 'Nouveau'
  return 'À risque'
}
```

### `lib/utils/matching.ts`
```typescript
import type { UserProfile, TontineGroup, MatchingProfile } from '@/lib/types'

export function calculateMatchScore(
  user: Pick<UserProfile, 'trust_score' | 'total_groups_completed'>,
  group: Pick<TontineGroup, 'min_trust_score'>
): number {
  let score = 0
  // Score de confiance suffisant : 40 points
  if (user.trust_score >= group.min_trust_score) score += 40
  // Bonus groupes complétés : max 30 points
  score += Math.min(user.total_groups_completed * 5, 30)
  // Bonus niveau confiance : max 30 points
  if (user.trust_score >= 80) score += 30
  else if (user.trust_score >= 60) score += 20
  else if (user.trust_score >= 40) score += 10
  return Math.min(score, 100)
}

export function sortGroupsByMatchScore(
  groups: TontineGroup[],
  user: UserProfile
): MatchingProfile[] {
  return groups
    .map(g => ({
      group_id:             g.id,
      group_name:           g.name,
      amount:               g.amount,
      frequency:            g.frequency,
      current_members:      g.current_members,
      max_members:          g.max_members,
      min_trust_score:      g.min_trust_score,
      creator_trust_score:  g.creator?.trust_score ?? 50,
      match_score:          calculateMatchScore(user, g),
    }))
    .filter(g => g.match_score >= 40) // Seuil minimum de compatibilité
    .sort((a, b) => b.match_score - a.match_score)
}
```

### `lib/utils/format.ts`
```typescript
export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-CG', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function getDaysUntil(date: string): number {
  const now  = new Date()
  const then = new Date(date)
  return Math.max(0, Math.ceil((then.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

export function getFrequencyLabel(frequency: string): string {
  const labels: Record<string, string> = {
    quotidien:      'Quotidien',
    hebdomadaire:   'Hebdomadaire',
    mensuel:        'Mensuel',
  }
  return labels[frequency] ?? frequency
}
```

---

## 12. SERVER ACTIONS — AUTH

### `lib/actions/auth.actions.ts`
```typescript
'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import type { ActionResult } from '@/lib/types'

export async function sendOtp(phone: string): Promise<ActionResult> {
  // Vérifier le blacklist
  const { data: blacklisted } = await serviceClient
    .from('phone_blacklist').select('id').eq('phone', phone).maybeSingle()

  if (blacklisted) {
    return { error: 'Ce numéro est banni de la plateforme Likelemba.' }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { channel: 'sms' }
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function verifyOtp(phone: string, token: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })

  if (error) return { error: 'Code incorrect ou expiré.' }

  // Vérifier si l'onboarding est nécessaire
  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', data.user!.id)
    .single()

  if (!profile?.full_name || profile.full_name === 'Utilisateur') {
    redirect('/onboarding')
  }

  redirect('/dashboard')
}

export async function completeOnboarding(
  userId: string,
  data: { full_name: string; wallet_mtn?: string; wallet_airtel?: string }
): Promise<ActionResult> {
  const { error } = await serviceClient
    .from('users')
    .update({
      full_name:     data.full_name,
      wallet_mtn:    data.wallet_mtn || null,
      wallet_airtel: data.wallet_airtel || null,
      updated_at:    new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) return { error: error.message }
  redirect('/dashboard')
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users').select('*').eq('id', user.id).single()

  return profile
}
```

---

## 13. SERVER ACTIONS — TONTINE

### `lib/actions/tontine.actions.ts`
```typescript
'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { calculateGuarantee } from '@/lib/utils/guarantee'
import { recordRevenue } from './commission.actions'
import { calculatePayoutCommission } from '@/lib/utils/commission'
import type { ActionResult, TontineGroup } from '@/lib/types'
import type { CreateGroupInput } from '@/lib/validations/tontine.schema'

export async function createGroup(input: CreateGroupInput): Promise<ActionResult<TontineGroup>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: group, error } = await serviceClient
    .from('tontine_groups')
    .insert({ ...input, creator_id: user.id, current_members: 1 })
    .select()
    .single()

  if (error) return { error: error.message }

  // Initialiser le pool de solidarité
  await serviceClient.from('solidarity_pool').insert({
    group_id: group.id,
    balance: 0,
  })

  // Ajouter le créateur comme membre position 1
  const guarantee = input.requires_guarantee
    ? calculateGuarantee(1, input.max_members, input.amount)
    : 0

  await serviceClient.from('memberships').insert({
    group_id:         group.id,
    user_id:          user.id,
    turn_position:    1,
    guarantee_amount: guarantee,
  })

  revalidatePath('/tontine')
  return { data: group }
}

export async function joinGroupByCode(invite_code: string): Promise<ActionResult<TontineGroup>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: group } = await serviceClient
    .from('tontine_groups').select('*').eq('invite_code', invite_code).single()

  if (!group)                                    return { error: 'Code d\'invitation invalide.' }
  if (group.status !== 'en_attente')             return { error: 'Ce groupe a déjà démarré.' }
  if (group.current_members >= group.max_members) return { error: 'Groupe complet.' }

  const { data: profile } = await supabase.from('users').select('trust_score').eq('id', user.id).single()
  if (profile && profile.trust_score < group.min_trust_score) {
    return { error: `Score de confiance insuffisant. Requis: ${group.min_trust_score}, le tien: ${profile.trust_score}` }
  }

  // Vérifier si déjà membre
  const { data: existing } = await serviceClient
    .from('memberships').select('id').eq('group_id', group.id).eq('user_id', user.id).maybeSingle()
  if (existing) return { error: 'Tu es déjà membre de ce groupe.' }

  const nextPosition = group.current_members + 1
  const guarantee = group.requires_guarantee
    ? calculateGuarantee(nextPosition, group.max_members, group.amount)
    : 0

  const { error: mError } = await serviceClient.from('memberships').insert({
    group_id:         group.id,
    user_id:          user.id,
    turn_position:    nextPosition,
    guarantee_amount: guarantee,
  })
  if (mError) return { error: mError.message }

  await serviceClient.from('tontine_groups')
    .update({ current_members: nextPosition })
    .eq('id', group.id)

  // Notifier les autres membres
  const { data: others } = await serviceClient
    .from('memberships').select('user_id').eq('group_id', group.id).neq('user_id', user.id)

  if (others?.length) {
    await serviceClient.from('notifications').insert(
      others.map(m => ({
        user_id:      m.user_id,
        title:        'Nouveau membre',
        body:         `Un nouveau membre a rejoint "${group.name}".`,
        type:         'new_member',
        reference_id: group.id,
      }))
    )
  }

  revalidatePath('/tontine')
  return { data: group }
}

export async function startGroup(groupId: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: group } = await serviceClient
    .from('tontine_groups').select('*').eq('id', groupId).single()

  if (!group)                      return { error: 'Groupe introuvable' }
  if (group.creator_id !== user.id) return { error: 'Seul le créateur peut démarrer le groupe' }
  if (group.current_members < 2)    return { error: 'Minimum 2 membres requis' }
  if (group.status !== 'en_attente') return { error: 'Le groupe est déjà démarré' }

  const dueDate = getNextDueDate(group.frequency)

  const { data: members } = await serviceClient
    .from('memberships').select('id').eq('group_id', groupId).eq('status', 'actif')

  if (members?.length) {
    await serviceClient.from('contributions').insert(
      members.map(m => ({
        membership_id: m.id,
        group_id:      groupId,
        amount:        group.amount,
        due_date:      dueDate,
        status:        'en_attente',
      }))
    )
  }

  await serviceClient.from('tontine_groups').update({
    status:     'actif',
    started_at: new Date().toISOString(),
  }).eq('id', groupId)

  // Notifier tous les membres
  const { data: allMembers } = await serviceClient
    .from('memberships').select('user_id').eq('group_id', groupId)
  if (allMembers) {
    await serviceClient.from('notifications').insert(
      allMembers.map(m => ({
        user_id:      m.user_id,
        title:        '🚀 Tontine démarrée !',
        body:         `"${group.name}" est maintenant active. Première cotisation due le ${dueDate}.`,
        type:         'group_started',
        reference_id: groupId,
      }))
    )
  }

  revalidatePath(`/tontine/${groupId}`)
  return { success: true }
}

export async function payContribution(
  contributionId: string,
  walletType: 'mtn' | 'airtel'
): Promise<ActionResult<{ reference: string }>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: contribution } = await serviceClient
    .from('contributions')
    .select('*, memberships(total_paid, user_id)')
    .eq('id', contributionId)
    .single()

  if (!contribution) return { error: 'Cotisation introuvable' }
  if (contribution.status === 'paye') return { error: 'Cette cotisation est déjà payée' }

  const membership = contribution.memberships as { total_paid: number; user_id: string }
  if (membership.user_id !== user.id) return { error: 'Non autorisé' }

  const paymentRef = `TG-COT-${Date.now()}-${contributionId.slice(0, 6)}`

  // Ici : appeler l'API MTN/Airtel (voir étape 17)
  // Pour le moment, simuler le succès
  const paymentSuccess = true
  if (!paymentSuccess) return { error: 'Échec du paiement mobile' }

  await serviceClient.from('contributions').update({
    status:            'paye',
    paid_at:           new Date().toISOString(),
    payment_reference: paymentRef,
  }).eq('id', contributionId)

  await serviceClient.from('memberships').update({
    total_paid: membership.total_paid + contribution.amount,
  }).eq('id', contribution.membership_id)

  // Alimenter le pool de solidarité (2%)
  const solidarityAmount = Math.round(contribution.amount * 0.02)
  await serviceClient.rpc('increment_solidarity_pool', {
    p_group_id: contribution.group_id,
    p_amount:   solidarityAmount,
  })

  // Transaction
  await serviceClient.from('transactions').insert({
    user_id:            user.id,
    reference_id:       contributionId,
    type:               'cotisation',
    amount:             contribution.amount,
    wallet_used:        walletType,
    external_reference: paymentRef,
  })

  // +2 points de confiance pour paiement à temps
  if (contribution.days_late === 0) {
    await serviceClient.rpc('update_trust_score', { p_user_id: user.id, p_delta: 2 })
  }

  // Vérifier si toutes les cotisations du tour sont payées → déclencher le versement
  await checkAndProcessPayout(contribution.group_id)

  revalidatePath(`/tontine/${contribution.group_id}`)
  return { data: { reference: paymentRef } }
}

// Vérifier si toutes les cotisations sont payées et verser la cagnotte
async function checkAndProcessPayout(groupId: string): Promise<void> {
  const { data: group } = await serviceClient
    .from('tontine_groups').select('*').eq('id', groupId).single()
  if (!group || group.status !== 'actif') return

  // Compter les cotisations du tour actuel
  const { data: pendingContribs } = await serviceClient
    .from('contributions')
    .select('id')
    .eq('group_id', groupId)
    .in('status', ['en_attente', 'retard'])

  if (pendingContribs && pendingContribs.length === 0) {
    await processPayout(groupId, group.current_turn)
  }
}

async function processPayout(groupId: string, turnNumber: number): Promise<void> {
  // Trouver le bénéficiaire du tour
  const { data: membership } = await serviceClient
    .from('memberships')
    .select('*, users(wallet_mtn, wallet_airtel)')
    .eq('group_id', groupId)
    .eq('turn_position', turnNumber)
    .single()

  if (!membership) return

  const { data: group } = await serviceClient
    .from('tontine_groups').select('*').eq('id', groupId).single()
  if (!group) return

  const grossAmount = group.amount * group.current_members
  const { commission, netAmount } = calculatePayoutCommission(grossAmount)

  // Créer le payout
  const { data: payout } = await serviceClient.from('payouts').insert({
    group_id:          groupId,
    recipient_id:      membership.user_id,
    membership_id:     membership.id,
    amount:            grossAmount,
    commission_amount: commission,
    net_amount:        netAmount,
    turn_number:       turnNumber,
    status:            'en_attente',
  }).select().single()

  if (!payout) return

  // Enregistrer la commission Likelemba
  await recordRevenue({
    type:        'commission_payout',
    amount:      commission,
    source_id:   payout.id,
    source_type: 'payout',
    description: `Commission 1.5% sur versement groupe ${group.name}`,
  })

  // Ici: appeler l'API MTN/Airtel pour virer net_amount au bénéficiaire
  // ...

  await serviceClient.from('payouts').update({
    status:  'verse',
    paid_at: new Date().toISOString(),
  }).eq('id', payout.id)

  await serviceClient.from('memberships').update({
    has_received_payout: true,
    payout_received_at:  new Date().toISOString(),
  }).eq('id', membership.id)

  // Transaction pour le bénéficiaire
  await serviceClient.from('transactions').insert({
    user_id:      membership.user_id,
    reference_id: payout.id,
    type:         'versement',
    amount:       netAmount,
    description:  `Cagnotte reçue — ${group.name} (tour ${turnNumber})`,
  })

  // +10 points de confiance pour l'ayant droit
  await serviceClient.rpc('update_trust_score', { p_user_id: membership.user_id, p_delta: 10 })

  // Passer au tour suivant
  const nextTurn = turnNumber + 1
  if (nextTurn > group.current_members) {
    // Cycle terminé
    await serviceClient.from('tontine_groups').update({ status: 'termine' }).eq('id', groupId)
    // +10 points à tous les membres
    const { data: allMembers } = await serviceClient
      .from('memberships').select('user_id').eq('group_id', groupId)
    if (allMembers) {
      for (const m of allMembers) {
        await serviceClient.rpc('update_trust_score', { p_user_id: m.user_id, p_delta: 10 })
        await serviceClient.from('users')
          .update({ total_groups_completed: serviceClient.rpc('increment', { x: 1 }) })
          .eq('id', m.user_id)
      }
    }
  } else {
    // Préparer le tour suivant
    const nextDueDate = getNextDueDate(group.frequency)
    const { data: activeMembers } = await serviceClient
      .from('memberships').select('id').eq('group_id', groupId).eq('status', 'actif')

    if (activeMembers) {
      await serviceClient.from('contributions').insert(
        activeMembers.map(m => ({
          membership_id: m.id,
          group_id:      groupId,
          amount:        group.amount,
          due_date:      nextDueDate,
          status:        'en_attente',
        }))
      )
    }

    await serviceClient.from('tontine_groups')
      .update({ current_turn: nextTurn })
      .eq('id', groupId)
  }

  // Notifier le bénéficiaire
  await serviceClient.from('notifications').insert({
    user_id:      membership.user_id,
    title:        '💰 Cagnotte reçue !',
    body:         `Tu as reçu ${new Intl.NumberFormat('fr-FR').format(netAmount)} FCFA de "${group.name}".`,
    type:         'payout_received',
    reference_id: groupId,
  })
}

export async function reportFugitive(groupId: string, memberId: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  await serviceClient.from('memberships').update({ status: 'fugitif' })
    .eq('group_id', groupId).eq('user_id', memberId)

  const { data: membership } = await serviceClient
    .from('memberships').select('guarantee_amount').eq('group_id', groupId).eq('user_id', memberId).single()

  if (membership?.guarantee_amount > 0) {
    await serviceClient.rpc('seize_guarantee_and_redistribute', {
      p_group_id:          groupId,
      p_fugitive_user_id:  memberId,
      p_guarantee_amount:  membership.guarantee_amount,
    })
  }

  // Bannir le numéro de téléphone
  const { data: fugitive } = await serviceClient.from('users').select('phone').eq('id', memberId).single()
  if (fugitive) {
    await serviceClient.from('phone_blacklist').insert({
      phone:  fugitive.phone,
      reason: `Fuite après réception de cagnotte — Groupe ${groupId}`,
    }).onConflict('phone').ignore()

    await serviceClient.from('users').update({
      is_banned:   true,
      trust_score: 0,
      badge:       'fraudeur',
      status:      'banni',
    }).eq('id', memberId)
  }

  revalidatePath(`/tontine/${groupId}`)
  return { success: true }
}

function getNextDueDate(frequency: string): string {
  const date = new Date()
  if (frequency === 'quotidien')    date.setDate(date.getDate() + 1)
  else if (frequency === 'hebdomadaire') date.setDate(date.getDate() + 7)
  else                               date.setMonth(date.getMonth() + 1)
  return date.toISOString().split('T')[0]
}
```

---

## 14. SERVER ACTIONS — COMMISSIONS & REVENUS

### `lib/actions/commission.actions.ts`
```typescript
'use server'
import { serviceClient } from '@/lib/supabase/service'
import type { ActionResult, PlatformRevenue, RevenueType } from '@/lib/types'

interface RecordRevenueInput {
  type:         RevenueType
  amount:       number
  source_id?:   string
  source_type?: string
  description?: string
}

// Enregistrer un revenu pour Likelemba (appelé en interne, jamais exposé côté client)
export async function recordRevenue(input: RecordRevenueInput): Promise<void> {
  await serviceClient.from('platform_revenues').insert({
    type:         input.type,
    amount:       input.amount,
    source_id:    input.source_id ?? null,
    source_type:  input.source_type ?? null,
    description:  input.description ?? null,
  })
}

// Facturer les frais de matching (500 FCFA par utilisateur)
export async function chargeMatchingFee(userId: string, requestId: string): Promise<ActionResult> {
  const FEE = parseInt(process.env.COMMISSION_MATCHING_FEE || '500')

  // Ici: prélever 500 FCFA du wallet de l'utilisateur via MTN/Airtel
  // Pour l'instant : enregistrer la transaction
  const ref = `TG-MATCH-${Date.now()}-${userId.slice(0, 6)}`

  await serviceClient.from('transactions').insert({
    user_id:            userId,
    reference_id:       requestId,
    type:               'matching_fee',
    amount:             FEE,
    description:        'Frais de mise en relation Likelemba',
    external_reference: ref,
  })

  await serviceClient.from('matching_requests').update({ fee_paid: true }).eq('id', requestId)

  await recordRevenue({
    type:        'matching_fee',
    amount:      FEE,
    source_id:   requestId,
    source_type: 'matching_request',
    description: `Frais matching utilisateur ${userId.slice(0, 8)}`,
  })

  return { success: true }
}

// Activer l'abonnement Pro
export async function activateProSubscription(userId: string, walletType: 'mtn' | 'airtel'): Promise<ActionResult> {
  const PRICE = parseInt(process.env.PRO_SUBSCRIPTION_PRICE || '2500')

  // Prélever via wallet mobile
  const ref = `TG-PRO-${Date.now()}-${userId.slice(0, 6)}`
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + 1)

  await serviceClient.from('users').update({
    subscription_plan:       'pro',
    subscription_expires_at: expiresAt.toISOString(),
  }).eq('id', userId)

  await serviceClient.from('transactions').insert({
    user_id:            userId,
    type:               'abonnement',
    amount:             PRICE,
    description:        'Abonnement Likelemba Pro — 1 mois',
    wallet_used:        walletType,
    external_reference: ref,
  })

  await recordRevenue({
    type:        'subscription',
    amount:      PRICE,
    source_id:   userId,
    source_type: 'user',
    description: `Abonnement Pro — ${userId.slice(0, 8)}`,
  })

  return { success: true }
}

// Dashboard revenus pour le fondateur (admin uniquement)
export async function getRevenueStats(): Promise<ActionResult<{
  total: number
  byType: Record<RevenueType, number>
  last30Days: number
  last7Days: number
}>> {
  const supabase = await serviceClient

  const { data: revenues } = await supabase
    .from('platform_revenues')
    .select('*')
    .order('created_at', { ascending: false })

  if (!revenues) return { error: 'Impossible de charger les revenus' }

  const now = new Date()
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const d7  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)

  const total      = revenues.reduce((s, r) => s + r.amount, 0)
  const last30Days = revenues.filter(r => new Date(r.created_at) >= d30).reduce((s, r) => s + r.amount, 0)
  const last7Days  = revenues.filter(r => new Date(r.created_at) >= d7).reduce((s, r)  => s + r.amount, 0)

  const byType = revenues.reduce((acc, r) => {
    acc[r.type as RevenueType] = (acc[r.type as RevenueType] || 0) + r.amount
    return acc
  }, {} as Record<RevenueType, number>)

  return { data: { total, byType, last30Days, last7Days } }
}
```

---

## 15. SERVER ACTIONS — MATCHING

### `lib/actions/matching.actions.ts`
```typescript
'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { chargeMatchingFee } from './commission.actions'
import { sortGroupsByMatchScore } from '@/lib/utils/matching'
import { calculateGuarantee } from '@/lib/utils/guarantee'
import type { ActionResult, MatchingProfile, TontineGroup } from '@/lib/types'
import type { MatchingFilterInput } from '@/lib/validations/matching.schema'

// Rechercher des groupes compatibles (sans frais, juste la liste)
export async function findMatchingGroups(
  filters: MatchingFilterInput
): Promise<ActionResult<MatchingProfile[]>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile) return { error: 'Profil introuvable' }

  // Récupérer les groupes publics compatibles
  const { data: groups } = await serviceClient
    .from('tontine_groups')
    .select('*, creator:creator_id(trust_score)')
    .eq('is_public', true)
    .eq('status', 'en_attente')
    .gte('amount', filters.amount_min)
    .lte('amount', filters.amount_max)
    .eq('frequency', filters.frequency!)
    .lte('min_trust_score', profile.trust_score) // Seulement les groupes accessibles
    .lt('current_members', serviceClient.rpc as any) // current_members < max_members

  if (!groups) return { data: [] }

  // Filtrer les groupes non complets
  const openGroups = (groups as TontineGroup[]).filter(
    g => g.current_members < g.max_members
  )

  const matches = sortGroupsByMatchScore(openGroups, profile)

  return { data: matches }
}

// Rejoindre un groupe via matching (avec frais de 500 FCFA)
export async function joinViaMatching(groupId: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile) return { error: 'Profil introuvable' }

  // Vérifier l'abonnement Pro (gratuit) ou facturer 500 FCFA
  const hasPro = profile.subscription_plan === 'pro' &&
    profile.subscription_expires_at &&
    new Date(profile.subscription_expires_at) > new Date()

  // Créer la demande de matching
  const { data: request } = await serviceClient.from('matching_requests').insert({
    user_id:          user.id,
    amount_min:       0,
    amount_max:       9_999_999,
    frequency:        'mensuel',
    matched_group_id: groupId,
    status:           'matche',
  }).select().single()

  if (!request) return { error: 'Erreur lors de la création de la demande' }

  // Facturer les frais si plan Free
  if (!hasPro) {
    const feeResult = await chargeMatchingFee(user.id, request.id)
    if (feeResult.error) return { error: `Frais de matching : ${feeResult.error}` }
  }

  // Rejoindre le groupe
  const { data: group } = await serviceClient
    .from('tontine_groups').select('*').eq('id', groupId).single()
  if (!group) return { error: 'Groupe introuvable' }

  const nextPosition = group.current_members + 1
  const guarantee = group.requires_guarantee
    ? calculateGuarantee(nextPosition, group.max_members, group.amount)
    : 0

  await serviceClient.from('memberships').insert({
    group_id:         groupId,
    user_id:          user.id,
    turn_position:    nextPosition,
    guarantee_amount: guarantee,
  })

  await serviceClient.from('tontine_groups')
    .update({ current_members: nextPosition })
    .eq('id', groupId)

  // Notifier le créateur
  await serviceClient.from('notifications').insert({
    user_id:      group.creator_id,
    title:        '🤝 Nouveau membre via Matching',
    body:         `${profile.full_name} a rejoint ton groupe "${group.name}" via le matching.`,
    type:         'matching_join',
    reference_id: groupId,
  })

  revalidatePath('/matching')
  revalidatePath('/tontine')
  return { success: true }
}

// Créer une demande de matching (l'app cherche un groupe adapté)
export async function createMatchingRequest(
  filters: MatchingFilterInput
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: existing } = await serviceClient
    .from('matching_requests')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'en_attente')
    .maybeSingle()

  if (existing) return { error: 'Tu as déjà une demande de matching en cours.' }

  await serviceClient.from('matching_requests').insert({
    user_id:        user.id,
    amount_min:     filters.amount_min,
    amount_max:     filters.amount_max,
    frequency:      filters.frequency!,
    min_trust_score: filters.min_trust_score,
    status:         'en_attente',
  })

  revalidatePath('/matching')
  return { success: true }
}
```

---

## 16. SERVER ACTIONS — ÉPARGNE

### `lib/actions/epargne.actions.ts`
```typescript
'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { recordRevenue } from './commission.actions'
import { calculateSavingsCommission } from '@/lib/utils/commission'
import type { ActionResult, SavingsVault } from '@/lib/types'
import type { CreateVaultInput, DepositVaultInput } from '@/lib/validations/epargne.schema'

export async function createVault(input: CreateVaultInput): Promise<ActionResult<SavingsVault>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data, error } = await serviceClient
    .from('savings_vaults')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/epargne')
  return { data }
}

export async function depositToVault(
  vaultId: string,
  input: DepositVaultInput
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: vault } = await serviceClient
    .from('savings_vaults')
    .select('*').eq('id', vaultId).eq('user_id', user.id).single()

  if (!vault)                  return { error: 'Coffre introuvable' }
  if (vault.status !== 'actif') return { error: 'Ce coffre est clôturé' }

  const ref = `TG-SAVE-${Date.now()}-${vaultId.slice(0, 6)}`

  // Ici: appeler l'API MTN/Airtel pour le paiement entrant
  // ...

  await serviceClient.from('savings_contributions').insert({
    vault_id:          vaultId,
    user_id:           user.id,
    amount:            input.amount,
    payment_reference: ref,
  })

  await serviceClient.from('savings_vaults').update({
    current_balance: vault.current_balance + input.amount,
  }).eq('id', vaultId)

  await serviceClient.from('transactions').insert({
    user_id:            user.id,
    reference_id:       vaultId,
    type:               'epargne',
    amount:             input.amount,
    description:        `Versement dans "${vault.name}"`,
    wallet_used:        input.wallet_type,
    external_reference: ref,
  })

  revalidatePath('/epargne')
  revalidatePath(`/epargne/${vaultId}`)
  return { success: true }
}

// RETRAIT — uniquement si status === 'debloque'
export async function withdrawFromVault(vaultId: string): Promise<ActionResult<{ netAmount: number }>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: vault } = await serviceClient
    .from('savings_vaults').select('*').eq('id', vaultId).eq('user_id', user.id).single()

  if (!vault) return { error: 'Coffre introuvable' }

  // ── VÉRIFICATION ABSOLUE ──────────────────────────────────────────────────
  if (new Date(vault.unlock_date) > new Date()) {
    const daysLeft = Math.ceil((new Date(vault.unlock_date).getTime() - Date.now()) / 86400000)
    return { error: `Retrait impossible. Il reste ${daysLeft} jour(s) avant le déblocage.` }
  }
  if (vault.status !== 'debloque') {
    return { error: 'Le coffre n\'est pas encore débloqué.' }
  }
  if (vault.current_balance <= 0) {
    return { error: 'Solde insuffisant.' }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const { commission, netAmount } = calculateSavingsCommission(vault.current_balance)
  const ref = `TG-WDRAW-${Date.now()}-${vaultId.slice(0, 6)}`

  // Ici: virer netAmount vers vault.wallet_destination via MTN/Airtel
  // ...

  await serviceClient.from('savings_vaults').update({
    status:          'termine',
    current_balance: 0,
  }).eq('id', vaultId)

  await serviceClient.from('transactions').insert({
    user_id:            user.id,
    reference_id:       vaultId,
    type:               'retrait_epargne',
    amount:             netAmount,
    description:        `Retrait coffre "${vault.name}" (commission: ${commission} FCFA)`,
    wallet_used:        vault.wallet_destination,
    external_reference: ref,
  })

  await recordRevenue({
    type:        'savings_withdrawal',
    amount:      commission,
    source_id:   vaultId,
    source_type: 'savings_vault',
    description: `Commission 0.5% retrait épargne`,
  })

  revalidatePath('/epargne')
  return { data: { netAmount } }
}
```

---

## 17. SERVER ACTIONS — PAIEMENTS MOBILE

### `lib/actions/paiement.actions.ts`
```typescript
'use server'

// ─── MTN Mobile Money (Congo Brazzaville) ────────────────────
export async function initiateMtnCollection(params: {
  phone:       string
  amount:      number
  reference:   string
  description: string
}): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    const response = await fetch(
      `${process.env.MTN_MOMO_BASE_URL}/collection/v1_0/requesttopay`,
      {
        method: 'POST',
        headers: {
          'Authorization':             `Bearer ${process.env.MTN_MOMO_API_KEY}`,
          'X-Reference-Id':            params.reference,
          'X-Target-Environment':      process.env.MTN_MOMO_ENV || 'sandbox',
          'Content-Type':              'application/json',
          'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY!,
        },
        body: JSON.stringify({
          amount:      params.amount.toString(),
          currency:    'XAF',
          externalId:  params.reference,
          payer:       { partyIdType: 'MSISDN', partyId: params.phone.replace('+', '') },
          payerMessage: params.description,
          payeeNote:   'Likelemba',
        }),
      }
    )
    return { success: response.status === 202, transactionId: params.reference }
  } catch (e) {
    return { success: false, error: 'Erreur réseau MTN' }
  }
}

export async function initiateMtnDisbursement(params: {
  phone:       string
  amount:      number
  reference:   string
  description: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${process.env.MTN_MOMO_BASE_URL}/disbursement/v1_0/transfer`,
      {
        method: 'POST',
        headers: {
          'Authorization':             `Bearer ${process.env.MTN_MOMO_API_KEY}`,
          'X-Reference-Id':            params.reference,
          'X-Target-Environment':      process.env.MTN_MOMO_ENV || 'sandbox',
          'Content-Type':              'application/json',
          'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY!,
        },
        body: JSON.stringify({
          amount:      params.amount.toString(),
          currency:    'XAF',
          externalId:  params.reference,
          payee:       { partyIdType: 'MSISDN', partyId: params.phone.replace('+', '') },
          payerMessage: params.description,
          payeeNote:   'Likelemba — Cagnotte reçue',
        }),
      }
    )
    return { success: response.status === 202 }
  } catch {
    return { success: false, error: 'Erreur réseau MTN' }
  }
}

// ─── Airtel Money (Congo Brazzaville) ────────────────────────
async function getAirtelToken(): Promise<string | null> {
  try {
    const res = await fetch(`${process.env.AIRTEL_BASE_URL}/auth/oauth2/token`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     process.env.AIRTEL_CLIENT_ID,
        client_secret: process.env.AIRTEL_CLIENT_SECRET,
        grant_type:    'client_credentials',
      }),
    })
    const data = await res.json()
    return data.access_token ?? null
  } catch {
    return null
  }
}

export async function initiateAirtelCollection(params: {
  phone:       string
  amount:      number
  reference:   string
  description: string
}): Promise<{ success: boolean; error?: string }> {
  const token = await getAirtelToken()
  if (!token) return { success: false, error: 'Impossible de contacter Airtel' }

  try {
    const response = await fetch(`${process.env.AIRTEL_BASE_URL}/merchant/v2/payments/`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json',
        'X-Country':     'CG',
        'X-Currency':    'XAF',
      },
      body: JSON.stringify({
        reference:   params.reference,
        subscriber:  { country: 'CG', currency: 'XAF', msisdn: params.phone.replace('+', '') },
        transaction: { amount: params.amount, country: 'CG', currency: 'XAF', id: params.reference },
      }),
    })
    const data = await response.json()
    return { success: data.status?.success === true }
  } catch {
    return { success: false, error: 'Erreur réseau Airtel' }
  }
}
```

---

## 18. WEBHOOKS & CRON JOBS

### `app/api/webhooks/mtn/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { serviceClient } from '@/lib/supabase/service'

export async function POST(request: Request) {
  const body = await request.json()

  // Vérifier la signature MTN (en production)
  // const signature = request.headers.get('x-mtn-signature')

  const { externalId, status, financialTransactionId } = body

  if (status === 'SUCCESSFUL') {
    // Mettre à jour la contribution ou la cotisation correspondante
    await serviceClient.from('contributions').update({
      status:            'paye',
      paid_at:           new Date().toISOString(),
      payment_reference: financialTransactionId,
    }).eq('payment_reference', externalId)
  }

  return NextResponse.json({ received: true })
}
```

### `app/api/cron/amendes/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { serviceClient } from '@/lib/supabase/service'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await serviceClient.rpc('apply_daily_penalties')
  return NextResponse.json({ success: true, ran_at: new Date().toISOString() })
}
```

### `app/api/cron/epargne-unlock/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { serviceClient } from '@/lib/supabase/service'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await serviceClient.rpc('unlock_matured_vaults')
  return NextResponse.json({ success: true })
}
```

### `app/api/cron/rappels/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { serviceClient } from '@/lib/supabase/service'
import { addDays, format } from 'date-fns'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  // Cotisations dues demain
  const { data: dueTomorrow } = await serviceClient
    .from('contributions')
    .select('*, memberships(user_id), tontine_groups(name)')
    .eq('due_date', tomorrow)
    .eq('status', 'en_attente')

  if (dueTomorrow?.length) {
    await serviceClient.from('notifications').insert(
      dueTomorrow.map(c => ({
        user_id:      (c.memberships as any).user_id,
        title:        '⏰ Rappel cotisation',
        body:         `Ta cotisation pour "${(c.tontine_groups as any).name}" est due demain.`,
        type:         'payment_reminder',
        reference_id: c.group_id,
      }))
    )
  }

  return NextResponse.json({ success: true, reminders_sent: dueTomorrow?.length ?? 0 })
}
```

### `vercel.json`
```json
{
  "crons": [
    { "path": "/api/cron/amendes",       "schedule": "0 0 * * *" },
    { "path": "/api/cron/epargne-unlock","schedule": "0 1 * * *" },
    { "path": "/api/cron/rappels",       "schedule": "0 8 * * *" }
  ]
}
```

---

## 19. DESIGN SYSTEM

### `app/globals.css`
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background:    222 47% 7%;
    --foreground:    210 40% 98%;
    --card:          222 47% 11%;
    --card-foreground: 210 40% 98%;
    --popover:       222 47% 11%;
    --popover-foreground: 210 40% 98%;
    --primary:       160 84% 39%;
    --primary-foreground: 210 40% 98%;
    --secondary:     217 33% 17%;
    --secondary-foreground: 210 40% 98%;
    --muted:         217 33% 17%;
    --muted-foreground: 215 20% 55%;
    --accent:        38 92% 50%;
    --accent-foreground: 222 47% 7%;
    --destructive:   0 84% 60%;
    --destructive-foreground: 210 40% 98%;
    --border:        217 33% 17%;
    --input:         217 33% 17%;
    --ring:          160 84% 39%;
    --radius:        0.75rem;
  }
}

body {
  font-family: 'DM Sans', sans-serif;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 700;
}

.tontigo-card {
  @apply bg-slate-800/60 border border-slate-700/50 rounded-2xl backdrop-blur-sm;
}

.tontigo-gradient {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
}

.tontigo-gradient-text {
  background: linear-gradient(135deg, #10B981, #34D399);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.glass-card {
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 1rem;
}
```

### `next.config.ts`
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

export default nextConfig
```

---

## 20. COMPOSANTS UI — AUTH

### `components/auth/PhoneForm.tsx`
Formulaire avec :
- Input téléphone `+242` prefixé
- Validation Zod en temps réel (phoneSchema)
- Bouton "Recevoir le code" avec état loading
- Message d'erreur si numéro blacklisté
- Appelle `sendOtp(phone)` en Server Action

### `components/auth/OtpForm.tsx`
Formulaire avec :
- 6 inputs séparés (un par chiffre) avec focus automatique
- Timer décompte 60 secondes avant "Renvoyer le code"
- Bouton "Confirmer" avec état loading
- Appelle `verifyOtp(phone, token)`

### `components/auth/OnboardingForm.tsx`
Formulaire avec :
- Upload photo de profil (Supabase Storage, bucket `avatars`)
- Input nom complet (obligatoire)
- Input wallet MTN (facultatif, format +242XXXXXXXXX)
- Input wallet Airtel (facultatif, même format)
- Appelle `completeOnboarding(userId, data)`

---

## 21. COMPOSANTS UI — SHARED

### `components/shared/Sidebar.tsx`
Navigation latérale avec :
- Logo Likelemba
- Links: Dashboard, Tontines, Matching, Épargne, Transactions, Profil
- En bas: Avatar utilisateur + score de confiance + bouton déconnexion
- Actif: link surligné en vert emerald

### `components/shared/MobileNav.tsx`
Barre de navigation bottom pour mobile avec 5 icônes : Home, Tontine, Matching, Épargne, Profil

### `components/shared/TrustScoreBadge.tsx`
```tsx
// Affiche un cercle coloré avec le score (0-100)
// Couleurs: emerald >= 80, yellow >= 60, orange >= 40, red < 40
// Props: score: number, showLabel?: boolean, size?: 'sm' | 'md' | 'lg'
```

### `components/shared/NotificationBell.tsx`
Cloche avec badge rouge (count non lus) — connectée à Supabase Realtime sur la table `notifications`

### `components/shared/UserBadge.tsx`
Badge coloré avec l'emoji et le label du badge (nouveau/fiable/expert/fraudeur)

### `components/shared/EmptyState.tsx`
Composant générique vide avec icône, titre, description et bouton d'action optionnel

---

## 22. COMPOSANTS UI — TONTINE

### `components/tontine/GroupCard.tsx`
Carte affichant :
- Nom du groupe + badge statut
- Montant + fréquence
- Barre de progression membres (current/max)
- Tour actuel
- Prochain paiement dû (si membre)
- Amendes en cours (badge rouge si > 0)
- Bouton "Voir le groupe"

### `components/tontine/TourTimeline.tsx`
Frise chronologique horizontale des tours :
- Chaque tour = avatar du membre + position
- Tour passé = check vert
- Tour actuel = pulsant orange
- Tour futur = gris

### `components/tontine/CotisationCard.tsx`
Carte cotisation avec :
- Montant dû
- Date d'échéance + countdown
- Statut (payée/retard/en attente)
- Amende cumulée si retard (badge rouge)
- Bouton "Payer maintenant" → ouvre PaymentModal

### `components/tontine/PenaltyBadge.tsx`
Badge animé rouge/orange avec le montant de l'amende et les jours de retard

### `components/tontine/SolidarityPoolCard.tsx`
Carte affichant le solde du pool de solidarité avec barre de progression

### `components/tontine/MemberRow.tsx`
Ligne membre avec : avatar, nom, badge, score de confiance, statut, garantie payée/non, bouton signaler

---

## 23. COMPOSANTS UI — ÉPARGNE

### `components/epargne/VaultCard.tsx`
Carte coffre avec :
- Nom + icône cadenas
- Barre de progression solde/objectif (si objectif défini)
- Countdown animé jusqu'à la date de déblocage
- Statut en couleur
- Boutons conditionnels : "Ajouter" toujours visible / "Retirer" UNIQUEMENT si status = 'debloque'

### `components/epargne/VaultCountdown.tsx`
Composant countdown avec jours/heures/minutes/secondes — affiche "DÉBLOQUÉ 🎉" à l'échéance

### `components/epargne/VaultProgressBar.tsx`
Barre de progression verte avec pourcentage et montants formatés en FCFA

---

## 24. COMPOSANTS UI — PAIEMENT

### `components/paiement/PaymentModal.tsx`
Modal avec :
- Résumé du paiement (montant, destination, description)
- **Si versement (payout) : afficher la commission prélevée et le montant net**
  ```
  Montant brut :    XXX FCFA
  Commission (1,5%): -XXX FCFA  [en gris]
  ─────────────────────────────
  Tu reçois :        XXX FCFA  [en vert, gras]
  ```
- Sélecteur wallet : MTN Money / Airtel Money (avec numéros enregistrés)
- Bouton "Confirmer le paiement" avec loading
- Message de succès/erreur avec référence de transaction

### `components/paiement/WalletSelector.tsx`
Sélecteur radio avec logo MTN (fond jaune) et Airtel (fond rouge) + numéro associé

### `components/paiement/TransactionRow.tsx`
Ligne transaction avec : icône type, description, montant coloré (vert entrant / rouge sortant), date, statut

---

## 25. PAGES — AUTH & ONBOARDING

### `app/(auth)/login/page.tsx`
Page de connexion :
- Logo Likelemba centré
- Titre "Connexion"
- `PhoneForm` → si soumis, afficher `OtpForm`
- Lien "Première connexion ? Pas besoin de créer un compte"
- Note bas de page : "Ton numéro sera vérifié par SMS"

### `app/(auth)/onboarding/page.tsx`
Page d'onboarding :
- Titre "Bienvenue sur Likelemba 🇨🇬"
- Sous-titre "Complète ton profil pour commencer"
- `OnboardingForm`
- Barre de progression étapes (1/1)

---

## 26. PAGES — DASHBOARD

### `app/(dashboard)/dashboard/page.tsx`
Page dashboard principale — données chargées côté serveur :

**En-tête** : "Bonjour [prénom] 👋" + date du jour

**Cartes résumé (grille 2x2)** :
- Épargne totale (somme de tous les coffres actifs)
- Groupes actifs (count)
- Score de confiance (badge coloré)
- Prochaine cotisation (date + montant)

**Section "À payer"** : max 3 cotisations dues bientôt, triées par date

**Section "Mes groupes actifs"** : max 3 GroupCards

**Section "Notifications récentes"** : max 5 notifications

---

## 27. PAGES — TONTINE

### `app/(dashboard)/tontine/page.tsx`
- Boutons action en haut : "Créer un groupe" / "Rejoindre par code"
- Onglets : Actifs / En attente / Terminés
- Liste de `GroupCard` filtrée par onglet
- Empty state si aucun groupe

### `app/(dashboard)/tontine/create/page.tsx`
- Formulaire `CreateGroupForm` multi-étapes :
  - Étape 1 : Nom, description, montant, fréquence
  - Étape 2 : Nombre membres, taux amende, ordre des tours
  - Étape 3 : Visibilité (public/privé), score minimum, garantie
  - Résumé avant validation
- Calculer et afficher la garantie estimée pour position 1

### `app/(dashboard)/tontine/rejoindre/page.tsx`
- Input code invitation (8 caractères)
- Bouton "Vérifier le code"
- Preview du groupe si code valide (nom, montant, membres actuels/max, ta position, ta garantie)
- Bouton "Rejoindre le groupe"

### `app/(dashboard)/tontine/[id]/page.tsx`
Page principale d'un groupe — données serveur :

**En-tête** : nom, statut badge, montant/fréquence, code invitation (si créateur)

**Timeline des tours** : `TourTimeline` avec tous les membres

**Ma cotisation actuelle** : `CotisationCard` avec bouton payer

**Pool de solidarité** : `SolidarityPoolCard`

**Liste des membres** : `MemberRow` pour chacun

**Actions créateur** : Démarrer le groupe (si en_attente) / Signaler un fugitif

### `app/(dashboard)/tontine/[id]/membres/page.tsx`
Liste complète des membres avec statuts, garanties, amendes, bouton signaler

---

## 28. PAGES — MATCHING

### `app/(dashboard)/matching/page.tsx`
Page matching en 3 sections :

**Section 1 — Filtres** (`MatchingFilters`)
- Montant min/max (sliders)
- Fréquence (radio)
- Score minimum acceptable (slider)
- Bouton "Rechercher"

**Section 2 — Résultats**
- Liste de `MatchCard` triée par score de compatibilité
- Chaque carte affiche : score match (%), montant, fréquence, membres dispo, badge créateur
- Bouton "Rejoindre" → ouvre modale de confirmation avec frais (500 FCFA si plan Free)

**Section 3 — Demande automatique**
- Si aucun groupe trouvé, bouton "Laisser l'app me trouver un groupe"
- `createMatchingRequest` → état "En recherche active..."
- Badge Pro → matching prioritaire + sans frais

**Bannière Pro** (si plan Free) :
```
💎 Passez au plan Pro — 2 500 FCFA/mois
✓ Matching sans frais  ✓ Groupes illimités  ✓ Priorité de matching
[Passer au Pro]
```

---

## 29. PAGES — ÉPARGNE

### `app/(dashboard)/epargne/page.tsx`
- Bouton "Créer un coffre"
- Total épargne (somme tous coffres actifs)
- Section "Mes coffres personnels" → liste `VaultCard`
- Section "Coffres de groupe" → liste coffres de groupe
- Empty state encourageant si aucun coffre

### `app/(dashboard)/epargne/create/page.tsx`
Formulaire `CreateVaultForm` :
- Nom du coffre
- Objectif (optionnel, avec toggle)
- Date de déblocage (date picker, minimum +30 jours)
- **Avertissement bien visible** : "⚠️ Cette date est définitive. Aucun retrait ne sera possible avant cette date, même en cas d'urgence."
- Versements automatiques (toggle + fréquence + montant)
- Wallet de destination pour le retrait

### `app/(dashboard)/epargne/[id]/page.tsx`
Page coffre :

**En-tête** : nom, icône cadenas (rouge si actif, vert si débloqué)

**Countdown** : `VaultCountdown` — si non débloqué, gros countdown centré
Si débloqué : message "🎉 Ton coffre est prêt !"

**Progression** : `VaultProgressBar` (si objectif défini)

**Solde actuel** : affiché en grand

**⚠️ RÈGLE ABSOLUE dans le code** :
```tsx
{vault.status === 'debloque' ? (
  <WithdrawButton vault={vault} />
) : (
  <div className="text-slate-500 text-sm text-center">
    Retrait disponible le {formatDate(vault.unlock_date)}
  </div>
)}
// AUCUN autre bouton de retrait ne doit exister sur cette page
```

**Bouton "Ajouter de l'argent"** : toujours visible si status === 'actif'

**Historique des versements** : liste des `SavingsContribution`

---

## 30. PAGES — PROFIL & TRANSACTIONS

### `app/(dashboard)/profil/page.tsx`
- Avatar (modifiable via upload Supabase Storage)
- Nom complet (modifiable)
- Numéro de téléphone (non modifiable)
- Wallets MTN/Airtel (modifiables)
- Section "Mon score de confiance" : `TrustScoreBadge` large + explication des critères
- Section "Statistiques" : groupes complétés, en cours, échoués, incidents
- Section "Abonnement" : plan actuel + date expiration + bouton upgrade/renouveler

### `app/(dashboard)/paiements/page.tsx`
- Filtre par type (toutes / cotisations / versements / épargne / amendes)
- Liste des `TransactionRow` paginée
- Total entrant et sortant du mois

---

## 31. PAGE — ADMIN FONDATEUR

### `app/(dashboard)/admin/page.tsx`
**⚠️ Cette page doit être protégée : vérifier que l'utilisateur est le fondateur (ID hardcodé en env ou table admin)**

Dashboard revenus en temps réel :

**Cartes KPI** :
- Revenus totaux (all time)
- Revenus 30 derniers jours
- Revenus 7 derniers jours
- Nombre d'utilisateurs actifs
- Nombre de groupes actifs
- Valeur totale en épargne (float)

**Répartition par type** (graphe ou tableau) :
```
Commissions versements   : XXX FCFA  (XX%)
Frais matching           : XXX FCFA  (XX%)
Abonnements Pro          : XXX FCFA  (XX%)
Commission épargne       : XXX FCFA  (XX%)
─────────────────────────────────────────
TOTAL                    : XXX FCFA
```

**Dernières transactions de revenus** : tableau avec date, type, montant, source

**Actions admin** :
- Voir la liste des utilisateurs bannis
- Voir les litiges ouverts
- Voir les groupes suspendus

Données chargées via `getRevenueStats()` — server action commission.

---

## 32. REALTIME SUPABASE

### `components/shared/NotificationBell.tsx` — implémentation Realtime

```typescript
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/authStore'

export function NotificationBell() {
  const { user } = useAuthStore()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    // Charger le count initial
    supabase.from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .then(({ count }) => setUnreadCount(count ?? 0))

    // Écouter les nouvelles notifications en temps réel
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => setUnreadCount(prev => prev + 1)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  return (
    <button className="relative p-2">
      <Bell className="w-6 h-6 text-slate-400" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
```

### Realtime pour les cotisations d'un groupe
Dans `app/(dashboard)/tontine/[id]/page.tsx`, ajouter :
```typescript
// Écouter les mises à jour des contributions en temps réel
useEffect(() => {
  const supabase = createClient()
  const channel = supabase
    .channel(`contributions:${groupId}`)
    .on('postgres_changes', {
      event:  'UPDATE',
      schema: 'public',
      table:  'contributions',
      filter: `group_id=eq.${groupId}`,
    }, () => router.refresh())
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [groupId])
```

---

## 33. GÉNÉRATION PDF

### `lib/utils/pdf.ts`
```typescript
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function generateDisputeReport(data: {
  groupName:       string
  reportedUser:    string
  reportedBy:      string
  reason:          string
  evidence?:       string
  date:            string
  members:         Array<{ name: string; phone: string; status: string }>
}): void {
  const doc = new jsPDF()

  // En-tête
  doc.setFontSize(20)
  doc.setTextColor(16, 185, 129) // emerald
  doc.text('TONTIGO', 20, 20)

  doc.setFontSize(14)
  doc.setTextColor(0)
  doc.text('Rapport de litige', 20, 35)

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Généré le : ${data.date}`, 20, 45)
  doc.text(`Groupe : ${data.groupName}`, 20, 52)
  doc.text(`Membre signalé : ${data.reportedUser}`, 20, 59)
  doc.text(`Signalé par : ${data.reportedBy}`, 20, 66)

  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.text('Motif du litige :', 20, 80)
  doc.setFontSize(10)
  doc.setTextColor(60)
  const reasonLines = doc.splitTextToSize(data.reason, 170)
  doc.text(reasonLines, 20, 90)

  if (data.evidence) {
    const yPos = 90 + reasonLines.length * 7 + 10
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text('Preuves :', 20, yPos)
    doc.setFontSize(10)
    doc.setTextColor(60)
    const evidenceLines = doc.splitTextToSize(data.evidence, 170)
    doc.text(evidenceLines, 20, yPos + 10)
  }

  // Tableau des membres
  autoTable(doc, {
    startY: 160,
    head:   [['Membre', 'Téléphone', 'Statut']],
    body:   data.members.map(m => [m.name, m.phone, m.status]),
    theme:  'striped',
    headStyles: { fillColor: [16, 185, 129] },
  })

  doc.save(`litige-${data.groupName.replace(/\s+/g, '-')}-${data.date}.pdf`)
}
```

---

## 34. ORDRE DE DÉVELOPPEMENT

Exécute exactement dans cet ordre. Chaque étape = commit git.

```
1.  Setup projet (create-next-app + shadcn + dépendances)
2.  Variables d'environnement (.env.local)
3.  Types TypeScript (lib/types/index.ts)
4.  Configuration Supabase (client / server / service)
5.  Migration SQL → exécuter dans Supabase Dashboard → SQL Editor
6.  Middleware de protection des routes
7.  Stores Zustand (auth / tontine / épargne)
8.  Schémas de validation Zod
9.  Utilitaires métier (penalty / guarantee / commission / trust-score / matching / format)
10. Server Actions Auth → composants Auth → pages login/onboarding
11. Layout dashboard + Sidebar + MobileNav
12. Server Actions Tontine → composants Tontine → pages tontine
13. Server Actions Commission + Matching → composants Matching → page matching
14. Server Actions Épargne → composants Épargne → pages épargne
15. Server Actions Paiements (MTN/Airtel)
16. PaymentModal avec affichage commission
17. Webhooks MTN/Airtel
18. Cron jobs (amendes, déblocage, rappels)
19. Realtime Supabase (notifications, cotisations)
20. Page profil + transactions
21. Page admin fondateur (revenus)
22. Génération PDF litiges
23. Tests end-to-end + corrections
24. Optimisation (lazy loading, Suspense, loading.tsx)
25. Déploiement Vercel + configuration crons
```

---

## 35. RÈGLES ABSOLUES

Ces règles ne peuvent jamais être violées :

1. **TypeScript strict** — `"strict": true` dans tsconfig. Aucun `any` implicite.

2. **Server Actions pour toutes les mutations** — Jamais de mutation via API route client.

3. **Service Role exclusivement côté serveur** — `serviceClient` uniquement dans Server Actions, Cron Jobs et Webhooks. Jamais importé dans un composant client.

4. **RLS activé sur toutes les tables** — Chaque table a ses politiques. Aucune exception.

5. **Zod avant toute insertion** — `schema.parse(input)` avant chaque appel Supabase en insertion/update.

6. **La date de déblocage d'un coffre est IMMUABLE** — Aucune action, aucune route, aucun bouton ne peut modifier `unlock_date` après la création du coffre.

7. **Le retrait d'un coffre est bloqué par double vérification** :
   - Côté client : bouton "Retirer" absent si `status !== 'debloque'`
   - Côté serveur (withdrawFromVault) : vérification indépendante de la date ET du status avant tout traitement

8. **L'élimination est automatique** via la fonction PostgreSQL `apply_daily_penalties()` — aucune intervention manuelle.

9. **Le bannissement est permanent** — Numéro ajouté à `phone_blacklist` + `is_banned = true` + `trust_score = 0`.

10. **Toutes les transactions sont enregistrées** dans la table `transactions` — sans exception, y compris les amendes.

11. **Toutes les commissions sont enregistrées** dans `platform_revenues` via `recordRevenue()`.

12. **Les commissions sont prélevées automatiquement** dans `processPayout()` et `withdrawFromVault()` — jamais manuellement.

13. **La page `/admin` est protégée** — Vérifier l'identité du fondateur avant d'afficher quoi que ce soit.

14. **Chaque paiement affiche la commission** dans le `PaymentModal` avant confirmation — l'utilisateur voit toujours le montant net qu'il reçoit.

---

*🇨🇬 Likelemba — La tontine digitale de confiance au Congo Brazzaville*
*Stack: Next.js 15 · TypeScript · Supabase · TailwindCSS · shadcn/ui · Zustand · Zod*
