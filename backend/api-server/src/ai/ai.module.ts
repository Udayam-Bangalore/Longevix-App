import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MealsModule } from '../meals/meals.module';
import { UserModule } from '../user/user.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ChatLimitGuard } from './guards/chat-limit.guard';
import { ProUserGuard } from './guards/pro-user.guard';

@Module({
  imports: [ConfigModule, UserModule, MealsModule],
  controllers: [AiController],
  providers: [AiService, ProUserGuard, ChatLimitGuard],
})
export class AiModule {}
