# NutriAI Backend

NestJS backend API for the NutriAI application.

## 🚀 Getting Started

To initialize the NestJS project, run:

```bash
# Install NestJS CLI globally (if not already installed)
npm install -g @nestjs/cli

# Initialize NestJS project in this directory
nest new . --skip-git
```

## 📁 Recommended Structure

```
backend/
├── src/
│   ├── common/              # Shared utilities, guards, decorators
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── pipes/
│   ├── config/              # Configuration module
│   ├── modules/             # Feature modules
│   │   ├── auth/            # Authentication module
│   │   ├── users/           # Users module
│   │   ├── foods/           # Foods/nutrition module
│   │   └── insights/        # AI insights module
│   ├── database/            # Database configuration & entities
│   ├── app.module.ts        # Root module
│   └── main.ts              # Application entry point
├── test/                    # E2E tests
├── .env                     # Environment variables
├── .env.example             # Example environment file
└── package.json
```

## 🛠️ Recommended Dependencies

```bash
# Database (choose one)
npm install @nestjs/typeorm typeorm pg        # PostgreSQL
npm install @nestjs/mongoose mongoose         # MongoDB
npm install @prisma/client prisma             # Prisma ORM

# Authentication
npm install @nestjs/passport passport passport-jwt
npm install @nestjs/jwt

# Validation
npm install class-validator class-transformer

# Configuration
npm install @nestjs/config

# API Documentation
npm install @nestjs/swagger swagger-ui-express
```

## 📝 Notes

This folder is intentionally left empty. Initialize your NestJS project when ready.
