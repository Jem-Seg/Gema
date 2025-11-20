# Mécanisme de Réinitialisation de Mot de Passe

## 🎯 Vue d'ensemble

Un système complet de réinitialisation de mot de passe a été implémenté pour permettre aux utilisateurs de récupérer l'accès à leur compte en cas d'oubli de mot de passe.

## 🗄️ Modèle de données

### Table `PasswordResetToken`

```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  expires   DateTime
  createdAt DateTime @default(now())
  
  @@index([email])
}
```

**Caractéristiques :**
- Token unique généré avec `crypto.randomBytes(32)`
- Durée de validité : **1 heure**
- Index sur l'email pour recherche rapide
- Auto-suppression après utilisation

## 📁 Structure des fichiers

### Routes API

#### `/api/auth/forgot-password/route.ts`
**Méthode :** POST  
**Payload :** `{ email: string }`

**Fonctionnement :**
1. Vérifie l'existence de l'utilisateur
2. Supprime les anciens tokens pour cet email
3. Génère un token unique (64 caractères hexadécimaux)
4. Crée un token avec expiration dans 1 heure
5. Retourne le lien de réinitialisation (mode dev)

**Sécurité :**
- Même réponse que l'email existe ou non (prévention énumération)
- Token cryptographiquement sécurisé
- Expiration automatique après 1 heure

**Réponse en développement :**
```json
{
  "success": true,
  "message": "Un lien de réinitialisation a été généré.",
  "developmentLink": "http://localhost:3000/reset-password?token=..."
}
```

#### `/api/auth/reset-password/route.ts`
**Méthode :** POST  
**Payload :** `{ token: string, password: string }`

**Fonctionnement :**
1. Valide le token (existence et expiration)
2. Valide le mot de passe (minimum 8 caractères)
3. Hache le nouveau mot de passe avec bcrypt
4. Met à jour le mot de passe utilisateur
5. Supprime le token utilisé

**Validations :**
- Token valide et non expiré
- Mot de passe minimum 8 caractères
- Token à usage unique (supprimé après utilisation)

### Pages Interface

#### `/app/forgot-password/page.tsx`
Page de demande de réinitialisation de mot de passe.

**Fonctionnalités :**
- Formulaire email simple et intuitif
- Gestion des états de chargement
- Affichage du lien en mode développement
- Notifications toast pour feedback utilisateur
- Redirection auto vers connexion (production)

**Mode développement :**
- Affiche le lien de réinitialisation directement
- Bouton pour copier le lien
- Bouton pour ouvrir le lien
- Avertissement visuel du mode dev

#### `/app/reset-password/page.tsx`
Page de définition du nouveau mot de passe.

**Fonctionnalités :**
- Récupération du token depuis URL (`?token=...`)
- Double saisie du mot de passe (confirmation)
- Validation en temps réel de la correspondance
- Indicateurs visuels de sécurité
- Redirection auto vers connexion après succès

**Validations :**
- Token présent dans l'URL
- Mot de passe minimum 8 caractères
- Confirmation identique au mot de passe
- Affichage d'alertes pour guidage utilisateur

### Scripts utilitaires

#### `/scripts/generate-reset-link.mjs`
Script pour générer manuellement un lien de réinitialisation.

**Usage :**
```bash
node scripts/generate-reset-link.mjs <email>
```

**Exemple :**
```bash
node scripts/generate-reset-link.mjs admin@test.com
```

**Sortie :**
```
✅ Utilisateur trouvé: Admin Super

🔗 Lien de réinitialisation généré :
http://localhost:3000/reset-password?token=90a0a192ee083dc...

⏰ Expire le: 18/11/2025 20:41:04

💡 Utilisez ce lien pour réinitialiser le mot de passe.
```

**Cas d'usage :**
- Support utilisateur manuel
- Récupération de compte sans email
- Tests et développement
- Urgences administratives

#### `/scripts/create-test-users.mjs`
Script pour créer des utilisateurs de test avec tous les rôles.

**Utilisateurs créés :**
```
Email / Mot de passe : Password123!

- admin@test.com (Admin)
- agent@test.com (Agent de saisie)
- achats@test.com (Responsable Achats)
- financier@test.com (Directeur Financier)
- directeur@test.com (Directeur)
- ordonnateur@test.com (Ordonnateur)
```

## 🔐 Sécurité

### Token
- **Algorithme :** `crypto.randomBytes(32)` (256 bits d'entropie)
- **Format :** Hexadécimal (64 caractères)
- **Unicité :** Garantie par contrainte DB unique
- **Durée de vie :** 1 heure
- **Usage :** Une seule fois (supprimé après utilisation)

### Mot de passe
- **Hashage :** bcrypt avec 10 rounds
- **Validation :** Minimum 8 caractères
- **Confirmation :** Double saisie requise
- **Stockage :** Jamais en clair

### Anti-énumération
- Même message de succès que l'email existe ou non
- Pas d'indication si l'utilisateur existe
- Prévient la découverte de comptes valides

### Expiration automatique
- Tokens expirés supprimés lors de la tentative d'utilisation
- Vérification d'expiration côté serveur
- Nettoyage des anciens tokens lors de nouvelle demande

## 🎨 Expérience utilisateur

### Flux normal (Production)
1. Utilisateur clique "Mot de passe oublié ?" sur la page de connexion
2. Entre son email
3. Reçoit un email avec le lien (⚠️ non implémenté - voir ci-dessous)
4. Clique sur le lien dans l'email
5. Définit son nouveau mot de passe
6. Est redirigé vers la connexion
7. Se connecte avec le nouveau mot de passe

### Flux développement
1. Utilisateur clique "Mot de passe oublié ?"
2. Entre son email
3. **Le lien s'affiche directement dans l'interface**
4. Copie ou clique sur le lien
5. Définit son nouveau mot de passe
6. Est redirigé vers la connexion

### Flux administrateur (Script)
1. Utilisateur contacte le support
2. Admin exécute : `node scripts/generate-reset-link.mjs email@utilisateur.com`
3. Admin envoie le lien manuellement (chat, SMS, etc.)
4. Utilisateur utilise le lien
5. Définit son nouveau mot de passe

## 🚀 Intégration email (À implémenter)

### Service recommandé
Pour la production, intégrer un service d'envoi d'email comme :
- **Resend** (recommandé, simple et moderne)
- SendGrid
- Amazon SES
- Mailgun

### Configuration Resend (exemple)

**Installation :**
```bash
npm install resend
```

**Configuration `.env` :**
```env
RESEND_API_KEY=re_123456789
```

**Modification `/api/auth/forgot-password/route.ts` :**
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Dans la route POST, après création du token :
if (process.env.NODE_ENV === 'production') {
  await resend.emails.send({
    from: 'GeStock <noreply@gestock.app>',
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <h2>Réinitialisation de mot de passe</h2>
      <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Ce lien expire dans 1 heure.</p>
      <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
    `
  })
}
```

## 📊 Migration Prisma

**Migration créée :** `20251118193651_add_password_reset_token`

**SQL généré :**
```sql
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");
```

## 🧪 Tests

### Test manuel complet

**1. Demande de réinitialisation :**
```bash
# Via interface : http://localhost:3000/forgot-password
# Entrer : admin@test.com
```

**2. Ou via script :**
```bash
node scripts/generate-reset-link.mjs admin@test.com
```

**3. Utiliser le lien généré :**
```
http://localhost:3000/reset-password?token=...
```

**4. Définir nouveau mot de passe :**
- Entrer : `NewPassword123!`
- Confirmer : `NewPassword123!`
- Cliquer "Réinitialiser le mot de passe"

**5. Se connecter :**
```
Email : admin@test.com
Mot de passe : NewPassword123!
```

### Test des erreurs

**Token expiré :**
1. Générer un token
2. Attendre 1 heure
3. Essayer de l'utiliser
4. ✅ Message : "Token expiré"

**Token invalide :**
1. Modifier le token dans l'URL
2. Essayer de réinitialiser
3. ✅ Message : "Token invalide ou expiré"

**Mots de passe non correspondants :**
1. Entrer différents mots de passe
2. ✅ Bouton désactivé
3. ✅ Alerte affichée

**Mot de passe trop court :**
1. Entrer moins de 8 caractères
2. ✅ Message : "Le mot de passe doit contenir au moins 8 caractères"

## 📝 Notifications

### Bibliothèque utilisée
**react-hot-toast** - Notifications toast modernes et élégantes

**Configuration dans `app/layout.tsx` :**
```tsx
import { Toaster } from 'react-hot-toast'

<Toaster 
  position="top-right"
  toastOptions={{
    duration: 4000,
    style: {
      background: '#363636',
      color: '#fff',
    },
    success: { duration: 3000 },
    error: { duration: 4000 },
  }}
/>
```

### Messages utilisés
- ✅ Succès : "Un lien de réinitialisation a été généré."
- ✅ Succès : "Mot de passe réinitialisé avec succès !"
- ❌ Erreur : "Token invalide ou expiré"
- ❌ Erreur : "Token expiré"
- ❌ Erreur : "Le mot de passe doit contenir au moins 8 caractères"
- ❌ Erreur : "Les mots de passe ne correspondent pas"

## 🎯 Améliorations futures

### Court terme
- [ ] Intégration service email (Resend)
- [ ] Template email HTML personnalisé
- [ ] Limitation du nombre de demandes par IP
- [ ] Historique des réinitialisations dans les logs

### Moyen terme
- [ ] Authentification à deux facteurs (2FA)
- [ ] Politiques de mot de passe (complexité)
- [ ] Notification email après changement réussi
- [ ] Liste des sessions actives

### Long terme
- [ ] Connexion sans mot de passe (Magic links)
- [ ] Authentification biométrique
- [ ] SSO (Single Sign-On)
- [ ] Audit complet des accès

## 📌 Points importants

### ⚠️ Mode développement
- Les liens sont affichés directement dans l'interface
- Pas d'envoi d'email réel
- Logs console détaillés
- Parfait pour les tests

### ✅ Prêt pour production
- Architecture sécurisée
- Token cryptographiquement fort
- Expiration automatique
- Anti-énumération
- Il suffit d'ajouter l'envoi d'email

### 🔧 Maintenance
- Script utilitaire pour support utilisateur
- Nettoyage automatique des tokens expirés
- Logs pour traçabilité
- Simple à étendre

---

**Date de création :** 18 novembre 2025  
**Fichiers modifiés/créés :** 8 fichiers  
**Migrations :** 1 migration Prisma  
**État :** ✅ Fonctionnel et testé
