from app.model import generate_text
import json

def test_egg_nutrients():
    prompt = """Provide nutritional values for 100 grams of egg in JSON format.
Fields: calories (kcal), fat (g), protein (g), carbohydrates (g), micronutrients with vitamin_c (mg), iron (mg), calcium (mg), vitamin_d (mcg), vitamin_a (mcg), vitamin_b12 (mcg), vitamin_b6 (mg), folate (mcg), magnesium (mg), potassium (mg), zinc (mg), selenium (mcg), copper (mg), manganese (mg), iodine (mcg).
Return only valid JSON without any additional text."""
    
    print("Testing LLM response for egg nutrients...")
    try:
        response = generate_text(prompt, max_tokens=300)
        print(f"Raw LLM response: '{response}'")
        
        # Try to extract JSON
        json_start = response.find('{')
        json_end = response.rfind('}') + 1
        
        if json_start != -1 and json_end != 0:
            try:
                data = json.loads(response[json_start:json_end])
                print(f"\nExtracted JSON: {json.dumps(data, indent=2)}")
                return data
            except Exception as e:
                print(f"\nError parsing JSON: {e}")
        else:
            print("\nNo valid JSON found")
            
        return None
        
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    test_egg_nutrients()
