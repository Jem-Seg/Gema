#!/bin/bash

# Script pour migrer les imports Clerk vers NextAuth dans tous les fichiers

echo "🔄 Migration des imports Clerk vers NextAuth..."

# Liste des fichiers à migrer (exclure les fichiers markdown de documentation)
files=(
  "app/transactions/page.tsx"
  "app/octrois/page.tsx"
  "app/update-product/[productId]/page.tsx"
  "app/give/page.tsx"
  "app/new-product/page.tsx"
  "app/components/AlimentationModal.tsx"
  "app/post-sign-in/page.tsx"
  "app/products/page.tsx"
  "app/category/page.tsx"
  "app/admin/dashboard/page.tsx"
  "app/admin/roles/page.tsx"
  "app/admin/verify/page.tsx"
  "app/admin/users/pending/page.tsx"
  "app/admin/settings/page.tsx"
  "app/alimentations/page.tsx"
  "app/admin/ministeres/page.tsx"
  "app/admin/structures/page.tsx"
  "app/admin/users/page.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  📝 Migration de $file"
    
    # Remplacer l'import Clerk par NextAuth
    sed -i '' "s/import { useUser } from '@clerk\/nextjs'/import { useSession } from 'next-auth\/react'/g" "$file"
    
    # Remplacer useUser() par useSession()
    sed -i '' "s/const { isLoaded, user } = useUser()/const { data: session, status } = useSession()\n  const user = session?.user/g" "$file"
    
    # Remplacer !isLoaded par status !== 'authenticated'
    sed -i '' "s/!isLoaded/status !== 'authenticated'/g" "$file"
    
    # Remplacer isLoaded par status === 'authenticated'
    sed -i '' "s/isLoaded/status === 'authenticated'/g" "$file"
    
    # Remplacer user.id par (user as any).id
    sed -i '' "s/user\.id/(user as any).id/g" "$file"
    
    # Remplacer user?.id par (user as any)?.id
    sed -i '' "s/user?\.id/(user as any)?.id/g" "$file"
    
  else
    echo "  ⚠️  Fichier non trouvé: $file"
  fi
done

echo "✅ Migration terminée!"
