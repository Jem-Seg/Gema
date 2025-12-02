# Gema - Application de Gestion des Stocks

📦 **Gema** est une application full stack de gestion des stocks d'un ministère, conçue pour être utilisée sur ordinateur (Desktop) et mobile.

## Fonctionnalités

- 🔐 **Authentification sécurisée** - Connexion et inscription des utilisateurs
- 📊 **Tableau de bord** - Vue d'ensemble des stocks et alertes
- 📦 **Gestion des stocks** - Créer, modifier, supprimer des articles
- 🔄 **Mouvements de stock** - Entrées et sorties avec historique complet
- 🏷️ **Catégories** - Organisation des articles par catégories
- ⚠️ **Alertes de stock bas** - Notification des articles en dessous du seuil minimum
- 📱 **Responsive Design** - Interface adaptée aux écrans desktop et mobile

## Architecture

```
gema/
├── backend/         # API Node.js/Express
│   ├── src/
│   │   ├── routes/      # Routes API
│   │   ├── middleware/  # Middleware d'authentification
│   │   └── config/      # Configuration base de données
│   └── __tests__/       # Tests API
└── frontend/        # Application React
    ├── src/
    │   ├── components/  # Composants réutilisables
    │   ├── pages/       # Pages de l'application
    │   ├── context/     # Contexte d'authentification
    │   └── services/    # Services API
    └── build/           # Build de production
```

## Installation

### Prérequis

- Node.js 18+
- npm 9+

### Backend

```bash
cd backend
npm install
npm start
```

Le serveur API démarre sur le port 3001 par défaut.

### Frontend

```bash
cd frontend
npm install
npm start
```

L'application React démarre sur le port 3000 en mode développement.

### Build de production

```bash
cd frontend
npm run build
```

Le backend sert automatiquement les fichiers statiques du frontend depuis le dossier `build`.

## API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Utilisateur courant

### Stocks
- `GET /api/stocks` - Liste des stocks (avec filtres)
- `GET /api/stocks/:id` - Détail d'un stock
- `POST /api/stocks` - Créer un stock
- `PUT /api/stocks/:id` - Modifier un stock
- `DELETE /api/stocks/:id` - Supprimer un stock
- `POST /api/stocks/:id/movement` - Mouvement de stock
- `GET /api/stocks/:id/movements` - Historique des mouvements

### Catégories
- `GET /api/categories` - Liste des catégories
- `POST /api/categories` - Créer une catégorie
- `PUT /api/categories/:id` - Modifier une catégorie
- `DELETE /api/categories/:id` - Supprimer une catégorie

## Tests

### Tests Backend

```bash
cd backend
npm test
```

### Tests Frontend

```bash
cd frontend
npm test
```

## Configuration

### Variables d'environnement Backend

- `PORT` - Port du serveur (défaut: 3001)
- `JWT_SECRET` - Clé secrète pour les tokens JWT
- `NODE_ENV` - Environnement (development/production/test)

### Variables d'environnement Frontend

- `REACT_APP_API_URL` - URL de l'API backend

## Sécurité

- Authentification par JWT
- Mots de passe hashés avec bcrypt
- Protection des routes sensibles
- Validation des entrées utilisateur

## Licence

ISC
