# SYSTEM DESIGN PROMPT — AI Nutrition & Health Coach Backend

You are a senior AI systems architect and backend engineer.

Design and implement a production-ready AI architecture for a **Nutrition + Health Coach application**.

Follow the constraints and requirements strictly.

Do NOT over-engineer.
Prefer simple, scalable, low-cost solutions.
Avoid large GPU models or multi-agent research pipelines.

---

# 🧠 Product Goal

Build an AI-powered health coach that can:

1. Chat with users about nutrition and health
2. Analyze meals (text + image)
3. Calculate calories & nutrients
4. Compare intake with RDA
5. Give medical-safe coaching suggestions
6. Track daily/weekly health progress
7. Provide evidence-based recommendations

---

# 🔒 Hard Constraints

These are mandatory:

* Use Hugging Face FREE tier models where possible
* Use OpenAI SDK for agents/sessions/handoffs
* Use NestJS backend (already exists)
* Supabase for auth + DB
* No expensive 70B+ models
* Must run on CPU or small GPU
* Keep monthly infra <$500
* Deterministic logic > LLM whenever possible

---

# 🏗 Current Stack (already built)

Backend:

* NestJS
* Supabase (Auth + Postgres)
* REST APIs

Frontend:

* React Native

Infra:

* Docker
* Node + Python allowed

You must integrate into this stack (NOT rebuild backend).

---

# 🎯 System Architecture Requirements

Design a simple service-based architecture:

## Services

### 1. Nutrition Engine (NO LLM)

Pure deterministic logic:

* USDA data parsing
* macro/micro calculation
* RDA scoring
* calorie math
* unit conversions
* deficiency detection

Language: TypeScript or Python

Never use LLM here.

---

### 2. AI Coach Service (LLM-based)

Handles:

* chat coaching
* lifestyle advice
* food suggestions
* explanations
* summaries

Model constraints:

* medical/health focused
* small (<= 7B)
* runs on HF free or CPU

Recommended:

* BioMistral-7B OR
* MedAlpaca OR
* Phi-3-mini + RAG

---

### 3. Vision Food Analyzer

Handles:

* meal image → food items
* calorie estimation

Model options:

* BLIP-2
* LLaVA-1.5-7B
* HF image-to-text free models

Flow:
image → caption → nutrition engine lookup

---

### 4. Vector Search (RAG)

Purpose:

* safe medical answers
* evidence-based suggestions

Use:

* Qdrant or Supabase pgvector

Data:

* nutrition guidelines
* WHO/ICMR/USDA docs
* curated health content

Flow:
query → retrieve docs → send to coach LLM

---

### 5. OpenAI SDK Agent Layer

Use OpenAI SDK features:

Implement:

* session memory
* tool calling
* agent handoffs

Agents:

CoachAgent

* main chat agent

NutritionToolAgent

* calls deterministic nutrition engine

VisionToolAgent

* calls image analyzer

KnowledgeToolAgent

* RAG retrieval

The coach agent must call tools instead of hallucinating.

---

# 🤖 Agent Behavior Rules

Coach agent:

MUST:

* call tools for numbers/calories
* call RAG for medical info
* avoid guessing
* provide safe disclaimers

NEVER:

* invent medical claims
* compute nutrition math itself

---

# 🧩 Model Selection Rules

Use ONLY:

Text LLM:

* BioMistral-7B OR Phi-3-mini

Vision:

* BLIP or LLaVA small

Embeddings:

* sentence-transformers/all-MiniLM-L6-v2

No large or paid models.

---

# 📦 Expected Output From You

Generate:

1. High-level architecture diagram
2. Folder structure
3. Microservice breakdown
4. NestJS integration plan
5. OpenAI SDK agent code
6. Tool definitions
7. HF inference examples
8. Docker setup
9. Example request flows
10. Minimal production-ready code templates

Prefer:

* TypeScript
* Python FastAPI for AI service

---

# 📂 Suggested Structure (example)

backend/
apps/
nest-api/
ai-service/
agents/
tools/
models/
rag/
vision/
nutrition/
main.py

---

# 🧠 Implementation Philosophy

* deterministic > AI
* small models > big models
* tools > reasoning
* RAG > hallucination
* simple > complex
* cheap > powerful

---

# 📌 Deliverables

Output:

* complete architecture
* code snippets
* interfaces
* how agents call tools
* how NestJS calls AI service
* environment variables
* deployment instructions

Make it directly implementable.

Avoid theory. Provide concrete code.

END.
