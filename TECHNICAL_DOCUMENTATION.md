# Longevix Technical Documentation

## Overview

Longevix is a comprehensive nutrition tracking application with AI-powered chat, meal logging, and statistical analysis. The system consists of three main components:

1. **Mobile App** (React Native/Expo) - Cross-platform mobile application
2. **API Server** (NestJS) - Backend API service
3. **AI Service** (FastAPI) - AI inference service for nutrition analysis

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Mobile App                           │
│                    (React Native / Expo)                    │
└────────────────────┬────────────────────────────────────────┘
                      │ HTTPS/REST
                      │
┌────────────────────▼────────────────────────────────────────┐
│                      API Server                             │
│                        (NestJS)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Module  │  │ Meals Module │  │  AI Module   │      │
│  │  - Email     │  │  - CRUD      │  │  - Chat      │      │
│  │  - Phone OTP │  │  - Stats     │  │  - Guards    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                 │              │
│         └─────────────────┴─────────────────┘              │
│                           │                                │
│                    ┌──────▼──────┐                         │
│                    │  Supabase   │                         │
│                    │ (Database)  │                         │
│                    └─────────────┘                         │
└────────────────────────┬────────────────────────────────────┘
                          │ Internal API
                          │
┌────────────────────────▼────────────────────────────────────┐
│                       AI Service                            │
│                       (FastAPI)                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              OpenAI Agents SDK + LiteLLM            │   │
│  │                                                     │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │   │
│  │   │  Coach      │  │ Nutrition   │  │  Vision   │ │   │
│  │   │  Agent      │  │  Agent      │  │  Agent    │ │   │
│  │   └─────────────┘  └─────────────┘  └───────────┘ │   │
│  │                                                     │   │
│  │   ┌─────────────┐  ┌─────────────────────────────┐ │   │
│  │   │ Knowledge   │  │ Tools                       │ │   │
│  │   │ Agent       │  │ - Nutrition Engine (USDA)   │ │   │
│  │   └─────────────┘  │ - Vision Analyzer (LLaVA)   │ │   │
│  │                    │ - RAG Retriever              │ │   │
│  │                    └─────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                │
│              ┌────────────┴────────────┐                    │
│              │  Redis Session Store   │                     │
│              │  (with in-memory       │                     │
│              │   fallback for dev)    │                     │
│              └────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
Longevix/
├── mobile/                      # React Native Mobile App
│   ├── app/                     # Expo Router pages
│   │   ├── (auth)/              # Authentication routes
│   │   ├── (tabs)/              # Main app tabs
│   │   └── ...
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── contexts/            # React contexts (Auth, Meals, Notifications)
│   │   ├── services/            # API service layer
│   │   ├── config/              # Configuration files
│   │   └── types/               # TypeScript types
│   └── package.json
│
├── backend/
│   ├── api-server/              # NestJS Backend API
│   │   ├── src/
│   │   │   ├── ai/              # AI module (chat, guards, DTOs)
│   │   │   │   ├── dto/         # ChatDto, GenerateNutrientDto, etc.
│   │   │   │   └── guards/      # ChatLimitGuard, ProUserGuard
│   │   │   ├── auth/            # Authentication (email, phone OTP)
│   │   │   │   ├── dto/         # LoginDto, RegisterDto, etc.
│   │   │   │   └── auth.guard.ts
│   │   │   ├── meals/           # Meals & nutrition stats
│   │   │   │   ├── entities/    # Meal, NutritionDailyStats, etc.
│   │   │   │   ├── meals.service.ts
│   │   │   │   ├── nutrition-aggregation.service.ts
│   │   │   │   └── nutrition-scheduler.service.ts
│   │   │   ├── user/            # User management
│   │   │   │   ├── entities/    # User entity
│   │   │   │   └── user.service.ts
│   │   │   ├── supabase/        # Supabase integration
│   │   │   └── app.module.ts
│   │   └── package.json
│   │
│   └── api-service/             # FastAPI AI Service
│       ├── app/
│       │   ├── main.py          # FastAPI app, endpoints, middleware
│       │   ├── model.py         # LiteLLM + Hugging Face configuration
│       │   ├── agents.py        # OpenAI Agents SDK + agent definitions
│       │   ├── tools.py         # NutritionEngine, VisionAnalyzer, RAGRetriever
│       │   ├── session_store.py # Redis + in-memory session storage
│       │   └── schemas.py       # Pydantic request/response models
│       ├── llama_3_2_1b_instruct/
│       ├── requirements.txt
│       └── Dockerfile
│
└── README.md
```

---

## Technology Stack

### Mobile App

| Technology | Purpose | Why This Technology |
|------------|---------|---------------------|
| **React Native with Expo** | Cross-platform mobile framework | **Single Codebase, Multiple Platforms**: Write once, deploy to both iOS and Android. Expo provides pre-built native modules, reducing native development overhead. Faster development cycles with hot reloading and over-the-air updates. Ideal for startups needing rapid market deployment. |
| **Expo Router** | File-based navigation | **Native Feel, Web Simplicity**: File-based routing like Next.js makes navigation structure intuitive. Deep linking support out-of-box. Built on proven React Navigation with TypeScript support. Eliminates complex navigation configuration. |
| **React Context API** | State management | **Zero Dependencies, Simple Architecture**: No external state management libraries needed for this app's complexity. Built into React, no additional bundle size. Sufficient for app-wide state (auth, meals, notifications). Easy to understand and debug. |
| **AsyncStorage** | Local persistence | **Lightweight, Offline Capability**: Simple key-value storage for user preferences, cached data, and offline support. No native linking required (works out-of-box with Expo). Critical for app usability in low-connectivity areas. |
| **Supabase** | Cloud database & auth | **Open Source Firebase Alternative**: PostgreSQL under the hood gives powerful relational queries. Row Level Security (RLS) built-in for data protection. Real-time subscriptions available. Auth handled seamlessly. Cost-effective compared to Firebase for this use case. |
| **Supabase Auth** | User authentication | **Integrated with Supabase**: No separate auth service needed. Supports multiple providers (email, phone, social). OTP verification built-in. Secure token management. Works seamlessly with RLS policies. |
| **Expo Notifications** | Push notifications | **Cross-Platform, No Native Code**: Works on both iOS and Android without writing native code. Handles permissions automatically. Scheduled notifications for meal reminders. Channel support for Android. |

### API Server (NestJS)

| Technology | Purpose | Why This Technology |
|------------|---------|---------------------|
| **NestJS** | Backend framework | **Enterprise-Grade, TypeScript Native**: Modular architecture perfect for microservices. Built-in dependency injection. Decorator-based syntax aligns with Angular-style patterns. Extensive ecosystem with plugins. Easy to test and maintain. Perfect for long-term project maintainability. |
| **TypeScript** | Programming language | **Type Safety, Better DX**: Compile-time error catching. Self-documenting code with types. Better IDE support and refactoring. Reduces runtime errors significantly. Matches mobile app's TypeScript for full-stack consistency. |
| **PostgreSQL (Supabase)** | Relational database | **ACID Compliance, Powerful Queries**: Complex joins for nutrition analytics. Reliable data integrity for meal logs. Excellent performance for time-series data. JSON support for flexible meal item storage. Industry standard, well-documented. |
| **TypeORM** | Database ORM | **TypeScript Native ORM**: Strong type safety with entities. Automatic migrations. Query building with TypeScript. Supports multiple databases (easy to switch from Supabase). ActiveRecord and DataMapper patterns. |
| **JWT + Supabase Auth** | Token-based authentication | **Stateless, Scalable**: JWT tokens can be validated without database hits (for valid tokens). Works across distributed systems. Combined with Supabase for user management. Secure refresh token rotation. |
| **@nestjs/schedule** | Cron job scheduler | **Native NestJS Integration**: Declarative cron jobs using decorators. Built-in for the NestJS ecosystem. Reliable execution within the application context. Easy to test with mocking. No external cron service needed. |
| **@nestjs/config** | Configuration management | **Environment-based Config**: Type-safe configuration with environment variables. Built-in validation. Secret management. Easy to switch between dev/prod configurations. |
| **class-validator** | DTO validation | **Decorator-Based, Type-Safe**: Validate incoming requests with TypeScript decorators. Automatic error messages. Works seamlessly with class-transformer. Reduces boilerplate validation code. |
| **Swagger/OpenAPI** | API documentation | **Auto-Generated Documentation**: No need to write docs manually. Interactive API explorer. Code generation for clients. Ensures API contract is always up-to-date. Essential for frontend-backend collaboration. |

### AI Service (FastAPI)

| Technology | Purpose | Why This Technology |
|------------|---------|---------------------|
| **FastAPI** | Python web framework | **High Performance, Modern Python**: ASGI-based, async-native for high throughput. Automatic API docs (Swagger/ReDoc). Type validation with Pydantic. Excellent for ML/AI workloads. Minimal boilerplate compared to Flask. |
| **Python** | Programming language | **ML/AI Ecosystem**: Native support for PyTorch, Hugging Face, and AI libraries. Easy integration with LLaMA models. Rich data science stack (pandas, numpy). Best language for AI inference services. |
| **OpenAI Agents SDK** | Agent orchestration | **Structured Agent Framework**: Provides agent handoffs, tool calling, and conversation management. Built-in tracing support. Clean separation between agents and tools. Similar pattern to OpenAI's official SDK. |
| **LiteLLM** | LLM abstraction layer | **Unified Model Interface**: Single API for multiple LLM providers (Hugging Face, OpenAI, Anthropic). Easy model switching. Consistent response format. Provider routing. |
| **Hugging Face + Together AI** | LLM inference | **Open Model Access**: Kimi-K2-Instruct for text, LLaVA-1.5-7b for vision. Cost-effective inference via Together AI router. Access to open-weight models without self-hosting. |
| **httpx** | Async HTTP client | **Modern HTTP for Python**: Async/await support. Connection pooling. Built-in timeouts. Works seamlessly with FastAPI. |
| **Redis** | Session storage | **Production-Grade Sessions**: Fast, persistent session storage. Automatic TTL expiration. In-memory fallback for development. Scales horizontally. |
| **slowapi** | Rate limiting | **Endpoint Protection**: Request throttling per IP. Configurable limits. Works with FastAPI. Prevents abuse. |
| **Prometheus metrics** | Monitoring | **Observability**: Built-in metrics endpoint. Grafana integration ready. Track request counts, latencies, errors. |
| **Pydantic** | Data validation | **Type Safety**: Automatic validation of requests/responses. Serialization/deserialization. Error messages. Type hints. |

---

## Why This Architecture?

### Microservices Separation

**Why separate API Server and AI Service?**

1. **Independent Scaling**: AI inference is resource-intensive. Separate services allow scaling AI independently based on demand.
2. **Different Tech Requirements**: AI service runs Python/PyTorch; API server uses Node.js/NestJS. Different runtime environments are optimal.
3. **Failure Isolation**: If AI service goes down, core meal logging still works (with degraded AI features).
4. **Team Specialization**: Backend and ML teams can work independently.
5. **Cost Optimization**: AI service can run on GPU-enabled instances while API server uses cheaper CPU instances.

### React Native + Expo

**Why not native iOS/Android or Flutter?**

| Factor | Decision |
|--------|----------|
| **Team Skills** | Web developers (React) can contribute immediately |
| **Time-to-Market** | Single codebase = ~50% less development time |
| **Updates** | OTA updates via Expo skip app store review for JS changes |
| **Maintenance** | One codebase to maintain vs. two native codebases |
| **Performance** | Sufficient for nutrition app (not a high-performance game) |

**Why Expo and not bare React Native?**

- Pre-built native modules (camera, notifications, auth) save months of work
- Expo Go enables instant testing on devices
- Easier onboarding for new developers
- Production-ready, battle-tested infrastructure

### Supabase over Firebase

**Why Supabase?**

| Factor | Supabase Advantage |
|--------|-------------------|
| **Database** | PostgreSQL = powerful queries, proper relational design |
| **SQL Access** | Direct SQL for complex analytics (nutrition aggregations) |
| **Cost** | More predictable pricing, no usage-based throttling |
| **Data Portability** | Standard PostgreSQL, not vendor-locked |
| **Self-Hosting** | Can host Supabase on own infrastructure if needed |
| **Open Source** | Core is open source, no vendor lock-in |

### NestJS for Backend

**Why not Express.js or FastAPI?**

| Factor | NestJS Choice |
|--------|---------------|
| **Architecture** | Modular, opinionated structure scales better |
| **TypeScript** | First-class TS support |
| **Testing** | Built-in dependency injection makes unit testing easy |
| **Enterprise** | Decorators, modules, guards = enterprise-ready patterns |
| **Scalability** | Microservices-ready architecture |
| **Ecosability** | @nestjs/schedule, @nestjs/passport, etc. |

**Why not FastAPI for backend?**

- Node.js/NestJS better for traditional REST APIs with TypeORM
- Stronger type safety with TypeScript throughout
- Better tooling for authentication, validation, swagger
- Existing team expertise in Node.js

### OpenAI Agents SDK + LiteLLM

**Why this agent architecture?**

| Factor | Benefit |
|--------|---------|
| **Agent Specialization** | Separate agents for coaching, nutrition, vision, knowledge |
| **Tool Calling** | Built-in tool calling for nutrition lookups, RAG, vision |
| **Handoffs** | Seamless transfer between agents based on user needs |
| **Conversation Memory** | Session-based context retention |
| **Provider Abstraction** | LiteLLM allows switching models without code changes |

**Why Hugging Face + Together AI instead of OpenAI API?**

- Open-weight models (no vendor lock-in)
- Cost-effective for moderate usage
- Kimi-K2-Instruct has long context (128k) for detailed nutrition analysis
- LLaVA-1.5-7b for vision tasks
- Can switch to local inference (llama.cpp) if needed

### Redis for Sessions

**Why Redis over in-memory only?**

| Factor | Redis Choice |
|--------|--------------|
| **Persistence** | Sessions survive service restarts |
| **Scalability** | Multiple service instances share session store |
| **TTL** | Automatic session expiration |
| **Production Ready** | Battle-tested, high-performance |
| **Fallback** | In-memory storage for development/devcontainers |

---

## API Server (NestJS) Details

### Module Structure

```
src/
├── ai/                          # AI Module
│   ├── ai.controller.ts         # Endpoints: chat, generate-nutrient, agents
│   ├── ai.service.ts            # Chat context building, USDA integration
│   ├── ai.module.ts             # Module definition
│   ├── dto/
│   │   ├── chat.dto.ts          # ChatRequest with image support
│   │   ├── chat-agent.dto.ts     # Agent-specific chat requests
│   │   ├── generate-nutrient.dto.ts
│   │   ├── nutrition-lookup.dto.ts
│   │   ├── rag-retrieve.dto.ts
│   │   ├── rda-calculation.dto.ts
│   │   └── vision-analyze.dto.ts
│   └── guards/
│       ├── chat-limit.guard.ts  # Rate limiting per user
│       └── pro-user.guard.ts    # Premium feature access control
│
├── auth/                        # Authentication Module
│   ├── auth.controller.ts       # Register, login, profile, phone OTP
│   ├── auth.service.ts          # Supabase auth integration
│   ├── auth.guard.ts            # JWT validation
│   ├── dto/
│   │   ├── loginUser.dto.ts
│   │   ├── registerUser.dto.ts
│   │   ├── registerPhoneUser.dto.ts
│   │   ├── sendPhoneOtp.dto.ts
│   │   ├── verifyPhoneOtp.dto.ts
│   │   └── updateProfile.dto.ts
│
├── meals/                       # Meals Module
│   ├── meals.controller.ts      # CRUD endpoints + stats
│   ├── meals.service.ts         # Meal CRUD, food item management
│   ├── meals.module.ts
│   ├── entities/
│   │   ├── meal.entity.ts       # Meal with JSON items
│   │   ├── nutrition-daily-stats.entity.ts
│   │   ├── nutrition-weekly-stats.entity.ts
│   │   └── nutrition-monthly-stats.entity.ts
│   ├── nutrition-aggregation.service.ts  # Daily/weekly/monthly aggregations
│   └── nutrition-scheduler.service.ts    # Cron jobs for aggregation
│
├── user/                        # User Module
│   ├── user.service.ts          # User profile CRUD
│   ├── user.entity.ts           # User entity
│   └── user.types.ts            # Role definitions
│
└── supabase/                    # Supabase Integration
    ├── supabase.service.ts      # Supabase client
    └── supabase.module.ts
```

### Authentication System

#### Email Authentication
- **Registration**: Supabase Auth sign-up with email + password
- **Login**: Email + password authentication via Supabase
- **Email Verification**: Users must verify email before login
- **Profile Management**: JWT-based auth with Supabase token exchange

#### Phone OTP Authentication
- **Send OTP**: Phone number + SMS OTP
- **Verify OTP**: Confirm phone with 6-digit code
- **Phone Registration**: New users can register with phone + username
- **Two-Step**: Phone verification + username setup

#### Authorization Guards
- **AuthGuard**: Validates JWT tokens on protected routes
- **ChatLimitGuard**: Rate limits AI chat requests per user
- **ProUserGuard**: Restricts premium features to paid users
- **Role-Based**: Support for user/admin/pro roles

### Meal Management

#### CRUD Operations
- `POST /api/meals` - Create meal with food items
- `GET /api/meals/today` - Get today's meals
- `GET /api/meals/range` - Get meals by date range
- `GET /api/meals/:id` - Get specific meal
- `POST /api/meals/add-food` - Add food item to meal
- `DELETE /api/meals/:mealId/food/:foodId` - Remove food item

#### Food Items
```typescript
interface FoodItem {
  id?: string;
  name: string;
  quantity: number;
  unit: string;      // g, ml, cup, bowl, katori, pcs, etc.
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  micronutrients?: Record<string, number>;  // vitamin_c, iron, calcium, etc.
}
```

### Nutrition Statistics Aggregation

#### Daily Statistics
- Aggregates all meals for a specific date
- Calculates totals: calories, protein, carbs, fat
- Meal breakdown: breakfast, lunch, dinner, snack
- Micronutrient totals
- Stores in `nutrition_daily_stats` table

#### Weekly Statistics
- Aggregates daily stats for a week
- Averages and totals for macros
- Days tracked within week
- Goal streak tracking
- Stores in `nutrition_weekly_stats` table

#### Monthly Statistics
- Aggregates daily stats for a month
- Average daily values
- Total monthly consumption
- Tracking percentage (days logged / total days)
- Longest streak calculation
- Weekly breakdown
- Stores in `nutrition_monthly_stats` table

#### Scheduled Jobs
| Job | Schedule | Purpose |
|-----|----------|---------|
| Daily Aggregation | 2:00 AM | Aggregate yesterday's meals |
| Weekly Aggregation | Sundays 3:00 AM | Aggregate previous week |
| Monthly Aggregation | 1st of month 4:00 AM | Aggregate previous month |
| Data Cleanup | 5:00 AM daily | Remove data older than 90 days |

### AI Integration

#### Chat Endpoint
- **Context Building**: Includes user profile, today's meals, daily targets
- **Image Support**: Base64-encoded images for food recognition
- **Premium Guard**: Limits free users
- **Chat Limit**: Rate limiting per user

#### Generate Nutrient Endpoint
- Accepts food items with quantity and unit
- Returns calculated nutrients from AI service
- Used for meal creation with AI suggestions

---

## AI Service (FastAPI) Details

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Application                        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │   Middleware │  │   Rate Limit │  │    Prometheus        │ │
│  │   CORS, etc  │  │  (slowapi)   │  │    Metrics           │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
│                           │                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Endpoints                             │  │
│  │  POST /chat              │  GET  /sessions/stats          │  │
│  │  POST /chat-with-image   │  GET  /health/*                │  │
│  │  POST /chat/agent/:name  │  GET  /metrics                 │  │
│  │  POST /tools/*           │  GET  /info                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              OpenAI Agents SDK Layer                     │  │
│  │                                                          │  │
│  │   ┌──────────────────────────────────────────────────┐  │  │
│  │   │              Agent Runner                       │  │  │
│  │   └──────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  │   ┌────────────┐ ┌────────────┐ ┌────────────┐          │  │
│  │   │   Coach    │ │ Nutrition │ │   Vision   │          │  │
│  │   │   Agent    │ │   Agent   │ │   Agent    │          │  │
│  │   └────────────┘ └────────────┘ └────────────┘          │  │
│  │                                                          │  │
│  │   ┌────────────┐                                        │  │
│  │   │ Knowledge  │      Agent Handoffs                     │  │
│  │   │   Agent    │◄──────────────────────────────┐        │  │
│  │   └────────────┘                               │        │  │
│  │                                               ▼        │  │
│  │                              ┌───────────────────────┐  │  │
│  │                              │    Tool Calling       │  │  │
│  │                              └───────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      Tools Layer                          │  │
│  │                                                          │  │
│  │   ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ │  │
│  │   │   Nutrition   │ │     Vision    │ │   RAG         │ │  │
│  │   │   Engine     │ │   Analyzer    │ │   Retriever   │ │  │
│  │   │  (USDA API)  │ │  (LLaVA)      │ │  (Qdrant)     │ │  │
│  │   └───────────────┘ └───────────────┘ └───────────────┘ │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   LiteLLM Layer                          │  │
│  │                                                          │  │
│  │   Text: Kimi-K2-Instruct (Moonshot AI)                  │  │
│  │   Vision: LLaVA-1.5-7b (Together AI / Hugging Face)      │  │
│  │   Embeddings: all-MiniLM-L6-v2                          │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Session Storage                        │  │
│  │                                                          │  │
│  │   Redis (production) │ In-Memory (development)           │  │
│  │   24-hour TTL │ Session persistence                     │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Agents

#### Coach Agent (Primary)
The main health coach agent that users interact with by default.

**Capabilities:**
- General nutrition Q&A
- Meal recommendations
- Goal tracking motivation
- Delegates to specialized agents when needed

**System Instructions:**
```
You are a knowledgeable and safe AI Health & Nutrition Coach.
- Provide personalized nutrition and health guidance
- Answer questions about diet, exercise, and wellness
- Motivate and support the user's health journey
- Use tools to get accurate nutrition data and health information

Rules:
1. NEVER invent medical claims or nutritional data
2. ALWAYS use nutrition_lookup for food nutrition queries
3. ALWAYS use calculate_rda for RDA calculations
4. ALWAYS use rag_retrieve for medical/health information
5. Include disclaimer: "Consult a healthcare professional"
6. Keep responses concise (1-3 sentences)
7. Be encouraging and supportive
```

#### Nutrition Agent (Specialist)
Specialized in detailed nutrition calculations.

**Capabilities:**
- Food nutrition lookup via USDA API
- RDA percentage calculations
- Meal composition analysis
- Nutrient deficiency identification

**Available Tools:**
- `nutrition_lookup`: Look up food nutrition data
- `calculate_rda`: Calculate RDA percentages
- `calculate_meal_nutrition`: Total meal nutrition

#### Vision Agent (Specialist)
Analyzes food images to identify items and estimate portions.

**Capabilities:**
- Food image classification with LLaVA
- Portion estimation
- Nutrition lookup for detected foods
- Confidence scoring

**Available Tools:**
- `vision_analyze`: Analyze food images
- `nutrition_lookup`: Get nutrition for detected items

#### Knowledge Agent (Specialist)
Retrieves evidence-based health information from knowledge base.

**Capabilities:**
- RAG-based document retrieval
- Medical/nutrition question answering
- Source citations
- WHO/ICMR/USDA guideline references

**Available Tools:**
- `rag_retrieve`: Retrieve relevant documents

### Tools

#### NutritionEngine
Deterministic nutrition calculations with USDA API integration.

**Features:**
- USDA FoodData Central API integration
- Unit conversion (g, ml, cup, bowl, katori, pcs, etc.)
- Piece weight database (Indian foods: roti, dal, paneer, etc.)
- LLM-assisted unit conversion fallback
- Local food database fallback

**Unit Conversions:**
| Unit Type | Examples | Conversion |
|-----------|----------|------------|
| Weight | g, mg, kg, oz, lb | Standard metric conversion |
| Volume | ml, cup, glass | 240ml per cup, 250ml per glass |
| Indian | katori, bowl | 150g per katori, 250g per bowl |
| Household | tsp, tbsp | 5ml per tsp, 15ml per tbsp |
| Pieces | pcs, piece | Food-specific weights |

**Piece Weights (Indian Foods):**
- Roti/Chapati: 30g
- Paratha: 50g
- Dal: 250g (per serving)
- Paneer: 50g
- Rice: 200g (per cup)
- Banana: 120g
- Apple: 180g
- Egg: 50g
- Chicken breast: 150g

#### VisionAnalyzer
Image analysis using LLaVA vision model.

**Features:**
- Base64 image input
- Food detection and classification
- Confidence scoring
- Optional nutrition lookup

**Process:**
1. Receive base64 image
2. Pass to LLaVA-1.5-7b model
3. Parse detected food items
4. Calculate confidence scores
5. (Optional) Lookup nutrition for each item

#### RAGRetriever
Retrieval-augmented generation for health/nutrition knowledge.

**Features:**
- Query embedding generation
- Vector similarity search (Qdrant)
- Top-k document retrieval
- Source citation support

**Knowledge Base:**
- Nutrition guidelines (WHO, ICMR, USDA)
- Diet recommendations
- Health information

### Session Management

#### Redis Session Store
Production-ready session storage with Redis.

**Features:**
- 24-hour TTL (configurable)
- Automatic expiration
- Session statistics endpoint
- Connection pooling

#### In-Memory Fallback
Development-friendly session storage.

**Features:**
- No external dependencies
- Works in devcontainers
- Thread-safe with asyncio lock
- Lost on service restart

### Rate Limiting & Security

#### Rate Limiting
- Configurable requests per minute (default: 60)
- Per-IP tracking
- slowapi integration
- Customizable limits per endpoint

#### API Key Authentication
- Bearer token validation
- Production-required keys
- Development bypass allowed
- HTTPS enforcement in production

#### Security Headers
- CORS configured per environment
- Trusted host validation
- Request validation with Pydantic
- Error handling middleware

### Monitoring & Observability

#### Prometheus Metrics
```python
# Available metrics
REQUEST_COUNT    # Counter: Total API requests by method/endpoint
REQUEST_LATENCY  # Histogram: Request duration in seconds
ACTIVE_REQUESTS  # Gauge: Number of concurrent requests
SESSION_COUNT    # Gauge: Active sessions
HEALTH_CHECKS   # Counter: Health check results
```

#### Health Endpoints
- `/health/live`: Liveness probe (is app running?)
- `/health/ready`: Readiness probe (is app ready?)
- `/health/startup`: Startup probe (initialization complete?)
- `/metrics`: Prometheus metrics endpoint
- `/info`: Application information

---

## Key Features

### 1. AI-Powered Nutrition Chat

**Context-Aware Conversations:**
- User profile context (age, height, weight, goals)
- Today's meal context (what's been eaten)
- Daily targets context (calorie/macro goals)
- Premium feature access control

**Image Analysis:**
- Upload food photos
- LLaVA model identifies food items
- Estimates portions
- Provides nutrition estimates

### 2. Nutrition Statistics Dashboard

**Real-Time Aggregation:**
- Daily macros and micros
- Meal breakdown (breakfast/lunch/dinner/snack)
- Weekly averages and trends
- Monthly progress tracking
- Goal streak calculation

**Visual Insights:**
- Calorie consumption charts
- Macro distribution
- Tracking consistency
- Streak milestones

### 3. Food Database

**Multi-Source Nutrition Data:**
- USDA FoodData Central (primary)
- Local food database (fallback)
- LLM-assisted unit conversion
- Indian food weights database

**Supported Measurements:**
- Metric: g, mg, kg, ml, l
- US Customary: oz, lb, cup, tbsp, tsp
- Indian: katori, bowl, glass
- Pieces: 1 piece = standard serving

### 4. Unit Conversion System

All food measurements are converted to grams before nutrient calculation:

**Supported Units:**
- **Weight**: g, mg, kg, oz, lb
- **Volume**: ml, cup, glass, katori, bowl
- **Household**: tsp, tbsp
- **Pieces**: pcs, piece (standardized)

**Piece-to-Gram Conversion:**
- Standard: 1 piece = 100g (reference serving)
- Food-specific: roti = 30g, egg = 50g, etc.

**Example:**
```
Input: 2 rotis, unit = "pcs"
Conversion: 2 × 30g = 60g
Result: ~190 calories (roti nutrition per 100g)
```

### 5. Data Retention & Cleanup

**Automatic Data Management:**
- 90-day data retention policy
- Daily cleanup at 5:00 AM
- Aggregated stats preserved
- User request data removed

**Cron Schedule:**
| Time | Job |
|------|-----|
| 2:00 AM | Daily aggregation |
| 3:00 AM (Sun) | Weekly aggregation |
| 4:00 AM (1st) | Monthly aggregation |
| 5:00 AM | Data cleanup (>90 days) |

---

## API Endpoints

### Authentication (API Server)
```
POST /api/auth/register              # User registration (email)
POST /api/auth/login                 # User login (email)
GET  /api/auth/profile               # Get user profile
PUT  /api/auth/profile               # Update profile
POST /api/auth/send-phone-otp        # Send phone OTP
POST /api/auth/verify-phone-otp      # Verify phone OTP
POST /api/auth/register-phone        # Register with phone
POST /api/auth/resend-verification-email  # Resend email verification
POST /api/auth/logout                # Logout
POST /api/auth/exchange-supabase-token # Token exchange
```

### Meals (API Server)
```
GET  /api/meals/today                # Get today's meals
GET  /api/meals/range                # Get meals by date range
GET  /api/meals/:id                  # Get specific meal
POST /api/meals                      # Create meal
POST /api/meals/add-food             # Add food to meal
DELETE /api/meals/:mealId/food/:foodId  # Remove food item
```

### Nutrition Statistics (API Server)
```
GET  /api/meals/stats/daily          # Daily stats (query: startDate, endDate)
GET  /api/meals/stats/weekly        # Weekly stats (query: startDate, endDate)
GET  /api/meals/stats/monthly        # Monthly stats (query: year)
GET  /api/meals/stats/summary        # Combined summary (7d, 4w, 3m)
POST /api/meals/stats/aggregate      # Trigger manual aggregation
```

### AI Chat (API Server)
```
POST /api/ai/chat                   # AI chat (auth required)
POST /api/ai/generate-nutrient      # Generate nutrients for food
POST /api/ai/chat/agent/:name       # Chat with specific agent (pro only)
POST /api/ai/tools/nutrition/lookup  # Nutrition lookup
POST /api/ai/tools/nutrition/rda     # RDA calculation
POST /api/ai/tools/vision/analyze    # Vision analysis (pro only)
POST /api/ai/tools/rag/retrieve     # RAG document retrieval
GET  /api/ai/agents                  # List available agents
GET  /api/ai/sessions/:session_id    # Get session
DELETE /api/ai/sessions/:session_id  # Delete session
```

### AI Service (Internal)
```
POST /chat                           # Text chat (agent: coach)
POST /chat-with-image                # Chat with image analysis
POST /chat/agent/:agent_name        # Chat with specific agent
POST /tools/nutrition/lookup         # Nutrition lookup
POST /tools/nutrition/rda            # RDA calculation
POST /tools/vision/analyze           # Vision analysis
POST /tools/rag/retrieve             # RAG retrieval
GET  /sessions/:session_id           # Get session
DELETE /sessions/:session_id         # Delete session
GET  /sessions/stats                 # Session statistics
GET  /health/live                    # Liveness check
GET  /health/ready                   # Readiness check
GET  /metrics                        # Prometheus metrics
GET  /info                           # Service info
```

---

## Database Schema

### Core Tables (Supabase)

```sql
-- Users (managed by Supabase Auth)
-- id, email, phone, created_at, etc.

-- User Profile (app_user)
CREATE TABLE app_user (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  age INTEGER,
  sex VARCHAR(20),
  height DECIMAL(5,2),      -- in cm
  weight DECIMAL(5,2),       -- in kg
  activity_level VARCHAR(50),
  diet_type VARCHAR(50),
  primary_goal VARCHAR(100),
  profile_completed BOOLEAN DEFAULT FALSE,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Meals
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name VARCHAR(100),        -- breakfast, lunch, dinner, snack
  items JSONB NOT NULL,      -- Array of FoodItem
  calories DECIMAL(10,2) NOT NULL,
  micronutrients JSONB,      -- Key-value pairs
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name, date)
);

-- Daily Nutrition Stats
CREATE TABLE nutrition_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL,
  calories DECIMAL(10,2),
  protein DECIMAL(10,2),
  carbohydrates DECIMAL(10,2),
  fat DECIMAL(10,2),
  micronutrients JSONB,
  breakfast_calories DECIMAL(10,2),
  lunch_calories DECIMAL(10,2),
  dinner_calories DECIMAL(10,2),
  snack_calories DECIMAL(10,2),
  total_meals INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Weekly Nutrition Stats
CREATE TABLE nutrition_weekly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  week_number INTEGER,
  year INTEGER,
  avg_calories DECIMAL(10,2),
  avg_protein DECIMAL(10,2),
  avg_carbohydrates DECIMAL(10,2),
  avg_fat DECIMAL(10,2),
  total_calories DECIMAL(10,2),
  total_protein DECIMAL(10,2),
  total_carbohydrates DECIMAL(10,2),
  total_fat DECIMAL(10,2),
  days_tracked INTEGER,
  goal_streak_days INTEGER,
  total_breakfast_calories DECIMAL(10,2),
  total_lunch_calories DECIMAL(10,2),
  total_dinner_calories DECIMAL(10,2),
  total_snack_calories DECIMAL(10,2),
  UNIQUE(user_id, week_start)
);

-- Monthly Nutrition Stats
CREATE TABLE nutrition_monthly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  avg_calories DECIMAL(10,2),
  avg_protein DECIMAL(10,2),
  avg_carbohydrates DECIMAL(10,2),
  avg_fat DECIMAL(10,2),
  total_calories DECIMAL(10,2),
  total_protein DECIMAL(10,2),
  total_carbohydrates DECIMAL(10,2),
  total_fat DECIMAL(10,2),
  days_tracked INTEGER,
  total_days_in_month INTEGER,
  tracking_percentage DECIMAL(5,2),
  goal_streak_days INTEGER,
  longest_streak INTEGER,
  total_breakfast_calories DECIMAL(10,2),
  total_lunch_calories DECIMAL(10,2),
  total_dinner_calories DECIMAL(10,2),
  total_snack_calories DECIMAL(10,2),
  weekly_breakdown JSONB,
  UNIQUE(user_id, month, year)
);

-- Indexes
CREATE INDEX idx_meals_user_date ON meals(user_id, date);
CREATE INDEX idx_daily_stats_user_date ON nutrition_daily_stats(user_id, date);
CREATE INDEX idx_weekly_stats_user_week ON nutrition_weekly_stats(user_id, week_start);
CREATE INDEX idx_monthly_stats_user_month ON nutrition_monthly_stats(user_id, month, year);
```

---

## Configuration

### Environment Variables

#### Mobile App (.env)
```bash
EXPO_PUBLIC_DEV_API_URL=http://10.0.2.2:3000    # Local development
EXPO_PUBLIC_API_URL=https://your-production-api.com
```

#### API Server (.env)
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/longevix

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# AI Service
AI_SERVICE_URL=http://localhost:8000
API_SERVICE_KEY=your-secret-key

# JWT
JWT_SECRET=your-jwt-secret

# Optional
USDA_API_KEY=your-usda-api-key
NODE_ENV=development
```

#### AI Service (.env)
```bash
# API Security
API_SERVICE_KEY=your-secret-key
ENVIRONMENT=development

# Redis (production)
REDIS_URL=redis://localhost:6379/0

# LiteLLM + Hugging Face
HF_TOKEN=hf_your-huggingface-token
HF_TEXT_MODEL=moonshotai/Kimi-K2-Instruct
HF_VISION_MODEL=llava-hf/llava-1.5-7b-hf
HF_INFERENCE_PROVIDER=together
USE_LOCAL_MODEL=false

# USDA API
USDA_API_KEY=your-usda-api-key

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60

# CORS
CORS_ORIGINS=*
API_SERVICE_PORT=8000
```

---

## Development Setup

### Mobile App
```bash
cd mobile
npm install
npx expo start
```

### API Server
```bash
cd backend/api-server
npm install
npm run start:dev
```

### AI Service
```bash
cd backend/api-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Docker (AI Service)
```bash
cd backend/api-service
docker build -t longevix-ai .
docker run -p 8000:8000 longevix-ai
```

---

## Security Considerations

1. **API Key Authentication**: Internal services use shared API keys
2. **JWT Tokens**: User authentication via Supabase JWT
3. **Row Level Security**: Database-level access control via Supabase
4. **Premium Guard**: Role-based access control for AI features
5. **Input Validation**: All inputs validated with class-validator/Pydantic
6. **CORS**: Configured for mobile app origins
7. **Rate Limiting**: Prevents API abuse (60 req/min default)
8. **Data Retention**: Automatic cleanup of data > 90 days
9. **Email Verification**: Required before login
10. **Phone OTP**: Secure phone-based authentication

---

## Performance Optimizations

1. **Model Loading**: AI models loaded once at startup
2. **Database Indexing**: Indexed on userId + date fields
3. **Aggregation**: Pre-calculated statistics reduce query load
4. **Caching**: Redis sessions with TTL, unit conversion cache
5. **Connection Pooling**: TypeORM with PostgreSQL pooling
6. **Async Operations**: httpx async HTTP for external APIs
7. **Lazy Loading**: Agents created on-demand
8. **Batched Requests**: USDA API batch support

---

## Monitoring & Logging

### API Server (NestJS)
- Built-in NestJS logger
- Structured logging with context
- Error tracking with stack traces
- Request/response logging

### AI Service (FastAPI)
- **Prometheus Metrics**: Request counts, latencies
- **Health Checks**: Kubernetes-ready probes
- **Structured Logging**: JSON format with levels
- **Session Stats**: Active session tracking

### Log Levels
| Service | Level | Purpose |
|---------|-------|---------|
| API Server | DEBUG | Development debugging |
| API Server | INFO  | Production audit trail |
| AI Service | INFO  | Request tracking |
| AI Service | DEBUG | Model interaction |

---

## Future Enhancements

- **GraphQL API**: Flexible queries for mobile app
- **Redis Caching**: Reduce database load
- **WebSockets**: Real-time notifications
- **Larger LLM**: Better AI responses with larger model
- **On-Device AI**: Run LLM on mobile device
- **Offline-First**: Full offline support
- **ML Recommendations**: Personalized meal suggestions
- **Social Features**: Share progress, compete with friends
- **Integration APIs**: Connect with fitness devices

---

## Troubleshooting

### Common Issues

1. **Database Migrations**: Run `npm run typeorm migration:run`
2. **Cron Jobs Not Running**: Check @nestjs/schedule is configured
3. **AI Service Timeout**: Increase timeout in ai.service.ts
4. **Image Upload Fails**: Verify base64 encoding format
5. **Stats Not Updating**: Trigger manual aggregation via API
6. **Redis Connection Failed**: Check Redis URL in environment
7. **Supabase Auth Errors**: Verify JWT secret matches
8. **Rate Limit Exceeded**: Reduce request frequency or increase limit

### Debug Commands
```bash
# Check API Server logs
npm run start:dev

# Check AI Service logs
uvicorn app.main:app --reload

# Trigger manual aggregation
curl -X POST /api/meals/stats/aggregate \
  -H "Authorization: Bearer TOKEN"

# Check session statistics
curl http://localhost:8000/sessions/stats

# Prometheus metrics
curl http://localhost:8000/metrics
```

---

## Contributing

1. Follow existing code structure
2. Add proper error handling
3. Update this documentation for new features
4. Test on both iOS and Android
5. Run linter: `npm run lint`
6. Write unit tests for new services
7. Document environment variables

---

## License

UNLICENSED - Proprietary Software
