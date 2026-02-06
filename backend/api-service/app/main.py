import os
import json
import uuid
import logging
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
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
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.model import generate_text, get_model_info
from app.tools import NutritionEngine, VisionAnalyzer, RAGRetriever
from app.agents import agent_runner

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API Key configuration
API_KEY = os.environ.get("API_SERVICE_KEY", "")
security = HTTPBearer()

app = FastAPI(
    title="Longevix AI Service",
    description="AI-powered nutrition & health coaching with RAG, tools, and agents using OpenAI Agents SDK",
    version="2.0.0",
)

# Session storage (should be replaced with Redis in production)
sessions: Dict[str, Dict[str, Any]] = {}


async def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify that the request includes the correct API key"""
    if not API_KEY:
        # If no API key is configured, allow all requests (for development)
        return True

    token = credentials.credentials
    if token != API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing API key",
        )
    return True


@app.post("/chat", response_model=ChatResponse, dependencies=[Depends(verify_api_key)])
async def chat(req: ChatRequest):
    """
    Chat endpoint using OpenAI Agents SDK.
    The coach agent handles the conversation with access to nutrition tools,
    RAG retrieval, and vision analysis.
    """
    try:
        logger.info(
            f"Chat request: user_id={req.user_id}, message={req.message[:50]}..."
        )

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
async def chat_with_image(req: ChatWithImageRequest):
    """
    Chat endpoint with image analysis.
    Analyzes the food image and provides chat response with nutrition insights.
    """
    try:
        logger.info(
            f"Chat with image request: user_id={req.user_id}, message={req.message[:50]}..."
        )

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


@app.post(
    "/chat/agent/{agent_name}",
    response_model=ChatResponse,
    dependencies=[Depends(verify_api_key)],
)
async def chat_with_agent(agent_name: str, req: ChatRequest):
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


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ai-service"}


# Model info endpoint
@app.get("/model/info")
async def model_info():
    """Get information about the loaded model"""
    return get_model_info()


# Tool endpoints - Deterministic Nutrition Engine
@app.post("/tools/nutrition/lookup", dependencies=[Depends(verify_api_key)])
async def nutrition_lookup_endpoint(req: NutritionLookupRequest):
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
async def generate_nutrient_endpoint(req: GenerateNutrientRequest):
    """
    Generate nutrient data for multiple food items.
    Matches api-server format for generate-nutrient endpoint.

    Supports units: g, mg, ml, cup, katori, bowl, piece, oz, lb, kg, etc.
    """
    try:
        logger.info(
            f"Generate nutrient request: {len(req.food)} items, time={req.time}"
        )

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
async def calculate_rda_endpoint(req: RDACalculationRequest):
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


# Vision endpoint
@app.post("/tools/vision/analyze", dependencies=[Depends(verify_api_key)])
async def vision_analyze_endpoint(req: VisionAnalyzeRequest):
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


# RAG endpoint
@app.post("/tools/rag/retrieve", dependencies=[Depends(verify_api_key)])
async def rag_retrieve_endpoint(req: RagRetrieveRequest):
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


# Agent management endpoints
@app.get("/agents")
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


# Session management endpoints
@app.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """Get session information"""
    # Check in agent runner sessions
    if session_id in agent_runner.sessions:
        return agent_runner.sessions[session_id]
    raise HTTPException(status_code=404, detail="Session not found")


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a session"""
    if session_id in agent_runner.sessions:
        del agent_runner.sessions[session_id]
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Session not found")
