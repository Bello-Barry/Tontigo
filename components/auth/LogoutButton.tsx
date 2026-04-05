'use client'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/actions/auth.actions'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut()
  }

  return (
    <Button 
      variant="destructive" 
      onClick={handleLogout}
      className="w-full"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Déconnexion
    </Button>
  )
}
