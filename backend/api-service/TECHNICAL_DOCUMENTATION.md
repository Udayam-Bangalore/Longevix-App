# API Service Technical Documentation

## Overview

The API Service is an AI-powered nutrition inference service built with FastAPI and Hugging Face Transformers. It provides two main endpoints:
1. `/chat`: AI chat interface for nutrition-related questions
2. `/generate-nutrients`: Nutritional information calculation for food items

## Project Structure

```
backend/api-service/
├── app/
│   ├── main.py          # FastAPI application and endpoints
│   ├── model.py         # AI model initialization and text generation
│   ├── schemas.py       # Pydantic data models for request/response validation
│   └── constants/
│       ├── nutrition_data.py  # Pre-defined nutrition database
│       ├── units.py           # Unit conversion and piece weight constants
│       └── __init__.py
├── llama_3_2_1b_instruct/    # Local LLaMA 3.2 model files
├── requirements.txt          # Python dependencies
├── MODEL_SECURITY.md         # Model security guidelines
└── TECHNICAL_DOCUMENTATION.md # This file
```

## Technology Stack

- **Framework**: FastAPI
- **Model Inference**: Hugging Face Transformers
- **Tokenization**: sentencepiece
- **Machine Learning Framework**: PyTorch
- **Acceleration**: Hugging Face Accelerate
- **API Server**: Uvicorn
- **Data Validation**: Pydantic

## Installation & Setup

### Prerequisites

- Python 3.8 or higher
- pip package manager

### Installation Steps

1. Navigate to the API service directory:
   ```bash
   cd backend/api-service
   ```

2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/macOS
   # or
   .\venv\Scripts\activate  # Windows
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Service

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- Main API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### 1. Chat Endpoint

**POST /chat**

AI-powered chat interface for nutrition-related questions.

#### Request Body
```json
{
  "message": "What are the benefits of eating spinach?"
}
```

**Schema**: `ChatRequest`
- `message`: (string, required) The user's nutrition-related question

#### Response
```json
{
  "response": "Spinach is rich in iron, vitamin C, and antioxidants that support healthy blood cells and immune function."
}
```

**Schema**: `ChatResponse`
- `response`: (string) The AI-generated answer

#### Implementation Details
- Uses LLaMA 3.2 1B Instruct model for text generation
- Handles timeout errors with fallback responses
- Uses thread pooling for async processing
- Response timeout: 30 seconds

### 2. Nutrient Generation Endpoint

**POST /generate-nutrients**

Calculates nutritional information for food items, using a pre-defined database or AI inference if not found.

#### Request Body
```json
{
  "isAuthenticated": true,
  "food": [
    {
      "name": "Apple",
      "quantity": 1,
      "unit": "pcs"
    },
    {
      "name": "Spinach",
      "quantity": 100,
      "unit": "g"
    }
  ],
  "time": "breakfast"
}
```

**Schema**: `GenerateNutrientsRequest`
- `isAuthenticated`: (boolean, required) Authentication status of the user
- `food`: (array of FoodItem, required) List of food items with quantity and unit
- `time`: (string, required) Meal time (breakfast, snack, lunch, dinner)

**FoodItem Schema**:
- `name`: (string, required) Food item name
- `quantity`: (number, required) Quantity
- `unit`: (string, optional, default: "g") Unit of measurement (g, kg, oz, lbs, pcs)

#### Response
```json
{
  "total": {
    "calories": 95.5,
    "fat": 0.5,
    "protein": 1.5,
    "carbohydrates": 25.0,
    "micronutrients": {
      "vitamin_c": 14.0,
      "iron": 3.6,
      "calcium": 99.0,
      "vitamin_a": 469.0,
      "vitamin_b12": 0.0,
      "vitamin_b6": 0.1,
      "folate": 58.0,
      "magnesium": 79.0,
      "potassium": 631.0,
      "zinc": 0.4,
      "selenium": 1.4,
      "copper": 0.1,
      "manganese": 0.8,
      "iodine": 0.0
    }
  },
  "items": [
    {
      "name": "Apple",
      "quantity": 1,
      "unit": "pcs",
      "calories": 52.0,
      "fat": 0.2,
      "protein": 0.3,
      "carbohydrates": 14.0,
      "micronutrients": {
        "vitamin_c": 4.6,
        "iron": 0.3,
        "calcium": 6.0,
        "vitamin_a": 3.0,
        "vitamin_b12": 0.0,
        "vitamin_b6": 0.1,
        "folate": 3.0,
        "magnesium": 5.0,
        "potassium": 107.0,
        "zinc": 0.1,
        "selenium": 0.1,
        "copper": 0.1,
        "manganese": 0.1,
        "iodine": 0.0
      }
    },
    {
      "name": "Spinach",
      "quantity": 100,
      "unit": "g",
      "calories": 43.5,
      "fat": 0.3,
      "protein": 1.2,
      "carbohydrates": 11.0,
      "micronutrients": {
        "vitamin_c": 9.4,
        "iron": 3.3,
        "calcium": 93.0,
        "vitamin_a": 466.0,
        "vitamin_b12": 0.0,
        "vitamin_b6": 0.0,
        "folate": 55.0,
        "magnesium": 74.0,
        "potassium": 524.0,
        "zinc": 0.3,
        "selenium": 1.3,
        "copper": 0.0,
        "manganese": 0.7,
        "iodine": 0.0
      }
    }
  ]
}
```

**Schema**: `GenerateNutrientsResponse`
- `total`: (NutrientInfo) Total nutritional values for all food items
- `items`: (array of FoodItemWithNutrients) Nutritional values per food item

**NutrientInfo Schema**:
- `calories`: (number) Total calories (kcal)
- `fat`: (number) Total fat (g)
- `protein`: (number) Total protein (g)
- `carbohydrates`: (number) Total carbohydrates (g)
- `micronutrients`: (object) Dictionary of micronutrient values

#### Implementation Details

1. **Food Quantity Conversion**:
   - Supports multiple units (g, kg, oz, lbs, pcs)
   - Converts all units to grams for consistent calculation
   - For "pcs" (pieces), uses average weights from `PIECE_WEIGHTS` constant

2. **Nutrition Data Source**:
   - First checks pre-defined nutrition database (`nutrition_data.py`)
   - If not found, uses AI model to generate nutritional information
   - Falls back to default values if AI inference fails

3. **AI Generation**:
   - Uses LLaMA 3.2 1B Instruct model
   - Specifies JSON format for structured output
   - Handles JSON parsing and validation
   - Timeout: 60 seconds

4. **Data Aggregation**:
   - Calculates totals across all food items
   - Rounds values to 2 decimal places
   - Handles micronutrient aggregation

## Configuration

### API Key Authentication

The API Service uses API key authentication to secure inter-service communication. Only authorized services (like api-server) can access the endpoints.

**Environment Variable:** `API_SERVICE_KEY`

**How it works:**
1. If `API_SERVICE_KEY` is set, all requests must include the header: `Authorization: Bearer <API_SERVICE_KEY>`
2. If `API_SERVICE_KEY` is empty or not set, the endpoint allows all requests (development mode)
3. Mismatched or missing keys result in `401 Unauthorized`

**Setup:**
```bash
# Set the same key in both api-service and api-server
export API_SERVICE_KEY=your-secret-key-here

# Generate a secure key (64 characters recommended)
openssl rand -hex 32
```

**Security Notes:**
- Never commit the API key to version control
- Use a strong random key in production (64+ characters)
- Both services must use the exact same key
- This prevents unauthorized direct access to the AI inference service

### Units and Conversions

Located in `app/constants/units.py`:
- `UNIT_CONVERSIONS`: Dictionary of unit conversion factors to grams
- `PIECE_WEIGHTS`: Average weights for common food items in grams per piece

### Nutrition Database

Located in `app/constants/nutrition_data.py`:
- `NUTRITION_DATABASE`: Pre-populated database of common foods with nutritional values per 100g
- `DEFAULT_FALLBACK_NUTRIENTS`: Default values used when AI inference fails

### Model Configuration

Located in `app/model.py`:
- `MODEL_PATH`: Path to the LLaMA 3.2 1B Instruct model
- `generate_text()`: Function for text generation with configurable parameters

#### Model Parameters
- `max_new_tokens`: Maximum length of generated text (default: 150)
- `temperature`: Controls randomness (0.5 = balanced)
- `top_p`: Nucleus sampling parameter (0.9)
- `do_sample`: Deterministic generation (False)
- `num_beams`: Beam search beams (1)
- `early_stopping`: Stop generation when complete (True)

## Performance & Scalability

- **Model Loading**: Model is loaded once during application startup
- **Concurrency**: Uses ThreadPoolExecutor for async processing
- **Timeouts**:
  - Chat endpoint: 30 seconds
  - Nutrient generation: 60 seconds per food item
- **Device Support**: Currently configured for CPU inference (adjustable in model.py)

## Error Handling

- Timeout errors for AI inference
- JSON parsing errors for AI responses
- General exception handling with fallback responses
- Error logging to console

## Security

Refer to `MODEL_SECURITY.md` for detailed security guidelines.

## Future Enhancements

- Support for GPU acceleration
- Batch processing of food items
- Caching of common food items
- Custom nutrition database management
- Support for additional units and food types
- Enhanced AI model training for nutrition data
- Real-time nutrition tracking integration
