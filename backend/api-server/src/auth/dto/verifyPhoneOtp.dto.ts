import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyPhoneOtpDto {
  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  token: string;
}
