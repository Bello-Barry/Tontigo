'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { phoneSchema, type PhoneInput } from '@/lib/validations/auth.schema'
import { checkPhoneExists } from '@/lib/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

interface PhoneFormProps {
  onNext: (phone: string, isExistingUser: boolean) => void
}

export function PhoneForm({ onNext }: PhoneFormProps) {
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<PhoneInput>({
    resolver: zodResolver(phoneSchema),
  })

  const onSubmit = async (data: PhoneInput) => {
    setLoading(true)
    try {
      const exists = await checkPhoneExists(data.phone)
      onNext(data.phone, exists)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-slate-300">
          Numéro de téléphone
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm select-none">
            🇨🇬 +242
          </span>
          <Input
            id="phone"
            type="tel"
            placeholder="06 123 45 678"
            className="pl-20 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
            {...register('phone')}
          />
        </div>
        {errors.phone && (
          <p className="text-red-400 text-sm">{errors.phone.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
      >
        {loading ? 'Vérification...' : 'Continuer'}
      </Button>

      <p className="text-center text-slate-500 text-xs">
        Aucun SMS envoyé. Ton numéro est ton identifiant.
      </p>
    </form>
  )
}
