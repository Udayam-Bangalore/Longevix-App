import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async createUser(registerData: Partial<User>): Promise<User> {
    try {
      // Validate input data
      if (!registerData || (!registerData.email && !registerData.username)) {
        throw new BadRequestException('Email or username is required');
      }

      // Normalize phone number if provided
      if (registerData.phone) {
        registerData.phone = this.normalizePhoneNumber(registerData.phone);
      }

      // Create user
      const user = this.userRepository.create(registerData);

      return await this.userRepository.save(user);
    } catch (err) {
      // Log the error for debugging
      const error = err as Error;
      this.logger.error(
        `Error creating user: ${error.message}`,
        error.stack,
        'createUser',
      );

      // Handle PostgreSQL unique constraint violation
      if (err instanceof QueryFailedError && err.driverError.code === '23505') {
        // Check which unique constraint is violated
        if (registerData.email) {
          const existingEmailUser = await this.findByEmail(registerData.email);
          if (existingEmailUser) {
            throw new ConflictException(
              'A user with this email already exists',
            );
          }
        }
        if (registerData.phone) {
          const existingPhoneUser = await this.findByPhone(registerData.phone);
          if (existingPhoneUser) {
            throw new ConflictException(
              'A user with this phone number already exists',
            );
          }
        }
        // Fallback message if we can't determine which field caused the conflict
        throw new ConflictException(
          'A user with this email or phone number already exists',
        );
      }

      // Handle NestJS HTTP exceptions (re-throw as-is)
      if ('status' in error && 'response' in error) {
        throw err;
      }

      // Catch-all for unexpected errors
      this.logger.error(
        `Unexpected error in createUser: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'An unexpected error occurred while creating the user',
      );
    }
  }

  /**
   * Find user by email with error handling
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      if (!email) {
        return null;
      }

      return await this.userRepository.findOne({ where: { email } });
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `Error finding user by email: ${error.message}`,
        error.stack,
      );

      if ('status' in error && 'response' in error) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Error retrieving user information',
      );
    }
  }

  /**
   * Find user by ID with error handling
   */
  async findById(id: string): Promise<User | null> {
    try {
      if (!id) {
        throw new BadRequestException('User ID is required');
      }

      return await this.userRepository.findOne({ where: { id } });
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `Error finding user by ID: ${error.message}`,
        error.stack,
      );

      if ('status' in error && 'response' in error) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Error retrieving user information',
      );
    }
  }

  /**
   * Normalize phone number to include country code prefix
   * Removes any non-digit characters and ensures it starts with +
   */
  private normalizePhoneNumber(phone: string): string {
    if (!phone) {
      return '';
    }
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/[^0-9]/g, '');
    // If number starts with 91 (India country code) without +, add it
    if (digitsOnly.startsWith('91')) {
      return `+${digitsOnly}`;
    }
    // If number doesn't have any country code, assume India (+91)
    if (digitsOnly.length === 10) {
      return `+91${digitsOnly}`;
    }
    // If number already has + prefix, return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    // Default to adding + prefix
    return `+${digitsOnly}`;
  }

  async findByPhone(phone: string): Promise<User | null> {
    try {
      if (!phone) {
        throw new BadRequestException('Phone number is required');
      }

      const normalizedPhone = this.normalizePhoneNumber(phone);
      return await this.userRepository.findOne({
        where: { phone: normalizedPhone },
      });
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `Error finding user by phone: ${error.message}`,
        error.stack,
      );

      if ('status' in error && 'response' in error) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Error retrieving user information',
      );
    }
  }

  async getUserById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new Error('User not found');
    }

    // Normalize phone number if provided
    if (updateData.phone) {
      updateData.phone = this.normalizePhoneNumber(updateData.phone);
    }

    Object.assign(user, updateData);
    return await this.userRepository.save(user);
  }
}
