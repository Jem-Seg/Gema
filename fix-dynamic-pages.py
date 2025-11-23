#!/usr/bin/env python3
"""
Script pour ajouter automatiquement les directives dynamic aux pages Next.js
"""

import os
import re

# Directives à ajouter
DIRECTIVES = '''
// Force dynamic rendering (évite erreurs prerendering)
export const dynamic = 'force-dynamic';
export const revalidate = 0;
'''

def process_file(filepath):
    """Ajoute les directives si nécessaire"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Vérifier si déjà présent
    if 'export const dynamic' in content:
        print(f"  ⊘ {filepath} (déjà configuré)")
        return False
    
    # Chercher "use client"
    if '"use client"' in content or "'use client'" in content:
        # Ajouter après "use client";
        content = re.sub(
            r'(["\'])use client\1;',
            r'\1use client\1;' + DIRECTIVES,
            content,
            count=1
        )
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"  ✓ {filepath}")
        return True
    
    return False

def main():
    """Traiter tous les fichiers page.tsx"""
    print("🔧 Ajout des directives dynamic aux pages client...\n")
    
    modified = 0
    
    # Parcourir tous les page.tsx
    for root, dirs, files in os.walk('app'):
        for file in files:
            if file == 'page.tsx':
                filepath = os.path.join(root, file)
                if process_file(filepath):
                    modified += 1
    
    print(f"\n✅ Terminé! {modified} fichiers modifiés.")

if __name__ == '__main__':
    main()
