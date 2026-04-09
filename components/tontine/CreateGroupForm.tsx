'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createGroupSchema, type CreateGroupInput } from '@/lib/validations/tontine.schema'
import { createGroup } from '@/lib/actions/tontine.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ShieldAlert } from 'lucide-react'

export function CreateGroupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorLine, setErrorLine] = useState('')

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      frequency: 'mensuel',
      order_type: 'tirage_au_sort',
      is_public: false,
      requires_guarantee: true,
      min_trust_score: 30,
      penalty_rate: 2,
    }
  })

  // Surveillance pour MAJ de l'UI
  const watchAmount = watch('amount') || 0
  const watchMembers = watch('max_members') || 2
  const amountToReceive = watchAmount * watchMembers

  const onSubmit = async (data: CreateGroupInput) => {
    setIsLoading(true)
    setErrorLine('')
    
    // Assurer que les nombres sont bien parsés
    const payload = {
      ...data,
      amount: Number(data.amount),
      max_members: Number(data.max_members),
      penalty_rate: Number(data.penalty_rate),
      min_trust_score: Number(data.min_trust_score),
    }

    const res = await createGroup(payload)
    
    if (res.error) {
      setErrorLine(res.error)
      setIsLoading(false)
    } else if (res.data) {
      router.push(`/tontine/${res.data.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Nom du groupe</Label>
          <Input placeholder="Ex: Tontine Famille" {...register('name')} />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Montant de cotisation (FCFA)</Label>
          <Input type="number" placeholder="Ex: 5000" {...register('amount', { valueAsNumber: true })} />
          {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Nombre max. de participants</Label>
          <Input type="number" {...register('max_members', { valueAsNumber: true })} />
          {errors.max_members && <p className="text-xs text-red-500">{errors.max_members.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Fréquence</Label>
          <Select onValueChange={(v: any) => setValue('frequency', v)} defaultValue="mensuel">
             <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
             <SelectContent>
               <SelectItem value="quotidien">Quotidien (Fast-tontine)</SelectItem>
               <SelectItem value="hebdomadaire">Hebdomadaire</SelectItem>
               <SelectItem value="mensuel">Mensuel</SelectItem>
             </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-4 bg-muted/30 border rounded-lg flex items-start gap-4">
        <div className="p-2 bg-primary/10 rounded-full text-primary mt-1">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-sm">Garantie anti-fuite Likelemba</h4>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
             Pour protéger le groupe, Likelemba peut exiger une garantie bloquée aux membres recevant la cagnotte en premier.
             La garantie est restituée à la fin de la tontine.
          </p>
          <div className="flex items-center space-x-2">
             <Switch 
               id="guarantee" 
               checked={watch('requires_guarantee')} 
               onCheckedChange={(c) => setValue('requires_guarantee', c)} 
             />
             <Label htmlFor="guarantee" className="text-sm cursor-pointer">Activer la garantie (Recommandé)</Label>
          </div>
        </div>
      </div>

      {amountToReceive > 0 && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
           <span className="text-sm text-green-600 block">Cagnotte estimée par tour</span>
           <span className="text-2xl font-bold text-green-700">{new Intl.NumberFormat('fr-CG').format(amountToReceive)} FCFA</span>
           <p className="text-xs text-muted-foreground mt-1 opacity-70">-1.5% frais de sécurisation Likelemba appliqués lors du versement</p>
        </div>
      )}

      {errorLine && <p className="text-sm text-red-500 text-center bg-red-500/10 p-2 rounded">{errorLine}</p>}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Créer la tontine
      </Button>
    </form>
  )
}
