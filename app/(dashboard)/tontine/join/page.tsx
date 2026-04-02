import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { JoinGroupForm } from '@/components/tontine/JoinGroupForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function JoinTontinePage() {
  return (
    <div className="max-w-md mx-auto space-y-6 mt-10">
      <Link href="/tontine">
        <Button variant="ghost" size="sm" className="mb-2 -ml-3 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
      </Link>
      
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-2xl">Rejoindre une tontine</CardTitle>
          <CardDescription>
            Entrez le code d'invitation à 8 caractères fourni par l'administrateur du groupe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JoinGroupForm />
        </CardContent>
      </Card>
    </div>
  )
}
