from app.model import generate_text

def test_simple_prompt():
    prompt = "What is 2 + 2? Answer with only the number."
    print("Testing simple prompt...")
    try:
        response = generate_text(prompt, max_tokens=10)
        print(f"Response: '{response}'")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_simple_prompt()
