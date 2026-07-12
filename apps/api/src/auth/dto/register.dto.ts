import { IsOptional, IsString, MinLength } from 'class-validator';
import { IsEmail } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  password!: string;

  @IsString()
  @MinLength(2, { message: 'Please enter your full name.' })
  fullName!: string;

  @IsString()
  @MinLength(2, { message: 'Please enter a company name.' })
  companyName!: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}
