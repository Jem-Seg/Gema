# 🎨 Migration Tailwind CSS V4 → V3 (STABLE)

## ⚠️ Problème Rencontré en Production

**Symptôme :** Build production échoue ou CSS non pris en compte

**Cause :** Tailwind CSS V4 utilise une nouvelle syntaxe CSS incompatible avec la configuration classique :
- `@import "tailwindcss"` au lieu de `@tailwind base/components/utilities`
- `@plugin "daisyui"` au lieu de `plugins: [require('daisyui')]`
- `@tailwindcss/postcss` au lieu de `tailwindcss` + `autoprefixer`

**Solution :** Retour à Tailwind CSS V3.4.17 (syntaxe stable et testée)

---

## 📋 Changements Effectués

### 1️⃣ **package.json** - Dépendances

**❌ AVANT (Tailwind V4)** :
```json
"devDependencies": {
  "@tailwindcss/postcss": "^4",
  "daisyui": "^5.4.7",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

**✅ APRÈS (Tailwind V3 Stable)** :
```json
"devDependencies": {
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "autoprefixer": "^10.4.20",
  "daisyui": "^4.12.14",
  "eslint": "^9",
  "eslint-config-next": "16.0.1",
  "postcss": "^8.4.49",
  "prisma": "^6.19.0",
  "tailwindcss": "^3.4.17",
  "typescript": "^5"
}
```

**Modifications :**
- `tailwindcss` : `^4` → `^3.4.17` (version stable)
- `daisyui` : `^5.4.7` → `^4.12.14` (compatible V3)
- **Ajout** `autoprefixer` : `^10.4.20` (requis par Tailwind V3)
- **Ajout** `postcss` : `^8.4.49` (explicite)
- **Suppression** `@tailwindcss/postcss` (spécifique V4)

---

### 2️⃣ **tailwind.config.js** - Configuration

**✅ NOUVEAU FICHIER** :
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        wiggle: 'wiggle 1.5s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      'light',
      'dark',
      'retro',
    ],
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
    prefix: '',
    logs: true,
    themeRoot: ':root',
  },
}
```

**Caractéristiques :**
- Configuration **CommonJS** classique (`module.exports`)
- **DaisyUI plugin** via `require('daisyui')` (syntaxe V3)
- **3 thèmes** : `light`, `dark`, `retro`
- **Animation wiggle** déplacée depuis CSS vers config

---

### 3️⃣ **app/globals.css** - Directives CSS

**❌ AVANT (Syntaxe V4)** :
```css
@import "tailwindcss";

@plugin "daisyui" {
  themes: light --default, dark --prefersdark, retro;
}

@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(2deg); }
}

.animate-wiggle {
  animation: wiggle 1.5s ease-in-out infinite;
}
```

**✅ APRÈS (Syntaxe V3)** :
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .animate-wiggle {
    animation: wiggle 1.5s ease-in-out infinite;
  }
}

/* React toastify overrides */
:root {
  --toastify-color-light: #ECE3CA;
  --toastify-text-color-light: #793205;
}
```

**Modifications :**
- `@import "tailwindcss"` → `@tailwind base/components/utilities` (directives V3)
- `@plugin "daisyui" {...}` → Supprimé (config dans `tailwind.config.js`)
- `@keyframes wiggle` → Déplacé dans `tailwind.config.js` (extend.keyframes)
- `@layer utilities` pour `.animate-wiggle` (best practice V3)

---

### 4️⃣ **postcss.config.mjs** - PostCSS

**❌ AVANT (V4)** :
```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

**✅ APRÈS (V3)** :
```javascript
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

**Modifications :**
- `@tailwindcss/postcss` → `tailwindcss` (plugin classique)
- **Ajout** `autoprefixer` (requis pour compatibilité navigateurs)

---

## 🚀 Procédure de Migration

### **Étape 1 : Nettoyage**
```bash
# Supprimer node_modules et package-lock.json
rm -rf node_modules package-lock.json

# Ou sur Windows
rmdir /s /q node_modules
del package-lock.json
```

### **Étape 2 : Installation**
```bash
npm install
```

**Résultat attendu :**
- `tailwindcss@3.4.17` installé
- `daisyui@4.12.14` installé
- `autoprefixer@10.4.20` installé
- Aucune erreur peer dependencies

### **Étape 3 : Build Production**
```bash
npm run build
```

**Résultat attendu :**
```
 ✓ Compiled successfully in 10.4s
 ✓ Finished TypeScript in 5.0s
 ✓ Collecting page data in 713.5ms

🌼   daisyUI 4.12.24
├─ ✔︎ 3 themes added
╰─ ★ Star daisyUI on GitHub

 ✓ Generating static pages (46/46) in 452.8ms
 ✓ Finalizing page optimization in 413.9ms
```

### **Étape 4 : Test Local**
```bash
npm run dev
```

Ouvrez http://localhost:3000 et vérifiez :
- ✅ CSS DaisyUI appliqué correctement
- ✅ Thèmes light/dark fonctionnent
- ✅ Animation wiggle fonctionne
- ✅ Composants stylés correctement

---

## ✅ Vérifications Post-Migration

### **1. Fichiers Modifiés**
- [x] `package.json` - Versions Tailwind V3
- [x] `tailwind.config.js` - Configuration classique
- [x] `app/globals.css` - Directives @tailwind
- [x] `postcss.config.mjs` - Plugins V3

### **2. Build Production**
```bash
npm run build
```
- [x] ✅ Build réussi (0 erreur)
- [x] ✅ 46 pages générées
- [x] ✅ DaisyUI chargé (3 themes added)
- [x] ✅ TypeScript compilé (5.0s)

### **3. Styles Visuels**
- [x] Classes Tailwind appliquées (`bg-`, `text-`, `p-`, etc.)
- [x] Composants DaisyUI stylés (`btn`, `card`, `modal`, etc.)
- [x] Thèmes changeables (light/dark/retro)
- [x] Animation wiggle fonctionne

---

## 🔧 Dépannage

### **Problème : CSS non appliqué**

**Symptôme :** Les classes Tailwind n'ont aucun effet

**Solutions :**
1. Vérifier `content` dans `tailwind.config.js` :
   ```javascript
   content: [
     './app/**/*.{js,ts,jsx,tsx,mdx}',
     './components/**/*.{js,ts,jsx,tsx,mdx}',
   ]
   ```

2. Rebuild le cache Next.js :
   ```bash
   rm -rf .next
   npm run build
   ```

3. Redémarrer le serveur dev :
   ```bash
   npm run dev
   ```

### **Problème : Erreur "Cannot find module 'daisyui'"**

**Solution :**
```bash
npm install daisyui@^4.12.14 --save-dev
```

### **Problème : Erreur "@tailwindcss/postcss"**

**Symptôme :** `Error: Cannot find module '@tailwindcss/postcss'`

**Solution :** Vérifier `postcss.config.mjs` utilise `tailwindcss` (pas `@tailwindcss/postcss`)

```javascript
const config = {
  plugins: {
    tailwindcss: {},    // ✅ Correct
    autoprefixer: {},
  },
};
```

### **Problème : Thèmes DaisyUI non appliqués**

**Solution :** Vérifier `daisyui` section dans `tailwind.config.js` :
```javascript
daisyui: {
  themes: ['light', 'dark', 'retro'],
  darkTheme: 'dark',
}
```

---

## 📚 Références

- **Tailwind CSS V3** : https://v3.tailwindcss.com/docs
- **DaisyUI V4** : https://v4.daisyui.com/
- **PostCSS** : https://postcss.org/
- **Next.js + Tailwind** : https://nextjs.org/docs/app/building-your-application/styling/tailwindcss

---

## 🎯 Résumé

| Élément | Avant (V4) | Après (V3) | Statut |
|---------|-----------|-----------|--------|
| **tailwindcss** | `^4` | `^3.4.17` | ✅ |
| **daisyui** | `^5.4.7` | `^4.12.14` | ✅ |
| **autoprefixer** | ❌ Absent | `^10.4.20` | ✅ |
| **globals.css** | `@import` | `@tailwind` | ✅ |
| **postcss.config** | `@tailwindcss/postcss` | `tailwindcss` | ✅ |
| **tailwind.config** | ❌ Absent | `tailwind.config.js` | ✅ |
| **Build production** | ❌ Erreur | ✅ Succès | ✅ |

**Migration terminée avec succès ! 🎉**

---

## ⏭️ Prochaine Étape

Consultez `NSSM_DEPLOYMENT.md` pour déployer l'application sur Windows avec NSSM (service stable sans crashs PM2).
