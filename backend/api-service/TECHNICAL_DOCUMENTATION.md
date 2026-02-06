# API Service Technical Documentation

## Overview

The API Service is an AI-powered nutrition and health coaching service built with FastAPI and Hugging Face Transformers. It follows the Architecture.md specifications with:
- **Nutrition Engine** - Deterministic nutrition calculations (NO LLM)
- **AI Coach Service** - LLM-based chat with tool calling
- **Vision Food Analyzer** - Image-based food detection
- **Vector Search (RAG)** - Evidence-based knowledge retrieval
- **OpenAI SDK Agent Layer** - Session memory, tool calling, agent handoffs

## Project Structure

```
backend/api-service/
├── app/
│   ├── __init__.py          # Module initialization
│   ├── main.py              # FastAPI application and endpoints
│   ├── model.py             # AI model initialization and text generation
│   ├── schemas.py           # Pydantic data models for request/response validation
│   ├── agents.py            # OpenAI SDK-style agent layer
│   ├── tools.py             # Deterministic tools (nutrition, vision, RAG)
│   └── constants/           # (legacy) Pre-defined nutrition database
│       ├── nutrition_data.py
│       ├── units.py
│       └── __init__.py
├── llama_3_2_1b_instruct/   # Local LLaMA 3.2 model files
├── requirements.txt         # Python dependencies
├── .env.example             # Environment variables template
├── MODEL_SECURITY.md        # Model security guidelines
├── Architecutre.md          # System architecture specifications
└── TECHNICAL_DOCUMENTATION.md # This file
```

## Technology Stack

- **Framework**: FastAPI
- **Model Inference**: LiteLLM + Hugging Face Inference API
- **Agent Layer**: OpenAI Agents SDK with LiteLLM proxy
- **LLM Provider**: Hugging Face (BioMistral-7B / Phi-3-mini)
- **Tokenization**: sentencepiece
- **Machine Learning Framework**: PyTorch
- **Acceleration**: Hugging Face Accelerate
- **API Server**: Uvicorn
- **Data Validation**: Pydantic
- **HTTP Client**: httpx
- **Authentication**: python-jose, passlib

## LiteLLM + Hugging Face Integration

This service uses **LiteLLM** to interface with **Hugging Face Inference API** for LLM capabilities. This allows us to use free-tier Hugging Face models while maintaining OpenAI SDK compatibility.

### Model Configuration

Based on Architecture.md recommendations:

| Component | Recommended Models | Size |
|-----------|-------------------|------|
| **Text LLM** | BioMistral-7B OR Phi-3-mini | ≤ 7B params |
| **Vision** | LLaVA-1.5-7B | 7B params |
| **Embeddings** | all-MiniLM-L6-v2 | Small, fast |

### Configuration

Set the following environment variables in `.env`:

```env
# Hugging Face Token (required)
HF_TOKEN=your-huggingface-token-here

# Text Model (default: microsoft/Phi-3-mini-4k-instruct)
HF_TEXT_MODEL=microsoft/Phi-3-mini-4k-instruct

# Vision Model (optional)
HF_VISION_MODEL=llava-hf/llava-1.5-7b-hf

# Custom API Base (optional, for LiteLLM proxy)
# OPENAI_BASE_URL=http://localhost:8000/v1
```

### How It Works

1. **Agents** (`app/agents.py`) use OpenAI Agents SDK
2. **LiteLLM** proxies requests to Hugging Face Inference API
3. **Model** (`app/model.py`) provides direct LiteLLM interface for custom operations
4. All agents specify `model=f"openai/{HF_TEXT_MODEL}"` to route through LiteLLM

### Testing

Run the test script to verify integration:

```bash
python test_litellm_hf.py
```

## Installation & Setup

### Prerequisites

- Python 3.8 or higher
- pip package manager
- 4GB+ RAM (for CPU inference)

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

4. Copy environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys
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

AI-powered chat interface for nutrition and health coaching with session management.

#### Request Body
```json
{
  "message": "How much protein is in chicken breast?",
  "context": "User is 30 years old, male, 70kg, active lifestyle",
  "user_id": "user-123",
  "session_id": "session-456"
}
```

**Schema**: `ChatRequest`
- `message`: (string, required) The user's question
- `context`: (string, optional) User profile and context
- `user_id`: (string, optional) User ID for tracking
- `session_id`: (string, optional) Session ID for conversation continuity

#### Response
```json
{
  "response": "Chicken breast contains about 31g of protein per 100g serving. This information is for educational purposes only. Consult a healthcare professional for personalized medical advice.",
  "session_id": "session-456"
}
```

**Schema**: `ChatResponse`
- `response`: (string) The AI-generated answer with medical disclaimer
- `session_id`: (string) Session ID for tracking

#### Implementation Details
- Uses LLaMA 3.2 1B Instruct model for text generation
- Maintains conversation history (last 5 messages)
- Requires medical disclaimers for health claims
- Session storage in memory (Redis recommended for production)

---

### 2. Nutrition Lookup Endpoint

**POST /tools/nutrition/lookup**

Deterministic nutrition data lookup (NO LLM). Queries the USDA-based food database.

#### Request Body
```json
{
  "food_name": "chicken breast",
  "quantity": 150,
  "unit": "g"
}
```

**Schema**: `NutritionLookupRequest`
- `food_name`: (string, required) Name of the food
- `quantity`: (number, optional, default: 1.0) Amount
- `unit`: (string, optional, default: "serving") Unit of measurement

#### Response
```json
{
  "food_name": "chicken breast",
  "calories": 247.5,
  "protein_g": 46.5,
  "carbs_g": 0,
  "fat_g": 5.4,
  "fiber_g": 0,
  "serving": "150 g"
}
```

**Schema**: `NutritionLookupResponse`
- `food_name`: (string) Food name
- `calories`: (number) Calories
- `protein_g`: (number) Protein in grams
- `carbs_g`: (number) Carbohydrates in grams
- `fat_g`: (number) Fat in grams
- `fiber_g`: (number) Fiber in grams
- `serving`: (string) Serving size

---

### 3. RDA Calculation Endpoint

**POST /tools/nutrition/rda**

Calculate Recommended Daily Allowance percentages (deterministic).

#### Request Body
```json
{
  "user_profile": {
    "gender": "male",
    "age": 30,
    "weight": 70,
    "activity_level": "moderate"
  },
  "intake": {
    "calories": 1800,
    "protein_g": 80,
    "fiber_g": 20
  }
}
```

**Schema**: `RDACalculationRequest`
- `user_profile`: (object) User demographics
- `intake`: (object) Current nutrient intake

#### Response
```json
{
  "rda_values": {
    "calories": 2500,
    "protein_g": 50,
    "fiber_g": 25
  },
  "percentages": {
    "calories": 72.0,
    "protein_g": 160.0,
    "fiber_g": 80.0
  },
  "deficiencies": []
}
```

---

### 4. Vision Analysis Endpoint

**POST /tools/vision/analyze**

Analyze food images to detect items (placeholder - requires vision model integration).

#### Request Body
```json
{
  "image_base64": "base64encodedimage...",
  "include_nutrition": true
}
```

**Schema**: `VisionAnalyzeRequest`
- `image_base64`: (string, required) Base64 encoded image
- `include_nutrition`: (boolean, optional, default: true) Include nutrition lookup

#### Response
```json
{
  "detected_foods": ["rice", "dal", "roti"],
  "nutrition_estimates": {
    "totals": {
      "calories": 450,
      "protein_g": 15,
      "carbs_g": 75,
      "fat_g": 8,
      "fiber_g": 8
    },
    "items": [...]
  },
  "confidence": 0.85,
  "note": "This is a placeholder. Implement actual vision model integration."
}
```

---

### 5. RAG Retrieval Endpoint

**POST /tools/rag/retrieve**

Retrieve evidence-based health information (placeholder - requires vector DB).

#### Request Body
```json
{
  "query": "recommended protein intake",
  "top_k": 3,
  "filter_tags": ["nutrition", "protein"]
}
```

**Schema**: `RagRetrieveRequest`
- `query`: (string, required) Search query
- `top_k`: (number, optional, default: 3) Number of documents
- `filter_tags`: (array, optional) Filter by tags

#### Response
```json
{
  "documents": [
    {
      "content": "The recommended daily allowance (RDA) for protein...",
      "source": "WHO Guidelines",
      "tags": ["protein", "rda", "nutrition"]
    }
  ],
  "sources": ["WHO Guidelines"],
  "query": "recommended protein intake"
}
```

---

### 6. Health Check Endpoint

**GET /health**

Service health check.

#### Response
```json
{
  "status": "healthy",
  "service": "ai-service"
}
```

---

### 7. Model Info Endpoint

**GET /model/info**

Get information about the loaded model.

#### Response
```json
{
  "model_path": "./llama_3_2_1b_instruct",
  "device": "cpu",
  "loaded": true
}
```

---

### 8. Session Management Endpoints

**GET /sessions/{session_id}**

Get session information.

**DELETE /sessions/{session_id}**

Delete a session.

---

## Agent Architecture

The service implements an OpenAI SDK-style agent layer:

### Agents

1. **CoachAgent** (`app/agents.py`)
   - Main chat agent for health coaching
   - Can handoff to specialists
   - Must use tools for nutrition data

2. **NutritionToolAgent**
   - Calls deterministic nutrition engine
   - Handles food lookups and RDA calculations

3. **VisionToolAgent**
   - Analyzes food images
   - Returns detected items with nutrition

4. **KnowledgeToolAgent**
   - RAG retrieval for medical info
   - Provides evidence-based answers

### Tool Calling

Agents can call tools using the format:
```
TOOL_CALL: {"tool": "nutrition_lookup", "params": {"food_name": "apple", "quantity": 1}}
```

### Agent Handoffs

Agents can handoff to specialists:
```
HANDOFF: vision
```

---

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Required |
|----------|-------------|----------|
| `API_SERVICE_KEY` | API authentication key | Yes |
| `MODEL_PATH` | Path to local LLM model | Yes |
| `MODEL_DEVICE` | CPU or GPU | No (default: cpu) |
| `OPENAI_API_KEY` | OpenAI API key | No |
| `HF_TOKEN` | Hugging Face token | No |
| `SUPABASE_URL` | Supabase project URL | No |
| `SUPABASE_KEY` | Supabase API key | No |
| `QDRANT_URL` | Qdrant vector DB URL | No |
| `QDRANT_API_KEY` | Qdrant API key | No |
| `LOG_LEVEL` | Logging level | No (default: INFO) |

### API Key Authentication

The API Service uses API key authentication:

1. Set `API_SERVICE_KEY` in `.env`
2. Include header in requests: `Authorization: Bearer <API_SERVICE_KEY>`
3. If not set, allows all requests (development mode only)

Generate a secure key:
```bash
openssl rand -hex 32
```

---

## Model Configuration

Located in `app/model.py`:

### Lazy Loading
- Model loaded on first use (not at startup)
- Reduces initial startup time
- Configurable via environment variables

### Generation Parameters
- `max_new_tokens`: Maximum tokens to generate
- `temperature`: Randomness (0.0 = deterministic, 1.0 = creative)
- `top_p`: Nucleus sampling
- `stop_sequences`: Sequences to stop generation

---

## Performance & Scalability

- **Model Loading**: Lazy loading on first request
- **Concurrency**: FastAPI async handling
- **Session Storage**: In-memory (Redis recommended for production)
- **Device Support**: CPU inference (GPU configurable)

---

## Error Handling

- Timeout errors for AI inference
- JSON parsing errors for tool calls
- Session not found errors
- General exception handling with fallback responses
- Structured logging

---

## Security

Refer to `MODEL_SECURITY.md` for detailed security guidelines.

Key points:
- Never commit `.env` to version control
- Use strong API keys in production
- Medical disclaimers required for health claims
- No hallucination of medical data

---

## Future Enhancements

- [ ] Integrate BLIP-2 or LLaVA for vision
- [ ] Implement Qdrant/pgvector for RAG
- [ ] Expand USDA food database
- [ ] Add Redis for session storage
- [ ] GPU acceleration support
- [ ] Batch processing endpoints
- [ ] WebSocket streaming responses
- [ ] Agent orchestration in chat

---

## Architecture Alignment

This implementation follows the Architecture.md specifications:

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Nutrition Engine (NO LLM) | ✅ | `app/tools.py` - NutritionEngine |
| AI Coach Service (LLM) | ✅ | `app/agents.py` - CoachAgent |
| Vision Food Analyzer | ✅ | `app/tools.py` - VisionAnalyzer (placeholder) |
| Vector Search (RAG) | ✅ | `app/tools.py` - RAGRetriever (placeholder) |
| OpenAI SDK Agent Layer | ✅ | `app/agents.py` - AgentRunner |
| Session Memory | ✅ | Session storage in `app/main.py` |
| Tool Calling | ✅ | ToolCall parsing in `app/agents.py` |
| Agent Handoffs | ✅ | Handoff support in `app/agents.py` |
| Medical Disclaimers | ✅ | Enforced in chat prompt |
| Small Models (<=7B) | ✅ | Uses Llama 3.2 1B |
