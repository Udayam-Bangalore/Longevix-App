import { Injectable } from '@nestjs/common';
import { GenerateNutrientDto } from './dto/generate-nutrient.dto';

@Injectable()
export class AiService {

  async chat(message: string) {
    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        throw new Error('AI chat service failed');
      }

      return await res.json();
    } catch (error) {
      console.error('Error calling AI chat service:', error);
      
      return { response: `This is a fallback response to your question: ${message}` };
    }
  }

  async generateNutrient(data: GenerateNutrientDto) {
    try {
      const res = await fetch('http://localhost:8000/generate-nutrients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error('Nutrient generation service failed');
      }

      return await res.json();
    } catch (error) {
      console.error('Error calling nutrient generation service:', error);
      
      return {
        total: {
          calories: 0,
          fat: 0,
          protein: 0,
          carbohydrates: 0,
          micronutrients: {}
        },
        items: []
      };
    }
  }
}
