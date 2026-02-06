import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as crypto from 'crypto';

// Polyfill crypto for Node.js 18 - must be before any module imports that use crypto
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = crypto as any;
}

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { MealsModule } from './meals/meals.module';
import { SupabaseModule } from './supabase/supabase.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Enable scheduling/cron jobs
    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),

        autoLoadEntities: true,

        // NEVER true in production
        synchronize: config.get('NODE_ENV') !== 'production',

        // Required for Supabase
        ssl: {
          rejectUnauthorized: false,
        },

        logging: config.get('NODE_ENV') !== 'production',
      }),
    }),

    SupabaseModule,
    AuthModule,
    UserModule,
    AiModule,
    MealsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
