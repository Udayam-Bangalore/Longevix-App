#!/usr/bin/env python3
"""
Test all LiteLLM + Hugging Face models
Tests: Text (Kimi-K2), Vision (BLIP), Embeddings, USDA Nutrition
"""

import os
import sys
import base64

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.model import generate_text, get_model_info, get_embeddings
from app.tools import NutritionEngine, VisionAnalyzer

print("=" * 60)
print("Testing All Models")
print("=" * 60)

# Show configuration
print("\n📋 Configuration:")
print(
    f"  HF_TEXT_MODEL:   {os.environ.get('HF_TEXT_MODEL', 'moonshotai/Kimi-K2-Instruct')}"
)
print(
    f"  HF_VISION_MODEL: {os.environ.get('HF_VISION_MODEL', 'llava-hf/llava-1.5-7b-hf')}"
)
print(
    f"  EMBEDDING_MODEL: {os.environ.get('EMBEDDING_MODEL', 'sentence-transformers/all-MiniLM-L6-v2')}"
)
print(f"  PROVIDER:        {os.environ.get('HF_INFERENCE_PROVIDER', 'together')}")
print(f"  USDA_API_KEY:    {'Set' if os.environ.get('USDA_API_KEY') else 'Not set'}")
print()

# =============================================================================
# Test 1: Text Generation (Kimi-K2-Instruct)
# =============================================================================
print("=" * 60)
print("🧪 Test 1: Text Generation (Kimi-K2-Instruct)")
print("=" * 60)

try:
    response = generate_text(
        prompt="What are 3 health benefits of eating apples?",
        max_tokens=150,
        temperature=0.7,
    )
    print(f"✅ Response: {response}")
except Exception as e:
    print(f"❌ Error: {e}")

print()

# =============================================================================
# Test 2: Embeddings (all-MiniLM-L6-v2)
# =============================================================================
print("=" * 60)
print("🧪 Test 2: Embeddings (all-MiniLM-L6-v2)")
print("=" * 60)

try:
    text = "The health benefits of eating vegetables"
    embeddings = get_embeddings(text)
    print(f"✅ Input: {text}")
    print(f"   Dimensions: {len(embeddings)}")
    print(f"   First 5 values: {embeddings[:5]}")
except Exception as e:
    print(f"❌ Error: {e}")

print()

# =============================================================================
# Test 3: USDA Nutrition Lookup (various units)
# =============================================================================
print("=" * 60)
print("🧪 Test 3: USDA Nutrition Lookup (Unit Conversion)")
print("=" * 60)

test_cases = [
    {"food": "rice", "quantity": 1, "unit": "cup"},
    {"food": "chicken breast", "quantity": 150, "unit": "g"},
    {"food": "egg", "quantity": 2, "unit": "piece"},
    {"food": "banana", "quantity": 1, "unit": "piece"},
    {"food": "milk", "quantity": 250, "unit": "ml"},
    {"food": "apple", "quantity": 1, "unit": "piece"},
]

for tc in test_cases:
    try:
        result = await NutritionEngine.lookup_food(
            food_name=tc["food"], quantity=tc["quantity"], unit=tc["unit"]
        )
        print(
            f"✅ {tc['quantity']} {tc['unit']} {tc['food']}: {result.get('calories', 'N/A')} cal"
        )
        print(
            f"   Protein: {result.get('protein_g', 'N/A')}g, Carbs: {result.get('carbs_g', 'N/A')}g, Fat: {result.get('fat_g', 'N/A')}g"
        )
        print(f"   Source: {result.get('source', 'unknown')}")
    except Exception as e:
        print(f"❌ {tc['food']}: {e}")

print()

# =============================================================================
# Test 4: Vision (BLIP - Local CPU)
# =============================================================================
print("=" * 60)
print("🧪 Test 4: Vision (BLIP - Local CPU)")
print("=" * 60)

try:
    from PIL import Image
    import io

    img = Image.new("RGB", (100, 100), color="red")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="JPEG")
    img_byte_arr = img_byte_arr.getvalue()
    image_base64 = base64.b64encode(img_byte_arr).decode("utf-8")

    print("📷 Testing with sample image...")

    result = VisionAnalyzer.analyze_image(image_base64, include_nutrition=True)
    print(f"✅ Vision Result: {result}")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback

    traceback.print_exc()

print()

# =============================================================================
# Test 5: Generate Nutrient (batch endpoint)
# =============================================================================
print("=" * 60)
print("🧪 Test 5: Generate Nutrient (Batch)")
print("=" * 60)

try:
    foods = [
        {"name": "rice", "quantity": 1, "unit": "cup"},
        {"name": "chicken breast", "quantity": 150, "unit": "g"},
        {"name": "dal", "quantity": 1, "unit": "bowl"},
    ]

    print("📋 Testing meal nutrition calculation...")
    total_calories = 0
    for food in foods:
        result = await NutritionEngine.lookup_food(
            food_name=food["name"], quantity=food["quantity"], unit=food["unit"]
        )
        total_calories += result.get("calories", 0)
        print(
            f"   {food['quantity']} {food['unit']} {food['name']}: {result.get('calories', 0)} cal"
        )

    print(f"\n✅ Total meal calories: {round(total_calories, 1)} kcal")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback

    traceback.print_exc()

print()

# =============================================================================
# Summary
# =============================================================================
print("=" * 60)
print("📊 Model Info")
print("=" * 60)
info = get_model_info()
for key, value in info.items():
    print(f"  {key}: {value}")

print()
print("=" * 60)
print("🔗 Postman API Endpoints")
print("=" * 60)

print("""
# Base URL
{{baseUrl}} = http://localhost:8000

# 1. Chat with Coach Agent
POST {{baseUrl}}/chat
Authorization: Bearer <your-api-key>
Content-Type: application/json

{
    "message": "What are the health benefits of eggs?",
    "user_id": "user123",
    "session_id": "session123"
}

# 2. Generate Nutrients (batch with unit conversion)
POST {{baseUrl}}/ai/generate-nutrient
Authorization: Bearer <your-api-key>
Content-Type: application/json

{
    "isAuthenticated": true,
    "food": [
        {"name": "rice", "quantity": 1, "unit": "cup"},
        {"name": "chicken breast", "quantity": 150, "unit": "g"},
        {"name": "egg", "quantity": 2, "unit": "piece"}
    ],
    "time": "lunch"
}

# 3. Single Nutrition Lookup
POST {{baseUrl}}/tools/nutrition/lookup
Authorization: Bearer <your-api-key>
Content-Type: application/json

{
    "food_name": "rice",
    "quantity": 1,
    "unit": "cup"
}

# 4. Vision Analysis
POST {{baseUrl}}/tools/vision/analyze
Authorization: Bearer <your-api-key>
Content-Type: application/json

{
    "image_base64": "<base64-encoded-image>",
    "include_nutrition": true
}

# 5. Health Check
GET {{baseUrl}}/health
""")

print("=" * 60)
print("✅ All tests completed!")
print("=" * 60)
print("Testing All Models")
print("=" * 60)

# Show configuration
print("\n📋 Configuration:")
print(
    f"  HF_TEXT_MODEL:   {os.environ.get('HF_TEXT_MODEL', 'moonshotai/Kimi-K2-Instruct')}"
)
print(
    f"  HF_VISION_MODEL: {os.environ.get('HF_VISION_MODEL', 'llava-hf/llava-1.5-7b-hf')}"
)
print(
    f"  EMBEDDING_MODEL: {os.environ.get('EMBEDDING_MODEL', 'sentence-transformers/all-MiniLM-L6-v2')}"
)
print(f"  PROVIDER:        {os.environ.get('HF_INFERENCE_PROVIDER', 'together')}")
print()

# =============================================================================
# Test 1: Text Generation (Kimi-K2-Instruct)
# =============================================================================
print("=" * 60)
print("🧪 Test 1: Text Generation (Kimi-K2-Instruct)")
print("=" * 60)

try:
    response = generate_text(
        prompt="What are 3 health benefits of eating apples?",
        max_tokens=150,
        temperature=0.7,
    )
    print(f"✅ Response: {response}")
except Exception as e:
    print(f"❌ Error: {e}")

print()

# =============================================================================
# Test 2: Embeddings (all-MiniLM-L6-v2)
# =============================================================================
print("=" * 60)
print("🧪 Test 2: Embeddings (all-MiniLM-L6-v2)")
print("=" * 60)

try:
    text = "The health benefits of eating vegetables"
    embeddings = get_embeddings(text)
    print(f"✅ Input: {text}")
    print(f"   Dimensions: {len(embeddings)}")
    print(f"   First 5 values: {embeddings[:5]}")
except Exception as e:
    print(f"❌ Error: {e}")

print()

# =============================================================================
# Test 3: Vision (BLIP - Local CPU)
# =============================================================================
print("=" * 60)
print("🧪 Test 3: Vision (BLIP - Local CPU)")
print("=" * 60)

try:
    # Create a simple test image (colored rectangle as placeholder)
    from PIL import Image
    import io

    # Create a dummy image (red square)
    img = Image.new("RGB", (100, 100), color="red")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="JPEG")
    img_byte_arr = img_byte_arr.getvalue()
    image_base64 = base64.b64encode(img_byte_arr).decode("utf-8")

    print("📷 Testing with sample image...")

    result = VisionAnalyzer.analyze_image(image_base64, include_nutrition=True)
    print(f"✅ Vision Result: {result}")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback

    traceback.print_exc()

print()

# =============================================================================
# Summary
# =============================================================================
print("=" * 60)
print("📊 Model Info")
print("=" * 60)
info = get_model_info()
for key, value in info.items():
    print(f"  {key}: {value}")

print()
print("=" * 60)
print("🔗 Postman API Endpoints")
print("=" * 60)

print("""
# Base URL
{{baseUrl}} = http://localhost:8000

# 1. Chat with Coach Agent
POST {{baseUrl}}/chat
Authorization: Bearer <your-api-key>
Content-Type: application/json

{
    "message": "What are the health benefits of eggs?",
    "user_id": "user123",
    "session_id": "session123"
}

# 2. Chat with Specific Agent
POST {{baseUrl}}/chat/agent/nutrition
Authorization: Bearer <your-api-key>
Content-Type: application/json

{
    "message": "How much protein in 100g chicken breast?",
    "user_id": "user123"
}

# 3. Vision Analysis
POST {{baseUrl}}/tools/vision/analyze
Authorization: Bearer <your-api-key>
Content-Type: application/json

{
    "image_base64": "<base64-encoded-image>",
    "include_nutrition": true
}

# 4. Nutrition Lookup
POST {{baseUrl}}/tools/nutrition/lookup
Authorization: Bearer <your-api-key>
Content-Type: application/json

{
    "food_name": "rice",
    "quantity": 1,
    "unit": "serving"
}

# 5. RDA Calculation
POST {{baseUrl}}/tools/nutrition/rda
Authorization: Bearer <your-api-key>
Content-Type: application/json

{
    "user_profile": {
        "age": 30,
        "gender": "male",
        "weight_kg": 70,
        "activity_level": "moderate"
    },
    "intake": {
        "calories": 1800,
        "protein_g": 50,
        "fiber_g": 15
    }
}

# 6. RAG Retrieval
POST {{baseUrl}}/tools/rag/retrieve
Authorization: Bearer <your-api-key>
Content-Type: application/json

{
    "query": "healthy breakfast options",
    "top_k": 3
}

# 7. List Agents
GET {{baseUrl}}/agents

# 8. Health Check
GET {{baseUrl}}/health

# 9. Model Info
GET {{baseUrl}}/model/info
""")

print("=" * 60)
print("✅ All tests completed!")
print("=" * 60)
