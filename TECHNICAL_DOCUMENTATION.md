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
│              ┌──────────────────────┐                      │
│              │  LLaMA 3.2 1B Model  │                      │
│              └──────────────────────┘                      │
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
│   │   │   ├── ai/              # AI module (chat, nutrients)
│   │   │   ├── auth/            # Authentication module
│   │   │   ├── meals/           # Meals & nutrition stats module
│   │   │   │   ├── entities/    # Database entities
│   │   │   │   ├── nutrition-aggregation.service.ts
│   │   │   │   └── nutrition-scheduler.service.ts
│   │   │   ├── user/            # User management
│   │   │   └── supabase/        # Supabase integration
│   │   └── package.json
│   │
│   └── api-service/             # FastAPI AI Service
│       ├── app/
│       │   ├── main.py          # FastAPI endpoints
│       │   ├── model.py         # LLaMA model setup
│       │   └── constants/       # Nutrition database
│       ├── llama_3_2_1b_instruct/
│       └── requirements.txt
│
└── README.md
```

## Technology Stack

### Mobile App
- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **State Management**: React Context API
- **Storage**: AsyncStorage (local), Supabase (cloud)
- **UI**: React Native with custom styling
- **Authentication**: Supabase Auth
- **Notifications**: Expo Notifications

### API Server (NestJS)
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL (via Supabase)
- **ORM**: TypeORM
- **Authentication**: JWT + Supabase
- **Scheduling**: @nestjs/schedule (cron jobs)
- **Validation**: class-validator
- **API Documentation**: Swagger (built-in)

### AI Service (FastAPI)
- **Framework**: FastAPI
- **Language**: Python
- **Model**: LLaMA 3.2 1B Instruct
- **ML Framework**: PyTorch + Hugging Face Transformers
- **Server**: Uvicorn

## Key Features

### 1. Nutrition Statistics Aggregation System

The system automatically aggregates nutrition data at three levels:

#### Daily Statistics
- Tracks calories, protein, carbs, fat per day
- Meal breakdown (breakfast, lunch, dinner, snack)
- Micronutrient totals
- Number of meals logged

#### Weekly Statistics
- Average daily values for the week
- Total weekly consumption
- Days tracked within the week
- Goal streak tracking
- Weekly meal distribution

#### Monthly Statistics
- Average daily values for the month
- Total monthly consumption
- Days tracked vs. total days
- Tracking percentage
- Longest streak calculation
- Weekly breakdown within month
- Meal distribution totals

#### Data Retention
- **Automatic Cleanup**: Data older than 3 months is automatically deleted
- **Scheduled Jobs**:
  - Daily aggregation: 2:00 AM (yesterday's data)
  - Weekly aggregation: Sundays 3:00 AM (previous week)
  - Monthly aggregation: 1st of month 4:00 AM (previous month)
  - Cleanup: Daily 5:00 AM (data > 90 days old)

#### Database Entities

```typescript
// NutritionDailyStats
- userId, date (unique index)
- calories, protein, carbohydrates, fat
- micronutrients (JSON)
- breakfastCalories, lunchCalories, dinnerCalories, snackCalories
- totalMeals

// NutritionWeeklyStats
- userId, weekStart, weekEnd (unique index)
- weekNumber, year
- avgCalories, avgProtein, avgCarbohydrates, avgFat
- totalCalories, totalProtein, totalCarbohydrates, totalFat
- daysTracked, goalStreakDays
- meal distribution totals

// NutritionMonthlyStats
- userId, month, year (unique index)
- monthStart, monthEnd
- avg/total macros
- daysTracked, totalDaysInMonth, trackingPercentage
- goalStreakDays, longestStreak
- weeklyBreakdown (JSON array)
- meal distribution totals
```

### 2. Media Upload for AI Chat

Users can upload food images to get personalized AI feedback:

#### Features
- **Image Selection**: Camera or Photo Library
- **Image Preview**: Preview before sending
- **Base64 Encoding**: Images sent as base64 strings
- **AI Analysis**: LLM analyzes food and provides feedback

#### Implementation
```typescript
// Mobile (React Native)
- Uses expo-image-picker
- Converts to base64 with `data:image/jpeg;base64,${base64}`
- Displays preview in chat input
- **Shows image in chat bubble

// Backend (NestJS)
- ChatDto includes optional `image` field (base64)
- Routes to chatWithImage() when image present
- Forwards to AI service with context

// AI Service (FastAPI)
- Endpoint: /chat-with-image
- Analyzes image with user context
- Provides personalized nutrition feedback
```

### 3. Unit Conversion System

All food measurements are converted to grams before nutrient calculation:

#### Supported Units
- **Weight**: g, mg
- **Volume**: ml, cup, bowl, katori, glass
- **Household**: tsp, tbsp
- **Pieces**: pcs, piece (standardized to 100g per piece)
- **Metric**: kg, oz, lb

#### Piece-to-Gram Conversion
- **Standard**: 1 piece = 100g (reference serving)
- **Purpose**: Allows API to calculate nutrients based on weight
- **Accuracy**: For precise measurements, use weight units (g, oz)
- **Note**: The USDA API calculates nutrients proportionally based on gram weight

**Example Calculation:**
```
Input: 1 carrot, unit = "pcs"
Conversion: 1 × 100g = 100g
USDA API: Returns nutrients for 100g of carrot
Result: ~41 calories (based on actual carrot nutrition per 100g)
```

**For accurate tracking:**
- Use "g" (grams) for precise measurements
- Use "pcs" for quick estimates (100g standard serving)

### 3. AI Chat System

Context-aware AI nutrition assistant with premium access control.

#### Features
- **User Context**: Age, height, weight, activity level, diet type, goals
- **Meal Context**: Today's food intake, calorie totals, macro breakdown
- **Daily Targets**: BMR, TDEE, personalized macro targets
- **Premium Guard**: Only pro users get full AI responses

#### Context Building
```
User Profile:
- Age, Sex, Height, Weight
- Activity Level, Diet Type, Primary Goal

Today's Food Intake:
- All meals with items and calories
- Total: calories, protein, carbs, fat

Daily Targets & Remaining:
- Calories: consumed/target (remaining)
- Protein, Carbs, Fat
- Vitamin C, Iron, Calcium, Vitamin D
```

## API Endpoints

### Authentication
```
POST /api/auth/register              # User registration
POST /api/auth/login                 # User login
GET  /api/auth/profile               # Get user profile
POST /api/auth/profile               # Update profile
POST /api/auth/send-phone-otp        # Send phone verification
POST /api/auth/verify-phone-otp      # Verify phone OTP
POST /api/auth/refresh-token         # Refresh JWT token
```

### Meals
```
GET  /api/meals/today                # Get today's meals
GET  /api/meals/range                # Get meals by date range
GET  /api/meals/:id                  # Get specific meal
POST /api/meals                      # Create meal
POST /api/meals/add-food             # Add food to meal
DELETE /api/meals/:mealId/food/:foodId  # Remove food from meal
```

### Nutrition Statistics
```
GET  /api/meals/stats/daily          # Get daily stats (query: startDate, endDate)
GET  /api/meals/stats/weekly         # Get weekly stats (query: startDate, endDate)
GET  /api/meals/stats/monthly        # Get monthly stats (query: year)
GET  /api/meals/stats/summary        # Get combined summary (7d, 4w, 3m)
POST /api/meals/stats/aggregate      # Trigger manual aggregation
```

### AI
```
POST /api/ai/chat                    # AI chat with context
POST /api/ai/generate-nutrient       # Generate nutrients for food
```

### Internal (AI Service)
```
POST /chat                           # Text-only chat
POST /chat-with-image                # Chat with image analysis
POST /generate-nutrients             # Calculate nutrition values
```

## Database Schema

### Core Tables
```sql
-- Users (managed by Supabase Auth)
- id, email, created_at, etc.

-- User Profile (app_user)
- user_id (PK), age, sex, height, weight
- activity_level, diet_type, primary_goal

-- Meals
- id (UUID), user_id, name
- items (JSON array of FoodItem)
- calories, micronutrients (JSON)
- date, created_at, updated_at

-- Nutrition Statistics (new)
- nutrition_daily_stats
- nutrition_weekly_stats
- nutrition_monthly_stats
```

## Configuration

### Environment Variables

#### Mobile App (.env)
```
EXPO_PUBLIC_DEV_API_URL=http://10.0.2.2:3000
EXPO_PUBLIC_API_URL=https://your-production-api.com
```

#### API Server (.env)
```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_KEY=...
AI_SERVICE_URL=http://localhost:8000
API_SERVICE_KEY=your-secret-key
JWT_SECRET=your-jwt-secret
```

#### AI Service (.env)
```
API_SERVICE_KEY=your-secret-key
```

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

## Security Considerations

1. **API Key Authentication**: Internal services use shared API keys
2. **JWT Tokens**: User authentication via JWT
3. **Data Retention**: Automatic cleanup of data > 90 days
4. **Premium Guard**: Role-based access control for AI features
5. **Input Validation**: All inputs validated with class-validator
6. **CORS**: Configured for mobile app origins

## Performance Optimizations

1. **Model Loading**: AI model loaded once at startup
2. **Database Indexing**: Indexed on userId + date fields
3. **Aggregation**: Pre-calculated statistics reduce query load
4. **Caching**: Statistics updated via cron, not real-time
5. **Connection Pooling**: TypeORM with connection pooling

## Monitoring & Logging

- **API Server**: Built-in NestJS logging
- **Cron Jobs**: Logs aggregation runs and cleanup
- **Error Handling**: Graceful fallbacks with error logging
- **Performance**: Response times logged for optimization

## Future Enhancements

- GraphQL API for more flexible queries
- Redis caching layer
- Push notification scheduling
- Advanced AI model (larger LLaMA)
- Real-time sync with WebSockets
- Offline-first architecture
- ML-based meal recommendations

## Troubleshooting

### Common Issues

1. **Database Migrations**: Run `npm run typeorm migration:run`
2. **Cron Jobs Not Running**: Check @nestjs/schedule is configured
3. **AI Service Timeout**: Increase timeout in ai.service.ts
4. **Image Upload Fails**: Verify base64 encoding format
5. **Stats Not Updating**: Trigger manual aggregation via API

### Debug Commands
```bash
# Check API Server logs
npm run start:dev

# Check scheduled jobs
# Logs appear at: 2AM, 3AM (Sun), 4AM (1st), 5AM daily

# Trigger manual aggregation
curl -X POST /api/meals/stats/aggregate -H "Authorization: Bearer TOKEN"
```

## Contributing

1. Follow existing code structure
2. Add proper error handling
3. Update this documentation for new features
4. Test on both iOS and Android
5. Run linter: `npm run lint`

## License

UNLICENSED - Proprietary Software
