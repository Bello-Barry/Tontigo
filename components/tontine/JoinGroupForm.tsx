'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { joinGroupSchema, type JoinGroupInput } from '@/lib/validations/tontine.schema'
import { joinGroupByCode } from '@/lib/actions/tontine.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, KeyRound } from 'lucide-react'

export function JoinGroupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorLine, setErrorLine] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<JoinGroupInput>({
    resolver: zodResolver(joinGroupSchema)
  })

  const onSubmit = async (data: JoinGroupInput) => {
    setIsLoading(true)
    setErrorLine('')
    
    // On envoie le code tel quel, l'action gère l'insensibilité à la casse
    const res = await joinGroupByCode(data.invite_code)
    
    if (res.error) {
      setErrorLine(res.error)
      setIsLoading(false)
    } else if (res.data) {
      router.push(`/tontine/${res.data.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-1 animate-in fade-in zoom-in-95 duration-500">
      <div className="space-y-3">
        <Label htmlFor="code" className="flex items-center gap-2 text-slate-300 font-semibold tracking-wide">
           <KeyRound className="w-4 h-4 text-emerald-400" /> CODE D'INVITATION
        </Label>
        <div className="relative group">
          <Input 
            id="code" 
            placeholder="A1B2C3D4" 
            className="h-14 uppercase tracking-[0.3em] text-center text-xl font-black bg-slate-900/50 border-slate-800 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all rounded-2xl placeholder:text-slate-700"
            maxLength={8}
            {...register('invite_code')} 
          />
          <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
        
        {errors.invite_code && (
          <p className="text-xs text-red-400 flex items-center gap-1.5 px-2">
            <span className="w-1 h-1 rounded-full bg-red-400" />
            {errors.invite_code.message}
          </p>
        )}
        {errorLine && (
          <p className="text-xs text-red-400 flex items-center gap-1.5 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
            {errorLine}
          </p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-lg rounded-2xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50" 
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Validation...
          </div>
        ) : (
          "Rejoindre le groupe"
        )}
      </Button>
      
      <p className="text-[10px] text-center text-slate-500 uppercase tracking-widest leading-relaxed">
        En rejoignant, tu t'engages à respecter <br /> le cycle de cotisations du groupe.
      </p>
    </form>
  )
}

