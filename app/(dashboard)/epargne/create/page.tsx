import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateVaultForm } from '@/components/epargne/CreateVaultForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function CreateEpargnePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/epargne">
        <Button variant="ghost" size="sm" className="mb-2 -ml-3 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
      </Link>
      
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-2xl">Ouvrir un coffre-fort</CardTitle>
          <CardDescription>
            Verrouillez votre épargne jusqu'à une date précise pour garantir la réussite de vos projets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateVaultForm />
        </CardContent>
      </Card>
    </div>
  )
}
