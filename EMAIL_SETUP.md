# 📧 Configuration de l'envoi d'emails

Ce guide explique comment configurer l'envoi d'emails pour la fonctionnalité "mot de passe oublié".

## 🚀 Configuration rapide

### 1. Ajouter les variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Configuration SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-application
SMTP_FROM=votre-email@gmail.com

# Nom de l'application (optionnel)
NEXT_PUBLIC_APP_NAME=GeStock
```

---

## 📮 Option 1 : Gmail (Recommandé pour débuter)

### Étape 1 : Créer un mot de passe d'application Gmail

1. Allez sur votre compte Google : https://myaccount.google.com/
2. Sélectionnez **Sécurité** dans le menu de gauche
3. Activez la **validation en deux étapes** si ce n'est pas déjà fait
4. Dans la section "Validation en deux étapes", cherchez **Mots de passe des applications**
5. Sélectionnez l'application : **Mail**
6. Sélectionnez l'appareil : **Autre (nom personnalisé)**
7. Nommez-le : **GeStock** (ou le nom de votre application)
8. Cliquez sur **Générer**
9. **Copiez le mot de passe de 16 caractères** généré

### Étape 2 : Configurer les variables

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # Le mot de passe d'application de 16 caractères
SMTP_FROM=votre-email@gmail.com
```

### ⚠️ Limites Gmail
- **500 emails par jour** (compte gratuit)
- Délai possible entre les envois
- Peut être marqué comme spam si trop d'emails

---

## 📮 Option 2 : SendGrid (Recommandé pour production)

SendGrid offre **100 emails gratuits par jour**.

### Configuration

1. Créez un compte sur https://sendgrid.com/
2. Vérifiez votre adresse email d'envoi
3. Créez une clé API dans Settings > API Keys
4. Configurez :

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=votre-cle-api-sendgrid
SMTP_FROM=noreply@votredomaine.com
```

---

## 📮 Option 3 : Mailgun

Mailgun offre **5,000 emails gratuits par mois**.

### Configuration

1. Créez un compte sur https://www.mailgun.com/
2. Vérifiez votre domaine
3. Obtenez vos identifiants SMTP
4. Configurez :

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@votre-domaine.mailgun.org
SMTP_PASSWORD=votre-mot-de-passe-mailgun
SMTP_FROM=noreply@votredomaine.com
```

---

## 📮 Option 4 : Serveur SMTP personnalisé

Si vous avez votre propre serveur SMTP :

```env
SMTP_HOST=smtp.votreserveur.com
SMTP_PORT=587  # ou 465 pour SSL
SMTP_USER=votre-utilisateur
SMTP_PASSWORD=votre-mot-de-passe
SMTP_FROM=noreply@votredomaine.com
```

### Ports communs :
- **587** : STARTTLS (recommandé)
- **465** : SSL/TLS
- **25** : Non sécurisé (éviter)

---

## 🧪 Test de configuration

### 1. Mode développement

En mode développement, le lien s'affiche directement sur la page :
- Pas besoin de configuration email
- Le lien est aussi affiché dans les logs du terminal

### 2. Mode production

Pour tester en production locale :

```bash
# Définir NODE_ENV en production
NODE_ENV=production npm run dev
```

Puis testez la fonctionnalité "Mot de passe oublié".

### 3. Vérifier les logs

Consultez les logs du serveur pour voir :
- ✅ Email envoyé avec succès
- ❌ Erreurs d'envoi d'email

---

## 🔧 Dépannage

### Erreur : "Configuration SMTP manquante"

**Solution** : Vérifiez que toutes les variables SMTP sont définies dans `.env`

### Erreur : "Invalid login" (Gmail)

**Solutions** :
1. Vérifiez que vous utilisez un **mot de passe d'application** et non votre mot de passe Gmail
2. Vérifiez que la validation en deux étapes est activée
3. Vérifiez que l'accès aux applications moins sécurisées n'est PAS activé (deprecated)

### Erreur : "Connection timeout"

**Solutions** :
1. Vérifiez votre connexion Internet
2. Vérifiez que le port n'est pas bloqué par un firewall
3. Essayez le port 465 avec `secure: true`

### Les emails arrivent dans les spams

**Solutions** :
1. Configurez les enregistrements SPF, DKIM et DMARC pour votre domaine
2. Utilisez un service d'email professionnel (SendGrid, Mailgun, etc.)
3. Demandez aux utilisateurs d'ajouter votre email aux contacts

### Test rapide avec curl

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## 📊 Comparaison des services

| Service | Gratuit | Emails/jour | Difficulté | Production |
|---------|---------|-------------|------------|------------|
| Gmail | ✅ | 500 | Facile | ⚠️ Limité |
| SendGrid | ✅ | 100 | Facile | ✅ Recommandé |
| Mailgun | ✅ | 5000 | Moyen | ✅ Recommandé |
| SMTP perso | - | Illimité | Difficile | ✅ Si configuré |

---

## 🔐 Sécurité

### Bonnes pratiques :

1. **Ne jamais committer le fichier `.env`**
   - Ajoutez `.env` dans `.gitignore`
   - Utilisez `.env.example` comme modèle

2. **Utilisez des mots de passe d'application**
   - Pas votre mot de passe principal
   - Révocable facilement

3. **Variables d'environnement en production**
   - Utilisez les variables d'environnement de votre hébergeur
   - Pas de fichier `.env` en production

4. **Limitez les tentatives**
   - Implémentez un rate limiting si besoin
   - Surveillez les abus

---

## 📝 Support

Pour plus d'informations :
- Documentation Nodemailer : https://nodemailer.com/
- Guide Gmail : https://support.google.com/accounts/answer/185833
- SendGrid Docs : https://docs.sendgrid.com/
- Mailgun Docs : https://documentation.mailgun.com/
