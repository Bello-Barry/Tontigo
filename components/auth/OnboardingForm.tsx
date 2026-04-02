'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { onboardingSchema, type OnboardingInput } from '@/lib/validations/auth.schema'
import { completeOnboarding } from '@/lib/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export function OnboardingForm({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [errorLine, setErrorLine] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema)
  })

  const onSubmit = async (data: OnboardingInput) => {
    setIsLoading(true)
    setErrorLine('')
    const res = await completeOnboarding(userId, data)
    if (res.error) {
      setErrorLine(res.error)
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Nom complet (obligatoire)</Label>
        <Input id="full_name" placeholder="Ex: Jean Dupont" {...register('full_name')} />
        {errors.full_name && <p className="text-sm text-red-500">{errors.full_name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="wallet_mtn">Compte MTN MoMo (optionnel)</Label>
        <Input id="wallet_mtn" placeholder="Ex: 06xxxxxxx" {...register('wallet_mtn')} />
        {errors.wallet_mtn && <p className="text-sm text-red-500">{errors.wallet_mtn.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="wallet_airtel">Compte Airtel Money (optionnel)</Label>
        <Input id="wallet_airtel" placeholder="Ex: 05xxxxxxx" {...register('wallet_airtel')} />
        {errors.wallet_airtel && <p className="text-sm text-red-500">{errors.wallet_airtel.message}</p>}
      </div>

      {errorLine && <p className="text-sm text-red-500">{errorLine}</p>}

      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 font-bold" disabled={isLoading}>
        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Commencer à utiliser Tontigo
      </Button>
    </form>
  )
}
