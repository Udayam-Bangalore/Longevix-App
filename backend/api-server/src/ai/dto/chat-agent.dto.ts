import { IsOptional, IsString } from 'class-validator';

export class ChatAgentDto {
  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  context?: string;

  @IsString()
  @IsOptional()
  user_id?: string;

  @IsString()
  @IsOptional()
  session_id?: string;
}
