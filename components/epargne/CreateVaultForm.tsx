'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createVaultSchema, type CreateVaultInput } from '@/lib/validations/epargne.schema'
import { createVault } from '@/lib/actions/epargne.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, AlertCircle } from 'lucide-react'
import { addDays, format } from 'date-fns'

export function CreateVaultForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorLine, setErrorLine] = useState('')

  const minDate = format(addDays(new Date(), 30), 'yyyy-MM-dd')

  const { register, handleSubmit, formState: { errors } } = useForm<CreateVaultInput>({
    resolver: zodResolver(createVaultSchema),
    defaultValues: {
      unlock_date: minDate
    }
  })

  const onSubmit = async (data: CreateVaultInput) => {
    setIsLoading(true)
    setErrorLine('')
    
    // Parse
    const payload = {
      ...data,
      target_amount: data.target_amount ? Number(data.target_amount) : undefined,
    }

    const res = await createVault(payload)
    if (res.error) {
      setErrorLine(res.error)
      setIsLoading(false)
    } else if (res.data) {
      router.push(`/epargne/${res.data.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>Nom du projet d'épargne</Label>
        <Input placeholder="Ex: Maison, Vacances, Secours..." {...register('name')} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-orange-600">Règle Immuable Likelemba</h4>
            <p className="text-xs text-orange-700 mt-1">Vous ne pourrez retirer aucun fond (même partiel) avant la date fixée ci-dessous. Même l'assistance Likelemba ne peut contourner cette règle. Minimum 30 jours.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Date de déblocage stricte</Label>
          <Input type="date" min={minDate} {...register('unlock_date')} />
          {errors.unlock_date && <p className="text-xs text-red-500">{errors.unlock_date.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Objectif financier (FCFA) - Optionnel</Label>
        <Input type="number" placeholder="Ex: 1000000" {...register('target_amount')} />
      </div>

      {errorLine && <p className="text-sm text-red-500 text-center bg-red-500/10 p-2 rounded">{errorLine}</p>}

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Verrouiller mon épargne
      </Button>
    </form>
  )
}
