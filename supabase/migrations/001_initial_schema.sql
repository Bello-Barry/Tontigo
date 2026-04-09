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