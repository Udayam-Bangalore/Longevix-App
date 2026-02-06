import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class FoodItemDto {
  @IsString()
  name: string;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  unit?: string;
}

export class GenerateNutrientDto {
  @IsBoolean()
  isAuthenticated: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FoodItemDto)
  food: FoodItemDto[];

  @IsEnum(
    [
      'breakfast',
      'snack',
      'dinner',
      'lunch',
      'Breakfast',
      'Lunch',
      'Snack',
      'Dinner',
    ],
    {
      message: 'Time must be one of: breakfast, lunch, snack, dinner',
    },
  )
  time: string;
}
