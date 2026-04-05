'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { createVault } from '@/lib/actions/epargne.actions'
import { createVaultSchema, type CreateVaultInput } from '@/lib/validations/epargne.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { addDays, format } from 'date-fns'

export default function CreateVaultPage() {
  const router  = useRouter()
  const [loading, setLoading]   = useState(false)
  const [hasTarget, setHasTarget] = useState(false)
  const [hasAuto, setHasAuto]   = useState(false)

  const minDate = format(addDays(new Date(), 30), 'yyyy-MM-dd')

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateVaultInput>({
    resolver: zodResolver(createVaultSchema),
    defaultValues: {
      unlock_date: minDate
    }
  })

  const onSubmit = async (data: CreateVaultInput) => {
    setLoading(true)
    try {
      const result = await createVault(data)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('🔒 Coffre créé ! Ton épargne est sécurisée.')
      router.push(`/epargne/${result.data!.id}`)
    } catch {
      toast.error('Une erreur inattendue est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Link href="/epargne">
          <button className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Nouveau coffre</h1>
          <p className="text-slate-400 text-sm">Configure ton épargne bloquée</p>
        </div>
      </div>

      {/* Avertissement date immuable */}
      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-amber-300 text-sm">
          La date de déblocage est <strong>définitive</strong>. Aucun retrait n'est possible avant cette date, même en cas d'urgence.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Nom */}
        <div className="space-y-2">
          <Label className="text-slate-300">Nom du coffre *</Label>
          <Input
            placeholder="Ex : Voiture 2026, Rentrée scolaire..."
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
            {...register('name')}
          />
          {errors.name && <p className="text-red-400 text-sm">{errors.name.message}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-slate-300">Description (optionnel)</Label>
          <Input
            placeholder="Pourquoi tu épargnes..."
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
            {...register('description')}
          />
        </div>

        {/* Date de déblocage */}
        <div className="space-y-2">
          <Label className="text-slate-300">Date de déblocage * (minimum 30 jours)</Label>
          <Input
            type="date"
            min={minDate}
            className="bg-slate-800 border-slate-700 text-white h-12"
            {...register('unlock_date')}
          />
          {errors.unlock_date && <p className="text-red-400 text-sm">{errors.unlock_date.message}</p>}
        </div>

        {/* Objectif optionnel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between glass-card p-4">
            <div>
              <p className="text-white text-sm font-medium">Définir un objectif</p>
              <p className="text-slate-400 text-xs mt-0.5">Montant cible à atteindre</p>
            </div>
            <Switch
              onCheckedChange={setHasTarget}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
          {hasTarget && (
            <Input
              type="number"
              placeholder="Ex : 500000"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
              {...register('target_amount', { valueAsNumber: true })}
            />
          )}
        </div>

        {/* Versements automatiques */}
        <div className="space-y-3">
          <div className="flex items-center justify-between glass-card p-4">
            <div>
              <p className="text-white text-sm font-medium">Versements automatiques</p>
              <p className="text-slate-400 text-xs mt-0.5">Programmer des versements réguliers</p>
            </div>
            <Switch
              onCheckedChange={setHasAuto}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
          {hasAuto && (
            <div className="space-y-3">
              <Input
                type="number"
                placeholder="Montant par versement (FCFA)"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
                {...register('auto_amount', { valueAsNumber: true })}
              />
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Création...</>
            : '🔒 Créer le coffre'
          }
        </Button>
      </form>
    </div>
  )
}
