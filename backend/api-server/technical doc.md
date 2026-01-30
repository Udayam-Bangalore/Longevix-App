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
  "accessToken": "jwt_token"
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
  "username": "username",
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
    "username": "username",
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
  "accessToken": "jwt_token"
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
  "accessToken": "jwt_token"
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

## AI Endpoints (`/ai`)

### 1. Chat with AI

**Endpoint:** `POST /ai/chat`

Chat with the AI assistant. Requires AuthGuard and ProUserGuard (premium feature).

**Headers:**
- Authorization: Bearer <access_token>

**Request Body:**
```json
{
  "message": "string (required)"
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

### 3. Get Meal by ID

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

### 4. Add Food to Meal

**Endpoint:** `POST /meals/add-food`

Adds a food item to an existing or new meal.

**Headers:**
- Authorization: Bearer <access_token>

**Request Body:**
```json
{
  "mealName": "string (required)",
  "foodItem": {
    "name": "string (required)",
    "quantity": number,
    "unit": "string",
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
      "micronutrients": {
        "protein": 12
      }
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

### 5. Remove Food from Meal

**Endpoint:** `DELETE /meals/:mealId/food/:foodId`

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
        "fat": 10,
        "calories": 155
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

### 5. Remove Food from Meal

**Endpoint:** `DELETE /meals/:mealId/food/:foodId`

Removes a food item from a specific meal.

**Headers:**
- Authorization: Bearer <access_token>

**Path Parameters:**
- `mealId`: UUID of the meal
- `foodId`: UUID of the food item to remove

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
