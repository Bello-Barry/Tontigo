-- ── group_messages ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_group_messages_group_created
  ON public.group_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_messages_user
  ON public.group_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_not_deleted
  ON public.group_messages(group_id, is_deleted, created_at DESC)
  WHERE is_deleted = FALSE;

-- ── contributions ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contributions_due_status
  ON public.contributions(due_date, status);
CREATE INDEX IF NOT EXISTS idx_contributions_membership
  ON public.contributions(membership_id, status);
CREATE INDEX IF NOT EXISTS idx_contributions_group_status
  ON public.contributions(group_id, status);

-- ── memberships ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_memberships_user
  ON public.memberships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_memberships_group
  ON public.memberships(group_id, status);
CREATE INDEX IF NOT EXISTS idx_memberships_turn
  ON public.memberships(group_id, turn_position);

-- ── tontine_groups ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_groups_public_status
  ON public.tontine_groups(is_public, status, min_trust_score)
  WHERE is_public = TRUE AND status = 'en_attente';
CREATE INDEX IF NOT EXISTS idx_groups_creator
  ON public.tontine_groups(creator_id, status);

-- ── transactions ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON public.transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type
  ON public.transactions(user_id, type, created_at DESC);

-- ── notifications ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, is_read, created_at DESC)
  WHERE is_read = FALSE;

-- ── savings_vaults ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_savings_vaults_user_status
  ON public.savings_vaults(user_id, status);
CREATE INDEX IF NOT EXISTS idx_savings_vaults_unlock
  ON public.savings_vaults(unlock_date, status)
  WHERE status = 'actif';

-- ── mtn_transactions ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mtn_tx_reference
  ON public.mtn_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_mtn_tx_status_pending
  ON public.mtn_transactions(status, created_at)
  WHERE status = 'PENDING';

-- ── users ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_trust_score
  ON public.users(trust_score, status)
  WHERE status = 'actif';
CREATE INDEX IF NOT EXISTS idx_users_phone
  ON public.users(phone);
