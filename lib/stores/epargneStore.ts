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
