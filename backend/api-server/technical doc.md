# API Server Technical Documentation

This document provides comprehensive documentation for all API endpoints in the Longevix API Server.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

---

## Authentication Endpoints (`/auth`)

### 1. Register User

**Endpoint:** `POST /auth/register`

Registers a new user with email and password.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)",
  "username": "string (required)"
}
```

**Response:**
```json
{
  "message": "User registered successfully. Please check your email to verify your account.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username"
  }
}
```

---

### 2. Login

**Endpoint:** `POST /auth/login`

Authenticates a user and returns an access token.

**Request Body:**
```json
{
  "email": "string (required if phone not provided)",
  "phone": "string (required if email not provided)",
  "password": "string (required)"
}
```

**Response:**
```json
{
  "message": "User logged in successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username"
  },
  "accessToken": "jwt_token",
  "refreshToken": "jwt_token"
}
```

---

### 3. Get Profile

**Endpoint:** `GET /auth/profile`

Retrieves the authenticated user's profile.

**Headers:**
- Authorization: Bearer <access_token>

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "phone": "+1234567890",
  "username": "username",
  "role": "user",
  "profileCompleted": false,
  "age": 25,
  "sex": "male",
  "height": 175,
  "weight": 70,
  "activityLevel": "moderate",
  "dietType": "balanced",
  "primaryGoal": "weight-loss"
}
```

---

### 4. Update Profile

**Endpoint:** `PUT /auth/profile`

Updates the authenticated user's profile.

**Headers:**
- Authorization: Bearer <access_token>

**Request Body:**
```json
{
  "age": 25,
  "sex": "male",
  "height": 175,
  "weight": 70,
  "activityLevel": "moderate",
  "dietType": "balanced",
  "primaryGoal": "weight-loss"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "phone": "+1234567890",
    "username": "username",
    "role": "user",
    "profileCompleted": true,
    "age": 25,
    "sex": "male",
    "height": 175,
    "weight": 70,
    "activityLevel": "moderate",
    "dietType": "balanced",
    "primaryGoal": "weight-loss"
  }
}
```

---

### 5. Send Phone OTP

**Endpoint:** `POST /auth/send-phone-otp`

Sends a verification OTP to the user's phone number.

**Request Body:**
```json
{
  "phone": "string (required)"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully",
  "data": {
    "success": true,
    "message": "OTP sent successfully"
  }
}
```

---

### 6. Verify Phone OTP

**Endpoint:** `POST /auth/verify-phone-otp`

Verifies the phone OTP and returns user session.

**Request Body:**
```json
{
  "phone": "string (required)",
  "token": "string (required)"
}
```

**Response:**
```json
{
  "message": "Phone verified successfully",
  "user": {
    "id": "uuid",
    "phone": "+1234567890"
  },
  "accessToken": "jwt_token",
  "refreshToken": "jwt_token"
}
```

---

### 7. Register Phone User

**Endpoint:** `POST /auth/register-phone`

Registers a new user via phone number.

**Request Body:**
```json
{
  "phone": "string (required)",
  "username": "string (required)"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully. Please verify with the code.",
  "data": {
    "success": true
  }
}
```

---

### 8. Verify Phone and Set Username

**Endpoint:** `POST /auth/verify-phone-and-set-username`

Verifies phone OTP and sets the username in one step.

**Request Body:**
```json
{
  "phone": "string (required)",
  "token": "string (required)",
  "username": "string (required)"
}
```

**Response:**
```json
{
  "message": "Phone verified and username set successfully",
  "user": {
    "id": "uuid",
    "phone": "+1234567890",
    "username": "username"
  },
  "accessToken": "jwt_token",
  "refreshToken": "jwt_token"
}
```

---

### 9. Resend Verification Email

**Endpoint:** `POST /auth/resend-verification-email`

Resends the email verification link.

**Request Body:**
```json
{
  "email": "string (required)"
}
```

**Response:**
```json
{
  "message": "Verification email sent successfully. Please check your inbox.",
  "data": {
    "success": true
  }
}
```

---

### 10. Refresh Token

**Endpoint:** `POST /auth/refresh-token`

Refreshes the access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "string (required)"
}
```

**Response:**
```json
{
  "accessToken": "jwt_token",
  "refreshToken": "jwt_token"
}
```

---

## AI Endpoints (`/ai`)

### 1. Chat with AI

**Endpoint:** `POST /ai/chat`

Chat with the AI assistant. Requires AuthGuard and ProUserGuard (premium feature). Supports text and image input.

**Headers:**
- Authorization: Bearer <access_token>

**Request Body:**
```json
{
  "message": "string (required)",
  "image": "string (optional - base64 encoded image)"
}
```

**Response:**
```json
{
  "response": "AI generated response"
}
```

---

### 2. Generate Nutrient Information

**Endpoint:** `POST /ai/generate-nutrient`

Generates nutrient information for an array of food items.

**Request Body:**
```json
{
  "isAuthenticated": boolean (required),
  "food": [
    {
      "name": "string (required)",
      "quantity": number (required),
      "unit": "string (optional)"
    }
  ],
  "time": "string (required) - one of: breakfast, lunch, snack, dinner"
}
```

**Response:**
```json
{
  "total": {
    "calories": number,
    "fat": number,
    "protein": number,
    "carbohydrates": number,
    "micronutrients": object
  },
  "items": []
}
```

---

## Meals Endpoints (`/meals`)

All meal endpoints require authentication (AuthGuard).

### 1. Create Meal

**Endpoint:** `POST /meals`

Creates a new meal with food items.

**Headers:**
- Authorization: Bearer <access_token>

**Request Body:**
```json
{
  "mealName": "string (required)",
  "foodItems": [
    {
      "name": "string (required)",
      "quantity": number,
      "unit": "string",
      "calories": number,
      "fat": number,
      "protein": number,
      "carbohydrates": number,
      "micronutrients": {
        "vitaminA": number,
        "vitaminC": number,
        "calcium": number,
        "iron": number
      }
    }
  ]
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Breakfast",
  "items": [
    {
      "name": "Egg",
      "quantity": 2,
      "unit": "pieces",
      "calories": 155,
      "fat": 10,
      "protein": 12,
      "carbohydrates": 1,
      "micronutrients": {
        "vitaminA": 160,
        "vitaminC": 0,
        "calcium": 50,
        "iron": 1.2
      }
    }
  ],
  "userId": "uuid",
  "calories": 155,
  "micronutrients": {},
  "date": "2024-01-01T00:00:00.000Z",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

---

### 2. Get Today's Meals

**Endpoint:** `GET /meals/today`

Retrieves all meals for the current day.

**Headers:**
- Authorization: Bearer <access_token>

**Response:**
```json
{
  "meals": [
    {
      "id": "uuid",
      "name": "Breakfast",
      "items": [],
      "userId": "uuid",
      "calories": 0,
      "micronutrients": {},
      "date": "2024-01-01T00:00:00.000Z",
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  ]
}
```

---

### 3. Get Meals by Date Range

**Endpoint:** `GET /meals/range?startDate=2024-01-01&endDate=2024-01-07`

Retrieves meals within a specified date range.

**Headers:**
- Authorization: Bearer <access_token>

**Query Parameters:**
- `startDate`: Start date in ISO format (YYYY-MM-DD)
- `endDate`: End date in ISO format (YYYY-MM-DD)

**Response:**
```json
{
  "meals": [
    {
      "id": "uuid",
      "name": "Breakfast",
      "items": [],
      "userId": "uuid",
      "calories": 450,
      "micronutrients": {},
      "date": "2024-01-01T00:00:00.000Z",
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  ]
}
```

---

### 4. Get Meal by ID

**Endpoint:** `GET /meals/:id`

Retrieves a specific meal by its ID.

**Headers:**
- Authorization: Bearer <access_token>

**Path Parameters:**
- `id`: UUID of the meal

**Response:**
```json
{
  "id": "uuid",
  "name": "Breakfast",
  "items": [
    {
      "name": "Oatmeal",
      "quantity": 1,
      "unit": "bowl",
      "calories": 150,
      "fat": 3,
      "protein": 5,
      "carbohydrates": 27,
      "micronutrients": {}
    }
  ],
  "userId": "uuid",
  "calories": 150,
  "micronutrients": {},
  "date": "2024-01-01T00:00:00.000Z",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

---

### 5. Update Meal

**Endpoint:** `PUT /meals/:id`

Updates an existing meal's name and/or food items.

**Headers:**
- Authorization: Bearer <access_token>

**Path Parameters:**
- `id`: UUID of the meal to update

**Request Body:**
```json
{
  "mealName": "string (optional)",
  "foodItems": [
    {
      "name": "string (required)",
      "quantity": number,
      "unit": "string",
      "calories": number,
      "fat": number,
      "protein": number,
      "carbohydrates": number,
      "micronutrients": {
        "vitaminA": number,
        "vitaminC": number,
        "calcium": number,
        "iron": number
      }
    }
  ]
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Breakfast",
  "items": [
    {
      "name": "Egg",
      "quantity": 2,
      "unit": "pieces",
      "calories": 155,
      "fat": 10,
      "protein": 12,
      "carbohydrates": 1,
      "micronutrients": {
        "vitaminA": 160,
        "vitaminC": 0,
        "calcium": 50,
        "iron": 1.2
      }
    }
  ],
  "userId": "uuid",
  "calories": 155,
  "micronutrients": {},
  "date": "2024-01-01T00:00:00.000Z",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

---

### 6. Delete Meal

**Endpoint:** `DELETE /meals/:id`

Deletes a meal by its ID.

**Headers:**
- Authorization: Bearer <access_token>

**Path Parameters:**
- `id`: UUID of the meal to delete

**Response:**
```json
{
  "message": "Meal deleted successfully"
}
```

---

### 7. Add Food to Meal

**Endpoint:** `POST /meals/:mealId/foods`

Adds a food item to an existing meal.

**Headers:**
- Authorization: Bearer <access_token>

**Path Parameters:**
- `mealId`: UUID of the meal (required)

**Request Body:**
```json
{
  "foodItem": {
    "name": "string (required)",
    "quantity": number,
    "unit": "string",
    "calories": number,
    "fat": number,
    "protein": number,
    "carbohydrates": number,
    "micronutrients": {
      "vitaminA": number,
      "vitaminC": number,
      "calcium": number,
      "iron": number
    }
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Breakfast",
  "items": [
    {
      "name": "Egg",
      "quantity": 2,
      "unit": "pieces",
      "calories": 155,
      "fat": 10,
      "protein": 12,
      "carbohydrates": 1,
      "micronutrients": {
        "vitaminA": 160,
        "vitaminC": 0,
        "calcium": 50,
        "iron": 1.2
      }
    }
  ],
  "userId": "uuid",
  "calories": 155,
  "micronutrients": {},
  "date": "2024-01-01T00:00:00.000Z",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

---

### 8. Remove Food from Meal

**Endpoint:** `DELETE /meals/:mealId/foods/:foodId`

Removes a specific food item from a meal.

**Headers:**
- Authorization: Bearer <access_token>

**Path Parameters:**
- `mealId`: UUID of the meal (required)
- `foodId`: UUID of the food item to remove (required)

**Response:**
```json
{
  "id": "uuid",
  "name": "Breakfast",
  "items": [],
  "userId": "uuid",
  "calories": 0,
  "micronutrients": {},
  "date": "2024-01-01T00:00:00.000Z",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

---

### 9. Get Daily Nutrition Statistics

**Endpoint:** `GET /meals/stats/daily?startDate=2024-01-01&endDate=2024-01-07`

Retrieves daily nutrition statistics for a specified date range.

**Headers:**
- Authorization: Bearer <access_token>

**Query Parameters:**
- `startDate`: Start date in ISO format (YYYY-MM-DD) (optional, defaults to 30 days ago)
- `endDate`: End date in ISO format (YYYY-MM-DD) (optional, defaults to today)

**Response:**
```json
[
  {
    "date": "2024-01-01",
    "calories": 1850,
    "protein": 75,
    "carbohydrates": 220,
    "fat": 65,
    "micronutrients": {
      "vitaminA": 850,
      "vitaminC": 60,
      "calcium": 1200,
      "iron": 15
    }
  }
]
```

---

### 10. Get Weekly Nutrition Statistics

**Endpoint:** `GET /meals/stats/weekly?startDate=2024-01-01&endDate=2024-01-14`

Retrieves weekly nutrition statistics for a specified date range.

**Headers:**
- Authorization: Bearer <access_token>

**Query Parameters:**
- `startDate`: Start date in ISO format (YYYY-MM-DD) (optional, defaults to 90 days ago)
- `endDate`: End date in ISO format (YYYY-MM-DD) (optional, defaults to today)

**Response:**
```json
[
  {
    "weekStart": "2024-01-01",
    "weekEnd": "2024-01-07",
    "calories": 12950,
    "protein": 525,
    "carbohydrates": 1540,
    "fat": 455,
    "micronutrients": {
      "vitaminA": 5950,
      "vitaminC": 420,
      "calcium": 8400,
      "iron": 105
    }
  }
]
```

---

### 11. Get Monthly Nutrition Statistics

**Endpoint:** `GET /meals/stats/monthly?year=2024`

Retrieves monthly nutrition statistics for a specified year.

**Headers:**
- Authorization: Bearer <access_token>

**Query Parameters:**
- `year`: Year (optional, defaults to current year)

**Response:**
```json
[
  {
    "year": 2024,
    "month": 1,
    "calories": 55500,
    "protein": 2250,
    "carbohydrates": 6600,
    "fat": 1950,
    "micronutrients": {
      "vitaminA": 25500,
      "vitaminC": 1800,
      "calcium": 36000,
      "iron": 450
    }
  }
]
```

---

### 12. Get Nutrition Summary

**Endpoint:** `GET /meals/stats/summary`

Retrieves a comprehensive nutrition summary including last 7 days, last 4 weeks, and last 3 months.

**Headers:**
- Authorization: Bearer <access_token>

**Response:**
```json
{
  "last7Days": [
    {
      "date": "2024-01-01",
      "calories": 1850,
      "protein": 75,
      "carbohydrates": 220,
      "fat": 65,
      "micronutrients": {}
    }
  ],
  "last4Weeks": [
    {
      "weekStart": "2024-01-01",
      "weekEnd": "2024-01-07",
      "calories": 12950,
      "protein": 525,
      "carbohydrates": 1540,
      "fat": 455,
      "micronutrients": {}
    }
  ],
  "last3Months": [
    {
      "year": 2024,
      "month": 1,
      "calories": 55500,
      "protein": 2250,
      "carbohydrates": 6600,
      "fat": 1950,
      "micronutrients": {}
    }
  ]
}
```

---

### 13. Trigger Nutrition Aggregation

**Endpoint:** `POST /meals/stats/aggregate`

Triggers manual aggregation of nutrition statistics.

**Headers:**
- Authorization: Bearer <access_token>

**Response:**
```json
{
  "message": "Aggregation completed successfully"
}
```

---

## User Roles

The API supports three user roles:

- **`user`**: Standard user with basic access
- **`prouser`**: Premium user with access to AI chat features
- **`admin`**: Administrator with full access

Role-based access is enforced via [`ProUserGuard`](backend/api-server/src/ai/guards/pro-user.guard.ts:1) for premium features.

---

## Food Item Schema

Food items in meals contain the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Name of the food item |
| `quantity` | number | Amount of the food |
| `unit` | string | Unit of measurement (g, kg, oz, lbs, pcs) |
| `calories` | number | Calories in kcal |
| `fat` | number | Fat content in grams |
| `protein` | number | Protein content in grams |
| `carbohydrates` | number | Carbohydrates in grams |
| `micronutrients` | object | Key-value pairs of micronutrient amounts |

---

## Health Check

### Root Endpoint

**Endpoint:** `GET /`

Health check endpoint.

**Response:**
```json
"Hello World!"
```

---

## Error Responses

All endpoints follow standard HTTP status codes:

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

**Error Response Format:**
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_KEY` | Supabase API key | Yes |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret for verifying tokens | Yes |
| `PORT` | Server port (default: 3000) | No |
| `HOST` | Server host (default: 0.0.0.0) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `AI_SERVICE_URL` | URL for the AI service (default: http://localhost:8000) | No |
| `API_SERVICE_KEY` | Secret key for authenticating with the AI service | Yes (if AI service requires auth) |

### Inter-Service Authentication

The api-server communicates with the AI service (api-service) using a shared secret key for authentication.

**Flow:**
```
Client → api-server (JWT auth) → api-service (API key auth)
```

**Configuration:**
1. Set `API_SERVICE_KEY` in api-server `.env` file
2. Set the same `API_SERVICE_KEY` when starting api-service
3. api-server automatically includes the key in the `Authorization: Bearer <key>` header when calling api-service

**Example .env:**
```bash
AI_SERVICE_URL=http://localhost:8000
API_SERVICE_KEY=fdcb7b7bd546ba0b867a987c3ed06ba1a537ca163b1d672aed5314735dec8a99
```

**Starting both services:**
```bash
# Terminal 1 - api-service
cd backend/api-service
API_SERVICE_KEY=fdcb7b7bd546ba0b867a987c3ed06ba1a537ca163b1d672aed5314735dec8a99 uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 2 - api-server
cd backend/api-server
npm run start:dev  # Loads API_SERVICE_KEY from .env
```

**Troubleshooting:**
- `401 Unauthorized` from api-service: API_SERVICE_KEY mismatch or missing
- Ensure both services use the exact same key
- Check that api-server's `.env` file is loaded correctly
