#!/usr/bin/env python3
"""
Test script for LiteLLM + Hugging Face integration.
Tests the model generation with Hugging Face models.
"""

import os
import sys

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.model import generate_text, get_model_info, generate_vision, get_embeddings


def test_model_info():
    """Test getting model information"""
    print("=" * 60)
    print("Testing Model Info")
    print("=" * 60)
    info = get_model_info()
    print(f"Model Info: {info}")
    print()


def test_text_generation():
    """Test text generation with Hugging Face model via LiteLLM"""
    print("=" * 60)
    print("Testing Text Generation")
    print("=" * 60)

    prompt = "What are the health benefits of eating eggs? Answer in 2-3 sentences."

    try:
        print(f"Prompt: {prompt}")
        print("-" * 40)

        response = generate_text(prompt=prompt, max_tokens=150, temperature=0.7)

        print(f"Response: {response}")
        print("\n✅ Text generation successful!")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback

        traceback.print_exc()


def test_nutrition_query():
    """Test nutrition-focused query"""
    print("\n" + "=" * 60)
    print("Testing Nutrition Query")
    print("=" * 60)

    prompt = """Provide nutritional values for 100 grams of egg in JSON format.
Fields: calories (kcal), protein (g), carbohydrates (g), fat (g), fiber (g).
Return only valid JSON without any additional text."""

    try:
        print(f"Prompt: {prompt[:100]}...")
        print("-" * 40)

        response = generate_text(prompt=prompt, max_tokens=200, temperature=0.3)

        print(f"Response: {response}")

        # Try to extract JSON
        import json

        try:
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            if json_start != -1 and json_end > json_start:
                data = json.loads(response[json_start:json_end])
                print(f"\nParsed JSON: {json.dumps(data, indent=2)}")
                print("\n✅ Nutrition query successful with valid JSON!")
            else:
                print("\n⚠️  No valid JSON found in response")
        except Exception as e:
            print(f"\n⚠️  JSON parsing failed: {e}")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback

        traceback.print_exc()


def test_embeddings():
    """Test embedding generation"""
    print("\n" + "=" * 60)
    print("Testing Embeddings")
    print("=" * 60)

    try:
        text = "The health benefits of a balanced diet are numerous."
        print(f"Text: {text}")
        print("-" * 40)

        embeddings = get_embeddings(text)
        print(f"Embedding dimensions: {len(embeddings)}")
        print(f"First 5 values: {embeddings[:5]}")
        print("\n✅ Embeddings generated successfully!")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("LiteLLM + Hugging Face Integration Tests")
    print("=" * 60)
    print()

    # Show configuration
    print("Configuration:")
    print(
        f"HF_TEXT_MODEL: {os.environ.get('HF_TEXT_MODEL', 'moonshotai/Kimi-K2-Instruct')}"
    )
    print(
        f"HF_INFERENCE_PROVIDER: {os.environ.get('HF_INFERENCE_PROVIDER', 'together')}"
    )
    print(f"HF_TOKEN set: {'Yes' if os.environ.get('HF_TOKEN') else 'No'}")
    print()

    # Run tests
    test_model_info()
    test_text_generation()
    test_nutrition_query()
    test_embeddings()

    print("\n" + "=" * 60)
    print("All tests completed!")
    print("=" * 60)
