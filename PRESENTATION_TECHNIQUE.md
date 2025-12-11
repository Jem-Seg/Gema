# 🚀 Présentation Technique - GeStock

## 📋 Vue d'Ensemble

**GeStock** est une application web full-stack moderne de gestion de stock développée pour les ministères et structures gouvernementales. L'application combine des technologies de pointe pour offrir performance, sécurité et maintenabilité.

---

## 🏗️ Architecture Globale

### Type d'Architecture
- **Modèle :** Application web full-stack monolithique
- **Paradigme :** Server-Side Rendering (SSR) + Server Actions
- **Pattern :** MVC avec architecture en couches

### Stack Technologique Complète

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Client)                     │
│  Next.js 16 App Router + React 19 + TypeScript 5.0      │
│  DaisyUI 4.12.24 + Tailwind CSS 3.4.17                  │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (API Routes)                    │
│  Next.js API Routes + NextAuth v5 + Server Actions      │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                   ORM & VALIDATION                       │
│          Prisma ORM 6.19.0 + Zod Validation             │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                    BASE DE DONNÉES                       │
│      SQLite (Développement) / PostgreSQL (Production)   │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 Technologies Frontend

### Framework & Librairies

**Next.js 16.0.1**
- **App Router** : Routing moderne basé sur le système de fichiers
- **Turbopack** : Bundler ultra-rapide (successeur de Webpack)
- **Server Components** : Rendu côté serveur par défaut
- **Streaming SSR** : Chargement progressif des pages
- **Route Handlers** : API Routes intégrées

**React 19.0.0**
- **Hooks** : useState, useEffect, useCallback, useMemo, useTransition
- **Context API** : Gestion d'état global
- **Suspense** : Gestion du chargement asynchrone
- **Server Components** : Composants rendus côté serveur

**TypeScript 5.0.4**
- **Type Safety** : Typage strict pour réduire les bugs
- **Interfaces** : Définition de contrats de données
- **Generics** : Code réutilisable et type-safe
- **Enums** : Énumérations pour les constantes

### UI & Styling

**Tailwind CSS 3.4.17**
- **Utility-First** : Classes CSS atomiques
- **Responsive Design** : Mobile-first
- **Dark Mode** : Support natif (non activé)
- **JIT Compiler** : Compilation à la volée

**DaisyUI 4.12.24**
- **Composants** : 50+ composants pré-stylés
- **Thème** : "Retro" personnalisé
- **Accessibilité** : WCAG 2.1 AA
- **Compatibilité** : 100% Tailwind

**Lucide React 0.468.0**
- **Icônes** : 1000+ icônes SVG
- **Tree-shakeable** : Import sélectif
- **Personnalisable** : Taille, couleur, stroke

### Bibliothèques Complémentaires

**Recharts 2.15.0**
- Graphiques interactifs
- Charts : Line, Bar, Pie, Area
- Responsive et animés

**React Hook Form 7.54.2**
- Gestion performante des formulaires
- Validation intégrée
- Moins de re-renders

**Zod 3.24.1**
- Validation de schémas
- Type inference automatique
- Validation runtime et compile-time

---

## 🔧 Technologies Backend

### Runtime & Framework

**Node.js 18+**
- **Runtime** : JavaScript côté serveur
- **NPM** : Gestionnaire de paquets
- **ES Modules** : Import/export moderne

**Next.js API Routes**
- **Route Handlers** : GET, POST, PUT, DELETE
- **Middleware** : Authentification, logs, CORS
- **Dynamic Routes** : Routes paramétrées
- **Server Actions** : Actions serveur avec mutation

### Authentification

**NextAuth v5 (Auth.js)**
- **Providers** : Credentials (email/password)
- **JWT** : JSON Web Tokens pour les sessions
- **Callbacks** : Personnalisation du flow
- **Session Management** : Gestion automatique des sessions

**bcryptjs 2.4.3**
- Hachage sécurisé des mots de passe
- Salt rounds : 10
- Comparaison sécurisée

### ORM & Base de Données

**Prisma ORM 6.19.0**
- **Schema-first** : Définition déclarative du modèle
- **Type-safe** : Client généré automatiquement
- **Migrations** : Gestion de schéma
- **Introspection** : Génération depuis DB existante
- **Query Builder** : API fluide pour les requêtes

**SQLite (Développement)**
- Base de données embarquée
- Fichier : `dev.db`
- Pas de serveur requis
- Idéal pour le développement

**PostgreSQL 14+ (Production)**
- Base de données relationnelle
- ACID compliant
- Performances optimales
- Scalabilité

### Gestion de Fichiers

**Système de Stockage Personnalisé**
- **Développement** : `/public/uploads`
- **Production Windows** : `C:\gestock\uploads`
- **API Route** : `/api/files/[filename]`
- **Types supportés** : Images (JPG, PNG, WEBP), PDF, Documents

**Multer** (via formidable)
- Upload de fichiers
- Validation de taille
- Validation de type MIME

---

## 🗄️ Architecture Base de Données

### Modèle de Données

**Entités Principales :**

```
Ministere (1) ──── (*) Structure
    │                      │
    │                      │
    ├── (*) User           ├── (*) Produit
    ├── (*) Category       ├── (*) Alimentation
    ├── (*) Produit        └── (*) Octroi
    ├── (*) Alimentation
    └── (*) Octroi

User (*) ──── (1) Role

Alimentation (*) ──── (1) Produit
Alimentation (1) ──── (*) Document

Octroi (*) ──── (1) Produit
Octroi (1) ──── (*) Document

Produit (*) ──── (1) Category
Produit (1) ──── (*) Transaction
```

**Modèles Prisma :**

1. **Ministere** : Entité racine
2. **Structure** : Départements/services
3. **User** : Utilisateurs du système
4. **Role** : Rôles et permissions
5. **Category** : Catégories de produits
6. **Produit** : Produits en stock
7. **Alimentation** : Entrées de stock
8. **Octroi** : Sorties de stock
9. **Transaction** : Historique des mouvements
10. **Document** : Fichiers joints
11. **ActionHistorique** : Audit trail
12. **Account** : Comptes NextAuth
13. **Session** : Sessions utilisateur

### Relations Clés

**Hiérarchie Organisationnelle :**
- Un Ministère a plusieurs Structures
- Un Ministère a plusieurs Utilisateurs
- Un Utilisateur appartient à un Ministère (pas à une Structure)

**Gestion du Stock :**
- Un Produit appartient à une Catégorie (niveau Ministère)
- Un Produit appartient à une Structure
- Les Alimentations/Octrois sont liés à un Produit

**Workflow :**
- Les Alimentations/Octrois ont un statut (workflow à 3 niveaux)
- Les ActionHistorique tracent toutes les modifications

---

## 🔐 Sécurité

### Authentification & Autorisation

**NextAuth v5**
- Sessions JWT sécurisées
- CSRF protection
- Cookie httpOnly et secure
- Expiration automatique

**Système de Rôles**
- 4 rôles : Agent de saisie, Responsable Achats, Responsable Financier, Ordonnateur
- Permissions granulaires par rôle
- Vérification côté serveur systématique

**Validation Utilisateur**
- Approbation par administrateur
- Compte bloqué par défaut
- Vérification email/ministère

### Protection des Données

**Hachage des Mots de Passe**
- bcrypt avec salt rounds = 10
- Pas de stockage en clair
- Comparaison sécurisée

**Validation des Entrées**
- Zod schemas côté serveur
- React Hook Form côté client
- Sanitization des inputs
- Protection XSS

**Gestion des Fichiers**
- Validation de type MIME
- Limitation de taille (5-10 MB)
- Noms de fichiers sécurisés
- Pas de traversée de répertoires

### Middleware de Sécurité

**Protection des Routes**
```typescript
// middleware.ts
export default function middleware(request: NextRequest) {
  // Vérification authentification
  // Redirection si non authentifié
  // Vérification rôles
}
```

**Server Actions Sécurisées**
- Vérification session sur chaque action
- Validation des permissions par rôle
- Logs d'audit

---

## 🔄 Workflow & Logique Métier

### Système de Workflow

**États des Alimentations/Octrois :**

```typescript
type AlimentationStatus = 
  | "EN_ATTENTE"              // Création
  | "EN_INSTANCE_ACHATS"      // Validation Resp. Achats
  | "VALIDE_ACHATS"           // Validé Achats
  | "EN_INSTANCE_FINANCIER"   // Validation Resp. Financier
  | "VALIDE_FINANCIER"        // Validé Financier
  | "EN_INSTANCE_ORDONNATEUR" // Validation Ordonnateur
  | "VALIDE_ORDONNATEUR"      // Validé → Stock mis à jour
  | "MIS_EN_INSTANCE"         // Renvoi pour modification
  | "REJETE";                 // Rejeté définitivement
```

**Workflow Automatisé :**
- Validation à 3 niveaux
- Transitions d'état contrôlées
- Historique complet des actions
- Notifications (prévu)

**Mise à Jour du Stock :**
- Uniquement à `VALIDE_ORDONNATEUR`
- Transaction atomique (Prisma)
- Rollback en cas d'erreur
- Traçabilité complète

### Logique Métier

**Fichiers de Workflow :**
- `lib/workflows/alimentation.ts` : Logique alimentations
- `lib/workflows/octroi.ts` : Logique octrois
- `app/actions.ts` : Server Actions

**Règles Métier :**
- Vérification stock disponible pour octrois
- Validation des quantités
- Calcul automatique des montants
- Génération de numéros de référence
- Alertes stock bas (< 20% initial)

---

## 📊 Fonctionnalités Avancées

### Système d'États Imprimables

**9 Types d'États :**
1. État Général du Stock
2. État par Article
3. État par Structure
4. Seuils d'Alerte
5. Bon d'Entrée
6. Bon de Sortie
7. Mouvements sur Période
8. Historique par Article
9. Historique par Structure

**Technologie :**
- Génération côté serveur
- Templates React
- CSS print-friendly
- Export PDF natif navigateur

### Statistiques & Analyses

**Recharts Integration :**
- Graphiques en temps réel
- Répartition par catégorie (Pie Chart)
- Tendances (Line Chart)
- Comparaisons (Bar Chart)

**Métriques :**
- Stock par catégorie
- Mouvements sur période
- Valeur totale du stock
- Top produits
- Alertes actives

### Système de Logs

**Logger Personnalisé :**
- `lib/logger.ts` : Système de logs centralisé
- 5 niveaux : DEBUG, INFO, WARN, ERROR, CRITICAL
- Rotation automatique
- Interface admin (`/admin/logs`)

**Logs Enregistrés :**
- Authentification
- Modifications de stock
- Validations workflow
- Erreurs système
- Uploads fichiers

### Backup & Restore

**Système de Sauvegarde :**
- `lib/backup.ts` : Module de backup
- Support SQLite et PostgreSQL
- Compression automatique
- Rotation des sauvegardes
- Interface admin (`/admin/backup`)

**Fonctionnalités :**
- Backup manuel/automatique
- Restauration point-in-time
- Nettoyage anciennes sauvegardes
- Statistiques de sauvegarde

---

## 🎨 Interface Utilisateur

### Design System

**DaisyUI Thème "Retro"**
- Palette de couleurs cohérente
- Composants réutilisables
- Responsive design
- Accessibilité intégrée

**Composants Principaux :**
- `Navbar.tsx` : Navigation principale
- `Wrapper.tsx` : Layout global
- `ProductComponent.tsx` : Cartes produits
- `TransactionComponent.tsx` : Historique
- `Stock.tsx` : Modal de stock
- `StockSummaryTable.tsx` : Tableaux récapitulatifs

### Responsive Design

**Breakpoints Tailwind :**
- `sm:` 640px (Smartphones)
- `md:` 768px (Tablettes)
- `lg:` 1024px (Desktop)
- `xl:` 1280px (Large screens)
- `2xl:` 1536px (Extra large)

**Optimisations Mobile :**
- Touch-friendly buttons
- Menus hamburger
- Tableaux scrollables
- Images optimisées

---

## ⚡ Performance

### Optimisations Frontend

**Next.js Optimizations :**
- **Code Splitting** : Chargement par route
- **Tree Shaking** : Suppression code inutilisé
- **Image Optimization** : Next/Image avec lazy loading
- **Font Optimization** : next/font pour les fonts
- **Turbopack** : Build 10x plus rapide que Webpack

**React Optimizations :**
- **React.memo** : Éviter re-renders inutiles
- **useMemo / useCallback** : Mémoïsation
- **Suspense** : Lazy loading composants
- **Server Components** : Rendu serveur par défaut

### Optimisations Backend

**Prisma Optimizations :**
- **Select** : Récupération champs spécifiques
- **Include** : Eager loading relations
- **Where** : Filtrage côté DB
- **orderBy** : Tri côté DB
- **Connection Pooling** : Réutilisation connexions

**Caching :**
- Cache navigateur (headers)
- Cache Next.js (fetch avec revalidate)
- Memoization serveur

### Base de Données

**Index Prisma :**
- Index sur clés étrangères
- Index sur champs recherchés
- Unique constraints

**Requêtes Optimisées :**
- Éviter N+1 queries
- Utilisation de transactions
- Batch operations

---

## 🚀 Déploiement

### Environnements

**Développement :**
- SQLite pour la DB
- Hot reload avec Turbopack
- Logs détaillés
- Source maps

**Production :**
- PostgreSQL 14+
- Build optimisé
- Logs minimaux
- Compression assets

### Configuration

**Variables d'Environnement (.env) :**
```env
# Base de données
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# NextAuth
NEXTAUTH_SECRET="secret-aleatoire-64-caracteres"
NEXTAUTH_URL="https://votredomaine.com"

# Email (optionnel)
EMAIL_SERVER="smtp://user:pass@smtp.example.com:587"
EMAIL_FROM="noreply@example.com"

# Uploads (Windows)
UPLOADS_DIR="C:\\gestock\\uploads"
```

### Options de Déploiement

**1. Vercel (Recommandé pour Next.js)**
- Déploiement automatique
- CDN global
- SSL automatique
- Scaling automatique

**2. Ubuntu Server**
- PM2 pour process management
- Nginx reverse proxy
- PostgreSQL local
- Certbot pour SSL

**3. Windows Server**
- IIS ou PM2
- PostgreSQL Windows
- Dossier uploads externe
- HTTPS via IIS

### Build Production

```bash
# Installation dépendances
npm install

# Génération Prisma Client
npx prisma generate

# Migration base de données
npx prisma migrate deploy

# Build Next.js
npm run build

# Lancement production
npm start
```

**Fichiers Générés :**
- `.next/` : Build Next.js
- `node_modules/.prisma/` : Client Prisma
- `prisma/dev.db` : SQLite (dev)

---

## 🧪 Tests & Qualité

### Outils de Développement

**ESLint**
- Configuration Next.js
- Détection erreurs
- Bonnes pratiques React

**TypeScript Compiler**
- Vérification types
- Erreurs compile-time
- IntelliSense

**Prisma Studio**
- Interface graphique DB
- CRUD operations
- Debug données

### Scripts Utilitaires

**Scripts Disponibles :**
```json
{
  "dev": "next dev",
  "build": "prisma generate && next build",
  "start": "next start",
  "lint": "next lint"
}
```

**Scripts Personnalisés :**
- `scripts/create-admin.mjs` : Créer admin
- `scripts/promote-admin.mjs` : Promouvoir user
- `scripts/setup-roles.mjs` : Initialiser rôles
- `scripts/check-alimentations-status.mjs` : Debug workflow

---

## 📦 Dépendances Complètes

### Dependencies Production

```json
{
  "@prisma/client": "^6.19.0",
  "bcryptjs": "^2.4.3",
  "date-fns": "^4.1.0",
  "lucide-react": "^0.468.0",
  "next": "16.0.1",
  "next-auth": "5.0.0-beta.25",
  "react": "19.0.0",
  "react-dom": "19.0.0",
  "react-hook-form": "^7.54.2",
  "recharts": "^2.15.0",
  "zod": "^3.24.1"
}
```

### Dev Dependencies

```json
{
  "@types/bcryptjs": "^2.4.6",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "daisyui": "^4.12.24",
  "eslint": "^8",
  "eslint-config-next": "16.0.1",
  "postcss": "^8",
  "prisma": "^6.19.0",
  "tailwindcss": "^3.4.17",
  "typescript": "^5"
}
```

---

## 🏆 Points Forts Techniques

### Avantages de l'Architecture

✅ **Type Safety Complète**
- TypeScript end-to-end
- Prisma type-safe queries
- Zod runtime validation

✅ **Performance Optimale**
- Server-Side Rendering
- Code splitting automatique
- Image optimization
- Turbopack build ultra-rapide

✅ **Sécurité Renforcée**
- NextAuth v5 moderne
- Hachage bcrypt
- Validation serveur systématique
- Protection CSRF/XSS

✅ **Developer Experience**
- Hot reload instantané
- TypeScript IntelliSense
- Prisma Studio
- ESLint intégré

✅ **Maintenabilité**
- Code modulaire
- Architecture en couches
- Séparation concerns
- Documentation complète

✅ **Scalabilité**
- Support PostgreSQL
- Server Components
- Caching stratégies
- CDN ready

---

## 📈 Métriques du Projet

**Lignes de Code :**
- TypeScript/JavaScript : ~25,000 lignes
- Composants React : 50+
- API Routes : 70+
- Pages : 20+

**Base de Données :**
- Modèles Prisma : 13
- Relations : 25+
- Migrations : 15+

**Documentation :**
- Fichiers Markdown : 40+
- Manuel utilisateur : 50+ pages
- Guides techniques : 20+ documents

**Performance :**
- First Contentful Paint : < 1.5s
- Time to Interactive : < 3s
- Lighthouse Score : 90+

---

## 🔮 Technologies Futures (Roadmap)

### À Court Terme

**Notifications Temps Réel :**
- WebSockets ou Server-Sent Events
- Notifications push navigateur
- Alertes stock en temps réel

**API REST Publique :**
- Documentation OpenAPI/Swagger
- Rate limiting
- API Keys

**Tests Automatisés :**
- Jest pour unit tests
- Playwright pour E2E
- Coverage > 80%

### À Moyen Terme

**Application Mobile :**
- React Native ou PWA
- Notifications mobiles
- Mode offline

**Intégration ERP :**
- API d'intégration
- Synchronisation bidirectionnelle
- Webhooks

**BI Avancé :**
- Tableau de bord analytics
- Prédictions ML
- Exports avancés

### À Long Terme

**Multi-tenancy :**
- Isolation données par tenant
- Customization par organisation
- Billing module

**Microservices :**
- Séparation services
- GraphQL API
- Event-driven architecture

---

## 📞 Support Technique

**Documentation :**
- `README.md` : Vue d'ensemble
- `MANUEL_UTILISATEUR.md` : Guide utilisateur
- `DEPLOYMENT.md` : Guide déploiement
- `DEPLOYMENT_WINDOWS.md` : Déploiement Windows

**Logs & Debugging :**
- Logs système : `/admin/logs`
- Prisma Studio : `npx prisma studio`
- Next.js logs : Console serveur

**Contact :**
- Support technique via administrateur
- Issues GitHub
- Documentation en ligne

---

**📌 Document :** Présentation Technique GeStock  
**🗓 Version :** 1.0  
**📅 Date :** Décembre 2025  
**✍️ Auteur :** Équipe GeStock  
**🔧 Stack :** Next.js 16 + React 19 + TypeScript 5 + Prisma + PostgreSQL
