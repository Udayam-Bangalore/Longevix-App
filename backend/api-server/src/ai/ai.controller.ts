import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { MealsService } from '../meals/meals.service';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';
import { GenerateNutrientDto } from './dto/generate-nutrient.dto';
import { ProUserGuard } from './guards/pro-user.guard';

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
}
