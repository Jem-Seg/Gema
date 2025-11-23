# Fix Build Errors - Guide Production PostgreSQL

## ✅ Corrections Appliquées

### 1. Fichiers d'Erreur Créés

**`app/global-error.tsx`** - Gestion erreurs globales
- Affichage erreurs avec UI DaisyUI
- Boutons Réessayer + Retour accueil

**`app/not-found.tsx`** - Page 404
- Interface propre pour pages non trouvées
- Lien retour accueil

### 2. Configuration next.config.ts

Ajout de:
```typescript
experimental: {
  serverActions: {
    bodySizeLimit: '2mb',
  },
},
```

### 3. Directives Dynamic Rendering

**Ajouté à `/app/admin/dashboard/page.tsx`** :
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

## 🔧 À Faire Manuellement

### Ajouter à TOUTES les pages avec `useSession` ou `useRouter`

Ajouter ces 2 lignes après `"use client";` :

```typescript
"use client";

// Force dynamic rendering (évite erreurs prerendering)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useSession } from 'next-auth/react';
// ... reste du code
```

### Liste des Fichiers à Modifier

1. `app/page.tsx`
2. `app/dashboard/page.tsx`
3. `app/products/page.tsx`
4. `app/category/page.tsx`
5. `app/alimentations/page.tsx`
6. `app/octrois/page.tsx`
7. `app/transactions/page.tsx`
8. `app/give/page.tsx`
9. `app/new-product/page.tsx`
10. `app/update-product/[productId]/page.tsx`
11. `app/statistiques/page.tsx`
12. `app/sign-in/[[...sign-in]]/page.tsx`
13. `app/sign-up/[[...sign-up]]/page.tsx`
14. `app/reset-password/page.tsx`
15. `app/forgot-password/page.tsx`
16. `app/post-sign-in/page.tsx`
17. `app/mobile-test/page.tsx`
18. `app/admin/users/pending/page.tsx`
19. `app/admin/users/page.tsx`
20. `app/admin/ministeres/page.tsx`
21. `app/admin/structures/page.tsx`
22. `app/admin/roles/page.tsx`
23. `app/admin/settings/page.tsx`

## 🐘 Migration PostgreSQL

### 1. Modifier prisma/schema.prisma

```prisma
datasource db {
  provider = "postgresql"  // Changer "sqlite" en "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Configurer .env

```env
# PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/gestock_db?schema=public"

# Exemple
DATABASE_URL="postgresql://postgres:admin@localhost:5432/gestock?schema=public"

# NextAuth
NEXTAUTH_URL=http://votre-serveur:3000
NEXTAUTH_SECRET=secret-genere-securise
ADMIN_SECRET_KEY=cle-admin
```

### 3. Créer Base PostgreSQL

```sql
-- Windows: Ouvrir pgAdmin ou psql
CREATE DATABASE gestock_db;
CREATE USER gestock_user WITH ENCRYPTED PASSWORD 'SecurePassword123';
GRANT ALL PRIVILEGES ON DATABASE gestock_db TO gestock_user;

-- PostgreSQL 15+
\c gestock_db
GRANT ALL ON SCHEMA public TO gestock_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO gestock_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO gestock_user;
```

### 4. Appliquer Migrations

```bash
# Générer Prisma Client PostgreSQL
npx prisma generate

# Appliquer migrations
npx prisma migrate deploy

# Ou créer nouvelle migration
npx prisma migrate dev --name init_postgresql
```

## 🚀 Build Production

```bash
# 1. Nettoyer
rm -rf .next
rm -rf node_modules/.prisma

# 2. Installer
npm install

# 3. Générer Prisma
npx prisma generate

# 4. Build
npm run build

# 5. Démarrer
npm run start
# Ou avec PM2
pm2 start ecosystem.config.js
```

## ⚠️ Erreurs Communes

### "Invariant: Expected workUnitAsyncStorage"

**Cause**: Pages serveur sans `"use client"` ou manque `dynamic = 'force-dynamic'`

**Solution**: Ajouter les 3 lignes ci-dessus

### "Module not found: @prisma/client"

```bash
npx prisma generate
```

### "Can't reach database server"

Vérifier:
1. PostgreSQL démarre : `services.msc` (Windows)
2. Port 5432 ouvert
3. `pg_hba.conf` autorise connexions locales
4. DATABASE_URL correct

### "relation does not exist"

```bash
npx prisma migrate reset
npx prisma migrate deploy
```

## ✅ Checklist Build

- [ ] `app/global-error.tsx` créé
- [ ] `app/not-found.tsx` créé
- [ ] `next.config.ts` mis à jour
- [ ] Toutes les pages avec hooks ont `dynamic = 'force-dynamic'`
- [ ] `prisma/schema.prisma` → `provider = "postgresql"`
- [ ] `.env` configuré avec PostgreSQL
- [ ] Base PostgreSQL créée
- [ ] `npx prisma generate` exécuté
- [ ] `npx prisma migrate deploy` réussi
- [ ] `npm run build` sans erreur
- [ ] Application démarre sur Windows

## 📞 Si Problèmes Persistent

1. Logs détaillés: `npm run build 2>&1 | tee build.log`
2. Vérifier Prisma: `npx prisma validate`
3. Test connexion DB: `npx prisma db push`
4. Nettoyer cache: `rm -rf .next node_modules && npm install`
