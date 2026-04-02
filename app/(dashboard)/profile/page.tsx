'use client'
import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signOut } from "@/lib/actions/auth.actions"
import { ShieldCheck, LogOut, Phone } from "lucide-react"

export default function ProfilePage() {
  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mon Profil</h2>
        <p className="text-muted-foreground mt-1">Gérez vos informations et portefeuilles.</p>
      </div>

      <Card className="glass-card">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4 border-b pb-6">
             <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
               <ShieldCheck className="w-8 h-8 text-primary" />
             </div>
             <div>
               <h3 className="text-xl font-bold">Vérifié</h3>
               <p className="text-sm text-muted-foreground">Numéro identifié</p>
             </div>
          </div>

          <div className="space-y-4">
             <h4 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">Portefeuilles (Réception)</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">MTN Mobile Money</label>
                  <div className="relative">
                    <Input disabled value="+242 06 xxx xx xx" className="pl-9" />
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  </div>
               </div>
               <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Airtel Money</label>
                  <div className="relative">
                    <Input disabled value="Non renseigné" className="pl-9 italic" />
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  </div>
               </div>
             </div>
             <p className="text-xs text-muted-foreground">Contactez l'assistance pour modifier vos portefeuilles de réception par sécurité.</p>
          </div>
          
          <div className="pt-6 border-t flex justify-end">
             <Button variant="destructive" onClick={handleLogout}>
               <LogOut className="w-4 h-4 mr-2" /> Déconnexion
             </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
