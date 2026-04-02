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
    
    const res = await joinGroupByCode(data.invite_code.toUpperCase())
    
    if (res.error) {
      setErrorLine(res.error)
      setIsLoading(false)
    } else if (res.data) {
      router.push(`/tontine/${res.data.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code" className="flex items-center gap-2">
           <KeyRound className="w-4 h-4" /> Code d'invitation (8 caractères)
        </Label>
        <Input 
          id="code" 
          placeholder="Ex: A1B2C3D4" 
          className="uppercase tracking-widest text-center"
          maxLength={8}
          {...register('invite_code')} 
        />
        {errors.invite_code && <p className="text-xs text-red-500">{errors.invite_code.message}</p>}
        {errorLine && <p className="text-xs text-red-500">{errorLine}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Rejoindre
      </Button>
    </form>
  )
}
