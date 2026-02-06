from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from enum import Enum


class ChatRequest(BaseModel):
    """
    Request for chat endpoint
    """

    message: str = Field(..., description="User message")
    context: Optional[str] = Field(
        None, description="User context (profile, stats, etc)"
    )
    user_id: Optional[str] = Field(None, description="User ID for session tracking")
    session_id: Optional[str] = Field(
        None, description="Session ID for conversation continuity"
    )


class ChatResponse(BaseModel):
    """
    Response from chat endpoint
    """

    response: str = Field(..., description="AI response")
    session_id: Optional[str] = Field(None, description="Session ID for tracking")


class ToolType(str, Enum):
    """
    Types of tools available
    """

    NUTRITION_LOOKUP = "nutrition_lookup"
    CALCULATE_RDA = "calculate_rda"
    VISION_ANALYZE = "vision_analyze"
    RAG_RETRIEVE = "rag_retrieve"


class ToolCall(BaseModel):
    """
    Representation of a tool call
    """

    tool: ToolType = Field(..., description="Tool to call")
    params: Dict[str, Any] = Field(default_factory=dict, description="Tool parameters")


class AgentResponse(BaseModel):
    """
    Response from agent with potential tool calls
    """

    content: str = Field(..., description="Agent's text response")
    tool_calls: Optional[List[ToolCall]] = Field(
        default=None, description="Tools to execute"
    )
    session_id: Optional[str] = Field(None, description="Session ID")


class NutritionLookupRequest(BaseModel):
    """
    Request for nutrition lookup (deterministic engine)
    """

    food_name: str = Field(..., description="Food item name")
    quantity: Optional[float] = Field(1.0, description="Quantity")
    unit: Optional[str] = Field("serving", description="Unit of measurement")


class NutritionLookupResponse(BaseModel):
    """
    Response from nutrition lookup
    """

    food_name: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: Optional[float] = None
    nutrients: Optional[Dict[str, float]] = None


class Micronutrients(BaseModel):
    """Micronutrients model"""

    vitamin_c: float = 0
    iron: float = 0
    calcium: float = 0
    vitamin_d: float = 0
    vitamin_a: float = 0
    vitamin_b12: float = 0
    vitamin_b6: float = 0
    folate: float = 0
    magnesium: float = 0
    potassium: float = 0
    zinc: float = 0
    selenium: float = 0
    copper: float = 0
    manganese: float = 0
    iodine: float = 0


class FoodItemDto(BaseModel):
    """Food item for generate-nutrient endpoint"""

    name: str
    quantity: float
    unit: Optional[str] = None


class GenerateNutrientRequest(BaseModel):
    """
    Request for generate-nutrient endpoint (matches api-server format)
    """

    is_authenticated: bool = Field(False, alias="isAuthenticated")
    food: List[FoodItemDto]
    time: str = Field(..., description="breakfast, lunch, snack, dinner")


class GenerateNutrientResponse(BaseModel):
    """
    Response from generate-nutrient endpoint
    """

    total: Dict[str, Any]
    items: List[Dict[str, Any]]


class RDACalculationRequest(BaseModel):
    """
    Request for RDA calculation
    """

    user_profile: Dict[str, Any] = Field(
        ..., description="User age, gender, weight, activity level"
    )
    intake: Dict[str, float] = Field(..., description="Current nutrient intake")


class RDACalculationResponse(BaseModel):
    """
    Response from RDA calculation
    """

    rda_values: Dict[str, float] = Field(..., description="RDA for each nutrient")
    percentages: Dict[str, float] = Field(..., description="Percentage of RDA met")
    deficiencies: List[str] = Field(
        default_factory=list, description="Identified deficiencies"
    )


class VisionAnalyzeRequest(BaseModel):
    """
    Request for vision-based food analysis
    """

    image_base64: str = Field(..., description="Base64 encoded image")
    include_nutrition: bool = Field(
        True, description="Whether to include nutrition lookup"
    )


class VisionAnalyzeResponse(BaseModel):
    """
    Response from vision analysis
    """

    detected_foods: List[str] = Field(..., description="List of detected food items")
    nutrition_estimates: Optional[List[NutritionLookupResponse]] = None
    confidence: float = Field(..., description="Confidence score")


class ChatWithImageRequest(BaseModel):
    """
    Request for chat with image endpoint
    """

    message: str = Field(..., description="User message about the image")
    image: str = Field(..., description="Base64 encoded image")
    context: Optional[str] = Field(None, description="User context (profile, stats, etc)")
    user_id: Optional[str] = Field(None, description="User ID for session tracking")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")


class ChatWithImageResponse(BaseModel):
    """
    Response from chat with image endpoint
    """

    response: str = Field(..., description="AI response")
    session_id: Optional[str] = Field(None, description="Session ID for tracking")

class RagRetrieveRequest(BaseModel):
    """
    Request for RAG retrieval
    """

    query: str = Field(..., description="Search query")
    top_k: int = Field(3, description="Number of documents to retrieve")
    filter_tags: Optional[List[str]] = None


class RagRetrieveResponse(BaseModel):
    """
    Response from RAG retrieval
    """

    documents: List[Dict[str, Any]] = Field(..., description="Retrieved documents")
    sources: List[str] = Field(..., description="Source citations")
