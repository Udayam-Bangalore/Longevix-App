import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

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

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),

        autoLoadEntities: true,

        // ❗ NEVER true in production
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
