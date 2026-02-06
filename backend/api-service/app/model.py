import os
import logging
from typing import Optional, Dict, Any
from litellm import completion

logger = logging.getLogger(__name__)

# LiteLLM Model Configuration
# Based on architecture.md recommendations:
# - Text LLM: Kimi-K2-Instruct (Moonshot AI) OR BioMistral-7B
# - Vision: BLIP or LLaVA small
# - Embeddings: sentence-transformers/all-MiniLM-L6-v2

DEFAULT_HF_PROVIDER = os.environ.get("HF_INFERENCE_PROVIDER", "together")
LITELLM_MODEL = os.environ.get(
    "LITELLM_MODEL",
    f"huggingface/{DEFAULT_HF_PROVIDER}/moonshotai/Kimi-K2-Instruct",
)
LITELLM_API_BASE = os.environ.get("LITELLM_API_BASE", None)
LITELLM_API_KEY = os.environ.get("LITELLM_API_KEY", "not-needed")
HF_TOKEN = os.environ.get("HF_TOKEN", None)

# For local inference without API
USE_LOCAL_MODEL = os.environ.get("USE_LOCAL_MODEL", "false").lower() == "true"

_litellm_client = None


def get_litellm_client():
    """Get or create LiteLLM client"""
    global _litellm_client
    if _litellm_client is None:
        try:
            import litellm

            litellm.tokenizer = None
            _litellm_client = True
            logger.info("LiteLLM client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize LiteLLM: {e}")
            _litellm_client = None
    return _litellm_client


def generate_text(
    prompt: str,
    max_tokens: int = 150,
    temperature: float = 0.7,
    top_p: float = 0.9,
    stop_sequences: Optional[list] = None,
    model: Optional[str] = None,
) -> str:
    """
    Generate text using LiteLLM with Hugging Face models.

    Args:
        prompt: Input prompt
        max_tokens: Maximum tokens to generate
        temperature: Sampling temperature (0.0 = deterministic, 1.0 = creative)
        top_p: Nucleus sampling parameter
        stop_sequences: Optional list of sequences to stop generation
        model: Optional model override

    Returns:
        Generated text string
    """
    try:
        get_litellm_client()

        model_name = model or LITELLM_MODEL

        logger.info(f"Generating text with model: {model_name}")

        api_base = LITELLM_API_BASE

        if not api_base:
            # Use Hugging Face Inference Providers (router.huggingface.co)
            # Format: https://router.huggingface.co/<provider>/<org>/<model>/v1
            # Providers: together, sambanova, fal, replicate, hyperbolic, nebius, novita
            if "BioMistral" in model_name:
                api_base = "https://router.huggingface.co/together/v1"
            elif "Phi-3" in model_name or "Phi-4" in model_name:
                api_base = "https://router.huggingface.co/together/v1"
            elif "LLaVA" in model_name:
                api_base = "https://router.huggingface.co/together/v1"

        if USE_LOCAL_MODEL:
            api_base = None

        messages = [{"role": "user", "content": prompt}]

        response = completion(
            model=model_name,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
            api_base=api_base,
            api_key=HF_TOKEN or LITELLM_API_KEY,
            stop=stop_sequences,
        )

        generated_text = response.choices[0].message.content

        logger.info(f"Generated {len(generated_text)} characters")

        return generated_text

    except Exception as e:
        logger.error(f"LiteLLM generation error: {e}")
        raise


def generate_with_tools(
    prompt: str,
    tools: Optional[Dict[str, Any]] = None,
    max_tokens: int = 300,
    model: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generate text with potential tool calls using LiteLLM.

    Args:
        prompt: Input prompt with tool instructions
        tools: Dict of available tools
        max_tokens: Maximum tokens to generate
        model: Optional model override

    Returns:
        Dict with 'content' and optional 'tool_calls'
    """
    response = generate_text(
        prompt,
        max_tokens=max_tokens,
        temperature=0.3,
        stop_sequences=["TOOL_CALL:", "HANDOFF:"],
        model=model,
    )

    result = {"content": response, "tool_calls": None, "handoff_to": None}

    if "TOOL_CALL:" in response:
        try:
            import json

            tool_part = response.split("TOOL_CALL:")[1].strip()
            tool_data = json.loads(tool_part)
            result["tool_calls"] = [tool_data]
            result["content"] = response.split("TOOL_CALL:")[0].strip()
        except (json.JSONDecodeError, IndexError) as e:
            logger.warning(f"Failed to parse tool call: {e}")

    return result


def get_model_info() -> Dict[str, Any]:
    """Get information about the configured model"""
    return {
        "model": LITELLM_MODEL,
        "api_base": LITELLM_API_BASE,
        "local_mode": USE_LOCAL_MODEL,
        "provider": "huggingface",
    }


def generate_vision(
    image_base64: str,
    prompt: str = "Describe this food image in detail.",
    max_tokens: int = 300,
) -> str:
    """
    Generate text from image using LiteLLM with vision model.

    Args:
        image_base64: Base64 encoded image
        prompt: Prompt for vision analysis
        max_tokens: Maximum tokens to generate

    Returns:
        Generated description
    """
    try:
        get_litellm_client()

        vision_model = os.environ.get(
            "LITELLM_VISION_MODEL",
            f"huggingface/{DEFAULT_HF_PROVIDER}/llava-hf/llava-1.5-7b-hf",
        )

        api_base = os.environ.get(
            "LITELLM_VISION_API_BASE",
            "https://router.huggingface.co/together/v1",
        )

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"},
                    },
                ],
            }
        ]

        response = completion(
            model=vision_model,
            messages=messages,
            max_tokens=max_tokens,
            api_base=api_base,
            api_key=HF_TOKEN or LITELLM_API_KEY,
        )

        return response.choices[0].message.content

    except Exception as e:
        logger.error(f"Vision generation error: {e}")
        raise


def get_embeddings(text: str) -> list:
    """
    Get text embeddings using Hugging Face sentence-transformers.

    Args:
        text: Input text to embed

    Returns:
        List of embedding vectors
    """
    try:
        from sentence_transformers import SentenceTransformer

        embedding_model = os.environ.get(
            "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
        )

        model = SentenceTransformer(embedding_model)
        embeddings = model.encode([text]).tolist()

        return embeddings[0]

    except Exception as e:
        logger.error(f"Embedding generation error: {e}")
        raise
