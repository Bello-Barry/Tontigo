'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { otpSchema, type OtpInput } from '@/lib/validations/auth.schema'
import { verifyOtp } from '@/lib/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export function OtpForm({ phone, onBack }: { phone: string, onBack: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [errorLine, setErrorLine] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<OtpInput>({
    resolver: zodResolver(otpSchema)
  })

  const onSubmit = async (data: OtpInput) => {
    setIsLoading(true)
    setErrorLine('')
    const res = await verifyOtp(phone, data.token)
    if (res.error) {
      setErrorLine(res.error)
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="token">Code SMS envoyé au {phone}</Label>
        <Input 
          id="token" 
          placeholder="123456" 
          autoFocus
          className="text-center text-lg tracking-widest"
          maxLength={6}
          {...register('token')} 
        />
        {errors.token && <p className="text-sm text-red-500">{errors.token.message}</p>}
        {errorLine && <p className="text-sm text-red-500">{errorLine}</p>}
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
          Retour
        </Button>
        <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 font-bold" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Vérifier
        </Button>
      </div>
    </form>
  )
}
