# Module documents — Phase 1 : CV

Première brique du moteur documentaire du cahier des charges. Volontairement
scopée au CV (réutilisable telle quelle par le futur module Recherche
d'emploi pour les "CV ciblés par offre") plutôt que de démarrer par une
abstraction générique pour tous les types de documents (lettres, rapports,
livres...) avant d'avoir un cas d'usage réel qui la justifie.

## Où c'est implémenté

- `packages/documents/src/resume/types.ts` — `ResumeData` : contrat structuré
  (contact, résumé, expériences, formation, compétences, langues, locale
  fr/en). C'est la source de vérité ; PDF et DOCX en dérivent tous les deux.
- `packages/documents/src/resume/pdf.tsx` — rendu PDF via `@react-pdf/renderer`
  (template sobre, une page, couleurs Apex).
- `packages/documents/src/resume/docx.ts` — rendu DOCX via la librairie
  `docx`, même structure de sections.
- `packages/documents/src/resume/labels.ts` — libellés de sections fr/en.
- `apps/web/prisma/schema.prisma` — modèle `Resume` (userId, title, data
  JSON, locale).
- `apps/web/src/app/api/documents/resumes/*` — CRUD (liste, création,
  lecture, mise à jour, suppression).
- `apps/web/src/app/api/documents/resumes/[id]/export/route.ts` — export
  `?format=pdf` ou `?format=docx`, streamé directement (pas de fichier
  temporaire sur disque).
- `apps/web/src/app/documents/resume/*` + `src/components/documents/*` — UI :
  liste des CV, éditeur avec sections dynamiques (ajout/suppression
  d'expériences, formations), export en un clic.

## Pourquoi pas Pandoc / LibreOffice headless

Le cahier des charges mentionne Pandoc comme option. Choix fait ici :
librairies JS pures (`@react-pdf/renderer`, `docx`) plutôt qu'un binaire
externe — évite une dépendance système supplémentaire au déploiement
(conteneur plus simple, pas de risque de version Pandoc incompatible). Si un
futur module a besoin de conversions de formats plus larges (Markdown → PDF
générique, EPUB...), Pandoc redevient pertinent et pourra être ajouté comme
worker séparé sans toucher à ce module.

## Ce qui manque encore

- Lettres de motivation, rapports, autres types de documents (structure
  prête à être répliquée : un type de données + un renderer PDF + un
  renderer DOCX par type de document).
- Templates visuels multiples (un seul template CV pour l'instant).
- Génération assistée par IA du contenu (résumé, reformulation des
  réalisations) — viendra avec le module Recherche d'emploi / Career
  Copilot, qui réutilisera `ResumeData` tel quel.
- Export EPUB / Markdown / HTML.
