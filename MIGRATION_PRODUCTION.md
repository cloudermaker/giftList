# 🚀 Migration v4.0.0 - Guide Production

## Avant la migration

### 1. Backup Neon (OBLIGATOIRE)
- Se connecter à [Neon Console](https://console.neon.tech/)
- Sélectionner votre projet
- Onglet **Backups** → **Create backup**
- Noter l'heure du backup

---

## Procédure de migration

### 2. Activer le mode maintenance

**En local (test)** :
```bash
npm run maintenance:on
```

**En production (Vercel)** :
1. Aller sur **Vercel Dashboard**
2. Sélectionner votre projet
3. **Settings** → **Environment Variables**
4. Ajouter : `MAINTENANCE_MODE` = `true`
5. **Save** puis **Redeploy**

Vérifier que la page de maintenance s'affiche : https://your-domain.com

### 3. Exécuter la migration SQL

```bash
# Remplacer YOUR_NEON_URL par votre vraie URL de connexion
psql "YOUR_NEON_DATABASE_URL" -f migration/migrate_v4.sql
```

**Où trouver l'URL ?**
- Neon Console → votre projet → **Connection Details**
- Copier la **Connection string** (format pooler)

Le script affichera :
- ✅ Enum Role créé
- ✅ Enum GiftType créé
- ✅ Tables et colonnes créées
- ✅ X utilisateurs migrés vers UserGroupMapping
- ✅ X réservations migrées vers UserTakenGift
- ✅ X cadeaux personnels migrés vers PersonalGift
- ✅ Validation réussie
- ✅ MIGRATION v4.0.0 TERMINÉE AVEC SUCCÈS

**Durée** : < 1 minute

### 4. Générer le client Prisma

**En local** :
```bash
npx prisma generate
```

**En production (Vercel)** :
Automatique au redéploiement (script `postinstall`)

### 5. Désactiver le mode maintenance

**En local** :
```bash
npm run maintenance:off
```

**En production (Vercel)** :
1. **Settings** → **Environment Variables**
2. Supprimer `MAINTENANCE_MODE`
3. **Save** puis **Redeploy**

---

## Tests post-migration

### Fonctionnalités à tester :
- ✅ Login / Logout
- ✅ Créer un cadeau
- ✅ Modifier un cadeau
- ✅ Supprimer un cadeau
- ✅ Réserver un cadeau (prendre)
- ✅ Annuler une réservation
- ✅ Ajouter un utilisateur au groupe
- ✅ Retirer un utilisateur du groupe
- ✅ Voir les cadeaux pris

---

## Cleanup final (J+2)

⚠️ **ATTENDRE 24-48h** et valider que **TOUT** fonctionne parfaitement

Une fois certain :

1. Éditer [migration/migrate_v4.sql](./migration/migrate_v4.sql)
2. Chercher la section commentée :
   ```sql
   -- ÉTAPE 5 (OPTIONNELLE): CLEANUP DES ANCIENNES COLONNES
   ```
3. **Décommenter** toute la section
4. Réexécuter :
   ```bash
   psql "YOUR_NEON_DATABASE_URL" -f migration/migrate_v4.sql
   ```

Cette étape supprime définitivement :
- `Gift.takenUserId` (ancienne colonne)
- `User.groupId` (ancienne colonne)

⚠️ **IRRÉVERSIBLE** - Ne pas faire avant validation complète !

---

## Rollback en cas de problème

### Si la migration échoue
Le script utilise une **transaction** - tout est annulé automatiquement (ROLLBACK).
Aucune action nécessaire.

### Si problème après migration réussie
1. **Neon Console** → **Backups**
2. Sélectionner le backup pré-migration
3. **Restore**
4. Redéployer l'ancienne version (v3.x.x)

---

## Récapitulatif

| Étape | Action | Durée | Critique |
|-------|--------|-------|----------|
| 1 | Backup Neon | 1 min | ⚠️ OUI |
| 2 | Mode maintenance ON | 2 min | ℹ️ Optionnel |
| 3 | Exécuter migrate_v4.sql | < 1 min | ⚠️ OUI |
| 4 | Générer Prisma | 30s | ⚠️ OUI |
| 5 | Mode maintenance OFF | 2 min | ℹ️ Optionnel |
| 6 | Tests | 5 min | ⚠️ OUI |
| 7 | Cleanup (J+2) | 30s | ℹ️ Plus tard |

**Durée totale** : ~10 minutes

---

## Support

En cas de problème :
1. Vérifier les logs de la migration
2. Consulter ce guide
3. Restaurer le backup Neon si nécessaire

✅ **Prêt pour la production !**
