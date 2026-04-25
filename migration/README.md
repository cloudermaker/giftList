# Migration v4.0.0

## 📋 Procédure de migration en production

### 1. Backup (Neon Console)
Créer un backup manuel via Neon Console avant toute opération.

### 2. Mode maintenance (optionnel)
```bash
# Activer le mode maintenance
npm run maintenance:on

# Vérifier que la page de maintenance s'affiche
# Ouvrir: https://your-domain.com
```

### 3. Exécuter la migration
```bash
psql "YOUR_NEON_DATABASE_URL" -f migration/migrate_v4.sql
```

Le script affichera sa progression et validera automatiquement les données.

### 4. Générer Prisma
```bash
npx prisma generate
```

### 5. Redémarrer l'application
```bash
# Désactiver le mode maintenance
npm run maintenance:off

# Redémarrer l'application (selon votre déploiement)
```

### 6. Tester
- Login/logout
- Créer/modifier/supprimer un cadeau
- Réserver un cadeau
- Gérer les utilisateurs d'un groupe

### 7. Cleanup (J+2 après validation)
Une fois que tout fonctionne parfaitement pendant 24-48h :
1. Éditer `migration/migrate_v4.sql`
2. Décommenter la section **ÉTAPE 5 (OPTIONNELLE): CLEANUP**
3. Réexécuter : `psql "YOUR_NEON_DATABASE_URL" -f migration/migrate_v4.sql`

⚠️ Cette étape supprime définitivement `Gift.takenUserId` et `User.groupId`

## 🔄 Rollback en cas de problème
Si la migration échoue, tout est annulé automatiquement (transaction).
Si besoin de revenir en arrière après succès : restaurer le backup Neon.

## 📁 Fichiers
- **migrate_v4.sql** - Script de migration complet (création tables + migration données + validation)
- **add_position.js** - Ancienne migration (historique)
- **init.js** - Initialisation initiale (historique)
