import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateGroupForm } from '@/components/tontine/CreateGroupForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function CreateTontinePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/tontine">
        <Button variant="ghost" size="sm" className="mb-2 -ml-3 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
      </Link>
      
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-2xl">Créer une Tontine</CardTitle>
          <CardDescription>
            Définissez les règles de votre groupe. Vous serez automatiquement ajouté comme premier membre.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateGroupForm />
        </CardContent>
      </Card>
    </div>
  )
}
