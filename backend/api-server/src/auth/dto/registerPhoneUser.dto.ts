import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterPhoneUserDto {
  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  username: string;
}
