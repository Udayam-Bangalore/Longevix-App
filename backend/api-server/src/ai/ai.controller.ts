import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { MealsService } from '../meals/meals.service';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { AiService } from './ai.service';
import { ChatAgentDto } from './dto/chat-agent.dto';
import { ChatDto } from './dto/chat.dto';
import { GenerateNutrientDto } from './dto/generate-nutrient.dto';
import { NutritionLookupDto } from './dto/nutrition-lookup.dto';
import { ProUserGuard } from './guards/pro-user.guard';
import { RDACalculationDto } from './dto/rda-calculation.dto';
import { RagRetrieveDto } from './dto/rag-retrieve.dto';
import { VisionAnalyzeDto } from './dto/vision-analyze.dto';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly userService: UserService,
    private readonly mealsService: MealsService,
  ) {}

  @Post('chat')
  @UseGuards(AuthGuard, ProUserGuard)
  async chat(@Body() dto: ChatDto, @Request() req) {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    // Fetch user profile
    let user: User | null = null;
    if (userEmail) {
      user = await this.userService.findByEmail(userEmail);
    }
    if (!user && userId) {
      user = await this.userService.findById(userId);
    }

    // Fetch today's meals
    const today = new Date();
    const todaysMeals = userId
      ? await this.mealsService.getMealsByDate(userId, today)
      : [];

    // If image is provided, use the image analysis endpoint
    if (dto.image) {
      return this.aiService.chatWithImage(dto.message, dto.image, {
        user,
        todaysMeals,
      });
    }

    return this.aiService.chat(dto.message, {
      user,
      todaysMeals,
    });
  }

  @Post('generate-nutrient')
  async generateNutrient(@Body() data: GenerateNutrientDto) {
    return this.aiService.generateNutrient(data);
  }

  @Post('chat/agent/:agent_name')
  @UseGuards(AuthGuard, ProUserGuard)
  async chatWithAgent(
    @Param('agent_name') agentName: string,
    @Body() dto: ChatAgentDto,
    @Request() req,
  ) {
    const userId = req.user?.id || '';
    const sessionId = dto.session_id || '';
    return this.aiService.chatWithAgent(
      agentName,
      dto.message,
      userId,
      sessionId,
      dto.context,
    );
  }

  @Post('tools/nutrition/lookup')
  @UseGuards(AuthGuard)
  async nutritionLookup(@Body() dto: NutritionLookupDto) {
    return this.aiService.nutritionLookup(
      dto.food_name,
      dto.quantity || 1.0,
      dto.unit || 'serving',
    );
  }

  @Post('tools/nutrition/rda')
  @UseGuards(AuthGuard)
  async calculateRDA(@Body() dto: RDACalculationDto) {
    return this.aiService.calculateRDA(dto.user_profile, dto.intake);
  }

  @Post('tools/vision/analyze')
  @UseGuards(AuthGuard, ProUserGuard)
  async visionAnalyze(@Body() dto: VisionAnalyzeDto) {
    return this.aiService.visionAnalyze(
      dto.image_base64,
      dto.include_nutrition,
    );
  }

  @Post('tools/rag/retrieve')
  @UseGuards(AuthGuard)
  async ragRetrieve(@Body() dto: RagRetrieveDto) {
    return this.aiService.ragRetrieve(
      dto.query,
      dto.top_k || 3,
      dto.filter_tags,
    );
  }

  @Get('agents')
  @UseGuards(AuthGuard)
  async listAgents() {
    return this.aiService.listAgents();
  }

  @Get('sessions/:session_id')
  @UseGuards(AuthGuard)
  async getSession(@Param('session_id') sessionId: string) {
    return this.aiService.getSession(sessionId);
  }

  @Delete('sessions/:session_id')
  @UseGuards(AuthGuard)
  async deleteSession(@Param('session_id') sessionId: string) {
    return this.aiService.deleteSession(sessionId);
  }
}
