# 💰 Budget du Ménage - Jeu Éducatif

Un jeu éducatif interactif pour apprendre aux élèves à gérer un budget de ménage en utilisant des documents financiers réels.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 Table des matières

- [À propos](#à-propos)
- [Fonctionnalités](#fonctionnalités)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Structure du projet](#structure-du-projet)
- [Données sources](#données-sources)
- [Développement](#développement)
- [Déploiement](#déploiement)
- [Tests](#tests)
- [Contribution](#contribution)
- [Licence](#licence)

## 🎯 À propos

Ce projet pédagogique est basé sur le cas réel de Jules et Julie Thirion, un couple gérant leur budget mensuel. L'application aide les élèves à :

1. **Reconnaître les documents justificatifs** (quittances, tickets, factures, extraits bancaires)
2. **Établir un budget mensuel** en classant correctement les montants par rubriques
3. **Répondre à un quiz de compréhension** sur la gestion budgétaire

### Contexte du ménage Thirion

- **Jules** : Ouvrier dans la construction, salaire net de 1 750,00 €/mois
- **Julie** : Demandeuse d'emploi (diplôme d'institutrice maternelle), allocation de 352,52 €/mois
- **Situation** : Couple sans enfant, locataires d'un appartement à Liège (746 €/mois)
- **Budget septembre** : 2 102,52 € d'entrées, 1 750,00 € de sorties, solde positif de 352,52 €

## ✨ Fonctionnalités

### Partie 1 : Identifier les documents (30 points)
- Quiz interactif avec 10 questions
- Visualisation des documents réels extraits du PDF
- Feedback immédiat avec explications
- Modal zoom sur les documents

### Partie 2 : Compléter le budget (40 points)
- Interface drag & drop intuitive
- Galerie de documents avec montants draggables
- Tableau de budget avec calculs automatiques
- Validation différée (correction après tentative)
- Impression du tableau en PDF
- Distinction sorties fixes/variables

### Partie 3 : Quiz final (30 points)
- 5 questions de synthèse
- Questions basées sur la dernière page du PDF source
- Thèmes : budget équilibré, épargne, allocations

### Fonctionnalités techniques
- ✅ Responsive (mobile → desktop)
- ♿ Accessible (WAI-ARIA, navigation clavier)
- 💾 Sauvegarde automatique (localStorage)
- 🖨️ Impression du budget
- 🌍 i18n fr-BE
- 🎨 Interface moderne et intuitive

## 🚀 Installation

### Prérequis

- **Node.js** >= 18 (LTS recommandé)
- **npm** ou **yarn**

### Installation locale

```bash
# Cloner le repository
git clone https://github.com/votre-username/budget-menage-jeu.git
cd budget-menage-jeu

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## 💻 Utilisation

### Commandes disponibles

```bash
# Développement
npm run dev          # Lance le serveur de développement (Vite)

# Production
npm run build        # Crée le build de production dans /dist
npm run preview      # Prévisualise le build

# Tests
npm test             # Lance les tests unitaires
npm run test:ui      # Interface graphique pour les tests

# Linting
npm run lint         # Vérifie la qualité du code
```

### Mode développement

Le mode développement offre :
- Hot Module Replacement (HMR)
- Messages d'erreur détaillés
- Rechargement automatique

### Mode production

Le build de production optimise :
- Minification du code
- Tree-shaking
- Code splitting
- Optimisation des images

## 📁 Structure du projet

```
budget-menage-jeu/
├── public/
│   ├── index.html                    # Point d'entrée HTML
│   └── assets/
│       ├── images/                   # Images extraites du PDF (12 pages)
│       │   ├── page_1.png           # Assurance voiture
│       │   ├── page_2.png           # Restaurant + Quittance loyer
│       │   ├── page_3.png           # Attestation soins
│       │   ├── page_4.png           # Abonnement bus
│       │   ├── page_5.png           # Facture Proximus
│       │   ├── page_6.png           # Ticket IKEA
│       │   ├── page_7.png           # Extrait bancaire
│       │   ├── page_8.png           # Facture papeterie
│       │   ├── page_9.png           # État VISA
│       │   ├── page_10.png          # Ticket Carrefour
│       │   ├── page_11.png          # Tableau budget
│       │   └── page_12.png          # Questions finales
│       └── data/
│           ├── documents.json        # Métadonnées des 11 documents
│           ├── budget.json           # Rubriques et montants attendus
│           └── quiz.json             # Questions parties 1 et 3
├── src/
│   ├── main.js                       # Point d'entrée JS
│   ├── app.js                        # Logique principale
│   ├── ui/
│   │   ├── theme.css                 # Variables CSS et design system
│   │   ├── layout.css                # Layout responsive
│   │   ├── components.css            # Composants UI
│   │   └── print.css                 # Styles d'impression
│   ├── components/
│   │   ├── DocQuiz.js                # Partie 1 : Quiz documents
│   │   ├── BudgetBoard.js            # Partie 2 : Drag & drop budget
│   │   └── FinalQuiz.js              # Partie 3 : Quiz final
│   ├── services/
│   │   ├── scoring.js                # Calcul des scores
│   │   ├── storage.js                # Persistance localStorage
│   │   └── validation.js             # Validation du budget
│   └── utils/
│       ├── dom.js                    # Helpers DOM
│       └── i18n.js                   # Internationalisation fr-BE
├── tests/
│   ├── budget.spec.js                # Tests validation budget
│   ├── quiz-docs.spec.js             # Tests partie 1
│   └── quiz-final.spec.js            # Tests partie 3
├── .github/
│   └── workflows/
│       └── deploy.yml                # CI/CD GitHub Pages
├── extract_pdf.py                    # Script extraction PDF → JSON/images
├── package.json
├── vite.config.js
├── LICENSE                           # MIT
└── README.md                         # Ce fichier
```

## 📊 Données sources

### Mapping PDF → Données

Toutes les données proviennent strictement du PDF source `30 le budget ménage EXERCICE 1 professeur.pdf` :

| Page PDF | Contenu | Document ID | Montant |
|----------|---------|-------------|---------|
| 1 | Assurance voiture AG | `assurance-voiture` | 35,28 € |
| 2 | Restaurant BVBA Aulnenhof | `restaurant` | 50,00 € |
| 2 | Quittance de loyer | `quittance-loyer` | 746,00 € |
| 3 | Attestation de soins (médecin) | `medecin` | 28,25 € |
| 4 | Carte train (bus) | `bus` | 48,50 € |
| 5 | Facture Proximus | `proximus` | 69,18 € |
| 6 | Ticket IKEA | `ikea` | 35,50 € |
| 7 | Extrait bancaire Fortis | `extrait-bancaire` | Multiples |
| 8 | Facture papeterie Maximum | `papeterie` | 57,27 € |
| 9 | État VISA | `visa` | 270,50 € (détaillé) |
| 10 | Ticket Carrefour | `carrefour` | 345,46 € |
| 11-12 | Tableau budget + Questions | - | - |

### Rubriques du budget

**Entrées (2 102,52 €) :**
- Salaire de Jules : 1 750,00 €
- Chômage de Julie : 352,52 €

**Sorties fixes (914,52 €) :**
- Loyer : 746,00 €
- Assurance voiture : 35,28 €
- Proximus : 69,18 €
- Frais de gestion : 2,30 €
- Luminus : 61,76 €

**Sorties variables (835,48 €) :**
- Restaurant : 50,00 €
- Médecin : 28,25 €
- Carte de train : 48,50 €
- IKEA : 35,50 €
- Papeterie : 57,27 €
- Alimentation : 533,46 € (188 + 345,46)
- Habillement : 30,00 €
- Carburant : 52,50 €

**Solde : +352,52 €** (budget positif)

## 🛠️ Développement

### Architecture

L'application utilise une architecture modulaire :

- **Composants** : Classes ES6 avec système d'événements
- **Services** : Logique métier réutilisable
- **Utils** : Fonctions utilitaires pures
- **Séparation des responsabilités** : Chaque module a un rôle précis

### Extraction des données

Le script `extract_pdf.py` (Python + PyMuPDF) :
1. Extrait chaque page du PDF en PNG haute résolution
2. Génère les fichiers JSON avec métadonnées
3. Crée les données de quiz basées sur le PDF

Pour réextraire les données :

```bash
python3 extract_pdf.py
```

### Accessibilité

L'application respecte les normes WCAG 2.1 AA :

- ✅ Navigation clavier complète
- ✅ Attributs ARIA appropriés
- ✅ Annonces pour lecteurs d'écran
- ✅ Contraste couleurs > 4.5:1
- ✅ Focus visible
- ✅ Alternatives textuelles pour images

### Internationalisation

Le système i18n (`utils/i18n.js`) permet :
- Traductions fr-BE (défaut)
- Formatage des nombres/devises localisé
- Extension facile à d'autres langues

## 🚀 Déploiement

### GitHub Pages (automatique)

Le projet se déploie automatiquement via GitHub Actions :

1. **Activer GitHub Pages** :
   - Settings → Pages → Source : GitHub Actions

2. **Push sur main** :
   ```bash
   git push origin main
   ```

3. L'application sera disponible sur :
   ```
   https://votre-username.github.io/budget-menage-jeu/
   ```

### Déploiement manuel

```bash
# Build de production
npm run build

# Le dossier /dist contient l'application prête
# Déployer sur n'importe quel hébergement statique
```

### Autres plateformes

#### Netlify
```bash
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
```

#### Vercel
```bash
vercel --prod
```

## 🧪 Tests

Les tests utilisent Vitest :

```bash
# Lancer tous les tests
npm test

# Mode watch
npm test -- --watch

# Interface graphique
npm run test:ui

# Coverage
npm test -- --coverage
```

### Types de tests

- **Unit tests** : Services (scoring, validation, storage)
- **Integration tests** : Composants
- **E2E** (à venir) : Parcours utilisateur complets

## 🤝 Contribution

Les contributions sont bienvenues !

### Workflow

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit (`git commit -m 'Ajout fonctionnalité'`)
4. Push (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

### Guidelines

- Code ES6+ moderne
- Respecter l'architecture existante
- Ajouter des tests pour les nouvelles fonctionnalités
- Commenter le code complexe
- Suivre les conventions de nommage

## 📝 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👨‍🏫 Auteur

**G.Depret** - Économie de l'entreprise

---

## 📞 Support

Pour toute question ou problème :

- Ouvrir une [issue](https://github.com/votre-username/budget-menage-jeu/issues)
- Consulter la [documentation](https://github.com/votre-username/budget-menage-jeu/wiki)

## 🎓 Utilisation pédagogique

Ce projet est conçu pour l'enseignement et peut être :
- Utilisé tel quel en classe
- Adapté à d'autres situations budgétaires
- Étendu avec de nouvelles fonctionnalités
- Traduit dans d'autres langues

---

⭐ Si ce projet vous aide, n'hésitez pas à lui donner une étoile !
