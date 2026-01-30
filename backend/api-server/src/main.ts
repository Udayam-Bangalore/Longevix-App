import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Enable CORS for all origins
  app.enableCors();

  // Set global prefix for API routes
  app.setGlobalPrefix('api');

  // Determine the appropriate host to listen on
  const host = process.env.HOST || '0.0.0.0';
  const port = process.env.PORT || 3000;

  // Start the application
  await app.listen(port, host);

  Logger.log(`🚀 Application is running on: http://${host}:${port}`);
}

bootstrap();
