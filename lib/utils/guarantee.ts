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
