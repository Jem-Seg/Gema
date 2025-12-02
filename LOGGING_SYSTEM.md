# 📋 Système de Logs - Documentation Complète

## Vue d'ensemble

Le système de logs GESTOCK permet d'enregistrer et d'analyser toutes les opérations critiques de l'application. Il offre une traçabilité complète des actions utilisateurs et des événements système.

## Architecture

### Composants principaux

1. **Logger Class** (`lib/logger.ts`)
   - Singleton pattern pour instance globale
   - Gestion des niveaux de log
   - Rotation automatique des fichiers
   - Nettoyage des anciens logs

2. **API Routes** (`app/api/admin/logs/route.ts`)
   - Endpoint REST pour accès aux logs
   - Actions : stats, list, read
   - Accès administrateur uniquement

3. **Interface Admin** (`app/admin/logs/page.tsx`)
   - Visualisation des logs
   - Filtrage par niveau et texte
   - Consultation en temps réel

## Niveaux de Log

Le système utilise 5 niveaux de log hiérarchiques :

| Niveau | Emoji | Utilisation | Exemple |
|--------|-------|-------------|---------|
| **DEBUG** | 🔍 | Détails de développement | Valeurs de variables, flux d'exécution |
| **INFO** | ✅ | Opérations normales | Connexion utilisateur, création produit |
| **WARN** | ⚠️ | Situations anormales non critiques | Ressource manquante, timeout dépassé |
| **ERROR** | ❌ | Erreurs nécessitant attention | Échec requête DB, validation échouée |
| **FATAL** | 💀 | Erreurs critiques système | Crash application, corruption données |

## Configuration

### Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Niveau minimum de log (DEBUG | INFO | WARN | ERROR | FATAL)
LOG_LEVEL=INFO

# Répertoire des fichiers de log
LOG_DIR=./logs

# Taille maximale par fichier (MB) avant rotation
LOG_MAX_FILE_SIZE=10

# Nombre maximum de fichiers à conserver
LOG_MAX_FILES=30

# Activer sortie console (true | false)
LOG_ENABLE_CONSOLE=true

# Activer enregistrement fichier (true | false)
LOG_ENABLE_FILE=true
```

### Recommandations par environnement

**Développement :**
```env
LOG_LEVEL=DEBUG
LOG_ENABLE_CONSOLE=true
LOG_ENABLE_FILE=true
```

**Production :**
```env
LOG_LEVEL=INFO
LOG_ENABLE_CONSOLE=false
LOG_ENABLE_FILE=true
```

**Test :**
```env
LOG_LEVEL=WARN
LOG_ENABLE_CONSOLE=false
LOG_ENABLE_FILE=false
```

## Utilisation

### Import du logger

```typescript
import logger from '@/lib/logger';
```

### Logs basiques

```typescript
// Log simple
logger.info('Utilisateur', 'Connexion réussie');

// Log avec données additionnelles
logger.debug('API', 'Requête reçue', {
  method: 'POST',
  path: '/api/products',
  body: requestBody
});

// Log d'erreur
try {
  await riskyOperation();
} catch (error) {
  logger.error('Database', 'Échec sauvegarde produit', error);
}
```

### Logs avec contexte utilisateur

```typescript
import logger from '@/lib/logger';

// Dans une API route avec session
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  try {
    const product = await createProduct(data);
    
    // Log avec informations utilisateur
    logger.logWithUser(
      'INFO',
      'Produits',
      'Nouveau produit créé',
      session?.user?.id,
      session?.user?.email,
      { productId: product.id, productName: product.nom }
    );
    
    return Response.json({ success: true });
  } catch (error) {
    logger.logWithUser(
      'ERROR',
      'Produits',
      'Échec création produit',
      session?.user?.id,
      session?.user?.email,
      error
    );
    return Response.json({ success: false }, { status: 500 });
  }
}
```

## Exemples d'intégration

### 1. Routes API

```typescript
// app/api/alimentations/route.ts
import logger from '@/lib/logger';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  try {
    logger.info('Alimentations', 'Début traitement nouvelle alimentation');
    
    const data = await request.json();
    const alimentation = await createAlimentation(data);
    
    logger.logWithUser(
      'INFO',
      'Alimentations',
      'Alimentation créée avec succès',
      session?.user?.id,
      session?.user?.email,
      { 
        alimentationId: alimentation.id,
        produitId: data.produitId,
        quantite: data.quantite
      }
    );
    
    return Response.json({ success: true, data: alimentation });
  } catch (error) {
    logger.logWithUser(
      'ERROR',
      'Alimentations',
      'Erreur création alimentation',
      session?.user?.id,
      session?.user?.email,
      error
    );
    
    return Response.json({ 
      success: false, 
      message: 'Erreur serveur' 
    }, { status: 500 });
  }
}
```

### 2. Workflows

```typescript
// lib/workflows/octroi.ts
import logger from '@/lib/logger';

export async function executeOctroiWorkflow(data: OctroiData, userId: string) {
  logger.info('Workflow', `Démarrage workflow octroi pour user ${userId}`);
  
  try {
    // Étape 1
    logger.debug('Workflow', 'Validation données octroi', data);
    await validateOctroiData(data);
    
    // Étape 2
    logger.info('Workflow', 'Création transaction octroi');
    const transaction = await createTransaction(data);
    
    // Étape 3
    logger.info('Workflow', 'Mise à jour stock');
    await updateStock(data.produitId, -data.quantite);
    
    logger.info('Workflow', 'Workflow octroi terminé avec succès', {
      transactionId: transaction.id
    });
    
    return { success: true, transaction };
  } catch (error) {
    logger.error('Workflow', 'Échec workflow octroi', error);
    throw error;
  }
}
```

### 3. Actions serveur

```typescript
// app/actions.ts
import logger from '@/lib/logger';

export async function deleteProduct(productId: string) {
  const session = await getServerSession(authOptions);
  
  try {
    logger.warn('Produits', `Tentative suppression produit ${productId}`);
    
    await prisma.product.delete({
      where: { id: productId }
    });
    
    logger.logWithUser(
      'WARN',
      'Produits',
      'Produit supprimé',
      session?.user?.id,
      session?.user?.email,
      { productId }
    );
    
    return { success: true };
  } catch (error) {
    logger.logWithUser(
      'ERROR',
      'Produits',
      'Échec suppression produit',
      session?.user?.id,
      session?.user?.email,
      { productId, error }
    );
    
    return { success: false, error: 'Suppression impossible' };
  }
}
```

## Fonctionnalités

### Rotation automatique

Les fichiers de log sont automatiquement rotationnés selon :
- **Quotidiennement** : Nouveau fichier chaque jour (`app-2025-12-01.log`)
- **Par taille** : Nouveau fichier quand > 10 MB
- **Format** : `app-YYYY-MM-DD.log` ou `app-YYYY-MM-DD-1.log`

### Nettoyage automatique

- Conservation des **30 fichiers les plus récents**
- Suppression automatique des plus anciens
- Exécuté à chaque démarrage de l'application

### Sortie colorée (console)

En développement, les logs console utilisent des couleurs ANSI :
- 🔵 DEBUG : Cyan
- 🟢 INFO : Vert
- 🟡 WARN : Jaune
- 🔴 ERROR : Rouge
- 🟣 FATAL : Magenta

### Format de log

```
[2025-12-01T14:30:45.123Z] [INFO] [Utilisateur] Connexion réussie | User: john@example.com (user_123)
[2025-12-01T14:31:12.456Z] [ERROR] [Database] Échec requête | Error: Connection timeout
```

**Structure :**
- `[Timestamp]` : Date/heure ISO 8601
- `[Level]` : Niveau du log
- `[Category]` : Catégorie/module
- `Message` : Description
- `User:` : Email et ID utilisateur (si applicable)
- `Data:` : Données additionnelles (si applicable)

## Interface Admin

### Accès

URL : `/admin/logs` (réservé aux administrateurs)

### Fonctionnalités

1. **Statistiques globales**
   - Nombre total de fichiers
   - Espace disque utilisé
   - Fichier le plus récent/ancien

2. **Liste des fichiers**
   - Tous les fichiers de log disponibles
   - Taille et date de chaque fichier
   - Sélection pour consultation

3. **Visualisation**
   - Affichage coloré par niveau
   - Filtrage par texte
   - Filtrage par niveau
   - Limitation du nombre de lignes
   - Rafraîchissement en temps réel

4. **Filtres disponibles**
   - Recherche textuelle (insensible à la casse)
   - Niveau : ALL, DEBUG, INFO, WARN, ERROR, FATAL
   - Nombre de lignes : 50, 100, 500, 1000

## API Endpoints

### GET /api/admin/logs

**Authentification requise :** Administrateur uniquement

#### Action: stats

Récupère les statistiques des logs.

```typescript
GET /api/admin/logs?action=stats

Response:
{
  "success": true,
  "data": {
    "totalFiles": 15,
    "totalSizeMB": 45.2,
    "oldestLog": "app-2025-11-15.log",
    "newestLog": "app-2025-12-01.log",
    "files": [
      {
        "name": "app-2025-12-01.log",
        "sizeMB": 3.2,
        "date": "2025-12-01T00:00:00.000Z"
      },
      ...
    ]
  }
}
```

#### Action: list

Liste tous les fichiers de log.

```typescript
GET /api/admin/logs?action=list

Response:
{
  "success": true,
  "data": {
    "files": ["app-2025-12-01.log", "app-2025-11-30.log", ...]
  }
}
```

#### Action: read

Lit le contenu d'un fichier de log.

```typescript
GET /api/admin/logs?action=read&file=app-2025-12-01.log&lines=100

Response:
{
  "success": true,
  "data": {
    "fileName": "app-2025-12-01.log",
    "lines": [
      "[2025-12-01T14:30:45.123Z] [INFO] [Utilisateur] Connexion réussie",
      ...
    ],
    "totalLines": 100
  }
}
```

## Bonnes pratiques

### 1. Choisir le bon niveau

```typescript
// ❌ Mauvais
logger.error('User', 'Utilisateur connecté'); // Pas une erreur !

// ✅ Bon
logger.info('User', 'Utilisateur connecté');
```

### 2. Catégories cohérentes

Utilisez des catégories standardisées :
- `Utilisateur` : Authentification, profil
- `Produits` : CRUD produits
- `Alimentations` : Entrées stock
- `Octrois` : Sorties stock
- `Database` : Opérations DB
- `API` : Requêtes HTTP
- `Workflow` : Processus métier

### 3. Messages descriptifs

```typescript
// ❌ Mauvais
logger.error('Error', 'Failed');

// ✅ Bon
logger.error('Database', 'Échec connexion PostgreSQL - timeout après 30s', error);
```

### 4. Données sensibles

```typescript
// ❌ Mauvais - expose le mot de passe
logger.debug('Auth', 'Login attempt', { email, password });

// ✅ Bon - masque les données sensibles
logger.debug('Auth', 'Login attempt', { email, passwordLength: password.length });
```

### 5. Contexte utilisateur

Utilisez `logWithUser()` pour les actions utilisateur :

```typescript
// ✅ Traçabilité complète
logger.logWithUser(
  'INFO',
  'Produits',
  'Modification prix produit',
  userId,
  userEmail,
  { productId, oldPrice, newPrice }
);
```

## Maintenance

### Surveillance

Surveillez régulièrement :
- Taille totale des logs (dashboard admin)
- Présence d'erreurs fréquentes
- Logs FATAL (nécessitent intervention immédiate)

### Nettoyage manuel

Si nécessaire, supprimer manuellement :

```bash
# Supprimer tous les logs
rm -rf logs/

# Supprimer logs de plus de 7 jours
find logs/ -name "*.log" -mtime +7 -delete
```

### Backup des logs

Pour archivage long terme :

```bash
# Compresser les logs anciens
tar -czf logs-archive-2025-11.tar.gz logs/app-2025-11-*.log

# Sauvegarder dans un stockage externe
cp logs-archive-2025-11.tar.gz /chemin/vers/backup/
```

## Dépannage

### Les logs ne s'enregistrent pas

1. Vérifiez `LOG_ENABLE_FILE=true` dans `.env`
2. Vérifiez les permissions du dossier `logs/`
3. Vérifiez l'espace disque disponible

### Fichiers trop volumineux

1. Réduisez `LOG_MAX_FILE_SIZE` dans `.env`
2. Augmentez `LOG_LEVEL` (INFO ou WARN au lieu de DEBUG)
3. Réduisez `LOG_MAX_FILES` pour garder moins de fichiers

### Performances dégradées

1. Désactivez console en production : `LOG_ENABLE_CONSOLE=false`
2. Utilisez niveau INFO ou WARN en production
3. Montez le répertoire logs sur un disque séparé

## Migration depuis console.log

Pour remplacer progressivement les `console.log` :

```typescript
// Avant
console.log('User logged in:', userId);
console.error('Failed to save:', error);

// Après
logger.info('Utilisateur', 'Connexion utilisateur', { userId });
logger.error('Database', 'Échec sauvegarde', error);
```

Script de recherche :

```bash
# Trouver tous les console.log
grep -r "console\.(log|error|warn|info)" app/ lib/
```

## Ressources

- Code source : `lib/logger.ts`
- API : `app/api/admin/logs/route.ts`
- Interface : `app/admin/logs/page.tsx`
- Config : `.env.example`

## Support

Pour toute question ou problème avec le système de logs, consultez la documentation technique ou contactez l'équipe de développement.

---

**Version :** 1.0  
**Date :** Décembre 2025  
**Auteur :** GESTOCK Development Team
