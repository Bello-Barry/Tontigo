-- Fix: Corriger la recursion infinie dans la RLS policy de memberships
-- Le problème: "Voir les membres de ses groupes" utilise une sous-requête SELECT sur memberships
-- ce qui crée une boucle infinie à cause de la même policy.

-- Supprimer l'ancienne policy problématique
DROP POLICY IF EXISTS "Voir les membres de ses groupes" ON public.memberships;

-- Reprendre la policy simple : chaque utilisateur voit ses propres memberships
CREATE POLICY "Voir ses propres memberships" ON public.memberships FOR SELECT
  USING (auth.uid() = user_id);
