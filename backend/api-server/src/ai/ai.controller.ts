import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';
import { GenerateNutrientDto } from './dto/generate-nutrient.dto';
import { ProUserGuard } from './guards/pro-user.guard';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @UseGuards(AuthGuard, ProUserGuard)
  async chat(@Body() dto: ChatDto) {
    return this.aiService.chat(dto.message);
  }

  @Post('generate-nutrient')
  async generateNutrient(@Body() data: GenerateNutrientDto) {
    return this.aiService.generateNutrient(data);
  }
}
