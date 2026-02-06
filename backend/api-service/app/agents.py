"""
Agent layer using OpenAI Agents SDK with LiteLLM for Hugging Face models.
Provides agent orchestration, tool calling, and handoffs for the AI service.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum

from agents import (
    Agent,
    Runner,
    function_tool,
    RunContextWrapper,
)
from agents.tracing import set_tracing_disabled
import litellm

from app.tools import NutritionEngine, VisionAnalyzer, RAGRetriever

logger = logging.getLogger(__name__)

# Disable tracing for local development (set OPENAI_AGENTS_TRACING=true to enable)
set_tracing_disabled(os.environ.get("OPENAI_AGENTS_TRACING", "false").lower() != "true")

# LiteLLM + Hugging Face Configuration
HF_TOKEN = os.environ.get("HF_TOKEN", "")

# Hugging Face model for text generation (architecture.md recommendations)
HF_TEXT_MODEL = os.environ.get("HF_TEXT_MODEL", "moonshotai/Kimi-K2-Instruct")

# Build LiteLLM-compatible base URL for Hugging Face Inference Providers
# The new router.huggingface.co endpoint provides access to multiple inference providers
# Kimi-K2-Instruct from Moonshot AI (supports up to 128k context)
# Providers: together, sambanova, fal, replicate, hyperbolic, nebius, novita
DEFAULT_PROVIDER = os.environ.get("HF_INFERENCE_PROVIDER", "together")
LITELLM_BASE_URL = f"https://router.huggingface.co/{DEFAULT_PROVIDER}/v1"


class AgentContext:
    """Context passed to agents during execution"""

    def __init__(self, user_id: Optional[str] = None, session_id: Optional[str] = None):
        self.user_id = user_id
        self.session_id = session_id
        self.metadata: Dict[str, Any] = {}


# ============================================================================
# Tool Definitions using OpenAI Agents SDK
# ============================================================================


@function_tool
async def nutrition_lookup(
    ctx: RunContextWrapper[AgentContext],
    food_name: str,
    quantity: float = 1.0,
    unit: str = "serving",
) -> str:
    """
    Look up nutrition data for a food item from the USDA database.

    Args:
        food_name: Name of the food (e.g., "rice", "chicken breast", "apple")
        quantity: Amount of food (default: 1.0)
        unit: Unit of measurement - "serving", "g", "gram", "grams" (default: "serving")

    Returns:
        JSON string with nutrition data including calories, protein_g, carbs_g, fat_g, fiber_g
    """
    logger.info(f"Tool: nutrition_lookup - {food_name}, {quantity} {unit}")
    result = await NutritionEngine.lookup_food(
        food_name=food_name, quantity=quantity or 1.0, unit=unit or "serving"
    )
    return json.dumps(result, indent=2)


@function_tool
async def calculate_rda(
    ctx: RunContextWrapper[AgentContext], user_profile: str, intake: str
) -> str:
    """
    Calculate RDA (Recommended Daily Allowance) percentages for user intake.

    Args:
        user_profile: JSON string with user profile containing age, gender, weight, activity_level
        intake: JSON string with current nutrient intake values (calories, protein_g, fiber_g, etc.)

    Returns:
        JSON string with RDA values, percentages met, and any deficiencies
    """
    logger.info(f"Tool: calculate_rda")
    try:
        profile = json.loads(user_profile)
        intake_data = json.loads(intake)
        result = NutritionEngine.calculate_rda(profile, intake_data)
        return json.dumps(result, indent=2)
    except json.JSONDecodeError as e:
        return json.dumps({"error": f"Invalid JSON: {str(e)}"})


@function_tool
async def calculate_meal_nutrition(
    ctx: RunContextWrapper[AgentContext], food_items: str
) -> str:
    """
    Calculate total nutrition for a meal with multiple food items.

    Args:
        food_items: JSON string with list of food items, each with food_name, quantity, unit
        Example: '[{"food_name": "rice", "quantity": 1, "unit": "serving"}, {"food_name": "dal", "quantity": 1, "unit": "serving"}]'

    Returns:
        JSON string with total nutrition values and per-item breakdown
    """
    logger.info(f"Tool: calculate_meal_nutrition")
    try:
        items = json.loads(food_items)
        result = await NutritionEngine.calculate_meal_nutrition(items)
        return json.dumps(result, indent=2)
    except json.JSONDecodeError as e:
        return json.dumps({"error": f"Invalid JSON: {str(e)}"})


@function_tool
async def vision_analyze(
    ctx: RunContextWrapper[AgentContext],
    image_base64: str,
    include_nutrition: bool = True,
) -> str:
    """
    Analyze a food image to detect food items and estimate portions.

    Args:
        image_base64: Base64 encoded image data
        include_nutrition: Whether to include nutrition lookup for detected foods (default: True)

    Returns:
        JSON string with detected foods, confidence scores, and optional nutrition data
    """
    logger.info(f"Tool: vision_analyze")
    result = VisionAnalyzer.analyze_image(image_base64, include_nutrition)
    return json.dumps(result, indent=2)


@function_tool
async def rag_retrieve(
    ctx: RunContextWrapper[AgentContext],
    query: str,
    top_k: int = 3,
    filter_tags: Optional[str] = None,
) -> str:
    """
    Retrieve relevant health and nutrition documents from the knowledge base.

    Args:
        query: Search query for health/nutrition information
        top_k: Number of documents to retrieve (default: 3)
        filter_tags: Optional JSON string with list of tags to filter by

    Returns:
        JSON string with retrieved documents and source citations
    """
    logger.info(f"Tool: rag_retrieve - {query}")
    try:
        tags = json.loads(filter_tags) if filter_tags else None
        result = RAGRetriever.retrieve(query, top_k, tags)
        return json.dumps(result, indent=2)
    except json.JSONDecodeError as e:
        return json.dumps({"error": f"Invalid JSON: {str(e)}"})


# ============================================================================
# Agent Definitions
# ============================================================================


def create_coach_agent() -> Agent:
    """
    Create the main Health Coach agent.
    This is the primary agent that users interact with.
    Uses Hugging Face model via LiteLLM.
    """
    return Agent(
        name="Health Coach",
        instructions="""You are a knowledgeable and safe AI Health & Nutrition Coach.

Your role:
- Provide personalized nutrition and health guidance
- Answer questions about diet, exercise, and wellness
- Motivate and support the user's health journey
- Use tools to get accurate nutrition data and health information

STRICT RULES:
1. NEVER invent medical claims or nutritional data - always use tools
2. ALWAYS use nutrition_lookup for food nutrition queries
3. ALWAYS use calculate_rda for RDA percentage calculations
4. ALWAYS use rag_retrieve for medical/health information
5. ALWAYS include disclaimer: "This information is for educational purposes only. Consult a healthcare professional for personalized medical advice."
6. Keep responses concise (1-3 sentences)
7. Be encouraging and supportive

When a user asks about food nutrition, use the nutrition_lookup tool.
When a user asks about daily intake vs recommendations, use calculate_rda.
When a user asks health/medical questions, use rag_retrieve.
When a user uploads a food image, use vision_analyze.""",
        tools=[
            nutrition_lookup,
            calculate_rda,
            calculate_meal_nutrition,
            rag_retrieve,
            vision_analyze,
        ],
        model=HF_TEXT_MODEL,
    )


def create_nutrition_agent() -> Agent:
    """
    Create the Nutrition Specialist agent.
    Specialized in detailed nutrition calculations and analysis.
    Uses Hugging Face model via LiteLLM.
    """
    return Agent(
        name="Nutrition Specialist",
        instructions="""You are a Nutrition Specialist with access to deterministic nutrition calculation tools.

Your role:
- Look up food nutrition data from USDA database
- Calculate RDA percentages
- Identify nutrient deficiencies
- Analyze meal compositions

STRICT RULES:
1. ALWAYS use tools for nutrition calculations - never guess
2. Provide accurate, evidence-based data
3. Be precise with numbers
4. Include units in all nutrition values

Available tools:
- nutrition_lookup: Look up nutrition data for a food item
- calculate_rda: Calculate RDA percentages for user intake
- calculate_meal_nutrition: Calculate total nutrition for multiple food items""",
        tools=[nutrition_lookup, calculate_rda, calculate_meal_nutrition],
        model=HF_TEXT_MODEL,
    )


def create_vision_agent() -> Agent:
    """
    Create the Food Vision Analyst agent.
    Specialized in analyzing food images.
    Uses Hugging Face model via LiteLLM.
    """
    return Agent(
        name="Food Vision Analyst",
        instructions="""You are a Food Vision Analyst that identifies food items from images.

Your role:
- Analyze food images
- Identify food items
- Estimate portions
- Provide nutrition data for detected foods

STRICT RULES:
1. ALWAYS use the vision_analyze tool for image processing
2. Be specific about food items detected
3. Note confidence levels
4. Ask for clarification if image is unclear

Available tools:
- vision_analyze: Analyze food image to detect items and get nutrition data""",
        tools=[vision_analyze, nutrition_lookup],
        model=HF_TEXT_MODEL,
    )


def create_knowledge_agent() -> Agent:
    """
    Create the Knowledge Retrieval Specialist agent.
    Specialized in evidence-based health information.
    Uses Hugging Face model via LiteLLM.
    """
    return Agent(
        name="Knowledge Retrieval Specialist",
        instructions="""You are a Knowledge Retrieval Specialist with access to evidence-based health information.

Your role:
- Retrieve relevant health and nutrition documents
- Provide citations for medical claims
- Ensure information is evidence-based

STRICT RULES:
1. ALWAYS use rag_retrieve for medical/health information
2. Cite your sources
3. Prefer WHO/ICMR/USDA guidelines
4. Be accurate and precise
5. Include disclaimer for medical advice

Available tools:
- rag_retrieve: Retrieve health/nutrition documents from knowledge base""",
        tools=[rag_retrieve],
        model=HF_TEXT_MODEL,
    )


# ============================================================================
# Agent Runner
# ============================================================================
# Agent Runner
# ============================================================================
# Agent Runner
# ============================================================================


class AgentRunner:
    """
    Manages agents and runs conversations using OpenAI Agents SDK.
    """

    def __init__(self):
        self.agents: Dict[str, Agent] = {}
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def register_agent(self, name: str, agent: Agent):
        """Register an agent"""
        self.agents[name] = agent
        logger.info(f"Registered agent: {name}")

    def get_or_create_session(
        self, session_id: str, user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get existing session or create new one"""
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "session_id": session_id,
                "user_id": user_id,
                "messages": [],
                "context": AgentContext(user_id=user_id, session_id=session_id),
            }
            logger.info(f"Created new session: {session_id}")
        return self.sessions[session_id]

    async def run(
        self,
        agent_name: str,
        message: str,
        session_id: Optional[str] = None,
        user_id: Optional[str] = None,
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Run an agent with a user message using LiteLLM.

        Args:
            agent_name: Name of the agent to use
            message: User message
            session_id: Optional session ID for conversation continuity
            user_id: Optional user ID
            context: Optional user context (profile, stats, etc.)

        Returns:
            Dict with response and session_id
        """
        session_id = session_id or f"session_{id(message)}_{user_id or 'anon'}"
        session = self.get_or_create_session(session_id, user_id)

        agent = self.agents.get(agent_name)
        if not agent:
            # Fallback to simple LLM call if agent not found
            agent = self.agents.get("coach")

        # Build context for the agent
        agent_context = session["context"]
        if context:
            agent_context.metadata["user_context"] = context

        # Prepare input with context if provided
        input_message = message
        if context:
            input_message = f"User Context:\n{context}\n\nUser Message:\n{message}"

        logger.info(f"Running agent '{agent_name}' for session {session_id}")

        # Add system instructions
        if hasattr(agent, "instructions"):
            messages = [
                {"role": "system", "content": agent.instructions},
                {"role": "user", "content": input_message},
            ]
        else:
            messages = [{"role": "user", "content": input_message}]

        # Run the completion using LiteLLM
        try:
            response = await litellm.acompletion(
                model=f"huggingface/{DEFAULT_PROVIDER}/{HF_TEXT_MODEL}",
                messages=messages,
            )
            result = response["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"LiteLLM error: {str(e)}")
            result = "I'm sorry, I couldn't process your request at this time. Please try again later."

        # Store conversation
        session["messages"].append({"role": "user", "content": message})
        session["messages"].append({"role": "assistant", "content": result})

        logger.info(f"Agent response generated: {result[:100]}...")

        return {"response": result, "session_id": session_id}


# ============================================================================
# Global Agent Runner Instance
# ============================================================================

agent_runner = AgentRunner()


def initialize_agents():
    """Initialize and register all agents"""
    agent_runner.register_agent("coach", create_coach_agent())
    agent_runner.register_agent("nutrition", create_nutrition_agent())
    agent_runner.register_agent("vision", create_vision_agent())
    agent_runner.register_agent("knowledge", create_knowledge_agent())
    logger.info("All agents initialized with OpenAI Agents SDK")


# Initialize on module load
initialize_agents()
