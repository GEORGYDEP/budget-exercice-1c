#!/usr/bin/env python3
"""
Script d'extraction des images et données depuis le PDF source
"""
import fitz  # PyMuPDF
import json
import os
from pathlib import Path

def extract_images_from_pdf(pdf_path, output_dir):
    """Extrait les images et crée des captures d'écran de chaque page"""
    doc = fitz.open(pdf_path)
    
    # Créer le répertoire de sortie
    images_dir = Path(output_dir) / "images"
    images_dir.mkdir(parents=True, exist_ok=True)
    
    extracted_images = []
    
    # Extraire chaque page comme image
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # Convertir la page en image (haute résolution)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom pour meilleure qualité
        
        # Sauvegarder la page complète
        page_filename = f"page_{page_num + 1}.png"
        page_path = images_dir / page_filename
        pix.save(str(page_path))
        
        extracted_images.append({
            "page": page_num + 1,
            "filename": page_filename,
            "path": f"assets/images/{page_filename}"
        })
        
        print(f"✓ Page {page_num + 1} extraite: {page_filename}")
    
    doc.close()
    return extracted_images

def create_documents_json(output_dir):
    """Crée le fichier documents.json avec les métadonnées"""
    documents = [
        {
            "id": "assurance-voiture",
            "titre": "Avis d'échéance assurance voiture",
            "type": "quittance_assurance",
            "pagePDF": 1,
            "imagePath": "assets/images/page_1.png",
            "montants": [35.28],
            "libelles": ["Assurance voiture Ford Fiesta", "Responsabilité civile + Providis"]
        },
        {
            "id": "restaurant",
            "titre": "Souche TVA restaurant",
            "type": "ticket_restaurant",
            "pagePDF": 2,
            "imagePath": "assets/images/page_2.png",
            "montants": [50.00],
            "libelles": ["Restaurant BVBA AULNENHOF"]
        },
        {
            "id": "quittance-loyer",
            "titre": "Quittance de loyer",
            "type": "quittance_loyer",
            "pagePDF": 2,
            "imagePath": "assets/images/page_2.png",
            "montants": [746.00],
            "libelles": ["Loyer appartement septembre"]
        },
        {
            "id": "medecin",
            "titre": "Attestation de soins",
            "type": "attestation_soins",
            "pagePDF": 3,
            "imagePath": "assets/images/page_3.png",
            "montants": [28.25],
            "libelles": ["Médecin générale - Dr. Lumen Marcelle"]
        },
        {
            "id": "bus",
            "titre": "Abonnement bus",
            "type": "carte_transport",
            "pagePDF": 4,
            "imagePath": "assets/images/page_4.png",
            "montants": [48.50],
            "libelles": ["Carte train 2e classe Liège-Hannut"]
        },
        {
            "id": "proximus",
            "titre": "Facture Proximus",
            "type": "facture_telephone",
            "pagePDF": 5,
            "imagePath": "assets/images/page_5.png",
            "montants": [69.18],
            "libelles": ["Abonnement et communications téléphone"]
        },
        {
            "id": "ikea",
            "titre": "Ticket de caisse IKEA",
            "type": "ticket_caisse",
            "pagePDF": 6,
            "imagePath": "assets/images/page_6.png",
            "montants": [35.50],
            "libelles": ["Meuble TV et vase"]
        },
        {
            "id": "extrait-bancaire",
            "titre": "Extrait bancaire",
            "type": "extrait_compte",
            "pagePDF": 7,
            "imagePath": "assets/images/page_7.png",
            "montants": [352.52, 2.30, 61.76],
            "libelles": ["Virement salaire", "Frais de gestion", "Luminus électricité"]
        },
        {
            "id": "papeterie",
            "titre": "Facture papeterie",
            "type": "facture",
            "pagePDF": 8,
            "imagePath": "assets/images/page_8.png",
            "montants": [57.27],
            "libelles": ["Maximum SA - fournitures de bureau"]
        },
        {
            "id": "visa",
            "titre": "État des dépenses VISA",
            "type": "releve_carte",
            "pagePDF": 9,
            "imagePath": "assets/images/page_9.png",
            "montants": [12.00, 20.00, 18.00, 52.50, 168.00],
            "libelles": ["Minimode", "Quick", "H&M", "Essence", "Carrefour alimentation"]
        },
        {
            "id": "carrefour",
            "titre": "Ticket de caisse Carrefour",
            "type": "ticket_supermarche",
            "pagePDF": 10,
            "imagePath": "assets/images/page_10.png",
            "montants": [345.46],
            "libelles": ["Courses alimentaires détaillées"]
        }
    ]
    
    data_dir = Path(output_dir) / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    
    with open(data_dir / "documents.json", "w", encoding="utf-8") as f:
        json.dump(documents, f, ensure_ascii=False, indent=2)
    
    print(f"✓ documents.json créé avec {len(documents)} documents")
    return documents

def create_budget_json(output_dir):
    """Crée le fichier budget.json avec les rubriques"""
    budget = {
        "entrees": [
            {
                "type": "revenu",
                "libelle": "Salaire de Jules",
                "montantAttendu": 1750.00,
                "sourceDocId": "extrait-bancaire"
            },
            {
                "type": "allocation",
                "libelle": "Chômage de Julie",
                "montantAttendu": 352.52,
                "sourceDocId": "extrait-bancaire"
            }
        ],
        "sorties_fixes": [
            {
                "type": "fixe",
                "libelle": "Loyer",
                "montantAttendu": 746.00,
                "sourceDocId": "quittance-loyer"
            },
            {
                "type": "fixe",
                "libelle": "Assurance voiture",
                "montantAttendu": 35.28,
                "sourceDocId": "assurance-voiture"
            },
            {
                "type": "fixe",
                "libelle": "Proximus",
                "montantAttendu": 69.18,
                "sourceDocId": "proximus"
            },
            {
                "type": "fixe",
                "libelle": "Frais de gestion",
                "montantAttendu": 2.30,
                "sourceDocId": "extrait-bancaire"
            },
            {
                "type": "fixe",
                "libelle": "Luminus",
                "montantAttendu": 61.76,
                "sourceDocId": "extrait-bancaire"
            }
        ],
        "sorties_variables": [
            {
                "type": "variable",
                "libelle": "Restaurant",
                "montantAttendu": 50.00,
                "sourceDocId": "restaurant"
            },
            {
                "type": "variable",
                "libelle": "Médecin",
                "montantAttendu": 28.25,
                "sourceDocId": "medecin"
            },
            {
                "type": "variable",
                "libelle": "Carte de train",
                "montantAttendu": 48.50,
                "sourceDocId": "bus"
            },
            {
                "type": "variable",
                "libelle": "IKEA",
                "montantAttendu": 35.50,
                "sourceDocId": "ikea"
            },
            {
                "type": "variable",
                "libelle": "Papeterie",
                "montantAttendu": 57.27,
                "sourceDocId": "papeterie"
            },
            {
                "type": "variable",
                "libelle": "Alimentation",
                "montantAttendu": 533.46,
                "sourceDocId": "visa"
            },
            {
                "type": "variable",
                "libelle": "Habillement",
                "montantAttendu": 30.00,
                "sourceDocId": "visa"
            },
            {
                "type": "variable",
                "libelle": "Carburant",
                "montantAttendu": 52.50,
                "sourceDocId": "visa"
            }
        ],
        "totaux": {
            "total_entrees": 2102.52,
            "total_sorties": 1750.00,
            "solde": 352.52
        }
    }
    
    data_dir = Path(output_dir) / "data"
    with open(data_dir / "budget.json", "w", encoding="utf-8") as f:
        json.dump(budget, f, ensure_ascii=False, indent=2)
    
    print("✓ budget.json créé")
    return budget

def create_quiz_json(output_dir):
    """Crée le fichier quiz.json"""
    quiz = {
        "partie1_documents": [
            {
                "id": "q1",
                "question": "De quel document s'agit-il ?",
                "docId": "assurance-voiture",
                "options": [
                    "Une quittance d'assurance automobile",
                    "Une facture de garage",
                    "Un contrat de location",
                    "Une attestation d'achat"
                ],
                "correctIndex": 0,
                "explication": "C'est un avis d'échéance/quittance d'assurance auto (responsabilité civile + assistance)"
            },
            {
                "id": "q2",
                "question": "De quel document s'agit-il ?",
                "docId": "restaurant",
                "options": [
                    "Un ticket de caisse",
                    "Une souche TVA de restaurant",
                    "Une facture détaillée",
                    "Un bon de réduction"
                ],
                "correctIndex": 1,
                "explication": "C'est une souche TVA d'un restaurant"
            },
            {
                "id": "q3",
                "question": "De quel document s'agit-il ?",
                "docId": "quittance-loyer",
                "options": [
                    "Un contrat de bail",
                    "Une facture d'électricité",
                    "Une quittance de loyer",
                    "Un avis d'échéance"
                ],
                "correctIndex": 2,
                "explication": "C'est une quittance, remise lors du paiement du loyer en liquide (de moins en moins courant)"
            },
            {
                "id": "q4",
                "question": "De quel document s'agit-il ?",
                "docId": "medecin",
                "options": [
                    "Une ordonnance médicale",
                    "Une attestation de soins",
                    "Une facture d'hôpital",
                    "Un certificat médical"
                ],
                "correctIndex": 1,
                "explication": "C'est une attestation de soins remise par un médecin afin d'obtenir le remboursement à la mutuelle d'une partie de ses honoraires"
            },
            {
                "id": "q5",
                "question": "De quel document s'agit-il ?",
                "docId": "bus",
                "options": [
                    "Un ticket de bus simple",
                    "Un abonnement de transport mensuel",
                    "Une carte de réduction",
                    "Un billet de train"
                ],
                "correctIndex": 1,
                "explication": "C'est un abonnement de bus pour le mois de septembre"
            },
            {
                "id": "q6",
                "question": "De quel document s'agit-il ?",
                "docId": "proximus",
                "options": [
                    "Un contrat téléphonique",
                    "Une facture de téléphone",
                    "Un bon de commande",
                    "Une publicité"
                ],
                "correctIndex": 1,
                "explication": "C'est une facture de Proximus pour le téléphone"
            },
            {
                "id": "q7",
                "question": "De quel document s'agit-il ?",
                "docId": "ikea",
                "options": [
                    "Une facture avec TVA",
                    "Un ticket de caisse (preuve d'achat)",
                    "Un bon de livraison",
                    "Un devis"
                ],
                "correctIndex": 1,
                "explication": "C'est un ticket de caisse pour achat (preuve d'achat)"
            },
            {
                "id": "q8",
                "question": "De quel document s'agit-il ?",
                "docId": "extrait-bancaire",
                "options": [
                    "Un relevé de carte bancaire",
                    "Un extrait de compte bancaire",
                    "Une demande de crédit",
                    "Un virement"
                ],
                "correctIndex": 1,
                "explication": "C'est un extrait bancaire papier – permet de voir les différentes transactions entrées et sorties"
            },
            {
                "id": "q9",
                "question": "Quelle est la différence entre une facture et un ticket de caisse ?",
                "docId": "papeterie",
                "options": [
                    "Il n'y a pas de différence",
                    "La facture est plus chère",
                    "La facture permet aux entreprises de récupérer la TVA",
                    "Le ticket est obligatoire"
                ],
                "correctIndex": 2,
                "explication": "La facture permet aux entreprises de récupérer la TVA, contrairement au simple ticket de caisse"
            },
            {
                "id": "q10",
                "question": "De quel document s'agit-il ?",
                "docId": "visa",
                "options": [
                    "Un relevé bancaire",
                    "Un état des dépenses de carte VISA",
                    "Une demande de carte",
                    "Un contrat d'assurance"
                ],
                "correctIndex": 1,
                "explication": "C'est un état de dépense d'une carte VISA"
            }
        ],
        "partie3_final": [
            {
                "id": "f1",
                "question": "Le budget de Monsieur et Madame Thirion est-il équilibré ?",
                "options": [
                    "Non, ils sont en déficit",
                    "Oui, leur budget est équilibré (positif)",
                    "Non, ils dépensent exactement ce qu'ils gagnent",
                    "Impossible à déterminer"
                ],
                "correctIndex": 1,
                "explication": "Oui, leur budget de septembre est positif car leurs entrées (2102,52€) sont supérieures à leurs sorties (1750€)"
            },
            {
                "id": "f2",
                "question": "Monsieur et Madame Thirion peuvent-ils économiser ce mois-ci ?",
                "options": [
                    "Non, ils ne peuvent pas économiser",
                    "Oui, ils peuvent économiser 352,52€",
                    "Oui, mais seulement 100€",
                    "Non, ils sont en déficit"
                ],
                "correctIndex": 1,
                "explication": "Oui, ils peuvent économiser 352,52€ (différence entre entrées et sorties)"
            },
            {
                "id": "f3",
                "question": "Quelle proportion représente l'épargne par rapport aux ressources ?",
                "options": [
                    "Environ 1/3 des ressources",
                    "Environ 1/5 des ressources (17%)",
                    "La moitié des ressources",
                    "Environ 1/10 des ressources"
                ],
                "correctIndex": 1,
                "explication": "L'épargne représente environ 1/5 des ressources, soit 17% (352,52€ / 2102,52€)"
            },
            {
                "id": "f4",
                "question": "Comment nomme-t-on précisément le revenu de Julie ?",
                "options": [
                    "Un salaire",
                    "Une pension",
                    "Des allocations de chômage",
                    "Une allocation familiale"
                ],
                "correctIndex": 2,
                "explication": "Le revenu de Julie s'appelle des allocations de chômage"
            },
            {
                "id": "f5",
                "question": "Pourquoi ce ménage n'a-t-il pas d'allocations familiales dans ses entrées ?",
                "options": [
                    "Ils ont oublié de les demander",
                    "Ils gagnent trop d'argent",
                    "Ils n'ont pas encore d'enfant",
                    "Ils ne sont pas mariés"
                ],
                "correctIndex": 2,
                "explication": "Ils n'ont pas d'allocations familiales car ils n'ont pas encore d'enfant"
            }
        ]
    }
    
    data_dir = Path(output_dir) / "data"
    with open(data_dir / "quiz.json", "w", encoding="utf-8") as f:
        json.dump(quiz, f, ensure_ascii=False, indent=2)
    
    print("✓ quiz.json créé")
    return quiz

if __name__ == "__main__":
    pdf_path = "/mnt/user-data/uploads/30_le_budget_ménage_EXERCICE_1_professeur.pdf"
    output_dir = "/home/claude/budget-menage-jeu/public/assets"
    
    print("🚀 Extraction des données du PDF...")
    print("=" * 60)
    
    # Extraire les images
    images = extract_images_from_pdf(pdf_path, output_dir)
    print(f"\n📸 {len(images)} pages extraites en images")
    
    # Créer les fichiers JSON
    print("\n📝 Création des fichiers de données...")
    print("=" * 60)
    documents = create_documents_json(output_dir)
    budget = create_budget_json(output_dir)
    quiz = create_quiz_json(output_dir)
    
    print("\n✅ Extraction terminée !")
    print(f"   - {len(images)} images extraites")
    print(f"   - {len(documents)} documents référencés")
    print(f"   - {len(budget['entrees']) + len(budget['sorties_fixes']) + len(budget['sorties_variables'])} rubriques budgétaires")
    print(f"   - {len(quiz['partie1_documents']) + len(quiz['partie3_final'])} questions de quiz")
