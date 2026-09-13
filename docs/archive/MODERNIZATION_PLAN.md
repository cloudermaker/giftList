# Plan de Modernisation de la Base de Données

## Vue d'ensemble

Refonte complète du schéma Prisma pour:
- ✅ Multi-groupes: un user peut appartenir à plusieurs groupes
- ✅ Sous-cadeaux: système parent/enfant (ex: manga avec plusieurs tomes)
- ✅ Séparation des types de cadeaux (wishlist vs cadeaux personnels)
- ✅ Migration des données de production sans perte
- ✅ Upgrade Prisma 5.10 → 5.22+

## Architecture Cible

### Tables Principales

**UserGroupMapping** (nouvelle)
- Relation many-to-many users ↔ groupes
- Permet appartenance multi-groupes
- Champs: id, userId, groupId, role (MEMBER/ADMIN), joinedAt

**User** (modifié)
- ❌ Suppression: groupId, group relation directe
- ✅ Ajout: groupMemberships[] (UserGroupMapping)

**Gift** (refactorisé)
- ✅ Ajout: giftType (SIMPLE/MULTIPLE), parentGiftId, subGifts[]
- ❌ Suppression: takenUserId, takenUser relation
- ✅ Champ userId devient obligatoire (non-nullable)

**UserTakenGift** (nouvelle)
- Table de liaison pour réservations
- Champs: id, userId, giftId, takenAt
- Remplace le champ Gift.takenUserId

**PersonalGift** (nouvelle)
- Cadeaux qu'un user apporte (ex: chocolats pour offrir)
- Actuellement: Gift avec userId=null
- Champs: id, name, description, url, userId, forUserId, groupId

## Phases d'Implémentation

### Phase 1: Préparation (CRITIQUE)
1. Backup production: `pg_dump -h HOST -U USER -d DATABASE > backup_$(date +%Y%m%d_%H%M%S).sql`
2. Créer environnement staging avec copie exacte des données
3. Documenter statistiques:
   ```sql
   SELECT COUNT(*) FROM "User";
   SELECT COUNT(*) FROM "Gift";
   SELECT COUNT(*) FROM "Group";
   SELECT COUNT(*) FROM "Gift" WHERE "takenUserId" IS NOT NULL;
   SELECT COUNT(*) FROM "Gift" WHERE "userId" IS NULL;
   ```
4. Git: `git checkout -b feat/database-modernization` ✅ FAIT

### Phase 2: Upgrade Prisma
```bash
npm install prisma@^5.22.0 @prisma/client@^5.22.0 --save-dev
npx prisma generate
npx prisma validate
npm run dev  # Tester que ça fonctionne
```

### Phase 3: Script de Migration (voir migration/modernize_schema.js)
- Transformer User.groupId → UserGroupMapping
- Séparer Gift en Gift + PersonalGift
- Transformer Gift.takenUserId → UserTakenGift
- Initialiser giftType = SIMPLE pour tous

### Phase 4: Appliquer Schéma (voir prisma/schema.new.prisma)
```bash
npx prisma migrate dev --name modernize_database --create-only
# Éditer le fichier SQL généré pour intégrer la transformation
npx prisma migrate deploy  # Sur staging d'abord!
```

### Phase 5-7: Refactoring Code
- **27 locations** dans 13 fichiers à modifier
- Nouveaux managers: userGroupManager, userTakenGiftManager, personalGiftManager
- Nouveaux endpoints API pour sous-cadeaux et cadeaux personnels
- UI: GroupSelector, SubGiftList components

### Phase 8-9: Tests et Déploiement
- Tests unitaires + E2E
- Déploiement avec fenêtre de maintenance
- Monitoring post-déploiement

## Décisions Clés

| Question | Décision | Raison |
|----------|----------|--------|
| Multi-groupes | UserGroupMapping table | Flexibilité, scalabilité |
| Wishlist par groupe? | NON - wishlist unique | Simplicité, cohérence |
| Réservation sub-gifts | Hybride: parent OU individuel | Flexibilité maximale |
| Migration données | Préservation totale | Production |
| Rollback | pg_dump restore | Sécurité |

## Fichiers Impactés

### À créer (10)
- lib/db/userGroupManager.ts
- lib/db/userTakenGiftManager.ts
- lib/db/personalGiftManager.ts
- pages/api/userGroup.ts
- pages/api/personalGift/index.ts
- pages/api/personalGift/[...id].ts
- pages/api/gift/[id]/subgifts.ts
- components/SubGiftList.tsx
- components/GroupSelector.tsx
- migration/modernize_schema.js ✅

### À modifier (13)
- prisma/schema.prisma
- lib/db/userManager.ts
- lib/db/giftManager.ts
- pages/api/authenticate.ts
- pages/api/gift/index.ts
- pages/api/user/index.ts
- pages/giftList/[...id].tsx
- pages/takenGiftList/[...id].tsx
- components/layout.tsx
- components/customHeader.tsx
- lib/auth/authService.ts
- lib/hooks/useCurrentUser.ts
- pages/home.tsx

## Risques et Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Perte de données migration | CRITIQUE | Backup + dry-run staging |
| Downtime prolongé | ÉLEVÉ | Fenêtre maintenance + tests |
| Bugs post-déploiement | MOYEN | Tests E2E + monitoring |
| Incompatibilité Prisma | FAIBLE | Tester upgrade en dev |

## Timeline Estimé

- Phase 1-2: 1 jour (préparation + upgrade)
- Phase 3-4: 2-3 jours (script migration + schéma)
- Phase 5-7: 5-7 jours (refactoring code)
- Phase 8: 2-3 jours (tests)
- Phase 9: 1 jour (déploiement)

**Total: 11-15 jours**

## Vérifications Post-Migration

### Automatisées
1. `npm run build` — pas d'erreurs TypeScript
2. `npx prisma validate` — schéma valide
3. `npx prisma migrate diff` — migration appliquée correctement
4. Jest tests des database managers (à créer)
5. Script de vérification post-migration:
   - COUNT records dans chaque table
   - Vérifier contraintes d'intégrité (aucun orphelin)
   - Comparer MD5 des IDs avant/après migration

### Manuelles sur staging
1. Créer user "Alice" et l'ajouter aux groupes "Famille" et "Amis"
2. Sur contexte "Famille", créer cadeau "Naruto" type MULTIPLE avec 3 sub-gifts (Tome 1, 2, 3)
3. User "Bob" prend "Naruto" parent → vérifier que les 3 tomes sont pris automatiquement
4. Bob libère Naruto → vérifier que les 3 tomes sont libérés
5. Bob prend uniquement "Tome 1" → vérifier qu'il peut prendre juste celui-là
6. Alice crée cadeau personnel "Chocolats" → doit apparaître dans takenGiftList
7. Switcher Alice vers groupe "Amis" → vérifier que sa wishlist reste la même
8. Tester toutes les opérations CRUD sur gifts/subgifts/personalGifts
9. Vérifier que l'authentification fonctionne avec multi-groupes
10. Tester autorisations (non-admin ne peut pas modifier gift d'autrui, etc.)

### Validation production
1. Exécuter script de comptage: vérifier que `COUNT(User)`, `COUNT(Gift)` identiques avant/après
2. Vérifier échantillon de 10 users: tous ont leurs groupes dans UserGroupMapping
3. Vérifier échantillon de 10 gifts "taken": tous ont entry dans UserTakenGift
4. Vérifier que tous les gifts avec `userId=null` ont migré vers PersonalGift
5. Logs: aucun runtime error pendant 15min après déploiement

## Périmètre

### Inclus
- Upgrade Prisma 5.10 → 5.22+
- Nouveau schéma avec 4 nouvelles tables/relations
- Migration complète des données existantes
- Refactor de 27 locations dans 13 fichiers
- Nouveaux managers et endpoints pour sub-gifts et personal gifts
- UI pour créer/gérer sub-gifts
- Sélecteur de groupe dans l'interface

### Exclu (futures améliorations)
- ❌ Wishlist séparée par groupe (décision: wishlist unique)
- ❌ Historique des réservations (qui a pris quand)
- ❌ Notifications quand cadeau pris/libéré
- ❌ Quantités sur sub-gifts (ex: Tome 1 x2 exemplaires)
- ❌ Partage de cadeaux entre users (co-wishlist)
- ❌ Images sur sub-gifts (seulement sur parents)
- ❌ Permissions granulaires par groupe (tous les membres = même niveau)

## Considérations Supplémentaires

### Performance
Avec sub-gifts et multi-groupes, certaines queries seront plus complexes. Considérer:
- Indexes sur `Gift.parentGiftId`, `UserTakenGift.userId`, `UserTakenGift.giftId`
- Query optimization avec `include` Prisma pour éviter N+1
- Pagination si nombre de gifts très élevé

### Backward Compatibility
Si déploiement graduel, considérer feature flags pour activer progressivement sub-gifts UI

### Documentation Post-Déploiement
Documenter dans README:
- Nouveau modèle de données avec diagramme ER
- Guide utilisation sub-gifts pour utilisateurs finaux
- API changes pour futurs développeurs

## Ressources

- [Prisma Multi-schema](https://www.prisma.io/docs/guides/database/multi-schema)
- [Self-relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations/self-relations)
- [Migration Guide](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
