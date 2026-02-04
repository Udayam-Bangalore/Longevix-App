import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as crypto from 'crypto';
import { AppModule } from './app.module';

// Polyfill crypto for Node.js 18
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = crypto as any;
}

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
 // const host = process.env.HOST || '0.0.0.0';
  const port = process.env.PORT || 3000;

  // Start the application
//  await app.listen(port, host);

  await app.listen(port);
  //Logger.log(`🚀 Application is running on: http://${host}:${port}`);
  Logger.log(`🚀 Application running on port ${port}`);
}

bootstrap();
