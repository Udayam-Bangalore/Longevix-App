import { IsNotEmpty, IsString } from 'class-validator';

export class SendPhoneOtpDto {
  @IsNotEmpty()
  @IsString()
  phone: string;
}
