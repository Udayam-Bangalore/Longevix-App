import os
import json
import uuid
import logging
import time
import asyncio
import signal
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager
from datetime import datetime
from pydantic import BaseModel, Field, validator
from fastapi import FastAPI, HTTPException, Header, Depends, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from app.schemas import (
    ChatRequest,
    ChatResponse,
    ChatWithImageRequest,
    ChatWithImageResponse,
    NutritionLookupRequest,
    NutritionLookupResponse,
    GenerateNutrientRequest,
    GenerateNutrientResponse,
    RDACalculationRequest,
    RDACalculationResponse,
    VisionAnalyzeRequest,
    VisionAnalyzeResponse,
    RagRetrieveRequest,
    RagRetrieveResponse,
)
from app.model import generate_text, get_model_info
from app.tools import NutritionEngine, VisionAnalyzer, RAGRetriever
from app.agents import agent_runner
from app.session_store import get_session_store, close_redis, use_redis_session

# ============== Configuration ==============
class Settings(BaseModel):
    """Application settings with validation."""
    ENVIRONMENT: str = "development"
    
    # Required settings
    API_SERVICE_KEY: str = ""
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Optional settings with defaults
    MODEL_DEVICE: str = "cpu"
    HF_TOKEN: str = ""
    HF_TEXT_MODEL: str = "moonshotai/Kimi-K2-Instruct"
    HF_VISION_MODEL: str = "llava-hf/llava-1.5-7b-hf"
    HF_INFERENCE_PROVIDER: str = "together"
    USDA_API_KEY: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str = ""
    LOG_LEVEL: str = "INFO"
    OPENAI_AGENTS_TRACING: str = "false"
    RATE_LIMIT_PER_MINUTE: int = 60
    CORS_ORIGINS: str = "*"
    API_SERVICE_PORT: int = 8000
    
    @validator('API_SERVICE_KEY', 'HF_TOKEN', 'USDA_API_KEY', pre=True, always=True)
    def validate_required_keys(cls, v, field):
        if field.name == 'API_SERVICE_KEY':
            if not v or v == "your-secret-api-key-here":
                # In development, allow empty; in production, require it
                if os.environ.get("ENVIRONMENT") == "production":
                    raise ValueError(f"{field.name} must be set in production")
        return v
    
    @validator('RATE_LIMIT_PER_MINUTE')
    def validate_rate_limit(cls, v):
        if v < 1 or v > 1000:
            raise ValueError("RATE_LIMIT_PER_MINUTE must be between 1 and 1000")
        return v

# Load settings from environment
settings = Settings(
    ENVIRONMENT=os.environ.get("ENVIRONMENT", "development"),
    API_SERVICE_KEY=os.environ.get("API_SERVICE_KEY", ""),
    REDIS_URL=os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
    MODEL_DEVICE=os.environ.get("MODEL_DEVICE", "cpu"),
    HF_TOKEN=os.environ.get("HF_TOKEN", ""),
    HF_TEXT_MODEL=os.environ.get("HF_TEXT_MODEL", "moonshotai/Kimi-K2-Instruct"),
    HF_VISION_MODEL=os.environ.get("HF_VISION_MODEL", "llava-hf/llava-1.5-7b-hf"),
    HF_INFERENCE_PROVIDER=os.environ.get("HF_INFERENCE_PROVIDER", "together"),
    USDA_API_KEY=os.environ.get("USDA_API_KEY", ""),
    SUPABASE_URL=os.environ.get("SUPABASE_URL", ""),
    SUPABASE_KEY=os.environ.get("SUPABASE_KEY", ""),
    QDRANT_URL=os.environ.get("QDRANT_URL", "http://localhost:6333"),
    QDRANT_API_KEY=os.environ.get("QDRANT_API_KEY", ""),
    LOG_LEVEL=os.environ.get("LOG_LEVEL", "INFO"),
    OPENAI_AGENTS_TRACING=os.environ.get("OPENAI_AGENTS_TRACING", "false"),
    RATE_LIMIT_PER_MINUTE=int(os.environ.get("RATE_LIMIT_PER_MINUTE", "60")),
    CORS_ORIGINS=os.environ.get("CORS_ORIGINS", "*"),
    API_SERVICE_PORT=int(os.environ.get("API_SERVICE_PORT", "8000")),
)

# ============== Logging ==============
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== Prometheus Metrics ==============
REQUEST_COUNT = Counter(
    'api_requests_total',
    'Total API requests',
    ['method', 'endpoint', 'status_code']
)
REQUEST_LATENCY = Histogram(
    'api_request_duration_seconds',
    'Request latency in seconds',
    ['method', 'endpoint'],
    buckets=[.01, .025, .05, .075, .1, .25, .5, .75, 1.0, 2.5, 5.0, 7.5, 10.0]
)
ACTIVE_REQUESTS = Gauge('active_requests', 'Number of active requests')
HEALTH_CHECKS_TOTAL = Counter('health_checks_total', 'Total health checks', ['status'])
SESSION_COUNT = Gauge('session_count', 'Number of active sessions')

# ============== Rate Limiting ==============
limiter = Limiter(key_func=get_remote_address)

# ============== Shutdown Event ==============
shutdown_event = asyncio.Event()

def signal_handler(sig, frame):
    """Handle shutdown signals gracefully."""
    logger.info(f"Received signal {sig}, initiating graceful shutdown...")
    shutdown_event.set()

signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

# ============== API Key Security ==============
API_KEY = settings.API_SERVICE_KEY
security = HTTPBearer()

async def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify that the request includes the correct API key."""
    if not API_KEY:
        return True
    
    token = credentials.credentials
    if token != API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing API key",
        )
    return True

# ============== Session Store ==============
session_store = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global session_store
    
    logger.info("Starting Longevix AI Service...")
    
    # Initialize session store
    if settings.ENVIRONMENT == "production":
        use_redis_session(True)
        logger.info("Using Redis for session storage in production")
    
    session_store = await get_session_store()
    logger.info(f"Session store initialized: {type(session_store).__name__}")
    
    # Update session count gauge periodically
    async def update_session_stats():
        while not shutdown_event.is_set():
            try:
                stats = await session_store.get_stats()
                SESSION_COUNT.set(stats.get("session_count", 0))
            except Exception:
                pass
            await asyncio.sleep(30)
    
    asyncio.create_task(update_session_stats())
    
    yield
    
    # Shutdown
    logger.info("Shutting down Longevix AI Service...")
    shutdown_event.set()
    
    # Close Redis connection
    await close_redis()
    logger.info("Shutdown complete")

# ============== FastAPI App ==============
app = FastAPI(
    title="Longevix AI Service",
    description="AI-powered nutrition & health coaching with RAG, tools, and agents using OpenAI Agents SDK",
    version="2.0.0",
    lifespan=lifespan,
    docs_url=None if settings.ENVIRONMENT == "production" else "/docs",
    redoc_url=None if settings.ENVIRONMENT == "production" else "/redoc",
)

# ============== Middleware ==============

# Trusted hosts (block host header attacks)
if settings.ENVIRONMENT == "production":
    allowed_hosts = [h.strip() for h in settings.CORS_ORIGINS.split(",") if h.strip()]
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=allowed_hosts,
    )

# CORS
cors_origins = [h.strip() for h in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Metrics and logging middleware
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    ACTIVE_REQUESTS.inc()
    
    try:
        response = await call_next(request)
        status_code = response.status_code
    except Exception as e:
        status_code = 500
        raise
    finally:
        duration = time.time() - start_time
        ACTIVE_REQUESTS.dec()
        
        # Record metrics
        endpoint = request.url.path
        method = request.method
        
        REQUEST_COUNT.labels(
            method=method,
            endpoint=endpoint,
            status_code=status_code
        ).inc()
        
        REQUEST_LATENCY.labels(
            method=method,
            endpoint=endpoint
        ).observe(duration)
        
        # Log request in development
        if settings.LOG_LEVEL == "DEBUG":
            logger.debug(f"{method} {endpoint} {status_code} {duration:.3f}s")
    
    return response

# ============== Health Endpoints ==============

@app.get("/health/live", tags=["Health"])
async def liveness_check():
    """Kubernetes liveness probe - is the app running?"""
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}

@app.get("/health/ready", tags=["Health"])
async def readiness_check():
    """Kubernetes readiness probe - is the app ready to receive traffic?"""
    # Check Redis connection if in production
    if settings.ENVIRONMENT == "production":
        try:
            stats = await session_store.get_stats()
            if stats.get("status") == "disconnected":
                raise HTTPException(status_code=503, detail="Redis not available")
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Readiness check failed: {str(e)}")
    
    HEALTH_CHECKS_TOTAL.labels(status="ready").inc()
    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.ENVIRONMENT,
    }

@app.get("/health/startup", tags=["Health"])
async def startup_check():
    """Kubernetes startup probe - is initialization complete?"""
    return {
        "status": "started",
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.get("/metrics", tags=["Monitoring"])
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )

@app.get("/info", tags=["Info"])
async def app_info():
    """Application information."""
    return {
        "name": "Longevix AI Service",
        "version": "2.0.0",
        "environment": settings.ENVIRONMENT,
        "model": settings.HF_TEXT_MODEL,
        "session_store": type(session_store).__name__ if session_store else "unknown",
    }

# ============== Session Endpoints ==============

@app.get("/sessions/{session_id}", dependencies=[Depends(verify_api_key)])
async def get_session(session_id: str):
    """Get session information"""
    if session_store is None:
        raise HTTPException(status_code=503, detail="Session store not available")
    
    session = await session_store.get(session_id)
    if session:
        return session
    raise HTTPException(status_code=404, detail="Session not found")

@app.delete("/sessions/{session_id}", dependencies=[Depends(verify_api_key)])
async def delete_session(session_id: str):
    """Delete a session"""
    if session_store is None:
        raise HTTPException(status_code=503, detail="Session store not available")
    
    deleted = await session_store.delete(session_id)
    if deleted:
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Session not found")

@app.get("/sessions/stats", dependencies=[Depends(verify_api_key)])
async def session_stats():
    """Get session store statistics"""
    if session_store is None:
        raise HTTPException(status_code=503, detail="Session store not available")
    
    return await session_store.get_stats()

# ============== API Endpoints ==============

@app.post("/chat", response_model=ChatResponse, dependencies=[Depends(verify_api_key)])
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def chat(req: ChatRequest, request: Request):
    """
    Chat endpoint using OpenAI Agents SDK.
    The coach agent handles the conversation with access to nutrition tools,
    RAG retrieval, and vision analysis.
    """
    try:
        logger.info(f"Chat request: user_id={req.user_id}, message={req.message[:50]}...")

        # Use the agent runner with the coach agent
        result = await agent_runner.run(
            agent_name="coach",
            message=req.message,
            session_id=req.session_id,
            user_id=req.user_id,
            context=req.context,
        )

        logger.info("Chat response generated successfully via agent")
        return ChatResponse(
            response=result["response"], session_id=result["session_id"]
        )

    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="I'm sorry, I couldn't process your request at this time. Please try again later.",
        )

@app.post("/chat-with-image", response_model=ChatWithImageResponse, dependencies=[Depends(verify_api_key)])
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def chat_with_image(req: ChatWithImageRequest, request: Request):
    """
    Chat endpoint with image analysis.
    Analyzes the food image and provides chat response with nutrition insights.
    """
    try:
        logger.info(f"Chat with image request: user_id={req.user_id}, message={req.message[:50]}...")

        # First, analyze the image to detect foods
        vision_result = VisionAnalyzer.analyze_image(
            image_base64=req.image, include_nutrition=True
        )

        # Build a prompt that includes vision analysis
        detected_foods = vision_result.get("detected_foods", [])
        nutrition_info = vision_result.get("nutrition_estimates", [])

        # Create a comprehensive message that includes image analysis
        enhanced_message = f"""
User's message: {req.message}

Image Analysis Results:
- Detected foods: {', '.join(detected_foods) if detected_foods else 'Unable to detect specific foods'}

Nutrition estimates for detected foods:
"""
        for nutrition in nutrition_info:
            enhanced_message += f"- {nutrition.get('food_name', 'Food')}: {nutrition.get('calories', 0)} calories, {nutrition.get('protein_g', 0)}g protein, {nutrition.get('carbs_g', 0)}g carbs, {nutrition.get('fat_g', 0)}g fat\n"

        if not detected_foods and not nutrition_info:
            enhanced_message += "- No detailed nutrition information available from image\n"

        # Add context if provided
        if req.context:
            enhanced_message += f"\nUser context:\n{req.context}\n"

        enhanced_message += "\nPlease provide personalized nutrition advice based on this image analysis."

        # Use the agent runner with the coach agent for the chat response
        result = await agent_runner.run(
            agent_name="coach",
            message=enhanced_message,
            session_id=req.session_id,
            user_id=req.user_id,
            context=req.context,
        )

        logger.info("Chat with image response generated successfully via agent")
        return ChatWithImageResponse(
            response=result["response"], session_id=result["session_id"]
        )

    except Exception as e:
        logger.error(f"Chat with image error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="I'm sorry, I couldn't process your image at this time. Please try again later.",
        )

@app.post("/chat/agent/{agent_name}", response_model=ChatResponse, dependencies=[Depends(verify_api_key)])
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def chat_with_agent(agent_name: str, req: ChatRequest, request: Request):
    """
    Chat with a specific agent (coach, nutrition, vision, knowledge).
    Use this endpoint to access specialized agents directly.
    """
    try:
        logger.info(f"Agent chat request: agent={agent_name}, user_id={req.user_id}")

        valid_agents = ["coach", "nutrition", "vision", "knowledge"]
        if agent_name not in valid_agents:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid agent. Choose from: {', '.join(valid_agents)}",
            )

        result = await agent_runner.run(
            agent_name=agent_name,
            message=req.message,
            session_id=req.session_id,
            user_id=req.user_id,
            context=req.context,
        )

        return ChatResponse(
            response=result["response"], session_id=result["session_id"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Agent chat error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="I'm sorry, I couldn't process your request at this time. Please try again later.",
        )

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ai-service"}

@app.get("/model/info", dependencies=[Depends(verify_api_key)])
async def model_info():
    """Get information about the loaded model"""
    return get_model_info()

# Tool endpoints - Deterministic Nutrition Engine

@app.post("/tools/nutrition/lookup", dependencies=[Depends(verify_api_key)])
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def nutrition_lookup_endpoint(req: NutritionLookupRequest, request: Request):
    """
    Look up nutrition data for a food item.
    Uses USDA API if available, falls back to local database.
    """
    try:
        logger.info(f"Nutrition lookup: {req.food_name}")
        result = await NutritionEngine.lookup_food(
            food_name=req.food_name,
            quantity=req.quantity or 1.0,
            unit=req.unit or "serving",
        )
        return result
    except Exception as e:
        logger.error(f"Nutrition lookup error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/generate-nutrient", dependencies=[Depends(verify_api_key)])
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def generate_nutrient_endpoint(req: GenerateNutrientRequest, request: Request):
    """
    Generate nutrient data for multiple food items.
    Matches api-server format for generate-nutrient endpoint.

    Supports units: g, mg, ml, cup, katori, bowl, piece, oz, lb, kg, etc.
    """
    try:
        logger.info(f"Generate nutrient request: {len(req.food)} items, time={req.time}")

        items_with_nutrients = []
        total = {
            "calories": 0,
            "fat": 0,
            "protein": 0,
            "carbohydrates": 0,
            "micronutrients": {},
        }

        for food in req.food:
            quantity = food.quantity
            unit = food.unit or "g"

            nutrition = await NutritionEngine.lookup_food(
                food_name=food.name, quantity=quantity, unit=unit
            )

            if "error" not in nutrition:
                total["calories"] += nutrition.get("calories", 0)
                total["fat"] += nutrition.get("fat_g", 0)
                total["protein"] += nutrition.get("protein_g", 0)
                total["carbohydrates"] += nutrition.get("carbs_g", 0)

                for key, value in nutrition.get("micronutrients", {}).items():
                    total["micronutrients"][key] = (
                        total["micronutrients"].get(key, 0) + value
                    )

            items_with_nutrients.append(
                {"name": food.name, "quantity": quantity, "unit": unit, **nutrition}
            )

        return GenerateNutrientResponse(
            total={
                "calories": round(total["calories"], 1),
                "fat": round(total["fat"], 1),
                "protein": round(total["protein"], 1),
                "carbohydrates": round(total["carbohydrates"], 1),
                "micronutrients": {
                    k: round(v, 2) for k, v in total["micronutrients"].items()
                },
            },
            items=items_with_nutrients,
        )

    except Exception as e:
        logger.error(f"Generate nutrient error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tools/nutrition/rda", dependencies=[Depends(verify_api_key)])
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def calculate_rda_endpoint(req: RDACalculationRequest, request: Request):
    """
    Calculate RDA percentages for user intake.
    Deterministic - no LLM involved.
    """
    try:
        logger.info("RDA calculation request")
        result = NutritionEngine.calculate_rda(
            user_profile=req.user_profile, intake=req.intake
        )
        return result
    except Exception as e:
        logger.error(f"RDA calculation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tools/vision/analyze", dependencies=[Depends(verify_api_key)])
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def vision_analyze_endpoint(req: VisionAnalyzeRequest, request: Request):
    """
    Analyze food image to detect items.
    Uses vision model (placeholder implementation).
    """
    try:
        logger.info("Vision analysis request")
        result = VisionAnalyzer.analyze_image(
            image_base64=req.image_base64, include_nutrition=req.include_nutrition
        )
        return result
    except Exception as e:
        logger.error(f"Vision analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tools/rag/retrieve", dependencies=[Depends(verify_api_key)])
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def rag_retrieve_endpoint(req: RagRetrieveRequest, request: Request):
    """
    Retrieve relevant documents from knowledge base.
    Uses vector search (placeholder implementation).
    """
    try:
        logger.info(f"RAG retrieval: {req.query}")
        result = RAGRetriever.retrieve(
            query=req.query, top_k=req.top_k, filter_tags=req.filter_tags
        )
        return result
    except Exception as e:
        logger.error(f"RAG retrieval error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agents", dependencies=[Depends(verify_api_key)])
async def list_agents():
    """List all available agents"""
    return {
        "agents": [
            {
                "name": "coach",
                "description": "Main Health Coach - general nutrition and health guidance",
                "tools": [
                    "nutrition_lookup",
                    "calculate_rda",
                    "calculate_meal_nutrition",
                    "rag_retrieve",
                    "vision_analyze",
                ],
            },
            {
                "name": "nutrition",
                "description": "Nutrition Specialist - detailed nutrition calculations and analysis",
                "tools": [
                    "nutrition_lookup",
                    "calculate_rda",
                    "calculate_meal_nutrition",
                ],
            },
            {
                "name": "vision",
                "description": "Food Vision Analyst - analyzes food images and identifies items",
                "tools": ["vision_analyze", "nutrition_lookup"],
            },
            {
                "name": "knowledge",
                "description": "Knowledge Retrieval Specialist - evidence-based health information",
                "tools": ["rag_retrieve"],
            },
        ]
    }
