import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class RagRetrieveDto {
  @IsString()
  query: string;

  @IsNumber()
  @IsOptional()
  top_k?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  filter_tags?: string[];
}
