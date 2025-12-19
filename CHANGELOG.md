# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

## [3.8.3] - 2025-12-19

### Amélioré

- Optimisation SEO (H1, meta descriptions, titres)

## [3.8.2] - 2025-12-09

### Ajouté

- Affichage du nom de celui qui a pris le cadeau
- Permet de cacher ou afficher le nom de celui qui prend le cadeau

## [3.8.1] - 2025-12-08

### Corrigé

- Mise à jour des dépendances (Next.js, Nodemailer, eslint-config-next)
- Correction de vulnérabilités de sécurité

## [3.8.0] - 2025-11-27

### Ajouté

- Générateur d'idées cadeaux avec suggestions basées sur mots-clés
- 40+ catégories de cadeaux (sport, yoga, tech, gaming, jardinage, cuisine, mode, etc.)
- Suggestions personnalisées selon l'âge, le genre et les centres d'intérêt
- Composant GiftIdeasGenerator réutilisable sur pages index et home

### Modifié

- Amélioration responsive de la page groupe (mobile-friendly)
- Espacement du lien version dans le footer mobile

## [3.7.0] - 2025-11-26

### Ajouté

- Cadeaux personnels : possibilité d'ajouter des cadeaux non associés à un utilisateur
- Séparation visuelle entre "Cadeaux réservés" et "Mes cadeaux personnels"
- Sélection multiple de cadeaux avec suppression groupée
- Validation pour empêcher les emojis dans les noms de groupe
- Page changelog dynamique affichant l'historique des versions
- Documentation complète du projet dans le dossier .rules/ (overview, conventions, patterns, database)
- Liens vers la page changelog depuis le footer
- Intégration Vercel Analytics pour le suivi des statistiques

### Modifié

- Refactorisation des states dans takenGiftList pour une meilleure maintenabilité

### Corrigé

- Correction de l'erreur lors de la création de cadeaux sans ID (upsertGift)
- Correction du mapping des cadeaux pour préserver null quand user est null

### Sécurité

- Mise à jour de js-yaml de 4.1.0 vers 4.1.1

## [3.6.0] - 2025-11-18

### Ajouté

- Amélioration SEO : meta tags optimisés, sitemap mis à jour, structured data enrichi
- Page d'accueil redesignée avec sections enrichies (témoignages, FAQ, cas d'usage)

### Modifié

- Amélioration de l'UI des témoignages avec cartes colorées
- Indicateurs de confiance transformés en grille de cartes
- Amélioration de la lisibilité du texte sur la page d'accueil

## [3.5.0] - 2025-11-06

### Ajouté

- Écran de confirmation d'envoi d'email amélioré

### Modifié

- Amélioration de la page de contact
- Refonte complète de la page "Nous contacter"

### Corrigé

- Correction du système d'envoi d'emails (mailsender)

## [3.4.0] - 2025-11-05

### Ajouté

- Banner de cookies avec gestion du consentement
- Image de connexion personnalisée

### Corrigé

- Retrait de l'image aléatoire au login

## [3.3.0] - 2025-10-06

### Ajouté

- Nouvelle page de contact améliorée
- Écran de confirmation d'envoi d'email amélioré
- Banner de cookies avec gestion du consentement

### Modifié

- Migration de SendGrid vers MailerSend pour l'envoi d'emails
- Amélioration du système d'envoi d'emails
- Logo et refonte de l'affichage utilisateur connecté

### Corrigé

- Correction de l'envoi d'emails
- Retrait de l'image aléatoire au login

## [3.2.0] - 2025-10-04

### Modifié

- Mise à jour de la version Node.js

### Corrigé

- Tri des cadeaux par ordre
- Amélioration de l'écran admin
- Correction du postinstall
- Suppression des console.log

## [3.1.0] - 2025-06-12

### Ajouté

- Refonte complète du design de l'application
- Amélioration du SEO avec meta tags
- Barre de progression NProgress

### Corrigé

- Dropdown responsive sur mobile
- Boutons de la liste de cadeaux
- Footer amélioré

## [2.3.0] - 2025-01-23

### Ajouté

- Système d'envoi d'emails intégré
- Documentation améliorée

### Corrigé

- Meilleure gestion des erreurs d'envoi d'email
- Suppression des console.log

## [2.2.0] - 2024-10-29

### Ajouté

- Date de création affichée en mode admin
- Middleware de redirection amélioré

### Modifié

- Mise à jour de Next.js

### Corrigé

- Problème de build
- Redirection du middleware

## [2.1.2] - 2024-04-29

### Corrigé

- Ajout de marges manquantes sur tous les boutons

## [2.1.1] - 2024-04-29

### Corrigé

- Ajout de la largeur manquante pour l'icône burger

## [2.1.0] - 2024-04-03

### Ajouté

- robots.txt et sitemap.xml pour les crawlers Google
- Numéro de version dans le footer
- Pages Contact et Aide
- Meta tags pour optimiser le SEO
- Icônes et structured data (JSON-LD)
- Support Facebook et Twitter
- Canonical URLs

### Modifié

- Nouvelle page d'accueil avec branding amélioré
- Design de la page de contact

## [2.0.1] - 2024-04-12

### Ajouté

- Page d'accueil personnalisée
- Mode administrateur
- Système de mot de passe pour les groupes

### Corrigé

- Problème de build
- Design du backoffice

## [1.1.2] - 2023-11-29

### Ajouté

- Affichage des nouveaux arrivants sur la page d'accueil

## [1.1.1] - 2023-11-27

### Modifié

- Désactivation du réordonnancement quand ce n'est pas votre liste
- Optimisation du line-through

## [1.1.0] - 2023-11-24

### Ajouté

- Drag & drop pour réorganiser les cadeaux
- Position sauvegardée dans la base de données
- Médailles pour les 3 premiers cadeaux
- Support tactile pour téléphones

### Modifié

- Formatage du code appliqué

## [1.0.0] - 2023-10-30

### Ajouté

- Spinner de chargement
- Trim des espaces dans les formulaires
- Gestion des dates d'événements

### Modifié

- Mise à jour des packages
- Correction d'espaces/casse lors de la connexion

## [0.9.0] - 2024-01-24

### Modifié

- Suppression du concept de "familles"
- Refonte des pages et APIs
- Transformation vers une API REST
- Migration vers Prisma ORM

### Ajouté

- API REST pour les groupes
- API REST pour les utilisateurs
- Routes REST pour les cadeaux
- Schéma Prisma

## [0.5.0] - 2022-12-21

### Ajouté

- Bouton de mise à jour dans la liste de cadeaux
- Possibilité d'ajouter des cadeaux pour d'autres utilisateurs
- Prettier pour le formatage
- Mode nuit
- Mise à jour des utilisateurs de famille

### Corrigé

- Problème de redirection vers la page de cadeaux
- Bug sur le timer

## [0.4.0] - 2022-12-14

### Ajouté

- Affichage de l'utilisateur connecté
- Compte à rebours
- Style amélioré

### Modifié

- Optimisations de performance
- Mise à jour du style

## [0.3.0] - 2022-12-12

### Ajouté

- Page d'accueil
- Page de liste de cadeaux
- Page des utilisateurs de famille
- Système de blocage/déblocage des cadeaux
- Footer

### Modifié

- Redirection vers home quand les cookies sont OK

### Corrigé

- Problèmes de build

## [0.2.0] - 2022-12-10

### Ajouté

- Connexion à la base de données
- Gestionnaire de base de données
- Header de l'application

## [0.1.0] - 2022-12-03

### Ajouté

- Appels API
- Structure initiale du projet
- Configuration de base
