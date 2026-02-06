import { IsNumber, IsOptional, IsString } from 'class-validator';

export class NutritionLookupDto {
  @IsString()
  food_name: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;
}
