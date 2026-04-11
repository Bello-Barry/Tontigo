import Link from 'next/link'
import { ArrowRight, ShieldCheck, Users, PiggyBank, Target, ArrowUpRight, CheckCircle2 } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b backdrop-blur-md bg-background/80">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Likelemba</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Avantages</Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">Comment ça marche</Link>
            <Link href="#about" className="text-muted-foreground hover:text-foreground transition-colors">Conseils</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Connexion
            </Link>
            <Link href="/register" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25">
              S'inscrire
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background -z-10" />
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-8 text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              La nouvelle façon de gérer vos finances en groupe
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
              L'épargne collaborative, <br className="hidden md:block" />
              <span className="likelemba-gradient-text">simplifiée et sécurisée</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
              Rejoignez des tontines de confiance, atteignez vos objectifs financiers plus rapidement et gérez vos cotisations en toute transparence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-7 duration-700 delay-300">
              <Link href="/register" className="h-14 px-8 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-xl hover:shadow-primary/30 w-full sm:w-auto text-lg">
                Commencer maintenant <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="#how-it-works" className="h-14 px-8 inline-flex items-center justify-center rounded-full border-2 border-border hover:bg-muted transition-all w-full sm:w-auto text-lg font-medium">
                Découvrir le fonctionnement
              </Link>
            </div>
          </div>
        </section>

        {/* Features / Conseil */}
        <section id="features" className="py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Pourquoi choisir notre plateforme ?</h2>
              <p className="text-muted-foreground text-lg">Nous transformons la tontine traditionnelle en une expérience moderne, transparente et sans risque pour tous les participants.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: ShieldCheck, title: "Sécurité garantie", desc: "Vos fonds et vos données sont protégés. Nous assurons un suivi rigoureux de chaque transaction." },
                { icon: Users, title: "Groupes de confiance", desc: "Créez des tontines avec vos proches ou rejoignez des groupes vérifiés avec des règles claires." },
                { icon: Target, title: "Atteignez vos objectifs", desc: "Gagnez en discipline financière et réalisez vos projets (achat, voyage, investissement) plus rapidement." }
              ].map((feature, i) => (
                <div key={i} className="glass-card p-8 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Comment ça marche ?</h2>
                <p className="text-lg text-muted-foreground mb-8">Un processus simple en 3 étapes pour commencer à épargner intelligemment.</p>
                
                <div className="space-y-8">
                  {[
                    { step: "01", title: "Inscription gratuite", desc: "Créez votre compte en quelques secondes et complétez votre profil pour instaurer un climat de confiance." },
                    { step: "02", title: "Création ou adhésion", desc: "Fondez votre propre groupe de tontine avec vos règles, ou rejoignez une tontine existante qui correspond à votre budget." },
                    { step: "03", title: "Cotisez et bénéficiez", desc: "Suivez le calendrier des tours. Cotisez facilement et recevez la cagnotte totale quand vient votre tour !" }
                  ].map((s, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="text-2xl font-bold text-primary/30 pt-1">{s.step}</div>
                      <div>
                        <h4 className="text-xl font-semibold mb-2">{s.title}</h4>
                        <p className="text-muted-foreground">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-3xl blur-3xl -z-10" />
                <div className="glass-card p-6 rounded-3xl border border-white/10 shadow-2xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b">
                      <div>
                        <div className="font-semibold text-lg">Tontine "Projet Vacances"</div>
                        <div className="text-sm text-muted-foreground">Cycle en cours</div>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm font-medium">Actif</div>
                    </div>
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-background/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-medium">P{i+1}</div>
                          <div>
                            <div className="font-medium text-sm">Participant {i+1}</div>
                            <div className="text-xs text-muted-foreground">{i === 1 ? 'Tour actuel' : 'En attente'}</div>
                          </div>
                        </div>
                        {i === 1 ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <div className="w-5 h-5 rounded-full border-2 border-muted" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 -z-10" />
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Prêt à prendre en main votre avenir financier ?</h2>
            <p className="text-xl text-muted-foreground mb-10">L'inscription est gratuite, rapide et sans engagement. Prenez la décision aujourd'hui pour financer vos projets de demain.</p>
            <Link href="/register" className="h-16 px-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-xl hover:-translate-y-1 text-xl">
              Créer mon compte gratuitement <ArrowUpRight className="ml-2 w-6 h-6" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t bg-background">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">Likelemba</span>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Likelemba. Tous droits réservés.</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/mentions-legales" className="hover:text-primary transition-colors">Mentions légales</Link>
            <Link href="/confidentialite" className="hover:text-primary transition-colors">Confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
