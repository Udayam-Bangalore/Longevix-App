import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
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
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  async register(@Body() registerUserDto: RegisterDto) {
    const result = await this.authService.registerUser(registerUserDto);
    return {
      message: 'User registered successfully. Please check your email to verify your account.',
      user: result.data.user,
      // Do not return access token - user must verify email first
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.loginUser(loginDto);
    
    // Override Supabase's default "authenticated" role with "user" for non-admin/non-pro-user accounts
    const user = result.data.user;
    if (user && user.role === 'authenticated') {
      user.role = 'user';
    }
    
    return {
      message: 'User logged in successfully',
      user,
      accessToken: result.data.session?.access_token,
    };
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    // Try to find user by email (for email-based users), phone (for phone-based users), or by ID
    let user = await this.userService.findByEmail(req.user?.email);
    
    if (!user && req.user?.phone) {
      user = await this.userService.findByPhone(req.user.phone);
    }
    
    if (!user && req.user?.id) {
      user = await this.userService.findById(req.user.id);
    }

    // If user still not found, create a new user entity (for phone-based users without existing record)
    if (!user) {
      user = await this.userService.createUser({
        id: req.user.id,
        username: req.user?.user_metadata?.username,
        email: req.user?.email,
        phone: req.user?.phone,
      });
    }

    return {
      id: req.user?.id,
      email: req.user?.email,
      phone: user?.phone || req.user?.phone,
      username: req.user?.user_metadata?.username,
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
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    // Try to find user by email (for email-based users), phone (for phone-based users), or by ID
    let user = await this.userService.findByEmail(req.user?.email);
    
    if (!user && req.user?.phone) {
      user = await this.userService.findByPhone(req.user.phone);
    }
    
    if (!user && req.user?.id) {
      user = await this.userService.findById(req.user.id);
    }

    // If user still not found, create a new user entity (for phone-based users without existing record)
    if (!user) {
      user = await this.userService.createUser({
        id: req.user.id,
        username: req.user?.user_metadata?.username,
        email: req.user?.email,
        phone: req.user?.phone,
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
    };
  }

  @Post('register-phone')
  async registerPhone(@Body() registerPhoneUserDto: RegisterPhoneUserDto) {
    const result = await this.authService.registerPhoneUser(registerPhoneUserDto);
    return {
      message: 'OTP sent successfully. Please verify with the code.',
      data: result,
    };
  }

  @Post('verify-phone-and-set-username')
  async verifyPhoneAndSetUsername(@Body() body: { phone: string; token: string; username: string }) {
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
}
