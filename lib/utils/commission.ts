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
