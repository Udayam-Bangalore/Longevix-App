import {
  Body,
  Controller,
  Get,
  HttpException,
  Logger,
  Post,
  Put,
  Request,
  UnauthorizedException,
  UseGuards
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { Role } from '../user/user.types';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/loginUser.dto';
import { RegisterPhoneUserDto } from './dto/registerPhoneUser.dto';
import { RegisterDto } from './dto/registerUser.dto';
import { SendPhoneOtpDto } from './dto/sendPhoneOtp.dto';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import { VerifyPhoneOtpDto } from './dto/verifyPhoneOtp.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  async register(@Body() registerUserDto: RegisterDto) {
    const result = await this.authService.registerUser(registerUserDto);
    
    // Check if email confirmation is required
    const emailConfirmed = !!result.data.user?.email_confirmed_at;
    
    // Create local database user if registration was successful
    if (result.data.user) {
      try {
        await this.userService.createUser({
          id: result.data.user.id,
          username: registerUserDto.username || result.data.user.user_metadata?.username,
          email: result.data.user.email,
          phone: undefined,
          profileCompleted: false,
        });
      } catch (userError) {
        // If user creation fails (e.g., already exists), log but don't fail registration
        // This handles cases where Supabase user exists but local DB user doesn't
        const errorStatus = (userError as any)?.status || (userError as any)?.response?.statusCode;
        if (!(userError instanceof HttpException && errorStatus === 409)) {
          this.logger.error(`Failed to create local user: ${(userError as Error).message}`);
        }
      }
    }
    
    if (!emailConfirmed) {
      return {
        message: 'Registration successful! Please check your email to verify your account before logging in.',
        user: result.data.user,
        requiresEmailVerification: true,
      };
    }
    
    return {
      message: 'User registered successfully and email verified!',
      user: result.data.user,
      requiresEmailVerification: false,
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.loginUser(loginDto);

      // Override Supabase's default "authenticated" role with "user" for non-admin/non-pro-user accounts
      const user = result.data.user;
      if (user && user.role === 'authenticated') {
        user.role = 'user';
      }

      // Check if user is a reviewer (for Google Play Store access)
      const isReviewer = user?.email === 'reviewer@longevix.com';

      // Check email verification status (bypass for reviewer)
      const emailVerified = user?.email_confirmed_at || isReviewer;
      if (!emailVerified) {
        throw new UnauthorizedException({
          message: 'Please verify your email address to log in',
          error: 'EMAIL_NOT_VERIFIED',
          resolution: 'RESEND_VERIFICATION',
        });
      }

      // Note: Phone verification is optional - users can login with email only
      // Phone verification is only required for phone-based authentication

      return {
        message: 'User logged in successfully',
        user,
        accessToken: result.data.session?.access_token,
        refreshToken: result.data.session?.refresh_token,
      };
    } catch (error) {
      // Check if it's an email verification error and add helpful info
      if (error instanceof UnauthorizedException) {
        const errorMessage = error.message?.toLowerCase() || '';
        if (errorMessage.includes('verify your email') || errorMessage.includes('email not confirmed')) {
          throw new UnauthorizedException({
            message: errorMessage,
            error: 'EMAIL_NOT_VERIFIED',
            resolution: 'RESEND_VERIFICATION',
            hint: 'Use POST /auth/resend-verification-email to resend the verification link',
          });
        }
      }
      throw error;
    }
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    // Check if user is a reviewer (bypass database lookup)
    const isReviewer = req.user?.email === 'reviewer@longevix.com';
    
    if (isReviewer) {
      // Return admin profile for reviewer
      return {
        id: req.user?.id,
        email: req.user?.email,
        phone: req.user?.phone,
        username: req.user?.user_metadata?.username || 'reviewer',
        role: 'admin',
        profileCompleted: true,
        age: undefined,
        sex: undefined,
        height: undefined,
        weight: undefined,
        activityLevel: undefined,
        dietType: undefined,
        primaryGoal: undefined,
      };
    }

    // Try to find user by ID first (most reliable - uses Supabase auth ID)
    let user = await this.userService.findById(req.user?.id);

    // If not found by ID, try email
    if (!user && req.user?.email) {
      user = await this.userService.findByEmail(req.user?.email);
    }

    // If not found by email, try phone
    if (!user && req.user?.phone) {
      user = await this.userService.findByPhone(req.user?.phone);
    }

    // If user still not found, return an error - user should register first
    if (!user) {
      throw new UnauthorizedException({
        message: 'User not found in database. Please register first.',
        error: 'USER_NOT_FOUND',
        resolution: 'REGISTER',
      });
    }

    return {
      id: req.user?.id,
      email: req.user?.email,
      phone: user?.phone || req.user?.phone,
      username: req.user?.user_metadata?.username,
      role: user?.role || Role.User,
      profileCompleted: user?.profileCompleted || false,
      age: user?.age,
      sex: user?.sex,
      height: user?.height,
      weight: user?.weight,
      activityLevel: user?.activityLevel,
      dietType: user?.dietType,
      primaryGoal: user?.primaryGoal,
    };

  }

  @UseGuards(AuthGuard)
  @Put('profile')
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    // Check if user is a reviewer (bypass database lookup)
    const isReviewer = req.user?.email === 'reviewer@longevix.com';
    
    if (isReviewer) {
      // Return updated admin profile for reviewer without storing in database
      return {
        message: 'Profile updated successfully',
        user: {
          id: req.user?.id,
          email: req.user?.email,
          phone: req.user?.phone,
          username: req.user?.user_metadata?.username || 'reviewer',
          role: 'admin',
          profileCompleted: true,
          age: updateProfileDto.age,
          sex: updateProfileDto.sex,
          height: updateProfileDto.height,
          weight: updateProfileDto.weight,
          activityLevel: updateProfileDto.activityLevel,
          dietType: updateProfileDto.dietType,
          primaryGoal: updateProfileDto.primaryGoal,
        },
      };
    }

    // Try to find user by ID first (most reliable - uses Supabase auth ID)
    let user = await this.userService.findById(req.user?.id);

    // If not found by ID, try email
    if (!user && req.user?.email) {
      user = await this.userService.findByEmail(req.user?.email);
    }

    // If not found by email, try phone
    if (!user && req.user?.phone) {
      user = await this.userService.findByPhone(req.user?.phone);
    }

    // If user still not found, return error - user should register first
    if (!user) {
      throw new UnauthorizedException({
        message: 'User not found in database. Please register first.',
        error: 'USER_NOT_FOUND',
        resolution: 'REGISTER',
      });
    }

    const updatedUser = await this.userService.updateUser(user.id, {
      ...updateProfileDto,
      profileCompleted: true,
    });

    return {
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        username: req.user?.user_metadata?.username,
        role: updatedUser.role,
        profileCompleted: updatedUser.profileCompleted,
        age: updatedUser.age,
        sex: updatedUser.sex,
        height: updatedUser.height,
        weight: updatedUser.weight,
        activityLevel: updatedUser.activityLevel,
        dietType: updatedUser.dietType,
        primaryGoal: updatedUser.primaryGoal,
      },
    };
  }

  @Post('send-phone-otp')
  async sendPhoneOtp(@Body() sendPhoneOtpDto: SendPhoneOtpDto) {
    const result = await this.authService.sendPhoneOtp(sendPhoneOtpDto.phone);
    return {
      message: 'OTP sent successfully',
      data: result,
    };
  }

  @Post('verify-phone-otp')
  async verifyPhoneOtp(@Body() verifyPhoneOtpDto: VerifyPhoneOtpDto) {
    const result = await this.authService.verifyPhoneOtp(
      verifyPhoneOtpDto.phone,
      verifyPhoneOtpDto.token,
    );

    // Override Supabase's default "authenticated" role with "user"
    const user = result.data.user;
    if (user && user.role === 'authenticated') {
      user.role = 'user';
    }

    return {
      message: 'Phone verified successfully',
      user,
      accessToken: result.data.session?.access_token,
      refreshToken: result.data.session?.refresh_token,
    };
  }

  @Post('register-phone')
  async registerPhone(@Body() registerPhoneUserDto: RegisterPhoneUserDto) {
    const result =
      await this.authService.registerPhoneUser(registerPhoneUserDto);
    return {
      message: 'OTP sent successfully. Please verify with the code.',
      data: result,
    };
  }

  @Post('verify-phone-and-set-username')
  async verifyPhoneAndSetUsername(
    @Body() body: { phone: string; token: string; username: string },
  ) {
    const result = await this.authService.verifyPhoneOtpAndSetUsername(
      body.phone,
      body.token,
      body.username,
    );

    // Override Supabase's default "authenticated" role with "user"
    const user = result.data.user;
    if (user && user.role === 'authenticated') {
      user.role = 'user';
    }

    return {
      message: 'Phone verified and username set successfully',
      user,
      accessToken: result.data.session?.access_token,
      refreshToken: result.data.session?.refresh_token,
    };
  }

  @Post('resend-verification-email')
  async resendVerificationEmail(@Body() body: { email: string }) {
    const result = await this.authService.resendVerificationEmail(body.email);
    return {
      message: 'Verification email sent successfully. Please check your inbox.',
      data: result,
    };
  }

  @Post('refresh-token')
  async refreshToken(@Body() body: { refreshToken: string }) {
    const result = await this.authService.refreshToken(body.refreshToken);
    return result;
  }

  @Post('exchange-supabase-token')
  async exchangeSupabaseToken(@Body() body: { accessToken: string }) {
    const user = await this.authService.verifyToken(body.accessToken);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (!user.email_confirmed_at) {
      throw new UnauthorizedException('Email not verified');
    }

    if (!user.email) {
      throw new UnauthorizedException('Email not found in user data');
    }

    const dbUser = await this.userService.findByEmail(user.email);
    const role = dbUser?.role || Role.User;

    return {
      message: 'Token exchanged successfully',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        username: user.user_metadata?.username,
        role,
        profileCompleted: dbUser?.profileCompleted || false,
        age: dbUser?.age,
        sex: dbUser?.sex,
        height: dbUser?.height,
        weight: dbUser?.weight,
        activityLevel: dbUser?.activityLevel,
        dietType: dbUser?.dietType,
        primaryGoal: dbUser?.primaryGoal,
      },
      accessToken: body.accessToken,
      refreshToken: null,
    };
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    const result = await this.authService.logout();
    return {
      message: 'Logged out successfully',
      ...result,
    };
  }
}
