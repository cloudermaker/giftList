# Migration

## 📁 Fichiers historiques

Ce dossier contient les scripts de migration historiques pour référence :

- **init.js** - Script d'initialisation de la base de données (première version)
- **add_position.js** - Migration pour ajouter la colonne `order` aux cadeaux

## ✅ État actuel

La base de données est en **v4.0.0** avec :
- ✅ Tables `UserGroupMapping`, `UserTakenGift`, `PersonalGift`
- ✅ Enums `Role`, `GiftType`
- ✅ Relations many-to-many User ↔ Group
- ✅ Système de réservation via UserTakenGift
- ✅ Cadeaux personnels via PersonalGift

## 🚀 Nouvelles migrations

Pour créer une nouvelle migration :

1. Créer un fichier SQL descriptif : `migration/add_feature_xyz.sql`
2. Utiliser une transaction :
```sql
BEGIN;
-- Vos modifications ici
COMMIT;
```
3. Tester en local
4. Exécuter en production :
```bash
psql "YOUR_NEON_DATABASE_URL" -f migration/add_feature_xyz.sql
```
5. Commit le fichier pour historique
