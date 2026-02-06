import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class VisionAnalyzeDto {
  @IsString()
  image_base64: string;

  @IsBoolean()
  @IsOptional()
  include_nutrition?: boolean;
}
