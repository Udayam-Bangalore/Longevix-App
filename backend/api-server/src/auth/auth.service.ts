import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthResponse, User } from '@supabase/supabase-js';
import { SupabaseService } from 'src/supabase/supabase.service';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/loginUser.dto';
import { RegisterPhoneUserDto } from './dto/registerPhoneUser.dto';
import { RegisterDto } from './dto/registerUser.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly userService: UserService,
  ) {}

  async registerUser(registerUserDto: RegisterDto): Promise<AuthResponse> {
    const { data, error } = await this.supabaseService.supabase.auth.signUp({
      email: registerUserDto.email,
      password: registerUserDto.password,
      options: {
        data: {
          username: registerUserDto.username,
        },
      },
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return { data, error };
  }

  async loginUser(loginDto: LoginDto): Promise<AuthResponse> {
    // Email-based login
    if (loginDto.email) {
      const { data, error } = await this.supabaseService.supabase.auth.signInWithPassword({
        email: loginDto.email,
        password: loginDto.password,
      });

      if (error) {
        throw new UnauthorizedException(error.message);
      }

      return { data, error };
    } 
    // Phone-based login (must use OTP)
    else if (loginDto.phone) {
      throw new UnauthorizedException('Phone-based login must use OTP verification');
    } 
    else {
      throw new UnauthorizedException('Email or phone number is required');
    }
  }

  async verifyToken(token: string): Promise<User | null> {
    const { data, error } = await this.supabaseService.supabase.auth.getUser(token);

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return data.user;
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Note: Supabase Auth doesn't provide a direct refresh token API
    // Instead, we need to use the refresh token to exchange for a new session
    // This implementation uses Supabase's session refresh mechanism
    
    try {
      // In Supabase, the refresh token is used internally by the client
      // For a server-side implementation, you might need to use a different approach
      // This is a placeholder that demonstrates the concept
      
      // For now, we'll just throw an error indicating that this functionality
      // needs to be implemented based on your specific requirements
      throw new UnauthorizedException('Refresh token functionality not fully implemented');
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  async sendPhoneOtp(phone: string): Promise<{ data: any; error: any }> {
    // Check if user exists with the given phone number
    const existingUser = await this.userService.findByPhone(phone);
    if (!existingUser) {
      throw new UnauthorizedException('Phone number not registered. Please sign up first.');
    }

    const { data, error } = await this.supabaseService.supabase.auth.signInWithOtp({
      phone,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return { data, error };
  }

  async verifyPhoneOtp(
    phone: string,
    token: string,
  ): Promise<AuthResponse> {
    const { data, error } = await this.supabaseService.supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return { data, error };
  }

  async registerPhoneUser(registerPhoneUserDto: RegisterPhoneUserDto): Promise<AuthResponse> {
    // Step 1: Send OTP to phone
    const { data: sendData, error: sendError } = await this.supabaseService.supabase.auth.signInWithOtp({
      phone: registerPhoneUserDto.phone,
    });

    if (sendError) {
      throw new UnauthorizedException(sendError.message);
    }

    return { data: sendData, error: sendError };
  }

  async verifyPhoneOtpAndSetUsername(
    phone: string,
    token: string,
    username: string,
  ): Promise<AuthResponse> {
    // Step 1: Verify OTP
    const { data: verifyData, error: verifyError } = await this.supabaseService.supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (verifyError) {
      throw new UnauthorizedException(verifyError.message);
    }

    // Step 2: Update user metadata with username
    if (verifyData.user) {
      const { error: updateError } = await this.supabaseService.supabase.auth.updateUser({
        data: { username },
      });

      if (updateError) {
        throw new UnauthorizedException(updateError.message);
      }

      // Step 3: Create TypeORM user entity if it doesn't exist
      // Check if user exists by email or phone
      let existingUser;
      if (verifyData.user.email) {
        existingUser = await this.userService.findByEmail(verifyData.user.email);
      }
      
      if (!existingUser) {
        existingUser = await this.userService.findByPhone(phone);
      }

      if (!existingUser) {
        await this.userService.createUser({
          id: verifyData.user.id,
          username: username,
          email: verifyData.user.email,
          phone: phone,
        });
      } else if (!existingUser.phone) {
        // If user exists but doesn't have phone number, update it
        await this.userService.updateUser(existingUser.id, { phone });
      }
    }

    return { data: verifyData, error: null };
  }

  async resendVerificationEmail(email: string): Promise<{ data: any; error: any }> {
    const { data, error } = await this.supabaseService.supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return { data, error };
  }
}
