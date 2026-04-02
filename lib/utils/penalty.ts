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
