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
  date_of_birth: string | null
  quartier: string | null
  profession: string | null
  trust_score: number
  status: UserStatus
  badge: UserBadge
  wallet_mtn: string | null
  wallet_airtel: string | null
  total_groups_completed: number
  total_groups_failed: number
  is_banned: boolean
  banned_until: string | null
  onboarding_done: boolean
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
