# Configuration PostgreSQL Production

## Variables d'environnement

```env
# PostgreSQL Production
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# Exemple concret
# DATABASE_URL="postgresql://gestock_user:SecurePassword123@localhost:5432/gestock_db?schema=public"

# NextAuth
NEXTAUTH_URL=http://votre-domaine.com
NEXTAUTH_SECRET=votre-secret-genere-securise

# Admin
ADMIN_SECRET_KEY=votre-cle-admin-securisee
```

## Migration SQLite → PostgreSQL

### 1. Modifier schema.prisma

```prisma
datasource db {
  provider = "postgresql"  // Changer de "sqlite" à "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Créer la base PostgreSQL

```sql
-- Sur votre serveur PostgreSQL
CREATE DATABASE gestock_db;
CREATE USER gestock_user WITH ENCRYPTED PASSWORD 'SecurePassword123';
GRANT ALL PRIVILEGES ON DATABASE gestock_db TO gestock_user;

-- PostgreSQL 15+
\c gestock_db
GRANT ALL ON SCHEMA public TO gestock_user;
```

### 3. Générer et appliquer migrations

```bash
# Générer le client Prisma pour PostgreSQL
npx prisma generate

# Créer une nouvelle migration
npx prisma migrate dev --name init_postgresql

# Ou déployer migrations existantes
npx prisma migrate deploy
```

### 4. Optionnel: Migrer les données

```bash
# Export SQLite
sqlite3 prisma/dev.db .dump > data.sql

# Convertir et importer (nécessite conversion manuelle ou outil tiers)
# Ou recréer les données de base manuellement
```

## Problèmes Courants

### Erreur: "Prepared statement already exists"

Solution: Ajouter `?pgbouncer=true` si utilisation de PgBouncer
```env
DATABASE_URL="postgresql://...?schema=public&pgbouncer=true"
```

### Erreur: "Connection timeout"

Vérifier:
1. Pare-feu Windows (port 5432 ouvert)
2. PostgreSQL écoute sur 0.0.0.0 (pas seulement localhost)
3. pg_hba.conf autorise connexions

### Performances

Ajouter indexes dans schema.prisma:
```prisma
model Product {
  @@index([ministereId, structureId])
  @@index([createdAt])
}
```
