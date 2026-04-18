# 🧪 Guide de Test de l'IA Likelemba

Ce document explique comment vérifier que les 10 modules IA et sécurité sont bien opérationnels.

## 1. Modules Métier (M1-M5)

### M1 : Analyse prédictive des défauts
- **Test :** Appeler `analyzePaymentRisk` via une route API de test ou attendre le cron.
- **Vérification :** Consulter la table `ai_analyses` (`type = 'payment_risk'`). Si le score > 70, une alerte doit apparaître dans `security_alerts`.

### M2 : Score de confiance IA
- **Test :** Modifier l'historique d'un utilisateur (ajouter des retards) puis appeler `recalculateTrustScoreAI(userId)`.
- **Vérification :** Le `trust_score` de l'utilisateur dans `users` doit être mis à jour (limité à ±10 points par analyse).

### M3 : Assistant de création intelligent
- **Test :** Aller sur `/tontine/create`, entrer un montant et cliquer sur "Optimiser avec Likelemba IA".
- **Vérification :** Un encadré vert avec des conseils doit apparaître et le taux d'amende doit s'auto-remplir.

### M4 : Détection de fraude
- **Test :** Simuler une action suspecte (ex: rejoindre 5 groupes en 1 minute).
- **Vérification :** Une alerte "critical" ou "high" doit apparaître dans le Dashboard Admin > Sécurité.

### M5 : Rapport financier mensuel
- **Test :** Appeler la route `/api/cron/rapports-mensuels` avec le `CRON_SECRET`.
- **Vérification :** Une notification doit être envoyée à l'utilisateur et un rapport créé dans `monthly_reports`.

## 2. Modules Sécurité (S1-S5)

### S1 : Analyse comportementale (Fugitif)
- **Test :** Effectuer un versement de cagnotte (automatique quand un tour est fini).
- **Vérification :** Vérifier `ai_analyses` pour un type `behavioral`. L'IA analyse si l'engagement du membre a baissé après avoir reçu l'argent.

### S2 : Cohérence des transactions
- **Test :** Tenter une transaction MTN/Airtel avec un montant 10x supérieur à la moyenne de l'utilisateur.
- **Vérification :** L'action doit retourner une erreur de sécurité.

### S3 : Comptes multiples
- **Test :** Créer un compte avec des infos (Nom, Quartier) identiques à un compte banni.
- **Vérification :** Une alerte doit être générée pour l'admin.

### S4 : Scoring Matching
- **Test :** Tenter de rejoindre un groupe public avec un `trust_score` faible ou un compte trop récent.
- **Vérification :** Le matching doit refuser l'entrée avec un message d'explication IA.

### S5 : Modération du chat
- **Test :** Envoyer un message contenant des insultes ou une tentative d'arnaque (ex: "donne moi ton numéro pour payer dehors").
- **Vérification :** Le message doit disparaître immédiatement (is_deleted: true) et une alerte admin doit être créée.

## 3. Dashboard Admin
- **Test :** Aller sur `/admin`.
- **Vérification :** Voir la section "Alertes de Sécurité IA" et les statistiques "Fraudes Détectées" / "Messages Modérés".
