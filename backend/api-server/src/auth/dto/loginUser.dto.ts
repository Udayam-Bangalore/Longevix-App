import { IsEmail, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class LoginDto {
  @ValidateIf((o) => !o.phone)
  @IsEmail()
  email?: string;

  @ValidateIf((o) => !o.email)
  @IsString()
  phone?: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
