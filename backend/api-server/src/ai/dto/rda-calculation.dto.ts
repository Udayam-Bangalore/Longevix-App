import { IsObject } from 'class-validator';

export class RDACalculationDto {
  @IsObject()
  user_profile: Record<string, any>;

  @IsObject()
  intake: Record<string, number>;
}
