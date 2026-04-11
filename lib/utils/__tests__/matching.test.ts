import { describe, it, expect } from 'vitest'
import { calculateMatchScore, sortGroupsByMatchScore } from '../matching'
import type { UserProfile, TontineGroup } from '@/lib/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeUser(trust_score: number, total_groups_completed: number): Pick<UserProfile, 'trust_score' | 'total_groups_completed'> {
  return { trust_score, total_groups_completed }
}

function makeGroup(overrides: Partial<TontineGroup> = {}): TontineGroup {
  return {
    id:               'group-1',
    name:             'Test Group',
    description:      null,
    creator_id:       'user-1',
    amount:           5000,
    frequency:        'mensuel',
    max_members:      10,
    current_members:  3,
    min_trust_score:  50,
    status:           'actif',
    current_turn:     1,
    invite_code:      'ABCD1234',
    order_type:       'tirage_au_sort',
    is_public:        true,
    penalty_rate:     2,
    solidarity_rate:  0.05,
    requires_guarantee: false,
    started_at:       null,
    ends_at:          null,
    created_at:       new Date().toISOString(),
    updated_at:       new Date().toISOString(),
    ...overrides,
  } as TontineGroup
}

// ---------------------------------------------------------------------------
// calculateMatchScore
// ---------------------------------------------------------------------------
describe('calculateMatchScore', () => {
  it('gives 40 pts when trust_score meets group minimum', () => {
    const score = calculateMatchScore(makeUser(60, 0), makeGroup({ min_trust_score: 50 }))
    // 40 (threshold) + 0 (groups) + 20 (score 60-79) = 60
    expect(score).toBe(60)
  })

  it('gives 0 pts base when trust_score is below minimum', () => {
    const score = calculateMatchScore(makeUser(40, 0), makeGroup({ min_trust_score: 50 }))
    // 0 (no threshold) + 0 (groups) + 10 (score 40-59) = 10
    expect(score).toBe(10)
  })

  it('caps completed-groups bonus at 30', () => {
    // 10 groups × 5 = 50 → capped at 30
    const score = calculateMatchScore(makeUser(90, 10), makeGroup({ min_trust_score: 50 }))
    // 40 + 30 (capped) + 30 (≥80) = 100
    expect(score).toBe(100)
  })

  it('caps total score at 100', () => {
    const score = calculateMatchScore(makeUser(95, 100), makeGroup({ min_trust_score: 50 }))
    expect(score).toBe(100)
  })

  it('awards 30 bonus pts for trust_score ≥ 80', () => {
    const score = calculateMatchScore(makeUser(80, 0), makeGroup({ min_trust_score: 50 }))
    // 40 + 0 + 30 = 70
    expect(score).toBe(70)
  })

  it('awards 20 bonus pts for trust_score ≥ 60', () => {
    const score = calculateMatchScore(makeUser(70, 0), makeGroup({ min_trust_score: 50 }))
    // 40 + 0 + 20 = 60
    expect(score).toBe(60)
  })

  it('awards 10 bonus pts for trust_score ≥ 40', () => {
    const score = calculateMatchScore(makeUser(45, 0), makeGroup({ min_trust_score: 40 }))
    // 40 + 0 + 10 = 50
    expect(score).toBe(50)
  })
})

// ---------------------------------------------------------------------------
// sortGroupsByMatchScore
// ---------------------------------------------------------------------------
describe('sortGroupsByMatchScore', () => {
  it('filters out groups with match_score < 40', () => {
    const user = { trust_score: 30, total_groups_completed: 0 } as UserProfile
    const group = makeGroup({ min_trust_score: 80 })
    const result = sortGroupsByMatchScore([group], user)
    // score = 0 (no threshold) + 0 (groups) + 0 (score <40) = 0 → filtered out
    expect(result).toHaveLength(0)
  })

  it('sorts groups by descending match_score', () => {
    // user trust=80, completed=4 → bonus: 40(≥min) + 20(×5, capped at 30→20) + 30(≥80)
    // lowGroup:  min=80 → 40+20+30=90
    // highGroup: min=40 → 40+20+30=90  same score! need different min
    // Use user trust=60 so score band bonus is 20
    // groupA min=50 → user qualifies: 40+20+20 = 80
    // groupB min=70 → user (60) below: 0+20+20 = 40
    const user = { trust_score: 60, total_groups_completed: 4 } as UserProfile
    const groupA = makeGroup({ id: 'groupA', min_trust_score: 50 }) // score=80
    const groupB = makeGroup({ id: 'groupB', min_trust_score: 70 }) // score=40
    const result = sortGroupsByMatchScore([groupB, groupA], user)
    expect(result[0].group_id).toBe('groupA')
    expect(result[1].group_id).toBe('groupB')
  })

  it('maps group fields correctly onto MatchingProfile', () => {
    const user = { trust_score: 60, total_groups_completed: 2 } as UserProfile
    const group = makeGroup({ id: 'g1', name: 'Tontine A', amount: 10000 })
    const [profile] = sortGroupsByMatchScore([group], user)
    expect(profile.group_id).toBe('g1')
    expect(profile.group_name).toBe('Tontine A')
    expect(profile.amount).toBe(10000)
  })
})
