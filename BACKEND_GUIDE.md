# Guide de Maîtrise du Backend Likelemba 🚀

Ce guide est conçu pour t'aider à comprendre et maîtriser l'architecture backend de ton application Likelemba. Il couvre la base de données, la logique métier et l'intégration des paiements mobiles (MTN & Airtel).

## 1. Architecture Globale

Likelemba utilise une architecture **Fullstack Next.js** moderne :
- **Frontend :** React 19, Tailwind CSS, Shadcn UI.
- **Backend :** Next.js **Server Actions** (`lib/actions/`).
- **Base de données :** **Supabase** (PostgreSQL) avec Row Level Security (RLS).
- **Authentification :** Système hybride (Supabase Auth + Profils personnalisés).

---

## 2. Modèle de Données (La "Colonne Vertébrale")

Le schéma de la base de données se trouve dans `supabase/migrations/001_initial_schema.sql`.

### Tables Clés
- **`users`** : Stocke les profils (score de confiance, badges, numéros Mobile Money).
- **`tontine_groups`** : Les groupes créés par les utilisateurs (montant, fréquence, type d'ordre).
- **`memberships`** : La table de liaison entre utilisateurs et groupes. Gère la **garantie** et le statut (actif, fugitif, éliminé).
- **`contributions`** : Le journal des paiements attendus et effectués.
- **`payouts`** : Les versements de la cagnotte aux gagnants d'un tour.
- **`transactions`** : Historique complet de tous les mouvements d'argent.

### Mécanismes Automatisés (Triggers & Fonctions)
- **`update_badge_on_score_change`** : Met à jour automatiquement le badge (Expert, Fiable, etc.) dès que le score de confiance change.
- **`apply_daily_penalties`** : (Appelé par un cron) Calcule les amendes pour les retards de paiement.
- **`handle_new_user`** : Crée automatiquement un profil dans `public.users` dès qu'un utilisateur s'inscrit via Supabase Auth.

---

## 3. Authentification Numéro + PIN

Contrairement au web classique (Email/Mot de passe), Likelemba utilise un système adapté au marché local :
- **Logique (`lib/actions/auth.actions.ts`)** : On génère un "faux" email à partir du numéro de téléphone (ex: `061234567@tontigo.fake`) pour utiliser le moteur d'auth de Supabase, tout en gardant une expérience simple pour l'utilisateur.
- **PIN** : Le mot de passe de l'utilisateur est son code PIN à 4 chiffres.

---

## 4. Intégration des Paiements Mobiles (Congo-B)

Le fichier central est `lib/actions/paiement.actions.ts`.

### MTN Mobile Money (MoMo)
- **API utilisée** : Ericsson Mobile Money API (standard international).
- **Collection (Récolte)** :
  1. On envoie une requête `POST` à `/requesttopay`.
  2. L'utilisateur reçoit une notification sur son téléphone pour valider avec son code PIN.
  3. MTN nous répond avec un statut `202 Accepted`.
- **Disbursement (Versement)** :
  - On utilise `/transfer` pour envoyer l'argent de la cagnotte directement sur le compte du membre.

### Airtel Money
- **Authentification** : Utilise un système d'OAuth2 (`client_id` + `client_secret`) pour obtenir un token temporaire.
- **Paiement** : Requête vers `/merchant/v2/payments/` avec le numéro MSISDN (format 242...).

---

## 5. Logique Métier de la Tontine

Tout se passe dans `lib/actions/tontine.actions.ts`.

### Le Cycle d'une Cotisation
1. **Démarrage** : Le créateur lance le groupe. Des lignes de `contributions` sont générées pour tous les membres pour le Tour 1.
2. **Paiement (`payContribution`)** :
   - L'utilisateur paie via son Mobile Money.
   - En cas de succès, son statut passe à `paye`.
   - On prélève **2% pour le Pool de Solidarité** (RPC `increment_solidarity_pool`).
   - On augmente son score de confiance (+2 points).
3. **Versement de la Cagnotte (`checkAndProcessPayout`)** :
   - Dès que la dernière cotisation du tour est payée, le système déclenche automatiquement le versement.
   - On calcule la commission Likelemba (1.5%) via `calculatePayoutCommission`.
   - On enregistre le versement dans `payouts` et on envoie l'argent.
   - On passe au tour suivant (Incrémentation de `current_turn`).

---

## 6. Score de Confiance (Trust Score)

C'est l'algorithme qui garantit la sécurité de la plateforme (`lib/utils/trust-score.ts`).

| Action | Impact Score |
| :--- | :--- |
| Paiement à l'heure | +2 points |
| Cycle complet réussi | +10 points |
| Retard de paiement | -2 à -15 points (selon les jours) |
| Élimination du groupe | -20 points |
| Fuite (Fugitif) | -50 points (et BAN immédiat) |

---

## 7. Comment maintenir et tester ?

### Lancer les tests
Tu as maintenant une suite de tests unitaires. Utilise-les pour vérifier que tes modifications ne cassent pas la logique de calcul :
```bash
npm test
```

### Modifier le schéma
Si tu ajoutes une colonne à une table :
1. Modifie le fichier SQL dans `supabase/migrations/`.
2. Mets à jour les types TypeScript dans `lib/types/index.ts`.

---

**Astuce de Pro** : Pour déboguer les paiements, regarde toujours les logs des Server Actions. Si un paiement échoue, vérifie que tes variables d'environnement (`MTN_MOMO_API_KEY`, etc.) sont bien configurées dans ton fichier `.env`.
