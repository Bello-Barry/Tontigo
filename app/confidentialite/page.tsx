import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l'accueil
        </Link>
        
        <h1 className="text-3xl md:text-5xl font-bold mb-8">Politique de Confidentialité</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground leading-relaxed">
              Bienvenue sur <strong>Likelemba</strong>. La protection de vos données personnelles est une priorité pour nous. Cette politique a pour but de vous informer sur la manière dont nous collectons, utilisons, et protégeons vos informations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-primary">1. Données collectées</h2>
            <p className="text-muted-foreground leading-relaxed">
              Lors de votre inscription et de votre utilisation de la plateforme, nous pouvons collecter les données suivantes :
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-2">
              <li>Membres d'identité : Nom, Prénom.</li>
              <li>Coordonnées : Adresse électronique, Numéro de téléphone.</li>
              <li>Informations financières virtuelles liées aux montants de vos tontines et épargnes (montants saisis par les utilisateurs à titre de suivi).</li>
              <li>Données de connexion (adresses IP, logs de navigation, mots de passe de comptes hashés).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-primary">2. Utilisation des données</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vos informations sont utilisées exclusivement pour :
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-2">
              <li>Gérer votre compte utilisateur et sécuriser l'accès à vos tableaux de bord.</li>
              <li>Vous informer via des alertes sur le déroulement de vos cycles de tontines.</li>
              <li>Afficher votre profil de confiance (score) auprès des groupes de tontine que vous décidez de rejoindre.</li>
              <li>Améliorer nos services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-primary">3. Partage et sécurité des données</h2>
            <p className="text-muted-foreground leading-relaxed">
              Aucune de vos données personnelles n'est vendue ou partagée à des partenaires commerciaux à des fins de prospection directe.
              Elles sont stockées en toute sécurité chez nos fournisseurs cloud certifiés (tels que Supabase). 
              La base de données repose sur des mesures de sécurité pour empêcher tout accès, altération ou suppression illégaux de vos informations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-primary">4. Vos droits</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vous avez un droit d'accès, de rectification et, dans certains cas, d'effacement de vos données personnelles. Vous pouvez exercer ce droit à tout moment directement depuis les paramètres de votre compte (tableau de bord) ou en nous contactant.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-primary">5. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le site Likelemba utilise des cookies nécessaires au fonctionnement de la plateforme (par exemple, pour vous maintenir connecté après authentification) ainsi que pour proposer une meilleure expérience utilisateur. Nous nous limitons à l'utilisation de ces cookies stricts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-primary">6. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Si vous avez des questions sur l'utilisation de vos données, écrivez-nous à : <strong>privacy@likelemba.com</strong>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
