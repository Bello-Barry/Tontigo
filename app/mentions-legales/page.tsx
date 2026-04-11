import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l'accueil
        </Link>
        
        <h1 className="text-3xl md:text-5xl font-bold mb-8">Mentions Légales</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-primary">1. Éditeur du site</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le site <strong>Likelemba</strong> est une plateforme de gestion d'épargne collaborative et de tontines. 
              Ce site est édité par l'équipe de Likelemba, basée en République du Congo.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-primary">2. Hébergement</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ce site est hébergé par <strong>Vercel Inc.</strong><br />
              340 S Lemon Ave #4133<br />
              Walnut, CA 91789, USA<br />
              Leur politique de confidentialité et conditions de service s'appliquent à l'hébergement de cette plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-primary">3. Propriété intellectuelle</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le contenu global protégé par les droits de propriété intellectuelle, le code source, le design, les textes, images et graphismes appartiennent exclusivement aux éditeurs de Likelemba ou sont utilisés avec autorisation. Toute reproduction, représentation, modification ou adaptation sans consentement est strictement interdite.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-primary">4. Responsabilité</h2>
            <p className="text-muted-foreground leading-relaxed">
              La plateforme Likelemba agit comme un outil de gestion et de suivi de tontines entre particuliers. Nous ne gérons ni ne détenons de fonds pour les utilisateurs. Chaque groupe de tontine est responsable de l'organisation et de la récupération de ses propres cotisations en dehors de la plateforme. Par conséquent, Likelemba ne peut être tenue responsable des défauts de paiement ou des litiges entre utilisateurs d'un même groupe.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-primary">5. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Pour toute question relative aux mentions légales ou pour tout autre signalement, vous pouvez nous contacter à l'adresse email suivante : <strong>support@likelemba.com</strong>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
