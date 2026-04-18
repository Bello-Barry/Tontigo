-- Portefeuille virtuel de chaque utilisateur
-- Centralise les cagnottes reçues et l'épargne disponible
CREATE TABLE IF NOT EXISTS public.virtual_wallet (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- Solde des cagnottes reçues (tontine)
  tontine_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- Solde de l'épargne débloquée disponible
  savings_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- Solde total disponible pour retrait
  total_balance   NUMERIC(12,2) GENERATED ALWAYS AS (tontine_balance + savings_balance) STORED,
  -- Historique des mouvements
  last_tontine_credit_at TIMESTAMPTZ,
  last_savings_credit_at TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Créer automatiquement un portefeuille lors de la création du profil
CREATE OR REPLACE FUNCTION public.create_virtual_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.virtual_wallet (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_wallet
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.create_virtual_wallet();

-- Créer les portefeuilles pour les utilisateurs existants
INSERT INTO public.virtual_wallet (user_id)
SELECT id FROM public.users
ON CONFLICT (user_id) DO NOTHING;

-- Historique des mouvements du portefeuille
CREATE TABLE IF NOT EXISTS public.wallet_movements (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id),
  type         TEXT NOT NULL,
  -- 'tontine_credit'  → cagnotte reçue d'une tontine
  -- 'savings_credit'  → épargne débloquée disponible
  -- 'withdrawal_mtn'  → retrait vers MTN MoMo
  -- 'withdrawal_airtel' → retrait vers Airtel Money
  amount       NUMERIC(12,2) NOT NULL,
  balance_before NUMERIC(12,2) NOT NULL,
  balance_after  NUMERIC(12,2) NOT NULL,
  reference_id UUID,           -- payout.id ou vault.id
  reference_type TEXT,         -- 'payout' ou 'vault'
  description  TEXT,
  wallet_used  TEXT,           -- 'mtn' ou 'airtel' pour les retraits
  external_ref TEXT,           -- Référence MTN MoMo
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_movements_user
  ON public.wallet_movements(user_id, created_at DESC);

-- RLS
ALTER TABLE public.virtual_wallet   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voir son portefeuille"
  ON public.virtual_wallet FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Voir ses mouvements"
  ON public.wallet_movements FOR SELECT USING (auth.uid() = user_id);
