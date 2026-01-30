from app.schemas import (
    ChatRequest,
    ChatResponse,
    GenerateNutrientsRequest,
    GenerateNutrientsResponse,
)
from app.constants.nutrition_data import NUTRITION_DATABASE, DEFAULT_FALLBACK_NUTRIENTS
from app.constants.units import UNIT_CONVERSIONS, PIECE_WEIGHTS
from fastapi import FastAPI

app = FastAPI(title="AI Inference Service")


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    try:
        from app.model import generate_text
        from concurrent.futures import ThreadPoolExecutor
        
        prompt = f"""You are a helpful nutrition assistant for a health tracking app called Longevix. 

Context about the app:
- Users can set up their profile with age, sex, height, weight, activity level, diet type, and primary health goal
- Users can add food items to track their meals (breakfast, lunch, dinner, snack)
- The app calculates nutritional information including calories, macronutrients (fat, protein, carbohydrates), and micronutrients (vitamins and minerals)
- Users can view their daily nutrition insights and progress

Your role:
1. Answer nutrition-related questions based on the user's query
2. Provide personalized advice when appropriate, considering common health goals
3. Be encouraging and supportive about healthy eating habits
4. If asked about app features, explain how profile setup and food logging work
5. Keep responses concise (2-3 sentences) but informative
6. If you don't know something, be honest and suggest consulting a healthcare professional

User question: {req.message}

Your response:"""
        
        def get_ai_response():
            return generate_text(prompt, max_tokens=250)
        
        executor = ThreadPoolExecutor(max_workers=1)
        future = executor.submit(get_ai_response)
        response = future.result(timeout=30)
        
        return {"response": response.strip()}
    except Exception as e:
        print(f"Error calling AI model: {e}")
        return {"response": "I'm sorry, I couldn't process your request at this time. Please try again later."}


@app.post("/generate-nutrients", response_model=GenerateNutrientsResponse)
def generate_nutrients(req: GenerateNutrientsRequest):
    total_calories = 0.0
    total_fat = 0.0
    total_protein = 0.0
    total_carbs = 0.0
    items_with_nutrients = []

    for food in req.food:
        quantity = float(food.quantity)
        unit = food.unit.lower() if food.unit else "g"

        if unit == "pcs":
            grams_per_piece = PIECE_WEIGHTS.get(food.name.lower(), 100)
            grams = quantity * grams_per_piece
        else:
            grams = quantity * UNIT_CONVERSIONS.get(unit, 1)

        # Use AI to get nutritional data for all foods with improved prompt
        import json
        from concurrent.futures import ThreadPoolExecutor
        import time
        
        food_name = food.name.lower()
        if food_name in NUTRITION_DATABASE:
            base_nutrients = NUTRITION_DATABASE[food_name]
            nutrient_data = {
                "calories": base_nutrients["calories"] * (grams / 100),
                "fat": base_nutrients["fat"] * (grams / 100),
                "protein": base_nutrients["protein"] * (grams / 100),
                "carbohydrates": base_nutrients["carbohydrates"] * (grams / 100),
                "micronutrients": {k: v * (grams / 100) for k, v in base_nutrients["micronutrients"].items()},
            }
        else:
            prompt = f"""Provide nutritional values for {grams} grams of {food.name} in JSON format.
Fields: calories (kcal), fat (g), protein (g), carbohydrates (g), micronutrients with vitamin_c (mg), iron (mg), calcium (mg), vitamin_d (mcg), vitamin_a (mcg), vitamin_b12 (mcg), vitamin_b6 (mg), folate (mcg), magnesium (mg), potassium (mg), zinc (mg), selenium (mcg), copper (mg), manganese (mg), iodine (mcg).
Return only valid JSON without any additional text."""
            
            def get_ai_response():
                from app.model import generate_text
                return generate_text(prompt, max_tokens=300)
            
            try:
                executor = ThreadPoolExecutor(max_workers=1)
                future = executor.submit(get_ai_response)
                ai_response = future.result(timeout=60)
                
                json_start = ai_response.find('{')
                json_end = ai_response.rfind('}') + 1
                if json_start != -1 and json_end != 0:
                    nutrient_data = json.loads(ai_response[json_start:json_end])
                else:
                    raise Exception("No valid JSON")
                    
            except Exception as e:
                print(f"Error getting AI nutrients for {food.name}: {e}")
                # Fallback to minimal values if AI fails or times out
                nutrient_data = DEFAULT_FALLBACK_NUTRIENTS

        # Round values to 2 decimal places
        nutrient_data = {
            "calories": round(nutrient_data["calories"], 2),
            "fat": round(nutrient_data["fat"], 2),
            "protein": round(nutrient_data["protein"], 2),
            "carbohydrates": round(nutrient_data["carbohydrates"], 2),
            "micronutrients": {k: round(v, 2) for k, v in nutrient_data["micronutrients"].items()},
        }

        total_calories += nutrient_data["calories"]
        total_fat += nutrient_data["fat"]
        total_protein += nutrient_data["protein"]
        total_carbs += nutrient_data["carbohydrates"]

        items_with_nutrients.append(
            {
                "name": food.name,
                "quantity": quantity,
                "unit": unit,
                "calories": nutrient_data["calories"],
                "fat": nutrient_data["fat"],
                "protein": nutrient_data["protein"],
                "carbohydrates": nutrient_data["carbohydrates"],
                "micronutrients": nutrient_data["micronutrients"],
            }
        )

    # Calculate total micronutrients
    total_micronutrients = {}
    for item in items_with_nutrients:
        for nutrient, value in item["micronutrients"].items():
            if nutrient not in total_micronutrients:
                total_micronutrients[nutrient] = 0.0
            total_micronutrients[nutrient] += value

    total_micronutrients = {k: round(v, 2) for k, v in total_micronutrients.items()}

    return {
        "total": {
            "calories": round(total_calories, 2),
            "fat": round(total_fat, 2),
            "protein": round(total_protein, 2),
            "carbohydrates": round(total_carbs, 2),
            "micronutrients": total_micronutrients,
        },
        "items": items_with_nutrients,
    }
