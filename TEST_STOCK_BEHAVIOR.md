# 🧪 **Test du Comportement Actuel**

Pour tester le comportement, vous pouvez suivre ces étapes :

## 📝 **Étapes de Test**

### **Test 1 : Comprendre le comportement actuel**
1. Ouvrir le modal Stock
2. Sélectionner un produit avec stock = 100
3. Observer que le champ "Nouvelle quantité" est pré-rempli avec **100**
4. Changer la valeur à **50**
5. Observer l'affichage: **"-50 (Réduction)"**
6. Cliquer "Mettre à jour le stock"
7. **Résultat attendu par l'utilisateur**: Stock = 50
8. **Résultat réel**: Stock = 150 (100 + 50)

### **Test 2 : Confirmer le problème**
1. Produit avec stock = 200
2. Saisir **300** comme "nouvelle quantité"
3. L'interface affiche: **"+100 (Ajout)"**
4. Après soumission: Stock = 500 (200 + 300) au lieu de 300

### **Test 3 : Cas d'erreur**
1. Produit avec stock = 100
2. Saisir **-20** (pour réduire de 20)
3. **Erreur**: "La quantité à ajouter doit être supérieure à zéro"
4. **Impossible** de réduire le stock

## 🎯 **Observations Attendues**

- ❌ L'interface dit "Nouvelle quantité" mais traite comme "Ajout au stock"
- ❌ Impossible de réduire le stock via l'interface
- ❌ Les calculs d'affichage sont corrects mais le backend ne les suit pas
- ❌ Pré-remplissage avec le stock actuel = confusant

## 💡 **Conclusion**
Le problème est confirmé : **incohérence entre l'interface et le backend**.