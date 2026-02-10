import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthResponse, User } from '@supabase/supabase-js';
import { SupabaseService } from 'src/supabase/supabase.service';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/loginUser.dto';
import { RegisterPhoneUserDto } from './dto/registerPhoneUser.dto';
import { RegisterDto } from './dto/registerUser.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Hardcoded reviewer account for testing
  private readonly REVIEWER_EMAIL = 'reviewer@longevix.com';
  private readonly REVIEWER_PASSWORD = 'test@123';

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly userService: UserService,
  ) {}

  async registerUser(registerUserDto: RegisterDto): Promise<AuthResponse> {
    // Check if trying to register as reviewer - deny this
    if (registerUserDto.email === this.REVIEWER_EMAIL) {
      throw new UnauthorizedException('This email is reserved for testing.');
    }
    
    this.logger.log(`Registration attempt for email: ${registerUserDto.email}`);
    
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
      this.logger.error(`Registration error: ${error.message}`);
      
      // Check for email already registered error
      const errorMessage = error.message.toLowerCase();
      if (
        errorMessage.includes('user already registered') ||
        errorMessage.includes('email already registered') ||
        errorMessage.includes('already exists') ||
        errorMessage.includes('duplicate') ||
        errorMessage.includes('user_already_exists')
      ) {
        throw new ConflictException('Email already exists');
      }
      
      throw new UnauthorizedException(error.message);
    }

    this.logger.log(`Registration successful for user ID: ${data.user?.id}`);
    this.logger.log(`Email confirmed at: ${data.user?.email_confirmed_at || 'not confirmed'}`);
    
    return { data, error };
  }

  async loginUser(loginDto: LoginDto): Promise<AuthResponse> {
    // Email-based login
    if (loginDto.email) {
      this.logger.log(`Login attempt for email: ${loginDto.email}`);
      
      // Check for reviewer bypass
      if (
        loginDto.email === this.REVIEWER_EMAIL &&
        loginDto.password === this.REVIEWER_PASSWORD
      ) {
        this.logger.log('Reviewer login bypass - granting admin access');
        
        // Create a mock Supabase response for the reviewer
        const mockUser = {
          id: 'reviewer-admin-id',
          app_metadata: { provider: 'email' },
          aud: 'authenticated',
          email: this.REVIEWER_EMAIL,
          email_confirmed_at: new Date().toISOString(),
          user_metadata: {
            username: 'reviewer',
          },
          role: 'admin',
          phone: undefined,
          phone_confirmed_at: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        return {
          data: {
            user: mockUser,
            session: {
              access_token: 'reviewer-bypass-token',
              refresh_token: 'reviewer-bypass-refresh-token',
              expires_in: 3600,
              token_type: 'bearer',
              user: mockUser,
            },
          },
          error: null,
        };
      }
      
      this.logger.log(`Environment: ${process.env.NODE_ENV || 'not set'}`);
      
      const { data, error } =
        await this.supabaseService.supabase.auth.signInWithPassword({
          email: loginDto.email,
          password: loginDto.password,
        });

      // Log detailed error info for debugging
      if (error) {
        this.logger.error(`Supabase auth error: ${error.message}`);
        this.logger.error(`Error code: ${error.status || 'not set'}`);
        this.logger.error(`Error name: ${error.name}`);
        
        // Map Supabase error codes to user-friendly messages
        // Check for specific errors FIRST before generic ones
        const errorMessage = error.message.toLowerCase();
        
        // Check for email confirmation issues first
        if (errorMessage.includes('email not confirmed') || 
            errorMessage.includes('email_address.is_not_verified') ||
            error.status === 400 && error.message.includes('not verified')) {
          this.logger.warn('Email confirmation required - user needs to verify email');
          throw new UnauthorizedException('Please verify your email address before logging in. Check your inbox for the verification link.');
        }
        
        // Check for invalid credentials
        if (errorMessage.includes('invalid') || 
            errorMessage.includes('credentials') || 
            errorMessage.includes('password does not match')) {
          throw new UnauthorizedException('Invalid email or password');
        }
        
        if (errorMessage.includes('rate limit')) {
          throw new UnauthorizedException('Too many attempts. Please try again later');
        }
        
        // Log the raw error for debugging if it's not a known error
        this.logger.error(`Unhandled auth error: ${error.message} (status: ${error.status})`);
        throw new UnauthorizedException('Login failed. Please check your credentials');
      }

      // Log successful login details (without sensitive data)
      this.logger.log(`Login successful for user ID: ${data.user?.id}`);
      this.logger.log(`Email confirmed: ${data.user?.email_confirmed_at || 'not confirmed'}`);
      
      return { data, error };
    }
    // Phone-based login (must use OTP)
    else if (loginDto.phone) {
      throw new UnauthorizedException(
        'Please use phone verification to log in',
      );
    } else {
      throw new BadRequestException('Please provide email or phone number');
    }
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const { data, error } =
        await this.supabaseService.supabase.auth.getUser(token);

      if (error) {
        throw new UnauthorizedException(error.message);
      }

      return data.user;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Note: Supabase Auth doesn't provide a direct refresh token API
    // Instead, we need to use the refresh token to exchange for a new session
    // This implementation uses Supabase's session refresh mechanism

    try {
      // In Supabase, the refresh token is used internally by the client
      // For a server-side implementation, you might need to use a different approach
      // This is a placeholder that demonstrates the concept

      // For now, we'll just throw an error indicating that this functionality
      // needs to be implemented based on your specific requirements
      throw new UnauthorizedException(
        'Refresh token functionality not fully implemented',
      );
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  async sendPhoneOtp(phone: string): Promise<{ data: any; error: any }> {
    // Check if user exists with the given phone number
    const existingUser = await this.userService.findByPhone(phone);
    if (!existingUser) {
      throw new UnauthorizedException(
        'Phone number not registered. Please sign up first.',
      );
    }

    const { data, error } =
      await this.supabaseService.supabase.auth.signInWithOtp({
        phone,
      });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return { data, error };
  }

  async verifyPhoneOtp(phone: string, token: string): Promise<AuthResponse> {
    const { data, error } = await this.supabaseService.supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('invalid') || errorMessage.includes('incorrect')) {
        throw new UnauthorizedException('Invalid OTP. Please check and try again');
      }
      if (errorMessage.includes('expired')) {
        throw new UnauthorizedException('OTP has expired. Please request a new one');
      }
      if (errorMessage.includes('rate limit')) {
        throw new UnauthorizedException('Too many attempts. Please try again later');
      }
      throw new UnauthorizedException('Verification failed. Please try again');
    }

    return { data, error };
  }

  async registerPhoneUser(
    registerPhoneUserDto: RegisterPhoneUserDto,
  ): Promise<AuthResponse> {
    // Step 1: Send OTP to phone
    const { data: sendData, error: sendError } =
      await this.supabaseService.supabase.auth.signInWithOtp({
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
    const { data: verifyData, error: verifyError } =
      await this.supabaseService.supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });

    if (verifyError) {
      const errorMessage = verifyError.message.toLowerCase();
      if (errorMessage.includes('invalid') || errorMessage.includes('incorrect')) {
        throw new UnauthorizedException('Invalid OTP. Please check and try again');
      }
      if (errorMessage.includes('expired')) {
        throw new UnauthorizedException('OTP has expired. Please request a new one');
      }
      if (errorMessage.includes('rate limit')) {
        throw new UnauthorizedException('Too many attempts. Please try again later');
      }
      throw new UnauthorizedException('Verification failed. Please try again');
    }

    // Step 2: Update user metadata with username
    if (verifyData.user) {
      const { error: updateError } =
        await this.supabaseService.supabase.auth.updateUser({
          data: { username },
        });

      if (updateError) {
        const errorMessage = updateError.message.toLowerCase();
        if (errorMessage.includes('username')) {
          throw new BadRequestException('Username is already taken');
        }
        throw new UnauthorizedException('Failed to update profile. Please try again');
      }

      // Step 3: Create TypeORM user entity if it doesn't exist
      // Check if user exists by email or phone
      let existingUser;
      if (verifyData.user.email) {
        existingUser = await this.userService.findByEmail(
          verifyData.user.email,
        );
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
          profileCompleted: false, // Explicitly set profileCompleted for new users
        });
      } else if (!existingUser.phone) {
        // If user exists but doesn't have phone number, update it
        await this.userService.updateUser(existingUser.id, { phone });
      }
    }

    return { data: verifyData, error: null };
  }

  async resendVerificationEmail(
    email: string,
  ): Promise<{ data: any; error: any }> {
    const { data, error } = await this.supabaseService.supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return { data, error };
  }

  async logout(): Promise<{ success: boolean }> {
    const { error } = await this.supabaseService.supabase.auth.signOut();

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return { success: true };
  }
}
