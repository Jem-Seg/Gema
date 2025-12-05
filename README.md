# 📦 GeStock - Système de Gestion de Stock

Application web moderne de gestion de stock pour les ministères et structures gouvernementales.

![Next.js](https://img.shields.io/badge/Next.js-16.0.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![DaisyUI](https://img.shields.io/badge/DaisyUI-4.12.24-5A0EF8)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)

---

## 🎯 Fonctionnalités Principales

### 📊 Gestion du Stock
- Suivi en temps réel des produits
- Alertes de stock bas (< 20% stock initial)
- Gestion multi-structures et multi-ministères
- Historique complet des mouvements

### 🔄 Workflow de Validation
- **Alimentations (Entrées)** : Validation à 3 niveaux (Financier → Directeur → Ordonnateur)
- **Octrois (Sorties)** : Validation à 3 niveaux (Directeur → Financier → Ordonnateur)
- Système de rejet et d'observations
- Verrouillage automatique après validation finale

### 📋 États Imprimables
- 9 types d'états professionnels
- Bons d'entrée/sortie officiels
- Rapports statistiques
- Export PDF natif

### 📈 Statistiques & Analyses
- Tableaux de bord personnalisés
- Graphiques par catégorie
- Tendances et métriques
- Export CSV des données

### 🔐 Gestion des Utilisateurs
- 5 rôles avec permissions granulaires
- Authentification sécurisée (NextAuth v5)
- Système de réinitialisation de mot de passe
- Validation des comptes par admin

---

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/Jem-Seg/Gestock.git
cd gestock-vf

# Installer les dépendances
npm install

# Configurer la base de données
cp .env.example .env
# Éditer .env avec vos credentials

# Initialiser Prisma
npx prisma generate
npx prisma db push

# Lancer en développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

**👉 Guide complet :** [PREMIER_DEMARRAGE.md](PREMIER_DEMARRAGE.md)

---

## 📚 Documentation

### 🎓 Pour les Utilisateurs

| Document | Description |
|----------|-------------|
| [**MANUEL_UTILISATEUR.md**](MANUEL_UTILISATEUR.md) | Manuel complet d'utilisation (Version 2.0) |
| [**GUIDE_RAPIDE_ETATS.md**](GUIDE_RAPIDE_ETATS.md) | Guide des états imprimables |
| [**ETATS_IMPRIMABLES.md**](ETATS_IMPRIMABLES.md) | Documentation détaillée des rapports |

### 👨‍💻 Pour les Développeurs

| Document | Description |
|----------|-------------|
| [**PREMIER_DEMARRAGE.md**](PREMIER_DEMARRAGE.md) | Guide d'installation et configuration |
| [**WORKFLOW_IMPLEMENTATION_COMPLETE.md**](WORKFLOW_IMPLEMENTATION_COMPLETE.md) | Architecture du workflow |
| [**ETATS_IMPLEMENTATION_COMPLETE.md**](ETATS_IMPLEMENTATION_COMPLETE.md) | Système d'états imprimables |
| [**COHERENCE_STATISTIQUES_ETATS.md**](COHERENCE_STATISTIQUES_ETATS.md) | Cohérence des données |

### 🔧 Pour les Administrateurs

| Document | Description |
|----------|-------------|
| [**DEPLOYMENT.md**](DEPLOYMENT.md) | Déploiement Linux/Cloud |
| [**DEPLOYMENT_WINDOWS.md**](DEPLOYMENT_WINDOWS.md) | Déploiement Windows Server |
| [**PASSWORD_RESET_SYSTEM.md**](PASSWORD_RESET_SYSTEM.md) | Gestion des mots de passe |
| [**NETTOYAGE_PRODUCTION.md**](NETTOYAGE_PRODUCTION.md) | Bonnes pratiques production |

### 📖 Index Complet

**[INDEX_DOCUMENTATION.md](INDEX_DOCUMENTATION.md)** - Catalogue de toute la documentation (40+ documents)

---

## 🏗️ Architecture Technique

### Stack Technologique

**Frontend :**
- Next.js 16.0.1 (App Router, Turbopack)
- TypeScript 5.0
- DaisyUI 4.12.24 (Thème Retro)
- Tailwind CSS 3.4.17
- Lucide React (icônes)

**Backend :**
- Next.js API Routes
- NextAuth v5 (authentification)
- Prisma ORM
- PostgreSQL 14+

**UI/UX :**
- Design responsive
- Thème DaisyUI Retro
- Composants réutilisables
- Accessibilité WCAG

### Structure du Projet

```
gestock-vf/
├── app/                      # Pages et routes Next.js
│   ├── api/                  # API routes
│   │   ├── etats/           # États imprimables
│   │   ├── alimentations/   # Gestion alimentations
│   │   ├── octrois/         # Gestion octrois
│   │   └── ...
│   ├── components/          # Composants React
│   │   ├── etats/          # Composants d'états
│   │   └── ...
│   ├── dashboard/          # Tableau de bord
│   ├── statistiques/       # Page statistiques
│   ├── etats/             # Page états imprimables
│   └── ...
├── prisma/                # Schéma et migrations
│   ├── schema.prisma
│   └── migrations/
├── lib/                   # Utilitaires
│   ├── auth.ts           # Configuration NextAuth
│   ├── prisma.ts         # Client Prisma
│   └── workflows/        # Logique métier
├── hooks/                # Custom hooks
├── public/               # Assets statiques
└── scripts/              # Scripts utilitaires
```

---

## 👥 Rôles et Permissions

| Rôle | Permissions | Périmètre |
|------|-------------|-----------|
| **Agent de Saisie** | Créer/Modifier alimentations et octrois | Sa structure |
| **Responsable Financier** | Valider financièrement | Sa structure |
| **Directeur** | Valider direction | Son ministère |
| **Ordonnateur** | Validation finale (mise à jour stock) | Transversal |
| **Administrateur** | Gestion complète système | Global |

---

## 🔄 Workflow de Validation

### Alimentations (Entrées de Stock)

```
SAISIE (Agent)
  ↓
INSTANCE_FINANCIER (Agent → RF)
  ↓
VALIDE_FINANCIER (RF)
  ↓
INSTANCE_DIRECTEUR (RF → Directeur)
  ↓
VALIDE_DIRECTEUR (Directeur)
  ↓
INSTANCE_ORDONNATEUR (Directeur → Ordonnateur)
  ↓
VALIDE_ORDONNATEUR (Ordonnateur) ✅ Stock mis à jour
```

### Octrois (Sorties de Stock)

```
SAISIE (Agent)
  ↓
INSTANCE_DIRECTEUR (Agent → Directeur)
  ↓
VALIDE_DIRECTEUR (Directeur)
  ↓
VALIDE_FINANCIER (RF)
  ↓
INSTANCE_ORDONNATEUR (RF → Ordonnateur)
  ↓
VALIDE_ORDONNATEUR (Ordonnateur) ✅ Stock mis à jour
```

**📘 Détails :** [WORKFLOW_IMPLEMENTATION_COMPLETE.md](WORKFLOW_IMPLEMENTATION_COMPLETE.md)

---

## 📊 États Imprimables (9 types)

### États de Stock
1. **État Général du Stock** - Vue d'ensemble
2. **État par Article** - Détail d'un produit
3. **État par Structure** - Produits d'une structure
4. **Seuils d'Alerte** - Produits en rupture

### Mouvements
5. **Bon d'Entrée** - Document officiel alimentation
6. **Bon de Sortie** - Document officiel octroi
7. **Mouvements sur Période** - Récapitulatif
8. **Historique par Article** - Traçabilité produit
9. **Historique par Structure** - Activité structure

**📋 Documentation :** [ETATS_IMPRIMABLES.md](ETATS_IMPRIMABLES.md)

---

## 🧪 Développement

### Commandes Utiles

```bash
# Développement
npm run dev

# Build production
npm run build
npm start

# Linter & Format
npm run lint

# Prisma
npx prisma studio          # Interface graphique DB
npx prisma generate        # Régénérer client
npx prisma db push         # Appliquer schéma
npx prisma migrate dev     # Créer migration

# Scripts utilitaires
node scripts/create-admin.mjs           # Créer admin
node scripts/promote-admin.mjs          # Promouvoir utilisateur
node scripts/generate-reset-link.mjs    # Lien réinitialisation
```

### Tests

```bash
# Vérifier le build
npm run build

# Tester les API routes
# (Utiliser Postman ou curl)

# Vérifier les erreurs Prisma
npx prisma validate
```

---

## 🚀 Déploiement

### Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

### Linux/Ubuntu

Voir [DEPLOYMENT.md](DEPLOYMENT.md)

### Windows Server

Voir [DEPLOYMENT_WINDOWS.md](DEPLOYMENT_WINDOWS.md)

### Variables d'Environnement

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/gestock"

# NextAuth
NEXTAUTH_SECRET="votre-secret-aleatoire"
NEXTAUTH_URL="http://localhost:3000"

# Email (optionnel)
EMAIL_SERVER="smtp://user:pass@smtp.example.com:587"
EMAIL_FROM="noreply@example.com"
```

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add: AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📝 Licence

Ce projet est sous licence privée.

---

## 👨‍💻 Équipe

- **Développement :** Équipe GeStock
- **Maintenance :** GitHub Copilot
- **Support :** Administrateurs Système

---

## 📞 Support

- **Documentation :** [INDEX_DOCUMENTATION.md](INDEX_DOCUMENTATION.md)
- **Issues :** [GitHub Issues](https://github.com/Jem-Seg/Gestock/issues)
- **Email :** support@gestock.example.com

---

## 🎯 Roadmap

### ✅ Complété
- [x] Système de workflow de validation
- [x] États imprimables (9 types)
- [x] Statistiques avancées
- [x] Gestion multi-structures
- [x] Export CSV/PDF
- [x] Alertes de stock

### 🚧 En Cours
- [ ] Notifications en temps réel
- [ ] API REST publique
- [ ] Application mobile

### 📋 Planifié
- [ ] Intégration ERP
- [ ] Signature électronique
- [ ] BI avancé
- [ ] Multi-langues

---

## 📊 Statistiques du Projet

- **Lignes de code :** ~25,000
- **Composants React :** 50+
- **API Routes :** 30+
- **Pages :** 15+
- **Documentation :** 40+ fichiers MD

---

**Version :** 1.0.0  
**Dernière mise à jour :** 26 novembre 2025  
**Statut :** ✅ Production Ready
