import os
from app.schemas import ChatRequest, ChatResponse
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.model import generate_text

# API Key configuration
API_KEY = os.environ.get("API_SERVICE_KEY", "")
security = HTTPBearer()

app = FastAPI(title="AI Inference Service")


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
    try:
        context_section = f"\n\nUser Context:\n{req.context}" if req.context else ""

        prompt = f"""You are a personalized AI Nutrition Assistant. Answer ONLY the specific question asked. Do not generate additional questions or answers.

STRICT RULES:
- Answer ONLY the question below, nothing else
- Do not hallucinate or generate fake questions
- Do not include "Question:" or "Answer:" labels in your response
- If asked about protein: give protein data only
- If asked about calories: give calorie data only
- If asked about meals: suggest foods for that meal only
- Use numbers from the context to personalize
- 1-3 sentences maximum
- No labels, no formatting, just the direct answer

{context_section}

Question to answer: {req.message}

Your response (answer ONLY this question):"""

        ai_response = generate_text(prompt, max_tokens=200)
        return {"response": ai_response}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="I'm sorry, I couldn't process your request at this time. Please try again later.",
        )
