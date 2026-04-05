'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { createGroup } from '@/lib/actions/tontine.actions'
import { createGroupSchema, type CreateGroupInput } from '@/lib/validations/tontine.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatFCFA } from '@/lib/utils/format'
import { calculateGuarantee } from '@/lib/utils/guarantee'

export default function CreateGroupPage() {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema) as any,
    defaultValues: {
      name:               '',
      description:        '',
      amount:             0,
      frequency:          'mensuel',
      max_members:        2,
      penalty_rate:       5,
      order_type:         'tirage_au_sort',
      is_public:          false,
      min_trust_score:    30,
      requires_guarantee: true,
    },
  })

  const amount     = watch('amount')     ?? 0
  const maxMembers = watch('max_members') ?? 2
  const requiresGuarantee = watch('requires_guarantee')

  const estimatedGuarantee = requiresGuarantee
    ? calculateGuarantee(1, maxMembers, amount)
    : 0

  const onSubmit = async (data: CreateGroupInput) => {
    setLoading(true)
    try {
      const result = await createGroup(data)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('✅ Groupe créé avec succès !')

      // Attendre 500ms pour laisser Supabase propager le membership
      // avant de naviguer vers la page du groupe
      await new Promise(resolve => setTimeout(resolve, 500))

      router.push(`/tontine/${result.data!.id}`)
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
        <Link href="/tontine">
          <button className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Créer un groupe</h1>
          <p className="text-slate-400 text-sm">Configure ta tontine</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Nom */}
        <div className="space-y-2">
          <Label className="text-slate-300">Nom du groupe *</Label>
          <Input
            placeholder="Ex : Tontine du quartier Bacongo"
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
            {...register('name')}
          />
          {errors.name && <p className="text-red-400 text-sm">{errors.name.message}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-slate-300">Description (optionnel)</Label>
          <Input
            placeholder="Décris ton groupe..."
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
            {...register('description')}
          />
        </div>

        {/* Montant */}
        <div className="space-y-2">
          <Label className="text-slate-300">Montant de cotisation (FCFA) *</Label>
          <Input
            type="number"
            placeholder="Ex : 25000"
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
            {...register('amount', { valueAsNumber: true })}
          />
          {errors.amount && <p className="text-red-400 text-sm">{errors.amount.message}</p>}
        </div>

        {/* Fréquence */}
        <div className="space-y-2">
          <Label className="text-slate-300">Fréquence *</Label>
          <Select onValueChange={(val) => setValue('frequency', val as any)}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-12">
              <SelectValue placeholder="Choisir la fréquence..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="quotidien"    className="text-white">Quotidien</SelectItem>
              <SelectItem value="hebdomadaire" className="text-white">Hebdomadaire</SelectItem>
              <SelectItem value="mensuel"      className="text-white">Mensuel</SelectItem>
            </SelectContent>
          </Select>
          {errors.frequency && <p className="text-red-400 text-sm">{errors.frequency.message}</p>}
        </div>

        {/* Nombre de membres */}
        <div className="space-y-2">
          <Label className="text-slate-300">Nombre de membres *</Label>
          <Input
            type="number"
            min={2}
            max={50}
            placeholder="Ex : 10"
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
            {...register('max_members', { valueAsNumber: true })}
          />
          {errors.max_members && <p className="text-red-400 text-sm">{errors.max_members.message}</p>}
        </div>

        {/* Taux d'amende */}
        <div className="space-y-2">
          <Label className="text-slate-300">
            Taux d'amende par jour de retard : <span className="text-emerald-400">{watch('penalty_rate')}%</span>
          </Label>
          <Input
            type="number"
            step="0.5"
            min={0.5}
            max={20}
            className="bg-slate-800 border-slate-700 text-white h-12"
            {...register('penalty_rate', { valueAsNumber: true })}
          />
          {errors.penalty_rate && <p className="text-red-400 text-sm">{errors.penalty_rate.message}</p>}
        </div>

        {/* Ordre des tours */}
        <div className="space-y-2">
          <Label className="text-slate-300">Ordre des tours *</Label>
          <Select onValueChange={(val) => setValue('order_type', val as any)} defaultValue="tirage_au_sort">
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="tirage_au_sort" className="text-white">Tirage au sort</SelectItem>
              <SelectItem value="encheres"        className="text-white">Enchères</SelectItem>
              <SelectItem value="manuel"          className="text-white">Manuel (créateur décide)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Groupe public */}
        <div className="flex items-center justify-between glass-card p-4">
          <div>
            <p className="text-white text-sm font-medium">Groupe public</p>
            <p className="text-slate-400 text-xs mt-0.5">Visible dans le matching pour les inconnus</p>
          </div>
          <Switch
            onCheckedChange={(val) => setValue('is_public', val)}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>

        {/* Score minimum */}
        <div className="space-y-2">
          <Label className="text-slate-300">
            Score de confiance minimum : <span className="text-emerald-400">{watch('min_trust_score')}</span>
          </Label>
          <Input
            type="number"
            min={0}
            max={100}
            className="bg-slate-800 border-slate-700 text-white h-12"
            {...register('min_trust_score', { valueAsNumber: true })}
          />
        </div>

        {/* Garantie */}
        <div className="flex items-center justify-between glass-card p-4">
          <div>
            <p className="text-white text-sm font-medium">Garantie obligatoire</p>
            <p className="text-slate-400 text-xs mt-0.5">Caution proportionnelle au rang dans le tour</p>
          </div>
          <Switch
            defaultChecked
            onCheckedChange={(val) => setValue('requires_guarantee', val)}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>

        {/* Résumé garantie */}
        {requiresGuarantee && amount > 0 && maxMembers >= 2 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-1">
            <p className="text-amber-300 text-sm font-medium">Garantie pour la position 1 (toi)</p>
            <p className="text-amber-400 text-xl font-bold">{formatFCFA(estimatedGuarantee)}</p>
            <p className="text-amber-300/70 text-xs">
              La garantie diminue à chaque position suivante jusqu'à 0 pour le dernier.
            </p>
          </div>
        )}

        {/* Bouton soumettre */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Création en cours...</>
            : 'Créer le groupe'
          }
        </Button>
      </form>
    </div>
  )
}
