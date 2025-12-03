# -*- coding: utf-8 -*-
"""MacroVisionAI.ipynb (cleaned for use as a module)

Originally exported from Colab.
"""

# SET UP

import os
from io import BytesIO

import numpy as np
import requests
import torch
import torch.nn as nn
from PIL import Image, ImageDraw, ImageFont
from torchvision import models, transforms
from ultralytics import YOLO
import matplotlib.pyplot as plt

# For files (debug print so you can see where best.pt is expected)
print(os.path.abspath("best.pt"))

# ---------------------------------------------------------------------
# Models: YOLO detector + FoodClassifier (EfficientNet)
# ---------------------------------------------------------------------

# YOLO detector (uses local best.pt in this folder)
detector = YOLO("best.pt")

# Example image path (used only in __main__ demo)
IMG_PATH = (
    "https://s7d1.scene7.com/is/image/mcdonalds/"
    "DC_202307_8950_EVM_M_2Cheeseburger_Coke_Glass_1564x1564-1:product-header-mobile"
    "?wid=500&hei=500&dpr=off"
)


class FoodClassifier(nn.Module):
    def __init__(self, num_classes=101):
        super().__init__()
        base_model = models.efficientnet_b0(pretrained=True)

        self.features = base_model.features
        self.classifier = nn.Sequential(
            nn.Dropout(p=0.2, inplace=True),
            nn.Linear(base_model.classifier[1].in_features, num_classes),
        )

    def forward(self, x):
        x = self.features(x)
        # Apply adaptive average pooling to reduce spatial dimensions to 1x1
        x = nn.functional.adaptive_avg_pool2d(x, (1, 1))
        x = torch.flatten(x, 1)
        return self.classifier(x)


food_classifier = FoodClassifier(num_classes=101)

# Try to load trained weights, but fall back to pretrained ImageNet if it fails
try:
    food_classifier.load_state_dict(
        torch.load("food_classifier.pth", map_location="cpu")
    )
    print("✓ Loaded food_classifier.pth")
except Exception as e:
    print(f"⚠ Could not load food_classifier.pth: {e}")
    print("  Using pretrained EfficientNet weights only (still works, less food-specific).")

food_classifier.eval()

# ---------------------------------------------------------------------
# Label list for your 101 food classes
# ---------------------------------------------------------------------

food_classes = [
    "apple_pie",
    "baby_back_ribs",
    "baklava",
    "beef_carpaccio",
    "beef_tartare",
    "beet_salad",
    "beignets",
    "bibimbap",
    "bread_pudding",
    "breakfast_burrito",
    "bruschetta",
    "caesar_salad",
    "cannoli",
    "caprese_salad",
    "carrot_cake",
    "ceviche",
    "cheesecake",
    "cheese_plate",
    "chicken_curry",
    "chicken_quesadilla",
    "chicken_wings",
    "chocolate_cake",
    "chocolate_mousse",
    "churros",
    "clam_chowder",
    "club_sandwich",
    "crab_cakes",
    "creme_brulee",
    "croque_madame",
    "cup_cakes",
    "deviled_eggs",
    "donuts",
    "dumplings",
    "edamame",
    "eggs_benedict",
    "escargots",
    "falafel",
    "filet_mignon",
    "fish_and_chips",
    "foie_gras",
    "french_fries",
    "french_onion_soup",
    "french_toast",
    "fried_calamari",
    "fried_rice",
    "frozen_yogurt",
    "garlic_bread",
    "gnocchi",
    "greek_salad",
    "grilled_cheese_sandwich",
    "grilled_salmon",
    "guacamole",
    "gyoza",
    "hamburger",
    "hot_and_sour_soup",
    "hot_dog",
    "huevos_rancheros",
    "hummus",
    "ice_cream",
    "lasagna",
    "lobster_bisque",
    "lobster_roll_sandwich",
    "macaroni_and_cheese",
    "macarons",
    "miso_soup",
    "mussels",
    "nachos",
    "omelette",
    "onion_rings",
    "oysters",
    "pad_thai",
    "paella",
    "pancakes",
    "panna_cotta",
    "peking_duck",
    "pho",
    "pizza",
    "pork_chop",
    "poutine",
    "prime_rib",
    "pulled_pork_sandwich",
    "ramen",
    "ravioli",
    "red_velvet_cake",
    "risotto",
    "samosa",
    "sashimi",
    "scallops",
    "seaweed_salad",
    "shrimp_and_grits",
    "spaghetti_bolognese",
    "spaghetti_carbonara",
    "spring_rolls",
    "steak",
    "strawberry_shortcake",
    "sushi",
    "tacos",
    "takoyaki",
    "tiramisu",
    "tuna_tartare",
    "waffles",
]

# ---------------------------------------------------------------------
# Preprocessing & classification helpers
# ---------------------------------------------------------------------

preprocess = transforms.Compose(
    [
        transforms.Resize((256, 256)),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ]
)


def classify_food(crop_img):
    """Classify a crop using FoodClassifier (EfficientNet)."""
    img_t = preprocess(crop_img).unsqueeze(0)
    with torch.no_grad():
        outputs = food_classifier(img_t)
        probs = torch.nn.functional.softmax(outputs, dim=1)

    # Get top 3 predictions
    top_probs, top_indices = torch.topk(probs, 3)

    predictions = []
    for prob, idx in zip(top_probs[0], top_indices[0]):
        idx_val = idx.item()
        # Use food_classes if available, otherwise use the index
        if idx_val < len(food_classes):
            class_name = food_classes[idx_val]
        else:
            class_name = f"class_{idx_val}"
        predictions.append((class_name, prob.item()))

    return predictions


# Optional: simple ResNet classifier for experiments / debugging
simple_classifier = models.resnet50(pretrained=True)
simple_classifier.eval()


def classify_food_resnet(crop_img):
    """Classify using ResNet50 pretrained on ImageNet (not used in API, just for debugging)."""
    transform = transforms.Compose(
        [
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )

    img_t = transform(crop_img).unsqueeze(0)

    with torch.no_grad():
        outputs = simple_classifier(img_t)
        probs = torch.nn.functional.softmax(outputs, dim=1)

    top_probs, top_indices = torch.topk(probs, 3)

    imagenet_foods = {
        963: "pizza",
        904: "guacamole",
        924: "pretzel",
        927: "plate",
        960: "meatloaf",
        906: "hotdog",
        925: "ravioli",
        920: "pancake",
        933: "cheeseburger",
        930: "burger",
        897: "french_bread",
        944: "trifle",
        954: "taco",
        535: "french_fries",
        949: "tomato_soup",
        947: "strawberry",
        952: "sorbet",
        939: "eggnog",
        943: "tiramisu",
        948: "sundae",
    }

    predictions = []
    for prob, idx in zip(top_probs[0], top_indices[0]):
        idx_val = idx.item()
        class_name = imagenet_foods.get(idx_val, f"food_class_{idx_val}")
        predictions.append((class_name, prob.item()))

    return predictions


# ---------------------------------------------------------------------
# Main function used by FastAPI
# ---------------------------------------------------------------------

def analyze_food(image_path, conf_threshold=0.1):
    """
    Analyze a food image and return a list with the best classification result.

    Uses your FoodClassifier (EfficientNet + food_classes) on several crops of the image
    and returns the most confident prediction.

    Returns: list with a single dict:
      {
        'bbox': [x1, y1, x2, y2],
        'food': str,
        'confidence': float,
        'all_predictions': [(food, confidence), ...],
        'crop_type': str
      }
    """
    if image_path.startswith("http"):
        response = requests.get(image_path)
        img = Image.open(BytesIO(response.content))
    else:
        img = Image.open(image_path)

    img_rgb = img.convert("RGB")
    w, h = img_rgb.size

    # Try multiple crops to get best prediction
    crops = []

    # 1. Full image (or 95% to avoid edges)
    margin = int(min(w, h) * 0.025)
    crop_full = img_rgb.crop((margin, margin, w - margin, h - margin))
    crops.append(("full", crop_full, (margin, margin, w - margin, h - margin)))

    # 2. Center crop (90% of image)
    center_factor = 0.9
    left = int(w * (1 - center_factor) / 2)
    top = int(h * (1 - center_factor) / 2)
    right = left + int(w * center_factor)
    bottom = top + int(h * center_factor)
    crop_center = img_rgb.crop((left, top, right, bottom))
    crops.append(("center", crop_center, (left, top, right, bottom)))

    # 3. Center crop (80% of image)
    center_factor = 0.8
    left = int(w * (1 - center_factor) / 2)
    top = int(h * (1 - center_factor) / 2)
    right = left + int(w * center_factor)
    bottom = top + int(h * center_factor)
    crop_tight = img_rgb.crop((left, top, right, bottom))
    crops.append(("tight", crop_tight, (left, top, right, bottom)))

    # Classify all crops and find the most confident prediction
    best_result = None
    best_confidence = -1.0

    print(f"Testing {len(crops)} crops with FoodClassifier:")
    for crop_name, crop_img, bbox in crops:
        # ✅ use classify_food (your EfficientNet-based classifier)
        predictions = classify_food(crop_img)
        top_food, top_conf = predictions[0]
        print(f"  {crop_name:8s}: {top_food:25s} ({top_conf:.4f})")

        if top_conf > best_confidence:
            best_confidence = top_conf
            best_result = {
                "bbox": list(bbox),
                "food": top_food,
                "confidence": top_conf,
                "all_predictions": predictions,
                "crop_type": crop_name,
            }

    results = [best_result] if best_result else []
    return results


# ---------------------------------------------------------------------
# Visualization helper (for debugging / demos)
# ---------------------------------------------------------------------

def draw_annotated(image_path, results, outfile="annotated_food.jpg"):
    """
    Draw bounding boxes + labels on the image for the given results.
    """
    if image_path.startswith("http"):
        resp = requests.get(image_path)
        img = Image.open(BytesIO(resp.content)).convert("RGB")
    else:
        img = Image.open(image_path).convert("RGB")

    draw = ImageDraw.Draw(img)

    # Try to get a font (fallback to default)
    try:
        font = ImageFont.load_default()
    except Exception:
        font = None

    for r in results:
        x1, y1, x2, y2 = r["bbox"]
        label = f"{r['food']} ({r['confidence']:.2f})"

        # box
        draw.rectangle([x1, y1, x2, y2], outline=(46, 204, 113), width=3)

        # label background box
        pad = 4
        tw, th = draw.textbbox((0, 0), label, font=font)[2:]
        bx1, by1 = x1, max(0, y1 - th - 2 * pad)
        bx2, by2 = x1 + tw + 2 * pad, y1
        draw.rectangle([bx1, by1, bx2, by2], fill=(0, 0, 0))
        draw.text((bx1 + pad, by1 + pad), label, fill=(255, 255, 255), font=font)

    img.save(outfile, quality=95)
    return outfile, img


# ---------------------------------------------------------------------
# Demo / debug code (only runs if you "python macrovisionai.py")
# ---------------------------------------------------------------------

if __name__ == "__main__":
    print("Resnet50 / Food classifier demo\n")

    # 1) Test analyze_food on the demo image
    results = analyze_food(IMG_PATH, conf_threshold=0.1)

    print(f"\nFound {len(results)} food classification(s):\n")
    for idx, result in enumerate(results, 1):
        print(f"Prediction {idx}:")
        print(f"  Food: {result['food']} (confidence: {result['confidence']:.4f})")
        print(f"  Bounding box: {result['bbox']}")
        print("  Top 3 predictions:")
        for food, conf in result["all_predictions"]:
            print(f"    • {food}: {conf:.4f}")

    # 2) Optional ResNet debug
    test_response = requests.get(IMG_PATH)
    test_img = Image.open(BytesIO(test_response.content)).convert("RGB")
    test_crop = test_img.crop(
        (
            test_img.width // 4,
            test_img.height // 4,
            3 * test_img.width // 4,
            3 * test_img.height // 4,
        )
    )
    test_preds = classify_food_resnet(test_crop)
    print("\nTop-3 ResNet50 predictions:")
    for food, conf in test_preds:
        print(f"  {food}: {conf:.4f}")

    # 3) Verify model
    print(f"\nFood classifier: {food_classifier}")
    print(f"Is in eval mode: {not food_classifier.training}")

    test_dummy = torch.randn(1, 3, 224, 224)
    with torch.no_grad():
        dummy_out = food_classifier(test_dummy)
        dummy_probs = torch.nn.functional.softmax(dummy_out, dim=1)
        top_k = torch.topk(dummy_probs, 3)
        print("\nRandom input top-3:")
        for i, (conf, idx) in enumerate(zip(top_k.values[0], top_k.indices[0])):
            print(f"  {i+1}. {food_classes[idx]}: {conf.item():.4f}")

    # 4) Draw annotated image
    IMAGE_URL = IMG_PATH
    results = analyze_food(IMAGE_URL, conf_threshold=0.3)

    for idx, r in enumerate(results, 1):
        print(f"\nDetection {idx}: {r['food']}  conf={r['confidence']:.2f}  bbox={r['bbox']}")
        print(f"  top-3: {r['all_predictions']}")

    outfile, annotated = draw_annotated(IMAGE_URL, results, outfile="annotated_food.jpg")
    print(f"\nSaved annotated image -> {outfile}")

    plt.figure(figsize=(6, 6))
    plt.imshow(annotated)
    plt.axis("off")
    plt.show()
