#!/usr/bin/env python3
"""Create a rent receipt image"""

from PIL import Image, ImageDraw, ImageFont
import os

# Create a white canvas
width, height = 800, 1000
image = Image.new('RGB', (width, height), 'white')
draw = ImageDraw.Draw(image)

# Try to use a TrueType font, fallback to default if not available
try:
    font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
    font_normal = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
    font_amount = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
except:
    # Fallback to default font
    font_title = ImageFont.load_default()
    font_normal = ImageFont.load_default()
    font_small = ImageFont.load_default()
    font_amount = ImageFont.load_default()

# Draw border
draw.rectangle([30, 30, width-30, height-30], outline='black', width=2)

# Title
draw.text((width//2, 60), "QUITTANCE DE LOYER", fill='black', font=font_title, anchor='mm')

# Landlord info
y_pos = 120
draw.text((50, y_pos), "Propriétaire:", fill='black', font=font_normal)
y_pos += 30
draw.text((80, y_pos), "Madame Isabelle MARTIN", fill='black', font=font_small)
y_pos += 25
draw.text((80, y_pos), "85 Avenue de la Paix", fill='black', font=font_small)
y_pos += 25
draw.text((80, y_pos), "4020 LIÈGE", fill='black', font=font_small)

# Tenant info
y_pos += 50
draw.text((50, y_pos), "Locataire:", fill='black', font=font_normal)
y_pos += 30
draw.text((80, y_pos), "Monsieur Alex DUPONT", fill='black', font=font_small)
y_pos += 25
draw.text((80, y_pos), "16 Rue des Lilas", fill='black', font=font_small)
y_pos += 25
draw.text((80, y_pos), "4000 LIÈGE", fill='black', font=font_small)

# Property address
y_pos += 50
draw.text((50, y_pos), "Adresse du logement:", fill='black', font=font_normal)
y_pos += 30
draw.text((80, y_pos), "16 Rue des Lilas, Appartement 3B", fill='black', font=font_small)
y_pos += 25
draw.text((80, y_pos), "4000 LIÈGE", fill='black', font=font_small)

# Separator line
y_pos += 40
draw.line([50, y_pos, width-50, y_pos], fill='gray', width=1)

# Receipt text
y_pos += 40
draw.text((50, y_pos), "Reçu pour loyer du mois de:", fill='black', font=font_normal)
y_pos += 35
draw.text((width//2, y_pos), "SEPTEMBRE 2025", fill='blue', font=font_title, anchor='mm')

# Amount box
y_pos += 60
box_y1 = y_pos
box_y2 = y_pos + 120
draw.rectangle([50, box_y1, width-50, box_y2], outline='blue', width=2, fill='#f0f8ff')

y_pos += 30
draw.text((width//2, y_pos), "Montant du loyer:", fill='black', font=font_normal, anchor='mm')
y_pos += 40
draw.text((width//2, y_pos), "746,00 €", fill='darkblue', font=font_amount, anchor='mm')

y_pos += 40
draw.text((width//2, y_pos), "(Sept cent quarante-six euros)", fill='black', font=font_small, anchor='mm')

# Payment details
y_pos = box_y2 + 40
draw.text((50, y_pos), "Date de paiement: 05 septembre 2025", fill='black', font=font_small)
y_pos += 30
draw.text((50, y_pos), "Mode de paiement: Virement bancaire", fill='black', font=font_small)

# Footer
y_pos += 80
draw.text((50, y_pos), "Fait à Liège, le 05 septembre 2025", fill='black', font=font_small)

# Signature line
y_pos += 60
draw.text((450, y_pos), "Signature du propriétaire:", fill='black', font=font_small)
y_pos += 30
draw.line([450, y_pos, 700, y_pos], fill='black', width=1)
y_pos += 10
draw.text((575, y_pos), "I. Martin", fill='black', font=font_small, anchor='mm')

# Save the image
output_path = 'assets/images/page_3_loyer.png'
image.save(output_path)
print(f"Image créée: {output_path}")
