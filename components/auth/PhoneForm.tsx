'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { phoneSchema, type PhoneInput } from '@/lib/validations/auth.schema'
import { sendOtp } from '@/lib/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export function PhoneForm({ onSuccess }: { onSuccess: (phone: string) => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [errorLine, setErrorLine] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<PhoneInput>({
    resolver: zodResolver(phoneSchema)
  })

  const onSubmit = async (data: PhoneInput) => {
    setIsLoading(true)
    setErrorLine('')
    
    // Auto format
    const formattedPhone = data.phone.startsWith('242') ? `+${data.phone}` : 
                           data.phone.startsWith('+242') ? data.phone : `+242${data.phone}`

    const res = await sendOtp(formattedPhone)
    
    if (res.error) {
      setErrorLine(res.error)
      setIsLoading(false)
    } else {
      onSuccess(formattedPhone)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">Numéro de téléphone</Label>
        <div className="flex">
          <div className="flex items-center justify-center px-3 border border-r-0 border-input bg-muted rounded-l-md text-sm text-muted-foreground">
            +242
          </div>
          <Input 
            id="phone" 
            placeholder="06xxxxxxx ou 05xxxxxxx" 
            className="rounded-l-none"
            {...register('phone')} 
          />
        </div>
        {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
        {errorLine && <p className="text-sm text-red-500">{errorLine}</p>}
      </div>

      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 font-bold" disabled={isLoading}>
        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Recevoir le code SMS
      </Button>
    </form>
  )
}
