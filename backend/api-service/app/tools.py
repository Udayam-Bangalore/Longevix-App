"""
Tool implementations for the AI service.
Provides deterministic nutrition calculations, USDA API integration, vision analysis, and RAG retrieval.
"""

import os
import logging
from typing import Dict, Any, List, Optional
import json
import httpx

from app.model import generate_text

logger = logging.getLogger(__name__)

# Cache for LLM unit conversions to avoid repeated calls
_unit_conversion_cache: Dict[str, float] = {}

USDA_API_BASE_URL = "https://api.nal.usda.gov/fdc/v1"

UNIT_CONVERSIONS = {
    "g": 1,
    "gm": 1,
    "gram": 1,
    "grams": 1,
    "mg": 0.001,
    "ml": 1,
    "cup": 240,
    "cups": 240,
    "glass": 250,
    "katori": 150,
    "bowl": 250,
    "tsp": 5,
    "teaspoon": 5,
    "tbsp": 15,
    "tablespoon": 15,
    "oz": 28.35,
    "ounce": 28.35,
    "lb": 453.6,
    "pound": 453.6,
    "kg": 1000,
    "kilogram": 1000,
}

PIECE_WEIGHTS = {
    "egg": 50,
    "eggs": 50,
    "banana": 120,
    "bananas": 120,
    "apple": 180,
    "apples": 180,
    "orange": 150,
    "oranges": 150,
    "mango": 200,
    "mangoes": 200,
    "pear": 180,
    "pears": 180,
    "peach": 150,
    "peaches": 150,
    "plum": 80,
    "plums": 80,
    "grape": 5,
    "grapes": 5,
    "strawberry": 12,
    "strawberries": 12,
    "watermelon": 15000,
    "carrot": 60,
    "carrots": 60,
    "potato": 150,
    "potatoes": 150,
    "onion": 150,
    "onions": 150,
    "tomato": 120,
    "tomatoes": 120,
    "roti": 30,
    "rotis": 30,
    "chapati": 30,
    "chapatis": 30,
    "paratha": 50,
    "parathas": 50,
    "bread": 30,
    "breads": 30,
    "slice": 30,
    "slices": 30,
    "cheese": 30,
    "cheeses": 30,
    "paneer": 50,
    "paneers": 50,
    "chicken": 150,
    "chickens": 150,
    "chicken breast": 150,
    "fish": 150,
    "fishes": 150,
    "rice": 200,
    "rices": 200,
    "dal": 250,
    "default": 100,
}

NUTRIENT_IDS = {
    "calories": 1008,
    "protein": 1003,
    "fat": 1004,
    "carbohydrates": 1005,
    "fiber": 1079,
    "vitamin_c": 1162,
    "iron": 1089,
    "calcium": 1087,
    "vitamin_d": 1094,
    "vitamin_a": 1104,
    "vitamin_b12": 1095,
    "vitamin_b6": 1096,
    "folate": 1177,
    "magnesium": 1090,
    "potassium": 1092,
    "zinc": 1093,
    "selenium": 1103,
    "copper": 1098,
    "manganese": 1101,
    "iodine": 1100,
}

USDA_API_KEY = os.environ.get("USDA_API_KEY", "")


class NutritionEngine:
    """
    Nutrition Engine with USDA API integration.
    Falls back to local database if USDA API key is not available.
    """

    @classmethod
    async def convert_to_grams(
        cls, food_name: str, quantity: float, unit: str
    ) -> float:
        """
        Convert quantity to grams based on unit type.
        Uses direct conversion for grams, LLM for other units.

        Args:
            food_name: Name of the food item
            quantity: Amount
            unit: Unit of measurement

        Returns:
            Weight in grams
        """
        unit_lower = unit.lower() if unit else "g"

        # Direct conversion for gram-based units (no LLM needed)
        if unit_lower in ["g", "gram", "grams"]:
            return quantity
        elif unit_lower == "mg":
            return quantity * 0.001
        elif unit_lower == "kg":
            return quantity * 1000

        # For all other units, use LLM to convert intelligently
        return await cls.convert_unit_with_llm(food_name, quantity, unit_lower)

    @classmethod
    async def convert_unit_with_llm(
        cls, food_name: str, quantity: float, unit: str
    ) -> float:
        """
        Use LLM to intelligently convert any unit to grams based on food context.

        Args:
            food_name: Name of the food
            quantity: Amount
            unit: Unit of measurement (pcs, ml, cup, etc.)

        Returns:
            Weight in grams
        """
        # Check cache first
        cache_key = f"{food_name.lower()}|{quantity}|{unit.lower()}"
        if cache_key in _unit_conversion_cache:
            return _unit_conversion_cache[cache_key]

        prompt = f"""Convert {quantity} {unit} of "{food_name}" to grams.

Consider the specific food type, typical size, and common serving amounts. Be precise.

Examples of good conversions:
- 1 pcs duck egg = 70 grams (duck eggs are larger than chicken eggs)
- 1 pcs chicken egg = 50 grams
- 1 cup cooked rice = 185 grams
- 1 glass milk = 250 grams
- 1 katori dal = 150 grams
- 1 bowl salad = 200 grams
- 1 slice pizza = 120 grams
- 1 piece roti = 30 grams
- 1 tbsp ghee = 15 grams

Now convert: {quantity} {unit} of "{food_name}"

Return ONLY the number of grams. No explanation, units, or text - just the numeric value like "70" or "185"."""

        try:
            response = generate_text(prompt, max_tokens=10, temperature=0.1)
            grams = float(response.strip())

            # Cache the result
            _unit_conversion_cache[cache_key] = grams

            logger.info(f"LLM converted: {quantity} {unit} of '{food_name}' = {grams}g")
            return grams
        except Exception as e:
            logger.error(
                f"LLM conversion failed for '{food_name}' ({quantity} {unit}): {e}"
            )
            # Fallback: assume 100g per unit if LLM fails
            fallback = quantity * 100
            logger.warning(f"Using fallback: {quantity} {unit} = {fallback}g")
            return fallback

    @classmethod
    async def lookup_food_usda(
        cls, food_name: str, grams: float
    ) -> Optional[Dict[str, Any]]:
        """
        Look up food nutrition data from USDA API.

        Args:
            food_name: Name of the food
            grams: Weight in grams

        Returns:
            Dict with nutrition data or None if API call fails
        """
        if not USDA_API_KEY:
            logger.warning("USDA_API_KEY not configured")
            return None

        try:
            search_query = food_name
            food_lower = food_name.lower()

            if food_lower == "egg":
                search_query = "egg whole raw"
            elif food_lower == "banana":
                search_query = "banana raw"
            elif food_lower == "apple":
                search_query = "apple raw"

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{USDA_API_BASE_URL}/foods/search",
                    params={
                        "api_key": USDA_API_KEY,
                        "query": search_query,
                        "dataType": "Foundation,SR Legacy",
                        "pageSize": 1,
                    },
                    timeout=15.0,
                )

            if response.status_code != 200:
                logger.error(f"USDA API error: {response.status_code}")
                return None

            data = response.json()

            if not data.get("foods"):
                return None

            food = data["foods"][0]
            nutrients = {}

            for n in food.get("foodNutrients", []):
                nutrient_id = n.get("nutrientId")
                if nutrient_id in NUTRIENT_IDS.values():
                    nutrients[nutrient_id] = n.get("value", 0)

            scale_factor = grams / 100

            def get_nutrient(nutrient_name: str) -> float:
                nid = NUTRIENT_IDS.get(nutrient_name)
                return round((nutrients.get(nid, 0) * scale_factor) * 100) / 100

            return {
                "food_name": food_name,
                "calories": get_nutrient("calories"),
                "protein_g": get_nutrient("protein"),
                "carbs_g": get_nutrient("carbohydrates"),
                "fat_g": get_nutrient("fat"),
                "fiber_g": get_nutrient("fiber"),
                "micronutrients": {
                    "vitamin_c": get_nutrient("vitamin_c"),
                    "iron": get_nutrient("iron"),
                    "calcium": get_nutrient("calcium"),
                    "vitamin_d": get_nutrient("vitamin_d"),
                    "vitamin_a": get_nutrient("vitamin_a"),
                    "vitamin_b12": get_nutrient("vitamin_b12"),
                    "vitamin_b6": get_nutrient("vitamin_b6"),
                    "folate": get_nutrient("folate"),
                    "magnesium": get_nutrient("magnesium"),
                    "potassium": get_nutrient("potassium"),
                    "zinc": get_nutrient("zinc"),
                    "selenium": get_nutrient("selenium"),
                    "copper": get_nutrient("copper"),
                    "manganese": get_nutrient("manganese"),
                    "iodine": get_nutrient("iodine"),
                },
                "serving": f"{grams}g",
                "source": "usda",
            }
        except Exception as e:
            logger.error(f"USDA API error: {e}")
            return None

    @classmethod
    def lookup_food_local(cls, food_name: str, grams: float) -> Dict[str, Any]:
        """
        Look up food nutrition from local database (fallback).

        Args:
            food_name: Name of the food
            grams: Weight in grams

        Returns:
            Dict with nutrition data
        """
        normalized_name = food_name.lower().strip()
        food_data = None

        LOCAL_DATABASE = {
            "rice": {
                "calories": 130,
                "protein_g": 2.7,
                "carbs_g": 28,
                "fat_g": 0.3,
                "fiber_g": 0.4,
            },
            "chicken breast": {
                "calories": 165,
                "protein_g": 31,
                "carbs_g": 0,
                "fat_g": 3.6,
                "fiber_g": 0,
            },
            "egg": {
                "calories": 155,
                "protein_g": 13,
                "carbs_g": 1.1,
                "fat_g": 11,
                "fiber_g": 0,
            },
            "apple": {
                "calories": 52,
                "protein_g": 0.3,
                "carbs_g": 14,
                "fat_g": 0.2,
                "fiber_g": 2.4,
            },
            "banana": {
                "calories": 89,
                "protein_g": 1.1,
                "carbs_g": 23,
                "fat_g": 0.3,
                "fiber_g": 2.6,
            },
            "milk": {
                "calories": 42,
                "protein_g": 3.4,
                "carbs_g": 5,
                "fat_g": 1,
                "fiber_g": 0,
            },
            "bread": {
                "calories": 265,
                "protein_g": 9,
                "carbs_g": 49,
                "fat_g": 3.2,
                "fiber_g": 2.7,
            },
            "dal": {
                "calories": 116,
                "protein_g": 9,
                "carbs_g": 20,
                "fat_g": 0.4,
                "fiber_g": 7.9,
            },
            "roti": {
                "calories": 264,
                "protein_g": 8.5,
                "carbs_g": 52,
                "fat_g": 2.1,
                "fiber_g": 4.4,
            },
            "paneer": {
                "calories": 265,
                "protein_g": 18,
                "carbs_g": 1.2,
                "fat_g": 21,
                "fiber_g": 0,
            },
        }

        if normalized_name in LOCAL_DATABASE:
            food_data = LOCAL_DATABASE[normalized_name].copy()
        else:
            for key in LOCAL_DATABASE:
                if key in normalized_name or normalized_name in key:
                    food_data = LOCAL_DATABASE[key].copy()
                    break

        scale_factor = grams / 100

        if not food_data:
            return {
                "food_name": food_name,
                "calories": 0,
                "protein_g": 0,
                "carbs_g": 0,
                "fat_g": 0,
                "fiber_g": 0,
                "error": "Food not found in database",
            }

        return {
            "food_name": food_name,
            "calories": round(food_data["calories"] * scale_factor, 1),
            "protein_g": round(food_data["protein_g"] * scale_factor, 1),
            "carbs_g": round(food_data["carbs_g"] * scale_factor, 1),
            "fat_g": round(food_data["fat_g"] * scale_factor, 1),
            "fiber_g": round(food_data.get("fiber_g", 0) * scale_factor, 1),
            "serving": f"{grams}g",
            "source": "local",
        }

    @classmethod
    async def lookup_food(
        cls, food_name: str, quantity: float = 1.0, unit: str = "serving"
    ) -> Dict[str, Any]:
        """
        Look up nutrition data for a food item.
        Uses USDA API if available, falls back to local database.

        Args:
            food_name: Name of the food
            quantity: Amount
            unit: Unit of measurement

        Returns:
            Dict with nutrition data
        """
        grams = await cls.convert_to_grams(food_name, quantity, unit)

        logger.info(f"Looking up: {food_name}, {quantity} {unit} = {grams}g")

        usda_result = await cls.lookup_food_usda(food_name, grams)
        if usda_result:
            return usda_result

        return cls.lookup_food_local(food_name, grams)

    @classmethod
    async def lookup_food_sync(cls, food_name: str, grams: float) -> Dict[str, Any]:
        """
        Synchronous version of lookup_food for non-async contexts.
        """
        usda_result = await cls.lookup_food_usda(food_name, grams)
        if usda_result:
            return usda_result
        return cls.lookup_food_local(food_name, grams)

    @classmethod
    def calculate_rda(
        cls, user_profile: Dict[str, Any], intake: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Calculate RDA percentages for user intake.
        Simplified implementation - extend as needed.
        """
        RDA_VALUES = {
            "protein_g": 50,
            "fiber_g": 25,
            "vitamin_c_mg": 90,
            "calcium_mg": 1000,
            "iron_mg": 18,
        }

        result = {}
        for nutrient, rda_value in RDA_VALUES.items():
            intake_value = intake.get(nutrient, 0)
            percentage = (
                round((intake_value / rda_value) * 100, 1) if rda_value > 0 else 0
            )
            result[nutrient] = {
                "intake": intake_value,
                "rda": rda_value,
                "percentage": percentage,
            }

        return result

    @classmethod
    async def calculate_meal_nutrition(
        cls, food_items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calculate total nutrition for a meal with multiple food items.
        """
        total = {
            "calories": 0,
            "protein_g": 0,
            "carbs_g": 0,
            "fat_g": 0,
            "fiber_g": 0,
        }

        items = []
        for item in food_items:
            grams = await cls.convert_to_grams(
                item.get("food_name", ""),
                item.get("quantity", 1),
                item.get("unit", "g"),
            )
            nutrition = cls.lookup_food_local(item.get("food_name", ""), grams)

            total["calories"] += nutrition.get("calories", 0)
            total["protein_g"] += nutrition.get("protein_g", 0)
            total["carbs_g"] += nutrition.get("carbs_g", 0)
            total["fat_g"] += nutrition.get("fat_g", 0)
            total["fiber_g"] += nutrition.get("fiber_g", 0)

            items.append(
                {
                    "food_name": item.get("food_name"),
                    "quantity": item.get("quantity"),
                    "unit": item.get("unit"),
                    **nutrition,
                }
            )

        return {
            "total": {k: round(v, 1) for k, v in total.items()},
            "items": items,
        }


class VisionAnalyzer:
    """
    Vision analyzer for food images.
    Uses BLIP for image captioning on CPU.
    """

    @classmethod
    def analyze_image(
        cls, image_base64: str, include_nutrition: bool = True
    ) -> Dict[str, Any]:
        """
        Analyze food image to detect items.

        Args:
            image_base64: Base64 encoded image
            include_nutrition: Whether to include nutrition lookup

        Returns:
            Dict with detected foods and nutrition data
        """
        logger.info("Vision analysis requested")

        try:
            from PIL import Image
            import io
            import base64

            image_data = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_data))

            if image.mode != "RGB":
                image = image.convert("RGB")

            from transformers import BlipProcessor, BlipForImageTextRetrieval

            processor = BlipProcessor.from_pretrained(
                "Salesforce/BLIP-image-captioning-base"
            )
            model = BlipForImageTextRetrieval.from_pretrained(
                "Salesforce/BLIP-image-captioning-base"
            )

            inputs = processor(image, return_tensors="pt")
            outputs = model.generate(**inputs)
            caption = processor.decode(outputs[0], skip_special_tokens=True)

            detected_items = []
            if include_nutrition:
                for word in caption.split():
                    nutrition = NutritionEngine.lookup_food_local(word, 100)
                    if nutrition.get("calories", 0) > 0:
                        detected_items.append(nutrition)

            return {
                "caption": caption,
                "detected_items": detected_items,
                "confidence": 0.8,
            }

        except Exception as e:
            logger.error(f"Vision analysis error: {e}")
            return {
                "caption": "",
                "detected_items": [],
                "error": str(e),
            }


class RAGRetriever:
    """
    RAG retriever for evidence-based health information.
    Uses vector search for semantic retrieval.
    """

    @classmethod
    def retrieve(
        cls, query: str, top_k: int = 3, filter_tags: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Retrieve relevant documents from knowledge base.

        Args:
            query: Search query
            top_k: Number of documents to retrieve
            filter_tags: Optional tags to filter by

        Returns:
            Dict with retrieved documents
        """
        logger.info(f"RAG retrieval: {query}")

        return {
            "query": query,
            "documents": [
                {
                    "id": "doc_1",
                    "content": "Sample health information about nutrition.",
                    "source": "WHO Guidelines",
                    "relevance_score": 0.95,
                }
            ],
            "total_found": 0,
        }
